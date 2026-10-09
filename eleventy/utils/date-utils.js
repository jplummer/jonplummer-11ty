/**
 * Utility: Date formatting and normalization
 *
 * Utility module used by filters, shortcodes, and templates throughout the site.
 * Provides date normalization and formatting functions using Luxon.
 *
 * Display and calendar-day extraction use America/Los_Angeles so they match
 * post permalinks (see src/_posts/_posts.11tydata.js), regardless of build TZ.
 */

const { DateTime } = require("luxon");

const TIME_ZONE = "America/Los_Angeles";

/**
 * Checks if a value is a Luxon DateTime object.
 *
 * @param {any} value - Value to check
 * @returns {boolean} True if value is a Luxon DateTime
 */
function isLuxonDateTime(value) {
  return value && typeof value === 'object' && 'isValid' in value && typeof value.toJSDate === 'function';
}

/**
 * Converts any date-like value to a Luxon DateTime in America/Los_Angeles.
 *
 * Date-only strings (`YYYY-MM-DD`) are midnight in that zone — never
 * `new Date("YYYY-MM-DD")`, which ES treats as UTC midnight and shifts the
 * calendar day in Pacific.
 *
 * @param {Date|string|DateTime|null|undefined} dateObj - Date to convert
 * @returns {DateTime|null} Luxon DateTime object, or null if input is null/undefined/invalid
 */
function toDateTime(dateObj) {
  if (dateObj === null || dateObj === undefined || dateObj === '') {
    return null;
  }

  let dt;
  if (isLuxonDateTime(dateObj)) {
    dt = dateObj.setZone(TIME_ZONE);
  } else if (typeof dateObj === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateObj)) {
      dt = DateTime.fromISO(dateObj, { zone: TIME_ZONE });
    } else {
      const hasTimezone = dateObj.includes('T') &&
        (dateObj.includes('Z') || /[+-]\d{2}:\d{2}$/.test(dateObj));
      dt = hasTimezone
        ? DateTime.fromISO(dateObj).setZone(TIME_ZONE)
        : DateTime.fromISO(dateObj, { zone: TIME_ZONE });
    }
  } else if (dateObj instanceof Date) {
    dt = DateTime.fromJSDate(dateObj, { zone: TIME_ZONE });
  } else {
    const date = normalizeDate(dateObj);
    if (!date) {
      return null;
    }
    dt = DateTime.fromJSDate(date, { zone: TIME_ZONE });
  }

  if (!dt || !dt.isValid) {
    return null;
  }
  return dt;
}

/**
 * Normalizes a date value to a Date object.
 * Handles Date objects, date strings, and Luxon DateTime objects.
 *
 * @param {Date|string|DateTime|null|undefined} dateObj - Date to normalize
 * @returns {Date|null} Normalized Date object, or null if input is null/undefined
 */
function normalizeDate(dateObj) {
  if (dateObj === null || dateObj === undefined) {
    return null;
  }

  // If already a Date object, return as-is
  if (dateObj instanceof Date) {
    return dateObj;
  }

  // If it's a Luxon DateTime object, convert to Date
  if (isLuxonDateTime(dateObj)) {
    return dateObj.toJSDate();
  }

  // Date-only: LA midnight (not UTC via `new Date("YYYY-MM-DD")`)
  if (typeof dateObj === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateObj)) {
    const dt = DateTime.fromISO(dateObj, { zone: TIME_ZONE });
    return dt.isValid ? dt.toJSDate() : null;
  }

  // Otherwise, try to create a Date from the value (string, number, etc.)
  return new Date(dateObj);
}

/**
 * Formats a date for display in posts.
 * Uses Luxon to format as medium date (e.g., "Jan 15, 2024") in America/Los_Angeles.
 *
 * @param {Date|string|DateTime} dateObj - Date to format
 * @returns {string} Formatted date string
 */
function formatPostDate(dateObj) {
  const dt = toDateTime(dateObj);
  if (!dt) {
    return '';
  }
  return dt.toLocaleString(DateTime.DATE_MED);
}

/**
 * Calendar day for `<time datetime>` — always YYYY-MM-DD in America/Los_Angeles.
 *
 * @param {Date|string|DateTime} dateObj - Date to format
 * @returns {string} YYYY-MM-DD or empty string
 */
function formatPostDateAttr(dateObj) {
  const dt = toDateTime(dateObj);
  if (!dt) {
    return '';
  }
  return dt.toFormat('yyyy-MM-dd');
}

/**
 * Formats a date range minimally (e.g., "Jan 1–Jan 15, 2024" or "Jan 15, 2024").
 * If both dates are the same, returns just the single date.
 * Uses en dash with no spaces when numbers are adjacent to the dash.
 *
 * @param {Date|string|DateTime} startDate - Start date
 * @param {Date|string|DateTime} endDate - End date
 * @returns {string} Formatted date range string
 */
function formatDateRange(startDate, endDate) {
  const startDt = toDateTime(startDate);
  const endDt = toDateTime(endDate);

  if (!startDt || !endDt) {
    return '';
  }

  // If same date, return single date
  if (startDt.hasSame(endDt, 'day')) {
    return startDt.toLocaleString(DateTime.DATE_MED);
  }

  // Format: "Jan 1–Jan 15, 2024" (en dash, no spaces)
  const startFormatted = startDt.toFormat('LLL d');
  const endFormatted = endDt.toLocaleString(DateTime.DATE_MED);

  // Use en dash (U+2013) with no spaces
  return `${startFormatted}–${endFormatted}`;
}

module.exports = {
  TIME_ZONE,
  normalizeDate,
  toDateTime,
  formatPostDate,
  formatPostDateAttr,
  formatDateRange
};
