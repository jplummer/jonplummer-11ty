/**
 * One fingerprint for everything OG images share: the design tokens and
 * light-theme colors pulled from jonplummer.css, the inlined font faces, the
 * card templates, the JP mark, the site data the card uses, and the render
 * code itself. If it changes, every OG image is regenerated; if not, each
 * image is regenerated only when its own source file changes.
 *
 * The CSS goes in as the extractors' output, not as the whole file, so rules
 * the card never sees (layout, lightbox, grids) don't trigger a full rerender.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  extractCssCustomProperties,
  extractLightThemeColorOverrides,
  extractProductionFontFacesForInline,
} = require('../../eleventy/utils/css-utils');

// Paths relative to the site root.
const SHARED_CONTENT_FILES = [
  'src/_includes/og-image.njk',
  'src/_includes/og-image-body.njk',
  'src/assets/images/jp-mark.svg',
];

// The render code. Editing either one regenerates every image.
const RENDER_CODE_FILES = [
  path.join(__dirname, '..', 'content', 'generate-og-images.js'),
  path.join(__dirname, '..', '..', 'eleventy', 'utils', 'css-utils.js'),
];

/**
 * @param {string} [cwd] site root (defaults to process.cwd())
 * @returns {Array<[string, string]>} labeled inputs, in a fixed order
 */
function collectOgSharedInputs(cwd = process.cwd()) {
  const previousCwd = process.cwd();
  // The css-utils extractors resolve paths from process.cwd().
  if (cwd !== previousCwd) process.chdir(cwd);
  try {
    const parts = [
      ['css:root', extractCssCustomProperties()],
      ['css:light-theme', extractLightThemeColorOverrides()],
      ['css:font-faces', extractProductionFontFacesForInline()],
    ];

    for (const rel of SHARED_CONTENT_FILES) {
      const abs = path.join(cwd, rel);
      parts.push([rel, fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '']);
    }

    const sitePath = path.join(cwd, 'src', '_data', 'site.js');
    delete require.cache[require.resolve(sitePath)];
    parts.push(['site', JSON.stringify(require(sitePath)())]);

    for (const abs of RENDER_CODE_FILES) {
      parts.push([path.basename(abs), fs.readFileSync(abs, 'utf8')]);
    }

    return parts;
  } finally {
    if (cwd !== previousCwd) process.chdir(previousCwd);
  }
}

/**
 * @param {string} [cwd]
 * @returns {string} sha256 hex
 */
function computeOgSharedFingerprint(cwd = process.cwd()) {
  const hash = crypto.createHash('sha256');
  for (const [label, value] of collectOgSharedInputs(cwd)) {
    hash.update(label);
    hash.update('\0');
    hash.update(value);
    hash.update('\0');
  }
  return hash.digest('hex');
}

function defaultFingerprintPath(cwd = process.cwd()) {
  return path.join(cwd, '.cache', 'og-shared-fingerprint.json');
}

/** @returns {string | null} null if the file is missing or unreadable */
function readStoredFingerprint(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return typeof data.fingerprint === 'string' ? data.fingerprint : null;
  } catch {
    return null;
  }
}

function writeStoredFingerprint(filePath, fingerprint) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    JSON.stringify({ version: 1, fingerprint, updatedAt: new Date().toISOString() }, null, 2) + '\n',
    'utf8'
  );
}

module.exports = {
  collectOgSharedInputs,
  computeOgSharedFingerprint,
  defaultFingerprintPath,
  readStoredFingerprint,
  writeStoredFingerprint,
};
