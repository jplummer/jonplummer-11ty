#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { getChangedHtmlFiles, shouldRunFullScan } = require('../utils/changed-files-util');

// Find all HTML files in _site (for full scan)
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

// Extract all internal links from HTML content
function extractInternalLinks(htmlContent, basePath) {
  const links = [];
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let match;
  
  while ((match = linkRegex.exec(htmlContent)) !== null) {
    const href = match[1];
    const link = {
      href: href,
      type: classifyInternalLink(href),
      line: htmlContent.substring(0, match.index).split('\n').length
    };
    links.push(link);
  }
  
  return links;
}

// Classify internal link type
function classifyInternalLink(href) {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return 'external'; // Skip external links
  } else if (href.startsWith('mailto:')) {
    return 'email';
  } else if (href.startsWith('tel:')) {
    return 'phone';
  } else if (href.startsWith('#')) {
    return 'anchor';
  } else if (href.startsWith('/')) {
    return 'internal-absolute';
  } else {
    return 'internal-relative';
  }
}

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

// Check anchor links within the same page
function checkAnchorLink(href, htmlContent) {
  const anchorId = href.substring(1);
  const idRegex = new RegExp(`id=["']${anchorId}["']`, 'i');
  const nameRegex = new RegExp(`name=["']${anchorId}["']`, 'i');
  
  return idRegex.test(htmlContent) || nameRegex.test(htmlContent);
}

// Main validation function
async function validateInternalLinks() {
  console.log('🔗 Starting internal link validation...\n');
  
  const siteRoot = './_site';
  let htmlFiles;
  let scanType;
  
  if (shouldRunFullScan()) {
    console.log('📋 Running full scan (no previous build or --full flag specified)');
    htmlFiles = findHtmlFiles(siteRoot);
    scanType = 'full';
  } else {
    console.log('📋 Running incremental scan (checking only changed files)');
    htmlFiles = getChangedHtmlFiles();
    scanType = 'incremental';
  }
  
  if (htmlFiles.length === 0) {
    console.log('✅ No files to check. All internal links are up to date!');
    return;
  }
  
  console.log(`Found ${htmlFiles.length} HTML files to check\n`);
  
  const allLinks = [];
  const results = {
    total: 0,
    internal: { total: 0, broken: 0, working: 0 },
    anchors: { total: 0, broken: 0, working: 0 },
    other: { total: 0 },
    scanType: scanType
  };
  
  // Collect all internal links
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(siteRoot, file);
    const links = extractInternalLinks(content, path.dirname(file));
    
    for (const link of links) {
      // Only process internal links
      if (link.type === 'internal-absolute' || link.type === 'internal-relative' || link.type === 'anchor') {
        allLinks.push({
          ...link,
          file: relativePath,
          basePath: path.dirname(file)
        });
      }
    }
  }
  
  results.total = allLinks.length;
  console.log(`Found ${allLinks.length} internal links across ${htmlFiles.length} files\n`);
  
  // Process links by type
  for (const link of allLinks) {
    const { href, type, file, line } = link;
    
    switch (type) {
      case 'internal-absolute':
      case 'internal-relative':
        results.internal.total++;
        const internalCheck = checkInternalLink(href, link.basePath, siteRoot);
        if (internalCheck.exists) {
          results.internal.working++;
          // Don't log successful internal links
        } else {
          results.internal.broken++;
          console.log(`❌ Internal: ${file}:${line} → ${href} (not found)`);
        }
        break;
        
      case 'anchor':
        results.anchors.total++;
        const fileContent = fs.readFileSync(path.join(siteRoot, file), 'utf8');
        if (checkAnchorLink(href, fileContent)) {
          results.anchors.working++;
          // Don't log successful anchor links
        } else {
          results.anchors.broken++;
          console.log(`❌ Anchor: ${file}:${line} → ${href} (not found)`);
        }
        break;
        
      default:
        results.other.total++;
        // Don't log other link types unless they're problematic
    }
  }
  
  // Summary
  console.log('\n📊 Internal Link Validation Summary:');
  console.log(`   Scan type: ${results.scanType}`);
  console.log(`   Total internal links: ${results.total}`);
  console.log(`   ✅ Internal file links: ${results.internal.working}/${results.internal.total} working`);
  console.log(`   ✅ Anchor links: ${results.anchors.working}/${results.anchors.total} working`);
  console.log(`   ℹ️  Other links: ${results.other.total}`);
  
  // Show broken links summary
  const totalBroken = results.internal.broken + results.anchors.broken;
  if (totalBroken > 0) {
    console.log(`\n❌ Broken internal links found:`);
    if (results.internal.broken > 0) console.log(`   - Internal file links: ${results.internal.broken}`);
    if (results.anchors.broken > 0) console.log(`   - Anchor links: ${results.anchors.broken}`);
    console.log('\n❌ Internal links need attention - these are under your control.');
    process.exit(1);
  } else {
    console.log('\n🎉 All internal links are working correctly!');
  }
  
  // Update build timestamp for next incremental scan
}

// Run validation
validateInternalLinks().catch(error => {
  console.error('Error during internal link validation:', error);
  process.exit(1);
});
