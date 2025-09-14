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

// Check external link with timeout and retry logic
function checkExternalLink(url, retryCount = 0) {
  return new Promise((resolve) => {
    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      resolve({ status: 'error', error: 'Invalid URL format' });
      return;
    }
    
    // Check if this is a known problematic domain or whitelisted domain
    // Note: With improved error categorization, some domains were removed
    // from this list to test them with the new error reporting system
    const problematicDomains = [
      // Social media platforms (always block bots)
      'quora.com',
      'linkedin.com',
      'facebook.com',
      'twitter.com',
      'x.com',
      'instagram.com',
      'youtube.com',
      'tiktok.com',
      
      // E-commerce platforms (complex bot detection)
      'amazon.com',
      'etsy.com',
      
      // Academic/Research platforms (often block bots)
      'patents.google.com',
      'journals.sagepub.com',
      
      // News sites (often block bots)
      'haaretz.com',
      
      // Other sites that consistently block bots
      'askamanager.org',
      'randsinrepose.com',
      'openai.com'
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
    
    // Rotate user agents to avoid detection
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
    ];
    
    const options = {
      method: 'GET', // Use GET instead of HEAD for better compatibility
      headers: {
        'User-Agent': userAgents[retryCount % userAgents.length],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: timeout
    };
    
    const req = protocol.request(url, options, (res) => {
      clearTimeout(timer);
      
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400) {
        const location = res.headers.location;
        if (location && retryCount < 2) {
          // Follow redirect (but limit to avoid infinite loops)
          req.destroy();
          checkExternalLink(location, retryCount + 1).then(resolve);
          return;
        }
      }
      
      // Consider many status codes as "working" for human users
      let isWorking = false;
      let reason = '';
      
      if (res.statusCode >= 200 && res.statusCode < 300) {
        isWorking = true;
      } else if (res.statusCode >= 300 && res.statusCode < 400) {
        isWorking = true;
        reason = 'Redirect';
      } else if (res.statusCode === 403) {
        // 403 Forbidden often means the site is working but blocking bots
        // This is common for sites that work fine for human users
        isWorking = true;
        reason = 'Forbidden (likely bot detection)';
      } else if (res.statusCode === 405) {
        // 405 Method Not Allowed often means the site is working but doesn't allow GET
        // This is common for API endpoints that work fine for human users
        isWorking = true;
        reason = 'Method Not Allowed (likely API endpoint)';
      } else if (res.statusCode === 429) {
        // 429 Too Many Requests - site is working but rate limiting
        isWorking = true;
        reason = 'Rate Limited (site is working)';
      } else if (res.statusCode >= 500 && res.statusCode < 600) {
        // Server errors - these are actually broken
        isWorking = false;
        reason = `Server Error (${res.statusCode})`;
      } else {
        isWorking = false;
        reason = `${res.statusCode} ${res.statusMessage}`;
      }
      
      resolve({ 
        status: res.statusCode, 
        statusText: res.statusMessage,
        success: isWorking,
        reason: reason
      });
    });
    
    req.on('error', (error) => {
      clearTimeout(timer);
      
      // Handle common network errors that might be temporary
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        // DNS or connection issues - these are likely real problems
        resolve({ status: 'error', error: error.message, success: false });
      } else if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        // SSL certificate issues - these are likely real problems
        resolve({ status: 'error', error: error.message, success: false });
      } else {
        // Other errors might be temporary, retry once
        if (retryCount < 1) {
          req.destroy();
          setTimeout(() => {
            checkExternalLink(url, retryCount + 1).then(resolve);
          }, 2000); // Wait 2 seconds before retry
        } else {
          resolve({ status: 'error', error: error.message, success: false });
        }
      }
    });
    
    req.on('timeout', () => {
      req.destroy();
      clearTimeout(timer);
      
      // Retry timeout errors once
      if (retryCount < 1) {
        setTimeout(() => {
          checkExternalLink(url, retryCount + 1).then(resolve);
        }, 2000); // Wait 2 seconds before retry
      } else {
        resolve({ status: 'timeout', error: 'Request timeout', success: false });
      }
    });
    
    req.end();
  });
}

// Categorize error type for better reporting
function categorizeError(externalCheck) {
  const status = externalCheck.status;
  const error = externalCheck.error || '';
  
  // Timeout errors
  if (status === 'timeout' || error.includes('timeout')) {
    return 'timeout';
  }
  
  // Certificate errors
  if (error.includes('certificate') || error.includes('CERT_') || error.includes('UNABLE_TO_VERIFY')) {
    return 'certificate';
  }
  
  // 404 and DNS errors (potentially fixable)
  if (status === 404 || error.includes('ENOTFOUND') || error.includes('Not Found')) {
    return 'notFound';
  }
  
  // Server errors (5xx)
  if (status >= 500 && status < 600) {
    return 'serverError';
  }
  
  // Other errors
  return 'other';
}

// Get appropriate icon for error type
function getErrorIcon(errorType) {
  switch (errorType) {
    case 'notFound':
      return '🔍'; // Magnifying glass - potentially fixable
    case 'serverError':
      return '🖥️'; // Server - server issues
    case 'timeout':
      return '⏰'; // Clock - might be temporary
    case 'certificate':
      return '🔒'; // Lock - SSL issues
    default:
      return '❌'; // X - other errors
  }
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
    console.log('✅ No files to check. All external links are up to date!');
    return;
  }
  
  console.log(`Found ${htmlFiles.length} HTML files to check\n`);
  
  const allLinks = [];
  const results = {
    total: 0,
    external: { 
      total: 0, 
      working: 0, 
      assumed: 0,
      broken: {
        total: 0,
        notFound: 0,        // 404, ENOTFOUND - potentially fixable
        serverError: 0,      // 5xx errors - server issues
        timeout: 0,          // timeouts - might be temporary
        certificate: 0,      // SSL cert issues - might be temporary
        other: 0             // other errors
      }
    },
    other: { total: 0 },
    scanType: scanType
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
  
  // Process external links with delay to be respectful
  for (let i = 0; i < allLinks.length; i++) {
    const link = allLinks[i];
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
      } else if (externalCheck.redirect) {
        results.external.working++;
        // Don't log redirects as they're usually fine
      } else if (externalCheck.reason && externalCheck.reason.includes('likely')) {
        // These are working but with bot detection - don't count as broken
        results.external.working++;
        if (debug) {
          console.log(`✅ External: ${file}:${line} → ${href} (${externalCheck.reason})`);
        }
      } else {
        // Categorize the error
        const errorType = categorizeError(externalCheck);
        results.external.broken.total++;
        results.external.broken[errorType]++;
        
        const errorMsg = externalCheck.error || externalCheck.reason || externalCheck.statusText || externalCheck.status;
        const icon = getErrorIcon(errorType);
        console.log(`${icon} External: ${file}:${line} → ${href} (${errorMsg})`);
        
        if (debug) {
          console.log(`   Debug: Full response:`, externalCheck);
        }
      }
    } catch (error) {
      results.external.broken.total++;
      results.external.broken.other++;
      console.log(`❌ External: ${file}:${line} → ${href} (error: ${error.message})`);
    }
    
    // Add a small delay between requests to be respectful to external servers
    if (i < allLinks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
    }
  }
  
  // Summary
  console.log('\n📊 External Link Validation Summary:');
  console.log(`   Scan type: ${results.scanType}`);
  console.log(`   Total external links: ${results.total}`);
  console.log(`   ✅ Working: ${results.external.working}`);
  console.log(`   🔒 Assumed working (bot-blocked domains): ${results.external.assumed}`);
  
  if (results.external.broken.total > 0) {
    console.log(`   ❌ Broken: ${results.external.broken.total}`);
    console.log(`      🔍 Not Found (404/DNS) - potentially fixable: ${results.external.broken.notFound}`);
    console.log(`      🖥️  Server errors (5xx) - server issues: ${results.external.broken.serverError}`);
    console.log(`      ⏰ Timeouts - might be temporary: ${results.external.broken.timeout}`);
    console.log(`      🔒 Certificate errors - SSL issues: ${results.external.broken.certificate}`);
    console.log(`      ❌ Other errors: ${results.external.broken.other}`);
  }
  
  if (results.external.broken.total > 0) {
    console.log('\n⚠️  Some external links appear to be broken.');
    console.log('   Note: External links can break due to factors outside your control.');
    console.log('   Consider checking these manually or removing them if no longer relevant.');
  } else {
    console.log('\n✅ All external links appear to be working!');
  }
  
  console.log('\n💡 Improvements made:');
  console.log('   • Added whitelist for domains that commonly block bots');
  console.log('   • Treat 403/405 errors as working (bot detection)');
  console.log('   • Added retry logic for temporary failures');
  console.log('   • Better user agent rotation');
  console.log('   • Added delays between requests');
  console.log('   • Categorized errors by type for better prioritization');
  
  // Don't exit with error code for external links since they're outside your control
  console.log('\n💡 Tip: External links are subject to external policy changes.');
  console.log('   Focus on keeping internal links working for the best user experience.');
  
  // Update build timestamp for next incremental scan
  setCurrentBuildTimestamp();
}

// Run validation
validateExternalLinks().catch(error => {
  console.error('Error during external link validation:', error);
  process.exit(1);
});
