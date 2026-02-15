/**
 * Eleventy configuration: Shortcode registration
 * 
 * Called from `.eleventy.js` during Eleventy initialization.
 * Registers all custom shortcodes available in Nunjucks templates (e.g., year, portraitGrid).
 * 
 * Note: OG image preview rendering uses Eleventy's native RenderPlugin (renderFile shortcode)
 * instead of a custom shortcode. See og-image-preview.njk and og-image-body.njk.
 */

/**
 * Registers all Eleventy shortcodes.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 */
function configureShortcodes(eleventyConfig) {
  // Add custom Nunjucks shortcode: year
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  // Paired shortcode for portrait-grid layout (multi-column image gallery)
  // Content inside is processed as markdown automatically by Eleventy
  eleventyConfig.addPairedShortcode("portraitGrid", function(content) {
    return `<div class="portrait-grid">\n${content}\n</div>`;
  });
}

module.exports = configureShortcodes;

