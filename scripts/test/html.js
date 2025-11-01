#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { findHtmlFiles } = require('../utils/file-utils');


// HTML validity validation
// Focuses on HTML structure, syntax, and validity
// SEO, accessibility, and performance checks are handled by specialized test scripts
function validateHtml(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  const warnings = [];
  
  // Basic structure validation
  if (!content.includes('<!DOCTYPE html>')) {
    issues.push('Missing DOCTYPE declaration');
  }
  
  if (!content.includes('<html')) {
    issues.push('Missing <html> tag');
  }
  
  if (!content.includes('<head>')) {
    issues.push('Missing <head> tag');
  }
  
  if (!content.includes('<body>')) {
    issues.push('Missing <body> tag');
  }
  
  // Basic title presence check (SEO details handled by test-seo-meta.js)
  const titleMatch = content.match(/<title>(.*?)<\/title>/i);
  if (!titleMatch) {
    issues.push('Missing <title> tag');
  } else if (titleMatch[1].trim().length === 0) {
    issues.push('Empty <title> tag');
  }
  
  // Empty attribute validation (basic HTML validity)
  const images = content.match(/<img[^>]*>/gi) || [];
  images.forEach((img, index) => {
    if (img.includes('src=""') || img.includes("src=''")) {
      issues.push(`Image ${index + 1} has empty src attribute`);
    }
  });
  
  const links = content.match(/<a[^>]*>/gi) || [];
  links.forEach((link, index) => {
    if (link.includes('href=""') || link.includes("href=''")) {
      issues.push(`Link ${index + 1} has empty href attribute`);
    }
  });
  
  // Code quality checks (validity/style concerns)
  if (content.includes('&nbsp;')) {
    warnings.push('Contains &nbsp; entities (consider using CSS spacing)');
  }
  
  if (content.includes('style=')) {
    warnings.push('Contains inline styles (consider moving to CSS)');
  }
  
  // Check for common HTML5 issues
  if (content.includes('<br>') && !content.includes('<br/>')) {
    issues.push('Contains unclosed <br> tags');
  }
  
  if (content.includes('<hr>') && !content.includes('<hr/>')) {
    issues.push('Contains unclosed <hr> tags');
  }
  
  // Check for deprecated elements
  const deprecatedElements = ['<center>', '<font>', '<marquee>', '<blink>'];
  deprecatedElements.forEach(element => {
    if (content.includes(element)) {
      issues.push(`Contains deprecated element: ${element}`);
    }
  });
  
  return { issues, warnings };
}

// Main validation
console.log('🔍 Starting HTML validity validation...\n');

const siteDir = './_site';
if (!fs.existsSync(siteDir)) {
  console.log('❌ _site directory not found. Run "npm run build" first.');
  process.exit(1);
}

const htmlFiles = findHtmlFiles(siteDir);
console.log(`Found ${htmlFiles.length} HTML files\n`);

let totalIssues = 0;
let totalWarnings = 0;

for (const file of htmlFiles) {
  const relativePath = path.relative('./_site', file);
  const { issues, warnings } = validateHtml(file);
  
  if (issues.length > 0 || warnings.length > 0) {
    console.log(`📄 ${relativePath}:`);
    
    if (issues.length > 0) {
      console.log('   ❌ Issues:');
      issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
    if (warnings.length > 0) {
      console.log('   ⚠️  Warnings:');
      warnings.forEach(warning => console.log(`      - ${warning}`));
    }
    
    console.log('');
    totalIssues += issues.length;
    totalWarnings += warnings.length;
  } else {
    console.log(`✅ ${relativePath}`);
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Issues: ${totalIssues}`);
console.log(`   Warnings: ${totalWarnings}`);
console.log(`   Files checked: ${htmlFiles.length}`);

if (totalIssues === 0 && totalWarnings === 0) {
  console.log('\n🎉 All HTML files passed validation!');
} else if (totalIssues === 0) {
  console.log('\n✅ No critical issues found, but consider addressing warnings.');
  process.exit(0);
} else {
  console.log('\n❌ Critical issues found that should be addressed.');
  process.exit(1);
}

