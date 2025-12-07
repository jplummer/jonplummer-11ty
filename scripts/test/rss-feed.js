#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
// Use Node's built-in DOMParser (available in Node 20+)
const { DOMParser } = require('@xmldom/xmldom');
const { createTestResult, addFile, addIssue, outputResult } = require('../utils/test-result-builder');

// Find RSS/XML files in _site
function findRssFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findRssFiles(fullPath));
    } else if ((item.endsWith('.xml') || item.endsWith('.rss')) && !item.includes('sitemap')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Parse XML content
function parseXML(content) {
  try {
    const parser = new DOMParser();
    return parser.parseFromString(content, 'text/xml');
  } catch (error) {
    return null;
  }
}

// Validate RSS structure
function validateRSSStructure(doc) {
  const issues = [];
  
  if (!doc) {
    issues.push('Invalid XML format');
    return issues;
  }
  
  // Check for RSS root element
  const rssElement = doc.getElementsByTagName('rss')[0];
  if (!rssElement) {
    issues.push('Missing RSS root element');
    return issues;
  }
  
  // Check RSS version
  const version = rssElement.getAttribute('version');
  if (!version) {
    issues.push('Missing RSS version attribute');
  } else if (!['0.91', '0.92', '1.0', '2.0'].includes(version)) {
    issues.push(`Unsupported RSS version: ${version}`);
  }
  
  // Check for channel element
  const channelElement = doc.getElementsByTagName('channel')[0];
  if (!channelElement) {
    issues.push('Missing channel element');
    return issues;
  }
  
  // Check required channel elements
  const requiredChannelElements = ['title', 'description', 'link'];
  for (const elementName of requiredChannelElements) {
    const element = channelElement.getElementsByTagName(elementName)[0];
    if (!element) {
      issues.push(`Missing required channel element: ${elementName}`);
    } else if (!element.textContent || element.textContent.trim() === '') {
      issues.push(`Empty channel element: ${elementName}`);
    }
  }
  
  // Check for items
  const items = channelElement.getElementsByTagName('item');
  if (items.length === 0) {
    issues.push('No items found in RSS feed');
  }
  
  // Validate each item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemIssues = validateRSSItem(item, i + 1);
    issues.push(...itemIssues);
  }
  
  return issues;
}

// Validate RSS item
function validateRSSItem(item, itemNumber) {
  const issues = [];
  
  // Check required item elements
  const requiredItemElements = ['title', 'description', 'link'];
  for (const elementName of requiredItemElements) {
    const element = item.getElementsByTagName(elementName)[0];
    if (!element) {
      issues.push(`Item ${itemNumber}: Missing required element: ${elementName}`);
    } else if (!element.textContent || element.textContent.trim() === '') {
      issues.push(`Item ${itemNumber}: Empty element: ${elementName}`);
    }
  }
  
  // Check for pubDate
  const pubDateElement = item.getElementsByTagName('pubDate')[0];
  if (!pubDateElement) {
    issues.push(`Item ${itemNumber}: Missing pubDate`);
  } else {
    // Validate date format
    const pubDate = new Date(pubDateElement.textContent);
    if (isNaN(pubDate.getTime())) {
      issues.push(`Item ${itemNumber}: Invalid pubDate format`);
    }
  }
  
  // Check for guid
  const guidElement = item.getElementsByTagName('guid')[0];
  if (!guidElement) {
    issues.push(`Item ${itemNumber}: Missing guid`);
  } else if (!guidElement.textContent || guidElement.textContent.trim() === '') {
    issues.push(`Item ${itemNumber}: Empty guid`);
  }
  
  // Check for duplicate guids
  const guid = guidElement ? guidElement.textContent.trim() : '';
  if (guid) {
    // This would need to be checked across all items - we'll do this separately
  }
  
  // Check link format
  const linkElement = item.getElementsByTagName('link')[0];
  if (linkElement) {
    const link = linkElement.textContent.trim();
    if (link && !link.startsWith('http')) {
      issues.push(`Item ${itemNumber}: Link should be absolute URL`);
    }
  }
  
  // Check description length
  const descElement = item.getElementsByTagName('description')[0];
  if (descElement) {
    const description = descElement.textContent.trim();
    if (description.length > 1000) {
      issues.push(`Item ${itemNumber}: Description too long (${description.length} chars)`);
    }
  }
  
  return issues;
}

// Check for duplicate guids
function checkDuplicateGuids(doc) {
  const issues = [];
  const guids = new Map();
  
  const items = doc.getElementsByTagName('item');
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const guidElement = item.getElementsByTagName('guid')[0];
    
    if (guidElement) {
      const guid = guidElement.textContent.trim();
      if (guid) {
        if (guids.has(guid)) {
          issues.push(`Duplicate guid: ${guid} (items ${guids.get(guid)} and ${i + 1})`);
        } else {
          guids.set(guid, i + 1);
        }
      }
    }
  }
  
  return issues;
}

// Check feed freshness
function checkFeedFreshness(doc) {
  const issues = [];
  
  const items = doc.getElementsByTagName('item');
  if (items.length === 0) {
    return issues;
  }
  
  // Get the most recent item
  let mostRecentDate = null;
  let mostRecentItem = null;
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const pubDateElement = item.getElementsByTagName('pubDate')[0];
    
    if (pubDateElement) {
      const pubDate = new Date(pubDateElement.textContent);
      if (!isNaN(pubDate.getTime())) {
        if (!mostRecentDate || pubDate > mostRecentDate) {
          mostRecentDate = pubDate;
          mostRecentItem = i + 1;
        }
      }
    }
  }
  
  if (mostRecentDate) {
    const now = new Date();
    const daysSinceLastUpdate = Math.floor((now - mostRecentDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastUpdate > 30) {
      issues.push(`Feed appears stale - last update ${daysSinceLastUpdate} days ago`);
    }
  }
  
  return issues;
}

// Check feed size
function checkFeedSize(content) {
  const issues = [];
  const sizeInBytes = Buffer.byteLength(content, 'utf8');
  const sizeInKB = sizeInBytes / 1024;
  
  if (sizeInKB > 500) {
    issues.push(`Feed size is large: ${sizeInKB.toFixed(2)}KB (consider pagination)`);
  }
  
  return issues;
}

// Validate RSS feed
function validateRSSFeed(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const doc = parseXML(content);
  
  const issues = [];
  
  // Basic structure validation
  const structureIssues = validateRSSStructure(doc);
  issues.push(...structureIssues);
  
  if (doc) {
    // Check for duplicates
    const duplicateIssues = checkDuplicateGuids(doc);
    issues.push(...duplicateIssues);
    
    // Check freshness
    const freshnessIssues = checkFeedFreshness(doc);
    issues.push(...freshnessIssues);
  }
  
  // Check feed size
  const sizeIssues = checkFeedSize(content);
  issues.push(...sizeIssues);
  
  return issues;
}

// Main RSS validation
function validateRSS() {
  const siteDir = './_site';
  if (!fs.existsSync(siteDir)) {
    console.log('❌ _site directory not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  const rssFiles = findRssFiles(siteDir);
  
  if (rssFiles.length === 0) {
    console.log('❌ No RSS/XML files found in _site directory');
    process.exit(1);
  }
  
  // Create test result using result builder
  const result = createTestResult('rss-feed', 'RSS Feed Validation');
  
  // Validate each RSS file
  for (const file of rssFiles) {
    const relativePath = path.relative('./_site', file);
    const issues = validateRSSFeed(file);
    
    // Add file to result
    const fileObj = addFile(result, relativePath, file);
    
    // Add issues to file
    if (issues.length > 0) {
      issues.forEach(issue => {
        // Determine issue type from message
        let issueType = 'rss-structure';
        if (issue.includes('duplicate')) {
          issueType = 'rss-duplicate';
        } else if (issue.includes('stale')) {
          issueType = 'rss-freshness';
        } else if (issue.includes('size')) {
          issueType = 'rss-size';
        } else if (issue.includes('Item')) {
          issueType = 'rss-item';
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
validateRSS();
