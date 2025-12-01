#!/usr/bin/env node

/**
 * Fix unescaped quotes in post titles and descriptions
 * 
 * Replaces straight quotes (") with HTML entities (&quot;) in titles and descriptions
 * to ensure proper HTML escaping in meta tags.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { parseFrontMatter, reconstructFile } = require('../utils/frontmatter-utils');

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
    if (!frontMatter.tags || (!frontMatter.tags.includes('post') && !frontMatter.tags.includes('portfolio'))) {
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
  
  const postsDir = path.join(process.cwd(), 'src', '_posts');
  
  if (!fs.existsSync(postsDir)) {
    console.error(`❌ Posts directory not found: ${postsDir}`);
    process.exit(1);
  }
  
  const results = {
    updated: [],
    skipped: [],
    errors: []
  };
  
  function processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        processDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const relativePath = path.relative(postsDir, fullPath);
        const result = processPostFile(fullPath);
        
        if (result.updated) {
          results.updated.push({ path: relativePath, ...result });
          const changes = [];
          if (result.title) changes.push('title');
          if (result.description) changes.push('description');
          console.log(`  ✅ ${relativePath} (fixed ${changes.join(', ')})`);
        } else if (result.error) {
          results.errors.push({ path: relativePath, error: result.error });
          console.log(`  ❌ ${relativePath}: ${result.error}`);
        }
      }
    }
  }
  
  processDirectory(postsDir);
  
  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${results.updated.length} files`);
  console.log(`   Errors: ${results.errors.length} files`);
  
  if (results.errors.length > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { processPostFile, escapeQuotes };

