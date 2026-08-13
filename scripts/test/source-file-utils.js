#!/usr/bin/env node

/**
 * Unit tests for findSourceFile() / isRedirectPage() in scripts/utils/source-file-utils.js.
 * og-images.js and seo-meta.js both resolve built HTML paths back to source files
 * through this shared helper; a regression here can silently drop files from
 * seo-meta.js's `--changed` filtering (validate() treats an unresolved source as
 * "exclude", not "include" — see docs/tests.md).
 */

const fs = require('fs');
const path = require('path');
const { findSourceFile, isRedirectPage } = require('../utils/source-file-utils');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

function assertEqual(fileObj, actual, expected, label) {
  if (actual !== expected) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'source-file-utils-mismatch',
      message: `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    });
  }
}

// Find a real post on disk so the permalink-resolution assertion doesn't pin a
// slug that might get renamed/redirected later (see src/_data/redirects.yaml).
function findAnyPost(srcDir) {
  const postsDir = path.join(srcDir, '_posts');
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

async function validate(result) {
  const fileObj = addFile(result, 'scripts/utils/source-file-utils.js (fixtures)');
  const srcDir = path.join(process.cwd(), 'src');

  assertEqual(
    fileObj,
    findSourceFile('about/index.html'),
    path.join(srcDir, 'about.md'),
    'directory-style permalink: about/index.html -> src/about.md'
  );

  assertEqual(
    fileObj,
    findSourceFile('index.html'),
    path.join(srcDir, 'index.njk'),
    'root index: index.html -> src/index.njk'
  );

  assertEqual(
    fileObj,
    findSourceFile('ogimages/index.html'),
    path.join(srcDir, 'ogimages.njk'),
    'permalink subdirectory: ogimages/index.html -> src/ogimages.njk'
  );

  // Regression case: post permalinks were only resolved by the OG copy of this
  // function before the two were consolidated, so `test seo --changed` silently
  // skipped every blog post.
  const post = findAnyPost(srcDir);
  if (post) {
    assertEqual(
      fileObj,
      findSourceFile(`${post.year}/${post.month}/${post.day}/${post.slug}/index.html`),
      post.absolutePath,
      'post permalink: YYYY/MM/DD/slug/index.html -> src/_posts/YYYY/YYYY-MM-DD-slug.md'
    );
  } else {
    addIssue(fileObj, {
      severity: 'error',
      type: 'source-file-utils-fixture',
      message: 'No post found under src/_posts to test permalink resolution',
    });
  }

  assertEqual(
    fileObj,
    findSourceFile('this/path/does-not/exist/index.html'),
    null,
    'unresolvable path returns null'
  );

  assertEqual(
    fileObj,
    isRedirectPage('<html><body data-redirect-url="/new/"></body></html>'),
    true,
    'redirect detected via data-redirect-url attribute'
  );

  assertEqual(
    fileObj,
    isRedirectPage('<html><head><meta http-equiv="refresh" content="0;url=/new/"></head></html>'),
    true,
    'redirect detected via meta refresh'
  );

  assertEqual(
    fileObj,
    isRedirectPage('<html><body><h1>Not a redirect</h1></body></html>'),
    false,
    'ordinary page is not a redirect'
  );
}

runTest({
  testType: 'source-file-utils',
  testName: 'Source File Utils',
  requiresSite: false,
  validateFn: validate,
});
