/**
 * Eleventy configuration: Filter registration
 * 
 * Called from `.eleventy.js` during Eleventy initialization (after markdown renderer is created).
 * Registers all custom filters available in Nunjucks templates, including date formatting,
 * markdown processing, and data manipulation filters.
 */

const { normalizeDate, formatPostDate, formatDateRange } = require("../utils/date-utils");
const { extractCssCustomProperties } = require("../utils/css-utils");
const { mergePostsAndLinks } = require("../utils/merge-posts-links");

/**
 * Registers all Eleventy filters.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 * @param {object} md - Markdown renderer instance
 */
function configureFilters(eleventyConfig, md) {
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
      const date = normalizeDate(dateObj);
      if (!date || isNaN(date.getTime())) {
        return '';
      }
      // Format as RFC3339 (ISO 8601) - toISOString() produces RFC3339 format
      return date.toISOString();
    });
  });

  // Add inline markdown filter (no block-level elements like <p>)
  eleventyConfig.addFilter("markdownInline", function (content) {
    return md.renderInline(content);
  });

  // Block markdown (for data-driven bodies, e.g. collected wisdom)
  eleventyConfig.addFilter("markdown", function (content) {
    if (!content) return "";
    return md.render(String(content));
  });

  // Add smart quotes filter (applies typographer rules to plain text)
  eleventyConfig.addFilter("smartquotes", function (content) {
    if (!content) return content;
    // Use renderInline to apply typographer rules, then extract text content
    // This converts straight quotes to smart quotes without other markdown processing
    return md.renderInline(String(content));
  });

  // Extract CSS custom properties from main stylesheet (for OG image preview)
  eleventyConfig.addFilter("extractCssCustomProperties", extractCssCustomProperties);

  // Add custom filter to merge posts and links chronologically
  eleventyConfig.addFilter("mergePostsAndLinks", mergePostsAndLinks);


}

module.exports = configureFilters;

