/**
 * Pure transform: raw wisdom YAML root (from `wisdom-entries.yaml` / global data) → sorted entries + allTags.
 * Used by `src/_data/wisdom.js` and by tests.
 */
const crypto = require('crypto');

function slugFromBody(body) {
  const h = crypto.createHash('sha256').update(String(body || ''), 'utf8').digest('hex');
  return `w${h.slice(0, 14)}`;
}

/**
 * An entry with `draft: true` is left out of a production build and kept on the
 * dev server, the same as a draft page (eleventy/config/preprocessors.js).
 *
 * @param {{ entries?: object[] }} root - Parsed root of `wisdom-entries.yaml` (`entries` array)
 * @param {string} [runMode] - Eleventy's run mode; "build" is a production build
 * @returns {{ entries: object[], allTags: string[] }}
 */
function buildWisdom(root, runMode = process.env.ELEVENTY_RUN_MODE) {
  if (!root || typeof root !== 'object') {
    throw new Error('buildWisdom: root must be an object');
  }
  const entries = (root.entries || [])
    .filter((e) => e != null && typeof e === 'object')
    .filter((e) => !(e.draft && runMode === 'build'))
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
