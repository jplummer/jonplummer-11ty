#!/usr/bin/env node

/**
 * Front Matter Utilities
 * 
 * Shared functions for parsing and reconstructing front matter in markdown files
 */

const yaml = require('js-yaml');
const matter = require('gray-matter');

/**
 * Parse front matter the same way Eleventy does (gray-matter), so scripts and
 * tests see what the build sees. Catches malformed YAML and mistakes like
 * `## title:` without a closing `---` delimiter. The body comes back exactly
 * as written, blank lines after the closing `---` included, so writing it
 * back through reconstructFile() changes only the front matter.
 *
 * The front matter is a copy: gray-matter caches results by input text and
 * returns the same object each time, so a caller that edits it (the OG
 * generator sets ogImage) would otherwise change what later parses return.
 *
 * @param {string} content - Full file content
 * @returns {Object} { frontMatter: object|null, content: string, error?: string }
 */
function parseFrontMatter(content) {
  try {
    const result = matter(content);
    const data = result.data;
    const hasKeys = data && typeof data === 'object' && Object.keys(data).length > 0;
    return {
      frontMatter: hasKeys ? structuredClone(data) : null,
      content: result.content,
    };
  } catch (error) {
    return {
      frontMatter: null,
      content,
      error: error.message,
    };
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
  
  // Reconstruct file with front matter and body
  return `---\n${yamlContent}---\n${body}`;
}

/**
 * Safely format a string value for YAML frontmatter
 * This ensures proper quoting and escaping to prevent parsing errors
 * @param {string} value - The string value to format
 * @returns {string} Properly formatted YAML string
 */
function formatYamlString(value) {
  if (!value || typeof value !== 'string') {
    return value;
  }
  
  // Check if the string needs quoting
  // Strings need quoting if they contain:
  // - Special YAML characters: :, #, |, >, &, *, !, %, @, `
  // - Quotes (single or double)
  // - Leading/trailing whitespace
  // - Start with special characters that might be interpreted as YAML syntax
  const needsQuoting = /[:#|>&*!%@`'"\n\r]/.test(value) || 
                       /^\s|\s$/.test(value) ||
                       /^[0-9-]/.test(value) ||
                       value.toLowerCase() === 'true' ||
                       value.toLowerCase() === 'false' ||
                       value.toLowerCase() === 'null' ||
                       value.toLowerCase() === 'yes' ||
                       value.toLowerCase() === 'no' ||
                       value.toLowerCase() === 'on' ||
                       value.toLowerCase() === 'off';
  
  if (!needsQuoting) {
    return value;
  }
  
  // If the string contains double quotes, use double quotes and escape them
  // If it contains single quotes but no double quotes, use single quotes
  // If it contains both, use double quotes and escape double quotes
  if (value.includes('"') && value.includes("'")) {
    // Contains both - use double quotes and escape double quotes
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  } else if (value.includes('"')) {
    // Contains double quotes - use double quotes and escape them
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  } else if (value.includes("'")) {
    // Contains single quotes - use double quotes (single quotes can't contain single quotes)
    return `"${value.replace(/\\/g, '\\\\')}"`;
  } else {
    // No quotes - use double quotes for safety
    return `"${value.replace(/\\/g, '\\\\')}"`;
  }
}

module.exports = {
  parseFrontMatter,
  reconstructFile,
  formatYamlString
};

