const fs = require('fs');
const path = require('path');

/** PNG listing for `/ogimages/` grid: newest first by filesystem mtime (stable tie-break by filename). */
module.exports = function() {
  const ogDir = path.join(__dirname, '..', 'assets', 'images', 'og');
  if (!fs.existsSync(ogDir)) {
    return [];
  }
  const files = fs.readdirSync(ogDir)
    .filter(f => f.endsWith('.png'))
    .map((filename) => {
      const fullPath = path.join(ogDir, filename);
      const { mtimeMs } = fs.statSync(fullPath);
      return { filename, url: `/assets/images/og/${filename}`, mtimeMs };
    })
    .sort((a, b) => {
      if (b.mtimeMs !== a.mtimeMs) return b.mtimeMs - a.mtimeMs;
      return a.filename.localeCompare(b.filename);
    })
    .map(({ filename, url }) => ({ filename, url }));
  return files;
};

