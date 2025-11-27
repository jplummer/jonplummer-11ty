#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { findMarkdownFiles } = require('../utils/file-utils');
const { parseFrontMatter, reconstructFile } = require('../utils/frontmatter-utils');

// Strip markdown syntax to get plain text
function stripMarkdown(text) {
  if (!text) return '';
  
  // Remove markdown headers
  text = text.replace(/^#{1,6}\s+/gm, '');
  
  // Remove markdown links but keep text: [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Remove markdown images: ![alt](url) -> alt
  text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1');
  
  // Remove markdown emphasis: **text** or *text* -> text
  text = text.replace(/\*\*([^\*]+)\*\*/g, '$1');
  text = text.replace(/\*([^\*]+)\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  
  // Remove markdown code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');
  
  // Remove markdown lists
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Remove extra whitespace and normalize
  text = text.replace(/\n+/g, ' ');
  text = text.replace(/\s+/g, ' ');
  text = text.trim();
  
  return text;
}

// Extract description from content
function extractDescription(content) {
  if (!content) return '';
  
  // Check if content starts with a heading (##, ###, etc.)
  // If so, skip it and start from the next paragraph
  let contentToUse = content.trim();
  const headingMatch = contentToUse.match(/^#{1,6}\s+[^\n]+\n+/);
  if (headingMatch) {
    // Skip the heading line and any blank lines after it
    const afterHeading = contentToUse.substring(headingMatch[0].length).trim();
    if (afterHeading.length > 0) {
      contentToUse = afterHeading;
    }
  }
  
  // Strip markdown to get plain text
  let text = stripMarkdown(contentToUse);
  
  // Take first 300 characters
  if (text.length > 300) {
    text = text.substring(0, 300);
  }
  
  // Target 120-160 characters for SEO
  // If longer than 160, truncate at word boundary
  if (text.length > 160) {
    const truncated = text.substring(0, 160);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 120) {
      text = truncated.substring(0, lastSpace);
    } else {
      text = truncated;
    }
  }
  
  // Ensure minimum length (if content is very short, use as-is)
  if (text.length < 50 && content.length > 0) {
    // If we have very short content, try to get more
    const longer = stripMarkdown(content);
    if (longer.length > text.length) {
      text = longer.substring(0, 160);
      const lastSpace = text.lastIndexOf(' ');
      if (lastSpace > 50) {
        text = text.substring(0, lastSpace);
      }
    }
  }
  
  return text.trim();
}

// Front matter parsing and reconstruction now use shared utilities

// Process a single post file
function processPostFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { frontMatter, content: body, error } = parseFrontMatter(content);
  
  if (error) {
    console.error(`  ⚠️  Error parsing frontmatter: ${error}`);
    return { updated: false, error };
  }
  
  if (!frontMatter) {
    console.error(`  ⚠️  No frontmatter found`);
    return { updated: false, error: 'No frontmatter' };
  }
  
  // Skip if description already exists
  if (frontMatter.description) {
    return { updated: false, skipped: true };
  }
  
  // Skip if not a post (check tags)
  if (!frontMatter.tags || !frontMatter.tags.includes('post')) {
    return { updated: false, skipped: true, reason: 'Not a post' };
  }
  
  // Extract description from content
  const description = extractDescription(body);
  
  if (!description || description.length < 30) {
    console.warn(`  ⚠️  Could not extract meaningful description (${description.length} chars)`);
    return { updated: false, error: 'Description too short' };
  }
  
  // Add description to frontmatter
  frontMatter.description = description;
  
  // Reconstruct file
  const newContent = reconstructFile(content, frontMatter, body, { quoteDescription: true });
  
  // Write back to file
  fs.writeFileSync(filePath, newContent, 'utf8');
  
  return { updated: true, description };
}

// Main function
function main() {
  console.log('📝 Adding descriptions to posts...\n');
  
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
      console.log(`  ✅ Added description (${result.description.length} chars): "${result.description.substring(0, 60)}..."`);
      results.updated++;
    } else if (result.skipped) {
      if (result.reason) {
        console.log(`  ⏭️  Skipped: ${result.reason}`);
      } else {
        console.log(`  ⏭️  Skipped: Already has description`);
      }
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

module.exports = { extractDescription, processPostFile };

