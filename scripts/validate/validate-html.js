#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { findHtmlFiles } = require('../utils/file-utils');


// Basic HTML validation checks
function validateHtml(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check for basic HTML structure
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
  
  // Check for unclosed tags (basic check)
  const openTags = content.match(/<[^/][^>]*>/g) || [];
  const closeTags = content.match(/<\/[^>]*>/g) || [];
  const selfClosing = content.match(/<[^>]*\/>/g) || [];
  
  // Check for common issues
  if (content.includes('&nbsp;')) {
    issues.push('Contains &nbsp; entities (consider using CSS spacing)');
  }
  
  if (content.includes('style=')) {
    issues.push('Contains inline styles (consider moving to CSS)');
  }
  
  if (content.includes('<br>') && !content.includes('<br/>')) {
    issues.push('Contains unclosed <br> tags');
  }
  
  return issues;
}

// Main validation
console.log('🔍 Validating HTML files in _site directory...\n');

const htmlFiles = findHtmlFiles('./_site');
let totalIssues = 0;
let filesWithIssues = 0;

for (const file of htmlFiles) {
  const relativePath = path.relative('./_site', file);
  const issues = validateHtml(file);
  
  if (issues.length > 0) {
    console.log(`❌ ${relativePath}:`);
    issues.forEach(issue => console.log(`   - ${issue}`));
    console.log('');
    totalIssues += issues.length;
    filesWithIssues++;
  }
}

console.log(`\n📊 Summary: ${totalIssues} issues found in ${filesWithIssues} of ${htmlFiles.length} files`);

if (totalIssues === 0) {
  console.log('🎉 All HTML files passed basic validation!');
} else {
  console.log('⚠️  Some issues found. Consider using W3C validator for detailed analysis.');
}
