// Utilities
const { configureMarkdown } = require("./eleventy/utils/markdown-utils");

// Configuration modules
const configureDataExtensions = require("./eleventy/config/data-extensions");
const configureDateParsing = require("./eleventy/config/date-parsing");
const configurePlugins = require("./eleventy/config/plugins");
const configureFilters = require("./eleventy/config/filters");
const configureShortcodes = require("./eleventy/config/shortcodes");
const configureTransforms = require("./eleventy/config/transforms");
const configurePassthrough = require("./eleventy/config/passthrough");
const configureEvents = require("./eleventy/config/events");
const configurePreprocessors = require("./eleventy/config/preprocessors");

module.exports = function (eleventyConfig) {
  
  // Configure data extensions (must be before other configs that use data files)
  configureDataExtensions(eleventyConfig);
  
  // Configure date parsing (must be early, before other configs that use dates)
  configureDateParsing(eleventyConfig);
  
  // Configure markdown using native setLibrary API (returns instance for filters)
  const md = configureMarkdown(eleventyConfig);
  
  // Configure plugins
  configurePlugins(eleventyConfig);
  
  // Configure filters (needs markdown renderer)
  configureFilters(eleventyConfig, md);
  
  // Configure shortcodes
  configureShortcodes(eleventyConfig);
  
  // Configure transforms (must be before image optimization plugin)
  configureTransforms(eleventyConfig);
  
  // Configure passthrough copy and watch targets
  configurePassthrough(eleventyConfig);
  
  // Configure event handlers
  configureEvents(eleventyConfig);
  
  // Configure preprocessors and ignores
  configurePreprocessors(eleventyConfig);

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
