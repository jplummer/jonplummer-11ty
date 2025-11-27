#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { findMarkdownFiles } = require('../utils/file-utils');
const { parseFrontMatter, reconstructFile } = require('../utils/frontmatter-utils');
const { extractDescription } = require('./add-post-descriptions');

// Front matter parsing and reconstruction now use shared utilities

// Check if description starts with what looks like a heading word
function needsFix(description, content) {
  if (!description) return false;
  
  // Check if content starts with a heading
  const contentToUse = content.trim();
  const headingMatch = contentToUse.match(/^#{1,6}\s+([^\n]+)\n+/);
  if (!headingMatch) return false;
  
  const headingText = headingMatch[1].trim();
  // Check if description starts with the heading text
  if (description.startsWith(headingText)) {
    return true;
  }
  
  return false;
}

// Process a single post file
function processPostFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { frontMatter, content: body, error } = parseFrontMatter(content);
  
  if (error) {
    console.error(`  ⚠️  Error parsing frontmatter: ${error}`);
    return { updated: false, error };
  }
  
  if (!frontMatter) {
    return { updated: false, error: 'No frontmatter' };
  }
  
  // Skip if not a post
  if (!frontMatter.tags || !frontMatter.tags.includes('post')) {
    return { updated: false, skipped: true, reason: 'Not a post' };
  }
  
  // Check if description needs fixing
  if (!needsFix(frontMatter.description, body)) {
    return { updated: false, skipped: true, reason: 'Description looks fine' };
  }
  
  // Extract new description from content
  const newDescription = extractDescription(body);
  
  if (!newDescription || newDescription.length < 30) {
    console.warn(`  ⚠️  Could not extract meaningful description (${newDescription.length} chars)`);
    return { updated: false, error: 'Description too short' };
  }
  
  // Update description in frontmatter
  const oldDescription = frontMatter.description;
  frontMatter.description = newDescription;
  
  // Reconstruct file
  const newContent = reconstructFile(content, frontMatter, body, { quoteDescription: true });
  
  // Write back to file
  fs.writeFileSync(filePath, newContent, 'utf8');
  
  return { updated: true, oldDescription, newDescription };
}

// Main function
function main() {
  console.log('🔧 Fixing post descriptions with heading issues...\n');
  
  const postsDir = path.join(process.cwd(), '_posts');
  const postFiles = findMarkdownFiles(postsDir);
  
  console.log(`Found ${postFiles.length} markdown files\n`);
  
  const results = {
    updated: 0,
    skipped: 0,
    errors: 0
  };
  
  for (const file of postFiles) {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`Processing: ${relativePath}`);
    
    const result = processPostFile(file);
    
    if (result.updated) {
      console.log(`  ✅ Fixed description:`);
      console.log(`     Old: "${result.oldDescription.substring(0, 80)}..."`);
      console.log(`     New: "${result.newDescription.substring(0, 80)}..."`);
      results.updated++;
    } else if (result.skipped) {
      console.log(`  ⏭️  Skipped: ${result.reason}`);
      results.skipped++;
    } else if (result.error) {
      console.error(`  ❌ Error: ${result.error}`);
      results.errors++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Updated: ${results.updated}`);
  console.log(`   Skipped: ${results.skipped}`);
  console.log(`   Errors: ${results.errors}`);
  
  if (results.errors > 0) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { needsFix, processPostFile };

