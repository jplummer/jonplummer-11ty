#!/usr/bin/env node

const path = require('path');
const { extractMetaTags, extractHeadings, parseHtml } = require('../utils/html-utils');
const { validateTitle: validateTitleUtil, validateMetaDescription: validateMetaDescriptionUtil } = require('../utils/validation-utils');
const { checkSiteDirectory, getHtmlFiles, getRelativePath, readFile } = require('../utils/test-base');
const { printSummary, exitWithResults, getTestEmoji } = require('../utils/reporting-utils');

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

// Validate title (adapts validation-utils format to array of issues)
function validateTitle(title) {
  const issues = [];
  
  if (!title) {
    issues.push('Missing title tag');
    return issues;
  }
  
  const result = validateTitleUtil(title, 30, 60);
  if (!result.valid) {
    issues.push(result.error);
  }
  
  // Additional check for separators
  if (title.includes('|') && title.split('|').length > 3) {
    issues.push('Title has too many separators (|)');
  }
  
  return issues;
}

// Validate meta description (adapts validation-utils format to array of issues)
// Note: This validates final HTML output with SEO best practices (120-160 chars)
// This is stricter than content-structure.js (50-160) because:
// - We're validating the final rendered HTML, not source markdown
// - SEO best practice is 120-160 characters for optimal search engine display
// - content-structure.js allows more flexibility during content creation
function validateMetaDescription(description) {
  const issues = [];
  
  if (!description) {
    // Missing description is ERROR here (not WARNING) because:
    // - This is final output validation - critical for SEO
    // - content-structure.js already warned about this in source
    // - Missing meta description significantly impacts SEO
    issues.push('Missing meta description');
    return issues;
  }
  
  const result = validateMetaDescriptionUtil(description, 120, 160);
  if (!result.valid) {
    issues.push(result.error);
  }
  
  // Additional check for unescaped quotes
  // Check the raw HTML, not the parsed value, since parsed values unescape entities
  // We need to check the actual HTML source to see if quotes are properly escaped
  // This check is done in the main validation loop where we have access to raw HTML
  
  return issues;
}

// Validate Open Graph tags
function validateOpenGraph(ogTags) {
  const issues = [];
  const required = ['title', 'description', 'type'];
  const recommended = ['image', 'url'];
  
  // Check required tags
  for (const tag of required) {
    if (!ogTags[tag]) {
      issues.push(`Missing required Open Graph tag: og:${tag}`);
    }
  }
  
  // Check recommended tags
  for (const tag of recommended) {
    if (!ogTags[tag]) {
      issues.push(`Missing recommended Open Graph tag: og:${tag}`);
    }
  }
  
  // Validate specific tags
  if (ogTags.title && ogTags.title.length > 95) {
    issues.push('Open Graph title too long (should be ≤95 characters)');
  }
  
  if (ogTags.description && ogTags.description.length > 200) {
    issues.push('Open Graph description too long (should be ≤200 characters)');
  }
  
  if (ogTags.image && !ogTags.image.startsWith('http')) {
    issues.push('Open Graph image should be absolute URL');
  }
  
  if (ogTags.type && !['website', 'article'].includes(ogTags.type)) {
    issues.push('Open Graph type should be "website" or "article"');
  }
  
  return issues;
}

// Validate heading structure
function validateHeadings(headings) {
  const issues = [];
  
  if (headings.length === 0) {
    issues.push('No headings found');
    return issues;
  }
  
  // Check for H1
  const h1Count = headings.filter(h => h.level === 1).length;
  if (h1Count === 0) {
    issues.push('No H1 heading found');
  }
  // Note: Multiple H1 headings check disabled - this is acceptable for some site structures
  
  // Check heading hierarchy
  let lastLevel = 0;
  for (const heading of headings) {
    if (heading.level > lastLevel + 1) {
      issues.push(`Heading hierarchy skip: H${lastLevel} → H${heading.level}`);
    }
    lastLevel = heading.level;
  }
  
  // Check for empty headings
  const emptyHeadings = headings.filter(h => h.text.length === 0);
  if (emptyHeadings.length > 0) {
    issues.push(`${emptyHeadings.length} empty heading(s) found`);
  }
  
  return issues;
}

// Check for duplicate titles
function checkDuplicateTitles(files) {
  const titleMap = new Map();
  const duplicates = [];
  
  for (const file of files) {
    const content = readFile(file);
    // Skip redirect pages from duplicate title checking
    if (isRedirectPage(content)) {
      continue;
    }
    
    const metaTags = extractMetaTags(content);
    
    if (metaTags.title) {
      if (titleMap.has(metaTags.title)) {
        duplicates.push({
          title: metaTags.title,
          files: [titleMap.get(metaTags.title), getRelativePath(file)]
        });
      } else {
        titleMap.set(metaTags.title, getRelativePath(file));
      }
    }
  }
  
  return duplicates;
}

// Main SEO validation
function validateSEO() {
  checkSiteDirectory();
  const htmlFiles = getHtmlFiles();
  
  const results = {
    total: htmlFiles.length,
    issues: 0,
    warnings: 0,
    filesWithIssues: 0,
    duplicateTitles: [],
    issueTypes: new Map(), // Track issues by type
    warningTypes: new Map() // Track warnings by type
  };
  
  // Check for duplicate titles
  const duplicateTitles = checkDuplicateTitles(htmlFiles);
  if (duplicateTitles.length > 0) {
    console.log('🔄 Duplicate Titles:');
    duplicateTitles.forEach(dup => {
      console.log(`   ❌ "${dup.title}" in:`);
      dup.files.forEach(file => console.log(`      - ${file}`));
    });
    results.duplicateTitles = duplicateTitles;
    const dupCount = duplicateTitles.length;
    results.issueTypes.set('Duplicate titles', (results.issueTypes.get('Duplicate titles') || 0) + dupCount);
  }
  
  // Validate each file
  for (const file of htmlFiles) {
    const relativePath = getRelativePath(file);
    const content = readFile(file);
    const metaTags = extractMetaTags(content);
    const headings = extractHeadings(content);
    const isRedirect = isRedirectPage(content);
    
    let fileIssues = 0;
    let fileWarnings = 0;
    const issueMessages = [];
    const warningMessages = [];
    
    // Basic title check (always required, but length validation skipped for redirects)
    if (!metaTags.title) {
      const issueType = 'Title: Missing title tag';
      issueMessages.push(`   ❌ ${issueType}`);
      fileIssues++;
      results.issueTypes.set(issueType, (results.issueTypes.get(issueType) || 0) + 1);
    } else if (!isRedirect) {
      // Full title validation only for non-redirect pages
      const titleIssues = validateTitle(metaTags.title);
      if (titleIssues.length > 0) {
        titleIssues.forEach(issue => {
          const issueType = `Title: ${issue}`;
          // Length issues are warnings, missing title is already handled above as error
          if (issue.includes('too short') || issue.includes('too long') || issue.includes('separators')) {
            warningMessages.push(`   ⚠️  ${issueType}`);
            results.warningTypes.set(issueType, (results.warningTypes.get(issueType) || 0) + 1);
            fileWarnings++;
          } else {
          issueMessages.push(`   ❌ ${issueType}`);
          results.issueTypes.set(issueType, (results.issueTypes.get(issueType) || 0) + 1);
            fileIssues++;
          }
        });
      }
    }
    
    // Meta description validation (skipped for redirects)
    // Validates final HTML output with SEO best practices (120-160 chars)
    // Note: This is stricter than content-structure.js (50-160) which validates source markdown
    if (!isRedirect) {
      const descIssues = validateMetaDescription(metaTags.description);
      
      // Check for unescaped quotes in raw HTML (not parsed value)
      const rawDescMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
      if (rawDescMatch && rawDescMatch[1]) {
        const rawDesc = rawDescMatch[1];
        // Check if raw HTML has unescaped straight quotes (not &quot;)
        if (rawDesc.includes('"') && !rawDesc.includes('&quot;') && !rawDesc.includes('&#34;')) {
          descIssues.push('Meta description contains unescaped quotes');
        }
      }
      
      if (descIssues.length > 0) {
        descIssues.forEach(issue => {
          const issueType = `Meta Description: ${issue}`;
          // Length issues are warnings (SEO best practice, not breaking)
          // Missing description and unescaped quotes are errors (critical issues)
          if (issue.includes('too short') || issue.includes('too long')) {
            warningMessages.push(`   ⚠️  ${issueType}`);
            results.warningTypes.set(issueType, (results.warningTypes.get(issueType) || 0) + 1);
            fileWarnings++;
          } else {
          issueMessages.push(`   ❌ ${issueType}`);
          results.issueTypes.set(issueType, (results.issueTypes.get(issueType) || 0) + 1);
            fileIssues++;
          }
        });
      }
    }
    
    // Open Graph validation (skipped for redirects)
    if (!isRedirect) {
      const ogIssues = validateOpenGraph(metaTags.og);
      if (ogIssues.length > 0) {
        ogIssues.forEach(issue => {
          const warningType = `Open Graph: ${issue}`;
          warningMessages.push(`   ⚠️  ${warningType}`);
          results.warningTypes.set(warningType, (results.warningTypes.get(warningType) || 0) + 1);
        });
        fileWarnings += ogIssues.length;
      }
    }
    
    // Heading validation (skipped for redirects and utility pages)
    const isUtilityPage = relativePath.includes('og-image-preview');
    if (!isRedirect && !isUtilityPage) {
      const headingIssues = validateHeadings(headings);
      if (headingIssues.length > 0) {
        headingIssues.forEach(issue => {
          const issueType = `Headings: ${issue}`;
          issueMessages.push(`   ❌ ${issueType}`);
          results.issueTypes.set(issueType, (results.issueTypes.get(issueType) || 0) + 1);
        });
        fileIssues += headingIssues.length;
      }
    }
    
    // Check for missing canonical URL (always checked)
    if (!metaTags.canonical) {
      const warningType = 'Missing canonical URL';
      warningMessages.push(`   ⚠️  ${warningType}`);
      fileWarnings++;
      results.warningTypes.set(warningType, (results.warningTypes.get(warningType) || 0) + 1);
    }
    
    // Check for missing language attribute (always checked)
    if (!metaTags.lang) {
      const warningType = 'Missing language attribute on <html> tag';
      warningMessages.push(`   ⚠️  ${warningType}`);
      fileWarnings++;
      results.warningTypes.set(warningType, (results.warningTypes.get(warningType) || 0) + 1);
    }
    
    // Only show file header and details if there are issues or warnings
    if (fileIssues > 0 || fileWarnings > 0) {
      // Show header messages (always in verbose mode, only when issues in compact mode)
      const compact = process.env.TEST_COMPACT_MODE === 'true';
      if (!compact || (results.issues === 0 && results.warnings === 0)) {
        if (results.issues === 0 && results.warnings === 0) {
          console.log('🔍 Starting SEO and meta validation...\n');
          console.log(`Found ${htmlFiles.length} HTML files\n`);
        }
      }
      console.log(`📄 ${relativePath}:`);
      
      if (isRedirect) {
        console.log(`   ⏩ Redirect page - skipping SEO requirements`);
      }
      
      issueMessages.forEach(msg => console.log(msg));
      warningMessages.forEach(msg => console.log(msg));
    }
    results.issues += fileIssues;
    results.warnings += fileWarnings;
    if (fileIssues > 0) {
      results.filesWithIssues++;
    }
  }
  
  // Check if running in compact mode (group runs)
  const compact = process.env.TEST_COMPACT_MODE === 'true';
  
  // Summary - compact mode shows single line for passing, full for failing
  const totalIssues = results.issues + results.duplicateTitles.length;
  printSummary('SEO Validation', getTestEmoji('seo-meta'), [
    { label: 'Total files', value: results.total },
    { label: 'Issues', value: totalIssues },
    { label: 'Warnings', value: results.warnings }
  ], { 
    compact: compact,
    issueTypes: results.issueTypes,
    warningTypes: results.warningTypes
  });

  // Write summary file for test runner
  const fs = require('fs');
  // Custom exit logic: duplicate titles count as issues (totalIssues already calculated above)
  const summaryPath = path.join(__dirname, '.seo-meta-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({ 
    files: results.total, 
    issues: totalIssues, 
    warnings: results.warnings,
    filesWithIssues: results.filesWithIssues
  }), 'utf8');
  exitWithResults(totalIssues, results.warnings, {
    testType: 'SEO validation',
    successMessage: '\n🎉 All SEO validation passed!',
    compact: compact
  });
}

// Run validation
validateSEO();
