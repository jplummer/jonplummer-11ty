/**
 * Permalink generation for posts
 * 
 * Uses timezone-aware date extraction to ensure URLs are consistent
 * regardless of build system timezone. Extracts date components from
 * the timezone specified in the date string itself.
 */

const { DateTime } = require("luxon");

module.exports = {
  permalink: function(data) {
    // CRITICAL: Timezone-aware date extraction for consistent URLs
    // 
    // Flow: DateTime (from addDateParsing) → Date (Eleventy conversion) → DateTime (here)
    // 
    // Why the round-trip?
    // 1. addDateParsing returns DateTime to preserve timezone intent (e.g., "2025-10-08" = Oct 8 in PST)
    // 2. Eleventy converts DateTime to Date (loses timezone, but preserves moment in time)
    // 3. We convert Date back to DateTime in PST to extract date components in the correct timezone
    // 
    // This ensures URLs like /2025/10/08/slug/ match the date in frontmatter, not the build system's timezone
    const TIME_ZONE = "America/Los_Angeles";
    
    // Helper to extract date components from a Date object (fallback only)
    function extractDateComponents(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return { year, month, day };
    }
    
    let dt;
    if (data.date instanceof Date) {
      // Normal case: Eleventy provides a Date object
      // Convert to DateTime in site's timezone to extract date components correctly
      dt = DateTime.fromJSDate(data.date, { zone: TIME_ZONE });
    } else if (typeof data.date === "string") {
      // Fallback: if somehow we get a string, parse it
      dt = DateTime.fromISO(data.date, { zone: TIME_ZONE });
    } else {
      // Last resort: use Date object directly (may be timezone-dependent)
      const { year, month, day } = extractDateComponents(new Date(data.date));
      return `/${year}/${month}/${day}/${data.page.fileSlug}/`;
    }
    
    if (!dt.isValid) {
      // Fallback if DateTime creation fails
      const { year, month, day } = extractDateComponents(new Date(data.date));
      return `/${year}/${month}/${day}/${data.page.fileSlug}/`;
    }
    
    // Extract date components from timezone-aware DateTime
    // This ensures the date in the URL matches the date in the timezone
    // specified in the frontmatter, not the build system's timezone
    const year = dt.year;
    const month = String(dt.month).padStart(2, '0');
    const day = String(dt.day).padStart(2, '0');
    return `/${year}/${month}/${day}/${data.page.fileSlug}/`;
  }
};
