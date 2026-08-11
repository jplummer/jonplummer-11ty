const path = require('path');

/**
 * @param {object} pageData Front matter
 * @param {string} filePath Absolute path to source file
 * @returns {string} Basename for the PNG under `src/assets/images/og/`
 */
function generateOgImageFilename(pageData, filePath) {
  if (pageData.tags && pageData.tags.includes('post')) {
    const basename = path.basename(filePath, path.extname(filePath));
    // Prefer the post filename's calendar date — front-matter Date/ISO UTC midnight
    // can shift a day in local TZ and double-prefix the slug.
    if (/^\d{4}-\d{2}-\d{2}-/.test(basename)) {
      return `${basename}.png`;
    }

    if (pageData.date) {
      let year;
      let month;
      let day;
      if (typeof pageData.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(pageData.date)) {
        [year, month, day] = pageData.date.split('-');
      } else {
        const date = pageData.date instanceof Date ? pageData.date : new Date(pageData.date);
        year = String(date.getFullYear());
        month = String(date.getMonth() + 1).padStart(2, '0');
        day = String(date.getDate()).padStart(2, '0');
      }
      return `${year}-${month}-${day}-${basename}.png`;
    }
  }

  if (pageData.permalink) {
    const slug = pageData.permalink.replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '-') || 'index';
    return `${slug}.png`;
  }

  const slug = path.basename(filePath, path.extname(filePath));
  return `${slug}.png`;
}

module.exports = { generateOgImageFilename };
