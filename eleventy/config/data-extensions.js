const yaml = require("js-yaml");

/**
 * Configures data file extensions.
 * Adds support for YAML data files.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 */
function configureDataExtensions(eleventyConfig) {
  // Add YAML data extension support
  eleventyConfig.addDataExtension("yaml", (contents) => yaml.load(contents));
  eleventyConfig.addDataExtension("yml", (contents) => yaml.load(contents));
}

module.exports = configureDataExtensions;

