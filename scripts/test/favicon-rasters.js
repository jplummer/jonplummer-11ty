#!/usr/bin/env node

/**
 * Scrapers copy favicon.ico / apple-touch-icon.png into an <img>. Those
 * rasters must carry their own contrast (light content field). icon.svg
 * stays transparent + prefers-color-scheme for this site's tabs.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const ROOT = path.join(__dirname, '..', '..');
const ICON_SVG = path.join(ROOT, 'src/assets/images/icon.svg');
const RASTER_SVG = path.join(ROOT, 'src/assets/images/icon-raster.svg');
const APPLE = path.join(ROOT, 'src/assets/images/apple-touch-icon.png');
const ICO = path.join(ROOT, 'src/favicon.ico');
const FAVICONS_NJK = path.join(ROOT, 'src/_includes/head/favicons.njk');

const FIELD = { r: 250, g: 250, b: 250 }; // #fafafa
const FIELD_SLACK = 8;

function loadSharp() {
  const requireFromEleventyImg = createRequire(require.resolve('@11ty/eleventy-img'));
  return requireFromEleventyImg('sharp');
}

function check(fileObj, label, fn) {
  try {
    fn();
  } catch (err) {
    addIssue(fileObj, {
      type: 'favicon-rasters',
      message: `${label}: ${err.message}`,
      ruleId: 'favicon-rasters',
    });
  }
}

function pngChunksFromIco(buf) {
  const count = buf.readUInt16LE(4);
  const pngs = [];
  for (let i = 0; i < count; i++) {
    const entry = 6 + i * 16;
    const size = buf.readUInt32LE(entry + 8);
    const offset = buf.readUInt32LE(entry + 12);
    const slice = buf.subarray(offset, offset + size);
    if (slice[0] === 0x89 && slice[1] === 0x50 && slice[2] === 0x4e) {
      pngs.push(slice);
    }
  }
  return pngs;
}

async function pixelRgb(sharp, input, left, top) {
  const { data } = await sharp(input)
    .ensureAlpha()
    .extract({ left, top, width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { r: data[0], g: data[1], b: data[2] };
}

function assertNearField(rgb, label) {
  for (const channel of ['r', 'g', 'b']) {
    const delta = Math.abs(rgb[channel] - FIELD[channel]);
    assert.ok(
      delta <= FIELD_SLACK,
      `${label} ${channel}=${rgb[channel]}, expected ~${FIELD[channel]} (±${FIELD_SLACK})`
    );
  }
}

function assertDarkMark(rgb, label) {
  const luma = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
  assert.ok(luma < 80, `${label} luma=${luma.toFixed(1)}, expected dark mark`);
}

/** Center of the second bar in the 600 viewBox, mapped into a square raster. */
function markSample(size) {
  return {
    left: Math.round(((183 + 50) / 600) * size),
    top: Math.round((300 / 600) * size),
  };
}

async function validate(result) {
  const sharp = loadSharp();

  const tab = addFile(result, 'src/assets/images/icon.svg');
  check(tab, 'still themes; no plate', () => {
    const svg = fs.readFileSync(ICON_SVG, 'utf8');
    assert.match(svg, /prefers-color-scheme:\s*dark/);
    assert.doesNotMatch(svg, /#fafafa/);
    assert.match(svg, /fill:\s*#2a2d32/);
  });

  const njk = addFile(result, 'src/_includes/head/favicons.njk');
  check(njk, 'still points tab browsers at icon.svg', () => {
    const src = fs.readFileSync(FAVICONS_NJK, 'utf8');
    assert.match(src, /icon\.svg/);
    assert.match(src, /favicon\.ico/);
    assert.match(src, /apple-touch-icon\.png/);
    assert.doesNotMatch(src, /icon-raster\.svg/);
  });

  const srcSvg = addFile(result, 'src/assets/images/icon-raster.svg');
  check(srcSvg, 'plated source exists', () => {
    const svg = fs.readFileSync(RASTER_SVG, 'utf8');
    assert.match(svg, /fill="#fafafa"/);
    assert.match(svg, /fill="#2a2d32"/);
    assert.doesNotMatch(svg, /prefers-color-scheme/);
  });

  const apple = addFile(result, 'src/assets/images/apple-touch-icon.png');
  const appleMeta = await sharp(APPLE).metadata();
  check(apple, '180×180', () => {
    assert.strictEqual(appleMeta.width, 180);
    assert.strictEqual(appleMeta.height, 180);
  });
  check(apple, 'large enough to sample', () => {
    assert.ok(appleMeta.width > 8 && appleMeta.height > 8);
  });
  const appleCorner = await pixelRgb(sharp, APPLE, 2, 2);
  check(apple, 'light field at corner', () => {
    assertNearField(appleCorner, 'apple-touch corner');
  });
  const appleMarkAt = markSample(appleMeta.width);
  const appleMark = await pixelRgb(sharp, APPLE, appleMarkAt.left, appleMarkAt.top);
  check(apple, 'dark mark in bar', () => {
    assertDarkMark(appleMark, 'apple-touch mark');
  });

  const icoFile = addFile(result, 'src/favicon.ico');
  const icoBuf = fs.readFileSync(ICO);
  const pngs = pngChunksFromIco(icoBuf);
  check(icoFile, 'PNG-in-ICO frames', () => {
    assert.ok(pngs.length >= 1, `no PNG frames in ico (found ${pngs.length})`);
  });
  if (pngs.length >= 1) {
    const sizes = [];
    for (const png of pngs) {
      const meta = await sharp(png).metadata();
      sizes.push(meta.width);
      const rgb = await pixelRgb(sharp, png, 2, 2);
      check(icoFile, `light field at ${meta.width}px corner`, () => {
        assertNearField(rgb, `ico ${meta.width}px`);
      });
      const markAt = markSample(meta.width);
      const markRgb = await pixelRgb(sharp, png, markAt.left, markAt.top);
      check(icoFile, `dark mark at ${meta.width}px`, () => {
        assertDarkMark(markRgb, `ico ${meta.width}px mark`);
      });
    }
    check(icoFile, 'includes 32×32', () => {
      assert.ok(sizes.includes(32), `sizes: ${sizes.join(', ')}`);
    });
  }
}

runTest({
  testType: 'favicon-rasters',
  testName: 'Favicon scraper rasters',
  requiresSite: false,
  validateFn: validate,
});
