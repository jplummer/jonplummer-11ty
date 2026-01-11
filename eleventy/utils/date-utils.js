/**
 * Utility: Date formatting and normalization
 * 
 * Utility module used by filters, shortcodes, and templates throughout the site.
 * Provides date normalization and formatting functions using Luxon.
 */

const { DateTime } = require("luxon");

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
 * Converts any date-like value to a Luxon DateTime object.
 * 
 * @param {Date|string|DateTime|null|undefined} dateObj - Date to convert
 * @returns {DateTime|null} Luxon DateTime object, or null if input is null/undefined/invalid
 */
function toDateTime(dateObj) {
  if (!dateObj) {
    return null;
  }
  
  // If already a Luxon DateTime, return as-is
  if (isLuxonDateTime(dateObj)) {
    return dateObj;
  }
  
  // Normalize to Date first, then convert to DateTime
  const date = normalizeDate(dateObj);
  if (!date) {
    return null;
  }
  
  return DateTime.fromJSDate(date);
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
  
  // Otherwise, try to create a Date from the value (string, number, etc.)
  return new Date(dateObj);
}

/**
 * Formats a date for display in posts.
 * Uses Luxon to format as medium date (e.g., "Jan 15, 2024").
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
  normalizeDate,
  formatPostDate,
  formatDateRange
};

