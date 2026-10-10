const fs = require('fs');
const path = require('path');
const {
  buildFilenameToPublicationSortMs,
  resolvePngSortMs
} = require('../../scripts/utils/og-image-gallery-sort');
const { ogImageDiskDir, ogImageUrl } = require('../../scripts/utils/og-image-filename');

/** PNG listing for `/ogimages/`: newest first by content `date` when present, else fallbacks (see util). */
module.exports = function () {
  const ogDir = ogImageDiskDir(path.join(__dirname, '..', '..'));
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
        url: ogImageUrl(filename),
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
