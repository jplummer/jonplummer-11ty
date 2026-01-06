/**
 * Eleventy configuration: Filter registration
 * 
 * Called from `.eleventy.js` during Eleventy initialization (after markdown renderer is created).
 * Registers all custom filters available in Nunjucks templates, including date formatting,
 * markdown processing, and data manipulation filters.
 */

const fs = require("fs");
const { normalizeDate, formatPostDate, formatDateRange } = require("../utils/date-utils");
const { extractCssCustomProperties } = require("../utils/css-utils");
const mergePostsAndLinks = require("../filters/merge-posts-and-links");

/**
 * Registers all Eleventy filters.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 * @param {object} md - Markdown renderer instance
 */
function configureFilters(eleventyConfig, md) {
  // Add readFile filter
  eleventyConfig.addFilter("readFile", (filePath) => {
    return fs.readFileSync(filePath, "utf8");
  });

  // Add custom Nunjucks filter: limit
  eleventyConfig.addFilter("limit", function (array, limit) {
    if (!Array.isArray(array)) return array;
    return array.slice(0, limit);
  });

  // add postDate filter
  eleventyConfig.addFilter("postDate", formatPostDate);
  
  // add dateRange filter
  eleventyConfig.addFilter("dateRange", formatDateRange);

  // Override dateToRfc3339 as a plugin to ensure it runs AFTER the RSS plugin registers its filter
  // Plugins run in a second configuration stage, so we must use a plugin wrapper to override
  // the RSS plugin's filter. This handles DateTime objects from our custom date parsing.
  eleventyConfig.addPlugin(function(eleventyConfig) {
    eleventyConfig.addNunjucksFilter("dateToRfc3339", (dateObj) => {
      if (!dateObj) {
        return '';
      }
      
      let date;
      
      // If it's a DateTime, convert to Date
      if (dateObj && typeof dateObj === 'object' && typeof dateObj.toJSDate === 'function') {
        date = dateObj.toJSDate();
      } else if (dateObj instanceof Date) {
        date = dateObj;
      } else {
        // Otherwise, try to normalize
        date = normalizeDate(dateObj);
      }
      
      // Validate date
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return '';
      }
      
      // Format as RFC3339 (ISO 8601) - toISOString() produces RFC3339 format
      return date.toISOString();
    });
  });

  // Add markdown filter
  eleventyConfig.addFilter("markdown", function (content) {
    return md.render(content);
  });

  // Add inline markdown filter (no block-level elements like <p>)
  eleventyConfig.addFilter("markdownInline", function (content) {
    return md.renderInline(content);
  });

  // Add smart quotes filter (applies typographer rules to plain text)
  eleventyConfig.addFilter("smartquotes", function (content) {
    if (!content) return content;
    // Use renderInline to apply typographer rules, then extract text content
    // This converts straight quotes to smart quotes without other markdown processing
    return md.renderInline(String(content));
  });

  // Add filter to strip HTML from titles (for use in anchor tags)
  // Prevents nested anchors when titles contain domain names that get auto-linked
  eleventyConfig.addFilter("stripHtml", function (content) {
    if (!content) return content;
    // Remove HTML tags but preserve text content
    // SECURITY NOTE: This regex is acceptable here because we're processing trusted content
    // (our own post titles), not user input. For untrusted content, use a proper HTML
    // sanitization library.
    return String(content).replace(/<[^>]*>/g, '');
  });

  // Add JSON filter for escaping strings in JSON-LD
  eleventyConfig.addFilter("json", function (value) {
    return JSON.stringify(value);
  });

  // Extract CSS custom properties from main stylesheet (for OG image preview)
  eleventyConfig.addFilter("extractCssCustomProperties", extractCssCustomProperties);

  // Add custom filter to merge posts and links chronologically
  eleventyConfig.addFilter("mergePostsAndLinks", mergePostsAndLinks);

  // Add truncate filter for strings
  eleventyConfig.addFilter("truncate", function (str, length, append = '...') {
    if (!str || typeof str !== 'string') return str;
    if (str.length <= length) return str;
    return str.slice(0, length - append.length) + append;
  });
}

module.exports = configureFilters;

