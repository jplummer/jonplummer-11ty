/**
 * Eleventy configuration: Shortcode registration
 * 
 * Called from `.eleventy.js` during Eleventy initialization.
 * Registers all custom shortcodes available in Nunjucks templates (e.g., year, portraitGrid).
 * 
 * Note: OG image preview rendering uses Eleventy's native RenderPlugin (renderFile shortcode)
 * instead of a custom shortcode. See ogimages.njk and og-image-body.njk.
 */

const fs = require('fs');
const path = require('path');

/**
 * Registers all Eleventy shortcodes.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 */
function configureShortcodes(eleventyConfig) {
  // Add custom Nunjucks shortcode: year
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  // Font lab HTML fragment (written by `pnpm run font-gallery`; raw HTML, not parsed as Nunjucks)
  eleventyConfig.addShortcode('fontLabCard', () => {
    const fragmentPath = path.join(
      process.cwd(),
      'src',
      '_includes',
      'partials',
      'font-lab-card.fragment.html'
    );
    if (!fs.existsSync(fragmentPath)) {
      return '<p class="type-tool-missing">Font lab markup is missing. Run <code>pnpm run font-gallery</code> from the repo root, then rebuild.</p>';
    }
    return fs.readFileSync(fragmentPath, 'utf8');
  });

  // Color gallery HTML fragment (regenerated at each Eleventy build; raw HTML, not parsed as Nunjucks)
  eleventyConfig.addShortcode('colorGalleryEmbed', () => {
    const fragmentPath = path.join(
      process.cwd(),
      'src',
      '_includes',
      'partials',
      'color-gallery-embed-inner.html'
    );
    if (!fs.existsSync(fragmentPath)) {
      return '<p class="type-tool-missing">Color gallery markup is missing after build. Check the <code>eleventy.before</code> color gallery step in <code>eleventy/config/events.js</code>.</p>';
    }
    return fs.readFileSync(fragmentPath, 'utf8');
  });

  // Paired shortcode for portrait-grid layout (multi-column image gallery)
  // Content inside is processed as markdown automatically by Eleventy
  eleventyConfig.addPairedShortcode("portraitGrid", function(content) {
    return `<div class="portrait-grid">\n${content}\n</div>`;
  });
}

module.exports = configureShortcodes;

