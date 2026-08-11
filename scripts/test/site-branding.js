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

  check(siteFile, 'exports author, tagline, taglines, derived title', () => {
    const site = require(SITE_JS)();
    assert.strictEqual(typeof site.author, 'string');
    assert.ok(site.author.length > 0, 'author empty');
    assert.strictEqual(typeof site.tagline, 'string');
    assert.ok(site.tagline.length > 0, 'tagline empty');
    assert.ok(Array.isArray(site.taglines), 'taglines not an array');
    assert.ok(site.taglines.length > 1, 'taglines pool too small');
    assert.ok(
      site.taglines.every((t) => typeof t === 'string' && t.length > 0),
      'taglines must be non-empty strings'
    );
    assert.ok(
      site.taglines.includes(site.tagline),
      'canonical tagline must appear in taglines pool'
    );
    assert.strictEqual(site.title, `${site.author} – ${site.tagline}`);
  });

  check(siteFile, 'taglineForPage is stable per URL', () => {
    const { pickTaglineForUrl } = require('../../eleventy/utils/tagline-for-url');
    const site = require(SITE_JS)();
    const a = pickTaglineForUrl(site.taglines, '/about/');
    const b = pickTaglineForUrl(site.taglines, '/about/');
    const home = pickTaglineForUrl(site.taglines, '/');
    assert.strictEqual(a, b, 'same URL must pick the same tagline');
    assert.ok(site.taglines.includes(a), 'picked tagline not in pool');
    assert.ok(site.taglines.includes(home), 'home tagline not in pool');
  });

  check(siteFile, 'salt affects home only', () => {
    const { pickTaglineForUrl } = require('../../eleventy/utils/tagline-for-url');
    const pool = [
      'Making ideas tangible',
      'Understand, then build',
      'Study people, ship software',
      'Listen before making',
      'Build from understanding',
      'Learn to build, build to learn',
      'Care shows up in the product',
      'Evidence over ego',
    ];
    const aboutA = pickTaglineForUrl(pool, '/about/', 'aaa');
    const aboutB = pickTaglineForUrl(pool, '/about/', 'bbb');
    assert.strictEqual(aboutA, aboutB, 'non-home must ignore salt');

    const homeSame = pickTaglineForUrl(pool, '/', 'salt-one');
    assert.strictEqual(
      homeSame,
      pickTaglineForUrl(pool, '/', 'salt-one'),
      'same home salt must be stable'
    );

    const salts = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'];
    const homePicks = new Set(salts.map((s) => pickTaglineForUrl(pool, '/', s)));
    assert.ok(
      homePicks.size > 1,
      'different home salts should yield more than one tagline across a small sample'
    );

    assert.strictEqual(
      pickTaglineForUrl(pool, null, 'x'),
      pickTaglineForUrl(pool, '/', 'x'),
      'null URL normalizes to / and uses salt'
    );
  });

  check(siteFile, 'pool includes new lockup lines', () => {
    const site = require(SITE_JS)();
    assert.ok(site.taglines.includes('Care shows up in the product'));
    assert.ok(site.taglines.includes('Evidence over ego'));
  });

  check(siteFile, 'getGitHeadSha returns a sha in this repo', () => {
    const { getGitHeadSha } = require('../../eleventy/utils/tagline-for-url');
    const sha = getGitHeadSha();
    assert.ok(/^[0-9a-f]{40}$/i.test(sha), `expected full sha, got ${JSON.stringify(sha)}`);
  });

  check(siteFile, 'base lockup uses taglineForPage', () => {
    const base = fs.readFileSync(path.join(ROOT, 'src/_includes/base.njk'), 'utf8');
    assert.ok(
      base.includes('taglineForPage'),
      'base.njk lockup should use page.url | taglineForPage'
    );
    assert.ok(
      !/site\.tagline/.test(base.split('site-lockup')[1]?.split('</header>')[0] || ''),
      'lockup should not use site.tagline (canonical is for title/feeds)'
    );
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
