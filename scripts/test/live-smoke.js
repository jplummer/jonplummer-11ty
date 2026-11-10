#!/usr/bin/env node

/**
 * Unit checks for scripts/utils/live-smoke.js: the list of checks that
 * `pnpm run smoke` makes against the live site, and how a response is judged.
 * No network. The live run itself is scripts/deploy/smoke-live.js.
 */

const assert = require('assert');
const { buildSmokeChecks, evaluateResponse, sameLocation } = require('../utils/live-smoke');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

function runUnitAssertions(result) {
  const file = addFile(result, 'scripts/utils/live-smoke.js', 'live-smoke');

  function check(name, fn) {
    try {
      fn();
    } catch (err) {
      addIssue(file, {
        type: 'live-smoke',
        message: `${name}: ${err.message}`,
        ruleId: 'live-smoke',
      });
    }
  }

  const fixture = {
    redirects: [{ from: '/old/', to: '/new/' }, { from: '/resume', to: 'https://misc.example.com/r.pdf' }],
    shortlinks: [{ slug: 'JP', to: 'https://example.com/' }],
    retiredListUrls: ['/portfolio/acme/'],
    sitemapUrls: ['https://example.com/', 'https://example.com/2026/10/28/a-post/', 'https://example.com/portfolio/a-piece/', 'https://example.com/page/2/'],
    rootFiles: ['google123.html', 'abc.txt'],
    nonce: 'n0nce',
  };
  const base = 'https://example.com';
  const byGroup = (g) => buildSmokeChecks(fixture).filter((c) => c.group === g);

  check('one redirect check per redirects.yaml entry', () => {
    assert.deepStrictEqual(byGroup('redirects').map((c) => c.path), ['/old/', '/resume']);
    assert.strictEqual(byGroup('redirects')[0].expect.status, 301);
  });

  check('retired lists are checked with and without the slash', () => {
    assert.deepStrictEqual(byGroup('retired-lists').map((c) => c.path), ['/portfolio/acme/', '/portfolio/acme']);
  });

  check('the 404 path carries the nonce, so no cache has seen it', () => {
    assert.strictEqual(byGroup('error-page')[0].path, '/smoke-n0nce/');
  });

  check('root files come from the list passed in', () => {
    const paths = byGroup('root-files').map((c) => c.path);
    assert.ok(paths.includes('/google123.html') && paths.includes('/abc.txt'));
  });

  check('page sample takes one URL per template pattern from the sitemap', () => {
    const paths = byGroup('pages').map((c) => c.path);
    assert.ok(paths.includes('/2026/10/28/a-post/') && paths.includes('/portfolio/a-piece/') && paths.includes('/page/2/'));
  });

  check('a relative Location target matches an absolute Location header', () => {
    assert.strictEqual(sameLocation('https://example.com/new/', '/new/', base), true);
    assert.strictEqual(sameLocation('https://example.com/new', '/new/', base), true);
    assert.strictEqual(sameLocation('https://other.example.com/new/', '/new/', base), false);
  });

  check('evaluateResponse reports status, location, header, and body failures', () => {
    const c = { group: 'x', path: '/a', expect: { status: 301, location: '/b/', headers: { 'x-frame-options': 'SAMEORIGIN' }, includes: ['needle'] } };
    assert.deepStrictEqual(evaluateResponse(c, { status: 301, headers: { location: 'https://example.com/b/', 'x-frame-options': 'sameorigin' }, body: 'a needle' }, base), []);
    assert.strictEqual(evaluateResponse(c, { status: 200, headers: {}, body: '' }, base).length, 4);
  });

  check('notStatus fails only on that status', () => {
    const c = { group: 'blocked', path: '/.env', expect: { notStatus: 200 } };
    assert.deepStrictEqual(evaluateResponse(c, { status: 403, headers: {}, body: '' }, base), []);
    assert.strictEqual(evaluateResponse(c, { status: 200, headers: {}, body: '' }, base).length, 1);
  });
}

runTest({
  testType: 'live-smoke',
  testName: 'Live smoke checks',
  requiresSite: false,
  validateFn: async (result) => {
    runUnitAssertions(result);
  },
});
