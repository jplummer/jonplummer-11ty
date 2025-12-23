/**
 * Eleventy Preprocessor: Process markdown inside HTML blocks
 * 
 * Processes markdown content before it's rendered to find HTML blocks
 * (like <div class="portrait-grid">) and processes any markdown syntax
 * inside them.
 * 
 * This is needed because markdown-it doesn't process markdown inside HTML blocks
 * by default (per CommonMark spec).
 */

const markdownIt = require("markdown-it");

// Create a markdown renderer for processing markdown inside HTML blocks
const md = markdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true
});

/**
 * Preprocesses markdown content to process markdown inside HTML blocks
 * 
 * @param {string} content - The markdown content
 * @param {string} inputPath - The input file path (optional, for logging)
 * @returns {string} Processed content
 */
function processMarkdownInHtmlBlocks(content, inputPath) {
  // Find HTML blocks with specific classes that need markdown processing
  // Pattern: <div class="portrait-grid">...markdown content...</div>
  // Match the opening tag, then capture everything until the closing tag
  const htmlBlockRegex = /<div\s+class="portrait-grid">([\s\S]*?)<\/div>/g;
  
  return content.replace(htmlBlockRegex, (match, innerContent) => {
    // Only process if there's actual content
    const trimmed = innerContent.trim();
    if (!trimmed) {
      return match;
    }
    
    // CRITICAL: Always prepend a newline to the content before processing
    // Markdown-it requires a newline to properly parse the first block-level element
    // This fixes the issue where the first image after the opening div isn't processed
    const toProcess = '\n' + trimmed;
    
    // Process the inner content as markdown
    // This converts ![alt](src) to <p><img src="..." alt="..."></p>
    // and *text* to <p><em>text</em></p>
    const processed = md.render(toProcess);
    
    // Return the div with processed HTML inside
    // The newline after the opening tag ensures markdown-it treats this as an HTML block
    return `<div class="portrait-grid">\n${processed}\n</div>`;
  });
}

module.exports = processMarkdownInHtmlBlocks;

