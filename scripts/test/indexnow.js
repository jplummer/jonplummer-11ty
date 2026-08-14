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

    // --- selectIndexNowUrls: no baseline ---

    const current = manifest({
      'index.html': '1',
      'about/index.html': '2',
      'assets/css/jonplummer.css': '3',
    });

    assertUrlsEqual(
      fileObj,
      'no baseline',
      selectIndexNowUrls({ previousManifest: null, currentManifest: current, siteDomain }),
      []
    );

    // --- selectIndexNowUrls: added-only ---

    const previousEmpty = manifest({});
    assertUrlsEqual(
      fileObj,
      'added-only',
      selectIndexNowUrls({ previousManifest: previousEmpty, currentManifest: current, siteDomain }),
      ['https://jonplummer.com/', 'https://jonplummer.com/about/']
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
      selectIndexNowUrls({ previousManifest: previousSamePaths, currentManifest: current, siteDomain }),
      ['https://jonplummer.com/']
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
      }),
      ['https://jonplummer.com/', 'https://jonplummer.com/2026/01/10/some-post/']
    );

    // --- selectIndexNowUrls: deleted excluded ---

    const previousWithExtraPost = manifest({
      'index.html': '1',
      'about/index.html': '2',
      '2020/01/01/old-post/index.html': 'gone',
    });
    const currentAfterDelete = manifest({
      'index.html': '1',
      'about/index.html': '2',
    });
    assertUrlsEqual(
      fileObj,
      'deleted excluded',
      selectIndexNowUrls({
        previousManifest: previousWithExtraPost,
        currentManifest: currentAfterDelete,
        siteDomain,
      }),
      []
    );

    // --- selectIndexNowUrls: non-HTML, 404/500, and paginated pages excluded ---

    const previousBase = manifest({ 'index.html': '1' });
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
      selectIndexNowUrls({ previousManifest: previousBase, currentManifest: currentWithNoise, siteDomain }),
      ['https://jonplummer.com/']
    );

    // --- URL mapping: index.html -> / and nested about/index.html -> /about/ ---

    const mappingUrls = selectIndexNowUrls({
      previousManifest: previousEmpty,
      currentManifest: current,
      siteDomain,
    });
    if (!mappingUrls.includes('https://jonplummer.com/')) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'indexnow-url-mapping',
        message: `index.html did not map to site root: ${JSON.stringify(mappingUrls)}`,
      });
    }
    if (!mappingUrls.includes('https://jonplummer.com/about/')) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'indexnow-url-mapping',
        message: `about/index.html did not map to /about/: ${JSON.stringify(mappingUrls)}`,
      });
    }

    // --- selectAllIndexNowUrls: catch-up ignores manifest history ---

    assertUrlsEqual(
      fileObj,
      'catch-up (no baseline needed)',
      selectAllIndexNowUrls({ currentManifest: current, siteDomain }),
      ['https://jonplummer.com/', 'https://jonplummer.com/about/']
    );

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
