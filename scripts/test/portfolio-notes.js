#!/usr/bin/env node

/**
 * Unit tests for portfolio speaker-notes parsing (numbered + blank-line formats).
 */

const { test } = require('node:test');
const assert = require('assert');
const { parseNotesContent } = require('../utils/portfolio-notes');

function assertNotesEqual(actual, expected, label) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  assert.strictEqual(a, b, `${label}: expected ${b}, got ${a}`);
}

test('numbered lines keep an empty middle slide', () => {
  assertNotesEqual(
    parseNotesContent('1: first\n2: \n3: third\n'),
    ['first', '', 'third'],
    'numbered format with empty middle slide',
  );
});

test('numbered lines are read after leading blank lines', () => {
  assertNotesEqual(
    parseNotesContent('\n\n1: only\n'),
    ['only'],
    'numbered format after leading blank lines',
  );
});

test('a "Slide N:" prefix counts as a numbered line', () => {
  assertNotesEqual(
    parseNotesContent('Slide 1: hello\nSlide 2: world\n'),
    ['hello', 'world'],
    'Slide N: prefix',
  );
});

test('a closing paren works as the number delimiter', () => {
  assertNotesEqual(
    parseNotesContent('1) one\n2) two\n'),
    ['one', 'two'],
    'numbered with paren delimiter',
  );
});

test('unnumbered notes split on blank lines', () => {
  assertNotesEqual(
    parseNotesContent('alpha\n\nbeta gamma\n'),
    ['alpha', 'beta gamma'],
    'blank-line separated notes',
  );
});

test('an empty file gives no notes', () => {
  assertNotesEqual(
    parseNotesContent(''),
    [],
    'empty file',
  );
});
