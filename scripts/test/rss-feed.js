#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');
const feedLimits = require('../../src/_data/feedLimits');
const { addFile, addIssue, addWarning } = require('../utils/test-results');

// RSS 2.0 dates are RFC 822 with a four-digit year: "Wed, 28 Oct 2026 00:00:00 -0700".
// Until 2026-11-15 the feeds carried ISO dates ("2026-10-28T07:00:00.000Z"),
// which many readers accept and the RSS spec does not.
const RFC822_DATE = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} ([+-]\d{4}|GMT|UT)$/;

function isRfc822Date(text) {
  return RFC822_DATE.test(String(text).trim()) && !isNaN(new Date(text).getTime());
}

// The rule itself, checked on every run before any feed is read.
function assertRfc822Guard() {
  const assert = require('assert');
  for (const good of ['Wed, 28 Oct 2026 00:00:00 -0700', 'Thu, 01 Jan 2026 00:00:00 -0800', 'Wed, 28 Oct 2026 07:00:00 GMT']) {
    assert.ok(isRfc822Date(good), `rss-feed guard: ${good} is RFC 822`);
  }
  for (const bad of ['2026-10-28T07:00:00.000Z', '2026-10-28', 'Wed, 28 Oct 26 00:00:00 -0700', 'Wed 28 Oct 2026 00:00:00 -0700', 'Wed, 28 Oct 2026 00:00:00', 'Wed, 28 Oct 2026 00:00:00 GMT-07:00', '']) {
    assert.ok(!isRfc822Date(bad), `rss-feed guard: "${bad}" is not RFC 822`);
  }
}

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

// The most items each feed may carry, by file name
const FEED_LIMITS = {
  'feed.xml': feedLimits.posts,
  'links-feed.xml': feedLimits.links,
  'wisdom-feed.xml': feedLimits.wisdom,
};

// Validate RSS structure
function validateRSSStructure(doc, options = {}) {
  const { fileBaseName = '' } = options;
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
  
  const lastBuildDate = channelElement.getElementsByTagName('lastBuildDate')[0];
  if (lastBuildDate && !isRfc822Date(lastBuildDate.textContent)) {
    issues.push(`lastBuildDate is not an RFC 822 date: "${lastBuildDate.textContent}"`);
  }

  // Check for items (wisdom feed may be empty without breaking the build)
  const items = channelElement.getElementsByTagName('item');
  if (items.length === 0 && fileBaseName !== 'wisdom-feed.xml') {
    issues.push('No items found in RSS feed');
  }

  // Each feed carries only its newest few items (src/_data/feedLimits.js).
  // links-feed.xml had no limit until 2026-11-10 and carried all 204 links.
  const limit = FEED_LIMITS[fileBaseName];
  if (limit === undefined) {
    issues.push(`No item limit for this feed: add it to FEED_LIMITS in scripts/test/rss-feed.js and src/_data/feedLimits.js`);
  } else if (items.length > limit) {
    issues.push(`Feed carries ${items.length} items; its limit is ${limit} (src/_data/feedLimits.js)`);
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
    } else if (!isRfc822Date(pubDateElement.textContent)) {
      issues.push(`Item ${itemNumber}: pubDate is not an RFC 822 date: "${pubDateElement.textContent}"`);
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

// Feeds that never warn about age
const FRESHNESS_EXEMPT = new Set(['wisdom-feed.xml']);

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
  const fileBaseName = path.basename(filePath);
  
  const issues = [];
  
  // Basic structure validation
  const structureIssues = validateRSSStructure(doc, { fileBaseName });
  issues.push(...structureIssues);
  
  if (doc) {
    // Check for duplicates
    const duplicateIssues = checkDuplicateGuids(doc);
    issues.push(...duplicateIssues);
    
    // Check freshness. The posts and links feeds should move every month;
    // collected wisdom grows when it grows, so its age isn't a problem.
    if (!FRESHNESS_EXEMPT.has(fileBaseName)) {
      issues.push(...checkFeedFreshness(doc));
    }
  }
  
  // Check feed size
  const sizeIssues = checkFeedSize(content);
  issues.push(...sizeIssues);
  
  return issues;
}

function validateWisdomFeedDiscovery(result) {
  const indexPath = path.join(process.cwd(), '_site', 'index.html');
  if (!fs.existsSync(indexPath)) {
    return;
  }
  const html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes('wisdom-feed.xml')) {
    const fileObj = addFile(result, '_site/index.html', indexPath);
    addIssue(fileObj, {
      type: 'wisdom-feed-discovery',
      message: 'Homepage HTML missing link rel=alternate for /wisdom-feed.xml'
    });
  }
}

// Main RSS validation
function validate(result) {
  assertRfc822Guard();
  const siteDir = './_site';
  const rssFiles = findRssFiles(siteDir);
  
  if (rssFiles.length === 0) {
    // Add global issue for no RSS files found
    const { addGlobalIssue } = require('../utils/test-results');
    addGlobalIssue(result, {
      type: 'rss-no-files',
      message: 'No RSS/XML files found in _site directory'
    });
    return;
  }
  
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
        
        const payload = {
          type: issueType,
          message: issue
        };
        if (issue.includes('stale')) {
          addWarning(fileObj, payload);
        } else {
          addIssue(fileObj, payload);
        }
      });
    }
  }

  validateWisdomFeedDiscovery(result);
}

// Run test with helper
const { runTest } = require('../utils/test-runner-helper');

runTest({
  testType: 'rss',
  testName: 'RSS Feed Validation',
  requiresSite: true,
  validateFn: validate
}).catch(err => {
  console.error(err);
  process.exit(1);
});
