const { toDateTime } = require('./date-utils');

/**
 * The instant a links.yaml date key stands for: midnight Pacific on that day,
 * which is how a post's date is read, so a link and a post on one day compare
 * as the same day.
 *
 * A key arrives in one of two forms. Quoted in YAML it is "2026-03-10".
 * Unquoted, js-yaml reads it as a Date at midnight UTC, and as an object key
 * that becomes a long string such as "Tue Mar 10 2026 …"; the day it names is
 * that instant's UTC day, whatever zone the machine is in.
 *
 * @param {string} key - A date key from links.yaml
 * @returns {Date}
 */
function linkDate(key) {
  const text = String(key);
  let day = text;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const parsed = new Date(text);
    day = Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
  }
  const dt = toDateTime(day);
  if (!dt) {
    throw new Error(`links.yaml: "${text}" is not a date. Keys are YYYY-MM-DD.`);
  }
  return dt.toJSDate();
}

/**
 * The instant a post's date stands for, read as the rest of the site reads
 * it. The merge is handed `post.data.date`, which is the front matter text
 * ("2026-03-10", or a time with an offset), not the Date Eleventy parsed from
 * it. A date-only value is midnight Pacific, the same instant as a link keyed
 * to that day.
 *
 * @param {Date|string} value - A post's `data.date`
 * @returns {Date}
 */
function readPostDate(value) {
  const dt = toDateTime(value);
  return dt ? dt.toJSDate() : new Date(value);
}

/**
 * Merges posts and links chronologically for display on the homepage.
 * Handles pagination by including links between posts based on date ranges.
 *
 * @param {Array} posts - Array of post objects
 * @param {Object} links - Object with date keys and link arrays as values
 * @param {number} pageNumber - Current page number (0-indexed)
 * @param {Date|string|null} boundaryDate - Date of the next page's first (newest) post: links after this page's last post stop there. Null on the last page.
 * @returns {Array} Chronologically sorted array of items with type ('post' or 'link')
 */
function mergePostsAndLinks(posts, links, pageNumber, boundaryDate) {
  if (!posts || posts.length === 0) return [];
  if (!links) {
    return posts.map(post => ({ type: 'post', data: post, date: readPostDate(post.data.date) }));
  }

  const isPage1 = pageNumber !== undefined && pageNumber === 0;
  const items = [];

  // Sort posts by date (newest first)
  const sortedPosts = [...posts].map(post => ({
    type: 'post',
    data: post,
    date: readPostDate(post.data.date)
  })).sort((a, b) => b.date - a.date);

  const newestPostDate = sortedPosts[0].date;

  // On page 1 only: Add links newer than the newest post first
  if (isPage1) {
    for (const [date, linkList] of Object.entries(links)) {
      const when = linkDate(date);
      if (when > newestPostDate) {
        for (let i = 0; i < linkList.length; i++) {
          const link = linkList[i];
          const isLastInGroup = i === linkList.length - 1;
          items.push({
            type: 'link',
            data: { ...link, isLastInGroup },
            date: when
          });
        }
      }
    }
  }

  // For each post, add it and then add links between this post and the next post
  for (let i = 0; i < sortedPosts.length; i++) {
    const post = sortedPosts[i];
    const postDate = post.date;

    items.push(post);

    let nextPostDate = null;
    if (i < sortedPosts.length - 1) {
      nextPostDate = sortedPosts[i + 1].date;
    } else if (boundaryDate !== null && boundaryDate !== undefined) {
      nextPostDate = readPostDate(boundaryDate);
    }

    for (const [date, linkList] of Object.entries(links)) {
      const when = linkDate(date);
      const isInRange = when <= postDate && (nextPostDate === null || when > nextPostDate);

      if (isInRange) {
        for (let j = 0; j < linkList.length; j++) {
          const link = linkList[j];
          const isLastInGroup = j === linkList.length - 1;
          items.push({
            type: 'link',
            data: { ...link, isLastInGroup },
            date: when
          });
        }
      }
    }
  }

  return items.sort((a, b) => b.date - a.date);
}

/**
 * The newest links for links-feed.xml: newest date first, links that share a
 * date in file order, cut off at `limit`. Same item shape as
 * mergePostsAndLinks. The limit is required, because a missing one would
 * quietly mean every link.
 *
 * @param {Object} links - Object with date keys and link arrays as values
 * @param {number} limit - How many links the feed carries (src/_data/feedLimits.js)
 * @returns {Array} Items of { type: 'link', data, date }
 */
function newestLinks(links, limit) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(`newestLinks needs a whole-number limit of 1 or more, got ${limit}`);
  }
  if (!links) return [];

  return Object.entries(links)
    .map(([date, linkList]) => ({ date: linkDate(date), linkList }))
    .sort((a, b) => b.date - a.date)
    .flatMap(({ date, linkList }) => linkList.map((link) => ({ type: 'link', data: link, date })))
    .slice(0, limit);
}

module.exports = { mergePostsAndLinks, newestLinks, linkDate };
