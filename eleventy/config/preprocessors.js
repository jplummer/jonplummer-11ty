/**
 * Eleventy configuration: Preprocessors
 *
 * Called from `.eleventy.js` during Eleventy initialization (typically called last).
 * Configures preprocessors (drafts and held posts left out of production
 * builds). Ignores live in `.eleventyignore` and, for demo HTML, in `passthrough.js`.
 */

const { publishState } = require('../utils/publish-state');

/**
 * Configures Eleventy preprocessors.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 */
function configurePreprocessors(eleventyConfig) {
  // Drafts (any page) and posts dated after today are left out of production
  // builds and shown on the dev server. See eleventy/utils/publish-state.js.
  eleventyConfig.addPreprocessor("drafts", "*", (data, content) => {
    if (process.env.ELEVENTY_RUN_MODE === "build" && publishState(data).state !== "live") {
      return false;
    }
  });

  // Note: ogimages.njk is excluded from collections via front matter
  // but should still be built for local preview during development
}

module.exports = configurePreprocessors;

