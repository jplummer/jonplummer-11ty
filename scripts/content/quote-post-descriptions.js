#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { findMarkdownFiles } = require('../utils/file-utils');

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

// Reconstruct file with quoted description
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
  if (!frontMatter.tags || !frontMatter.tags.includes('post')) {
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
  const newContent = reconstructFile(content, frontMatter, body);
  
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
      console.log(`  ✅ Quoted description (${result.description.length} chars)`);
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

module.exports = { processPostFile };

