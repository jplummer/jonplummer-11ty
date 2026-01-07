#!/usr/bin/env node

/**
 * Update Eleventy Documentation
 * 
 * Pulls the latest 11ty documentation from the official 11ty-website repository
 * and updates the cached docs in docs/eleventy.
 * 
 * This script:
 * 1. Clones the 11ty/11ty-website repo to a temporary directory
 * 2. Copies the docs directory to docs/eleventy
 * 3. Cleans up the temporary clone
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Count files recursively in a directory
 */
function countFiles(dir) {
  if (!fs.existsSync(dir)) {
    return 0;
  }
  let count = 0;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      count += countFiles(fullPath);
    } else {
      count++;
    }
  }
  return count;
}

// Hardcoded trusted repository URL (CodeQL: Shell command built from environment values)
// This is a known constant, not user input, so it's safe to use directly
const ELEVENTY_REPO = 'https://github.com/11ty/11ty-website.git';
const TEMP_DIR = path.join(__dirname, '../../.temp-eleventy-clone');
const DOCS_SOURCE = path.join(TEMP_DIR, 'src', 'docs');
const DOCS_TARGET = path.join(__dirname, '../../docs/eleventy');

console.log('📚 Updating Eleventy documentation...\n');

// Clean up any existing temp directory
if (fs.existsSync(TEMP_DIR)) {
  console.log('Cleaning up existing temp directory...');
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
}

try {
  // Clone the repo (shallow clone with some history to see changes)
  console.log('Cloning 11ty/11ty-website repository...');
  execSync(`git clone --depth 10 ${ELEVENTY_REPO} ${TEMP_DIR}`, {
    stdio: 'inherit'
  });

  // Check if docs directory exists in the clone
  if (!fs.existsSync(DOCS_SOURCE)) {
    throw new Error(`Docs directory not found at ${DOCS_SOURCE}`);
  }

  // Count files before update (if they exist)
  const filesBefore = fs.existsSync(DOCS_TARGET) ? countFiles(DOCS_TARGET) : 0;

  // Get commit hash and info from cloned repo for reference
  const commitHash = execSync('git rev-parse HEAD', {
    cwd: TEMP_DIR,
    encoding: 'utf-8'
  }).trim().substring(0, 7);
  
  const commitMessage = execSync('git log -1 --pretty=format:"%s"', {
    cwd: TEMP_DIR,
    encoding: 'utf-8'
  }).trim();
  
  const commitDate = execSync('git log -1 --pretty=format:"%ad" --date=short', {
    cwd: TEMP_DIR,
    encoding: 'utf-8'
  }).trim();
  
  // Get list of changed files in docs directory from this commit
  let changedFiles = [];
  try {
    const gitDiff = execSync('git diff --name-only HEAD~1 HEAD -- src/docs/', {
      cwd: TEMP_DIR,
      encoding: 'utf-8'
    }).trim();
    if (gitDiff) {
      changedFiles = gitDiff.split('\n').filter(f => f).map(f => f.replace('src/docs/', ''));
    }
  } catch (e) {
    // If HEAD~1 doesn't exist (shallow clone), skip file diff
  }

  // Remove existing docs directory
  if (fs.existsSync(DOCS_TARGET)) {
    console.log('Removing existing docs directory...');
    fs.rmSync(DOCS_TARGET, { recursive: true, force: true });
  }

  // Ensure parent directory exists
  const docsParent = path.dirname(DOCS_TARGET);
  if (!fs.existsSync(docsParent)) {
    fs.mkdirSync(docsParent, { recursive: true });
  }

  // Copy docs directory
  console.log('Copying docs to docs/eleventy...');
  fs.cpSync(DOCS_SOURCE, DOCS_TARGET, { recursive: true });

  // Count files after update
  const filesAfter = countFiles(DOCS_TARGET);

  // Clean up temp directory
  console.log('Cleaning up temporary files...');
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });

  // Show summary
  console.log('\n✅ Eleventy documentation updated successfully!');
  console.log(`   Docs location: ${DOCS_TARGET}`);
  console.log(`   Commit: ${commitHash} (${commitDate})`);
  console.log(`   Message: ${commitMessage}`);
  if (filesBefore > 0) {
    const diff = filesAfter - filesBefore;
    if (diff > 0) {
      console.log(`   Files: ${filesBefore} → ${filesAfter} (+${diff} new)`);
    } else if (diff < 0) {
      console.log(`   Files: ${filesBefore} → ${filesAfter} (${diff} removed)`);
    } else {
      console.log(`   Files: ${filesAfter} (no change in count)`);
    }
  } else {
    console.log(`   Files: ${filesAfter} (initial sync)`);
  }
  
  if (changedFiles.length > 0) {
    console.log(`\n   Changed files (${changedFiles.length}):`);
    const displayFiles = changedFiles.slice(0, 10);
    displayFiles.forEach(file => {
      console.log(`     - ${file}`);
    });
    if (changedFiles.length > 10) {
      console.log(`     ... and ${changedFiles.length - 10} more`);
    }
  }
  
} catch (error) {
  console.error('\n❌ Error updating Eleventy documentation:');
  console.error(error.message);
  
  // Clean up on error
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  
  process.exit(1);
}

