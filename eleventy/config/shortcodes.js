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
}

module.exports = configureShortcodes;

