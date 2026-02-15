#!/usr/bin/env node

/**
 * PDF Utilities
 * 
 * Shared functions for PDF conversion scripts.
 * Requires Poppler (install via: brew install poppler).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
 * @param {string} pdfPath - Absolute path to the PDF file
 * @returns {number} Number of pages in the PDF
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
 * @param {string} pdfPath - Absolute path to the PDF file
 * @param {number} pageNum - Page number to convert (1-indexed)
 * @param {string} outputFile - Absolute path for the output PNG file
 */
function convertPage(pdfPath, pageNum, outputFile) {
  try {
    // pdftocairo -png -f <first-page> -l <last-page> input.pdf output-prefix
    // Output will be: output-prefix-<zero-padded-page-num>.png (e.g., prefix-01.png)
    // Extract prefix by removing the page number and extension from outputFile
    // e.g., "/path/to/slug-page-1.png" -> "/path/to/slug-page"
    const outputPrefix = outputFile.replace(/-\d+\.png$/, '').replace(/\.png$/, '');
    
    execSync(
      `pdftocairo -png -r 300 -f ${pageNum} -l ${pageNum} "${pdfPath}" "${outputPrefix}"`,
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
 * @returns {string} Date path in "YYYY/MM" format
 */
function getDefaultDatePath() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}/${month}`;
}

module.exports = {
  checkPopplerInstalled,
  getPageCount,
  convertPage,
  getDefaultDatePath
};
