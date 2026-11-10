#!/usr/bin/env node

/**
 * Unit checks for IndexNow URL selection (scripts/utils/indexnow.js): local
 * content-hash manifest diff → indexable-page filter → public URL mapping. No
 * network; selection runs on fixture manifests, and the one orchestration check
 * uses a temp state file.
 * The previous version of this test validated plumbing (env vars, git commands)
 * but let real problems pass — several checks ended in
 * `return true; // Not a failure, just informational`, which is why it stayed
 * green through 16 deploys that submitted zero URLs.
 */

const { test } = require('node:test');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  selectIndexNowUrls,
  selectAllIndexNowUrls,
  isIndexableHtmlPath,
  processIndexNow,
  readSitemapUrls,
} = require('../utils/indexnow');

function manifest(files) {
  return { version: 1, generatedAt: 'x', files };
}

function assertUrlsEqual(label, actual, expected) {
  const a = [...actual].sort();
  const b = [...expected].sort();
  assert.strictEqual(
    JSON.stringify(a),
    JSON.stringify(b),
    `${label}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`
  );
}

const siteDomain = 'jonplummer.com';

// The sitemap bounds every selection below
const U = (p) => `https://jonplummer.com${p}`;
const sitemap = [U('/'), U('/about/'), U('/2026/01/10/some-post/'), U('/page/2/')];
const withSitemap = (m, urls = sitemap) => ({ ...m, sitemapUrls: urls });

// Fixtures shared by more than one test
const current = manifest({
  'index.html': '1',
  'about/index.html': '2',
  'assets/css/jonplummer.css': '3',
});
const previousEmpty = manifest({});
const previousWithExtraPost = withSitemap(manifest({
  'index.html': '1',
  'about/index.html': '2',
  '2020/01/01/old-post/index.html': 'gone',
}), [...sitemap, U('/2020/01/01/old-post/')]);
const currentAfterDelete = manifest({
  'index.html': '1',
  'about/index.html': '2',
});

// --- isIndexableHtmlPath ---

test('isIndexableHtmlPath keeps pages and drops error pages, pagination, and non-HTML', () => {
  const indexableCases = [
    ['about/index.html', true],
    ['2026/01/10/some-post/index.html', true],
    ['index.html', true],
    ['404.html', false],
    ['500.html', false],
    ['page/2/index.html', false],
    ['page/17/index.html', false],
    ['assets/css/jonplummer.css', false],
    ['feed.xml', false],
    ['sitemap.xml', false],
    ['assets/images/og/foo.png', false],
  ];
  // Every wrong answer, not only the first.
  const wrong = indexableCases
    .filter(([p, expected]) => isIndexableHtmlPath(p) !== expected)
    .map(([p, expected]) => `isIndexableHtmlPath(${JSON.stringify(p)}): expected ${expected}, got ${!expected}`);
  assert.deepStrictEqual(wrong, []);
});

// --- selectIndexNowUrls: no baseline ---

test('no previous manifest submits nothing', () => {
  assertUrlsEqual(
    'no baseline',
    selectIndexNowUrls({ previousManifest: null, currentManifest: current, siteDomain, sitemapUrls: sitemap }),
    []
  );
});

// --- selectIndexNowUrls: added-only ---

test('added pages are submitted', () => {
  assertUrlsEqual(
    'added-only',
    selectIndexNowUrls({ previousManifest: previousEmpty, currentManifest: current, siteDomain, sitemapUrls: sitemap }),
    [U('/'), U('/about/')]
    // assets/css/jonplummer.css is added too, but not HTML, so excluded
  );
});

// --- selectIndexNowUrls: changed-only ---

test('changed pages are submitted', () => {
  const previousSamePaths = manifest({
    'index.html': 'old-hash',
    'about/index.html': '2', // unchanged
    'assets/css/jonplummer.css': '3',
  });
  assertUrlsEqual(
    'changed-only',
    selectIndexNowUrls({ previousManifest: previousSamePaths, currentManifest: current, siteDomain, sitemapUrls: sitemap }),
    [U('/')]
  );
});

// --- selectIndexNowUrls: added + changed together ---

test('added and changed pages are submitted together', () => {
  const currentWithNewPost = manifest({
    'index.html': '1-new', // changed
    'about/index.html': '2', // unchanged
    '2026/01/10/some-post/index.html': 'new', // added
    'assets/css/jonplummer.css': '3',
  });
  const previousBeforePost = manifest({
    'index.html': '1',
    'about/index.html': '2',
    'assets/css/jonplummer.css': '3',
  });
  assertUrlsEqual(
    'added + changed',
    selectIndexNowUrls({
      previousManifest: previousBeforePost,
      currentManifest: currentWithNewPost,
      siteDomain,
      sitemapUrls: sitemap,
    }),
    [U('/'), U('/2026/01/10/some-post/')]
  );
});

// --- selectIndexNowUrls: changed pages outside the sitemap are not submitted ---
// /changelog/ is noindex and changes on every deploy; demos and the
// Google verification file aren't pages to index either.

test('changed pages outside the sitemap are not submitted', () => {
  assertUrlsEqual(
    'outside the sitemap excluded',
    selectIndexNowUrls({
      previousManifest: manifest({ 'index.html': '1', 'changelog/index.html': '1', 'assets/demos/x/index.html': '1' }),
      currentManifest: manifest({
        'index.html': '2',
        'changelog/index.html': '2',
        'assets/demos/x/index.html': '2',
        'google123.html': 'new',
      }),
      siteDomain,
      sitemapUrls: sitemap,
    }),
    [U('/')]
  );
});

// --- selectIndexNowUrls: a deleted page that was in the sitemap is submitted ---

test('a deleted page that was in the sitemap is submitted', () => {
  assertUrlsEqual(
    'deleted page submitted',
    selectIndexNowUrls({
      previousManifest: previousWithExtraPost,
      currentManifest: currentAfterDelete,
      siteDomain,
      sitemapUrls: sitemap,
    }),
    [U('/2020/01/01/old-post/')]
  );
});

// --- selectIndexNowUrls: a page newly marked noindex leaves the sitemap and is submitted ---

test('a page newly marked noindex leaves the sitemap and is submitted', () => {
  assertUrlsEqual(
    'newly noindexed page submitted',
    selectIndexNowUrls({
      previousManifest: withSitemap(manifest({ 'index.html': '1', 'about/index.html': '2' })),
      currentManifest: manifest({ 'index.html': '1', 'about/index.html': '2-noindex' }),
      siteDomain,
      sitemapUrls: sitemap.filter((u) => u !== U('/about/')),
    }),
    [U('/about/')]
  );
});

// --- selectIndexNowUrls: a page that joins the sitemap unchanged is submitted ---

test('a page that joins the sitemap unchanged is submitted', () => {
  assertUrlsEqual(
    'joined the sitemap',
    selectIndexNowUrls({
      previousManifest: withSitemap(manifest({ 'index.html': '1' }), [U('/')]),
      currentManifest: manifest({ 'index.html': '1' }),
      siteDomain,
      sitemapUrls: [U('/'), U('/about/')],
    }),
    [U('/about/')]
  );
});

// --- selectIndexNowUrls: state without a recorded sitemap (written before
// 2026-11-08) can't tell what left, so it submits only changed pages ---

test('state without a recorded sitemap guesses no deletions', () => {
  assertUrlsEqual(
    'no recorded sitemap: no deletions guessed',
    selectIndexNowUrls({
      previousManifest: previousWithExtraPost.files && manifest(previousWithExtraPost.files),
      currentManifest: currentAfterDelete,
      siteDomain,
      sitemapUrls: sitemap,
    }),
    []
  );
});

// --- selectIndexNowUrls: non-HTML, 404/500, and paginated pages excluded ---

test('non-HTML files, error pages, and paginated pages are excluded', () => {
  const previousBase = withSitemap(manifest({ 'index.html': '1' }), [U('/')]);
  const currentWithNoise = manifest({
    'index.html': '1-changed',
    '404.html': 'new',
    '500.html': 'new',
    'page/2/index.html': 'new',
    'assets/css/jonplummer.css': 'new',
    'feed.xml': 'new',
  });
  assertUrlsEqual(
    'noise excluded',
    // /page/2/ joined the sitemap here, and is still left out
    selectIndexNowUrls({ previousManifest: previousBase, currentManifest: currentWithNoise, siteDomain, sitemapUrls: [U('/'), U('/page/2/')] }),
    [U('/')]
  );
});

// --- URL mapping: index.html -> / and nested about/index.html -> /about/ ---

test('index.html maps to the site root and about/index.html to /about/', () => {
  const mappingUrls = selectIndexNowUrls({
    previousManifest: previousEmpty,
    currentManifest: current,
    siteDomain,
    sitemapUrls: sitemap,
  });
  assert.ok(
    mappingUrls.includes(U('/')),
    `index.html did not map to site root: ${JSON.stringify(mappingUrls)}`
  );
  assert.ok(
    mappingUrls.includes(U('/about/')),
    `about/index.html did not map to /about/: ${JSON.stringify(mappingUrls)}`
  );
});

// --- selectAllIndexNowUrls: catch-up submits the sitemap, minus pagination ---

test('catch-up submits the sitemap, minus pagination', () => {
  assertUrlsEqual(
    'catch-up (no baseline needed)',
    selectAllIndexNowUrls({ sitemapUrls: sitemap }),
    [U('/'), U('/about/'), U('/2026/01/10/some-post/')]
  );
});

// --- readSitemapUrls: every <loc>, entities decoded ---

test('readSitemapUrls reads every <loc> and decodes entities', () => {
  const sitemapDir = fs.mkdtempSync(path.join(os.tmpdir(), 'indexnow-sitemap-'));
  try {
    fs.writeFileSync(
      path.join(sitemapDir, 'sitemap.xml'),
      '<?xml version="1.0"?><urlset><url><loc>https://jonplummer.com/</loc></url>\n<url>\n  <loc>\n    https://jonplummer.com/a?b=1&amp;c=2\n  </loc>\n</url></urlset>'
    );
    assertUrlsEqual('readSitemapUrls', readSitemapUrls(sitemapDir), [U('/'), U('/a?b=1&c=2')]);
  } finally {
    fs.rmSync(sitemapDir, { recursive: true, force: true });
  }
});

// --- processIndexNow: injected manifest, separate state file ---

test('processIndexNow uses the injected manifest, and a dry run leaves the state file alone', async () => {
  // siteRoot is deliberately bogus: if processIndexNow walked the tree instead
  // of using the manifest deploy.js already built, this would throw.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'indexnow-'));
  try {
    const statePath = path.join(tmp, 'indexnow-content-manifest.json');
    const previousState = manifest({ 'index.html': 'old' });
    fs.writeFileSync(statePath, `${JSON.stringify(previousState, null, 2)}\n`, 'utf8');

    const previousKey = process.env.INDEXNOW_API_KEY;
    process.env.INDEXNOW_API_KEY = 'test-key-not-used-in-dry-run';
    const originalLog = console.log;
    console.log = () => {};
    let injectedResult;
    try {
      injectedResult = await processIndexNow({
        siteRoot: path.join(tmp, 'does-not-exist'),
        siteDomain,
        dryRun: true,
        currentManifest: manifest({ 'index.html': 'new', 'about/index.html': 'added' }),
        sitemapUrls: sitemap,
        manifestPath: statePath,
      });
    } finally {
      console.log = originalLog;
      if (previousKey === undefined) delete process.env.INDEXNOW_API_KEY;
      else process.env.INDEXNOW_API_KEY = previousKey;
    }

    assertUrlsEqual('injected manifest', injectedResult.urls || [], [
      'https://jonplummer.com/',
      'https://jonplummer.com/about/',
    ]);

    // A dry run must not advance the cursor — that is what keeps this state
    // file independent of Cloudflare's, which deploy.js writes earlier.
    const stateAfter = fs.readFileSync(statePath, 'utf8');
    assert.strictEqual(
      JSON.parse(stateAfter).files['index.html'],
      'old',
      'dry run must not overwrite the IndexNow state file'
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
