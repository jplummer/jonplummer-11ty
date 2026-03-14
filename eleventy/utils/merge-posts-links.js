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

  // On page 1 only: Add links newer than the newest post first
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

    items.push(post);

    let nextPostDate = null;
    if (i < sortedPosts.length - 1) {
      nextPostDate = sortedPosts[i + 1].date;
    } else if (nextPageOldestDate !== null && nextPageOldestDate !== undefined) {
      nextPostDate = new Date(nextPageOldestDate);
    }

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

  return items.sort((a, b) => b.date - a.date);
}

module.exports = { mergePostsAndLinks };
