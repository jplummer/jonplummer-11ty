#!/usr/bin/env node

/**
 * Fix unescaped quotes in post titles and descriptions
 * 
 * Replaces straight quotes (") with HTML entities (&quot;) in titles and descriptions
 * to ensure proper HTML escaping in meta tags.
 */

const fs = require('fs');
const path = require('path');
const { parseFrontMatter, reconstructFile } = require('../utils/frontmatter-utils');
const { getPostsDirectory, isPost, isPortfolio, processFiles } = require('../utils/content-utils');
const { printSummary, exitWithResults } = require('../utils/reporting-utils');

function escapeQuotes(text) {
  if (!text || typeof text !== 'string') return text;
  // Replace straight quotes with HTML entity, but preserve existing entities
  return text.replace(/"/g, '&quot;');
}

function processPostFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { frontMatter, content: body, error } = parseFrontMatter(content);
    
    if (error) {
      console.error(`  ⚠️  Error parsing frontmatter: ${error}`);
      return { updated: false, error };
    }
    
    if (!frontMatter) {
      return { updated: false, error: 'No frontmatter' };
    }
    
    // Skip if not a post or portfolio item
    if (!isPost(frontMatter) && !isPortfolio(frontMatter)) {
      return { updated: false, skipped: true, reason: 'Not a post or portfolio item' };
    }
    
    let needsUpdate = false;
    const updated = { ...frontMatter };
    
    // Fix title if it has unescaped quotes
    if (frontMatter.title && frontMatter.title.includes('"') && !frontMatter.title.includes('&quot;')) {
      updated.title = escapeQuotes(frontMatter.title);
      needsUpdate = true;
    }
    
    // Fix description if it has unescaped quotes
    if (frontMatter.description && frontMatter.description.includes('"') && !frontMatter.description.includes('&quot;')) {
      updated.description = escapeQuotes(frontMatter.description);
      needsUpdate = true;
    }
    
    if (!needsUpdate) {
      return { updated: false, skipped: true, reason: 'No unescaped quotes found' };
    }
    
    // Reconstruct file
    const newContent = reconstructFile(content, updated, body);
    
    // Only update if content changed
    if (newContent === content) {
      return { updated: false, skipped: true, reason: 'No change needed' };
    }
    
    // Write back to file
    fs.writeFileSync(filePath, newContent, 'utf8');
    
    return { 
      updated: true, 
      title: updated.title !== frontMatter.title ? updated.title : null,
      description: updated.description !== frontMatter.description ? updated.description : null
    };
  } catch (error) {
    console.error(`  ❌ Error processing file: ${error.message}`);
    return { updated: false, error: error.message };
  }
}

function main() {
  console.log('🔧 Fixing unescaped quotes in post titles and descriptions...\n');
  
  const postsDir = getPostsDirectory();
  
  if (!fs.existsSync(postsDir)) {
    console.error(`❌ Posts directory not found: ${postsDir}`);
    process.exit(1);
  }
  
  const { findMarkdownFiles } = require('../utils/file-utils');
  const postFiles = findMarkdownFiles(postsDir);
  
  const results = processFiles(postFiles, processPostFile, {
    onResult: (file, result) => {
      const relativePath = path.relative(postsDir, file);
      
      if (result.updated) {
        const changes = [];
        if (result.title) changes.push('title');
        if (result.description) changes.push('description');
        console.log(`  ✅ ${relativePath} (fixed ${changes.join(', ')})`);
      } else if (result.skipped) {
        if (result.reason) {
          console.log(`  ⏭️  ${relativePath}: ${result.reason}`);
        } else {
          console.log(`  ⏭️  ${relativePath}: Skipped`);
        }
      } else if (result.error) {
        console.log(`  ❌ ${relativePath}: ${result.error}`);
      }
    }
  });
  
  printSummary('Fix Unescaped Quotes', '📊', results);
  exitWithResults(results, 0, {
    testType: 'Fix Unescaped Quotes',
    issueMessage: '\n❌ Errors occurred during processing.',
    successMessage: '\n✅ Processing completed successfully.'
  });
}

if (require.main === module) {
  main();
}

module.exports = { processPostFile, escapeQuotes };

