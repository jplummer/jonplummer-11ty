#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Find all HTML files in _site
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

// Extract all links from HTML content
function extractLinks(htmlContent, basePath) {
  const links = [];
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let match;
  
  while ((match = linkRegex.exec(htmlContent)) !== null) {
    const href = match[1];
    const link = {
      href: href,
      type: classifyLink(href, basePath),
      line: htmlContent.substring(0, match.index).split('\n').length
    };
    links.push(link);
  }
  
  return links;
}

// Classify link type
function classifyLink(href, basePath) {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return 'external';
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

// Check external link with timeout
function checkExternalLink(url) {
  return new Promise((resolve) => {
    const timeout = 10000; // 10 second timeout
    const timer = setTimeout(() => {
      resolve({ status: 'timeout', error: 'Request timeout' });
    }, timeout);
    
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, (res) => {
      clearTimeout(timer);
      resolve({ 
        status: res.statusCode, 
        statusText: res.statusMessage,
        success: res.statusCode >= 200 && res.statusCode < 400
      });
    });
    
    req.on('error', (error) => {
      clearTimeout(timer);
      resolve({ status: 'error', error: error.message });
    });
    
    req.setTimeout(timeout, () => {
      req.destroy();
      clearTimeout(timer);
      resolve({ status: 'timeout', error: 'Request timeout' });
    });
  });
}

// Check anchor links within the same page
function checkAnchorLink(href, htmlContent) {
  const anchorId = href.substring(1);
  const idRegex = new RegExp(`id=["']${anchorId}["']`, 'i');
  const nameRegex = new RegExp(`name=["']${anchorId}["']`, 'i');
  
  return idRegex.test(htmlContent) || nameRegex.test(htmlContent);
}

// Main validation function
async function validateLinks() {
  console.log('🔗 Starting link validation...\n');
  
  const siteRoot = './_site';
  const htmlFiles = findHtmlFiles(siteRoot);
  const allLinks = [];
  const results = {
    total: 0,
    internal: { total: 0, broken: 0, working: 0 },
    external: { total: 0, broken: 0, working: 0, timeout: 0 },
    anchors: { total: 0, broken: 0, working: 0 },
    other: { total: 0 }
  };
  
  // Collect all links
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(siteRoot, file);
    const links = extractLinks(content, path.dirname(file));
    
    for (const link of links) {
      allLinks.push({
        ...link,
        file: relativePath,
        basePath: path.dirname(file)
      });
    }
  }
  
  results.total = allLinks.length;
  console.log(`Found ${allLinks.length} links across ${htmlFiles.length} files\n`);
  
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
          console.log(`✅ Internal: ${file}:${line} → ${href}`);
        } else {
          results.internal.broken++;
          console.log(`❌ Internal: ${file}:${line} → ${href} (not found)`);
        }
        break;
        
      case 'external':
        results.external.total++;
        try {
          const externalCheck = await checkExternalLink(href);
          if (externalCheck.success) {
            results.external.working++;
            console.log(`✅ External: ${file}:${line} → ${href} (${externalCheck.status})`);
          } else if (externalCheck.status === 'timeout') {
            results.external.timeout++;
            console.log(`⏰ External: ${file}:${line} → ${href} (timeout)`);
          } else {
            results.external.broken++;
            console.log(`❌ External: ${file}:${line} → ${href} (${externalCheck.status})`);
          }
        } catch (error) {
          results.external.broken++;
          console.log(`❌ External: ${file}:${line} → ${href} (error: ${error.message})`);
        }
        break;
        
      case 'anchor':
        results.anchors.total++;
        const fileContent = fs.readFileSync(path.join(siteRoot, file), 'utf8');
        if (checkAnchorLink(href, fileContent)) {
          results.anchors.working++;
          console.log(`✅ Anchor: ${file}:${line} → ${href}`);
        } else {
          results.anchors.broken++;
          console.log(`❌ Anchor: ${file}:${line} → ${href} (not found)`);
        }
        break;
        
      default:
        results.other.total++;
        console.log(`ℹ️  Other: ${file}:${line} → ${href} (${type})`);
    }
  }
  
  // Summary
  console.log('\n📊 Link Validation Summary:');
  console.log(`   Total links: ${results.total}`);
  console.log(`   Internal links: ${results.internal.working}/${results.internal.total} working`);
  console.log(`   External links: ${results.external.working}/${results.external.total} working`);
  console.log(`   Anchor links: ${results.anchors.working}/${results.anchors.total} working`);
  console.log(`   Other links: ${results.other.total}`);
  
  if (results.internal.broken > 0 || results.external.broken > 0 || results.anchors.broken > 0) {
    console.log('\n❌ Some links are broken and need attention.');
    process.exit(1);
  } else {
    console.log('\n🎉 All links are working correctly!');
  }
}

// Run validation
validateLinks().catch(error => {
  console.error('Error during link validation:', error);
  process.exit(1);
});
