#!/usr/bin/env node

/**
 * Unit tests for findSourceFile() / isRedirectPage() in scripts/utils/source-file-utils.js.
 * og-images.js and seo-meta.js both resolve built HTML paths back to source files
 * through this shared helper; a regression here can silently drop files from
 * seo-meta.js's `--changed` filtering (validate() treats an unresolved source as
 * "exclude", not "include" — see docs/tests.md).
 */

const { test } = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { findSourceFile, isRedirectPage } = require('../utils/source-file-utils');
function assertEqual(actual, expected, label) {
  assert.strictEqual(
    actual,
    expected,
    `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
  );
}

// Find a real post on disk so the permalink-resolution assertion doesn't pin a
// slug that might get renamed/redirected later (see src/_data/redirects.yaml).
function findAnyPost(srcDir) {
  const postsDir = path.join(srcDir, 'posts');
  for (const year of fs.readdirSync(postsDir)) {
    const yearDir = path.join(postsDir, year);
    if (!fs.statSync(yearDir).isDirectory()) continue;
    for (const filename of fs.readdirSync(yearDir)) {
      const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.md$/);
      if (match) {
        const [, fileYear, month, day, slug] = match;
        return { year: fileYear, month, day, slug, absolutePath: path.join(yearDir, filename) };
      }
    }
  }
  return null;
}

const srcDir = path.join(process.cwd(), 'src');

test('a directory-style permalink resolves to its markdown page', () => {
  assertEqual(
    findSourceFile('about/index.html'),
    path.join(srcDir, 'about.md'),
    'directory-style permalink: about/index.html -> src/about.md'
  );
});

test('the root index resolves to src/index.njk', () => {
  assertEqual(
    findSourceFile('index.html'),
    path.join(srcDir, 'index.njk'),
    'root index: index.html -> src/index.njk'
  );
});

test('a permalink subdirectory resolves to its template', () => {
  assertEqual(
    findSourceFile('ogimages/index.html'),
    path.join(srcDir, 'ogimages.njk'),
    'permalink subdirectory: ogimages/index.html -> src/ogimages.njk'
  );
});

// Regression case: post permalinks were only resolved by the OG copy of this
// function before the two were consolidated, so `test seo --changed` silently
// skipped every blog post.
test('a post permalink resolves to its dated post file', () => {
  const post = findAnyPost(srcDir);
  assert.ok(post, 'No post found under src/posts to test permalink resolution');
  assertEqual(
    findSourceFile(`${post.year}/${post.month}/${post.day}/${post.slug}/index.html`),
    post.absolutePath,
    'post permalink: YYYY/MM/DD/slug/index.html -> src/posts/YYYY/YYYY-MM-DD-slug.md'
  );
});

// Portfolio pieces moved to /portfolio/<slug>/ on 2026-11-08. Without this
// mapping, the permalink-subdirectory fallback answers src/portfolio.njk for
// every piece, so seo and og-images would check the index page instead.
test('a portfolio piece resolves to its own file, not the portfolio index', () => {
  const piece = fs.readdirSync(path.join(srcDir, 'portfolio')).find((f) => /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(f));
  assert.ok(piece, 'No piece found under src/portfolio to test permalink resolution');
  const slug = piece.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
  assertEqual(
    findSourceFile(`portfolio/${slug}/index.html`),
    path.join(srcDir, 'portfolio', piece),
    'portfolio piece: portfolio/slug/index.html -> src/portfolio/YYYY-MM-DD-slug.md'
  );
});

test('the portfolio index resolves to src/portfolio.njk', () => {
  assertEqual(
    findSourceFile('portfolio/index.html'),
    path.join(srcDir, 'portfolio.njk'),
    'portfolio index: portfolio/index.html -> src/portfolio.njk'
  );
});

test('an unresolvable path returns null', () => {
  assertEqual(
    findSourceFile('this/path/does-not/exist/index.html'),
    null,
    'unresolvable path returns null'
  );
});

test('a data-redirect-url attribute marks a redirect page', () => {
  assertEqual(
    isRedirectPage('<html><body data-redirect-url="/new/"></body></html>'),
    true,
    'redirect detected via data-redirect-url attribute'
  );
});

test('a meta refresh marks a redirect page', () => {
  assertEqual(
    isRedirectPage('<html><head><meta http-equiv="refresh" content="0;url=/new/"></head></html>'),
    true,
    'redirect detected via meta refresh'
  );
});

test('an ordinary page is not a redirect', () => {
  assertEqual(
    isRedirectPage('<html><body><h1>Not a redirect</h1></body></html>'),
    false,
    'ordinary page is not a redirect'
  );
});
