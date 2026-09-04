#!/usr/bin/env node

/**
 * ErrorDocument pages are served by the webserver at whatever URL failed, not
 * at their own output path, so a file-relative asset href resolves against that
 * failing URL and 404s in turn (in practice 503, since the edge cannot resolve
 * it either). Built 404.html and 500.html must use root-absolute /assets/... and
 * /favicon.ico paths.
 *
 * Both ErrorDocument targets are checked. 500.html was omitted until 2026-09-04
 * and had shipped with relative hrefs the whole time: the .htaccess declares
 * `ErrorDocument 500 /500.html` exactly as it does for 404, so it always had the
 * same defect, and nothing looked. Whenever .htaccess gains an ErrorDocument,
 * add its page here.
 *
 * The site emits root-absolute asset hrefs everywhere, so these two pages are
 * not a special case any more — they are the reason the site-wide rule exists.
 */

const fs = require('fs');
const path = require('path');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const ROOT = path.join(__dirname, '..', '..');
const HTACCESS = path.join(ROOT, '_site', '.htaccess');

/** Keep in step with the ErrorDocument lines in src/.htaccess.njk. */
const ERROR_PAGES = ['404.html', '500.html'];

const HREF_CHECKS = [
  { label: 'stylesheet', re: /rel="stylesheet"[^>]*href="([^"]+)"/i },
  { label: 'font preload', re: /rel="preload"[^>]*href="([^"]+\.woff2)"/i },
  { label: 'favicon.ico', re: /rel="icon"[^>]*href="([^"]*favicon\.ico)"/i },
  { label: 'icon.svg', re: /rel="icon"[^>]*href="([^"]*icon\.svg)"/i },
  { label: 'apple-touch-icon', re: /rel="apple-touch-icon"[^>]*href="([^"]+)"/i },
];

function assertRootAbsolute(fileObj, pageName, label, href) {
  if (!href.startsWith('/')) {
    addIssue(fileObj, {
      type: 'error-document-assets',
      message: `${pageName}: ${label} href must be root-absolute (got "${href}") so ErrorDocument works under /path/`,
      ruleId: 'error-document-root-absolute-assets',
    });
  }
}

function checkPage(result, pageName) {
  const pagePath = path.join(ROOT, '_site', pageName);
  const fileObj = addFile(result, pagePath, pageName);

  if (!fs.existsSync(pagePath)) {
    addIssue(fileObj, {
      type: 'error-document-assets',
      message: `_site/${pageName} missing — run a build before this test`,
      ruleId: 'error-document-root-absolute-assets',
    });
    return;
  }

  const html = fs.readFileSync(pagePath, 'utf8');
  for (const { label, re } of HREF_CHECKS) {
    const match = html.match(re);
    if (!match) {
      addIssue(fileObj, {
        type: 'error-document-assets',
        message: `Could not find ${label} href in ${pageName}`,
        ruleId: 'error-document-root-absolute-assets',
      });
      continue;
    }
    assertRootAbsolute(fileObj, pageName, label, match[1]);
  }
}

/**
 * Every ErrorDocument the server declares must be covered above. A new one
 * added to .htaccess without a matching entry here would otherwise inherit the
 * original defect unnoticed.
 */
function checkErrorDocumentCoverage(result) {
  const fileObj = addFile(result, HTACCESS, '.htaccess');

  if (!fs.existsSync(HTACCESS)) {
    addIssue(fileObj, {
      type: 'error-document-assets',
      message: '_site/.htaccess missing — run a build before this test',
      ruleId: 'error-document-coverage',
    });
    return;
  }

  const htaccess = fs.readFileSync(HTACCESS, 'utf8');
  const declared = [...htaccess.matchAll(/^\s*ErrorDocument\s+\d+\s+\/(\S+)/gim)].map((m) => m[1]);

  for (const target of declared) {
    if (!ERROR_PAGES.includes(target)) {
      addIssue(fileObj, {
        type: 'error-document-assets',
        message: `.htaccess declares ErrorDocument /${target} but ERROR_PAGES does not cover it — add it so its asset hrefs are checked`,
        ruleId: 'error-document-coverage',
      });
    }
  }
}

async function validate(result) {
  for (const pageName of ERROR_PAGES) {
    checkPage(result, pageName);
  }
  checkErrorDocumentCoverage(result);
}

runTest({
  testType: 'error-document-assets',
  testName: 'ErrorDocument asset paths',
  requiresSite: true,
  validateFn: validate,
});
