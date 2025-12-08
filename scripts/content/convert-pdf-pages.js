#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
 * Check if Poppler is installed
 */
function checkPopplerInstalled() {
  try {
    execSync('which pdftocairo', { stdio: 'ignore' });
  } catch (error) {
    console.error('Error: Poppler is not installed.');
    console.error('');
    console.error('Poppler is required for PDF conversion. Install it with:');
    console.error('  brew install poppler');
    console.error('');
    console.error('After installation, run this script again.');
    process.exit(1);
  }
}

/**
 * Get page count from PDF
 */
function getPageCount(pdfPath) {
  try {
    const output = execSync(`pdfinfo "${pdfPath}"`, { encoding: 'utf8' });
    const match = output.match(/Pages:\s+(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    throw new Error('Could not determine page count');
  } catch (error) {
    throw new Error(`Failed to get page count: ${error.message}`);
  }
}

/**
 * Convert a single PDF page to PNG
 */
function convertPage(pdfPath, pageNum, outputFile) {
  try {
    // pdftocairo -png -f <first-page> -l <last-page> input.pdf output-prefix
    // Output will be: output-prefix-<zero-padded-page-num>.png (e.g., prefix-01.png)
    // Extract prefix by removing the page number and extension from outputFile
    // e.g., "/path/to/slug-page-1.png" -> "/path/to/slug-page"
    const outputPrefix = outputFile.replace(/-\d+\.png$/, '').replace(/\.png$/, '');
    
    execSync(
      `pdftocairo -png -f ${pageNum} -l ${pageNum} "${pdfPath}" "${outputPrefix}"`,
      { stdio: 'ignore', cwd: process.cwd() }
    );
    
    // pdftocairo creates: output-prefix-<zero-padded-page-num>.png (e.g., prefix-01.png)
    // Try both zero-padded and non-zero-padded versions
    const pageNumPadded = String(pageNum).padStart(2, '0');
    const generatedFilePadded = `${outputPrefix}-${pageNumPadded}.png`;
    const generatedFile = `${outputPrefix}-${pageNum}.png`;
    
    let actualFile = null;
    if (fs.existsSync(generatedFilePadded)) {
      actualFile = generatedFilePadded;
    } else if (fs.existsSync(generatedFile)) {
      actualFile = generatedFile;
    } else {
      throw new Error(`Expected output file not found. Tried: ${generatedFilePadded} and ${generatedFile}`);
    }
    
    // Rename to match our desired output filename
    if (path.resolve(actualFile) !== path.resolve(outputFile)) {
      fs.renameSync(actualFile, outputFile);
    }
  } catch (error) {
    throw new Error(`Failed to convert page ${pageNum}: ${error.message}`);
  }
}

/**
 * Get default date path (current year/month)
 */
function getDefaultDatePath() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}/${month}`;
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
