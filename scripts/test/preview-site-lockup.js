#!/usr/bin/env node

const assert = require('assert');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const HELPER = require('../utils/preview-site-lockup');

function runUnitAssertions(result) {
  const file = addFile(result, 'scripts/utils/preview-site-lockup.js', 'preview-site-lockup');

  function check(name, fn) {
    try {
      fn();
    } catch (err) {
      addIssue(file, {
        type: 'preview-site-lockup',
        message: `${name}: ${err.message}`,
        ruleId: 'preview-site-lockup',
      });
    }
  }

  check('exports renderPreviewSiteLockup', () => {
    assert.strictEqual(typeof HELPER.renderPreviewSiteLockup, 'function');
  });

  check('default: mark + author, no tagline', () => {
    const html = HELPER.renderPreviewSiteLockup({ author: 'Jon Plummer' });
    assert.match(html, /class="site-lockup"/);
    assert.match(html, /class="site-mark-link"/);
    assert.match(html, /class="site-mark"/);
    assert.match(html, /<h1><a href="#" rel="home">Jon Plummer<\/a><\/h1>/);
    assert.doesNotMatch(html, /<hgroup>\s*<h1>[\s\S]*?<\/h1>\s*<p>/);
    assert.match(html, /viewBox="50 50 500 500"/);
    assert.match(html, /fill="currentColor"/);
  });

  check('includeTagline adds tagline paragraph', () => {
    const html = HELPER.renderPreviewSiteLockup({
      author: 'Jon Plummer',
      tagline: 'Making ideas tangible',
      includeTagline: true,
    });
    assert.match(html, /<p>Making ideas tangible<\/p>/);
  });

  check('escapes author HTML', () => {
    const html = HELPER.renderPreviewSiteLockup({ author: 'A <B> & C' });
    assert.match(html, /A &lt;B&gt; &amp; C/);
    assert.doesNotMatch(html, /A <B> & C/);
  });
}

runTest({
  testType: 'preview-site-lockup',
  testName: 'Preview Site Lockup',
  requiresSite: false,
  validateFn: async (result) => {
    runUnitAssertions(result);
  },
});
