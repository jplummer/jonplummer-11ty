const path = require('path');

/**
 * Same rules as `scripts/content/generate-og-images.js` — keep in sync when changing naming.
 *
 * @param {object} pageData Front matter
 * @param {string} filePath Absolute path to source file
 * @returns {string} Basename for the PNG under `src/assets/images/og/`
 */
function generateOgImageFilename(pageData, filePath) {
  if (pageData.tags && pageData.tags.includes('post') && pageData.date) {
    const date = new Date(pageData.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    let slug = path.basename(filePath, path.extname(filePath));
    const datePrefix = `${year}-${month}-${day}-`;
    if (slug.startsWith(datePrefix)) {
      slug = slug.substring(datePrefix.length);
    }
    return `${year}-${month}-${day}-${slug}.png`;
  }

  if (pageData.permalink) {
    const slug = pageData.permalink.replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '-') || 'index';
    return `${slug}.png`;
  }

  const slug = path.basename(filePath, path.extname(filePath));
  return `${slug}.png`;
}

module.exports = { generateOgImageFilename };
