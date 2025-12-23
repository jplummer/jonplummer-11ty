/**
 * Eleventy configuration: Preprocessors and ignores
 * 
 * Called from `.eleventy.js` during Eleventy initialization (typically called last).
 * Configures preprocessors (e.g., draft post exclusion) and files/directories to ignore.
 */

const processMarkdownInHtmlBlocks = require("../preprocessors/process-markdown-in-html-blocks");

/**
 * Configures Eleventy preprocessors and ignores.
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

  // Process markdown inside HTML blocks (like div.portrait-grid)
  eleventyConfig.addPreprocessor("markdown-in-html", "*.md", (data, content) => {
    return processMarkdownInHtmlBlocks(content);
  });

  // Ignore the 'docs' folder
  eleventyConfig.ignores.add("docs/");
  
  // Ignore backup files created by migration scripts
  eleventyConfig.ignores.add("**/*.backup");
  eleventyConfig.ignores.add("**/*.backup.md");
  
  // Note: og-image-preview.njk is excluded from collections via front matter
  // but should still be built for local preview during development
}

module.exports = configurePreprocessors;

