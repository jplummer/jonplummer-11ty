#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { checkPopplerInstalled, getPageCount, convertPage, getDefaultDatePath } = require('../utils/pdf-utils');

/**
 * Convert PDF pages to images and generate markdown template with speaker notes
 * 
 * Usage: node scripts/content/convert-pdf-pages-with-notes.js <pdf-file> <notes-file> [year/month]
 * Example: node scripts/content/convert-pdf-pages-with-notes.js Product\ Trio.pdf notes.txt 2022/12
 * 
 * Notes file format: Plain text file where each slide's notes are separated by blank lines.
 * Notes can contain newlines within them - they'll be preserved as spaces in the output.
 * 
 * Requires: Poppler (install via: brew install poppler)
 */

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node scripts/content/convert-pdf-pages-with-notes.js <pdf-file> <notes-file> [year/month]');
  console.error('Example: node scripts/content/convert-pdf-pages-with-notes.js "Product Trio.pdf" notes.txt 2022/12');
  process.exit(1);
}

const pdfPath = path.resolve(args[0]);
const notesPath = path.resolve(args[1]);
const datePath = args[2] || getDefaultDatePath();

// Validate PDF file exists
if (!fs.existsSync(pdfPath)) {
  console.error(`Error: PDF file not found: ${pdfPath}`);
  process.exit(1);
}

// Validate PDF extension
if (!pdfPath.toLowerCase().endsWith('.pdf')) {
  console.error('Error: File must be a PDF (.pdf)');
  process.exit(1);
}

// Validate notes file exists
if (!fs.existsSync(notesPath)) {
  console.error(`Error: Notes file not found: ${notesPath}`);
  process.exit(1);
}

// Check for Poppler tools
checkPopplerInstalled();

// Generate slug from PDF filename
const pdfFilename = path.basename(pdfPath, '.pdf');
const slug = pdfFilename
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

// Set up paths
const imagesDir = path.join(process.cwd(), 'src', 'assets', 'images', datePath);
const pdfsDir = path.join(process.cwd(), 'src', 'assets', 'pdfs', datePath);
const outputPrefix = `${slug}-page`;

// Ensure directories exist
fs.mkdirSync(imagesDir, { recursive: true });
fs.mkdirSync(pdfsDir, { recursive: true });

// Copy PDF to assets/pdfs
const pdfDestPath = path.join(pdfsDir, path.basename(pdfPath));
fs.copyFileSync(pdfPath, pdfDestPath);
console.log(`✓ Copied PDF to: ${path.relative(process.cwd(), pdfDestPath)}`);

// Parse notes file
console.log(`\nParsing notes file...`);
const notes = parseNotesFile(notesPath);
console.log(`  Found ${notes.length} note(s)`);

// Get page count
console.log(`\nConverting PDF pages to images...`);
console.log(`  PDF: ${pdfPath}`);
console.log(`  Output directory: ${path.relative(process.cwd(), imagesDir)}`);

try {
  const pageCount = getPageCount(pdfPath);
  console.log(`  Found ${pageCount} page(s)`);

  // Convert each page
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const outputFile = path.join(imagesDir, `${outputPrefix}-${pageNum}.png`);
    convertPage(pdfPath, pageNum, outputFile);
    process.stdout.write(`  Converting page ${pageNum}/${pageCount}...\r`);
  }
  console.log(`\n✓ Converted ${pageCount} page(s) to images`);

  // Get list of generated images
  const imageFiles = fs.readdirSync(imagesDir)
    .filter(file => file.startsWith(outputPrefix) && file.endsWith('.png'))
    .sort((a, b) => {
      // Sort by page number
      const pageA = parseInt(a.match(/-page-(\d+)\.png$/)?.[1] || '0');
      const pageB = parseInt(b.match(/-page-(\d+)\.png$/)?.[1] || '0');
      return pageA - pageB;
    });

  // Generate markdown template with notes
  const markdownTemplate = generateMarkdownTemplate(imageFiles, datePath, slug, pdfPath, notes, pageCount);
  
  console.log('\n' + '='.repeat(60));
  console.log('MARKDOWN TEMPLATE:');
  console.log('='.repeat(60));
  console.log(markdownTemplate);
  console.log('='.repeat(60));
  console.log('\nCopy the template above into your portfolio item markdown file.');
  if (notes.length < pageCount) {
    console.log(`\nNote: Only ${notes.length} note(s) found for ${pageCount} slide(s). Missing notes have placeholders.`);
  }
} catch (error) {
  console.error('\nError converting PDF:', error.message);
  process.exit(1);
}


/**
 * Parse notes file - handles multiple formats flexibly
 * 
 * Formats supported:
 * 1. Blank-line separated: Each slide's notes separated by blank lines
 * 2. Numbered lines: "1: note text" or "Slide 1: note text"
 * 3. Sequential: One note per line (simple case)
 */
function parseNotesFile(notesPath) {
  const content = fs.readFileSync(notesPath, 'utf8');
  const lines = content.split(/\r?\n/);
  
  // Try to detect format
  // Check if it's numbered format (e.g., "1: note" or "Slide 1: note")
  const numberedPattern = /^(?:slide\s+)?(\d+)[:.)]\s*(.+)$/i;
  const firstLineMatch = lines[0]?.trim().match(numberedPattern);
  
  if (firstLineMatch) {
    // Numbered format - extract by slide number
    const notesByNumber = {};
    lines.forEach(line => {
      const match = line.trim().match(numberedPattern);
      if (match) {
        const slideNum = parseInt(match[1], 10);
        const noteText = match[2].trim();
        if (noteText) {
          notesByNumber[slideNum] = noteText;
        }
      }
    });
    
    // Convert to array (1-indexed, so index 0 is unused)
    const maxSlide = Math.max(...Object.keys(notesByNumber).map(Number), 0);
    const notes = [];
    for (let i = 1; i <= maxSlide; i++) {
      notes.push(notesByNumber[i] || '');
    }
    return notes;
  }
  
  // Blank-line separated format or sequential
  const notes = [];
  let currentNote = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === '') {
      // Blank line - end of current note, start new one
      if (currentNote.length > 0) {
        notes.push(currentNote.join(' ').trim());
        currentNote = [];
      }
    } else {
      // Part of current note
      currentNote.push(trimmed);
    }
  }
  
  // Don't forget the last note if file doesn't end with blank line
  if (currentNote.length > 0) {
    notes.push(currentNote.join(' ').trim());
  }
  
  return notes;
}

/**
 * Generate markdown template with page references and notes
 */
function generateMarkdownTemplate(imageFiles, datePath, slug, pdfPath, notes, pageCount) {
  const imagePath = datePath.replace(/\\/g, '/'); // Normalize path separators
  const pdfUrl = `/assets/pdfs/${imagePath}/${path.basename(pdfPath)}`;
  
  let template = `\n`;
  
  // Add a figure for each page
  imageFiles.forEach((imageFile, index) => {
    const pageNum = index + 1;
    const imageRelPath = `${imagePath}/${imageFile}`;
    const note = notes[index] || '';
    const noteText = note.trim() || '[Add notes about this page]';
    
    template += `<figure>\n`;
    template += `  <img src="/assets/images/${imageRelPath}" alt="${slug} page ${pageNum}">\n`;
    template += `  <figcaption>Page ${pageNum}: ${noteText}</figcaption>\n`;
    template += `</figure>\n\n`;
  });
  
  // Add optional link to full PDF
  template += `[Download full PDF](${pdfUrl})\n`;
  
  return template;
}







