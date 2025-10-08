#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Find all HTML files in a directory recursively
 * @param {string} dir - Directory to search
 * @returns {string[]} Array of HTML file paths
 */
function findHtmlFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findHtmlFiles(fullPath));
    } else if (item.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Find all markdown files in a directory recursively
 * @param {string} dir - Directory to search
 * @returns {string[]} Array of markdown file paths
 */
function findMarkdownFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath));
    } else if (item.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Find all files with specific extensions in a directory recursively
 * @param {string} dir - Directory to search
 * @param {string[]} extensions - Array of file extensions (e.g., ['.html', '.htm'])
 * @returns {string[]} Array of matching file paths
 */
function findFilesByExtension(dir, extensions) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findFilesByExtension(fullPath, extensions));
    } else {
      const ext = path.extname(item).toLowerCase();
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

module.exports = {
  findHtmlFiles,
  findMarkdownFiles,
  findFilesByExtension
};
