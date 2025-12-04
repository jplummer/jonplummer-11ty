#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseFrontMatter, reconstructFile } = require('../utils/frontmatter-utils');
const { extractDescription } = require('./add-post-descriptions');
const { getPostFiles, isPost, processFiles } = require('../utils/content-utils');
const { printSummary, exitWithResults } = require('../utils/reporting-utils');

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
  if (!isPost(frontMatter)) {
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
  
  const postFiles = getPostFiles();
  console.log(`Found ${postFiles.length} markdown files\n`);
  
  const results = processFiles(postFiles, processPostFile, {
    onFileStart: (file) => {
      const relativePath = path.relative(process.cwd(), file);
      console.log(`Processing: ${relativePath}`);
    },
    onResult: (file, result) => {
      if (result.updated) {
        console.log(`  ✅ Fixed description:`);
        console.log(`     Old: "${result.oldDescription.substring(0, 80)}..."`);
        console.log(`     New: "${result.newDescription.substring(0, 80)}..."`);
      } else if (result.skipped) {
        console.log(`  ⏭️  Skipped: ${result.reason}`);
      } else if (result.error) {
        console.error(`  ❌ Error: ${result.error}`);
      }
    }
  });
  
  printSummary('Fix Post Descriptions', '📊', results);
  exitWithResults(results, 0, {
    testType: 'Fix Post Descriptions',
    issueMessage: '\n❌ Errors occurred during processing.',
    successMessage: '\n✅ Processing completed successfully.'
  });
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { needsFix, processPostFile };

