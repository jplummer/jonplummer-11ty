/**
 * Eleventy configuration: Preprocessors
 *
 * Called from `.eleventy.js` during Eleventy initialization (typically called last).
 * Configures preprocessors (drafts and held posts left out of production
 * builds), and prints a line for each one left out when the build ends.
 * Ignores live in `.eleventyignore` and, for demo HTML, in `passthrough.js`.
 */

const path = require('path');
const { publishState } = require('../utils/publish-state');
const { listWisdomDrafts, formatUnpublished } = require('../../scripts/utils/unpublished');

/**
 * Configures Eleventy preprocessors.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 */
function configurePreprocessors(eleventyConfig) {
  // Drafts (any page) and posts dated after today are left out of production
  // builds and shown on the dev server. See eleventy/utils/publish-state.js.
  // Each template left out is noted here, keyed by its file, so the build can
  // name it. Eleventy hands every template to the preprocessor, whatever its
  // format, so nothing left out can go unnamed.
  const leftOut = new Map();
  eleventyConfig.on("eleventy.before", () => leftOut.clear());

  eleventyConfig.addPreprocessor("drafts", "*", (data, content) => {
    if (process.env.ELEVENTY_RUN_MODE !== "build") return;
    const result = publishState(data);
    if (result.state === "live") return;
    const file = path.normalize(data.page.inputPath);
    leftOut.set(file, { ...result, title: String(data.title || path.basename(file)), file });
    return false;
  });

  // Name every draft and held post the build left out, so none is forgotten.
  // Wisdom entries aren't templates; their drafts are read from the data file.
  eleventyConfig.on("eleventy.after", ({ directories, runMode }) => {
    if (runMode !== "build") return;
    const pages = [...leftOut.values()].sort((a, b) => a.file.localeCompare(b.file));
    const wisdom = listWisdomDrafts(path.join(directories.input, "_data", "wisdom-entries.yaml"));
    for (const line of formatUnpublished([...pages, ...wisdom])) {
      console.log(line);
    }
  });

  // Note: ogimages.njk is excluded from collections via front matter
  // but should still be built for local preview during development
}

module.exports = configurePreprocessors;

