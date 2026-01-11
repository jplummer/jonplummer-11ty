/**
 * Eleventy configuration: Shortcode registration
 * 
 * Called from `.eleventy.js` during Eleventy initialization.
 * Registers all custom shortcodes available in Nunjucks templates (e.g., renderOgImage, year).
 */

const path = require('path');
const fs = require('fs');
const nunjucks = require('nunjucks');
const { normalizeDate, formatPostDate } = require('../utils/date-utils');
const { extractCssCustomProperties } = require('../utils/css-utils');

/**
 * Renders the OG image template and extracts body content.
 * Used for generating Open Graph images for posts.
 * 
 * @param {string} title - Post title
 * @param {string|null} description - Post description (optional)
 * @param {Date|string|null} date - Post date (optional)
 * @returns {Promise<string>} HTML content wrapped in div with class 'og-image-rendered'
 */
async function renderOgImage(title, description, date) {
  // Configure Nunjucks environment
  const nunjucksEnv = new nunjucks.Environment(
    new nunjucks.FileSystemLoader([
      path.join(process.cwd(), 'src', '_includes'),
      path.join(process.cwd(), 'src')
    ])
  );
  
  // Add filters (reuse utilities)
  nunjucksEnv.addFilter('postDate', formatPostDate);
  nunjucksEnv.addFilter('extractCssCustomProperties', extractCssCustomProperties);
  
  // Render the template
  const templatePath = path.join(process.cwd(), 'src', '_includes', 'og-image.njk');
  const template = fs.readFileSync(templatePath, 'utf8');
  
  const dateObj = date ? normalizeDate(date) : null;
  
  // Extract CSS custom properties
  const cssCustomProperties = extractCssCustomProperties();
  
  const html = nunjucksEnv.renderString(template, {
    title,
    description: description || null,
    date: dateObj,
    cssCustomProperties
  });
  
  // Extract body content (styles are now in external CSS file)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  
  if (bodyMatch) {
    // Replace h1 elements with div elements to avoid heading hierarchy issues in preview pages
    // CSS class selectors (like .og-title) will still work
    let bodyContent = bodyMatch[1];
    bodyContent = bodyContent.replace(/<h1(\s[^>]*)?>/gi, '<div$1>');
    bodyContent = bodyContent.replace(/<\/h1>/gi, '</div>');
    
    // Return body content wrapped in a div (styles are in external CSS scoped to .og-image-rendered)
    return `<div class="og-image-rendered">${bodyContent}</div>`;
  }
  return html;
}

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

