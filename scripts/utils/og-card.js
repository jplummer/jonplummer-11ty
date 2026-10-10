/**
 * Which source files get their own OG card, and what the card's label says.
 * Shared by generate-og-images.js and the /ogimages/ gallery sort so the two
 * can't disagree. Design: docs/designs/specs/2026-10-09-og-dark-card-design.md
 */

const path = require('path');

const KIND_LABELS = {
  post: 'Post',
  portfolio: 'Portfolio',
  sideproject: 'Side project',
};

function tagsOf(frontMatter) {
  const tags = frontMatter && frontMatter.tags;
  if (!tags) return [];
  return Array.isArray(tags) ? tags : [tags];
}

/**
 * @param {object|null} frontMatter
 * @returns {'post'|'portfolio'|'sideproject'|'page'|null} null = no card of its own
 */
function ogCardKind(frontMatter) {
  if (!frontMatter) return null;
  // One template emits many URLs; those pages share the default card instead.
  if (frontMatter.pagination) return null;
  const tags = tagsOf(frontMatter);
  if (tags.includes('post')) return 'post';
  if (tags.includes('portfolio')) return 'portfolio';
  if (tags.includes('sideproject')) return 'sideproject';
  if (tags.includes('page')) return 'page';
  return null;
}

/**
 * Nav-style path for a page, matching the site's `/about` nav links.
 * @param {object} frontMatter
 * @param {string} filePath absolute or cwd-relative source path
 * @param {string} srcDir
 */
function ogCardPagePath(frontMatter, filePath, srcDir = path.join(process.cwd(), 'src')) {
  const permalink = frontMatter && frontMatter.permalink;
  let url;
  if (typeof permalink === 'string' && !permalink.includes('{')) {
    url = permalink;
  } else {
    const rel = path
      .relative(srcDir, path.resolve(filePath))
      .replace(/\\/g, '/')
      .replace(/\.(md|njk)$/, '');
    url = `/${rel.replace(/(^|\/)index$/, '')}`;
  }
  url = url.replace(/index\.html$/, '').replace(/\.html$/, '');
  if (!url.startsWith('/')) url = `/${url}`;
  if (url.length > 1) url = url.replace(/\/+$/, '');
  return url;
}

/**
 * @returns {{ text: string, isPath: boolean } | null}
 */
function ogCardLabel(frontMatter, filePath, srcDir) {
  const kind = ogCardKind(frontMatter);
  if (!kind) return null;
  if (kind === 'page') {
    return { text: ogCardPagePath(frontMatter, filePath, srcDir), isPath: true };
  }
  return { text: KIND_LABELS[kind], isPath: false };
}

module.exports = { KIND_LABELS, ogCardKind, ogCardLabel, ogCardPagePath };
