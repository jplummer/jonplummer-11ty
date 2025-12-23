#!/usr/bin/env node
/**
 * Quick script to check RSS feed dates for common issues
 * 
 * Checks for:
 * - Empty or missing dates
 * - Invalid date formats
 * - Dates that don't parse correctly
 * - Suspicious dates (wrong years, etc.)
 */

const fs = require('fs');
const path = require('path');

const FEED_FILES = [
  '_site/feed.xml',
  '_site/links-feed.xml'
];

function checkFeedDates(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${filePath} not found`);
    return { issues: [], totalDates: 0 };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  const dates = [];
  
  // Extract all pubDate elements
  const pubDateMatches = content.matchAll(/<pubDate>([^<]*)<\/pubDate>/g);
  for (const match of pubDateMatches) {
    const dateStr = match[1].trim();
    dates.push(dateStr);
    
    // Check for empty dates
    if (!dateStr || dateStr === '') {
      issues.push(`Empty pubDate found`);
      continue;
    }
    
    // Try to parse the date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      issues.push(`Invalid date format: "${dateStr}"`);
      continue;
    }
    
    // Check for suspicious years (before 2000 or way in future)
    const year = date.getFullYear();
    if (year < 2000) {
      issues.push(`Suspiciously old date: "${dateStr}" (year ${year})`);
    }
    if (year > 2030) {
      issues.push(`Suspiciously future date: "${dateStr}" (year ${year})`);
    }
  }
  
  // Check lastBuildDate
  const lastBuildMatch = content.match(/<lastBuildDate>([^<]*)<\/lastBuildDate>/);
  if (lastBuildMatch) {
    const dateStr = lastBuildMatch[1].trim();
    if (!dateStr || dateStr === '') {
      issues.push('Empty lastBuildDate');
    } else {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        issues.push(`Invalid lastBuildDate format: "${dateStr}"`);
      }
    }
  } else {
    issues.push('Missing lastBuildDate');
  }
  
  return { issues, totalDates: dates.length, dates };
}

// Main check
console.log('🔍 Checking RSS feed dates...\n');

let totalIssues = 0;
let allGood = true;

for (const feedFile of FEED_FILES) {
  const relativePath = path.relative(process.cwd(), feedFile);
  console.log(`Checking ${relativePath}...`);
  
  const result = checkFeedDates(feedFile);
  
  if (result.issues.length > 0) {
    allGood = false;
    console.log(`  ❌ Found ${result.issues.length} issue(s):`);
    result.issues.forEach(issue => {
      console.log(`     - ${issue}`);
    });
  } else {
    console.log(`  ✅ All dates look good (${result.totalDates} dates found)`);
  }
  
  // Show sample dates
  if (result.dates.length > 0) {
    console.log(`  Sample dates:`);
    result.dates.slice(0, 3).forEach((date, i) => {
      console.log(`     ${i + 1}. ${date}`);
    });
  }
  
  console.log();
  totalIssues += result.issues.length;
}

// Summary
if (allGood) {
  console.log('✅ All feed dates are valid!');
  process.exit(0);
} else {
  console.log(`❌ Found ${totalIssues} issue(s) total`);
  console.log('\n💡 Tips:');
  console.log('   - Check that date parsing is working correctly');
  console.log('   - Verify frontmatter dates are in correct format');
  console.log('   - Ensure dateToRfc3339 filter is handling DateTime objects');
  process.exit(1);
}

