/**
 * Utility: Date formatting and normalization
 * 
 * Utility module used by filters, shortcodes, and templates throughout the site.
 * Provides date normalization and formatting functions using Luxon.
 */

const { DateTime } = require("luxon");

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
  // isValid is a boolean property in Luxon, not a function
  if (dateObj && typeof dateObj === 'object' && 'isValid' in dateObj && typeof dateObj.toJSDate === 'function') {
    // This is a Luxon DateTime object
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
  if (!dateObj) {
    return '';
  }
  
  // If it's already a Luxon DateTime, use it directly
  if (dateObj && typeof dateObj === 'object' && 'isValid' in dateObj && typeof dateObj.toJSDate === 'function') {
    return dateObj.toLocaleString(DateTime.DATE_MED);
  }
  
  // Otherwise, normalize to Date and convert to Luxon
  const date = normalizeDate(dateObj);
  if (!date) {
    return '';
  }
  return DateTime.fromJSDate(date).toLocaleString(DateTime.DATE_MED);
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
  if (!startDate || !endDate) {
    return '';
  }
  
  // Convert to Luxon DateTime objects, handling both Date and DateTime inputs
  let startDt, endDt;
  
  if (startDate && typeof startDate === 'object' && 'isValid' in startDate && typeof startDate.toJSDate === 'function') {
    // Already a Luxon DateTime
    startDt = startDate;
  } else {
    const start = normalizeDate(startDate);
    if (!start) {
      return '';
    }
    startDt = DateTime.fromJSDate(start);
  }
  
  if (endDate && typeof endDate === 'object' && 'isValid' in endDate && typeof endDate.toJSDate === 'function') {
    // Already a Luxon DateTime
    endDt = endDate;
  } else {
    const end = normalizeDate(endDate);
    if (!end) {
      return '';
    }
    endDt = DateTime.fromJSDate(end);
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

