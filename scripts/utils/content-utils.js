#!/usr/bin/env node

/**
 * Content Script Utilities
 * 
 * Shared utilities for content manipulation scripts
 */

const fs = require('fs');
const path = require('path');
const { findMarkdownFiles } = require('./file-utils');
const { parseFrontMatter } = require('./frontmatter-utils');

/**
 * Get the posts directory path
 * @returns {string} Path to posts directory
 */
function getPostsDirectory() {
  // Check if src/_posts exists (preferred location)
  const srcPostsDir = path.join(process.cwd(), 'src', '_posts');
  if (fs.existsSync(srcPostsDir)) {
    return srcPostsDir;
  }
  
  // Fallback to _posts at root (legacy)
  const rootPostsDir = path.join(process.cwd(), '_posts');
  if (fs.existsSync(rootPostsDir)) {
    return rootPostsDir;
  }
  
  // Default to src/_posts
  return srcPostsDir;
}

/**
 * Check if front matter indicates a post
 * @param {Object} frontMatter - Front matter object
 * @returns {boolean} True if file is a post
 */
function isPost(frontMatter) {
  return frontMatter && frontMatter.tags && frontMatter.tags.includes('post');
}

/**
 * Check if front matter indicates a portfolio item
 * @param {Object} frontMatter - Front matter object
 * @returns {boolean} True if file is a portfolio item
 */
function isPortfolio(frontMatter) {
  return frontMatter && frontMatter.tags && frontMatter.tags.includes('portfolio');
}

/**
 * Filter out draft files
 * @param {Array<string>} files - Array of file paths
 * @returns {Array<string>} Filtered array without drafts
 */
function filterDrafts(files) {
  return files.filter(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const { frontMatter } = parseFrontMatter(content);
      return !(frontMatter && frontMatter.draft === true);
    } catch (error) {
      // If we can't read/parse, include it (let other scripts handle errors)
      return true;
    }
  });
}

/**
 * Get all post files, optionally filtering drafts
 * @param {Object} options - Options
 * @param {boolean} options.excludeDrafts - Exclude draft files (default: false)
 * @returns {Array<string>} Array of post file paths
 */
function getPostFiles(options = {}) {
  const { excludeDrafts = false } = options;
  const postsDir = getPostsDirectory();
  
  if (!fs.existsSync(postsDir)) {
    return [];
  }
  
  const files = findMarkdownFiles(postsDir);
  
  if (excludeDrafts) {
    return filterDrafts(files);
  }
  
  return files;
}

/**
 * Process files with a processor function and track results
 * @param {Array<string>} files - Array of file paths to process
 * @param {Function} processor - Function to process each file (filePath) => result
 * @param {Object} options - Options
 * @param {Function} options.onFileStart - Callback before processing each file (filePath) => void
 * @param {Function} options.onResult - Callback after processing each file (filePath, result) => void
 * @returns {Object} Results object { updated: number, skipped: number, errors: number }
 */
function processFiles(files, processor, options = {}) {
  const { onFileStart, onResult } = options;
  
  const results = {
    updated: 0,
    skipped: 0,
    errors: 0
  };
  
  for (const file of files) {
    if (onFileStart) {
      onFileStart(file);
    }
    
    const result = processor(file);
    
    if (result.updated) {
      results.updated++;
    } else if (result.skipped) {
      results.skipped++;
    } else if (result.error) {
      results.errors++;
    }
    
    if (onResult) {
      onResult(file, result);
    }
  }
  
  return results;
}

module.exports = {
  getPostsDirectory,
  isPost,
  isPortfolio,
  filterDrafts,
  getPostFiles,
  processFiles
};

