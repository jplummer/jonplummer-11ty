/**
 * Eleventy configuration: Data file extensions
 * 
 * Called from `.eleventy.js` during Eleventy initialization (must be called first,
 * before other configs that use data files).
 * Adds support for YAML data files (.yaml and .yml extensions).
 */

const yaml = require("js-yaml");

/**
 * Reads a YAML data file with js-yaml's JSON schema, so a value is only ever
 * text, a number, true/false, null, a list, or a map. The default schema also
 * makes Dates: an unquoted `2026-03-10:` key in links.yaml became a Date and
 * then a long string printed in the build machine's time zone. With this
 * schema the key stays "2026-03-10" on every machine.
 *
 * @param {string} contents - The file's text
 * @returns {*}
 */
function readYamlData(contents) {
  return yaml.load(contents, { schema: yaml.JSON_SCHEMA });
}

/**
 * Configures data file extensions.
 * Adds support for YAML data files.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 */
function configureDataExtensions(eleventyConfig) {
  // Add YAML data extension support
  eleventyConfig.addDataExtension("yaml", readYamlData);
  eleventyConfig.addDataExtension("yml", readYamlData);
}

module.exports = configureDataExtensions;
module.exports.readYamlData = readYamlData;

