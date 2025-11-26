#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { extractLinks, checkAnchorLink, classifyLink } = require('./utils/html-utils');
const { checkSiteDirectory, getHtmlFiles, getRelativePath, readFile } = require('./utils/test-base');

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
  console.log('🔗 Starting internal link validation...\n');
  
  checkSiteDirectory();
  const siteRoot = './_site';
  
  console.log('📋 Running full site scan');
  const htmlFiles = getHtmlFiles();
  
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
    other: { total: 0 }
  };
  
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
        const fileContent = readFile(path.join(siteRoot, file));
        if (checkAnchor(href, fileContent)) {
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
}

// Run validation
validateInternalLinks().catch(error => {
  console.error('Error during internal link validation:', error);
  process.exit(1);
});
