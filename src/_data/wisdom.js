/**
 * Loads wisdom-entries.yaml and exposes sorted entries plus a deduped tag list for pagination.
 * Entries may omit `slug`; a stable id is derived from the body hash for anchors and RSS.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function slugFromBody(body) {
  const h = crypto.createHash('sha256').update(String(body || ''), 'utf8').digest('hex');
  return `w${h.slice(0, 14)}`;
}

module.exports = function () {
  const yamlPath = path.join(__dirname, 'wisdom-entries.yaml');
  const raw = fs.readFileSync(yamlPath, 'utf8');
  const data = yaml.load(raw, { schema: yaml.JSON_SCHEMA });
  const entries = (data.entries || []).map((e) => {
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
};
