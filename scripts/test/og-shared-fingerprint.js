#!/usr/bin/env node

/**
 * Guards the OG shared fingerprint (scripts/utils/og-shared-fingerprint.js):
 * CSS rules the card never sees must not change it; design tokens, the card
 * template, and the stored-value round trip must behave. Runs against a temp
 * copy of the real inputs, so the site's own files are never touched.
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  computeOgSharedFingerprint,
  readStoredFingerprint,
  writeStoredFingerprint,
} = require('../utils/og-shared-fingerprint');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const ROOT = path.join(__dirname, '..', '..');
const FIXTURE_FILES = [
  'src/assets/css/jonplummer.css',
  'src/assets/css/fonts.css',
  'src/assets/fonts/lab/big-shoulders-latin-wght-normal.woff2',
  'src/assets/fonts/lab/libre-franklin-latin-wght-normal.woff2',
  'src/_includes/og-image.njk',
  'src/_includes/og-image-body.njk',
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

function runUnitAssertions(result) {
  const file = addFile(result, 'scripts/utils/og-shared-fingerprint.js', 'og-shared-fingerprint');

  function check(name, fn) {
    const dir = makeFixture();
    try {
      fn(dir);
    } catch (err) {
      addIssue(file, {
        type: 'og-shared-fingerprint',
        message: `${name}: ${err.message}`,
        ruleId: 'og-shared-fingerprint',
      });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  function edit(dir, rel, fn) {
    const abs = path.join(dir, rel);
    fs.writeFileSync(abs, fn(fs.readFileSync(abs, 'utf8')), 'utf8');
  }

  check('is stable across runs', (dir) => {
    assert.strictEqual(computeOgSharedFingerprint(dir), computeOgSharedFingerprint(dir));
  });

  check('ignores CSS rules outside :root', (dir) => {
    const before = computeOgSharedFingerprint(dir);
    edit(dir, 'src/assets/css/jonplummer.css', (css) =>
      `${css}\n.figure-lightbox-test-only { color: red; }\n`
    );
    assert.strictEqual(computeOgSharedFingerprint(dir), before);
  });

  check('changes when a design token changes', (dir) => {
    const before = computeOgSharedFingerprint(dir);
    edit(dir, 'src/assets/css/jonplummer.css', (css) =>
      css.replace(':root {', ':root {\n  --og-fingerprint-test: 1px;')
    );
    assert.notStrictEqual(computeOgSharedFingerprint(dir), before);
  });

  check('changes when the card template changes', (dir) => {
    const before = computeOgSharedFingerprint(dir);
    edit(dir, 'src/_includes/og-image.njk', (njk) => `${njk}\n<!-- test -->\n`);
    assert.notStrictEqual(computeOgSharedFingerprint(dir), before);
  });

  check('stored value round-trips; missing file reads as null', (dir) => {
    const storePath = path.join(dir, '.cache', 'og-shared-fingerprint.json');
    assert.strictEqual(readStoredFingerprint(storePath), null);
    writeStoredFingerprint(storePath, 'abc123');
    assert.strictEqual(readStoredFingerprint(storePath), 'abc123');
  });
}

runTest({
  testType: 'og-shared-fingerprint',
  testName: 'OG Shared Fingerprint',
  requiresSite: false,
  validateFn: async (result) => {
    runUnitAssertions(result);
  },
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
