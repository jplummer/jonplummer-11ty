/**
 * Eleventy configuration: Filter registration
 * 
 * Called from `.eleventy.js` during Eleventy initialization (after markdown renderer is created).
 * Registers all custom filters available in Nunjucks templates, including date formatting,
 * markdown processing, and data manipulation filters.
 */

const { normalizeDate, formatPostDate, formatPostDateAttr } = require("../utils/date-utils");
const { mergePostsAndLinks } = require("../utils/merge-posts-links");
const { pickTaglineForUrl, getGitHeadSha } = require("../utils/tagline-for-url");
const siteData = require("../../src/_data/site.js")();

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

  // add postDate filter (always America/Los_Angeles — matches permalinks)
  eleventyConfig.addFilter("postDate", formatPostDate);
  eleventyConfig.addFilter("postDateAttr", formatPostDateAttr);

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

  // Block markdown (for data-driven bodies, e.g. collected wisdom)
  eleventyConfig.addFilter("markdown", function (content) {
    if (!content) return "";
    return md.render(String(content));
  });

  // Inline markdown with typographer rules: smart quotes and dashes, plus links
  // and emphasis, but no block elements like <p>. Pipe through striptags where
  // the context needs plain text (titles), or safe where markup is wanted.
  eleventyConfig.addFilter("smartquotes", function (content) {
    if (!content) return content;
    return md.renderInline(String(content));
  });

  // Items from a collection in the order of a list of URLs (portfolio lists in
  // src/_data/portfolios.yaml). A URL with no page fails the build, so a typo
  // can't drop a card silently; `pnpm run test portfolios` catches it earlier.
  eleventyConfig.addFilter("itemsByUrl", function (collection, urls) {
    const byUrl = new Map(collection.map((item) => [item.url, item]));
    return (urls || []).map((url) => {
      const item = byUrl.get(url);
      if (!item) throw new Error(`itemsByUrl: no page at ${url}`);
      return item;
    });
  });

  // Add custom filter to merge posts and links chronologically
  eleventyConfig.addFilter("mergePostsAndLinks", mergePostsAndLinks);

  // Lockup tagline: deterministic per page.url; home salted with git HEAD
  const taglineSalt = getGitHeadSha();
  eleventyConfig.addFilter("taglineForPage", (pageUrl) =>
    pickTaglineForUrl(siteData.taglines, pageUrl, taglineSalt)
  );
}

module.exports = configureFilters;

