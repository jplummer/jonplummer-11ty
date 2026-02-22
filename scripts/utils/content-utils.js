#!/usr/bin/env node

/**
 * Content Script Utilities
 * 
 * Shared utilities for content manipulation scripts
 */

/**
 * Check if front matter indicates a post
 * @param {Object} frontMatter - Front matter object
 * @returns {boolean} True if file is a post
 */
function isPost(frontMatter) {
  return frontMatter && frontMatter.tags && frontMatter.tags.includes('post');
}

module.exports = {
  isPost
};
