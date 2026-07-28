#!/usr/bin/env node

/**
 * Guards site branding: author + tagline live in src/_data/site.js;
 * compound title is derived there; consumers must not hardcode the tagline.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const ROOT = path.join(__dirname, '..', '..');
const SITE_JS = path.join(ROOT, 'src', '_data', 'site.js');

const TAGLINE_LITERAL = 'Making ideas tangible';
const COLON_BRAND = 'Jon Plummer:';

/** Source files that must not hardcode the tagline (generated embeds excluded). */
const SCAN_GLOBS = [
  'src/_includes',
  'src/index.njk',
  'src/index.11tydata.js',
  'src/feed.njk',
  'src/links-feed.njk',
  'src/wisdom-feed.njk',
  'src/humans.njk',
  'src/style-exercise.njk',
  'scripts/color-explore/generate-gallery.js',
  'scripts/font-explore/generate-font-gallery.js',
];

function walkFiles(relPath, out = []) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) {
    return out;
  }
  const stat = fs.statSync(abs);
  if (stat.isFile()) {
    out.push(abs);
    return out;
  }
  for (const name of fs.readdirSync(abs)) {
    if (name === 'color-gallery-embed-inner.html' || name === 'font-lab-card.fragment.html') {
      continue;
    }
    walkFiles(path.join(relPath, name), out);
  }
  return out;
}

function runUnitAssertions(result) {
  const siteFile = addFile(result, 'src/_data/site.js', 'site.js');

  function check(file, name, fn) {
    try {
      fn();
    } catch (err) {
      addIssue(file, {
        type: 'site-branding',
        message: `${name}: ${err.message}`,
        ruleId: 'site-branding',
      });
    }
  }

  check(siteFile, 'exports author, tagline, derived title', () => {
    const site = require(SITE_JS)();
    assert.strictEqual(typeof site.author, 'string');
    assert.ok(site.author.length > 0, 'author empty');
    assert.strictEqual(typeof site.tagline, 'string');
    assert.ok(site.tagline.length > 0, 'tagline empty');
    assert.strictEqual(site.title, `${site.author} – ${site.tagline}`);
  });

  const scanTargets = [];
  for (const rel of SCAN_GLOBS) {
    walkFiles(rel, scanTargets);
  }

  for (const abs of scanTargets) {
    if (abs === SITE_JS) {
      continue;
    }
    const rel = path.relative(ROOT, abs);
    if (!/\.(njk|js|html|md)$/.test(rel)) {
      continue;
    }
    const fileObj = addFile(result, rel);
    const content = fs.readFileSync(abs, 'utf8');
    check(fileObj, 'no hardcoded tagline', () => {
      assert.ok(
        !content.includes(TAGLINE_LITERAL),
        `hardcoded tagline — use site.tagline / site.title from site.js`
      );
    });
    check(fileObj, 'no colon brand form', () => {
      assert.ok(
        !content.includes(COLON_BRAND),
        `colon brand form removed — use site.title (en dash)`
      );
    });
  }
}

runTest({
  testType: 'site-branding',
  testName: 'Site Branding',
  requiresSite: false,
  validateFn: async (result) => {
    runUnitAssertions(result);
  },
});
