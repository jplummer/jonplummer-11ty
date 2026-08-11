/**
 * Deterministic tagline pick from a URL (browse variety, no client JS).
 * Same URL + same pool → same line across rebuilds.
 *
 * @param {string[]} taglines
 * @param {string} [url]
 * @returns {string}
 */
function pickTaglineForUrl(taglines, url) {
  if (!Array.isArray(taglines) || taglines.length === 0) {
    return '';
  }
  const key = url == null || url === '' ? '/' : String(url);
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0; // 32-bit
  }
  const idx = Math.abs(hash) % taglines.length;
  return taglines[idx];
}

module.exports = { pickTaglineForUrl };
