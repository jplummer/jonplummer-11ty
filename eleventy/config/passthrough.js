/**
 * Eleventy configuration: Passthrough copy and watch targets
 * 
 * Called from `.eleventy.js` during Eleventy initialization.
 * Configures which files/directories should be copied directly to the output
 * without processing, and which should be watched for changes during development.
 */

const fs = require('fs');
const path = require('path');

/**
 * Configures passthrough copy and watch targets.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 */
function configurePassthrough(eleventyConfig) {
  // Copy static assets
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // Copy .htaccess file for security
  eleventyConfig.addPassthroughCopy({ "src/.htaccess": ".htaccess" });

  // Copy favicon.ico to root (required for legacy browsers and RSS readers)
  eleventyConfig.addPassthroughCopy({ "src/favicon.ico": "favicon.ico" });

  // Copy IndexNow key file(s) from src/ root to site root
  // This allows IndexNow verification via key file at domain root
  eleventyConfig.addPassthroughCopy({ "src/*.txt": "." });

  // Copy standalone HTML files (like add-link.html) without processing
  eleventyConfig.addPassthroughCopy({ "src/add-link.html": "add-link.html" });

  // Watch for changes in assets
  eleventyConfig.addWatchTarget("src/assets");

  // In serve mode: enable passthrough behavior and clean assets folder
  // This avoids duplicating ~104MB of assets during development
  if (process.env.ELEVENTY_RUN_MODE === "serve") {
    // Enable passthrough copy emulation (serves files directly from src/assets)
    eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

    // Clean _site/assets/ if it exists (from previous production build)
    // This reclaims disk space automatically when switching to dev mode
    const assetsOutputPath = path.join(process.cwd(), "_site", "assets");
    if (fs.existsSync(assetsOutputPath)) {
      try {
        fs.rmSync(assetsOutputPath, { recursive: true, force: true });
      } catch (error) {
        // Silently fail if cleanup doesn't work (e.g., permissions issue)
        // The passthrough mode will still work correctly
      }
    }
  }
}

module.exports = configurePassthrough;

