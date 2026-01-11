/**
 * Eleventy configuration: Shortcode registration
 * 
 * Called from `.eleventy.js` during Eleventy initialization.
 * Registers all custom shortcodes available in Nunjucks templates (e.g., renderOgImage, year).
 */

const renderOgImage = require("../shortcodes/render-og-image");

/**
 * Registers all Eleventy shortcodes.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 */
function configureShortcodes(eleventyConfig) {
  // Shortcode to render og-image template and extract body content
  eleventyConfig.addAsyncShortcode("renderOgImage", renderOgImage);

  // Add custom Nunjucks shortcode: year
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  // Paired shortcode for portrait-grid layout (multi-column image gallery)
  // Content inside is processed as markdown automatically by Eleventy
  eleventyConfig.addPairedShortcode("portraitGrid", function(content) {
    return `<div class="portrait-grid">\n${content}\n</div>`;
  });
}

module.exports = configureShortcodes;

