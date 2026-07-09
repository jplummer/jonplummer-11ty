#!/usr/bin/env node

/**
 * Verifies deploy-critical static assets exist in _site/ after build.
 * Fonts, CSS, and head links must be present for production typography and CSP.
 */

const fs = require('fs');
const path = require('path');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const SITE_DIR = path.join(process.cwd(), '_site');

const REQUIRED_FILES = [
  'assets/css/jonplummer.css',
  'assets/fonts/lab/public-sans-latin-wght-normal.woff2',
  'assets/fonts/lab/big-shoulders-latin-wght-normal.woff2'
];

async function validate(result) {
  const fileObj = addFile(result, '_site/ (deploy assets)');

  if (!fs.existsSync(SITE_DIR)) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'deploy-assets',
      message: '_site/ not found — run pnpm run build first'
    });
    return;
  }

  for (const rel of REQUIRED_FILES) {
    const full = path.join(SITE_DIR, rel);
    if (!fs.existsSync(full)) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'deploy-assets',
        message: `Missing deploy asset: ${rel}`
      });
    } else if (fs.statSync(full).size === 0) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'deploy-assets',
        message: `Empty deploy asset: ${rel}`
      });
    }
  }

  const jonplummerCss = path.join(SITE_DIR, 'assets/css/jonplummer.css');
  if (fs.existsSync(jonplummerCss)) {
    const css = fs.readFileSync(jonplummerCss, 'utf8');
    if (!css.includes('@font-face') || !css.includes('"Public Sans"')) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'deploy-assets',
        message: 'jonplummer.css missing @font-face for Public Sans'
      });
    }
  }

  const indexHtml = path.join(SITE_DIR, 'index.html');
  if (fs.existsSync(indexHtml)) {
    const html = fs.readFileSync(indexHtml, 'utf8');
    if (html.includes('assets/css/fonts.css')) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'deploy-assets',
        message: 'index.html should not link fonts.css (fonts live in jonplummer.css)'
      });
    }
    if (!html.includes('assets/css/jonplummer.css')) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'deploy-assets',
        message: 'index.html missing link to assets/css/jonplummer.css'
      });
    }
    if (!html.includes('public-sans-latin-wght-normal.woff2')) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'deploy-assets',
        message: 'index.html missing preload for Public Sans WOFF2'
      });
    }
    if (!html.includes('big-shoulders-latin-wght-normal.woff2')) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'deploy-assets',
        message: 'index.html missing preload for Big Shoulders WOFF2'
      });
    }
  }

}

runTest({
  testType: 'deploy-assets',
  testName: 'Deploy Assets',
  requiresSite: true,
  validateFn: validate
});
