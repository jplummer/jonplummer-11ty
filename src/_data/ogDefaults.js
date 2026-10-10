const {
  OG_DEFAULT_IMAGE_FILENAME,
  ogImageUrl,
} = require('../../scripts/utils/og-image-filename');

/**
 * The shared fallback OG card (home, paginated indexes, wisdom tag pages).
 * base.njk falls back to it when a page has no ogImage of its own;
 * generate-og-images.js renders it from site data (generateDefaultCard).
 */
module.exports = function () {
  return {
    image: ogImageUrl(OG_DEFAULT_IMAGE_FILENAME),
  };
};
