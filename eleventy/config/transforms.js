/**
 * Eleventy configuration: Transform registration
 *
 * Called from `.eleventy.js` during Eleventy initialization.
 * Registers HTML transforms that post-process template output.
 *
 * Figure → <figure> wrapping is handled by markdown-it-figure at parse time.
 * Lightbox progressive-enhancement links run here after image optimization
 * has produced <picture>/srcset (this module is registered after plugins).
 */

const { applyFigureLightboxLinks } = require('../utils/figure-lightbox-transform');

/**
 * Registers Eleventy transforms.
 *
 * @param {object} eleventyConfig - Eleventy configuration object
 */
function configureTransforms(eleventyConfig) {
  eleventyConfig.addTransform('figure-lightbox-links', function (content, outputPath) {
    if (!outputPath || !outputPath.endsWith('.html')) return content;
    return applyFigureLightboxLinks(content);
  });
}

module.exports = configureTransforms;
