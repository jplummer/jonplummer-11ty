#!/usr/bin/env node

/**
 * Guards wrapFilenames(): changelog commit lines mention files like ideas.md,
 * and markdown-it's linkify treats .md as Moldova's TLD, so a bare filename
 * becomes <a href="https://ideas.md">. Wrapping in backticks keeps it code.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const markdownIt = require('markdown-it');
const { wrapFilenames } = require('../utils/changelog-format');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const md = markdownIt({ html: true, linkify: true });
const GENERATOR = path.join(__dirname, '../content/generate-changelog.js');

function htmlOf(text) {
  return md.renderInline(wrapFilenames(text));
}

function runUnitAssertions(result) {
  const file = addFile(result, 'scripts/utils/changelog-format.js', 'changelog-format');

  function check(name, fn) {
    try {
      fn();
    } catch (err) {
      addIssue(file, {
        type: 'changelog-format',
        message: `${name}: ${err.message}`,
        ruleId: 'changelog-format',
      });
    }
  }

  check('wraps a bare .md filename in backticks', () => {
    assert.strictEqual(
      wrapFilenames('Close the talks-sweep entry in ideas.md'),
      'Close the talks-sweep entry in `ideas.md`'
    );
  });

  check('wrapped .md does not linkify as a Moldova TLD', () => {
    const html = htmlOf('Close the talks-sweep entry in ideas.md');
    assert.ok(!html.includes('<a '), html);
    assert.ok(html.includes('<code>ideas.md</code>'), html);
  });

  check('wraps every bare filename on a line', () => {
    assert.strictEqual(
      wrapFilenames('Document the workflow in commands.md and authoring.md'),
      'Document the workflow in `commands.md` and `authoring.md`'
    );
  });

  check('does not double-wrap filenames already in backticks', () => {
    assert.strictEqual(
      wrapFilenames('Close the talks-sweep entry in `ideas.md`'),
      'Close the talks-sweep entry in `ideas.md`'
    );
  });

  check('leaves slash-prefixed paths alone (they do not linkify)', () => {
    assert.strictEqual(wrapFilenames('See docs/ideas.md'), 'See docs/ideas.md');
  });

  check('does not break a URL that ends in .md', () => {
    const url = 'See https://example.com/foo.md';
    assert.strictEqual(wrapFilenames(url), url);
    const html = htmlOf(url);
    assert.ok(html.includes('href="https://example.com/foo.md"'), html);
  });

  check('wraps other source filenames as code', () => {
    assert.strictEqual(wrapFilenames('Update deploy.js'), 'Update `deploy.js`');
    assert.strictEqual(wrapFilenames('Fix links.yaml'), 'Fix `links.yaml`');
    assert.strictEqual(wrapFilenames('Drop license.njk'), 'Drop `license.njk`');
  });

  check('generate-changelog.js applies wrapFilenames to commit lines', () => {
    const source = fs.readFileSync(GENERATOR, 'utf8');
    assert.ok(
      source.includes('wrapFilenames('),
      'generate-changelog.js must call wrapFilenames('
    );
  });
}

runTest({
  testType: 'changelog-format',
  testName: 'Changelog Filename Wrap',
  requiresSite: false,
  validateFn: async (result) => {
    runUnitAssertions(result);
  },
});
