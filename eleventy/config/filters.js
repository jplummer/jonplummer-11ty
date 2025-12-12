/**
 * Eleventy configuration: Filter registration
 * 
 * Called from `.eleventy.js` during Eleventy initialization (after markdown renderer is created).
 * Registers all custom filters available in Nunjucks templates, including date formatting,
 * markdown processing, and data manipulation filters.
 */

const fs = require("fs");
const pluginRss = require("@11ty/eleventy-plugin-rss");
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

  // Wrap dateToRfc3339 to handle both Date objects and date strings
  eleventyConfig.addFilter("dateToRfc3339Safe", (dateObj) => {
    const date = normalizeDate(dateObj);
    if (!date) {
      return '';
    }
    return pluginRss.dateToRfc3339(date);
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
}

module.exports = configureFilters;

