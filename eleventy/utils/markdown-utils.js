/**
 * Utility: Markdown renderer initialization
 * 
 * Utility module used by `.eleventy.js` to create the markdown renderer instance.
 * Configures markdown-it with site-specific settings (HTML support, line breaks, linkify, typographer).
 */

const markdownIt = require("markdown-it");

/**
 * Initializes and configures markdown-it instance.
 * Used for markdown processing throughout the site.
 * 
 * @returns {markdownIt} Configured markdown-it instance
 */
function createMarkdownRenderer() {
  const md = markdownIt({
    html: true, // Allow HTML in markdown
    breaks: true, // Convert line breaks to <br>
    linkify: true, // Auto-convert URLs to links
    typographer: true // Convert straight quotes to smart quotes
  });
  
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
  
  return md;
}

module.exports = {
  createMarkdownRenderer
};

