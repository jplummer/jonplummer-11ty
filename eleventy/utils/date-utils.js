const { DateTime } = require("luxon");

/**
 * Normalizes a date value to a Date object.
 * Handles both Date objects and date strings.
 * 
 * @param {Date|string|null|undefined} dateObj - Date to normalize
 * @returns {Date|null} Normalized Date object, or null if input is null/undefined
 */
function normalizeDate(dateObj) {
  if (dateObj === null || dateObj === undefined) {
    return null;
  }
  return dateObj instanceof Date ? dateObj : new Date(dateObj);
}

/**
 * Formats a date for display in posts.
 * Uses Luxon to format as medium date (e.g., "Jan 15, 2024").
 * 
 * @param {Date|string} dateObj - Date to format
 * @returns {string} Formatted date string
 */
function formatPostDate(dateObj) {
  const date = normalizeDate(dateObj);
  if (!date) {
    return '';
  }
  return DateTime.fromJSDate(date).toLocaleString(DateTime.DATE_MED);
}

/**
 * Formats a date range minimally (e.g., "Jan 1 - Jan 15, 2024" or "Jan 15, 2024").
 * If both dates are the same, returns just the single date.
 * 
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {string} Formatted date range string
 */
function formatDateRange(startDate, endDate) {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  
  if (!start || !end) {
    return '';
  }
  
  const startDt = DateTime.fromJSDate(start);
  const endDt = DateTime.fromJSDate(end);
  
  // If same date, return single date
  if (startDt.hasSame(endDt, 'day')) {
    return startDt.toLocaleString(DateTime.DATE_MED);
  }
  
  // Format: "Jan 1 - Jan 15, 2024"
  const startFormatted = startDt.toFormat('LLL d');
  const endFormatted = endDt.toLocaleString(DateTime.DATE_MED);
  
  return `${startFormatted} - ${endFormatted}`;
}

module.exports = {
  normalizeDate,
  formatPostDate,
  formatDateRange
};

