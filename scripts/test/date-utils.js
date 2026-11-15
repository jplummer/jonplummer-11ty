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
  formatDateRange,
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

test('a date range within one year names the year once', () => {
  assert.strictEqual(formatDateRange('2026-02-15', '2026-04-04'), 'Feb 15–Apr 4, 2026');
  assert.strictEqual(formatDateRange('2026-01-01', '2026-12-31'), 'Jan 1–Dec 31, 2026');
});

// Until 2026-11-15 the start never carried a year, so /page/6/ was titled
// "Nov 20–Feb 11, 2026" and /page/8/ "Jul 31–Jul 27, 2025".
test('a date range across years names both years', () => {
  assert.strictEqual(formatDateRange('2025-11-20', '2026-02-11'), 'Nov 20, 2025–Feb 11, 2026');
  assert.strictEqual(formatDateRange('2024-07-31', '2025-07-27'), 'Jul 31, 2024–Jul 27, 2025');
  assert.strictEqual(formatDateRange('2025-12-31', '2026-01-01'), 'Dec 31, 2025–Jan 1, 2026');
});

test('the year a range falls in is the Pacific year', () => {
  // 11 pm PST on Dec 31, 2025 is already 2026 in UTC.
  const lateDec = new Date('2026-01-01T07:00:00Z');
  assert.strictEqual(formatDateRange('2025-12-01', lateDec), 'Dec 1–Dec 31, 2025');
  assert.strictEqual(formatDateRange(lateDec, '2026-01-02'), 'Dec 31, 2025–Jan 2, 2026');
});

test('a range of one day is that day, and a missing end gives nothing', () => {
  assert.strictEqual(formatDateRange('2026-03-10', '2026-03-10'), 'Mar 10, 2026');
  assert.strictEqual(formatDateRange('2026-03-10', null), '');
});
