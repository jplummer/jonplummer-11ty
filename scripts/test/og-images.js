#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { extractMetaTags, parseHtml } = require('../utils/html-utils');
const { checkSiteDirectory, getHtmlFiles, getRelativePath, readFile } = require('../utils/test-helpers');
const { createTestResult, addFile, addIssue, outputResult } = require('../utils/test-results');
const { parseFrontMatter } = require('../utils/frontmatter-utils');

// Check if HTML content is a redirect page
function isRedirectPage(htmlContent) {
  const $ = parseHtml(htmlContent);
  // Check for data-redirect-url attribute on body tag (primary indicator)
  const body = $('body');
  if (body.length > 0 && body.attr('data-redirect-url')) {
    return true;
  }
  // Fallback: check for meta refresh with redirect pattern
  const metaRefresh = $('meta[http-equiv="refresh"]');
  if (metaRefresh.length > 0) {
    const content = metaRefresh.attr('content');
    if (content && content.includes('url=')) {
      return true;
    }
  }
  return false;
}

// Default OG image path (allowed for paginated indexes and main index)
const DEFAULT_OG_IMAGE = '/assets/images/og/index.png';

// Check if a page is a paginated index or main index
function isAllowedDefaultImagePage(relativePath) {
  // Normalize path separators (handle both / and \)
  const normalizedPath = relativePath.replace(/\\/g, '/');
  
  // Main index: index.html (root)
  if (normalizedPath === 'index.html') {
    return true;
  }
  
  // Paginated indexes: /page/1/, /page/2/, etc.
  // Paths like: page/1/index.html, page/2/index.html
  const pageMatch = normalizedPath.match(/^page\/\d+\/index\.html$/);
  if (pageMatch) {
    return true;
  }
  
  return false;
}

// Try to find source file for a generated HTML path
function findSourceFile(relativePath) {
  const srcDir = path.join(process.cwd(), 'src');
  const normalizedPath = relativePath.replace(/\\/g, '/');
  
  // Try common patterns:
  // 1. Direct match: about.html -> src/about.md or src/about.njk
  // 2. Index files: page/1/index.html -> src/index.njk (paginated)
  // 3. Post files: 2025/01/15/post-slug/index.html -> src/_posts/2025/01/15/post-slug.md
  // 4. Permalink files: og-image-preview/index.html -> src/og-image-preview.njk
  
  // Remove index.html and trailing slash
  let searchPath = normalizedPath.replace(/\/index\.html$/, '').replace(/^\/+/, '');
  
  // Try .md first, then .njk
  const extensions = ['.md', '.njk'];
  for (const ext of extensions) {
    const filePath = path.join(srcDir, searchPath + ext);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  
  // Try with index.html removed but keep directory
  if (normalizedPath.endsWith('/index.html')) {
    const dirPath = normalizedPath.replace(/\/index\.html$/, '');
    for (const ext of extensions) {
      const filePath = path.join(srcDir, dirPath + ext);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
  }
  
  // For permalink files that create subdirectories (e.g., og-image-preview/index.html -> og-image-preview.njk)
  // Extract the directory name and try it as a filename
  if (normalizedPath.includes('/') && normalizedPath.endsWith('/index.html')) {
    const dirName = normalizedPath.split('/')[0];
    for (const ext of extensions) {
      const filePath = path.join(srcDir, dirName + ext);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
  }
  
  // For paginated pages, check if it's from index.njk
  if (normalizedPath.match(/^page\/\d+\/index\.html$/)) {
    const indexPath = path.join(srcDir, 'index.njk');
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }
  
  // Root index
  if (normalizedPath === 'index.html') {
    const indexPath = path.join(srcDir, 'index.njk');
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }
  
  return null;
}

// Validate OG image for a single page
function validateOgImage(content, relativePath, filePath) {
  const metaTags = extractMetaTags(content);
  const ogImage = metaTags.og?.image;
  
  const issues = [];
  
  // Check if OG image exists
  if (!ogImage) {
    issues.push('Missing OG image');
    return { issues, ogImage: null };
  }
  
  // Extract the path from the full URL (remove domain if present)
  let ogImagePath = ogImage;
  if (ogImage.startsWith('http://') || ogImage.startsWith('https://')) {
    try {
      const url = new URL(ogImage);
      ogImagePath = url.pathname;
    } catch (e) {
      // If URL parsing fails, use as-is
    }
  }
  
  const isAllowedDefault = isAllowedDefaultImagePage(relativePath);
  const isDefaultImage = ogImagePath === DEFAULT_OG_IMAGE;
  
  // If it's a paginated index or main index, default image is allowed
  if (isAllowedDefault && isDefaultImage) {
    return { issues: [], ogImage: ogImagePath };
  }
  
  // If it's not an allowed page and uses default image, check if it's explicitly set
  if (!isAllowedDefault && isDefaultImage) {
    // Try to find source file to check if ogImage is explicitly set
    const sourceFile = findSourceFile(relativePath);
    let isExplicitlySet = false;
    
    if (sourceFile && fs.existsSync(sourceFile)) {
      try {
        const sourceContent = fs.readFileSync(sourceFile, 'utf8');
        const { frontMatter } = parseFrontMatter(sourceContent);
        if (frontMatter && frontMatter.ogImage) {
          // Check if it's explicitly set to the default (even if it's the default value)
          const sourceOgImage = frontMatter.ogImage;
          if (sourceOgImage === DEFAULT_OG_IMAGE || sourceOgImage === 'auto') {
            // If it's 'auto', that means it wasn't explicitly set to default
            // If it's the default path, it was explicitly set
            isExplicitlySet = (sourceOgImage === DEFAULT_OG_IMAGE);
          } else {
            // It's set to something else, so it's explicitly set
            isExplicitlySet = true;
          }
        }
      } catch (e) {
        // If we can't parse the source file, assume it's not explicitly set
      }
    }
    
    // Only complain if default image is used and it's NOT explicitly set
    if (!isExplicitlySet) {
      issues.push(`Uses default OG image (${DEFAULT_OG_IMAGE}) but should have a specific image. Set ogImage in frontmatter to explicitly use the default if needed.`);
    }
  }
  
  return { issues, ogImage: ogImagePath };
}

// Main validation function
function validateOgImages() {
  checkSiteDirectory();
  const htmlFiles = getHtmlFiles();
  
  // Create test result using result builder
  const result = createTestResult('og-images', 'OG Image Validation');
  
  // Validate each file
  for (const file of htmlFiles) {
    const relativePath = getRelativePath(file);
    const content = readFile(file);
    
    // Skip redirect pages (they don't need OG images)
    if (isRedirectPage(content)) {
      continue; // Don't add to result at all
    }
    
    // Add file to result
    const fileObj = addFile(result, file, relativePath);
    
    const validation = validateOgImage(content, relativePath, file);
    
    // Add issues to file
    if (validation.issues.length > 0) {
      validation.issues.forEach(issue => {
        // Determine issue type from message
        let issueType = 'og-image-missing';
        if (issue.includes('default OG image')) {
          issueType = 'og-image-default';
        }
        
        addIssue(fileObj, {
          type: issueType,
          message: issue
        });
      });
    }
  }
  
  // Output JSON result (formatter will handle display)
  outputResult(result);
  
  // Exit with appropriate code
  process.exit(result.summary.issues > 0 ? 1 : 0);
}

// Run validation
validateOgImages();

