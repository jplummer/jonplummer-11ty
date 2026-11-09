#!/usr/bin/env node

/**
 * Guards the OG card digest (scripts/utils/og-card-digest.js) and the
 * generator's decision to render, keep, or stamp a card, and to leave a
 * manual ogImage alone when its own file exists. The digest changes
 * with what the card shows and with the shared fingerprint, and nothing else.
 * Writing it into a PNG leaves every other chunk byte-identical, replaces an
 * earlier digest instead of adding a second, and keeps every chunk's CRC
 * valid. Works on temp copies; the site's own PNGs are never touched.
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const {
  computeCardDigest,
  readPngDigest,
  writePngDigest,
  readChunks,
} = require('../utils/og-card-digest');
const { cardAction, isKeptManualOgImage } = require('../content/generate-og-images');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const SAMPLE_PNG = path.join(__dirname, '..', '..', 'src', 'assets', 'images', 'og', 'v2', 'index.png');

function runUnitAssertions(result) {
  const file = addFile(result, 'scripts/utils/og-card-digest.js', 'og-card-digest');

  function check(name, fn) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'og-card-digest-'));
    try {
      fn(dir);
    } catch (err) {
      addIssue(file, { type: 'og-card-digest', message: `${name}: ${err.message}`, ruleId: 'og-card-digest' });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  const card = { title: 'Many little diamonds', label: 'Post', labelIsPath: false };
  const base = computeCardDigest('shared-a', card);

  check('digest is stable and changes only with what the card shows', () => {
    assert.strictEqual(computeCardDigest('shared-a', { ...card }), base);
    assert.notStrictEqual(computeCardDigest('shared-a', { ...card, title: 'Many little rubies' }), base);
    assert.notStrictEqual(computeCardDigest('shared-a', { ...card, label: 'Portfolio' }), base);
    assert.notStrictEqual(computeCardDigest('shared-a', { ...card, labelIsPath: true }), base);
    assert.notStrictEqual(computeCardDigest('shared-b', card), base);
    // Fields the card doesn't show don't count
    assert.strictEqual(computeCardDigest('shared-a', { ...card, description: 'x', date: '2026-01-01' }), base);
    // A missing label and a null one are the same card
    assert.strictEqual(
      computeCardDigest('shared-a', { title: 'T', label: undefined }),
      computeCardDigest('shared-a', { title: 'T', label: null })
    );
  });

  check('missing file and non-PNG read as no digest', (dir) => {
    assert.strictEqual(readPngDigest(path.join(dir, 'missing.png')), null);
    const text = path.join(dir, 'not.png');
    fs.writeFileSync(text, 'hello');
    assert.strictEqual(readPngDigest(text), null);
  });

  check('writing a digest leaves every other chunk byte-identical', (dir) => {
    const png = path.join(dir, 'card.png');
    fs.copyFileSync(SAMPLE_PNG, png);
    const before = readChunks(fs.readFileSync(png)).filter((c) => !c.data.toString('latin1').startsWith('og-card-digest\0'));
    writePngDigest(png, base);
    assert.strictEqual(readPngDigest(png), base);
    const after = readChunks(fs.readFileSync(png));
    const others = after.filter((c) => !(c.type === 'tEXt' && c.data.toString('latin1').startsWith('og-card-digest\0')));
    assert.strictEqual(others.length, before.length);
    others.forEach((c, i) => {
      assert.strictEqual(c.type, before[i].type);
      assert.ok(c.data.equals(before[i].data), `${c.type} chunk changed`);
    });
    assert.strictEqual(after[after.length - 1].type, 'IEND');
  });

  check('a second write replaces the digest and every CRC stays valid', (dir) => {
    const png = path.join(dir, 'card.png');
    fs.copyFileSync(SAMPLE_PNG, png);
    writePngDigest(png, base);
    const next = computeCardDigest('shared-b', card);
    writePngDigest(png, next);
    assert.strictEqual(readPngDigest(png), next);
    const buf = fs.readFileSync(png);
    const digestChunks = readChunks(buf).filter((c) => c.type === 'tEXt' && c.data.toString('latin1').startsWith('og-card-digest\0'));
    assert.strictEqual(digestChunks.length, 1);
    let offset = 8;
    while (offset < buf.length) {
      const length = buf.readUInt32BE(offset);
      const crc = buf.readUInt32BE(offset + 8 + length);
      assert.strictEqual(crc, zlib.crc32(buf.subarray(offset + 4, offset + 8 + length)), 'bad CRC');
      offset += 12 + length;
    }
  });

  check('generator renders, keeps, or stamps by digest', (dir) => {
    const png = path.join(dir, 'card.png');
    assert.strictEqual(cardAction(png, base), 'render', 'missing PNG');
    fs.copyFileSync(SAMPLE_PNG, png);
    writePngDigest(png, base);
    assert.strictEqual(cardAction(png, base), 'keep', 'same digest');
    // Touching the file changes nothing
    const later = new Date(Date.now() + 86400000);
    fs.utimesSync(png, later, later);
    assert.strictEqual(cardAction(png, base), 'keep', 'after touch');
    const changed = computeCardDigest('shared-a', { ...card, title: 'New title' });
    assert.strictEqual(cardAction(png, changed), 'render', 'different digest');
    assert.strictEqual(cardAction(png, changed, { stamp: true }), 'stamp', 'different digest with --stamp');
    assert.strictEqual(cardAction(png, base, { force: true }), 'render', '--force');
  });

  check('generator leaves a manual ogImage alone only when its own file exists', () => {
    const derived = '/assets/images/og/v2/portfolio-pieces.png';
    const borrowed = '/assets/images/og/v2/portfolio.png';
    const seen = [];
    const exists = (p) => { seen.push(p); return p === borrowed; };
    // Borrowing another page's card: checks the borrowed file, not the derived one
    assert.strictEqual(isKeptManualOgImage(borrowed, derived, exists), true, 'borrowed card exists');
    assert.deepStrictEqual(seen, [borrowed]);
    assert.strictEqual(isKeptManualOgImage('/assets/images/custom-og.png', derived, exists), false, 'override file missing');
    // Not overrides, whatever is on disk
    const always = () => true;
    assert.strictEqual(isKeptManualOgImage(derived, derived, always), false, 'derived path');
    assert.strictEqual(isKeptManualOgImage('auto', derived, always), false, 'auto');
    assert.strictEqual(isKeptManualOgImage(undefined, derived, always), false, 'absent');
  });
}

runTest({
  testType: 'og-card-digest',
  testName: 'OG Card Digest',
  requiresSite: false,
  validateFn: async (result) => {
    runUnitAssertions(result);
  },
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
