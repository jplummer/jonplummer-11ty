#!/usr/bin/env node

/**
 * Unit checks for Cloudflare purge helpers (rsync itemize → public URLs).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  parseRsyncItemizedChanges,
  deployPathToUrl,
  buildContentManifest,
  diffContentManifests,
  shouldPurgeDeployPath,
  pathsToPurgeUrls,
} = require('../utils/cloudflare-purge');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

runTest({
  testType: 'cloudflare-purge',
  testName: 'Cloudflare purge helpers',
  validateFn: (result) => {
    const fileObj = addFile(result, 'scripts/utils/cloudflare-purge.js');

    const sample = [
      '>f+++++++ assets/css/jonplummer.css',
      '>f..t..g. about/index.html',
      '.d..t..g. ./',
      '*deleting   old-page/index.html',
      '',
    ].join('\n');

    const paths = parseRsyncItemizedChanges(sample);
    if (paths.length !== 3) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'cloudflare-purge-parse',
        message: `expected 3 changed paths, got ${paths.length}: ${paths.join(', ')}`,
      });
    }

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
    if (!manA.files['index.html'] || !manA.files['assets/css/jonplummer.css']) {
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
  },
});
