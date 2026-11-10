#!/usr/bin/env node

/**
 * Guards the OG shared fingerprint (scripts/utils/og-shared-fingerprint.js):
 * CSS rules the card never sees must not change it; design tokens and the
 * card template must. Runs against a temp copy of the real inputs, so the
 * site's own files are never touched.
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  OG_SITE_FIELDS,
  SHARED_CONTENT_FILES,
  computeOgSharedFingerprint,
} = require('../utils/og-shared-fingerprint');
const { test } = require('node:test');

const ROOT = path.join(__dirname, '..', '..');
const FIXTURE_FILES = [
  'src/assets/css/jonplummer.css',
  'src/assets/css/fonts.css',
  'src/assets/fonts/lab/big-shoulders-latin-wght-normal.woff2',
  'src/assets/fonts/lab/libre-franklin-latin-wght-normal.woff2',
  'src/_includes/og-image.njk',
  'src/_includes/og-image-body.njk',
  'src/assets/css/og-card.css',
  'src/assets/js/og-card-fit.js',
  'src/assets/images/jp-mark.svg',
  'src/_data/site.js',
];

function makeFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'og-fingerprint-'));
  for (const rel of FIXTURE_FILES) {
    const from = path.join(ROOT, rel);
    if (!fs.existsSync(from)) continue;
    const to = path.join(dir, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
  return dir;
}

/** Runs a test body against a fresh temp copy of the real inputs, removed afterward. */
function withFixture(fn) {
  return () => {
    const dir = makeFixture();
    try {
      return fn(dir);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };
}

function edit(dir, rel, fn) {
  const abs = path.join(dir, rel);
  fs.writeFileSync(abs, fn(fs.readFileSync(abs, 'utf8')), 'utf8');
}

test('is stable across runs', withFixture((dir) => {
  assert.strictEqual(computeOgSharedFingerprint(dir), computeOgSharedFingerprint(dir));
}));

test('ignores CSS rules outside :root', withFixture((dir) => {
  const before = computeOgSharedFingerprint(dir);
  edit(dir, 'src/assets/css/jonplummer.css', (css) =>
    `${css}\n.figure-lightbox-test-only { color: red; }\n`
  );
  assert.strictEqual(computeOgSharedFingerprint(dir), before);
}));

test('changes when a design token changes', withFixture((dir) => {
  const before = computeOgSharedFingerprint(dir);
  edit(dir, 'src/assets/css/jonplummer.css', (css) =>
    css.replace(':root {', ':root {\n  --og-fingerprint-test: 1px;')
  );
  assert.notStrictEqual(computeOgSharedFingerprint(dir), before);
}));

test('changes when the card template changes', withFixture((dir) => {
  const before = computeOgSharedFingerprint(dir);
  edit(dir, 'src/_includes/og-image.njk', (njk) => `${njk}\n<!-- test -->\n`);
  assert.notStrictEqual(computeOgSharedFingerprint(dir), before);
}));

test('changes when the card styles change', withFixture((dir) => {
  const before = computeOgSharedFingerprint(dir);
  edit(dir, 'src/assets/css/og-card.css', (css) => `${css}\n/* test */\n`);
  assert.notStrictEqual(computeOgSharedFingerprint(dir), before);
}));

test('changes when the fit script changes', withFixture((dir) => {
  const before = computeOgSharedFingerprint(dir);
  edit(dir, 'src/assets/js/og-card-fit.js', (js) => `${js}\n// test\n`);
  assert.notStrictEqual(computeOgSharedFingerprint(dir), before);
}));

test('ignores site.js fields the card never reads', withFixture((dir) => {
  const before = computeOgSharedFingerprint(dir);
  edit(dir, 'src/_data/site.js', (js) =>
    js.replace('const taglines = [', "const taglines = [\n    'Fingerprint test tagline',")
  );
  assert.strictEqual(computeOgSharedFingerprint(dir), before);
}));

test('changes when a site field the card reads changes', withFixture((dir) => {
  const before = computeOgSharedFingerprint(dir);
  edit(dir, 'src/_data/site.js', (js) =>
    js.replace("const author = 'Jon Plummer';", "const author = 'Jon Plummer Test';")
  );
  assert.notStrictEqual(computeOgSharedFingerprint(dir), before);
}));

test('every site field the card templates read is fingerprinted', () => {
  const used = new Set();
  for (const rel of SHARED_CONTENT_FILES.filter((f) => f.endsWith('.njk'))) {
    const njk = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    for (const m of njk.matchAll(/\bsite\.(\w+)/g)) used.add(m[1]);
  }
  const missing = [...used].filter((key) => !OG_SITE_FIELDS.includes(key));
  assert.deepStrictEqual(missing, [], `add to OG_SITE_FIELDS: ${missing.join(', ')}`);
});
