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

// Extract all external links from HTML content
function extractExternalLinks(htmlContent, basePath) {
  const links = [];
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let match;
  
  while ((match = linkRegex.exec(htmlContent)) !== null) {
    const href = match[1];
    const link = {
      href: href,
      type: classifyExternalLink(href),
      line: htmlContent.substring(0, match.index).split('\n').length
    };
    links.push(link);
  }
  
  return links;
}

// Classify external link type
function classifyExternalLink(href) {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return 'external';
  } else if (href.startsWith('mailto:')) {
    return 'email';
  } else if (href.startsWith('tel:')) {
    return 'phone';
  } else {
    return 'internal'; // Skip internal links
  }
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
      'x.com',
      'instagram.com',
      'youtube.com',
      'tiktok.com'
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

// Main validation function
async function validateExternalLinks() {
  console.log('🌐 Starting external link validation...\n');
  
  // Check for debug flag
  const debug = process.argv.includes('--debug');
  if (debug) {
    console.log('🐛 Debug mode enabled\n');
  }
  
  const siteRoot = './_site';
  const htmlFiles = findHtmlFiles(siteRoot);
  const allLinks = [];
  const results = {
    total: 0,
    external: { total: 0, broken: 0, working: 0, timeout: 0, assumed: 0 },
    other: { total: 0 }
  };
  
  // Collect all external links
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(siteRoot, file);
    const links = extractExternalLinks(content, path.dirname(file));
    
    for (const link of links) {
      // Only process external links
      if (link.type === 'external') {
        allLinks.push({
          ...link,
          file: relativePath,
          basePath: path.dirname(file)
        });
      }
    }
  }
  
  results.total = allLinks.length;
  console.log(`Found ${allLinks.length} external links across ${htmlFiles.length} files\n`);
  
  // Process external links
  for (const link of allLinks) {
    const { href, file, line } = link;
    
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
  }
  
  // Summary
  console.log('\n📊 External Link Validation Summary:');
  console.log(`   Total external links: ${results.total}`);
  console.log(`   ✅ Working: ${results.external.working}`);
  console.log(`   🔒 Assumed working (problematic domains): ${results.external.assumed}`);
  console.log(`   ⏰ Timeouts: ${results.external.timeout}`);
  console.log(`   ❌ Broken: ${results.external.broken}`);
  
  if (results.external.broken > 0) {
    console.log('\n⚠️  Some external links appear to be broken.');
    console.log('   Note: External links can break due to factors outside your control.');
    console.log('   Consider checking these manually or removing them if no longer relevant.');
  } else {
    console.log('\n✅ All external links appear to be working!');
  }
  
  // Don't exit with error code for external links since they're outside your control
  console.log('\n💡 Tip: External links are subject to external policy changes.');
  console.log('   Focus on keeping internal links working for the best user experience.');
}

// Run validation
validateExternalLinks().catch(error => {
  console.error('Error during external link validation:', error);
  process.exit(1);
});
