#!/usr/bin/env node
/**
 * Test script to verify permalink compatibility
 * Compares current permalink logic vs proposed timezone-aware logic
 */

const { DateTime } = require('luxon');
const fs = require('fs');
const path = require('path');

// Current permalink logic (from _posts.11tydata.js)
function currentPermalink(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `/${year}/${month}/${day}/`;
}

// Proposed timezone-aware permalink logic
function proposedPermalink(dateString) {
  // Parse with Luxon, preserving timezone from string
  const dt = DateTime.fromISO(dateString);
  if (!dt.isValid) {
    // Fallback for edge cases
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `/${year}/${month}/${day}/`;
  }
  
  // Extract date components from the timezone-aware DateTime
  const year = dt.year;
  const month = String(dt.month).padStart(2, '0');
  const day = String(dt.day).padStart(2, '0');
  return `/${year}/${month}/${day}/`;
}

// Find all post files
const postsDir = path.join(__dirname, 'src', '_posts');
const postFiles = [];

function findPostFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findPostFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      postFiles.push(fullPath);
    }
  }
}

findPostFiles(postsDir);

// Extract dates from post files
const postDates = [];
for (const filePath of postFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  const frontmatterMatch = content.match(/^date:\s*(.+)$/m);
  if (frontmatterMatch) {
    const dateValue = frontmatterMatch[1].trim().replace(/^["']|["']$/g, '');
    const slug = path.basename(filePath, '.md');
    postDates.push({ date: dateValue, slug, filePath });
  }
}

// Test each date
console.log('Testing permalink compatibility...\n');
console.log(`Found ${postDates.length} posts\n`);

let mismatches = 0;
let matches = 0;
const mismatchDetails = [];

for (const { date, slug, filePath } of postDates) {
  const current = currentPermalink(date);
  const proposed = proposedPermalink(date);
  
  if (current !== proposed) {
    mismatches++;
    mismatchDetails.push({
      file: path.relative(__dirname, filePath),
      date,
      current,
      proposed
    });
  } else {
    matches++;
  }
}

// Report results
console.log(`✅ Matches: ${matches}`);
console.log(`❌ Mismatches: ${mismatches}\n`);

if (mismatches > 0) {
  console.log('MISMATCH DETAILS:');
  console.log('='.repeat(80));
  for (const detail of mismatchDetails) {
    console.log(`\nFile: ${detail.file}`);
    console.log(`  Date: ${detail.date}`);
    console.log(`  Current URL: ${detail.current}${path.basename(detail.file, '.md')}/`);
    console.log(`  Proposed URL: ${detail.proposed}${path.basename(detail.file, '.md')}/`);
  }
  console.log('\n' + '='.repeat(80));
  process.exit(1);
} else {
  console.log('✅ All permalinks are compatible! No URL changes detected.');
  process.exit(0);
}
