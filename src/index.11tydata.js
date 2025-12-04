const mergePostsAndLinks = require("../eleventy/filters/merge-posts-and-links");
const { formatDateRange } = require("../eleventy/utils/date-utils");

module.exports = {
  eleventyComputed: {
    computedTitle: function(data) {
      // Only compute for paginated pages (not homepage)
      if (!data.pagination || data.pagination.pageNumber === 0) {
        return null;
      }

      // Get pagination items (posts on this page)
      const paginationItems = data.pagination.items || [];
      if (paginationItems.length === 0) {
        return null;
      }

      // Calculate next page's oldest post date if there's a next page
      let nextPageOldestDate = null;
      if (data.pagination.href && data.pagination.href.next) {
        const nextPageLastPostIndex = (data.pagination.pageNumber + 1) * 5 - 1;
        const allPostsSorted = [...data.collections.post].reverse();
        if (nextPageLastPostIndex < allPostsSorted.length) {
          const nextPageLastPost = allPostsSorted[nextPageLastPostIndex];
          nextPageOldestDate = nextPageLastPost.data.date;
        }
      }

      // Get merged items (posts + links)
      const mergedItems = mergePostsAndLinks(
        paginationItems,
        data.links,
        data.pagination.pageNumber,
        nextPageOldestDate
      );

      if (mergedItems.length === 0) {
        return null;
      }

      // Get newest and oldest dates (merged items are sorted newest first)
      const newestDate = mergedItems[0].date;
      const oldestDate = mergedItems[mergedItems.length - 1].date;

      // Format date range
      const dateRange = formatDateRange(oldestDate, newestDate);
      
      return `${dateRange} – Jon Plummer – Today I Learned`;
    }
  }
};

