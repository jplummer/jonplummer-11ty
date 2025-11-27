#!/usr/bin/env node

/**
 * Front Matter Utilities
 * 
 * Shared functions for parsing and reconstructing front matter in markdown files
 */

const yaml = require('js-yaml');

/**
 * Parse front matter from markdown file content
 * @param {string} content - Full markdown file content
 * @returns {Object} { frontMatter: object|null, content: string, error?: string }
 */
function parseFrontMatter(content) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    return { frontMatter: null, content: content };
  }
  
  try {
    const frontMatter = yaml.load(match[1]);
    return { frontMatter, content: match[2] };
  } catch (error) {
    return { frontMatter: null, content: content, error: error.message };
  }
}

/**
 * Reconstruct file with updated front matter
 * @param {string} originalContent - Original file content
 * @param {Object} frontMatter - Updated front matter object
 * @param {string} body - Body content (markdown after front matter)
 * @param {Object} options - Options for reconstruction
 * @param {boolean} options.quoteDescription - Force quote description field (default: false)
 * @returns {string} Reconstructed file content
 */
function reconstructFile(originalContent, frontMatter, body, options = {}) {
  const { quoteDescription = false } = options;
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = originalContent.match(frontMatterRegex);
  
  // Dump YAML
  let yamlContent = yaml.dump(frontMatter, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"'
  });
  
  // Post-process to ensure description is always quoted if requested
  if (quoteDescription) {
    const lines = yamlContent.split('\n');
    const fixedLines = lines.map(line => {
      if (line.startsWith('description:')) {
        const match = line.match(/^description:\s*(.+)$/);
        if (match) {
          let value = match[1];
          // If not already quoted, quote it and escape internal quotes
          if (!value.startsWith('"') && !value.startsWith("'")) {
            // Escape any double quotes and backslashes in the value
            const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            return `description: "${escaped}"`;
          }
        }
      }
      return line;
    });
    yamlContent = fixedLines.join('\n');
  }
  
  if (!match) {
    return `---\n${yamlContent}---\n${body}`;
  }
  
  return `---\n${yamlContent}---\n${body}`;
}

module.exports = {
  parseFrontMatter,
  reconstructFile
};

