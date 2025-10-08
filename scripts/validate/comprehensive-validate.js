#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all HTML files
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

// Comprehensive HTML validation
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
  
  // Title validation
  const titleMatch = content.match(/<title>(.*?)<\/title>/i);
  if (!titleMatch) {
    issues.push('Missing <title> tag');
  } else if (titleMatch[1].trim().length === 0) {
    issues.push('Empty <title> tag');
  } else if (titleMatch[1].length > 60) {
    warnings.push('Title is longer than 60 characters (SEO concern)');
  }
  
  // Meta description validation
  const metaDescMatch = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  if (!metaDescMatch) {
    warnings.push('Missing meta description');
  } else if (metaDescMatch[1].length > 160) {
    warnings.push('Meta description is longer than 160 characters');
  }
  
  // Image validation
  const images = content.match(/<img[^>]*>/gi) || [];
  images.forEach((img, index) => {
    if (!img.includes('alt=')) {
      issues.push(`Image ${index + 1} missing alt attribute`);
    }
    if (img.includes('src=""') || img.includes("src=''")) {
      issues.push(`Image ${index + 1} has empty src attribute`);
    }
  });
  
  // Link validation
  const links = content.match(/<a[^>]*>/gi) || [];
  links.forEach((link, index) => {
    if (link.includes('href=""') || link.includes("href=''")) {
      issues.push(`Link ${index + 1} has empty href attribute`);
    }
    if (link.includes('href="#') && !link.includes('href="#"')) {
      warnings.push(`Link ${index + 1} may have broken anchor link`);
    }
  });
  
  // Heading structure validation
  const headings = content.match(/<h[1-6][^>]*>/gi) || [];
  let h1Count = 0;
  headings.forEach(heading => {
    if (heading.includes('<h1')) h1Count++;
  });
  
  if (h1Count === 0) {
    warnings.push('No H1 heading found');
  } else if (h1Count > 1) {
    warnings.push('Multiple H1 headings found (should typically be only one)');
  }
  
  // Accessibility checks
  if (content.includes('onclick=') && !content.includes('onkeypress=')) {
    warnings.push('onclick without onkeypress (accessibility concern)');
  }
  
  // Performance checks
  if (content.includes('<script') && !content.includes('async') && !content.includes('defer')) {
    warnings.push('Scripts without async/defer may block rendering');
  }
  
  // Code quality checks
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
console.log('🔍 Comprehensive HTML validation starting...\n');

const htmlFiles = findHtmlFiles('./_site');
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
  console.log('\n🎉 All HTML files passed comprehensive validation!');
} else if (totalIssues === 0) {
  console.log('\n✅ No critical issues found, but consider addressing warnings.');
} else {
  console.log('\n❌ Critical issues found that should be addressed.');
}
