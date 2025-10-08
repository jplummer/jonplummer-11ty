#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Get all .md files in the _posts directory
 */
function getChangedMarkdownFiles() {
  return getAllMarkdownFiles();
}

/**
 * Get all .md files in the _posts directory
 */
function getAllMarkdownFiles() {
  const postsDir = './_posts';
  const files = [];
  
  if (!fs.existsSync(postsDir)) {
    return files;
  }
  
  function findMarkdownFiles(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        findMarkdownFiles(fullPath);
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  findMarkdownFiles(postsDir);
  return files;
}

/**
 * Get the corresponding HTML file for a markdown file
 */
function getHtmlFileForMarkdown(mdFile) {
  // Convert _posts/2020/11/26/reviews/index.md to _site/2020/11/26/reviews/index.html
  const relativePath = path.relative('./_posts', mdFile);
  const htmlPath = relativePath.replace(/\.md$/, '.html');
  return path.join('./_site', htmlPath);
}

/**
 * Get HTML files that correspond to changed markdown files
 */
function getChangedHtmlFiles() {
  const changedMdFiles = getChangedMarkdownFiles();
  const htmlFiles = [];
  
  for (const mdFile of changedMdFiles) {
    const htmlFile = getHtmlFileForMarkdown(mdFile);
    if (fs.existsSync(htmlFile)) {
      htmlFiles.push(htmlFile);
    }
  }
  
  return htmlFiles;
}

/**
 * Check if we should run full scan (always true now)
 */
function shouldRunFullScan() {
  return true;
}

module.exports = {
  getChangedMarkdownFiles,
  getChangedHtmlFiles,
  getAllMarkdownFiles,
  getHtmlFileForMarkdown,
  shouldRunFullScan
};
