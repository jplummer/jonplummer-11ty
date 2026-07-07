#!/usr/bin/env node

/**
 * Unit checks for Cloudflare purge helpers (rsync itemize → public URLs).
 */

const {
  parseRsyncItemizedChanges,
  deployPathToUrl,
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
  },
});
