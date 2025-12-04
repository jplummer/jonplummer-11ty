const path = require('path');
const fs = require('fs');

/**
 * Configures Eleventy event handlers.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 */
function configureEvents(eleventyConfig) {
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

