#!/usr/bin/env node

/**
 * Portfolio grid cover crop: front-matter allowlists, CSS custom properties,
 * template wiring, and (when built) Monotasker HTML.
 */

const fs = require('fs');
const path = require('path');
const { validateCoverPosition, validateCoverZoom } = require('../utils/validation-utils');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const ROOT = path.join(__dirname, '..', '..');

function check(fileObj, label, fn) {
  try {
    fn();
  } catch (err) {
    addIssue(fileObj, {
      type: 'portfolio-cover-crop',
      message: `${label}: ${err.message}`,
      ruleId: 'portfolio-cover-crop',
    });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateValidators(result) {
  const fileObj = addFile(result, 'scripts/utils/validation-utils.js', 'cover crop validators');

  const goodPositions = ['center', 'center 20%', 'top left', '50% 20%', 'center 50.5%'];
  for (const value of goodPositions) {
    check(fileObj, `position ok: ${value}`, () => {
      const r = validateCoverPosition(value);
      assert(r.valid, r.error || 'expected valid');
    });
  }

  const badPositions = ['', 'center center center', 'zoom', '20', 'center 20', 'url(x)', 'center; color: red'];
  for (const value of badPositions) {
    check(fileObj, `position reject: ${JSON.stringify(value)}`, () => {
      const r = validateCoverPosition(value);
      assert(!r.valid, `expected invalid, got valid for ${JSON.stringify(value)}`);
    });
  }

  check(fileObj, 'position rejects non-string', () => {
    assert(!validateCoverPosition(20).valid, 'number should fail');
    assert(!validateCoverPosition(null).valid, 'null should fail');
  });

  for (const value of [1, 1.25, 3, '1', '2.5']) {
    check(fileObj, `zoom ok: ${value}`, () => {
      const r = validateCoverZoom(value);
      assert(r.valid, r.error || 'expected valid');
    });
  }

  for (const value of [0.9, 3.1, 125, 0, -1, 'nope', '', NaN, Infinity]) {
    check(fileObj, `zoom reject: ${value}`, () => {
      const r = validateCoverZoom(value);
      assert(!r.valid, `expected invalid for ${value}`);
    });
  }
}

function validateCssSource(result) {
  const cssPath = path.join(ROOT, 'src/assets/css/jonplummer.css');
  const css = fs.readFileSync(cssPath, 'utf8');
  const fileObj = addFile(result, cssPath, 'jonplummer.css');

  const required = [
    'object-position: var(--cover-object-position, center)',
    'transform-origin: var(--cover-object-position, center)',
    'scale: var(--cover-zoom, 1)',
  ];
  for (const snippet of required) {
    if (!css.includes(snippet)) {
      addIssue(fileObj, {
        type: 'portfolio-cover-crop',
        message: `Missing CSS: ${snippet}`,
        ruleId: 'portfolio-cover-crop',
      });
    }
  }

  if (!/article:is\(\.portfolio-item, \.side-item\) a > picture[\s\S]*overflow:\s*hidden/.test(css)) {
    addIssue(fileObj, {
      type: 'portfolio-cover-crop',
      message: 'picture/img cover wrapper must set overflow: hidden',
      ruleId: 'portfolio-cover-crop',
    });
  }

  if (/article\.portfolio-item#[\w-]+\s+img[\s\S]*object-position/.test(css)) {
    addIssue(fileObj, {
      type: 'portfolio-cover-crop',
      message: 'Do not use per-slug object-position rules; use coverPosition front matter',
      ruleId: 'portfolio-cover-crop',
    });
  }
}

function validateTemplateAndPost(result) {
  const njkPath = path.join(ROOT, 'src/_includes/components/portfolio_list_item.njk');
  const njk = fs.readFileSync(njkPath, 'utf8');
  const njkObj = addFile(result, njkPath, 'portfolio_list_item.njk');
  if (!njk.includes('--cover-object-position') || !njk.includes('--cover-zoom')) {
    addIssue(njkObj, {
      type: 'portfolio-cover-crop',
      message: 'portfolio_list_item.njk must set --cover-object-position and --cover-zoom from front matter',
      ruleId: 'portfolio-cover-crop',
    });
  }

  const postPath = path.join(ROOT, 'src/_posts/2026/2026-06-05-monotasker.md');
  const post = fs.readFileSync(postPath, 'utf8');
  const postObj = addFile(result, postPath, 'monotasker.md');
  if (!/^coverPosition:\s*center 20%\s*$/m.test(post)) {
    addIssue(postObj, {
      type: 'portfolio-cover-crop',
      message: 'Monotasker must set coverPosition: center 20%',
      ruleId: 'portfolio-cover-crop',
    });
  }
}

function validateBuiltHtml(result) {
  const htmlPath = path.join(ROOT, '_site/portfolio/index.html');
  if (!fs.existsSync(htmlPath)) {
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const fileObj = addFile(result, htmlPath, 'portfolio/index.html');
  const articleMatch = html.match(/<article class="portfolio-item" id="monotasker"[^>]*>/);
  if (!articleMatch) {
    addIssue(fileObj, {
      type: 'portfolio-cover-crop',
      message: 'Built portfolio HTML missing article#monotasker',
      ruleId: 'portfolio-cover-crop',
    });
    return;
  }
  if (!articleMatch[0].includes('--cover-object-position: center 20%')) {
    addIssue(fileObj, {
      type: 'portfolio-cover-crop',
      message: 'Monotasker card must include style --cover-object-position: center 20%',
      ruleId: 'portfolio-cover-crop',
    });
  }
}

function validate(result) {
  validateValidators(result);
  validateCssSource(result);
  validateTemplateAndPost(result);
  validateBuiltHtml(result);
}

runTest({
  testType: 'portfolio-cover-crop',
  testName: 'Portfolio cover crop',
  requiresSite: false,
  validateFn: validate,
});
