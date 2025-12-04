#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseFrontMatter, reconstructFile } = require('../utils/frontmatter-utils');
const { getPostFiles, isPost, processFiles } = require('../utils/content-utils');
const { printSummary, exitWithResults } = require('../utils/reporting-utils');

// Front matter parsing and reconstruction now use shared utilities

// Check if description needs quoting
function needsQuoting(description) {
  if (!description || typeof description !== 'string') return false;
  
  // Check if it's already quoted in the file (we'll check the raw content)
  return true; // We'll check the actual file content
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
  
  // Skip if no description
  if (!frontMatter.description) {
    return { updated: false, skipped: true, reason: 'No description' };
  }
  
  // Check if description is already quoted in the original file
  const descriptionLine = content.match(/^description:\s*(.+)$/m);
  if (descriptionLine) {
    const value = descriptionLine[1].trim();
    if (value.startsWith('"') || value.startsWith("'")) {
      return { updated: false, skipped: true, reason: 'Already quoted' };
    }
  }
  
  // Reconstruct file with quoted description
  const newContent = reconstructFile(content, frontMatter, body, { quoteDescription: true });
  
  // Only update if content changed
  if (newContent === content) {
    return { updated: false, skipped: true, reason: 'No change needed' };
  }
  
  // Write back to file
  fs.writeFileSync(filePath, newContent, 'utf8');
  
  return { updated: true, description: frontMatter.description };
}

// Main function
function main() {
  console.log('🔧 Quoting post descriptions...\n');
  
  const postFiles = getPostFiles();
  console.log(`Found ${postFiles.length} markdown files\n`);
  
  const results = processFiles(postFiles, processPostFile, {
    onFileStart: (file) => {
      const relativePath = path.relative(process.cwd(), file);
      console.log(`Processing: ${relativePath}`);
    },
    onResult: (file, result) => {
      if (result.updated) {
        console.log(`  ✅ Quoted description (${result.description.length} chars)`);
      } else if (result.skipped) {
        console.log(`  ⏭️  Skipped: ${result.reason}`);
      } else if (result.error) {
        console.error(`  ❌ Error: ${result.error}`);
      }
    }
  });
  
  printSummary('Quote Post Descriptions', '📊', results);
  exitWithResults(results, 0, {
    testType: 'Quote Post Descriptions',
    issueMessage: '\n❌ Errors occurred during processing.',
    successMessage: '\n✅ Processing completed successfully.'
  });
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { processPostFile };

