#!/usr/bin/env node

/**
 * Unit checks for Cloudflare purge helpers (scripts/utils/cloudflare-purge.js):
 * local content-hash manifest diffing, `_site/` path → public URL mapping, and
 * purge orchestration. Every fixture lives in a temp directory, and every
 * orchestration call passes its own `manifestPath` and `env`, so the real
 * `.cache/` is never read or written and no network call is made.
 */

const { test } = require('node:test');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  deployPathToUrl,
  buildContentManifest,
  diffContentManifests,
  shouldPurgeDeployPath,
  pathsToPurgeUrls,
  collectPurgePaths,
  purgeChangedDeployContent,
  loadContentManifest,
  saveContentManifest,
} = require('../utils/cloudflare-purge');

/**
 * Wraps a test body so it runs against a fresh temp directory, removed
 * afterward whether the body passes, fails an assertion, or throws.
 */
function withTempDir(prefix, fn) {
  return async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
    try {
      await fn(dir);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };
}

// --- path → URL mapping ---

test('maps _site paths to public URLs', () => {
  const cssUrl = deployPathToUrl('assets/css/jonplummer.css', 'jonplummer.com');
  assert.strictEqual(
    cssUrl,
    'https://jonplummer.com/assets/css/jonplummer.css',
    `unexpected css URL: ${cssUrl}`
  );

  const aboutUrl = deployPathToUrl('about/index.html', 'jonplummer.com');
  assert.strictEqual(aboutUrl, 'https://jonplummer.com/about/', `unexpected about URL: ${aboutUrl}`);

  const homeUrl = deployPathToUrl('index.html', 'jonplummer.com');
  assert.strictEqual(homeUrl, 'https://jonplummer.com/', `unexpected home URL: ${homeUrl}`);
});

test('.htaccess is not a purge target; a stylesheet is', () => {
  assert.strictEqual(
    shouldPurgeDeployPath('.htaccess'),
    false,
    'expected shouldPurgeDeployPath(".htaccess") === false'
  );
  assert.strictEqual(
    shouldPurgeDeployPath('assets/css/jonplummer.css'),
    true,
    'expected CSS path to be purgeable'
  );
});

// --- content manifest and diffing ---

function makeSiteA(tmp) {
  const siteA = path.join(tmp, 'site');
  fs.mkdirSync(path.join(siteA, 'assets/css'), { recursive: true });
  fs.writeFileSync(path.join(siteA, 'index.html'), '<html>a</html>\n');
  fs.writeFileSync(path.join(siteA, 'assets/css/jonplummer.css'), 'body{a:1}\n');
  fs.writeFileSync(path.join(siteA, '.htaccess'), 'Deny\n');
  return siteA;
}

test('content manifest lists every file under the site root', withTempDir('cf-purge-', (tmp) => {
  const siteA = makeSiteA(tmp);
  const manA = buildContentManifest(siteA);
  const message = `manifest missing expected keys: ${Object.keys(manA.files).join(', ')}`;
  assert.ok(manA.files['index.html'], message);
  assert.ok(manA.files['assets/css/jonplummer.css'], message);
  assert.ok(manA.files['.htaccess'], message);
}));

test('manifest diff reports changed, added, and deleted paths', withTempDir('cf-purge-', (tmp) => {
  const siteA = makeSiteA(tmp);
  const manA = buildContentManifest(siteA);

  fs.writeFileSync(path.join(siteA, 'index.html'), '<html>b</html>\n');
  fs.mkdirSync(path.join(siteA, 'about'), { recursive: true });
  fs.writeFileSync(path.join(siteA, 'about/index.html'), 'about\n');
  fs.unlinkSync(path.join(siteA, 'assets/css/jonplummer.css'));

  const manB = buildContentManifest(siteA);
  const diff = diffContentManifests(manA, manB);
  const message = `unexpected diff: ${JSON.stringify(diff)}`;
  assert.ok(diff.changed.includes('index.html'), message);
  assert.ok(diff.added.includes('about/index.html'), message);
  assert.ok(diff.deleted.includes('assets/css/jonplummer.css'), message);
}));

test('purge URL list leaves out .htaccess and maps the other paths', () => {
  const urls = pathsToPurgeUrls(
    ['.htaccess', 'assets/css/jonplummer.css', 'about/index.html'],
    'jonplummer.com'
  );
  assert.ok(
    !urls.some((u) => u.includes('.htaccess')),
    `htaccess must not appear in purge URLs: ${urls.join(', ')}`
  );
  assert.ok(
    urls.includes('https://jonplummer.com/about/'),
    `missing about URL in ${urls.join(', ')}`
  );
});

// --- loadContentManifest robustness ---

test('loading a missing manifest file gives null', withTempDir('cf-purge-manifest-', (tmpManifests) => {
  const missingPath = path.join(tmpManifests, 'missing.json');
  assert.strictEqual(
    loadContentManifest(missingPath),
    null,
    'expected null for a missing manifest file'
  );
}));

test('loading corrupt JSON gives null', withTempDir('cf-purge-manifest-', (tmpManifests) => {
  const corruptPath = path.join(tmpManifests, 'corrupt.json');
  fs.writeFileSync(corruptPath, '{ not valid json', 'utf8');
  assert.strictEqual(loadContentManifest(corruptPath), null, 'expected null for corrupt JSON');
}));

test('loading a manifest with no files key gives null', withTempDir('cf-purge-manifest-', (tmpManifests) => {
  const noFilesKeyPath = path.join(tmpManifests, 'no-files-key.json');
  fs.writeFileSync(noFilesKeyPath, JSON.stringify({ version: 1, generatedAt: 'x' }), 'utf8');
  assert.strictEqual(
    loadContentManifest(noFilesKeyPath),
    null,
    'expected null when files key is missing'
  );
}));

test('loading a manifest with an empty files map gives null', withTempDir('cf-purge-manifest-', (tmpManifests) => {
  const emptyFilesPath = path.join(tmpManifests, 'empty-files.json');
  fs.writeFileSync(
    emptyFilesPath,
    JSON.stringify({ version: 1, generatedAt: 'x', files: {} }),
    'utf8'
  );
  assert.strictEqual(
    loadContentManifest(emptyFilesPath),
    null,
    'expected null for an empty files map (do not treat as a real baseline)'
  );
}));

test('loading a manifest with an unsupported version gives null', withTempDir('cf-purge-manifest-', (tmpManifests) => {
  const wrongVersionPath = path.join(tmpManifests, 'wrong-version.json');
  fs.writeFileSync(
    wrongVersionPath,
    JSON.stringify({ version: 2, generatedAt: 'x', files: { a: '1' } }),
    'utf8'
  );
  assert.strictEqual(
    loadContentManifest(wrongVersionPath),
    null,
    'expected null for an unsupported manifest version'
  );
}));

test('loading a valid manifest returns its files', withTempDir('cf-purge-manifest-', (tmpManifests) => {
  const validPath = path.join(tmpManifests, 'valid.json');
  fs.writeFileSync(
    validPath,
    JSON.stringify({ version: 1, generatedAt: 'x', files: { a: '1' } }),
    'utf8'
  );
  const validManifest = loadContentManifest(validPath);
  const message = `expected a valid manifest to load, got ${JSON.stringify(validManifest)}`;
  assert.ok(validManifest, message);
  assert.strictEqual(validManifest.files.a, '1', message);
}));

// --- collectPurgePaths ---

const currentManifest = { version: 1, generatedAt: 'x', files: { a: '1', b: '2', c: '3' } };
const previousManifest = {
  version: 1,
  generatedAt: 'x',
  files: { a: '1', b: 'old-b', d: '4' },
};

test('with no previous manifest, nothing is collected for purging', () => {
  const noBaseline = collectPurgePaths(null, currentManifest, { forceContent: false });
  const message = `expected no-baseline with empty paths, got ${JSON.stringify(noBaseline)}`;
  assert.strictEqual(noBaseline.mode, 'no-baseline', message);
  assert.strictEqual(noBaseline.paths.length, 0, message);
});

test('forcing content with no previous manifest collects every current path', () => {
  const noPreviousForced = collectPurgePaths(null, currentManifest, { forceContent: true });
  const noPreviousForcedSorted = [...noPreviousForced.paths].sort();
  assert.deepStrictEqual(
    noPreviousForcedSorted,
    ['a', 'b', 'c'],
    `expected all current keys, got ${JSON.stringify(noPreviousForced)}`
  );
});

test('forcing content with a previous manifest collects current paths plus deleted ones', () => {
  const previousForced = collectPurgePaths(previousManifest, currentManifest, {
    forceContent: true,
  });
  const previousForcedSorted = [...previousForced.paths].sort();
  assert.deepStrictEqual(
    previousForcedSorted,
    ['a', 'b', 'c', 'd'],
    `expected current keys plus deleted, got ${JSON.stringify(previousForced)}`
  );
});

test('a normal diff collects changed and deleted paths, not added ones', () => {
  const diffMode = collectPurgePaths(previousManifest, currentManifest, {
    forceContent: false,
  });
  const diffModeSorted = [...diffMode.paths].sort();
  // changed: b (hash differs); deleted: d — added `c` must NOT be purged
  assert.deepStrictEqual(
    diffModeSorted,
    ['b', 'd'],
    `expected changed+deleted (no added), got ${JSON.stringify(diffMode)}`
  );
});

// --- purgeChangedDeployContent (no-network paths only) ---

const configuredEnv = { CLOUDFLARE_ZONE_ID: 'zone', CLOUDFLARE_API_TOKEN: 'token' };

function makeSiteB(tmp2) {
  const siteB = path.join(tmp2, 'site');
  const manifestPath = path.join(tmp2, 'manifest.json');
  fs.mkdirSync(siteB, { recursive: true });
  fs.writeFileSync(path.join(siteB, 'index.html'), '<html>one</html>\n');
  return { siteB, manifestPath };
}

/** The configured run with no manifest file yet: skips, and hands back the manifest to save. */
function runWithNoBaseline(siteB, manifestPath) {
  return purgeChangedDeployContent(siteB, 'jonplummer.com', {
    manifestPath,
    env: configuredEnv,
  });
}

/** Saves the first run's manifest as the baseline, the way a real first deploy does. */
async function establishBaseline(siteB, manifestPath) {
  const noBaselineResult = await runWithNoBaseline(siteB, manifestPath);
  saveContentManifest(manifestPath, noBaselineResult.currentManifest);
}

test('purge is skipped when Cloudflare is not configured', withTempDir('cf-purge-orchestrate-', async (tmp2) => {
  const { siteB, manifestPath } = makeSiteB(tmp2);
  const notConfigured = await purgeChangedDeployContent(siteB, 'jonplummer.com', {
    manifestPath,
    env: {},
  });
  const message = `expected not-configured skip, got ${JSON.stringify(notConfigured)}`;
  assert.strictEqual(notConfigured.skipped, true, message);
  assert.strictEqual(notConfigured.reason, 'not-configured', message);
  assert.strictEqual(notConfigured.writeManifest, false, message);
}));

test('first configured run has no baseline: skips the purge and asks for the manifest to be written', withTempDir('cf-purge-orchestrate-', async (tmp2) => {
  const { siteB, manifestPath } = makeSiteB(tmp2);
  // no baseline (configured, but manifest file missing)
  const noBaselineResult = await runWithNoBaseline(siteB, manifestPath);
  const message = `expected no-baseline skip with writeManifest true, got ${JSON.stringify({
    ...noBaselineResult,
    currentManifest: undefined,
  })}`;
  assert.strictEqual(noBaselineResult.skipped, true, message);
  assert.strictEqual(noBaselineResult.reason, 'no-baseline', message);
  assert.strictEqual(noBaselineResult.writeManifest, true, message);
  assert.ok(noBaselineResult.currentManifest, message);
}));

test('unchanged content against a baseline skips the purge', withTempDir('cf-purge-orchestrate-', async (tmp2) => {
  const { siteB, manifestPath } = makeSiteB(tmp2);
  // Establish baseline, then re-run with unchanged content → no-changes
  await establishBaseline(siteB, manifestPath);
  const noChangesResult = await purgeChangedDeployContent(siteB, 'jonplummer.com', {
    manifestPath,
    env: configuredEnv,
  });
  const message = `expected no-changes skip with writeManifest true, got ${JSON.stringify({
    ...noChangesResult,
    currentManifest: undefined,
  })}`;
  assert.strictEqual(noChangesResult.skipped, true, message);
  assert.strictEqual(noChangesResult.reason, 'no-changes', message);
  assert.strictEqual(noChangesResult.writeManifest, true, message);
}));

test('dry run lists the URLs it would purge and does not write the manifest', withTempDir('cf-purge-orchestrate-', async (tmp2) => {
  const { siteB, manifestPath } = makeSiteB(tmp2);
  await establishBaseline(siteB, manifestPath);
  // Change content, dry-run → would-purge list, no manifest write
  fs.writeFileSync(path.join(siteB, 'index.html'), '<html>two</html>\n');
  const dryRunResult = await purgeChangedDeployContent(siteB, 'jonplummer.com', {
    manifestPath,
    dryRun: true,
    env: {},
  });
  const message = `expected dry-run would-purge result, got ${JSON.stringify({
    ...dryRunResult,
    currentManifest: undefined,
  })}`;
  assert.strictEqual(dryRunResult.dryRun, true, message);
  assert.strictEqual(dryRunResult.writeManifest, false, message);
  assert.ok(dryRunResult.urls.includes('https://jonplummer.com/'), message);
}));

test('a pre-built currentManifest is used as given, without walking siteRoot', withTempDir('cf-purge-orchestrate-', async (tmp2) => {
  const { siteB, manifestPath } = makeSiteB(tmp2);
  await establishBaseline(siteB, manifestPath);
  // Injected currentManifest must be used verbatim. siteRoot is deliberately
  // bogus: if the tree were walked anyway this call would throw, so success
  // proves deploy.js's single shared hash walk is honored.
  const injected = {
    version: 1,
    generatedAt: 'x',
    files: { 'index.html': 'injected-hash', 'about/index.html': 'injected-hash' },
  };
  const injectedResult = await purgeChangedDeployContent(
    path.join(tmp2, 'does-not-exist'),
    'jonplummer.com',
    { manifestPath, dryRun: true, env: {}, currentManifest: injected }
  );
  const message = `expected the injected manifest to drive the diff, got ${JSON.stringify({
    ...injectedResult,
    currentManifest: undefined,
  })}`;
  assert.strictEqual(injectedResult.currentManifest, injected, message);
  assert.ok(injectedResult.urls.includes('https://jonplummer.com/'), message);
}));

// --- shortlink URLs follow .htaccess changes ---

const shortlinkFixture = [{ slug: 'JP', to: 'https://jonplummer.com/about/' }];
const expectedShort = [
  'https://jonplummer.com/JP',
  'https://jonplummer.com/JP/',
  'https://jonplummer.com/jp',
  'https://jonplummer.com/jp/',
];

/** A site whose baseline manifest is saved, and whose .htaccess then retargets the JP shortlink. */
function makeSiteCWithHtaccessChange(tmp2) {
  const siteC = path.join(tmp2, 'site-htaccess');
  const manifestC = path.join(tmp2, 'manifest-htaccess.json');
  fs.mkdirSync(siteC, { recursive: true });
  fs.writeFileSync(path.join(siteC, 'index.html'), '<html>stable</html>\n');
  fs.writeFileSync(path.join(siteC, '.htaccess'), 'RewriteRule ^JP/?$ https://jonplummer.com/ [R=302,NC,L]\n');
  const baselineC = buildContentManifest(siteC);
  saveContentManifest(manifestC, baselineC);
  fs.writeFileSync(
    path.join(siteC, '.htaccess'),
    'RewriteRule ^JP/?$ https://jonplummer.com/about/ [R=302,NC,L]\n'
  );
  return { siteC, manifestC };
}

test('an .htaccess change purges every shortlink URL but not .htaccess itself', withTempDir('cf-purge-orchestrate-', async (tmp2) => {
  // .htaccess-only change must purge shortlink apex URLs (htaccess itself is skipped)
  const { siteC, manifestC } = makeSiteCWithHtaccessChange(tmp2);
  const htaccessPurge = await purgeChangedDeployContent(siteC, 'jonplummer.com', {
    manifestPath: manifestC,
    dryRun: true,
    env: {},
    shortlinks: shortlinkFixture,
  });
  const missingShort = expectedShort.filter((u) => !htaccessPurge.urls.includes(u));
  const message = `expected shortlink purge URLs after .htaccess change; missing=${missingShort.join(', ') || 'none'}; urls=${htaccessPurge.urls.join(', ')}`;
  assert.strictEqual(missingShort.length, 0, message);
  assert.ok(!htaccessPurge.urls.some((u) => u.includes('.htaccess')), message);
}));

test('a content-only change does not purge shortlink URLs', withTempDir('cf-purge-orchestrate-', async (tmp2) => {
  const { siteC, manifestC } = makeSiteCWithHtaccessChange(tmp2);
  // Content-only change (htaccess unchanged) must not add shortlink URLs
  saveContentManifest(manifestC, buildContentManifest(siteC));
  fs.writeFileSync(path.join(siteC, 'index.html'), '<html>changed</html>\n');
  const contentOnly = await purgeChangedDeployContent(siteC, 'jonplummer.com', {
    manifestPath: manifestC,
    dryRun: true,
    env: {},
    shortlinks: shortlinkFixture,
  });
  assert.ok(
    !expectedShort.some((u) => contentOnly.urls.includes(u)),
    `shortlink URLs must not purge when only HTML changed: ${contentOnly.urls.join(', ')}`
  );
}));
