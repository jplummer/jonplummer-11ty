/**
 * Utility: Markdown renderer configuration
 * 
 * Configures markdown-it with site-specific settings using Eleventy's native setLibrary API.
 * Also provides the configured instance for use in filters.
 */

const markdownIt = require("markdown-it");
const figurePlugin = require("./markdown-it-figure");

/**
 * Creates and configures a markdown-it instance.
 * Uses Eleventy's native setLibrary API to register the configured instance.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 * @returns {markdownIt} Configured markdown-it instance for use in filters
 */
function configureMarkdown(eleventyConfig) {
  // Create markdown-it instance with site-specific options
  // Options must be set at construction time
  const md = markdownIt({
    html: true, // Allow HTML in markdown
    breaks: true, // Convert line breaks to <br>
    linkify: true, // Auto-convert URLs to links
    typographer: true // Convert straight quotes to smart quotes
  });
  
  // Convert image + italic caption to <figure>/<figcaption> at parse time
  md.use(figurePlugin);
  
  // Override link_open renderer to convert http:// to https:// for auto-linked URLs
  // This ensures URLs without a protocol (like "misc.jonplummer.com") default to https://
  const defaultLinkOpen = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };
  
  md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const href = token.attrGet('href');
    // Only modify auto-linked URLs (those that start with http://, not manually written links)
    if (href && href.startsWith('http://')) {
      token.attrSet('href', href.replace('http://', 'https://'));
    }
    return defaultLinkOpen(tokens, idx, options, env, self);
  };
  
  // Register the configured instance using Eleventy's native API
  eleventyConfig.setLibrary("md", md);
  
  return md;
}

module.exports = {
  configureMarkdown
};

