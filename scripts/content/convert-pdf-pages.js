#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { checkPopplerInstalled, getPageCount, convertPage, getDefaultDatePath } = require('../utils/pdf-utils');

/**
 * Convert PDF pages to images and generate markdown template
 * 
 * Usage: node scripts/content/convert-pdf-pages.js <pdf-file> [year/month]
 * Example: node scripts/content/convert-pdf-pages.js Product\ Trio.pdf 2022/12
 * 
 * Requires: Poppler (install via: brew install poppler)
 */

// Get command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node scripts/content/convert-pdf-pages.js <pdf-file> [year/month]');
  console.error('Example: node scripts/content/convert-pdf-pages.js "Product Trio.pdf" 2022/12');
  process.exit(1);
}

const pdfPath = path.resolve(args[0]);
const datePath = args[1] || getDefaultDatePath();

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

// Get page count
console.log(`Converting PDF pages to images...`);
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

  // Generate markdown template
  const markdownTemplate = generateMarkdownTemplate(imageFiles, datePath, slug, pdfPath);
  
  console.log('\n' + '='.repeat(60));
  console.log('MARKDOWN TEMPLATE:');
  console.log('='.repeat(60));
  console.log(markdownTemplate);
  console.log('='.repeat(60));
  console.log('\nCopy the template above into your portfolio item markdown file.');
  console.log('Add notes for each page in the markdown content.');
} catch (error) {
  console.error('\nError converting PDF:', error.message);
  process.exit(1);
}

/**
 * Generate markdown template with page references
 */
function generateMarkdownTemplate(imageFiles, datePath, slug, pdfPath) {
  const imagePath = datePath.replace(/\\/g, '/'); // Normalize path separators
  const pdfUrl = `/assets/pdfs/${imagePath}/${path.basename(pdfPath)}`;
  
  let template = `\n`;
  
  // Add a figure for each page
  imageFiles.forEach((imageFile, index) => {
    const pageNum = index + 1;
    const imageRelPath = `${imagePath}/${imageFile}`;
    
    template += `<figure>\n`;
    template += `  <img src="/assets/images/${imageRelPath}" alt="${slug} page ${pageNum}">\n`;
    template += `  <figcaption>Page ${pageNum}: [Add notes about this page]</figcaption>\n`;
    template += `</figure>\n\n`;
  });
  
  // Add optional link to full PDF
  template += `[Download full PDF](${pdfUrl})\n`;
  
  return template;
}
