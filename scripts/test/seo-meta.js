#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { extractMetaTags, extractHeadings, parseHtml } = require('../utils/html-utils');
const { validateTitle: validateTitleUtil, validateMetaDescription: validateMetaDescriptionUtil } = require('../utils/validation-utils');
const { checkSiteDirectory, getHtmlFiles, getRelativePath, readFile } = require('../utils/test-base');
const { createTestResult, addFile, addIssue, addWarning, addGlobalIssue, outputResult } = require('../utils/test-result-builder');
const { formatVerbose } = require('../utils/test-formatter');

// Get changed files since last commit
function getChangedFiles() {
  try {
    const output = execSync('git diff --name-only --diff-filter=ACMR HEAD', {
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    return output.trim().split('\n').filter(line => line.trim());
  } catch (error) {
    return [];
  }
}

// Check if any markdown files changed (links.yaml changes don't affect page SEO)
function hasMarkdownFilesChanged() {
  const changedFiles = getChangedFiles();
  return changedFiles.some(file => {
    const ext = path.extname(file).toLowerCase();
    return ext === '.md' && file.startsWith('src/');
  });
}

// Get changed markdown files as absolute paths
function getChangedMarkdownFiles() {
  const changedFiles = getChangedFiles();
  return changedFiles
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ext === '.md' && file.startsWith('src/');
    })
    .map(file => path.resolve(process.cwd(), file))
    .filter(file => fs.existsSync(file));
}

// Try to find source file for a generated HTML path
function findSourceFile(relativePath) {
  const srcDir = path.join(process.cwd(), 'src');
  const normalizedPath = relativePath.replace(/\\/g, '/');
  
  // Try common patterns:
  // 1. Direct match: about.html -> src/about.md or src/about.njk
  // 2. Index files: page/1/index.html -> src/index.njk (paginated)
  // 3. Post files: 2025/01/15/post-slug/index.html -> src/_posts/2025/01/15/post-slug.md
  // 4. Permalink files: og-image-preview/index.html -> src/og-image-preview.njk
  
  // Remove index.html and trailing slash
  let searchPath = normalizedPath.replace(/\/index\.html$/, '').replace(/^\/+/, '');
  
  // Try .md first, then .njk
  const extensions = ['.md', '.njk'];
  for (const ext of extensions) {
    const filePath = path.join(srcDir, searchPath + ext);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  
  // Try with index.html removed but keep directory
  if (normalizedPath.endsWith('/index.html')) {
    const dirPath = normalizedPath.replace(/\/index\.html$/, '');
    for (const ext of extensions) {
      const filePath = path.join(srcDir, dirPath + ext);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
  }
  
  // For permalink files that create subdirectories (e.g., og-image-preview/index.html -> og-image-preview.njk)
  // Extract the directory name and try it as a filename
  if (normalizedPath.includes('/') && normalizedPath.endsWith('/index.html')) {
    const dirName = normalizedPath.split('/')[0];
    for (const ext of extensions) {
      const filePath = path.join(srcDir, dirName + ext);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
  }
  
  // For paginated pages, check if it's from index.njk
  if (normalizedPath.match(/^page\/\d+\/index\.html$/)) {
    const indexPath = path.join(srcDir, 'index.njk');
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }
  
  // Root index
  if (normalizedPath === 'index.html') {
    const indexPath = path.join(srcDir, 'index.njk');
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }
  
  return null;
}

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

// Titles to exclude from "too short" validation
const EXCLUDED_SHORT_TITLES = [
  '/about',
  '/changelog',
  '/now',
  'Goal Manager identity (2001)',
  'CareLink Pro main interface',
  'Linksys app revitalization',
  'Velop whole-home WiFi system'
];

// Validate title (adapts validation-utils format to array of issues)
function validateTitle(title) {
  const issues = [];
  
  if (!title) {
    issues.push('Missing title tag');
    return issues;
  }
  
  // Use default relaxed limits from validation-utils (10-200 characters, warnings only, not errors)
  const result = validateTitleUtil(title);
  if (!result.valid) {
    // Skip "too short" warning for excluded titles
    if (result.error && result.error.includes('too short') && EXCLUDED_SHORT_TITLES.includes(title)) {
      // Don't add the "too short" issue for excluded titles
    } else {
      issues.push(result.error);
    }
  }
  
  // Additional check for separators
  if (title.includes('|') && title.split('|').length > 3) {
    issues.push('Title has too many separators (|)');
  }
  
  return issues;
}

// Validate meta description (adapts validation-utils format to array of issues)
// Uses relaxed limits (20-300 characters) - warnings only, not errors
function validateMetaDescription(description) {
  const issues = [];
  
  if (!description) {
    // Missing description is ERROR here (not WARNING) because:
    // - This is final output validation - critical for SEO
    // - frontmatter.js already warned about this in source
    // - Missing meta description significantly impacts SEO
    issues.push('Missing meta description');
    return issues;
  }
  
  // Use default relaxed limits from validation-utils (20-300 characters, warnings only, not errors)
  const result = validateMetaDescriptionUtil(description);
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
  // Check if --changed flag is provided
  const args = process.argv.slice(2);
  const useChanged = args.includes('--changed');
  
  // If --changed flag, only check if markdown files changed
  // links.yaml changes don't affect page SEO metadata, so skip if only links.yaml changed
  if (useChanged && !hasMarkdownFilesChanged()) {
    console.log('✅ No markdown files changed for SEO check (links.yaml changes don\'t affect page SEO)');
    const result = createTestResult('seo-meta', 'SEO Validation');
    const isDirectRun = !process.env.TEST_RUNNER;
    if (isDirectRun) {
      const formatted = formatVerbose(result, {});
      console.log(formatted);
    } else {
      outputResult(result);
    }
    process.exit(0);
  }
  
  checkSiteDirectory();
  let htmlFiles = getHtmlFiles();
  
  // Filter HTML files to only those whose source files changed (when using --changed flag)
  if (useChanged) {
    const changedMarkdownFiles = getChangedMarkdownFiles();
    const changedMarkdownFilesSet = new Set(changedMarkdownFiles);
    
    htmlFiles = htmlFiles.filter(htmlFile => {
      const relativePath = getRelativePath(htmlFile);
      const sourceFile = findSourceFile(relativePath);
      
      // Only include files whose source files we can find AND are in the changed files list
      // If we can't find the source file, exclude it (we don't know if it changed)
      return sourceFile && changedMarkdownFilesSet.has(sourceFile);
    });
    
    if (htmlFiles.length === 0) {
      console.log('✅ No HTML files to check (no rendered files correspond to changed markdown files)');
      const result = createTestResult('seo-meta', 'SEO Validation');
      const isDirectRun = !process.env.TEST_RUNNER;
      if (isDirectRun) {
        const formatted = formatVerbose(result, {});
        console.log(formatted);
      } else {
        outputResult(result);
      }
      process.exit(0);
    }
  }
  
  // Create test result using result builder
  const result = createTestResult('seo-meta', 'SEO Validation');
  
  // Check for duplicate titles (only among files being checked)
  const duplicateTitles = checkDuplicateTitles(htmlFiles);
  duplicateTitles.forEach(dup => {
    addGlobalIssue(result, {
      type: 'duplicate-title',
      message: `Duplicate title "${dup.title}"`,
      files: dup.files
    });
  });
  
  // Validate each file
  for (const file of htmlFiles) {
    const relativePath = getRelativePath(file);
    const content = readFile(file);
    const metaTags = extractMetaTags(content);
    const headings = extractHeadings(content);
    const isRedirect = isRedirectPage(content);
    
    // Identify utility and pagination pages (skip SEO checks for these)
    const isUtilityPage = relativePath.includes('og-image-preview') || 
                          relativePath.includes('color-test') ||
                          relativePath === '404.html' ||
                          relativePath === '500.html';
    const isPaginationPage = relativePath.match(/^page\/\d+\//) || relativePath.startsWith('page/');
    
    // Add file to result
    const fileObj = addFile(result, file, relativePath);
    
    // Basic title check (always required, but length validation skipped for redirects)
    if (!metaTags.title) {
      addIssue(fileObj, {
        type: 'title-missing',
        message: 'Missing title tag'
      });
    } else if (!isRedirect && !isPaginationPage && !isUtilityPage) {
      // Full title validation only for non-redirect, non-pagination, non-utility pages
      const titleIssues = validateTitle(metaTags.title);
      titleIssues.forEach(issue => {
        // Length issues are warnings, missing title is already handled above as error
        if (issue.includes('too short') || issue.includes('too long') || issue.includes('separators')) {
          addWarning(fileObj, {
            type: 'title-length',
            message: issue
          });
        } else {
          addIssue(fileObj, {
            type: 'title-validation',
            message: issue
          });
        }
      });
    }
    
    // Meta description validation (skipped for redirects, pagination, and utility pages)
    if (!isRedirect && !isPaginationPage && !isUtilityPage) {
      const descIssues = validateMetaDescription(metaTags.description);
      
      // Check for unescaped quotes in raw HTML
      const rawDescMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
      if (rawDescMatch && rawDescMatch[1]) {
        const rawDesc = rawDescMatch[1];
        if (rawDesc.includes('"') && !rawDesc.includes('&quot;') && !rawDesc.includes('&#34;')) {
          descIssues.push('Meta description contains unescaped quotes');
        }
      }
      
      descIssues.forEach(issue => {
        // Length issues are warnings, missing/unescaped are errors
        if (issue.includes('too short') || issue.includes('too long')) {
          addWarning(fileObj, {
            type: 'meta-description-length',
            message: issue
          });
        } else {
          addIssue(fileObj, {
            type: 'meta-description',
            message: issue
          });
        }
      });
    }
    
    // Open Graph validation (skipped for redirects, pagination, and utility pages)
    if (!isRedirect && !isPaginationPage && !isUtilityPage) {
      const ogIssues = validateOpenGraph(metaTags.og);
      ogIssues.forEach(issue => {
        addWarning(fileObj, {
          type: 'open-graph',
          message: issue
        });
      });
    }
    
    // Heading validation (skipped for redirects and utility pages)
    if (!isRedirect && !isUtilityPage) {
      const headingIssues = validateHeadings(headings);
      headingIssues.forEach(issue => {
        addIssue(fileObj, {
          type: 'headings',
          message: issue
        });
      });
    }
    
    // Check for missing canonical URL (always checked)
    if (!metaTags.canonical) {
      addWarning(fileObj, {
        type: 'canonical-missing',
        message: 'Missing canonical URL'
      });
    }
    
    // Check for missing language attribute (always checked)
    if (!metaTags.lang) {
      addWarning(fileObj, {
        type: 'lang-missing',
        message: 'Missing language attribute on <html> tag'
      });
    }
  }
  
  // Check if we're being run directly (not through test-runner)
  const isDirectRun = !process.env.TEST_RUNNER;
  
  if (isDirectRun) {
    // Format and display output directly
    const formatted = formatVerbose(result, {});
    console.log(formatted);
    process.exit(result.summary.issues > 0 ? 1 : 0);
  } else {
    // Output JSON result (test-runner will handle display)
    outputResult(result);
    process.exit(result.summary.issues > 0 ? 1 : 0);
  }
}

// Run validation
validateSEO();
