/**
 * Eleventy configuration: Event handlers
 * 
 * Called from `.eleventy.js` during Eleventy initialization.
 * Registers event handlers for build lifecycle events (before, after, beforeBuild, beforeWatch).
 * Handles progress indicators, redirect generation, and incremental OG image generation.
 */

const path = require('path');
const fs = require('fs');
const { SPINNER_FRAMES } = require('../../scripts/utils/spinner-utils');

/**
 * Configures Eleventy event handlers.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 */
function configureEvents(eleventyConfig) {
  // Check if we're in quiet mode (via command line args or config)
  const isQuiet = process.argv.includes('--quiet') || process.env.ELEVENTY_QUIET === 'true';
  let buildStartTime;
  let spinnerInterval;

  let spinnerIndex = 0;

  // Helper to clean up spinner
  function cleanupSpinner() {
    if (spinnerInterval) {
      clearInterval(spinnerInterval);
      spinnerInterval = null;
      // Clear the spinner line
      process.stdout.write('\r' + ' '.repeat(20) + '\r');
    }
  }

  // Clean up spinner on process exit or error
  process.on('exit', cleanupSpinner);
  process.on('SIGINT', () => {
    cleanupSpinner();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cleanupSpinner();
    process.exit(0);
  });

  // Minimal progress indicator at build start
  eleventyConfig.on("eleventy.before", () => {
    if (isQuiet) {
      buildStartTime = Date.now();
      process.stdout.write('Building... ');
      
      // Start spinner animation
      spinnerInterval = setInterval(() => {
        spinnerIndex = (spinnerIndex + 1) % SPINNER_FRAMES.length;
        process.stdout.write(`\rBuilding... ${SPINNER_FRAMES[spinnerIndex]}`);
      }, 100);
    }
  });

  // Minimal progress indicator at build end
  eleventyConfig.on("eleventy.after", ({ results }) => {
    if (isQuiet && buildStartTime) {
      cleanupSpinner();
      
      const duration = ((Date.now() - buildStartTime) / 1000).toFixed(1);
      const fileCount = results ? results.length : 0;
      console.log(`✓ Built ${fileCount} file${fileCount !== 1 ? 's' : ''} in ${duration}s`);
    }
  });

  // Generate redirect rules before build
  eleventyConfig.on("eleventy.beforeBuild", () => {
    try {
      const { generateRedirects } = require('../../scripts/utils/generate-redirects');
      generateRedirects();
    } catch (error) {
      console.error('⚠️  Failed to generate redirects:', error.message);
      // Don't fail the build if redirect generation fails
    }
  });

  // Incremental OG image generation on file changes during dev
  eleventyConfig.on("eleventy.beforeWatch", async (changedFiles) => {
    // Only process markdown and njk files that are posts or pages
    const relevantFiles = changedFiles
      .map(file => {
        // Handle both relative and absolute paths
        if (path.isAbsolute(file)) {
          return file;
        }
        return path.join(process.cwd(), file);
      })
      .filter(file => {
        const isPost = file.includes('_posts/') && (file.endsWith('.md') || file.endsWith('.njk'));
        const isPage = file.includes('src/') && !file.includes('_posts/') && !file.includes('_includes/') && !file.includes('_data/') && !file.includes('assets/') && (file.endsWith('.md') || file.endsWith('.njk'));
        const isPortfolioPage = file.endsWith('portfolio.njk') || file.endsWith('portfolio.md');
        return (isPost || isPage || isPortfolioPage);
      })
      .filter(file => {
        // Only process files that actually exist
        return fs.existsSync(file);
      });

    if (relevantFiles.length > 0) {
      const { processFile } = require('../../scripts/content/generate-og-images.js');
      for (const file of relevantFiles) {
        try {
          await processFile(file);
        } catch (error) {
          // Silently fail during watch - don't break dev server
          console.error(`⚠️  Failed to generate OG image for ${file}: ${error.message}`);
        }
      }
    }
  });
}

module.exports = configureEvents;

