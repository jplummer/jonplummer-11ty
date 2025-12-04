const markdownIt = require("markdown-it");

/**
 * Initializes and configures markdown-it instance.
 * Used for markdown processing throughout the site.
 * 
 * @returns {markdownIt} Configured markdown-it instance
 */
function createMarkdownRenderer() {
  return markdownIt({
    html: true, // Allow HTML in markdown
    breaks: true, // Convert line breaks to <br>
    linkify: true, // Auto-convert URLs to links
    typographer: true // Convert straight quotes to smart quotes
  });
}

module.exports = {
  createMarkdownRenderer
};

