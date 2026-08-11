#!/usr/bin/env node

/**
 * Guards extractLightThemeColorOverrides(): OG screenshots need forced-light
 * :root colors. Tokens may be light-dark() or var() aliases onto those colors
 * (three-color link model: hover/active → accent, visited → quiet).
 */

const assert = require('assert');
const { extractLightThemeColorOverrides } = require('../../eleventy/utils/css-utils');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const REQUIRED_VARS = [
  'text-color',
  'text-color-light',
  'border-color',
  'background-color',
  'content-background-color',
  'link-color',
  'link-hover-color',
  'link-visited-color',
  'link-active-color',
];

function runUnitAssertions(result) {
  const file = addFile(result, 'eleventy/utils/css-utils.js', 'css-utils');

  function check(name, fn) {
    try {
      fn();
    } catch (err) {
      addIssue(file, {
        type: 'light-theme-colors',
        message: `${name}: ${err.message}`,
        ruleId: 'light-theme-colors',
      });
    }
  }

  check('extractLightThemeColorOverrides returns all required tokens', () => {
    const block = extractLightThemeColorOverrides();
    assert.match(block, /^:root \{/);
    assert.match(block, /\}$/);
    for (const varName of REQUIRED_VARS) {
      const re = new RegExp(`--${varName}:\\s*[^;]+;`);
      assert.match(block, re, `missing --${varName}`);
    }
  });

  check('alias tokens resolve to var() onto extracted colors', () => {
    const block = extractLightThemeColorOverrides();
    assert.match(block, /--link-hover-color:\s*var\(--link-color\);/);
    assert.match(block, /--link-active-color:\s*var\(--link-color\);/);
    assert.match(block, /--link-visited-color:\s*var\(--text-color-light\);/);
  });

  check('lived colors are concrete light values (not light-dark)', () => {
    const block = extractLightThemeColorOverrides();
    assert.match(block, /--link-color:\s*oklch\(/);
    assert.match(block, /--text-color-light:\s*oklch\(/);
    assert.doesNotMatch(block, /light-dark\(/);
  });
}

runTest({
  testType: 'light-theme-colors',
  testName: 'Light Theme Colors',
  requiresSite: false,
  validateFn: async (result) => {
    runUnitAssertions(result);
  },
});
