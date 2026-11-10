#!/usr/bin/env node

/**
 * Guards date-utils display helpers: date-only strings must format as the
 * America/Los_Angeles calendar day (not UTC-midnight → previous Pacific day).
 */

const assert = require('assert');
const { DateTime } = require('luxon');
const {
  formatPostDate,
  formatPostDateAttr,
  toDateTime,
  TIME_ZONE,
} = require('../../eleventy/utils/date-utils');
const { test } = require('node:test');

test('date-only string displays LA calendar day', () => {
  assert.strictEqual(formatPostDate('2025-12-30'), 'Dec 30, 2025');
  assert.strictEqual(formatPostDateAttr('2025-12-30'), '2025-12-30');
});

test('date-only string is not UTC-shifted to previous day', () => {
  // Regression: `new Date("2025-12-30")` is UTC midnight → Dec 29 in LA
  const utcParsed = new Date('2025-12-30');
  assert.strictEqual(
    DateTime.fromJSDate(utcParsed, { zone: TIME_ZONE }).toFormat('yyyy-MM-dd'),
    '2025-12-29',
    'precondition: JS date-only parse is UTC midnight'
  );
  assert.strictEqual(formatPostDate('2025-12-30'), 'Dec 30, 2025');
});

test('LA midnight Date displays same calendar day', () => {
  const js = DateTime.fromISO('2025-12-30', { zone: TIME_ZONE }).toJSDate();
  assert.strictEqual(formatPostDate(js), 'Dec 30, 2025');
  assert.strictEqual(formatPostDateAttr(js), '2025-12-30');
});

test('toDateTime zone is America/Los_Angeles', () => {
  const dt = toDateTime('2025-12-30');
  assert.ok(dt);
  assert.strictEqual(dt.zoneName, TIME_ZONE);
});
