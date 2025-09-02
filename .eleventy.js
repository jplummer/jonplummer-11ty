module.exports = function(eleventyConfig) {
    // Copy static assets
    eleventyConfig.addPassthroughCopy("assets");
    
    // Watch for changes in assets
    eleventyConfig.addWatchTarget("assets");
    
    // RSS plugin
    eleventyConfig.addPlugin(require("@11ty/eleventy-plugin-rss"));
    
    // Syntax highlighting
    eleventyConfig.addPlugin(require("@11ty/eleventy-plugin-syntaxhighlight"));
    
    // Add custom Nunjucks filter: limit
    eleventyConfig.addFilter("limit", function(array, limit) {
        if (!Array.isArray(array)) return array;
        return array.slice(0, limit);
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