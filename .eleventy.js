const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
    // Copy static assets
    eleventyConfig.addPassthroughCopy("assets");
    
    // Copy .htaccess file for security
    eleventyConfig.addPassthroughCopy(".htaccess");
    
    // Watch for changes in assets
    eleventyConfig.addWatchTarget("assets");
    
    // RSS plugin
    eleventyConfig.addPlugin(require("@11ty/eleventy-plugin-rss"));
    
    // Syntax highlighting
    eleventyConfig.addPlugin(require("@11ty/eleventy-plugin-syntaxhighlight"));

    // Date formatting via Luxon
    eleventyConfig.addPlugin(require("eleventy-plugin-date"));

    // Add custom Nunjucks filter: limit
    eleventyConfig.addFilter("limit", function(array, limit) {
      if (!Array.isArray(array)) return array;
      return array.slice(0, limit);
    });

    // add postDate filter
    eleventyConfig.addFilter("postDate", (dateObj) => {
      // Handle both Date objects and date strings
      const date = dateObj instanceof Date ? dateObj : new Date(dateObj);
      return DateTime.fromJSDate(date).toLocaleString(DateTime.DATE_MED);
    });

    // Add custom Nunjucks shortcode: year
    eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);
    
    // Add custom filter to merge posts and links chronologically
    eleventyConfig.addFilter("mergePostsAndLinks", function(posts, links) {
      if (!posts) return [];
      if (!links) return posts;
      
      // Get the date range for the current page
      const pageDates = posts.map(post => new Date(post.data.date)).sort((a, b) => b - a);
      const newestDate = pageDates[0];
      const oldestDate = pageDates[pageDates.length - 1];
      
      // Start with posts
      const items = [...posts.map(post => ({ type: 'post', data: post, date: new Date(post.data.date) }))];
      
      // Add links that fall within the page's date range
      for (const [date, linkList] of Object.entries(links)) {
        const linkDate = new Date(date);
        if (linkDate <= newestDate && linkDate > oldestDate) {
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
      
      // Sort chronologically (newest first)
      return items.sort((a, b) => b.date - a.date);
    });

    
    // Ignore the '_notes' and "_posts/_drafts" folders
    eleventyConfig.ignores.add("_misc/");
    eleventyConfig.ignores.add("_posts/_drafts/");

    return {
      dir: {
        input: ".",
        output: "_site",
        includes: "_includes",
        data: "_data"
      },
      templateFormats: ["njk", "md", "html"],
      markdownTemplateEngine: "njk",
      htmlTemplateEngine: "njk"
    };
  };