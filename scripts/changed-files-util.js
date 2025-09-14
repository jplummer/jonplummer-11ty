#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// File to track the last build timestamp
const LAST_BUILD_FILE = './.last-build-timestamp';

/**
 * Get the timestamp of the last build
 */
function getLastBuildTimestamp() {
  try {
    if (fs.existsSync(LAST_BUILD_FILE)) {
      const timestamp = fs.readFileSync(LAST_BUILD_FILE, 'utf8').trim();
      return new Date(timestamp);
    }
  } catch (error) {
    console.log('Could not read last build timestamp, checking all files');
  }
  return null;
}

/**
 * Set the current build timestamp
 */
function setCurrentBuildTimestamp() {
  const timestamp = new Date().toISOString();
  fs.writeFileSync(LAST_BUILD_FILE, timestamp);
}

/**
 * Get all .md files in the _posts directory that have been modified since last build
 */
function getChangedMarkdownFiles() {
  const lastBuild = getLastBuildTimestamp();
  const changedFiles = [];
  
  if (!lastBuild) {
    console.log('No previous build found, checking all markdown files');
    return getAllMarkdownFiles();
  }
  
  try {
    // Use git to find changed files since last build
    const gitCommand = `git log --since="${lastBuild.toISOString()}" --name-only --pretty=format: | grep '\\.md$' | sort | uniq`;
    const gitOutput = execSync(gitCommand, { encoding: 'utf8', stdio: 'pipe' });
    const gitFiles = gitOutput.split('\n').filter(file => file.trim() && file.endsWith('.md'));
    
    // Also check for files modified in the filesystem since last build
    const allMdFiles = getAllMarkdownFiles();
    const fsChangedFiles = allMdFiles.filter(file => {
      try {
        const stats = fs.statSync(file);
        return stats.mtime > lastBuild;
      } catch (error) {
        return false;
      }
    });
    
    // Combine and deduplicate
    const allChangedFiles = [...new Set([...gitFiles, ...fsChangedFiles])];
    
    // Filter to only include files in _posts directory
    const postsChangedFiles = allChangedFiles.filter(file => 
      file.includes('_posts/') || file.startsWith('_posts/')
    );
    
    return postsChangedFiles;
  } catch (error) {
    console.log('Git command failed, falling back to filesystem check');
    return getAllMarkdownFiles();
  }
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
 * Check if we should run full scan (no previous build or --full flag)
 */
function shouldRunFullScan() {
  const args = process.argv.slice(2);
  return args.includes('--full') || !fs.existsSync(LAST_BUILD_FILE);
}

module.exports = {
  getChangedMarkdownFiles,
  getChangedHtmlFiles,
  getAllMarkdownFiles,
  getHtmlFileForMarkdown,
  setCurrentBuildTimestamp,
  shouldRunFullScan
};
