/**
 * Eleventy configuration: Preprocessors
 *
 * Called from `.eleventy.js` during Eleventy initialization (typically called last).
 * Configures preprocessors (draft post exclusion). Ignores live in `.eleventyignore`
 * and, for demo HTML, in `passthrough.js`.
 */

/**
 * Configures Eleventy preprocessors.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 */
function configurePreprocessors(eleventyConfig) {
  // Draft posts: exclude from production builds, allow in dev mode
  eleventyConfig.addPreprocessor("drafts", "*", (data, content) => {
    if(data.draft && process.env.ELEVENTY_RUN_MODE === "build") {
      return false;
    }
  });

  // Note: ogimages.njk is excluded from collections via front matter
  // but should still be built for local preview during development
}

module.exports = configurePreprocessors;

