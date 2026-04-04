#!/usr/bin/env node

/**
 * Unit tests for portfolio speaker-notes parsing (numbered + blank-line formats).
 */

const { parseNotesContent } = require('../utils/portfolio-notes');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

function assertNotesEqual(fileObj, actual, expected, label) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'portfolio-notes-mismatch',
      message: `${label}: expected ${b}, got ${a}`,
    });
  }
}

async function validate(result) {
  const fileObj = addFile(result, 'scripts/utils/portfolio-notes.js (fixtures)');

  assertNotesEqual(
    fileObj,
    parseNotesContent('1: first\n2: \n3: third\n'),
    ['first', '', 'third'],
    'numbered format with empty middle slide',
  );

  assertNotesEqual(
    fileObj,
    parseNotesContent('\n\n1: only\n'),
    ['only'],
    'numbered format after leading blank lines',
  );

  assertNotesEqual(
    fileObj,
    parseNotesContent('Slide 1: hello\nSlide 2: world\n'),
    ['hello', 'world'],
    'Slide N: prefix',
  );

  assertNotesEqual(
    fileObj,
    parseNotesContent('1) one\n2) two\n'),
    ['one', 'two'],
    'numbered with paren delimiter',
  );

  assertNotesEqual(
    fileObj,
    parseNotesContent('alpha\n\nbeta gamma\n'),
    ['alpha', 'beta gamma'],
    'blank-line separated notes',
  );

  assertNotesEqual(
    fileObj,
    parseNotesContent(''),
    [],
    'empty file',
  );
}

runTest({
  testType: 'portfolio-notes',
  testName: 'Portfolio notes parsing',
  requiresSite: false,
  validateFn: validate,
  shouldSkipFn: () => {
    const { checkChangedFlag } = require('../utils/test-runner-helper');
    const fs = require('fs');
    const path = require('path');
    if (!checkChangedFlag()) {
      return false;
    }
    const { getChangedFilesSinceHead } = require('../utils/test-helpers');
    const changed = getChangedFilesSinceHead();
    const watched = [
      'scripts/utils/portfolio-notes.js',
      'scripts/test/portfolio-notes.js',
    ];
    return !changed.some((p) => watched.some((w) => p === w || p.endsWith(`/${w}`)));
  },
  skipMessage: '✅ portfolio-notes parser not changed since last commit',
});
