const fs = require('fs');
const path = require('path');
const {
  buildFilenameToPublicationSortMs,
  resolvePngSortMs
} = require('../../scripts/utils/og-image-gallery-sort');

/** PNG listing for `/ogimages/`: newest first by content `date` when present, else fallbacks (see util). */
module.exports = function () {
  const ogDir = path.join(__dirname, '..', 'assets', 'images', 'og');
  if (!fs.existsSync(ogDir)) {
    return [];
  }

  const filenameToMs = buildFilenameToPublicationSortMs();

  const files = fs
    .readdirSync(ogDir)
    .filter((f) => f.endsWith('.png'))
    .map((filename) => {
      const fullPath = path.join(ogDir, filename);
      const sortMs = resolvePngSortMs(filename, filenameToMs, fullPath);
      return {
        filename,
        url: `/assets/images/og/${filename}`,
        sortMs
      };
    })
    .sort((a, b) => {
      if (b.sortMs !== a.sortMs) return b.sortMs - a.sortMs;
      return a.filename.localeCompare(b.filename);
    })
    .map(({ filename, url }) => ({ filename, url }));

  return files;
};
