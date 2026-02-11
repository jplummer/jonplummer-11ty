/**
 * Eleventy configuration: Transform registration
 * 
 * Called from `.eleventy.js` during Eleventy initialization.
 * Registers all HTML transforms that post-process template output.
 *
 * Figure wrapping is now handled by the markdown-it-figure plugin
 * at the markdown parsing stage, so no HTML transforms are currently needed.
 */

/**
 * Registers Eleventy transforms.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 */
function configureTransforms(eleventyConfig) {
  // No transforms currently registered.
  // Figure wrapping moved to markdown-it-figure plugin (parse-time).
}

module.exports = configureTransforms;

