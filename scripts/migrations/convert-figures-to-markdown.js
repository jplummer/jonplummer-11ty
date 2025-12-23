#!/usr/bin/env node

/**
 * Migration script: Convert HTML <figure> elements to markdown syntax
 * 
 * Converts existing HTML figure elements in markdown files to the new
 * extended markdown image syntax:
 * 
 * From:
 * <figure>
 *   <img src="/assets/images/path/image.png" alt="Alt text">
 *   <figcaption>Caption text</figcaption>
 * </figure>
 * 
 * To:
 * ![Alt text](/assets/images/path/image.png)
 * *Caption text*
 * 
 * Creates backups before modifying files.
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Helper to find all markdown files in a directory
function findMarkdownFiles(dir, results = []) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      findMarkdownFiles(file, results);
    } else {
      if (file.endsWith('.md') && !file.includes('node_modules') && !file.includes('_site')) {
        results.push(file);
      }
    }
  });
  return results;
}

// Convert HTML figure to markdown syntax
function convertFigureToMarkdown(figureHtml) {
  const $ = cheerio.load(figureHtml, {
    decodeEntities: false
  });
  
  const $img = $('img');
  const $figcaption = $('figcaption');
  
  if (!$img.length) {
    return null; // No image found, skip
  }
  
  const src = $img.attr('src') || '';
  const alt = $img.attr('alt') || '';
  const caption = $figcaption.text().trim();
  
  // Build markdown syntax
  let markdown = `![${alt}](${src})`;
  
  if (caption) {
    markdown += `\n*${caption}*`;
  }
  
  return markdown;
}

// Process a single file
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find all <figure> blocks in the content
  // We need to match figure blocks that may span multiple lines
  const figureRegex = /<figure>[\s\S]*?<\/figure>/g;
  
  // Use replace with a function to convert each match
  let newContent = content.replace(figureRegex, (figureHtml) => {
    const markdown = convertFigureToMarkdown(figureHtml);
    return markdown || figureHtml; // Return markdown if conversion succeeded, otherwise keep original
  });
  
  // Check if anything changed
  if (newContent === content) {
    return false; // No changes
  }
  
  // Create backup
  const backupPath = filePath + '.backup';
  fs.writeFileSync(backupPath, content, 'utf8');
  
  // Write converted content
  fs.writeFileSync(filePath, newContent, 'utf8');
  
  return true;
}

// Main execution
const postsDir = path.join(__dirname, '../../src/_posts');
const markdownFiles = findMarkdownFiles(postsDir);

console.log(`Found ${markdownFiles.length} markdown files. Scanning for figures...`);

let processedCount = 0;
let convertedCount = 0;

markdownFiles.forEach(file => {
  processedCount++;
  if (processFile(file)) {
    convertedCount++;
    console.log(`✓ Converted: ${path.relative(process.cwd(), file)}`);
  }
});

console.log(`\nDone. Processed ${processedCount} files, converted ${convertedCount} files.`);
console.log(`Backups created with .backup extension.`);

