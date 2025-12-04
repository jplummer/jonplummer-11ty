#!/usr/bin/env node

/**
 * HTML Utilities
 * 
 * Shared HTML parsing and extraction functions using cheerio
 * to replace fragile regex-based parsing.
 */

const fs = require('fs');
const cheerio = require('cheerio');

/**
 * Parse HTML content using cheerio
 * @param {string} htmlContent - HTML content to parse
 * @returns {cheerio.Root} Cheerio root object
 */
function parseHtml(htmlContent) {
  return cheerio.load(htmlContent);
}

/**
 * Parse HTML file and return cheerio root
 * @param {string} filePath - Path to HTML file
 * @returns {cheerio.Root} Cheerio root object
 */
function parseHtmlFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return parseHtml(content);
}

/**
 * Extract all links from HTML content
 * @param {string} htmlContent - HTML content
 * @param {string} basePath - Base path for resolving relative URLs
 * @returns {Array} Array of link objects with href, type, and line number
 */
function extractLinks(htmlContent, basePath = '') {
  const $ = parseHtml(htmlContent);
  const links = [];
  
  $('a[href]').each((index, element) => {
    const $el = $(element);
    const href = $el.attr('href');
    
    if (!href) return;
    
    // Extract element HTML using the original cheerio instance
    const elementHtml = $el.toString();
    
    links.push({
      href: href,
      type: classifyLink(href),
      text: $el.text().trim(),
      line: getLineNumber(htmlContent, elementHtml)
    });
  });
  
  return links;
}

/**
 * Classify link type
 * @param {string} href - Link href
 * @returns {string} Link type
 */
function classifyLink(href) {
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

/**
 * Extract meta tags from HTML content
 * @param {string} htmlContent - HTML content
 * @returns {Object} Object with meta tag values
 */
function extractMetaTags(htmlContent) {
  const $ = parseHtml(htmlContent);
  const metaTags = {};
  
  // Title tag
  const title = $('title').first().text().trim();
  if (title) {
    metaTags.title = title;
  }
  
  // Meta description
  const description = $('meta[name="description"]').attr('content');
  if (description) {
    metaTags.description = description.trim();
  }
  
  // Meta keywords
  const keywords = $('meta[name="keywords"]').attr('content');
  if (keywords) {
    metaTags.keywords = keywords.trim();
  }
  
  // Open Graph tags
  const ogTags = {};
  $('meta[property^="og:"]').each((index, element) => {
    const $el = $(element);
    const property = $el.attr('property');
    const content = $el.attr('content');
    if (property && content) {
      const ogKey = property.replace('og:', '');
      ogTags[ogKey] = content.trim();
    }
  });
  metaTags.og = ogTags;
  
  // Canonical URL
  const canonical = $('link[rel="canonical"]').attr('href');
  if (canonical) {
    metaTags.canonical = canonical.trim();
  }
  
  // Language
  const lang = $('html').attr('lang');
  if (lang) {
    metaTags.lang = lang.trim();
  }
  
  return metaTags;
}

/**
 * Extract headings from HTML content
 * @param {string} htmlContent - HTML content
 * @returns {Array} Array of heading objects with level and text
 */
function extractHeadings(htmlContent) {
  const $ = parseHtml(htmlContent);
  const headings = [];
  
  $('h1, h2, h3, h4, h5, h6').each((index, element) => {
    const $el = $(element);
    const tagName = $el.prop('tagName');
    const level = parseInt(tagName.replace('H', ''));
    
    headings.push({
      level: level,
      text: $el.text().trim(),
      id: $el.attr('id') || null
    });
  });
  
  return headings;
}

/**
 * Escape special characters for use in CSS selectors
 * Escapes characters that have special meaning in CSS selectors
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for CSS selectors
 */
function escapeCssSelector(str) {
  // Escape special CSS selector characters: . # : [ ] ( ) space and others
  return str.replace(/([!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~ ])/g, '\\$1');
}

/**
 * Check if anchor link exists in HTML content
 * @param {string} htmlContent - HTML content
 * @param {string} anchorId - Anchor ID (without #)
 * @returns {boolean} True if anchor exists
 */
function checkAnchorLink(htmlContent, anchorId) {
  const $ = parseHtml(htmlContent);
  
  // Escape anchorId to prevent CSS selector injection
  // Special characters like . # : [ ] etc. need to be escaped
  const escapedId = escapeCssSelector(anchorId);
  
  // Check for id attribute (escape special characters in selector)
  if ($(`#${escapedId}`).length > 0) {
    return true;
  }
  
  // Check for name attribute (legacy) - use attribute selector with escaped value
  // For attribute selectors, we need to escape quotes and backslashes in the value
  const escapedValue = anchorId.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  if ($(`[name="${escapedValue}"]`).length > 0) {
    return true;
  }
  
  return false;
}

/**
 * Get approximate line number for an element
 * This is a rough estimate based on counting newlines before the element
 * @param {string} htmlContent - Original HTML content
 * @param {string} elementHtml - Element's HTML string (from cheerio's toString())
 * @returns {number} Approximate line number
 */
function getLineNumber(htmlContent, elementHtml) {
  // Cheerio doesn't preserve line numbers, so we estimate
  // by finding the element's position in the original HTML
  // elementHtml is already a string from the original cheerio instance
  const index = htmlContent.indexOf(elementHtml);
  
  if (index === -1) {
    return 1;
  }
  
  return htmlContent.substring(0, index).split('\n').length;
}

module.exports = {
  parseHtml,
  parseHtmlFile,
  extractLinks,
  extractMetaTags,
  extractHeadings,
  checkAnchorLink,
  classifyLink
};

