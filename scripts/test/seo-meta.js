#!/usr/bin/env node

const path = require('path');
const { extractMetaTags, extractHeadings } = require('./utils/html-utils');
const { validateTitle: validateTitleUtil, validateMetaDescription: validateMetaDescriptionUtil } = require('./utils/validation-utils');
const { checkSiteDirectory, getHtmlFiles, getRelativePath, readFile } = require('./utils/test-base');

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
function validateMetaDescription(description) {
  const issues = [];
  
  if (!description) {
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
  console.log('🔍 Starting SEO and meta validation...\n');
  
  checkSiteDirectory();
  const htmlFiles = getHtmlFiles();
  console.log(`Found ${htmlFiles.length} HTML files\n`);
  
  const results = {
    total: htmlFiles.length,
    issues: 0,
    warnings: 0,
    duplicateTitles: []
  };
  
  // Check for duplicate titles
  const duplicateTitles = checkDuplicateTitles(htmlFiles);
  if (duplicateTitles.length > 0) {
    console.log('🔄 Duplicate Titles:');
    duplicateTitles.forEach(dup => {
      console.log(`   ❌ "${dup.title}" in:`);
      dup.files.forEach(file => console.log(`      - ${file}`));
    });
    console.log('');
    results.duplicateTitles = duplicateTitles;
  }
  
  // Validate each file
  for (const file of htmlFiles) {
    const relativePath = getRelativePath(file);
    const content = readFile(file);
    const metaTags = extractMetaTags(content);
    const headings = extractHeadings(content);
    
    console.log(`📄 ${relativePath}:`);
    
    let fileIssues = 0;
    let fileWarnings = 0;
    
    // Validate title
    const titleIssues = validateTitle(metaTags.title);
    if (titleIssues.length > 0) {
      console.log(`   ❌ Title: ${titleIssues.join(', ')}`);
      fileIssues += titleIssues.length;
    }
    
    // Validate meta description
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
      console.log(`   ❌ Meta Description: ${descIssues.join(', ')}`);
      fileIssues += descIssues.length;
    }
    
    // Validate Open Graph
    const ogIssues = validateOpenGraph(metaTags.og);
    if (ogIssues.length > 0) {
      console.log(`   ⚠️  Open Graph: ${ogIssues.join(', ')}`);
      fileWarnings += ogIssues.length;
    }
    
    // Validate headings
    const headingIssues = validateHeadings(headings);
    if (headingIssues.length > 0) {
      console.log(`   ❌ Headings: ${headingIssues.join(', ')}`);
      fileIssues += headingIssues.length;
    }
    
    // Check for missing canonical URL
    if (!metaTags.canonical) {
      console.log(`   ⚠️  Missing canonical URL`);
      fileWarnings++;
    }
    
    // Check for missing language attribute
    if (!metaTags.lang) {
      console.log(`   ⚠️  Missing language attribute on <html> tag`);
      fileWarnings++;
    }
    
    if (fileIssues === 0 && fileWarnings === 0) {
      console.log(`   ✅ All SEO checks passed`);
    }
    
    console.log('');
    results.issues += fileIssues;
    results.warnings += fileWarnings;
  }
  
  // Summary
  console.log('📊 SEO Validation Summary:');
  console.log(`   Total files: ${results.total}`);
  console.log(`   Issues: ${results.issues}`);
  console.log(`   Warnings: ${results.warnings}`);
  console.log(`   Duplicate titles: ${results.duplicateTitles.length}`);
  
  if (results.issues > 0 || results.duplicateTitles.length > 0) {
    console.log('\n❌ SEO issues found that need attention.');
    process.exit(1);
  } else if (results.warnings > 0) {
    console.log('\n⚠️  No critical issues, but consider addressing warnings.');
  } else {
    console.log('\n🎉 All SEO validation passed!');
  }
}

// Run validation
validateSEO();
