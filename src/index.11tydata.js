const { mergePostsAndLinks } = require("../eleventy/utils/merge-posts-links");
const { formatDateRange } = require("../eleventy/utils/date-utils");

module.exports = {
  eleventyComputed: {
    // This page's posts with the links that fall among them, merged once for
    // both the list (index.njk) and the paginated <title>.
    pageItems: function(data) {
      const pagination = data.pagination;
      if (!pagination) return [];

      // Links older than this page's last post belong here down to the next
      // page's first post. On the last page there's no boundary, so every
      // older link follows its last post.
      const nextPage = pagination.pages && pagination.pages[pagination.pageNumber + 1];
      const boundaryDate = nextPage && nextPage[0] ? nextPage[0].data.date : null;

      return mergePostsAndLinks(pagination.items, data.links, pagination.pageNumber, boundaryDate);
    },

    // "Oldest – newest – Site" for /page/N/; the homepage keeps its own title
    computedTitle: function(data) {
      if (!data.pagination || data.pagination.pageNumber === 0) {
        return null;
      }

      const items = data.pageItems || [];
      if (items.length === 0) {
        return null;
      }

      // Merged items are sorted newest first
      const newestDate = items[0].date;
      const oldestDate = items[items.length - 1].date;

      return `${formatDateRange(oldestDate, newestDate)} – ${data.site.title}`;
    }
  }
};
