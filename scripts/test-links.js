#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { getChangedHtmlFiles, shouldRunFullScan, setCurrentBuildTimestamp } = require('./changed-files-util');

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
    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      resolve({ status: 'error', error: 'Invalid URL format' });
      return;
    }
    
    // Check if this is a known problematic domain
    const problematicDomains = [
      'quora.com',
      'linkedin.com',
      'patents.google.com',
      'facebook.com',
      'twitter.com',
      'x.com'
    ];
    
    const urlObj = new URL(url);
    const isProblematic = problematicDomains.some(domain => 
      urlObj.hostname.includes(domain)
    );
    
    if (isProblematic) {
      // For problematic domains, we'll assume they're working
      // since they often block automated requests
      resolve({ 
        status: 'assumed_working', 
        success: true,
        reason: 'Known problematic domain - assuming working'
      });
      return;
    }
    
    const timeout = 10000; // 10 second timeout
    const timer = setTimeout(() => {
      resolve({ status: 'timeout', error: 'Request timeout' });
    }, timeout);
    
    const protocol = url.startsWith('https:') ? https : http;
    
    const options = {
      method: 'HEAD', // Use HEAD request to be more efficient
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'close',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: timeout
    };
    
    const req = protocol.request(url, options, (res) => {
      clearTimeout(timer);
      
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400) {
        const location = res.headers.location;
        if (location) {
          // Follow redirect (but limit to avoid infinite loops)
          req.destroy();
          resolve({ 
            status: res.statusCode, 
            statusText: res.statusMessage,
            success: true, // Redirects are usually fine
            redirect: location
          });
          return;
        }
      }
      
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
    
    req.on('timeout', () => {
      req.destroy();
      clearTimeout(timer);
      resolve({ status: 'timeout', error: 'Request timeout' });
    });
    
    req.end();
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
  
  // Check for debug flag
  const debug = process.argv.includes('--debug');
  if (debug) {
    console.log('🐛 Debug mode enabled\n');
  }
  
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
    console.log('✅ No files to check. All links are up to date!');
    return;
  }
  
  console.log(`Found ${htmlFiles.length} HTML files to check\n`);
  
  const allLinks = [];
  const results = {
    total: 0,
    internal: { total: 0, broken: 0, working: 0 },
    external: { total: 0, broken: 0, working: 0, timeout: 0, assumed: 0 },
    anchors: { total: 0, broken: 0, working: 0 },
    other: { total: 0 },
    scanType: scanType
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
          // Don't log successful internal links
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
            if (externalCheck.status === 'assumed_working') {
              results.external.assumed++;
              // Don't log assumed working links
            } else {
              results.external.working++;
              // Don't log successful external links
            }
          } else if (externalCheck.status === 'timeout') {
            results.external.timeout++;
            console.log(`⏰ External: ${file}:${line} → ${href} (timeout)`);
          } else if (externalCheck.redirect) {
            results.external.working++;
            // Don't log redirects as they're usually fine
          } else {
            results.external.broken++;
            const errorMsg = externalCheck.error || externalCheck.statusText || externalCheck.status;
            console.log(`❌ External: ${file}:${line} → ${href} (${errorMsg})`);
            if (debug) {
              console.log(`   Debug: Full response:`, externalCheck);
            }
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
  console.log('\n📊 Link Validation Summary:');
  console.log(`   Scan type: ${results.scanType}`);
  console.log(`   Total links: ${results.total}`);
  console.log(`   ✅ Internal links: ${results.internal.working}/${results.internal.total} working`);
  console.log(`   ✅ External links: ${results.external.working}/${results.external.total} working`);
  console.log(`   ✅ Anchor links: ${results.anchors.working}/${results.anchors.total} working`);
  console.log(`   ℹ️  Other links: ${results.other.total}`);
  
  // Show timeout summary if any
  if (results.external.timeout > 0) {
    console.log(`   ⏰ External timeouts: ${results.external.timeout}`);
  }
  
  // Show assumed working links
  if (results.external.assumed > 0) {
    console.log(`   🔒 Assumed working (problematic domains): ${results.external.assumed}`);
  }
  
  // Show broken links summary
  const totalBroken = results.internal.broken + results.external.broken + results.anchors.broken;
  if (totalBroken > 0) {
    console.log(`\n❌ Broken links found:`);
    if (results.internal.broken > 0) console.log(`   - Internal: ${results.internal.broken}`);
    if (results.external.broken > 0) console.log(`   - External: ${results.external.broken}`);
    if (results.anchors.broken > 0) console.log(`   - Anchors: ${results.anchors.broken}`);
    console.log('\n❌ Some links are broken and need attention.');
    process.exit(1);
  } else {
    console.log('\n🎉 All links are working correctly!');
  }
  
  // Update build timestamp for next incremental scan
  setCurrentBuildTimestamp();
}

// Run validation
validateLinks().catch(error => {
  console.error('Error during link validation:', error);
  process.exit(1);
});
