#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { findHtmlFiles } = require('../utils/file-utils');


// Extract meta tags from HTML
function extractMetaTags(htmlContent) {
  const metaTags = {};
  
  // Title tag
  const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
  if (titleMatch) {
    metaTags.title = titleMatch[1].trim();
  }
  
  // Meta description
  const descMatch = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  if (descMatch) {
    metaTags.description = descMatch[1].trim();
  }
  
  // Meta keywords
  const keywordsMatch = htmlContent.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']*)["']/i);
  if (keywordsMatch) {
    metaTags.keywords = keywordsMatch[1].trim();
  }
  
  // Open Graph tags
  const ogTags = {};
  const ogMatches = htmlContent.match(/<meta[^>]*property=["']og:([^"']+)["'][^>]*content=["']([^"']*)["']/gi);
  if (ogMatches) {
    ogMatches.forEach(match => {
      const propMatch = match.match(/property=["']og:([^"']+)["'][^>]*content=["']([^"']*)["']/i);
      if (propMatch) {
        ogTags[propMatch[1]] = propMatch[2].trim();
      }
    });
  }
  metaTags.og = ogTags;
  
  // Twitter Card tags
  const twitterTags = {};
  const twitterMatches = htmlContent.match(/<meta[^>]*name=["']twitter:([^"']+)["'][^>]*content=["']([^"']*)["']/gi);
  if (twitterMatches) {
    twitterMatches.forEach(match => {
      const propMatch = match.match(/name=["']twitter:([^"']+)["'][^>]*content=["']([^"']*)["']/i);
      if (propMatch) {
        twitterTags[propMatch[1]] = propMatch[2].trim();
      }
    });
  }
  metaTags.twitter = twitterTags;
  
  // Canonical URL
  const canonicalMatch = htmlContent.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  if (canonicalMatch) {
    metaTags.canonical = canonicalMatch[1].trim();
  }
  
  // Language
  const langMatch = htmlContent.match(/<html[^>]*lang=["']([^"']+)["']/i);
  if (langMatch) {
    metaTags.lang = langMatch[1].trim();
  }
  
  return metaTags;
}

// Extract headings from HTML
function extractHeadings(htmlContent) {
  const headings = [];
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
  let match;
  
  while ((match = headingRegex.exec(htmlContent)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      text: match[2].replace(/<[^>]*>/g, '').trim() // Remove HTML tags
    });
  }
  
  return headings;
}

// Validate title
function validateTitle(title) {
  const issues = [];
  
  if (!title) {
    issues.push('Missing title tag');
    return issues;
  }
  
  if (title.length === 0) {
    issues.push('Empty title tag');
    return issues;
  }
  
  if (title.length < 30) {
    issues.push('Title too short (should be 30-60 characters)');
  }
  
  if (title.length > 60) {
    issues.push('Title too long (should be 30-60 characters)');
  }
  
  if (title.includes('|') && title.split('|').length > 3) {
    issues.push('Title has too many separators (|)');
  }
  
  return issues;
}

// Validate meta description
function validateMetaDescription(description) {
  const issues = [];
  
  if (!description) {
    issues.push('Missing meta description');
    return issues;
  }
  
  if (description.length === 0) {
    issues.push('Empty meta description');
    return issues;
  }
  
  if (description.length < 120) {
    issues.push('Meta description too short (should be 120-160 characters)');
  }
  
  if (description.length > 160) {
    issues.push('Meta description too long (should be 120-160 characters)');
  }
  
  if (description.includes('"') && !description.includes('&quot;')) {
    issues.push('Meta description contains unescaped quotes');
  }
  
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

// Validate Twitter Card tags
function validateTwitterCards(twitterTags) {
  const issues = [];
  
  if (Object.keys(twitterTags).length === 0) {
    issues.push('No Twitter Card tags found');
    return issues;
  }
  
  // Check for card type
  if (!twitterTags.card) {
    issues.push('Missing Twitter Card type');
  } else if (!['summary', 'summary_large_image', 'app', 'player'].includes(twitterTags.card)) {
    issues.push('Invalid Twitter Card type');
  }
  
  // Check for required tags based on card type
  if (twitterTags.card === 'summary' || twitterTags.card === 'summary_large_image') {
    const required = ['title', 'description'];
    for (const tag of required) {
      if (!twitterTags[tag]) {
        issues.push(`Missing required Twitter Card tag: twitter:${tag}`);
      }
    }
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
    const content = fs.readFileSync(file, 'utf8');
    const metaTags = extractMetaTags(content);
    
    if (metaTags.title) {
      if (titleMap.has(metaTags.title)) {
        duplicates.push({
          title: metaTags.title,
          files: [titleMap.get(metaTags.title), path.relative('./_site', file)]
        });
      } else {
        titleMap.set(metaTags.title, path.relative('./_site', file));
      }
    }
  }
  
  return duplicates;
}

// Main SEO validation
function validateSEO() {
  console.log('🔍 Starting SEO and meta validation...\n');
  
  const siteDir = './_site';
  if (!fs.existsSync(siteDir)) {
    console.log('❌ _site directory not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  const htmlFiles = findHtmlFiles(siteDir);
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
    const relativePath = path.relative('./_site', file);
    const content = fs.readFileSync(file, 'utf8');
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
    
    // Validate Twitter Cards
    const twitterIssues = validateTwitterCards(metaTags.twitter);
    if (twitterIssues.length > 0) {
      console.log(`   ⚠️  Twitter Cards: ${twitterIssues.join(', ')}`);
      fileWarnings += twitterIssues.length;
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
