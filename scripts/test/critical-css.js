#!/usr/bin/env node

/**
 * The inline first-paint shell in src/_includes/head/critical.njk hardcodes
 * values that live as tokens in jonplummer.css, because the stylesheet it is
 * covering for has not loaded yet. Nothing else compares the two.
 *
 * This is not hypothetical drift. On 2026-08-11 d3a2c0bc softened the light
 * page field to oklch(98%) and propagated it to five files but not the shell,
 * so for two days every cold light-mode load flashed pure white before the
 * stylesheet darkened it — the exact flash the shell exists to prevent.
 * 43b968b4 found it by eye. A drifted shell is invisible in the built HTML,
 * invisible on repeat visits (cached CSS), and only shows on a first paint.
 *
 * Each pair below is compared token-to-declaration, not "value appears
 * somewhere in the stylesheet", so a value that matches some other token does
 * not pass. A pair whose declaration or token cannot be found is reported as a
 * failure rather than skipped: if either file is restructured this test must
 * fail loudly and be updated, never quietly stop checking.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { extractCssCustomProperties } = require('../../eleventy/utils/css-utils');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const ROOT = path.join(__dirname, '..', '..');
const CRITICAL = path.join(ROOT, 'src/_includes/head/critical.njk');

/**
 * Each value the shell duplicates, and the stylesheet :root declaration it
 * must equal. `token` is a custom property name; `rootProperty` is a plain one.
 */
const PAIRS = [
  {
    label: 'body background-color',
    selector: 'body',
    property: 'background-color',
    token: 'content-background-color',
  },
  {
    label: 'body color',
    selector: 'body',
    property: 'color',
    token: 'text-color',
  },
  {
    label: 'body font-family',
    selector: 'body',
    property: 'font-family',
    token: 'font-family',
  },
  {
    label: 'heading font-family',
    selectorIncludes: 'h1',
    property: 'font-family',
    token: 'font-family-display',
  },
  {
    label: 'color-scheme',
    selector: ':root',
    property: 'color-scheme',
    rootProperty: 'color-scheme',
  },
];

/** Comments carry semicolons and token names; strip them before parsing. */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function normalize(value) {
  return value.replace(/\s+/g, ' ').trim();
}

/** The shell is flat (no nesting or at-rules), so selector/block pairs suffice. */
function parseRules(css) {
  const rules = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = re.exec(css)) !== null) {
    rules.push({ selector: normalize(match[1]), declarations: match[2] });
  }
  return rules;
}

/**
 * Value of `property` in a declaration block, or null. The leading (^|;) stops
 * `color` from matching inside `background-color`.
 */
function declarationValue(declarations, property) {
  const re = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, 'i');
  const match = declarations.match(re);
  return match ? normalize(match[1]) : null;
}

function findRule(rules, pair) {
  if (pair.selector) {
    return rules.find((rule) => rule.selector === pair.selector) || null;
  }
  return rules.find((rule) => rule.selector.includes(pair.selectorIncludes)) || null;
}

function readShellValues() {
  const source = fs.readFileSync(CRITICAL, 'utf8');
  const styleMatch = source.match(/<style>([\s\S]*?)<\/style>/);
  assert.ok(styleMatch, 'no <style> block found in critical.njk');
  return parseRules(stripComments(styleMatch[1]));
}

function readStylesheetValue(rootBlock, pair) {
  if (pair.token) {
    // `--font-family\s*:` cannot match `--font-family-display:` (a hyphen follows).
    const re = new RegExp(`--${pair.token}\\s*:\\s*([^;]+);`);
    const match = rootBlock.match(re);
    return match ? normalize(match[1]) : null;
  }
  const re = new RegExp(`(?:^|;|\\{)\\s*${pair.rootProperty}\\s*:\\s*([^;]+);`);
  const match = rootBlock.match(re);
  return match ? normalize(match[1]) : null;
}

function runChecks(result) {
  const file = addFile(result, 'src/_includes/head/critical.njk', 'critical.njk');

  function check(name, fn) {
    try {
      fn();
    } catch (err) {
      addIssue(file, {
        type: 'critical-css',
        message: `${name}: ${err.message}`,
        ruleId: 'critical-css',
      });
    }
  }

  let rules;
  let rootBlock;

  check('shell and stylesheet :root both parse', () => {
    rules = readShellValues();
    rootBlock = stripComments(extractCssCustomProperties());
    assert.ok(rules.length > 0, 'no CSS rules parsed from the shell');
  });

  // Parsing failed: report that alone rather than emitting misleading mismatches.
  if (!rules || !rootBlock) {
    return;
  }

  for (const pair of PAIRS) {
    check(`${pair.label} matches the stylesheet`, () => {
      const rule = findRule(rules, pair);
      assert.ok(
        rule,
        `no rule for ${pair.selector || `selector containing "${pair.selectorIncludes}"`} in critical.njk`
      );

      const shellValue = declarationValue(rule.declarations, pair.property);
      assert.ok(shellValue, `critical.njk rule "${rule.selector}" has no ${pair.property}`);

      const cssValue = readStylesheetValue(rootBlock, pair);
      const cssName = pair.token ? `--${pair.token}` : pair.rootProperty;
      assert.ok(cssValue, `jonplummer.css :root has no ${cssName}`);

      assert.strictEqual(
        shellValue,
        cssValue,
        `critical.njk has "${shellValue}" but jonplummer.css ${cssName} is "${cssValue}" — ` +
          'update the shell, or the first paint will flash the wrong value'
      );
    });
  }
}

runTest({
  testType: 'critical-css',
  testName: 'Critical CSS shell sync',
  requiresSite: false,
  validateFn: async (result) => {
    runChecks(result);
  },
});
