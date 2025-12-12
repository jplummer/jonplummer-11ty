/**
 * Shortcode: Render OG image
 * 
 * Used as an Eleventy shortcode (registered in `config/shortcodes.js`).
 * Renders the OG image template and extracts body content for generating
 * Open Graph images for posts.
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
    title: title,
    description: description || null,
    date: dateObj,
    cssCustomProperties: cssCustomProperties
  });
  
  // Extract body content (styles are now in external CSS file)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  
  if (bodyMatch) {
    // Return body content wrapped in a div (styles are in external CSS scoped to .og-image-rendered)
    return `<div class="og-image-rendered">${bodyMatch[1]}</div>`;
  }
  return html;
}

module.exports = renderOgImage;

