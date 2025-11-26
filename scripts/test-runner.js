#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Map test types to their script files
const testTypes = {
  'html': 'html.js',
  'links-yaml': 'links-yaml.js',
  'internal-links': 'internal-links.js',
  'content': 'content-structure.js',
  'markdown': 'markdown.js',
  'seo': 'seo-meta.js',
  'accessibility': 'accessibility.js',
  'rss': 'rss-feed.js',
  'deploy': 'deploy.js'
};

// Fast tests (excludes slow tests: accessibility)
// Suitable for pre-commit hooks or frequent validation
const fastTests = [
  'html',
  'internal-links',
  'content',
  'markdown',
  'seo',
  'rss'
];

// Tests to run for "test all" (includes all tests, including slow ones)
const allTests = [
  'html',
  'internal-links',
  'content',
  'markdown',
  'seo',
  'accessibility',
  'rss'
];

function listTests() {
  console.log('Available test types:\n');
  Object.keys(testTypes).forEach(type => {
    const isInAll = allTests.includes(type);
    const isInFast = fastTests.includes(type);
    let note = '';
    if (isInFast) note = ' (included in "test fast" and "test all")';
    else if (isInAll) note = ' (included in "test all")';
    console.log(`  ${type}${note}`);
  });
  console.log('\nUsage: npm run test [type]');
  console.log('       npm run test fast   (runs fast tests: ' + fastTests.join(', ') + ')');
  console.log('       npm run test all    (runs all tests: ' + allTests.join(', ') + ')');
}

function runTest(testType) {
  const scriptPath = path.join(__dirname, 'test', testTypes[testType]);
  
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      shell: false
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Test failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runFastTests() {
  console.log('Running fast tests...\n');
  
  for (let i = 0; i < fastTests.length; i++) {
    const testType = fastTests[i];
    console.log(`\n[${i + 1}/${fastTests.length}] Running ${testType}...\n`);
    
    try {
      await runTest(testType);
    } catch (error) {
      console.error(`\n❌ Test "${testType}" failed`);
      process.exit(1);
    }
  }
  
  console.log('\n✅ All fast tests passed!');
}

async function runAllTests() {
  console.log('Running all tests...\n');
  
  for (let i = 0; i < allTests.length; i++) {
    const testType = allTests[i];
    console.log(`\n[${i + 1}/${allTests.length}] Running ${testType}...\n`);
    
    try {
      await runTest(testType);
    } catch (error) {
      console.error(`\n❌ Test "${testType}" failed`);
      process.exit(1);
    }
  }
  
  console.log('\n✅ All tests passed!');
}

async function main() {
  const testType = process.argv[2];
  
  if (!testType) {
    listTests();
    process.exit(0);
  }
  
  if (testType === 'fast') {
    await runFastTests();
    process.exit(0);
  }
  
  if (testType === 'all') {
    await runAllTests();
    process.exit(0);
  }
  
  if (!testTypes[testType]) {
    console.error(`❌ Unknown test type: ${testType}\n`);
    listTests();
    process.exit(1);
  }
  
  try {
    await runTest(testType);
  } catch (error) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
