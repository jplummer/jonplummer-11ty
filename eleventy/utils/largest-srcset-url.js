/**
 * Pick the URL with the largest width descriptor from a srcset string.
 * @param {string | null | undefined} srcset
 * @returns {string | null}
 */
function largestUrlFromSrcset(srcset) {
  if (!srcset || !String(srcset).trim()) return null;
  let bestUrl = null;
  let bestW = -1;
  for (const chunk of String(srcset).split(',')) {
    const parts = chunk.trim().split(/\s+/);
    if (!parts[0]) continue;
    const url = parts[0];
    const desc = parts[1] || '';
    const w = desc.endsWith('w') ? parseInt(desc, 10) : 0;
    if (Number.isFinite(w) && w >= bestW) {
      bestW = w;
      bestUrl = url;
    }
  }
  return bestUrl;
}

/**
 * @param {{ src?: string | null, srcset?: string | null, sourceSrcsets?: string[] }} attrs
 * @returns {string | null}
 */
function largestUrlFromAttributes(attrs) {
  const candidates = [];
  const fromImg = largestUrlFromSrcset(attrs.srcset);
  if (fromImg) candidates.push({ url: fromImg, w: widthFromSrcset(attrs.srcset, fromImg) });
  for (const ss of attrs.sourceSrcsets || []) {
    const url = largestUrlFromSrcset(ss);
    if (url) candidates.push({ url, w: widthFromSrcset(ss, url) });
  }
  if (candidates.length) {
    candidates.sort((a, b) => b.w - a.w);
    return candidates[0].url;
  }
  return attrs.src || null;
}

function widthFromSrcset(srcset, url) {
  if (!srcset) return 0;
  for (const chunk of String(srcset).split(',')) {
    const parts = chunk.trim().split(/\s+/);
    if (parts[0] === url && parts[1] && parts[1].endsWith('w')) {
      return parseInt(parts[1], 10) || 0;
    }
  }
  return 0;
}

module.exports = {
  largestUrlFromSrcset,
  largestUrlFromAttributes,
};
