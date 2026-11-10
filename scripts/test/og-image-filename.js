#!/usr/bin/env node

/**
 * Guards generateOgImageFilename(): post PNG names follow the source
 * YYYY-MM-DD-* filename so UTC midnight / date-only front matter cannot
 * shift the calendar day or double-prefix the slug.
 */

const assert = require('assert');
const path = require('path');
const {
  OG_IMAGE_VERSION,
  generateOgImageFilename,
  ogImageDiskDir,
  ogImageUrl,
} = require('../utils/og-image-filename');
const { test } = require('node:test');

const POST = path.join('src', 'posts', '2026', '2026-08-12-care-has-to-show-up-in-the-product.md');
const CRITIQUE = path.join('src', 'posts', '2025', '2025-12-30-engaging-in-critique.md');

test('dated post filename wins over date-only front matter', () => {
  const name = generateOgImageFilename({ tags: ['post'], date: '2026-08-12' }, POST);
  assert.strictEqual(name, '2026-08-12-care-has-to-show-up-in-the-product.png');
});

test('dated post filename wins over UTC midnight ISO front matter', () => {
  const name = generateOgImageFilename(
    { tags: ['post'], date: '2025-12-30T00:00:00.000Z' },
    CRITIQUE
  );
  assert.strictEqual(name, '2025-12-30-engaging-in-critique.png');
});

test('dated post filename wins over offset timestamp front matter', () => {
  const name = generateOgImageFilename(
    { tags: ['post'], date: '2026-08-12T12:00:00-07:00' },
    POST
  );
  assert.strictEqual(name, '2026-08-12-care-has-to-show-up-in-the-product.png');
});

test('URL and disk path share the versioned directory', () => {
  assert.strictEqual(ogImageUrl('about.png'), `/assets/images/og/${OG_IMAGE_VERSION}/about.png`);
  const disk = ogImageDiskDir('/site');
  assert.strictEqual(disk, path.join('/site', 'src', 'assets', 'images', 'og', OG_IMAGE_VERSION));
});

test('side projects name their card after the permalink', () => {
  const name = generateOgImageFilename(
    { tags: 'sideproject', permalink: '/sides/parker/' },
    path.join('src', 'sides', 'parker.md')
  );
  assert.strictEqual(name, 'sides-parker.png');
});
