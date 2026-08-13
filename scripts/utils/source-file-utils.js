#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseHtml } = require('./html-utils');

// Try to find source file for a generated HTML path
function findSourceFile(relativePath) {
  const srcDir = path.join(process.cwd(), 'src');
  const normalizedPath = relativePath.replace(/\\/g, '/');

  // Try common patterns:
  // 1. Direct match: about.html -> src/about.md or src/about.njk
  // 2. Index files: page/1/index.html -> src/index.njk (paginated)
  // 3. Post files: 2025/01/15/post-slug/index.html -> src/_posts/2025/01/15/post-slug.md
  // 4. Permalink files: ogimages/index.html -> src/ogimages.njk

  // Remove index.html and trailing slash
  let searchPath = normalizedPath.replace(/\/index\.html$/, '').replace(/^\/+/, '');

  // Post permalinks: 2026/05/24/slug/index.html -> src/_posts/2026/2026-05-24-slug.md
  const postMatch = searchPath.match(/^(\d{4})\/(\d{2})\/(\d{2})\/([^/]+)$/);
  if (postMatch) {
    const [, year, month, day, slug] = postMatch;
    const postPath = path.join(srcDir, '_posts', year, `${year}-${month}-${day}-${slug}.md`);
    if (fs.existsSync(postPath)) {
      return postPath;
    }
  }

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

  // For permalink files that create subdirectories (e.g., ogimages/index.html -> ogimages.njk)
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

module.exports = { findSourceFile, isRedirectPage };
