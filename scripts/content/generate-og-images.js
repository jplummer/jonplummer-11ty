#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const nunjucks = require('nunjucks');
const { findMarkdownFiles, findFilesByExtension } = require('../utils/file-utils');
const { parseFrontMatter, reconstructFile } = require('../utils/frontmatter-utils');
const { extractCssCustomProperties, extractProductionFontFacesForInline } = require('../../eleventy/utils/css-utils');
const { formatPostDate } = require('../../eleventy/utils/date-utils');
const {
  OG_DEFAULT_IMAGE_FILENAME,
  generateOgImageFilename,
  ogImageDiskDir,
  ogImageUrl,
} = require('../utils/og-image-filename');
const { ogCardKind, ogCardLabel } = require('../utils/og-card');
const {
  computeOgSharedFingerprint,
  defaultFingerprintPath,
  readStoredFingerprint,
  writeStoredFingerprint,
} = require('../utils/og-shared-fingerprint');

// Configure Nunjucks environment
const nunjucksEnv = new nunjucks.Environment(
  new nunjucks.FileSystemLoader([
    path.join(process.cwd(), 'src', '_includes'),
    path.join(process.cwd(), 'src')
  ])
);

// Same postDate filter as Eleventy (America/Los_Angeles calendar day)
nunjucksEnv.addFilter('postDate', formatPostDate);



// Front matter parsing and reconstruction now use shared utilities

// Per-image check only. Changes to what every image shares (tokens, fonts,
// templates, render code) are caught once per run by the shared fingerprint
// in generateOgImages(), which forces a full regeneration.
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
  if (pageData.ogImage && pageData.ogImage !== 'auto') {
    const expectedPath = ogImageUrl(generateOgImageFilename(pageData, filePath));
    if (pageData.ogImage !== expectedPath) {
      return true;
    }
  }
  
  return false;
}

// Render the card document for one image.
// card: { title, label?, labelIsPath? } – see og-image-body.njk
async function renderOgImageHtml(card) {
  const templatePath = path.join(process.cwd(), 'src', '_includes', 'og-image.njk');
  const template = fs.readFileSync(templatePath, 'utf8');

  const ogCardCss = fs.readFileSync(
    path.join(process.cwd(), 'src', 'assets', 'css', 'og-card.css'),
    'utf8'
  );
  const ogFitScript = fs.readFileSync(
    path.join(process.cwd(), 'src', 'assets', 'js', 'og-card-fit.js'),
    'utf8'
  );

  return nunjucksEnv.renderString(template, {
    title: card.title,
    label: card.label || null,
    labelIsPath: Boolean(card.labelIsPath),
    cssCustomProperties: extractCssCustomProperties(),
    // The site's faces are font-display: optional – if a face isn't ready in
    // ~100ms, Chrome keeps the fallback for the life of the page, and
    // document.fonts.check() still passes. Half of a full run came out in
    // the fallback before this. A screenshot can wait.
    productionFontFaces: extractProductionFontFacesForInline().replace(
      /font-display:\s*[a-z-]+/g,
      'font-display: block'
    ),
    ogCardCss,
    ogFitScript,
    site: require('../../src/_data/site.js')()
  });
}

function launchBrowser() {
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  return puppeteer.launch(launchOptions);
}

// Screenshot one card. Pass a browser to reuse it across a run; without one,
// a browser is launched and closed for this image (dev watch does that).
async function generateOgImage(html, outputPath, sharedBrowser = null) {
  const browser = sharedBrowser || (await launchBrowser());
  const page = await browser.newPage();

  try {
    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 1
    });

    await page.setContent(html, {
      waitUntil: 'load'
    });

    // og-card-fit.js waits for fonts, fits the title, then sets data-og-fit
    await page.waitForFunction(() => document.documentElement.dataset.ogFit === 'done', {
      timeout: 15000
    });

    // document.fonts.check() passes even when the page is stuck on the
    // fallback, so measure instead: each card font must set a sample
    // differently from the generic family it falls back to.
    const fallbackFonts = await page.evaluate(() => {
      const probe = (font) => {
        const s = document.createElement('span');
        s.textContent = 'Jon Plummer makes ideas tangible';
        s.style.cssText = `font: ${font}; white-space: nowrap; position: absolute; visibility: hidden;`;
        document.body.append(s);
        const w = s.getBoundingClientRect().width;
        s.remove();
        return w;
      };
      return ['.og-title', '.og-label', '.og-byline']
        .map((sel) => document.querySelector(sel))
        .filter(Boolean)
        .filter((el) => {
          const cs = getComputedStyle(el);
          const generic = cs.fontFamily.split(',').pop().trim();
          return probe(`${cs.fontWeight} 100px ${cs.fontFamily}`) === probe(`${cs.fontWeight} 100px ${generic}`);
        })
        .map((el) => getComputedStyle(el).fontFamily);
    });

    if (fallbackFonts.length > 0) {
      throw new Error(`OG card rendered in a fallback font: ${fallbackFonts.join('; ')}`);
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
    // Deployed files must be world-readable
    fs.chmodSync(outputPath, 0o644);
  } finally {
    await page.close();
    if (!sharedBrowser) await browser.close();
  }
}

// Process a single file
async function processFile(filePath, options = {}) {
  const { force = false, browser = null } = options;
  const content = fs.readFileSync(filePath, 'utf8');
  const { frontMatter, content: body, error } = parseFrontMatter(content);
  
  if (error) {
    return { updated: false, error: `Frontmatter parse error: ${error}` };
  }
  
  if (!frontMatter) {
    return { updated: false, skipped: true, reason: 'No frontmatter' };
  }
  
  // Posts, portfolio pieces, side projects, and pages get a card of their own.
  // Paginated templates share the default card (see og-card.js).
  const kind = ogCardKind(frontMatter);
  if (!kind) {
    return {
      updated: false,
      skipped: true,
      reason: frontMatter.pagination ? 'Pagination template (shares the default card)' : 'Not a post, portfolio piece, side project, or page'
    };
  }

  // Generate OG image filename
  const ogImageFilename = generateOgImageFilename(frontMatter, filePath);
  const ogImageDir = ogImageDiskDir();
  const ogImagePath = path.join(ogImageDir, ogImageFilename);
  const ogImageUrlPath = ogImageUrl(ogImageFilename);
  
  // True only when front matter had no ogImage key (not `auto`, not a manual path)
  const hadMissingOgImageKey = !frontMatter.ogImage;
  
  // Skip only a genuine manual override: an ogImage pointing somewhere other than
  // the path we derive for this file. A value equal to ogImageUrlPath is one we wrote
  // ourselves on a previous run (see the frontmatter write below), so it must fall
  // through to needsRegeneration() or nothing would ever be refreshed after its
  // first generation. If force is true, regenerate regardless. If the override's
  // file doesn't exist, generate it below.
  const isManualOverride =
    frontMatter.ogImage && frontMatter.ogImage !== 'auto' && frontMatter.ogImage !== ogImageUrlPath;

  if (!force && isManualOverride) {
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
      frontMatter.ogImage = ogImageUrlPath;
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
  const label = ogCardLabel(frontMatter, filePath);
  const html = await renderOgImageHtml({
    title: frontMatter.title,
    label: label && label.text,
    labelIsPath: label && label.isPath
  });

  // Generate image
  // options.browser may be a shared browser or a function that returns one
  const sharedBrowser = typeof browser === 'function' ? await browser() : browser;
  await generateOgImage(html, ogImagePath, sharedBrowser);
  
  // Update frontmatter only when ogImage path changes (avoids dev watch full rebuilds on PNG-only regen)
  const needsFrontmatterWrite =
    !frontMatter.ogImage || frontMatter.ogImage !== ogImageUrlPath;

  if (needsFrontmatterWrite) {
    frontMatter.ogImage = ogImageUrlPath;
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

// The shared fallback card – home page, paginated indexes, wisdom tag pages,
// and base.njk's default. Those templates emit many URLs, so the card is
// rendered from site data rather than from one page's front matter.
async function generateDefaultCard({ force = false, browser = null } = {}) {
  const outputPath = path.join(ogImageDiskDir(), OG_DEFAULT_IMAGE_FILENAME);
  if (!force && fs.existsSync(outputPath)) return false;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const site = require('../../src/_data/site.js')();
  const html = await renderOgImageHtml({ title: site.tagline, label: '/', labelIsPath: true });
  await generateOgImage(html, outputPath, browser);
  return true;
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
  
  // Shared fingerprint: tokens, fonts, templates, mark, site data, render code.
  // Missing (first run, fresh machine): record it and keep the existing PNGs,
  // which were rendered from the inputs committed alongside them.
  const fingerprintPath = defaultFingerprintPath();
  const currentFingerprint = computeOgSharedFingerprint();
  const storedFingerprint = readStoredFingerprint(fingerprintPath);
  const sharedChanged = storedFingerprint !== null && storedFingerprint !== currentFingerprint;
  if (storedFingerprint === null) {
    console.log('  ℹ️  OG shared fingerprint recorded for the first time; existing images kept');
  } else if (sharedChanged) {
    console.log('  ℹ️  OG tokens, fonts, templates, or render code changed; regenerating all OG images');
  }

  // One browser for the whole run, launched only if something needs rendering
  let browser = null;
  const getBrowser = async () => {
    if (!browser) browser = await launchBrowser();
    return browser;
  };
  const runForce = force || sharedChanged;

  const defaultCardPath = path.join(ogImageDiskDir(), OG_DEFAULT_IMAGE_FILENAME);
  if (runForce || !fs.existsSync(defaultCardPath)) {
    try {
      await generateDefaultCard({ force: true, browser: await getBrowser() });
      console.log(`  ✅ Generated: default card (${OG_DEFAULT_IMAGE_FILENAME})`);
      results.imagesGenerated++;
      results.generatedFiles.push(OG_DEFAULT_IMAGE_FILENAME);
    } catch (error) {
      console.error(`  ❌ Error (default card): ${error.message}`);
      results.errors++;
    }
  }

  for (const file of markdownFiles) {
    const relativePath = path.relative(process.cwd(), file);

    if (!quiet) {
      console.log(`Processing: ${relativePath}`);
    }

    try {
      const result = await processFile(file, { force: runForce, browser: getBrowser });
      
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
  
  if (browser) await browser.close();

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
  
  // Only record the fingerprint after a clean run, so a partial failure
  // retries the full regeneration next time.
  if (results.errors === 0) {
    writeStoredFingerprint(fingerprintPath, currentFingerprint);
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

module.exports = { generateOgImages, generateDefaultCard, processFile, generateOgImage, renderOgImageHtml };

