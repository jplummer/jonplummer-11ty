/**
 * Eleventy configuration: Plugin registration
 * 
 * Called from `.eleventy.js` during Eleventy initialization.
 * Registers all Eleventy plugins used by the site (RSS, syntax highlighting, date formatting, etc.).
 */

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

  // Image optimization plugin
  const { eleventyImageTransformPlugin } = require("@11ty/eleventy-img");
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["webp", "jpeg"],
    widths: [400, 800, 1200, 1600, "auto"],
    urlPath: "/img/",
    outputDir: "./_site/img/",
    htmlOptions: {
      imgAttributes: {
        loading: "lazy",
        decoding: "async"
      }
    }
  });
}

module.exports = configurePlugins;

