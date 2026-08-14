#!/usr/bin/env node

/**
 * Unit checks for Cloudflare purge helpers: local content-hash manifest
 * diffing, `_site/` path → public URL mapping, and purge orchestration.
 */

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
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

runTest({
  testType: 'cloudflare-purge',
  testName: 'Cloudflare purge helpers',
  validateFn: async (result) => {
    const fileObj = addFile(result, 'scripts/utils/cloudflare-purge.js');

    const cssUrl = deployPathToUrl('assets/css/jonplummer.css', 'jonplummer.com');
    if (cssUrl !== 'https://jonplummer.com/assets/css/jonplummer.css') {
      addIssue(fileObj, {
        severity: 'error',
        type: 'cloudflare-purge-url',
        message: `unexpected css URL: ${cssUrl}`,
      });
    }

    const aboutUrl = deployPathToUrl('about/index.html', 'jonplummer.com');
    if (aboutUrl !== 'https://jonplummer.com/about/') {
      addIssue(fileObj, {
        severity: 'error',
        type: 'cloudflare-purge-url',
        message: `unexpected about URL: ${aboutUrl}`,
      });
    }

    const homeUrl = deployPathToUrl('index.html', 'jonplummer.com');
    if (homeUrl !== 'https://jonplummer.com/') {
      addIssue(fileObj, {
        severity: 'error',
        type: 'cloudflare-purge-url',
        message: `unexpected home URL: ${homeUrl}`,
      });
    }

    if (shouldPurgeDeployPath('.htaccess') !== false) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'cloudflare-purge-skip',
        message: 'expected shouldPurgeDeployPath(".htaccess") === false',
      });
    }
    if (shouldPurgeDeployPath('assets/css/jonplummer.css') !== true) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'cloudflare-purge-skip',
        message: 'expected CSS path to be purgeable',
      });
    }

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-purge-'));
    const siteA = path.join(tmp, 'site');
    fs.mkdirSync(path.join(siteA, 'assets/css'), { recursive: true });
    fs.writeFileSync(path.join(siteA, 'index.html'), '<html>a</html>\n');
    fs.writeFileSync(path.join(siteA, 'assets/css/jonplummer.css'), 'body{a:1}\n');
    fs.writeFileSync(path.join(siteA, '.htaccess'), 'Deny\n');

    const manA = buildContentManifest(siteA);
    if (
      !manA.files['index.html'] ||
      !manA.files['assets/css/jonplummer.css'] ||
      !manA.files['.htaccess']
    ) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'cloudflare-purge-manifest',
        message: `manifest missing expected keys: ${Object.keys(manA.files).join(', ')}`,
      });
    }

    fs.writeFileSync(path.join(siteA, 'index.html'), '<html>b</html>\n');
    fs.mkdirSync(path.join(siteA, 'about'), { recursive: true });
    fs.writeFileSync(path.join(siteA, 'about/index.html'), 'about\n');
    fs.unlinkSync(path.join(siteA, 'assets/css/jonplummer.css'));

    const manB = buildContentManifest(siteA);
    const diff = diffContentManifests(manA, manB);
    const changedOk = diff.changed.includes('index.html');
    const addedOk = diff.added.includes('about/index.html');
    const deletedOk = diff.deleted.includes('assets/css/jonplummer.css');
    if (!changedOk || !addedOk || !deletedOk) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'cloudflare-purge-diff',
        message: `unexpected diff: ${JSON.stringify(diff)}`,
      });
    }

    const urls = pathsToPurgeUrls(
      ['.htaccess', 'assets/css/jonplummer.css', 'about/index.html'],
      'jonplummer.com'
    );
    if (urls.some((u) => u.includes('.htaccess'))) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'cloudflare-purge-url-filter',
        message: `htaccess must not appear in purge URLs: ${urls.join(', ')}`,
      });
    }
    if (!urls.includes('https://jonplummer.com/about/')) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'cloudflare-purge-url-filter',
        message: `missing about URL in ${urls.join(', ')}`,
      });
    }

    fs.rmSync(tmp, { recursive: true, force: true });

    // --- loadContentManifest robustness ---

    const tmpManifests = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-purge-manifest-'));

    const missingPath = path.join(tmpManifests, 'missing.json');
    if (loadContentManifest(missingPath) !== null) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'load-content-manifest-missing',
        message: 'expected null for a missing manifest file',
      });
    }

    const corruptPath = path.join(tmpManifests, 'corrupt.json');
    fs.writeFileSync(corruptPath, '{ not valid json', 'utf8');
    if (loadContentManifest(corruptPath) !== null) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'load-content-manifest-corrupt',
        message: 'expected null for corrupt JSON',
      });
    }

    const noFilesKeyPath = path.join(tmpManifests, 'no-files-key.json');
    fs.writeFileSync(noFilesKeyPath, JSON.stringify({ version: 1, generatedAt: 'x' }), 'utf8');
    if (loadContentManifest(noFilesKeyPath) !== null) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'load-content-manifest-no-files',
        message: 'expected null when files key is missing',
      });
    }

    const emptyFilesPath = path.join(tmpManifests, 'empty-files.json');
    fs.writeFileSync(
      emptyFilesPath,
      JSON.stringify({ version: 1, generatedAt: 'x', files: {} }),
      'utf8'
    );
    if (loadContentManifest(emptyFilesPath) !== null) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'load-content-manifest-empty-files',
        message: 'expected null for an empty files map (do not treat as a real baseline)',
      });
    }

    const wrongVersionPath = path.join(tmpManifests, 'wrong-version.json');
    fs.writeFileSync(
      wrongVersionPath,
      JSON.stringify({ version: 2, generatedAt: 'x', files: { a: '1' } }),
      'utf8'
    );
    if (loadContentManifest(wrongVersionPath) !== null) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'load-content-manifest-wrong-version',
        message: 'expected null for an unsupported manifest version',
      });
    }

    const validPath = path.join(tmpManifests, 'valid.json');
    fs.writeFileSync(
      validPath,
      JSON.stringify({ version: 1, generatedAt: 'x', files: { a: '1' } }),
      'utf8'
    );
    const validManifest = loadContentManifest(validPath);
    if (!validManifest || validManifest.files.a !== '1') {
      addIssue(fileObj, {
        severity: 'error',
        type: 'load-content-manifest-valid',
        message: `expected a valid manifest to load, got ${JSON.stringify(validManifest)}`,
      });
    }

    fs.rmSync(tmpManifests, { recursive: true, force: true });

    // --- collectPurgePaths ---

    const currentManifest = { version: 1, generatedAt: 'x', files: { a: '1', b: '2', c: '3' } };
    const previousManifest = {
      version: 1,
      generatedAt: 'x',
      files: { a: '1', b: 'old-b', d: '4' },
    };

    const noBaseline = collectPurgePaths(null, currentManifest, { forceContent: false });
    if (noBaseline.mode !== 'no-baseline' || noBaseline.paths.length !== 0) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'collect-purge-paths-no-baseline',
        message: `expected no-baseline with empty paths, got ${JSON.stringify(noBaseline)}`,
      });
    }

    const noPreviousForced = collectPurgePaths(null, currentManifest, { forceContent: true });
    const noPreviousForcedSorted = [...noPreviousForced.paths].sort();
    if (JSON.stringify(noPreviousForcedSorted) !== JSON.stringify(['a', 'b', 'c'])) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'collect-purge-paths-force-no-previous',
        message: `expected all current keys, got ${JSON.stringify(noPreviousForced)}`,
      });
    }

    const previousForced = collectPurgePaths(previousManifest, currentManifest, {
      forceContent: true,
    });
    const previousForcedSorted = [...previousForced.paths].sort();
    if (JSON.stringify(previousForcedSorted) !== JSON.stringify(['a', 'b', 'c', 'd'])) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'collect-purge-paths-force-with-previous',
        message: `expected current keys plus deleted, got ${JSON.stringify(previousForced)}`,
      });
    }

    const diffMode = collectPurgePaths(previousManifest, currentManifest, {
      forceContent: false,
    });
    const diffModeSorted = [...diffMode.paths].sort();
    // changed: b (hash differs); deleted: d — added `c` must NOT be purged
    if (JSON.stringify(diffModeSorted) !== JSON.stringify(['b', 'd'])) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'collect-purge-paths-diff',
        message: `expected changed+deleted (no added), got ${JSON.stringify(diffMode)}`,
      });
    }

    // --- purgeChangedDeployContent (no-network paths only) ---

    const tmp2 = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-purge-orchestrate-'));
    const siteB = path.join(tmp2, 'site');
    const manifestPath = path.join(tmp2, 'manifest.json');
    fs.mkdirSync(siteB, { recursive: true });
    fs.writeFileSync(path.join(siteB, 'index.html'), '<html>one</html>\n');

    {
      // not configured
      const notConfigured = await purgeChangedDeployContent(siteB, 'jonplummer.com', {
        manifestPath,
        env: {},
      });
      if (notConfigured.skipped !== true || notConfigured.reason !== 'not-configured' || notConfigured.writeManifest !== false) {
        addIssue(fileObj, {
          severity: 'error',
          type: 'purge-changed-deploy-content-not-configured',
          message: `expected not-configured skip, got ${JSON.stringify(notConfigured)}`,
        });
      }

      const configuredEnv = { CLOUDFLARE_ZONE_ID: 'zone', CLOUDFLARE_API_TOKEN: 'token' };

      // no baseline (configured, but manifest file missing)
      const noBaselineResult = await purgeChangedDeployContent(siteB, 'jonplummer.com', {
        manifestPath,
        env: configuredEnv,
      });
      if (
        noBaselineResult.skipped !== true ||
        noBaselineResult.reason !== 'no-baseline' ||
        noBaselineResult.writeManifest !== true ||
        !noBaselineResult.currentManifest
      ) {
        addIssue(fileObj, {
          severity: 'error',
          type: 'purge-changed-deploy-content-no-baseline',
          message: `expected no-baseline skip with writeManifest true, got ${JSON.stringify({
            ...noBaselineResult,
            currentManifest: undefined,
          })}`,
        });
      }

      // Establish baseline, then re-run with unchanged content → no-changes
      saveContentManifest(manifestPath, noBaselineResult.currentManifest);
      const noChangesResult = await purgeChangedDeployContent(siteB, 'jonplummer.com', {
        manifestPath,
        env: configuredEnv,
      });
      if (
        noChangesResult.skipped !== true ||
        noChangesResult.reason !== 'no-changes' ||
        noChangesResult.writeManifest !== true
      ) {
        addIssue(fileObj, {
          severity: 'error',
          type: 'purge-changed-deploy-content-no-changes',
          message: `expected no-changes skip with writeManifest true, got ${JSON.stringify({
            ...noChangesResult,
            currentManifest: undefined,
          })}`,
        });
      }

      // Change content, dry-run → would-purge list, no manifest write
      fs.writeFileSync(path.join(siteB, 'index.html'), '<html>two</html>\n');
      const dryRunResult = await purgeChangedDeployContent(siteB, 'jonplummer.com', {
        manifestPath,
        dryRun: true,
        env: {},
      });
      if (
        dryRunResult.dryRun !== true ||
        dryRunResult.writeManifest !== false ||
        !dryRunResult.urls.includes('https://jonplummer.com/')
      ) {
        addIssue(fileObj, {
          severity: 'error',
          type: 'purge-changed-deploy-content-dry-run',
          message: `expected dry-run would-purge result, got ${JSON.stringify({
            ...dryRunResult,
            currentManifest: undefined,
          })}`,
        });
      }

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
      if (
        injectedResult.currentManifest !== injected ||
        !injectedResult.urls.includes('https://jonplummer.com/')
      ) {
        addIssue(fileObj, {
          severity: 'error',
          type: 'purge-changed-deploy-content-injected-manifest',
          message: `expected the injected manifest to drive the diff, got ${JSON.stringify({
            ...injectedResult,
            currentManifest: undefined,
          })}`,
        });
      }

      fs.rmSync(tmp2, { recursive: true, force: true });
    }
  },
});
