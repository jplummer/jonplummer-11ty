const { execSync } = require('child_process');

/**
 * Deterministic tagline pick from a URL (browse variety, no client JS).
 * Same URL + same pool (+ same salt for home) → same line across rebuilds.
 *
 * Home (`/`): when salt is a non-empty string, hash key is `${salt}:${url}`.
 * All other URLs ignore salt.
 *
 * @param {string[]} taglines
 * @param {string} [url]
 * @param {string} [salt]
 * @returns {string}
 */
function pickTaglineForUrl(taglines, url, salt) {
  if (!Array.isArray(taglines) || taglines.length === 0) {
    return '';
  }
  const path = url == null || url === '' ? '/' : String(url);
  const useSalt = path === '/' && typeof salt === 'string' && salt.length > 0;
  const key = useSalt ? `${salt}:${path}` : path;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0; // 32-bit
  }
  const idx = Math.abs(hash) % taglines.length;
  return taglines[idx];
}

/**
 * @returns {string} Current HEAD SHA, or '' if git is unavailable.
 */
function getGitHeadSha() {
  try {
    return execSync('git rev-parse HEAD', {
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch (err) {
    return '';
  }
}

module.exports = { pickTaglineForUrl, getGitHeadSha };
