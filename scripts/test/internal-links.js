#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { extractLinks, checkAnchorLink, classifyLink } = require('../utils/html-utils');
const { checkSiteDirectory, getHtmlFiles, getRelativePath, readFile } = require('../utils/test-base');
const { createTestResult, addFile, addIssue, outputResult } = require('../utils/test-result-builder');

// Check if internal file exists
function checkInternalLink(href, basePath, siteRoot) {
  let targetPath;
  
  if (href.startsWith('/')) {
    // Absolute path from site root
    targetPath = path.join(siteRoot, href);
  } else {
    // Relative path from current file
    targetPath = path.resolve(basePath, href);
  }
  
  // Normalize path and check if file exists
  targetPath = path.normalize(targetPath);
  
  // Check for common file extensions
  const extensions = ['', '.html', '.htm', '/index.html', '/index.htm'];
  
  for (const ext of extensions) {
    const testPath = targetPath + ext;
    if (fs.existsSync(testPath)) {
      return { exists: true, actualPath: testPath };
    }
  }
  
  return { exists: false, checkedPath: targetPath };
}

// Check anchor links within the same page (using html-utils)
function checkAnchor(href, htmlContent) {
  const anchorId = href.substring(1);
  return checkAnchorLink(htmlContent, anchorId);
}

// Main validation function
async function validateInternalLinks() {
  checkSiteDirectory();
  const siteRoot = './_site';
  
  const htmlFiles = getHtmlFiles();
  
  if (htmlFiles.length === 0) {
    // Create empty result
    const result = createTestResult('internal-links', 'Internal Link Validation');
    outputResult(result);
    process.exit(0);
    return;
  }
  
  // Create test result using result builder
  const result = createTestResult('internal-links', 'Internal Link Validation');
  
  // Track files that have issues (we'll add them as we find broken links)
  const fileMap = new Map();
  
  // Initialize all files in result (so we can track which files were checked)
  for (const file of htmlFiles) {
    const relativePath = getRelativePath(file);
    const fileObj = addFile(result, file, relativePath);
    fileMap.set(relativePath, fileObj);
  }
  
  const allLinks = [];
  
  // Collect all internal links
  for (const file of htmlFiles) {
    const content = readFile(file);
    const relativePath = getRelativePath(file);
    const links = extractLinks(content, path.dirname(file));
    
    for (const link of links) {
      // Only process internal links (filter out external, email, phone)
      const linkType = classifyLink(link.href);
      if (linkType === 'internal-absolute' || linkType === 'internal-relative' || linkType === 'anchor') {
        allLinks.push({
          href: link.href,
          type: linkType,
          file: relativePath,
          basePath: path.dirname(file),
          line: link.line
        });
      }
    }
  }
  
  // Process links by type
  for (const link of allLinks) {
    const { href, type, file, line } = link;
    const fileObj = fileMap.get(file);
    
    switch (type) {
      case 'internal-absolute':
      case 'internal-relative':
        const internalCheck = checkInternalLink(href, link.basePath, siteRoot);
        if (!internalCheck.exists) {
          addIssue(fileObj, {
            type: 'internal-link-broken',
            message: `Internal link not found: ${href}`,
            line: line
          });
        }
        break;
        
      case 'anchor':
        const fileContent = readFile(path.join(siteRoot, file));
        if (!checkAnchor(href, fileContent)) {
          addIssue(fileObj, {
            type: 'anchor-link-broken',
            message: `Anchor link not found: ${href}`,
            line: line
          });
        }
        break;
    }
  }
  
  // Output JSON result (formatter will handle display)
  outputResult(result);
  
  // Exit with appropriate code
  process.exit(result.summary.issues > 0 ? 1 : 0);
}

// Run validation
validateInternalLinks().catch(error => {
  console.error('Error during internal link validation:', error);
  process.exit(1);
});
