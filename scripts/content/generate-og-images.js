#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const nunjucks = require('nunjucks');
const { DateTime } = require('luxon');
const { findMarkdownFiles } = require('../utils/file-utils');
const { parseFrontMatter, reconstructFile } = require('../utils/frontmatter-utils');

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

// Extract CSS custom properties from main stylesheet
function extractCssCustomProperties() {
  const cssPath = path.join(process.cwd(), 'src', 'assets', 'css', 'jonplummer.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  // Extract :root block - match from :root to closing brace
  // Use a more robust regex that handles nested braces in comments
  const rootStart = cssContent.indexOf(':root');
  if (rootStart === -1) {
    throw new Error('Could not find :root block in CSS file');
  }
  
  // Find the opening brace after :root
  let braceStart = cssContent.indexOf('{', rootStart);
  if (braceStart === -1) {
    throw new Error('Could not find opening brace for :root block');
  }
  
  // Find matching closing brace by counting braces
  let braceCount = 0;
  let braceEnd = braceStart;
  for (let i = braceStart; i < cssContent.length; i++) {
    if (cssContent[i] === '{') {
      braceCount++;
    } else if (cssContent[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        braceEnd = i;
        break;
      }
    }
  }
  
  if (braceCount !== 0) {
    throw new Error('Could not find matching closing brace for :root block');
  }
  
  // Extract the :root block including the selector and braces
  return cssContent.substring(rootStart, braceEnd + 1);
}

// Front matter parsing and reconstruction now use shared utilities

// Generate filename for OG image based on page URL or slug
function generateOgImageFilename(pageData, filePath) {
  // For posts, use the date-based path structure
  if (pageData.tags && pageData.tags.includes('post') && pageData.date) {
    const date = new Date(pageData.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    // Extract slug from filename (remove date prefix if present)
    let slug = path.basename(filePath, path.extname(filePath));
    // Remove date prefix if filename starts with YYYY-MM-DD-
    const datePrefix = `${year}-${month}-${day}-`;
    if (slug.startsWith(datePrefix)) {
      slug = slug.substring(datePrefix.length);
    }
    return `${year}-${month}-${day}-${slug}.png`;
  }
  
  // For pages, use the permalink or filename
  if (pageData.permalink) {
    const slug = pageData.permalink.replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '-') || 'index';
    return `${slug}.png`;
  }
  
  // Fallback to filename
  const slug = path.basename(filePath, path.extname(filePath));
  return `${slug}.png`;
}

// Generate hash of source data for incremental generation
function generateDataHash(pageData) {
  const dataString = JSON.stringify({
    title: pageData.title,
    description: pageData.description,
    date: pageData.date
  });
  return Buffer.from(dataString).toString('base64').substring(0, 16);
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
  
  // Also check if frontmatter has ogImage but it doesn't match expected path
  if (pageData.ogImage) {
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
  
  return nunjucksEnv.renderString(template, {
    title: pageData.title,
    description: pageData.description || null,
    date: dateObj,
    cssCustomProperties: cssCustomProperties
  });
}

// Generate OG image using Puppeteer
async function generateOgImage(html, outputPath) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 1
    });
    
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });
    
    // Wait a bit for fonts to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
async function processFile(filePath) {
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
  const isPost = frontMatter.tags && frontMatter.tags.includes('post');
  const isPage = frontMatter.tags && frontMatter.tags.includes('page');
  const isPortfolioPage = filePath.endsWith('portfolio.njk') || filePath.endsWith('portfolio.md');
  
  // Only process posts, pages, and portfolio page
  if (!isPost && !isPage && !isPortfolioPage) {
    return { updated: false, skipped: true, reason: 'Not a post or page' };
  }
  
  // Generate OG image filename
  const ogImageFilename = generateOgImageFilename(frontMatter, filePath);
  const ogImageDir = path.join(process.cwd(), 'src', 'assets', 'images', 'og');
  const ogImagePath = path.join(ogImageDir, ogImageFilename);
  const ogImageUrl = `/assets/images/og/${ogImageFilename}`;
  
  // Skip if manually set ogImage exists and image file exists (allow regeneration if file is missing)
  if (frontMatter.ogImage && frontMatter.ogImage !== 'auto' && fs.existsSync(ogImagePath)) {
    return { updated: false, skipped: true, reason: 'Manual ogImage set' };
  }
  
  // Ensure og directory exists
  if (!fs.existsSync(ogImageDir)) {
    fs.mkdirSync(ogImageDir, { recursive: true });
  }
  
  // Check if regeneration is needed (force if image doesn't exist)
  if (!needsRegeneration(ogImagePath, frontMatter, filePath) && fs.existsSync(ogImagePath)) {
    // Still update frontmatter if ogImage is missing
    if (!frontMatter.ogImage) {
      frontMatter.ogImage = ogImageUrl;
      const newContent = reconstructFile(content, frontMatter, body);
      fs.writeFileSync(filePath, newContent, 'utf8');
      return { updated: true, imageGenerated: false, frontmatterUpdated: true };
    }
    return { updated: false, skipped: true, reason: 'OG image up to date' };
  }
  
  // Render HTML
  const html = await renderOgImageHtml(frontMatter);
  
  // Generate image
  await generateOgImage(html, ogImagePath);
  
  // Update frontmatter
  frontMatter.ogImage = ogImageUrl;
  const newContent = reconstructFile(content, frontMatter, body);
  fs.writeFileSync(filePath, newContent, 'utf8');
  
  return { updated: true, imageGenerated: true, frontmatterUpdated: true };
}

// Main function
async function main() {
  console.log('🖼️  Generating OG images...\n');
  
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
  
  // Also find .njk files in src root, excluding drafts
  const allNjkFiles = fs.readdirSync(srcDir)
    .filter(f => f.endsWith('.njk'))
    .map(f => path.join(srcDir, f));
  const njkFiles = allNjkFiles.filter(f => {
    const content = fs.readFileSync(f, 'utf8');
    const { frontMatter } = parseFrontMatter(content);
    // Exclude files with draft: true in frontmatter
    return !(frontMatter && frontMatter.draft === true);
  });
  
  const markdownFiles = [...postFiles, ...rootFiles, ...njkFiles];
  
  console.log(`Found ${markdownFiles.length} files to process\n`);
  
  const results = {
    updated: 0,
    skipped: 0,
    errors: 0,
    imagesGenerated: 0,
    frontmatterUpdated: 0
  };
  
  for (const file of markdownFiles) {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`Processing: ${relativePath}`);
    
    try {
      const result = await processFile(file);
      
      if (result.updated) {
        if (result.imageGenerated) {
          console.log(`  ✅ Generated OG image and updated frontmatter`);
          results.imagesGenerated++;
        } else if (result.frontmatterUpdated) {
          console.log(`  ✅ Updated frontmatter (image already exists)`);
          results.frontmatterUpdated++;
        }
        results.updated++;
      } else if (result.skipped) {
        console.log(`  ⏭️  Skipped: ${result.reason}`);
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
  
  console.log('\n📊 Summary:');
  console.log(`   Images generated: ${results.imagesGenerated}`);
  console.log(`   Frontmatter updated: ${results.frontmatterUpdated}`);
  console.log(`   Total updated: ${results.updated}`);
  console.log(`   Skipped: ${results.skipped}`);
  console.log(`   Errors: ${results.errors}`);
  
  if (results.errors > 0) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { processFile, generateOgImage, renderOgImageHtml };

