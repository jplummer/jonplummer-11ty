/**
 * Portfolio pieces live at /portfolio/<slug>/, independent of their date.
 *
 * Eleventy's fileSlug drops the YYYY-MM-DD- prefix from the filename, so
 * 2016-03-21-belkin-router-out-of-box.md builds /portfolio/belkin-router-out-of-box/.
 * The filename prefix stays because a piece's OG card is named after its source file.
 * Moved from dated URLs on 2026-11-08; the old URLs 301 here (src/_data/redirects.yaml).
 */
module.exports = {
  permalink: (data) => `/portfolio/${data.page.fileSlug}/`,
};
