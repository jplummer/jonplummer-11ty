/**
 * What a production build leaves out: drafts (posts, portfolio pieces, side
 * projects, pages, and wisdom entries) and posts held for a later day.
 * The build prints one line for each, so a forgotten `draft: true` or a
 * mistyped year is seen at every build and deploy.
 *
 * Pages come from Eleventy itself: the preprocessor in
 * eleventy/config/preprocessors.js notes each template it leaves out, in any
 * format, and prints these lines when the build ends. Wisdom entries aren't
 * templates, so their drafts are read from the YAML file here.
 */

const fs = require('fs');
const yaml = require('js-yaml');

/** The first few words of a wisdom entry, to name it by. */
function wisdomLabel(entry) {
  const text = String(entry.body || '').replace(/\s+/g, ' ').trim();
  return text.length > 60 ? `${text.slice(0, 57)}…` : text;
}

/**
 * @param {string} wisdomFile - Path to wisdom-entries.yaml; a missing file gives none
 * @returns {{ state: 'draft', title: string, file: string }[]}
 */
function listWisdomDrafts(wisdomFile) {
  if (!fs.existsSync(wisdomFile)) return [];
  const root = yaml.load(fs.readFileSync(wisdomFile, 'utf8'));
  return ((root && root.entries) || [])
    .filter((entry) => entry && entry.draft)
    .map((entry) => ({ state: 'draft', title: `Wisdom: ${wisdomLabel(entry)}`, file: wisdomFile }));
}

/**
 * One line for each item: held posts first, by day, then drafts in the order
 * given. An empty list gives no lines.
 *
 * @param {{ state: 'draft'|'held', until?: string, title: string, file: string }[]} items
 * @returns {string[]}
 */
function formatUnpublished(items) {
  const held = items.filter((item) => item.state === 'held').sort((a, b) => a.until.localeCompare(b.until));
  const drafts = items.filter((item) => item.state === 'draft');
  return [
    ...held.map((item) => `⏳ Held until ${item.until}: ${item.title} (${item.file})`),
    ...drafts.map((item) => `✏️  Draft, not published: ${item.title} (${item.file})`),
  ];
}

module.exports = { listWisdomDrafts, formatUnpublished };
