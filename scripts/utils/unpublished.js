/**
 * What a production build leaves out: drafts (posts, portfolio pieces, side
 * projects, pages, and wisdom entries) and posts held for a later day.
 * scripts/build/build.js prints one line for each, so a forgotten
 * `draft: true` or a mistyped year is seen at every build and deploy.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { parseFrontMatter } = require('./frontmatter-utils');
const { publishState } = require('../../eleventy/utils/publish-state');

// Folders under src/ that hold no pages.
const SKIPPED_FOLDERS = new Set(['_includes', '_data', 'assets']);

function markdownFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return SKIPPED_FOLDERS.has(entry.name) ? [] : markdownFiles(full);
    }
    return entry.name.endsWith('.md') ? [full] : [];
  });
}

/** The first few words of a wisdom entry, to name it by. */
function wisdomLabel(entry) {
  const text = String(entry.body || '').replace(/\s+/g, ' ').trim();
  return text.length > 60 ? `${text.slice(0, 57)}…` : text;
}

/**
 * @param {object} [options]
 * @param {string} [options.srcDir] - The site's source folder
 * @param {Date} [options.now] - The instant to take today from
 * @returns {{ state: 'draft'|'held', until?: string, title: string, file: string }[]}
 */
function listUnpublished({ srcDir = 'src', now = new Date() } = {}) {
  const items = [];

  for (const file of markdownFiles(srcDir).sort()) {
    const { frontMatter } = parseFrontMatter(fs.readFileSync(file, 'utf8'));
    if (!frontMatter) continue;
    const { state, until } = publishState(frontMatter, now);
    if (state !== 'live') {
      items.push({ state, until, title: String(frontMatter.title || path.basename(file)), file });
    }
  }

  const wisdomFile = path.join(srcDir, '_data', 'wisdom-entries.yaml');
  if (fs.existsSync(wisdomFile)) {
    const root = yaml.load(fs.readFileSync(wisdomFile, 'utf8'));
    for (const entry of (root && root.entries) || []) {
      if (entry && entry.draft) {
        items.push({ state: 'draft', title: `Wisdom: ${wisdomLabel(entry)}`, file: wisdomFile });
      }
    }
  }

  return items;
}

/** One line for each item, held posts first. An empty list gives no lines. */
function formatUnpublished(items) {
  const held = items.filter((item) => item.state === 'held').sort((a, b) => a.until.localeCompare(b.until));
  const drafts = items.filter((item) => item.state === 'draft');
  return [
    ...held.map((item) => `⏳ Held until ${item.until}: ${item.title} (${item.file})`),
    ...drafts.map((item) => `✏️  Draft, not published: ${item.title} (${item.file})`),
  ];
}

module.exports = { listUnpublished, formatUnpublished };
