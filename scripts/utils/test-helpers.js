#!/usr/bin/env node

/**
 * Test Helpers
 * 
 * Common file operations and test infrastructure utilities.
 * 
 * This file consolidates functionality from:
 * - test-base.js: File operations for tests
 */

const fs = require('fs');
const path = require('path');
const { findHtmlFiles, findMarkdownFiles } = require('./file-utils');

/**
 * Check if _site directory exists
 * @param {string} siteDir - Site directory path (default: './_site')
 * @returns {boolean} True if directory exists
 */
function checkSiteDirectory(siteDir = './_site') {
  if (!fs.existsSync(siteDir)) {
    console.log('❌ _site directory not found. Run "npm run build" first.');
    process.exit(1);
  }
  return true;
}

/**
 * Get all HTML files from site directory
 * @param {string} siteDir - Site directory path (default: './_site')
 * @returns {Array} Array of HTML file paths
 */
function getHtmlFiles(siteDir = './_site') {
  checkSiteDirectory(siteDir);
  return findHtmlFiles(siteDir);
}

/**
 * Get all markdown files from directory
 * @param {string} dir - Directory path
 * @returns {Array} Array of markdown file paths
 */
function getMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return findMarkdownFiles(dir);
}

/**
 * Get relative path from site root
 * @param {string} filePath - Full file path
 * @param {string} siteRoot - Site root directory (default: './_site')
 * @returns {string} Relative path
 */
function getRelativePath(filePath, siteRoot = './_site') {
  return path.relative(siteRoot, filePath);
}

/**
 * Read file content
 * @param {string} filePath - File path
 * @returns {string} File content
 */
function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

module.exports = {
  checkSiteDirectory,
  getHtmlFiles,
  getMarkdownFiles,
  getRelativePath,
  readFile
};

