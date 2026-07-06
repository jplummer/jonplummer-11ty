#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const nunjucks = require('nunjucks');
const { DateTime } = require('luxon');
const { findMarkdownFiles, findFilesByExtension } = require('../utils/file-utils');
const { parseFrontMatter, reconstructFile } = require('../utils/frontmatter-utils');
const { isPost } = require('../utils/content-utils');
const { extractCssCustomProperties, extractProductionFontFacesForInline, extractLightThemeColorOverrides } = require('../../eleventy/utils/css-utils');
const { generateOgImageFilename } = require('../utils/og-image-filename');

// Configure Nunjucks environment
const nunjucksEnv = new nunjucks.Environment(
  new nunjucks.FileSystemLoader([
    path.join(process.cwd(), 'src', '_includes'),
    path.join(process.cwd(), 'src')
  ])
);

// Add postDate filter (from Eleventy config)
nunjucksEnv.addFilter('postDate', (dateObj) => {
  const date = dateObj instanceof Date ? dateObj : new Date(dateObj);
  return DateTime.fromJSDate(date).toLocaleString(DateTime.DATE_MED);
});



// Front matter parsing and reconstruction now use shared utilities

// Generate hash of source data for incremental generation
function generateDataHash(pageData) {
  const dataString = JSON.stringify({
    title: pageData.title,
    description: pageData.description,
    date: pageData.date
  });
  return Buffer.from(dataString).toString('base64').substring(0, 16);
}

const OG_SHARED_DEPS = [
  path.join(process.cwd(), 'src', '_includes', 'og-image.njk'),
  path.join(process.cwd(), 'src', '_includes', 'og-image-body.njk'),
  path.join(process.cwd(), 'src', 'assets', 'css', 'jonplummer.css'),
  path.join(process.cwd(), 'src', 'assets', 'css', 'fonts.css'),
  path.join(process.cwd(), 'eleventy', 'utils', 'css-utils.js')
];

function sharedOgDepsNewerThan(ogImageStat) {
  return OG_SHARED_DEPS.some((depPath) => {
    if (!fs.existsSync(depPath)) {
      return false;
    }
    return fs.statSync(depPath).mtime > ogImageStat.mtime;
  });
}

// Check if OG image needs regeneration
function needsRegeneration(ogImagePath, pageData, filePath) {
  // If OG image doesn't exist, need to generate
  if (!fs.existsSync(ogImagePath)) {
    return true;
  }
  
  // Check if source data has changed by comparing file modification times
  const ogImageStat = fs.statSync(ogImagePath);
  const sourceFileStat = fs.statSync(filePath);
  
  // If source file is newer than OG image, regenerate
  if (sourceFileStat.mtime > ogImageStat.mtime) {
    return true;
  }

  // Template, shared partial, site CSS, or font/CSS utils changed
  if (sharedOgDepsNewerThan(ogImageStat)) {
    return true;
  }
  
  // Also check if frontmatter has ogImage but it doesn't match expected path
  if (pageData.ogImage && pageData.ogImage !== 'auto') {
    const expectedPath = `/assets/images/og/${generateOgImageFilename(pageData, filePath)}`;
    if (pageData.ogImage !== expectedPath) {
      return true;
    }
  }
  
  return false;
}

// Render OG image HTML
async function renderOgImageHtml(pageData) {
  const templatePath = path.join(process.cwd(), 'src', '_includes', 'og-image.njk');
  const template = fs.readFileSync(templatePath, 'utf8');
  
  // Pass date object - template will format it using postDate filter
  const dateObj = pageData.date ? (pageData.date instanceof Date ? pageData.date : new Date(pageData.date)) : null;
  
  // Extract CSS custom properties from main stylesheet
  const cssCustomProperties = extractCssCustomProperties();
  const productionFontFaces = extractProductionFontFacesForInline();
  const lightThemeColorOverrides = extractLightThemeColorOverrides();

  return nunjucksEnv.renderString(template, {
    title: pageData.title,
    description: pageData.description || null,
    date: dateObj,
    cssCustomProperties: cssCustomProperties,
    productionFontFaces: productionFontFaces,
    lightThemeColorOverrides: lightThemeColorOverrides
  });
}

// Generate OG image using Puppeteer
async function generateOgImage(html, outputPath) {
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const browser = await puppeteer.launch(launchOptions);
  
  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 1
    });
    
    await page.setContent(html, {
      waitUntil: 'domcontentloaded'
    });

    const fontsReady = await page.evaluate(async () => {
      await document.fonts.ready;
      return {
        display: document.fonts.check('600 3.5rem "Big Shoulders"'),
        body: document.fonts.check('1.5rem "Public Sans"')
      };
    });

    if (!fontsReady.display || !fontsReady.body) {
      throw new Error(
        `OG webfonts not loaded (Big Shoulders: ${fontsReady.display}, Public Sans: ${fontsReady.body})`
      );
    }
    
    await page.screenshot({
      path: outputPath,
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 1200,
        height: 630
      }
    });
  } finally {
    await browser.close();
  }
}

// Process a single file
async function processFile(filePath, options = {}) {
  const { force = false } = options;
  const content = fs.readFileSync(filePath, 'utf8');
  const { frontMatter, content: body, error } = parseFrontMatter(content);
  
  if (error) {
    return { updated: false, error: `Frontmatter parse error: ${error}` };
  }
  
  if (!frontMatter) {
    return { updated: false, skipped: true, reason: 'No frontmatter' };
  }
  
  // Skip if it's a portfolio item (not the portfolio page itself)
  if (frontMatter.tags && frontMatter.tags.includes('portfolio') && 
      !filePath.endsWith('portfolio.njk') && 
      !filePath.endsWith('portfolio.md')) {
    return { updated: false, skipped: true, reason: 'Portfolio item (skipping)' };
  }
  
  // Determine if this is a post or page
  const isPage = frontMatter.tags && frontMatter.tags.includes('page');
  const isPortfolioPage = filePath.endsWith('portfolio.njk') || filePath.endsWith('portfolio.md');
  
  // Only process posts, pages, and portfolio page
  if (!isPost(frontMatter) && !isPage && !isPortfolioPage) {
    return { updated: false, skipped: true, reason: 'Not a post or page' };
  }

  // One template file emits many URLs; filename would be wrong — use shared ogImage (e.g. index.png)
  if (frontMatter.pagination) {
    return { updated: false, skipped: true, reason: 'Pagination template (skipped)' };
  }
  
  // Generate OG image filename
  const ogImageFilename = generateOgImageFilename(frontMatter, filePath);
  const ogImageDir = path.join(process.cwd(), 'src', 'assets', 'images', 'og');
  const ogImagePath = path.join(ogImageDir, ogImageFilename);
  const ogImageUrl = `/assets/images/og/${ogImageFilename}`;
  
  // True only when front matter had no ogImage key (not `auto`, not a manual path)
  const hadMissingOgImageKey = !frontMatter.ogImage;
  
  // Skip if manually set ogImage exists AND image file exists (only skip if both are true)
  // If force is true, regenerate everything regardless
  // If ogImage is set but file doesn't exist, we need to generate it
  if (!force && frontMatter.ogImage && frontMatter.ogImage !== 'auto') {
    // Check if the file actually exists - if not, we need to generate it
    if (fs.existsSync(ogImagePath)) {
      return { updated: false, skipped: true, reason: 'Manual ogImage set and file exists' };
    }
    // File doesn't exist, so we'll generate it below
  }
  
  // Ensure og directory exists
  if (!fs.existsSync(ogImageDir)) {
    fs.mkdirSync(ogImageDir, { recursive: true });
  }
  
  // Check if regeneration is needed (force if image doesn't exist or force flag is set)
  if (!force && !needsRegeneration(ogImagePath, frontMatter, filePath) && fs.existsSync(ogImagePath)) {
    // Still update frontmatter if ogImage is missing
    if (!frontMatter.ogImage) {
      frontMatter.ogImage = ogImageUrl;
      const newContent = reconstructFile(content, frontMatter, body);
      fs.writeFileSync(filePath, newContent, 'utf8');
      return {
        updated: true,
        imageGenerated: false,
        frontmatterUpdated: true,
        frontmatterOgImageSynced: hadMissingOgImageKey,
        filePath: filePath
      };
    }
    return { updated: false, skipped: true, reason: 'OG image up to date', filePath: filePath };
  }
  
  // Render HTML
  const html = await renderOgImageHtml(frontMatter);
  
  // Generate image
  await generateOgImage(html, ogImagePath);
  
  // Update frontmatter only when ogImage path changes (avoids dev watch full rebuilds on PNG-only regen)
  const needsFrontmatterWrite =
    !frontMatter.ogImage || frontMatter.ogImage !== ogImageUrl;

  if (needsFrontmatterWrite) {
    frontMatter.ogImage = ogImageUrl;
    const newContent = reconstructFile(content, frontMatter, body);
    fs.writeFileSync(filePath, newContent, 'utf8');
  }
  
  return {
    updated: true,
    imageGenerated: true,
    frontmatterUpdated: needsFrontmatterWrite,
    frontmatterOgImageSynced: false,
    filePath: filePath
  };
}

// Main function - can be called programmatically or from CLI
async function generateOgImages(options = {}) {
  const { quiet = false, force = false } = options;
  
  // Don't print header in quiet mode - caller will announce it
  
  const srcDir = path.join(process.cwd(), 'src');
  const postsDir = path.join(srcDir, '_posts');
  
  // Find all markdown files in posts directory, excluding drafts
  const allPostFiles = findMarkdownFiles(postsDir);
  const postFiles = allPostFiles.filter(f => {
    const content = fs.readFileSync(f, 'utf8');
    const { frontMatter } = parseFrontMatter(content);
    // Exclude files with draft: true in frontmatter
    return !(frontMatter && frontMatter.draft === true);
  });
  
  // Find markdown and njk files in src root (excluding _posts, _includes, _data, assets, and drafts)
  const allRootFiles = findMarkdownFiles(srcDir).filter(f => 
    !f.includes('_posts') && 
    !f.includes('_includes') &&
    !f.includes('_data') &&
    !f.includes('assets')
  );
  const rootFiles = allRootFiles.filter(f => {
    const content = fs.readFileSync(f, 'utf8');
    const { frontMatter } = parseFrontMatter(content);
    // Exclude files with draft: true in frontmatter
    return !(frontMatter && frontMatter.draft === true);
  });
  
  // All .njk templates under src/ (e.g. src/wisdom/index.njk), excluding special dirs
  const allNjkFiles = findFilesByExtension(srcDir, ['.njk']).filter(f =>
    !f.includes('_posts') &&
    !f.includes('_includes') &&
    !f.includes('_data') &&
    !f.includes('assets')
  );
  const njkFiles = allNjkFiles.filter(f => {
    const content = fs.readFileSync(f, 'utf8');
    const { frontMatter } = parseFrontMatter(content);
    // Exclude files with draft: true in frontmatter
    return !(frontMatter && frontMatter.draft === true);
  });
  
  const markdownFiles = [...postFiles, ...rootFiles, ...njkFiles];
  
  const results = {
    updated: 0,
    skipped: 0,
    errors: 0,
    imagesGenerated: 0,
    frontmatterOnlyUpdates: 0,
    frontmatterOgImageSynced: 0,
    generatedFiles: [],
    frontmatterOgImageSyncedFiles: []
  };
  
  for (const file of markdownFiles) {
    const relativePath = path.relative(process.cwd(), file);
    
    if (!quiet) {
      console.log(`Processing: ${relativePath}`);
    }
    
    try {
      const result = await processFile(file, { force });
      
      if (result.updated) {
        if (result.imageGenerated) {
          if (!quiet) {
            console.log(`  ✅ Generated OG image and updated frontmatter`);
          } else {
            // In quiet mode, only show important events
            console.log(`  ✅ Generated: ${relativePath}`);
          }
          results.imagesGenerated++;
          results.generatedFiles.push(relativePath);
        } else if (result.frontmatterUpdated) {
          if (!quiet) {
            console.log(`  ✅ Updated frontmatter (image already exists)`);
          }
          results.frontmatterOnlyUpdates++;
          if (result.frontmatterOgImageSynced) {
            results.frontmatterOgImageSynced++;
            results.frontmatterOgImageSyncedFiles.push(relativePath);
          }
        }
        results.updated++;
      } else if (result.skipped) {
        if (!quiet) {
          console.log(`  ⏭️  Skipped: ${result.reason}`);
        }
        results.skipped++;
      } else if (result.error) {
        console.error(`  ❌ Error: ${result.error}`);
        results.errors++;
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      results.errors++;
    }
  }
  
  const filesChecked = markdownFiles.length;

  if (quiet) {
    if (results.frontmatterOgImageSyncedFiles.length > 0) {
      results.frontmatterOgImageSyncedFiles.forEach((file) => {
        console.log(`  ℹ️  Filled in ogImage in front matter (PNG already existed): ${file}`);
      });
    }
  } else {
    console.log('\n📊 Summary:');
    console.log(`   Images generated: ${results.imagesGenerated}`);
    console.log(`   Frontmatter only (ogImage added, PNG existed): ${results.frontmatterOnlyUpdates}`);
    console.log(`   Total updated: ${results.updated}`);
    console.log(`   Skipped: ${results.skipped}`);
    console.log(`   Errors: ${results.errors}`);
  }
  
  if (results.errors > 0) {
    if (quiet) {
      process.exit(1);
    } else {
      process.exit(1);
    }
  }
  
  // Return result object for programmatic use
  return {
    frontmatterUpdated: results.updated > 0,
    filesUpdated: results.updated,
    imagesGenerated: results.imagesGenerated,
    frontmatterOgImageSynced: results.frontmatterOgImageSynced,
    filesChecked: filesChecked,
    errors: results.errors,
    generatedFiles: results.generatedFiles,
    frontmatterOgImageSyncedFiles: results.frontmatterOgImageSyncedFiles
  };
}

// CLI entry point
async function main() {
  const force = process.argv.includes('--force');
  const quiet = process.argv.includes('--quiet');
  await generateOgImages({ quiet, force });
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { generateOgImages, processFile, generateOgImage, renderOgImageHtml };

