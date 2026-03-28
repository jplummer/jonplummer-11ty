/**
 * Pure transform: raw wisdom-entries root (from YAML / global data) → sorted entries + allTags.
 * Used by eleventy/config/wisdom-global.js and by tests.
 */
const crypto = require('crypto');

function slugFromBody(body) {
  const h = crypto.createHash('sha256').update(String(body || ''), 'utf8').digest('hex');
  return `w${h.slice(0, 14)}`;
}

/**
 * @param {{ entries?: object[] }} root - Parsed root of wisdom-entries.yaml (`entries` array)
 * @returns {{ entries: object[], allTags: string[] }}
 */
function buildWisdom(root) {
  if (!root || typeof root !== 'object') {
    throw new Error('buildWisdom: root must be an object');
  }
  const entries = (root.entries || [])
    .filter((e) => e != null && typeof e === 'object')
    .map((e) => {
      const slug = typeof e.slug === 'string' && e.slug.trim() ? e.slug.trim() : slugFromBody(e.body);
      return { ...e, slug };
    });
  const sorted = [...entries].sort((a, b) => {
    const da = new Date(String(a.added));
    const db = new Date(String(b.added));
    return db - da;
  });
  const allTags = [
    ...new Set(sorted.flatMap((e) => (Array.isArray(e.tags) ? e.tags : []).filter(Boolean)))
  ].sort();
  return { entries: sorted, allTags };
}

module.exports = { buildWisdom, slugFromBody };
