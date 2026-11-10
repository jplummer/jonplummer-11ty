#!/usr/bin/env node

const assert = require('assert');
const { test } = require('node:test');

const HELPER = require('../utils/preview-site-lockup');

test('exports renderPreviewSiteLockup', () => {
  assert.strictEqual(typeof HELPER.renderPreviewSiteLockup, 'function');
});

test('default: mark + author, no tagline', () => {
  const html = HELPER.renderPreviewSiteLockup({ author: 'Jon Plummer' });
  assert.match(html, /class="site-lockup"/);
  assert.match(html, /class="site-mark-link"/);
  assert.match(html, /class="site-mark"/);
  assert.match(html, /<h1><a href="#" rel="home">Jon Plummer<\/a><\/h1>/);
  assert.doesNotMatch(html, /<hgroup>\s*<h1>[\s\S]*?<\/h1>\s*<p>/);
  assert.match(html, /viewBox="50 50 500 500"/);
  assert.match(html, /fill="currentColor"/);
});

test('includeTagline adds tagline paragraph', () => {
  const html = HELPER.renderPreviewSiteLockup({
    author: 'Jon Plummer',
    tagline: 'Making ideas tangible',
    includeTagline: true,
  });
  assert.match(html, /<p>Making ideas tangible<\/p>/);
});

test('escapes author HTML', () => {
  const html = HELPER.renderPreviewSiteLockup({ author: 'A <B> & C' });
  assert.match(html, /A &lt;B&gt; &amp; C/);
  assert.doesNotMatch(html, /A <B> & C/);
});
