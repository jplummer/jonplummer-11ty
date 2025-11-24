const fs = require('fs');
const path = require('path');

module.exports = function() {
  const ogDir = path.join(__dirname, '..', 'assets', 'images', 'og');
  if (!fs.existsSync(ogDir)) {
    return [];
  }
  const files = fs.readdirSync(ogDir)
    .filter(f => f.endsWith('.png'))
    .sort()
    .map(filename => ({
      filename,
      url: `/assets/images/og/${filename}`
    }));
  return files;
};

