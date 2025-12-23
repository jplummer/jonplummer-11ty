/**
 * Eleventy configuration: Date parsing
 * 
 * Called from `.eleventy.js` during Eleventy initialization.
 * Configures custom date parsing to handle timezone-aware dates and default
 * to PST/PDT for dates without timezone information.
 */

const { DateTime } = require("luxon");

/**
 * Default timezone for dates without timezone info (PST/PDT)
 * This ensures dates like "2025-10-08" are interpreted in the author's timezone
 * rather than UTC, which could cause day shifts.
 */
const TIME_ZONE = "America/Los_Angeles";

/**
 * Configures Eleventy date parsing.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 */
function configureDateParsing(eleventyConfig) {
  eleventyConfig.addDateParsing(function(dateValue) {
    let localDate;
    
    if (dateValue instanceof Date) {
      // Date objects from YAML are assumed to be UTC
      // Convert to our default timezone while keeping the same local time
      localDate = DateTime.fromJSDate(dateValue, { zone: "utc" })
        .setZone(TIME_ZONE, { keepLocalTime: true });
    } else if (typeof dateValue === "string") {
      // Check if string has timezone info (Z or +/-HH:MM)
      const hasTimezone = dateValue.includes("T") && 
        (dateValue.includes("Z") || dateValue.match(/[+-]\d{2}:\d{2}$/));
      
      if (hasTimezone) {
        // Has timezone info - parse it as-is (preserves timezone from string)
        localDate = DateTime.fromISO(dateValue);
      } else {
        // No timezone - assume PST/PDT
        localDate = DateTime.fromISO(dateValue, { zone: TIME_ZONE });
      }
    }
    
    // If we didn't create a localDate (dateValue wasn't Date or string), return undefined
    // This lets Eleventy use its default date parsing
    if (!localDate) {
      return;
    }
    
    if (localDate?.isValid === false) {
      throw new Error(
        `Invalid \`date\` value (${dateValue}) is invalid for ${this.page.inputPath}: ${localDate.invalidReason}`
      );
    }
    
    // Return DateTime - Eleventy automatically converts to Date using .toJSDate()
    // 
    // Why return DateTime instead of Date?
    // - DateTime preserves timezone intent (e.g., "2025-10-08" = Oct 8 in PST, not UTC)
    // - Eleventy converts DateTime → Date (preserves moment in time, loses timezone)
    // - Permalink function converts Date → DateTime in PST to extract date components correctly
    // 
    // This round-trip ensures URLs match the date in frontmatter regardless of build system timezone
    return localDate;
  });
}

module.exports = configureDateParsing;
