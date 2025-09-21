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
      return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED);
    });

    // Add custom Nunjucks shortcode: year
    eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);
    
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