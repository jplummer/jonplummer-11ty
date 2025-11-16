#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { findMarkdownFiles } = require('../utils/file-utils');
const { extractDescription } = require('./add-post-descriptions');

// Parse frontmatter from markdown file
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

// Reconstruct file with updated frontmatter
function reconstructFile(originalContent, frontMatter, body) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = originalContent.match(frontMatterRegex);
  
  if (!match) {
    return originalContent;
  }
  
  // Dump YAML
  let yamlContent = yaml.dump(frontMatter, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"'
  });
  
  // Post-process to ensure description is always quoted
  const lines = yamlContent.split('\n');
  const fixedLines = lines.map(line => {
    if (line.startsWith('description:')) {
      const match = line.match(/^description:\s*(.+)$/);
      if (match) {
        let value = match[1];
        // If not already quoted, quote it and escape internal quotes
        if (!value.startsWith('"') && !value.startsWith("'")) {
          // Escape any double quotes and backslashes in the value
          const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
          return `description: "${escaped}"`;
        }
      }
    }
    return line;
  });
  yamlContent = fixedLines.join('\n');
  
  return `---\n${yamlContent}---\n${body}`;
}

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
  const newContent = reconstructFile(content, frontMatter, body);
  
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

