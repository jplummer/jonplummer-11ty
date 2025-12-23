/**
 * Eleventy configuration: Transform registration
 * 
 * Called from `.eleventy.js` during Eleventy initialization.
 * Registers all HTML transforms that post-process template output.
 */

const figureTransform = require("../transforms/figure-transform");

/**
 * Registers Eleventy transforms.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 */
function configureTransforms(eleventyConfig) {
  // Transform to convert image + italic caption to figure elements
  // This runs before the image optimization transform
  eleventyConfig.addTransform("figure-transform", figureTransform);
}

module.exports = configureTransforms;

