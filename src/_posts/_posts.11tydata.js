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
    // data.date is a Date object (Eleventy converts DateTime from addDateParsing to Date)
    // Convert back to DateTime using the timezone from the original date parsing
    // The Date object represents the correct moment in time, we just need to extract
    // the date components in the correct timezone (PST/PDT for this site)
    const TIME_ZONE = "America/Los_Angeles";
    
    let dt;
    if (data.date instanceof Date) {
      // Convert Date to DateTime in the site's timezone
      // This preserves the date components as they were intended
      dt = DateTime.fromJSDate(data.date, { zone: TIME_ZONE });
    } else if (typeof data.date === "string") {
      // Fallback: if somehow we get a string, parse it
      dt = DateTime.fromISO(data.date, { zone: TIME_ZONE });
    } else {
      // Last resort fallback
      const date = new Date(data.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const slug = data.page.fileSlug;
      return `/${year}/${month}/${day}/${slug}/`;
    }
    
    if (!dt.isValid) {
      // Fallback if DateTime creation fails
      const date = new Date(data.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const slug = data.page.fileSlug;
      return `/${year}/${month}/${day}/${slug}/`;
    }
    
    // Extract date components from timezone-aware DateTime
    // This ensures the date in the URL matches the date in the timezone
    // specified in the frontmatter, not the build system's timezone
    const year = dt.year;
    const month = String(dt.month).padStart(2, '0');
    const day = String(dt.day).padStart(2, '0');
    const slug = data.page.fileSlug;
    return `/${year}/${month}/${day}/${slug}/`;
  }
};
