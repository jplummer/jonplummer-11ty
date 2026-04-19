const fs = require('fs');
const path = require('path');
const { findMarkdownFiles, findFilesByExtension } = require('./file-utils');
const { parseFrontMatter } = require('./frontmatter-utils');
const { isPost } = require('./content-utils');
const { generateOgImageFilename } = require('./og-image-filename');

/** Same discovery set as `generateOgImages()` (posts + root md + njk, no drafts). */
function listOgImageSourceFiles() {
  const srcDir = path.join(process.cwd(), 'src');
  const postsDir = path.join(srcDir, '_posts');

  const allPostFiles = findMarkdownFiles(postsDir);
  const postFiles = allPostFiles.filter((f) => {
    const content = fs.readFileSync(f, 'utf8');
    const { frontMatter } = parseFrontMatter(content);
    return !(frontMatter && frontMatter.draft === true);
  });

  const allRootFiles = findMarkdownFiles(srcDir).filter(
    (f) =>
      !f.includes('_posts') &&
      !f.includes('_includes') &&
      !f.includes('_data') &&
      !f.includes('assets')
  );
  const rootFiles = allRootFiles.filter((f) => {
    const content = fs.readFileSync(f, 'utf8');
    const { frontMatter } = parseFrontMatter(content);
    return !(frontMatter && frontMatter.draft === true);
  });

  const allNjkFiles = findFilesByExtension(srcDir, ['.njk']).filter(
    (f) =>
      !f.includes('_posts') &&
      !f.includes('_includes') &&
      !f.includes('_data') &&
      !f.includes('assets')
  );
  const njkFiles = allNjkFiles.filter((f) => {
    const content = fs.readFileSync(f, 'utf8');
    const { frontMatter } = parseFrontMatter(content);
    return !(frontMatter && frontMatter.draft === true);
  });

  return [...postFiles, ...rootFiles, ...njkFiles];
}

/** Mirrors `processFile` eligibility for OG generation (mapping filename → sort time only). */
function includeSourceForOgMap(filePath, frontMatter) {
  if (!frontMatter) return false;
  if (
    frontMatter.tags &&
    frontMatter.tags.includes('portfolio') &&
    !filePath.endsWith('portfolio.njk') &&
    !filePath.endsWith('portfolio.md')
  ) {
    return false;
  }
  const isPage = frontMatter.tags && frontMatter.tags.includes('page');
  const isPortfolioPage = filePath.endsWith('portfolio.njk') || filePath.endsWith('portfolio.md');
  if (!isPost(frontMatter) && !isPage && !isPortfolioPage) return false;
  if (frontMatter.pagination) return false;
  return true;
}

function publicationSortMs(frontMatter, filePath) {
  if (frontMatter.date) {
    const t = new Date(frontMatter.date).getTime();
    if (!Number.isNaN(t)) return t;
  }
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return 0;
  }
}

/**
 * Maps each expected PNG basename to a sort timestamp (newest-first ordering on `/ogimages/`).
 * Uses `date` from front matter when present; otherwise source file `mtime`.
 */
function buildFilenameToPublicationSortMs() {
  const map = new Map();
  for (const file of listOgImageSourceFiles()) {
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const { frontMatter } = parseFrontMatter(content);
    if (!includeSourceForOgMap(file, frontMatter)) continue;

    const ms = publicationSortMs(frontMatter, file);
    const primaryName = generateOgImageFilename(frontMatter, file);
    const prev = map.get(primaryName);
    if (prev === undefined || ms > prev) map.set(primaryName, ms);

    if (frontMatter.ogImage && frontMatter.ogImage !== 'auto') {
      const base = path.basename(frontMatter.ogImage);
      if (base.endsWith('.png')) {
        const p = map.get(base);
        if (p === undefined || ms > p) map.set(base, ms);
      }
    }
  }
  return map;
}

/** Parse post-style `YYYY-MM-DD-slug.png` date when the map has no entry. */
function sortMsFromPostStyleFilename(filename) {
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})-.+\.png$/);
  if (!m) return null;
  const t = Date.parse(`${m[1]}T12:00:00`);
  return Number.isNaN(t) ? null : t;
}

/**
 * @param {string} filename PNG basename
 * @param {Map<string, number>} filenameToMs from `buildFilenameToPublicationSortMs()`
 * @param {string} pngFullPath path to PNG on disk (mtime fallback)
 */
function resolvePngSortMs(filename, filenameToMs, pngFullPath) {
  if (filenameToMs.has(filename)) return filenameToMs.get(filename);
  const parsed = sortMsFromPostStyleFilename(filename);
  if (parsed !== null) return parsed;
  try {
    return fs.statSync(pngFullPath).mtimeMs;
  } catch {
    return 0;
  }
}

module.exports = {
  buildFilenameToPublicationSortMs,
  resolvePngSortMs
};
