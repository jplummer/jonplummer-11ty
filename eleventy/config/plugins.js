/**
 * Registers Eleventy plugins.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 */
function configurePlugins(eleventyConfig) {
  // RSS plugin
  eleventyConfig.addPlugin(require("@11ty/eleventy-plugin-rss"));

  // Syntax highlighting
  eleventyConfig.addPlugin(require("@11ty/eleventy-plugin-syntaxhighlight"));

  // Date formatting via Luxon
  eleventyConfig.addPlugin(require("eleventy-plugin-date"));

  // Render plugin for rendering templates
  const { RenderPlugin } = require("@11ty/eleventy");
  eleventyConfig.addPlugin(RenderPlugin);
}

module.exports = configurePlugins;

