#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const { printOverallSummary, getTestEmoji, getTestDisplayName } = require('./utils/reporting-utils');

// Map test types to their script files
const testTypes = {
  'html': 'html.js',
  'links-yaml': 'links-yaml.js',
  'internal-links': 'internal-links.js',
  'content-structure': 'content-structure.js',
  'markdown': 'markdown.js',
  'seo-meta': 'seo-meta.js',
  'og-images': 'og-images.js',
  'accessibility': 'accessibility.js',
  'rss-feed': 'rss-feed.js',
  'deploy': 'deploy.js'
};

// Fast tests (excludes slow tests: accessibility)
// Suitable for pre-commit hooks or frequent validation
const fastTests = [
  'html',
  'internal-links',
  'content-structure',
  'markdown',
  'seo-meta',
  'og-images',
  'rss-feed'
];

// Tests to run for "test all" (includes all tests, including slow ones)
const allTests = [
  'html',
  'internal-links',
  'content-structure',
  'markdown',
  'seo-meta',
  'og-images',
  'accessibility',
  'rss-feed'
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

function runTest(testType, showStatus = false, compact = false) {
  const scriptPath = path.join(__dirname, 'test', testTypes[testType]);
  
  return new Promise((resolve, reject) => {
    let spinnerInterval = null;
    let statusLine = '';
    const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let spinnerFrame = 0;
    
    if (showStatus) {
      const emoji = getTestEmoji(testType);
      const displayName = getTestDisplayName(testType);
      statusLine = `${emoji} ${displayName}...`;
      
      // Start spinner animation
      spinnerInterval = setInterval(() => {
        const spinner = spinnerFrames[spinnerFrame];
        process.stdout.write(`\r${spinner} ${statusLine}`);
        spinnerFrame = (spinnerFrame + 1) % spinnerFrames.length;
      }, 100);
    }
    
    // Set environment variable to indicate compact mode
    const env = { ...process.env };
    if (compact) {
      env.TEST_COMPACT_MODE = 'true';
    }
    
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      shell: false,
      env: env
    });
    
    child.on('close', (code) => {
      // Stop spinner
      if (spinnerInterval) {
        clearInterval(spinnerInterval);
        spinnerInterval = null;
      }
      
      // Read test summary file if it exists
      const fs = require('fs');
      const summaryPath = path.join(__dirname, 'test', `.${testType}-summary.json`);
      let summary = { files: 0, issues: 0, warnings: 0 };
      if (fs.existsSync(summaryPath)) {
        try {
          summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
          // Clean up the summary file
          fs.unlinkSync(summaryPath);
        } catch (e) {
          // Ignore errors reading summary
        }
      }
      
      if (showStatus && statusLine) {
        // Clear the spinner line and show compact summary
        const emoji = getTestEmoji(testType);
        const displayName = getTestDisplayName(testType);
        const resultIcon = code === 0 ? '✅' : '❌';
        
        // Build compact summary line
        const files = summary.files || 0;
        const issues = summary.issues || 0;
        const warnings = summary.warnings || 0;
        const filesWithIssues = summary.filesWithIssues || 0;
        const passing = Math.max(0, files - filesWithIssues);
        
        let summaryParts = [];
        if (files > 0) {
          const itemName = files === 1 ? 'file' : 'files';
          summaryParts.push(`📄 ${files} ${itemName} checked`);
        }
        summaryParts.push(`✅ ${passing} passing`);
        if (issues > 0) {
          summaryParts.push(`❌ ${issues} issue${issues === 1 ? '' : 's'}`);
        }
        if (warnings > 0) {
          summaryParts.push(`⚠️  ${warnings} warning${warnings === 1 ? '' : 's'}`);
        }
        
        const compactSummary = summaryParts.join(', ');
        const compactLine = `${resultIcon} ${emoji} ${displayName}: ${compactSummary}`;
        
        // Clear the spinner line and write compact summary
        process.stdout.write(`\r${' '.repeat(statusLine.length + 2)}\r`);
        process.stdout.write(`${compactLine}\n`);
      }
      
      if (code === 0) {
        resolve({ testType, passed: true, warnings: summary.warnings || 0 });
      } else {
        resolve({ testType, passed: false, warnings: summary.warnings || 0 });
      }
    });
    
    child.on('error', (error) => {
      // Stop spinner
      if (spinnerInterval) {
        clearInterval(spinnerInterval);
        spinnerInterval = null;
      }
      
      if (showStatus && statusLine) {
        const emoji = getTestEmoji(testType);
        const displayName = getTestDisplayName(testType);
        process.stdout.write(`\r${' '.repeat(statusLine.length + 2)}\r`);
        process.stdout.write(`❌ ${emoji} ${displayName}\n`);
      }
      resolve({ testType, passed: false, error: error.message });
    });
  });
}

async function runFastTests() {
  console.log('Running fast tests...\n');
  
  const results = [];
  
  for (let i = 0; i < fastTests.length; i++) {
    const testType = fastTests[i];
    const result = await runTest(testType, true, true); // compact = true for group runs
    result.emoji = getTestEmoji(testType);
    results.push(result);
    // Single newline between tests (except after last test)
    if (i < fastTests.length - 1) {
      console.log('');
    }
  }
  const allPassed = printOverallSummary(results);
  process.exit(allPassed ? 0 : 1);
}

async function runAllTests() {
  console.log('Running all tests...\n');
  
  const results = [];
  
  for (let i = 0; i < allTests.length; i++) {
    const testType = allTests[i];
    const result = await runTest(testType, true, true); // compact = true for group runs
    result.emoji = getTestEmoji(testType);
    results.push(result);
    // Single newline between tests (except after last test)
    if (i < allTests.length - 1) {
      console.log('');
    }
  }
  const allPassed = printOverallSummary(results);
  process.exit(allPassed ? 0 : 1);
}

async function main() {
  const testType = process.argv[2];
  
  if (!testType) {
    listTests();
    process.exit(0);
  }
  
  if (testType === 'fast') {
    await runFastTests();
    // runFastTests handles its own exit
    return;
  }
  
  if (testType === 'all') {
    await runAllTests();
    // runAllTests handles its own exit
    return;
  }
  
  if (!testTypes[testType]) {
    console.error(`❌ Unknown test type: ${testType}\n`);
    listTests();
    process.exit(1);
  }
  
  const result = await runTest(testType, false, false); // compact = false for individual runs
  process.exit(result.passed ? 0 : 1);
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
