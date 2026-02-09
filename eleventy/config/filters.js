/**
 * Eleventy configuration: Filter registration
 * 
 * Called from `.eleventy.js` during Eleventy initialization (after markdown renderer is created).
 * Registers all custom filters available in Nunjucks templates, including date formatting,
 * markdown processing, and data manipulation filters.
 */

const { normalizeDate, formatPostDate, formatDateRange } = require("../utils/date-utils");
const { extractCssCustomProperties } = require("../utils/css-utils");

/**
 * Merges posts and links chronologically for display on the homepage.
 * Handles pagination by including links between posts based on date ranges.
 * 
 * @param {Array} posts - Array of post objects
 * @param {Object} links - Object with date keys and link arrays as values
 * @param {number} pageNumber - Current page number (0-indexed)
 * @param {Date|string|null} nextPageOldestDate - Date of oldest post on next page
 * @returns {Array} Chronologically sorted array of items with type ('post' or 'link')
 */
function mergePostsAndLinks(posts, links, pageNumber, nextPageOldestDate) {
  if (!posts) return [];
  if (!links) {
    return posts.map(post => ({ type: 'post', data: post, date: new Date(post.data.date) }));
  }

  const isPage1 = pageNumber !== undefined && pageNumber === 0;
  const items = [];

  // Sort posts by date (newest first)
  const sortedPosts = [...posts].map(post => ({
    type: 'post',
    data: post,
    date: new Date(post.data.date)
  })).sort((a, b) => b.date - a.date);

  const newestPostDate = sortedPosts[0].date;
  const oldestPostDate = sortedPosts[sortedPosts.length - 1].date;

  // On page 1 only: Add links newer than the newest post first
  // All other pages: Start with the newest post, followed by links, repeating as needed
  if (isPage1) {
    for (const [date, linkList] of Object.entries(links)) {
      const linkDate = new Date(date);
      if (linkDate > newestPostDate) {
        for (let i = 0; i < linkList.length; i++) {
          const link = linkList[i];
          const isLastInGroup = i === linkList.length - 1;
          items.push({
            type: 'link',
            data: { ...link, isLastInGroup },
            date: linkDate
          });
        }
      }
    }
  }

  // For each post, add it and then add links between this post and the next post
  for (let i = 0; i < sortedPosts.length; i++) {
    const post = sortedPosts[i];
    const postDate = post.date;

    // Add the post
    items.push(post);

    // Determine the next post's date
    // If there's another post on this page, use its date
    // If this is the last post on the page, use next page's oldest post date
    // If this is the last post on the last page, include all older links
    let nextPostDate = null;
    if (i < sortedPosts.length - 1) {
      // There's another post on this page
      nextPostDate = sortedPosts[i + 1].date;
    } else if (nextPageOldestDate !== null && nextPageOldestDate !== undefined) {
      // This is the last post on the page, use next page's oldest post date
      nextPostDate = new Date(nextPageOldestDate);
    }
    // If nextPostDate is still null, this is the last post on the last page

    // Add links: linkDate <= postDate && linkDate > nextPostDate
    // If nextPostDate is null (last page), include all links where linkDate <= postDate
    for (const [date, linkList] of Object.entries(links)) {
      const linkDate = new Date(date);
      const isInRange = linkDate <= postDate && (nextPostDate === null || linkDate > nextPostDate);

      if (isInRange) {
        for (let j = 0; j < linkList.length; j++) {
          const link = linkList[j];
          const isLastInGroup = j === linkList.length - 1;
          items.push({
            type: 'link',
            data: { ...link, isLastInGroup },
            date: linkDate
          });
        }
      }
    }
  }

  // Sort chronologically (newest first)
  return items.sort((a, b) => b.date - a.date);
}

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
module.exports.mergePostsAndLinks = mergePostsAndLinks;

