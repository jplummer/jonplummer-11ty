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

module.exports = {
  normalizeDate,
  formatPostDate
};

