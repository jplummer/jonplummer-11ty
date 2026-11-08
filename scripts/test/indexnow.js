#!/usr/bin/env node

/**
 * Unit checks for IndexNow URL selection: local content-hash manifest diff
 * → indexable-page filter → public URL mapping. No network; selection runs on
 * fixture manifests, and the one orchestration check uses a temp state file.
 * The previous version of this test validated plumbing (env vars, git commands)
 * but let real problems pass — several checks ended in
 * `return true; // Not a failure, just informational`, which is why it stayed
 * green through 16 deploys that submitted zero URLs.
 */

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
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

function manifest(files) {
  return { version: 1, generatedAt: 'x', files };
}

function assertUrlsEqual(fileObj, label, actual, expected) {
  const a = [...actual].sort();
  const b = [...expected].sort();
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'indexnow-selection',
      message: `${label}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`,
    });
  }
}

runTest({
  testType: 'indexnow',
  testName: 'IndexNow URL selection',
  validateFn: async (result) => {
    const fileObj = addFile(result, 'scripts/utils/indexnow.js');
    const siteDomain = 'jonplummer.com';

    // --- isIndexableHtmlPath ---

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
    for (const [p, expected] of indexableCases) {
      const actual = isIndexableHtmlPath(p);
      if (actual !== expected) {
        addIssue(fileObj, {
          severity: 'error',
          type: 'indexnow-filter',
          message: `isIndexableHtmlPath(${JSON.stringify(p)}): expected ${expected}, got ${actual}`,
        });
      }
    }

    // The sitemap bounds every selection below
    const U = (p) => `https://jonplummer.com${p}`;
    const sitemap = [U('/'), U('/about/'), U('/2026/01/10/some-post/'), U('/page/2/')];
    const withSitemap = (m, urls = sitemap) => ({ ...m, sitemapUrls: urls });

    // --- selectIndexNowUrls: no baseline ---

    const current = manifest({
      'index.html': '1',
      'about/index.html': '2',
      'assets/css/jonplummer.css': '3',
    });

    assertUrlsEqual(
      fileObj,
      'no baseline',
      selectIndexNowUrls({ previousManifest: null, currentManifest: current, siteDomain, sitemapUrls: sitemap }),
      []
    );

    // --- selectIndexNowUrls: added-only ---

    const previousEmpty = manifest({});
    assertUrlsEqual(
      fileObj,
      'added-only',
      selectIndexNowUrls({ previousManifest: previousEmpty, currentManifest: current, siteDomain, sitemapUrls: sitemap }),
      [U('/'), U('/about/')]
      // assets/css/jonplummer.css is added too, but not HTML, so excluded
    );

    // --- selectIndexNowUrls: changed-only ---

    const previousSamePaths = manifest({
      'index.html': 'old-hash',
      'about/index.html': '2', // unchanged
      'assets/css/jonplummer.css': '3',
    });
    assertUrlsEqual(
      fileObj,
      'changed-only',
      selectIndexNowUrls({ previousManifest: previousSamePaths, currentManifest: current, siteDomain, sitemapUrls: sitemap }),
      [U('/')]
    );

    // --- selectIndexNowUrls: added + changed together ---

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
      fileObj,
      'added + changed',
      selectIndexNowUrls({
        previousManifest: previousBeforePost,
        currentManifest: currentWithNewPost,
        siteDomain,
        sitemapUrls: sitemap,
      }),
      [U('/'), U('/2026/01/10/some-post/')]
    );

    // --- selectIndexNowUrls: changed pages outside the sitemap are not submitted ---
    // /changelog/ is noindex and changes on every deploy; demos and the
    // Google verification file aren't pages to index either.

    assertUrlsEqual(
      fileObj,
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

    // --- selectIndexNowUrls: a deleted page that was in the sitemap is submitted ---

    const previousWithExtraPost = withSitemap(manifest({
      'index.html': '1',
      'about/index.html': '2',
      '2020/01/01/old-post/index.html': 'gone',
    }), [...sitemap, U('/2020/01/01/old-post/')]);
    const currentAfterDelete = manifest({
      'index.html': '1',
      'about/index.html': '2',
    });
    assertUrlsEqual(
      fileObj,
      'deleted page submitted',
      selectIndexNowUrls({
        previousManifest: previousWithExtraPost,
        currentManifest: currentAfterDelete,
        siteDomain,
        sitemapUrls: sitemap,
      }),
      [U('/2020/01/01/old-post/')]
    );

    // --- selectIndexNowUrls: a page newly marked noindex leaves the sitemap and is submitted ---

    assertUrlsEqual(
      fileObj,
      'newly noindexed page submitted',
      selectIndexNowUrls({
        previousManifest: withSitemap(manifest({ 'index.html': '1', 'about/index.html': '2' })),
        currentManifest: manifest({ 'index.html': '1', 'about/index.html': '2-noindex' }),
        siteDomain,
        sitemapUrls: sitemap.filter((u) => u !== U('/about/')),
      }),
      [U('/about/')]
    );

    // --- selectIndexNowUrls: a page that joins the sitemap unchanged is submitted ---

    assertUrlsEqual(
      fileObj,
      'joined the sitemap',
      selectIndexNowUrls({
        previousManifest: withSitemap(manifest({ 'index.html': '1' }), [U('/')]),
        currentManifest: manifest({ 'index.html': '1' }),
        siteDomain,
        sitemapUrls: [U('/'), U('/about/')],
      }),
      [U('/about/')]
    );

    // --- selectIndexNowUrls: state without a recorded sitemap (written before
    // 2026-11-08) can't tell what left, so it submits only changed pages ---

    assertUrlsEqual(
      fileObj,
      'no recorded sitemap: no deletions guessed',
      selectIndexNowUrls({
        previousManifest: previousWithExtraPost.files && manifest(previousWithExtraPost.files),
        currentManifest: currentAfterDelete,
        siteDomain,
        sitemapUrls: sitemap,
      }),
      []
    );

    // --- selectIndexNowUrls: non-HTML, 404/500, and paginated pages excluded ---

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
      fileObj,
      'noise excluded',
      // /page/2/ joined the sitemap here, and is still left out
      selectIndexNowUrls({ previousManifest: previousBase, currentManifest: currentWithNoise, siteDomain, sitemapUrls: [U('/'), U('/page/2/')] }),
      [U('/')]
    );

    // --- URL mapping: index.html -> / and nested about/index.html -> /about/ ---

    const mappingUrls = selectIndexNowUrls({
      previousManifest: previousEmpty,
      currentManifest: current,
      siteDomain,
      sitemapUrls: sitemap,
    });
    if (!mappingUrls.includes(U('/'))) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'indexnow-url-mapping',
        message: `index.html did not map to site root: ${JSON.stringify(mappingUrls)}`,
      });
    }
    if (!mappingUrls.includes(U('/about/'))) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'indexnow-url-mapping',
        message: `about/index.html did not map to /about/: ${JSON.stringify(mappingUrls)}`,
      });
    }

    // --- selectAllIndexNowUrls: catch-up submits the sitemap, minus pagination ---

    assertUrlsEqual(
      fileObj,
      'catch-up (no baseline needed)',
      selectAllIndexNowUrls({ sitemapUrls: sitemap }),
      [U('/'), U('/about/'), U('/2026/01/10/some-post/')]
    );

    // --- readSitemapUrls: every <loc>, entities decoded ---

    const sitemapDir = fs.mkdtempSync(path.join(os.tmpdir(), 'indexnow-sitemap-'));
    fs.writeFileSync(
      path.join(sitemapDir, 'sitemap.xml'),
      '<?xml version="1.0"?><urlset><url><loc>https://jonplummer.com/</loc></url>\n<url>\n  <loc>\n    https://jonplummer.com/a?b=1&amp;c=2\n  </loc>\n</url></urlset>'
    );
    assertUrlsEqual(fileObj, 'readSitemapUrls', readSitemapUrls(sitemapDir), [U('/'), U('/a?b=1&c=2')]);
    fs.rmSync(sitemapDir, { recursive: true, force: true });

    // --- processIndexNow: injected manifest, separate state file ---

    // siteRoot is deliberately bogus: if processIndexNow walked the tree instead
    // of using the manifest deploy.js already built, this would throw.
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'indexnow-'));
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

    assertUrlsEqual(fileObj, 'injected manifest', injectedResult.urls || [], [
      'https://jonplummer.com/',
      'https://jonplummer.com/about/',
    ]);

    // A dry run must not advance the cursor — that is what keeps this state
    // file independent of Cloudflare's, which deploy.js writes earlier.
    const stateAfter = fs.readFileSync(statePath, 'utf8');
    if (JSON.parse(stateAfter).files['index.html'] !== 'old') {
      addIssue(fileObj, {
        severity: 'error',
        type: 'indexnow-state-write',
        message: 'dry run must not overwrite the IndexNow state file',
      });
    }

    fs.rmSync(tmp, { recursive: true, force: true });
  },
});
