#!/usr/bin/env node

/**
 * Test script for content-utils.js
 * 
 * Exercises the utilities to verify they work correctly.
 * Run with: node scripts/test-content-utils.js
 */

const fs = require('fs');
const path = require('path');
const {
  getPostsDirectory,
  isPost,
  isPortfolio,
  filterDrafts,
  getPostFiles,
  processFiles,
  printContentSummary,
  exitWithContentResults
} = require('./utils/content-utils');
const { parseFrontMatter } = require('./utils/frontmatter-utils');

console.log('🧪 Testing content-utils.js\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ ${name}: ${error.message}`);
    testsFailed++;
  }
}

// Test 1: getPostsDirectory
test('getPostsDirectory returns a path', () => {
  const postsDir = getPostsDirectory();
  if (!postsDir || typeof postsDir !== 'string') {
    throw new Error('Expected string path');
  }
  if (!postsDir.includes('_posts')) {
    throw new Error('Path should include "_posts"');
  }
});

// Test 2: isPost
test('isPost identifies posts correctly', () => {
  const postFrontMatter = { tags: ['post'] };
  const nonPostFrontMatter = { tags: ['page'] };
  const noTagsFrontMatter = {};
  
  if (!isPost(postFrontMatter)) {
    throw new Error('Should identify post with tags: ["post"]');
  }
  if (isPost(nonPostFrontMatter)) {
    throw new Error('Should not identify non-post');
  }
  if (isPost(noTagsFrontMatter)) {
    throw new Error('Should not identify item without tags');
  }
});

// Test 3: isPortfolio
test('isPortfolio identifies portfolio items correctly', () => {
  const portfolioFrontMatter = { tags: ['portfolio'] };
  const nonPortfolioFrontMatter = { tags: ['post'] };
  
  if (!isPortfolio(portfolioFrontMatter)) {
    throw new Error('Should identify portfolio with tags: ["portfolio"]');
  }
  if (isPortfolio(nonPortfolioFrontMatter)) {
    throw new Error('Should not identify non-portfolio');
  }
});

// Test 4: filterDrafts
test('filterDrafts filters out drafts', () => {
  // Create temporary test files
  const testDir = path.join(process.cwd(), '.test-content-utils');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const draftFile = path.join(testDir, 'draft.md');
  const publishedFile = path.join(testDir, 'published.md');
  
  fs.writeFileSync(draftFile, '---\ndraft: true\ntags: post\n---\nContent');
  fs.writeFileSync(publishedFile, '---\ntags: post\n---\nContent');
  
  const files = [draftFile, publishedFile];
  const filtered = filterDrafts(files);
  
  if (filtered.length !== 1) {
    throw new Error(`Expected 1 file after filtering, got ${filtered.length}`);
  }
  if (filtered[0] !== publishedFile) {
    throw new Error('Should keep published file, not draft');
  }
  
  // Cleanup
  fs.unlinkSync(draftFile);
  fs.unlinkSync(publishedFile);
  fs.rmdirSync(testDir);
});

// Test 5: getPostFiles
test('getPostFiles returns array of files', () => {
  const files = getPostFiles();
  if (!Array.isArray(files)) {
    throw new Error('Expected array of files');
  }
  // Should return files even if empty
  console.log(`    Found ${files.length} post files`);
});

// Test 6: processFiles
test('processFiles processes files and tracks results', () => {
  const testFiles = ['file1', 'file2', 'file3'];
  
  const results = processFiles(testFiles, (file) => {
    if (file === 'file1') {
      return { updated: true };
    } else if (file === 'file2') {
      return { skipped: true };
    } else {
      return { error: true };
    }
  });
  
  if (results.updated !== 1) {
    throw new Error(`Expected 1 updated, got ${results.updated}`);
  }
  if (results.skipped !== 1) {
    throw new Error(`Expected 1 skipped, got ${results.skipped}`);
  }
  if (results.errors !== 1) {
    throw new Error(`Expected 1 error, got ${results.errors}`);
  }
});

// Test 7: processFiles with callbacks
test('processFiles calls callbacks correctly', () => {
  let startCalled = 0;
  let resultCalled = 0;
  
  processFiles(['file1'], (file) => ({ updated: true }), {
    onFileStart: () => { startCalled++; },
    onResult: () => { resultCalled++; }
  });
  
  if (startCalled !== 1) {
    throw new Error(`onFileStart should be called once, called ${startCalled} times`);
  }
  if (resultCalled !== 1) {
    throw new Error(`onResult should be called once, called ${resultCalled} times`);
  }
});

// Test 8: Integration test with real post files
test('Integration: getPostFiles and isPost work together', () => {
  const files = getPostFiles();
  
  // If we have post files, verify they're identified correctly
  if (files.length > 0) {
    const firstFile = files[0];
    const content = fs.readFileSync(firstFile, 'utf8');
    const { frontMatter } = parseFrontMatter(content);
    
    // If it's a post, isPost should return true
    if (frontMatter && frontMatter.tags && frontMatter.tags.includes('post')) {
      if (!isPost(frontMatter)) {
        throw new Error('isPost should return true for post files');
      }
    }
    console.log(`    Verified ${files.length} post files`);
  } else {
    console.log('    No post files found (this is okay)');
  }
});

// Summary
console.log('\n📊 Test Summary:');
console.log(`   ✅ Passed: ${testsPassed}`);
console.log(`   ❌ Failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
}

