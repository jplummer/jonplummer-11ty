#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Find all markdown files in _posts
function findMarkdownFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath));
    } else if (item.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Parse front matter from markdown file
function parseFrontMatter(content) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    return { frontMatter: null, content: content };
  }
  
  try {
    const frontMatter = yaml.load(match[1]);
    return { frontMatter, content: match[2] };
  } catch (error) {
    return { frontMatter: null, content: content, error: error.message };
  }
}

// Check if the generated URL matches the expected URL
function checkUrlMismatch(filePath, frontMatter) {
  if (!frontMatter || !frontMatter.date) {
    return null;
  }
  
  // Parse the date string to avoid timezone issues
  const dateStr = frontMatter.date;
  let expectedYear, expectedMonth, expectedDay;
  
  if (typeof dateStr === 'string') {
    // Handle YYYY-MM-DD format
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = dateStr.split('-');
      expectedYear = parts[0];
      expectedMonth = parts[1];
      expectedDay = parts[2];
    } else {
      // Fallback to Date parsing
      const date = new Date(dateStr);
      expectedYear = date.getFullYear();
      expectedMonth = String(date.getMonth() + 1).padStart(2, '0');
      expectedDay = String(date.getDate()).padStart(2, '0');
    }
  } else if (dateStr instanceof Date) {
    expectedYear = dateStr.getFullYear();
    expectedMonth = String(dateStr.getMonth() + 1).padStart(2, '0');
    expectedDay = String(dateStr.getDate()).padStart(2, '0');
  } else {
    return null;
  }
  
  // Get the actual directory structure
  const relativePath = path.relative('./_posts', filePath);
  const pathParts = relativePath.split('/');
  
  if (pathParts.length >= 4) {
    const actualYear = pathParts[0];
    const actualMonth = pathParts[1];
    const actualDay = pathParts[2];
    
    const expectedUrl = `/${expectedYear}/${expectedMonth}/${expectedDay}/`;
    const actualUrl = `/${actualYear}/${actualMonth}/${actualDay}/`;
    
    if (expectedUrl !== actualUrl) {
      return {
        expected: expectedUrl,
        actual: actualUrl,
        frontMatterDate: frontMatter.date,
        expectedYear,
        expectedMonth,
        expectedDay,
        actualYear,
        actualMonth,
        actualDay,
        filePath: relativePath
      };
    }
  }
  
  return null;
}

// Main function
function findDateMismatches() {
  console.log('🔍 Checking for date mismatches between front matter and file paths...\n');
  
  const postsDir = './_posts';
  if (!fs.existsSync(postsDir)) {
    console.log('❌ _posts directory not found');
    process.exit(1);
  }
  
  const markdownFiles = findMarkdownFiles(postsDir);
  console.log(`Found ${markdownFiles.length} markdown files\n`);
  
  const mismatches = [];
  
  for (const file of markdownFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const { frontMatter, error } = parseFrontMatter(content);
    
    if (error) {
      console.log(`⚠️  Error parsing front matter in ${path.relative('./_posts', file)}: ${error}`);
      continue;
    }
    
    if (!frontMatter) {
      continue;
    }
    
    const mismatch = checkUrlMismatch(file, frontMatter);
    if (mismatch) {
      mismatches.push(mismatch);
    }
  }
  
  if (mismatches.length === 0) {
    console.log('✅ No date mismatches found!');
    return;
  }
  
  console.log(`❌ Found ${mismatches.length} date mismatches:\n`);
  
  mismatches.forEach((mismatch, index) => {
    console.log(`${index + 1}. ${mismatch.filePath}`);
    console.log(`   Front matter date: ${mismatch.frontMatterDate}`);
    console.log(`   Expected URL: ${mismatch.expected}`);
    console.log(`   Actual URL: ${mismatch.actual}`);
    console.log(`   Expected: ${mismatch.expectedYear}-${mismatch.expectedMonth}-${mismatch.expectedDay}`);
    console.log(`   Actual: ${mismatch.actualYear}-${mismatch.actualMonth}-${mismatch.actualDay}`);
    console.log('');
  });
  
  console.log('💡 To fix these mismatches, you can either:');
  console.log('   1. Update the front matter dates to match the desired URLs');
  console.log('   2. Update the internal links to use the actual generated URLs');
  console.log('   3. Check your 11ty timezone configuration');
  console.log('   4. Use explicit timezone in front matter (e.g., "2025-07-27T12:00:00-07:00")');
}

// Run the check
findDateMismatches();