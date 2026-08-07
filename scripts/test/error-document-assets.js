#!/usr/bin/env node

/**
 * ErrorDocument 404 is served at arbitrary fake URLs. Relative asset hrefs
 * break when the browser URL has a trailing slash (e.g. /moof/). Built
 * 404.html must use root-absolute /assets/... and /favicon.ico paths.
 */

const fs = require('fs');
const path = require('path');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const ROOT = path.join(__dirname, '..', '..');
const SITE_404 = path.join(ROOT, '_site', '404.html');
const META_BASIC = path.join(ROOT, 'src', '_includes', 'head', 'meta_basic.njk');
const FAVICONS = path.join(ROOT, 'src', '_includes', 'head', 'favicons.njk');

const HREF_CHECKS = [
  { label: 'stylesheet', re: /rel="stylesheet"[^>]*href="([^"]+)"/i },
  { label: 'font preload', re: /rel="preload"[^>]*href="([^"]+\.woff2)"/i },
  { label: 'favicon.ico', re: /rel="icon"[^>]*href="([^"]*favicon\.ico)"/i },
  { label: 'icon.svg', re: /rel="icon"[^>]*href="([^"]*icon\.svg)"/i },
];

function assertRootAbsolute(fileObj, label, href) {
  if (!href.startsWith('/')) {
    addIssue(fileObj, {
      type: 'error-document-assets',
      message: `${label} href must be root-absolute (got "${href}") so ErrorDocument works under /path/`,
      ruleId: '404-root-absolute-assets',
    });
  }
}

async function validate(result) {
  const templates = addFile(result, 'src/_includes/head/', '404 asset templates');
  for (const [label, filePath] of [
    ['meta_basic.njk', META_BASIC],
    ['favicons.njk', FAVICONS],
  ]) {
    const src = fs.readFileSync(filePath, 'utf8');
    if (!src.includes('permalink == "/404.html"') || !src.includes('assetPrefix')) {
      addIssue(templates, {
        type: 'error-document-assets',
        message: `${label} must force assetPrefix "/" when permalink is /404.html`,
        ruleId: '404-root-absolute-assets',
      });
    }
  }

  if (!fs.existsSync(SITE_404)) {
    addIssue(addFile(result, '_site/404.html', '404.html'), {
      type: 'error-document-assets',
      message: '_site/404.html missing — run a build before this test',
      ruleId: '404-root-absolute-assets',
    });
    return;
  }

  const html = fs.readFileSync(SITE_404, 'utf8');
  const fileObj = addFile(result, SITE_404, '404.html');

  for (const { label, re } of HREF_CHECKS) {
    const match = html.match(re);
    if (!match) {
      addIssue(fileObj, {
        type: 'error-document-assets',
        message: `Could not find ${label} href in 404.html`,
        ruleId: '404-root-absolute-assets',
      });
      continue;
    }
    assertRootAbsolute(fileObj, label, match[1]);
  }
}

runTest({
  testType: 'error-document-assets',
  testName: 'ErrorDocument 404 assets',
  requiresSite: true,
  validateFn: validate,
});
