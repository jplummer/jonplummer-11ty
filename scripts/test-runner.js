#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const { printOverallSummary, getTestEmoji, getTestDisplayName } = require('./utils/reporting-utils');
const { formatCompact, formatVerbose, formatBuild } = require('./utils/test-formatter');
const { SPINNER_FRAMES } = require('./utils/spinner-utils');

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
  'links-yaml',
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
  'links-yaml',
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

function runTest(testType, showStatus = false, compact = false, formatOptions = {}) {
  const scriptPath = path.join(__dirname, 'test', testTypes[testType]);
  
  return new Promise((resolve, reject) => {
    let spinnerInterval = null;
    let statusLine = '';
    let progressInfo = '';
    let spinnerFrame = 0;
    
    // Always show spinner for all tests
    const emoji = getTestEmoji(testType);
    const displayName = getTestDisplayName(testType);
    statusLine = `${emoji} ${displayName}...`;
    
    // Start spinner animation
    spinnerInterval = setInterval(() => {
      const spinner = SPINNER_FRAMES[spinnerFrame];
      const fullLine = progressInfo ? `${statusLine} (${progressInfo})` : statusLine;
      process.stdout.write(`\r${spinner} ${fullLine}`);
      spinnerFrame = (spinnerFrame + 1) % SPINNER_FRAMES.length;
    }, 100);
    
    // Set environment variable to indicate compact mode
    const env = { ...process.env };
    if (compact) {
      env.TEST_COMPACT_MODE = 'true';
    }
    
    // Capture stdout to detect JSON output, but pass through stderr for progress
    let stdoutData = '';
    let stderrData = '';
    
    const child = spawn('node', [scriptPath], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: false,
      env: env
    });
    
    // Collect stdout
    child.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });
    
    // Parse stderr for progress updates and pass through other output
    child.stderr.on('data', (data) => {
      const text = data.toString();
      stderrData += text;
      
      // Check for progress updates in format: __TEST_PROGRESS__current/total__
      const progressMatch = text.match(/__TEST_PROGRESS__(\d+)\/(\d+)__/);
      if (progressMatch) {
        progressInfo = `${progressMatch[1]}/${progressMatch[2]}`;
        // Don't write the progress marker to console, just update our progress info
        return;
      }
      
      // Write other stderr directly to console so progress shows in real-time
      process.stderr.write(text);
    });
    
    child.on('close', (code) => {
      // Stop spinner
      if (spinnerInterval) {
        clearInterval(spinnerInterval);
        spinnerInterval = null;
      }
      
      const fs = require('fs');
      let summary = { files: 0, issues: 0, warnings: 0 };
      let isJsonFormat = false;
      let jsonResult = null;
      
      // Check if output contains JSON (new format)
      if (stdoutData.includes('__TEST_JSON_START__') && stdoutData.includes('__TEST_JSON_END__')) {
        // Extract JSON between markers
        const startMarker = '__TEST_JSON_START__';
        const endMarker = '__TEST_JSON_END__';
        const startIdx = stdoutData.indexOf(startMarker) + startMarker.length;
        const endIdx = stdoutData.indexOf(endMarker);
        
        if (startIdx > 0 && endIdx > startIdx) {
          const jsonStr = stdoutData.substring(startIdx, endIdx).trim();
          try {
            jsonResult = JSON.parse(jsonStr);
            isJsonFormat = true;
            // Extract summary from JSON
            summary = {
              files: jsonResult.summary?.files || 0,
              issues: jsonResult.summary?.issues || 0,
              warnings: jsonResult.summary?.warnings || 0,
              filesWithIssues: jsonResult.summary?.filesWithIssues || 0
            };
          } catch (e) {
            // JSON parse failed - this shouldn't happen with new format tests
            console.error('Warning: Failed to parse JSON output from test');
            console.error(`  Test: ${testType}`);
            console.error(`  Error: ${e.message}`);
          }
        }
      }
      
      // Don't output raw stdout if JSON was detected - we'll format it below
      // For tests without JSON markers (like deploy.js), pass through stdout directly
      if (stdoutData && !isJsonFormat) {
        process.stdout.write(stdoutData);
      }
      
      // Build summary string with only relevant parts
      function buildSummaryString(summary) {
        const files = summary.files || 0;
        const issues = summary.issues || 0;
        const warnings = summary.warnings || 0;
        // Use passed field if available, otherwise calculate
        const passing = summary.passed !== undefined ? summary.passed : Math.max(0, files - (summary.filesWithIssues || 0));
        
        let summaryParts = [];
        if (files > 0) {
          const itemName = files === 1 ? 'file' : 'files';
          summaryParts.push(`📄 ${files} ${itemName} checked`);
        }
        if (passing > 0) {
          summaryParts.push(`✅ ${passing} passing`);
        }
        if (issues > 0) {
          summaryParts.push(`❌ ${issues} issue${issues === 1 ? '' : 's'}`);
        }
        if (warnings > 0) {
          summaryParts.push(`⚠️  ${warnings} warning${warnings === 1 ? '' : 's'}`);
        }
        
        return summaryParts.join(', ');
      }
      
      // Finalize summary if we have JSON result
      let finalSummary = summary;
      if (isJsonFormat && jsonResult) {
        // Ensure summary is finalized (safe to call multiple times)
        const { finalizeTestResult } = require('./utils/test-result-builder');
        finalizeTestResult(jsonResult);
        // Use finalized summary
        finalSummary = jsonResult.summary || summary;
      }
      
      // Determine result icon based on issues/warnings (errors take precedence)
      let resultIcon = '✅';
      if (finalSummary.issues > 0) {
        resultIcon = '❌';
      } else if (finalSummary.warnings > 0) {
        resultIcon = '⚠️ ';
      }
      
      // Format and show output
      if (isJsonFormat && jsonResult) {
        // Use format based on options
        let formattedOutput;
        if (formatOptions.format === 'build') {
          formattedOutput = formatBuild(jsonResult);
          // Clear spinner line and write build format output
          process.stdout.write(`\r\x1b[K${formattedOutput}\n`);
        } else if (showStatus) {
          // Group runs: update same line with result icon and summary
          const summaryString = buildSummaryString(finalSummary);
          const finalLine = `${resultIcon} ${emoji} ${displayName}: ${summaryString}`;
          // Clear spinner line and write final result on same line
          // Use ANSI escape code to clear from cursor to end of line, then write new content
          process.stdout.write(`\r\x1b[K${finalLine}\n`);
        } else {
          // Individual runs: use verbose format (which includes compact at top)
          formattedOutput = formatVerbose(jsonResult, formatOptions);
          // Clear spinner line
          process.stdout.write(`\r\x1b[K${formattedOutput}\n`);
        }
      } else if (!showStatus) {
        // Non-JSON output (e.g., deploy.js): output was already passed through for individual runs
        // No additional formatting needed
      } else {
        // Non-JSON output in group runs: just clear spinner, output was already shown
        process.stdout.write(`\r\x1b[K`);
      }
      
      if (code === 0) {
        resolve({ testType, passed: true, warnings: finalSummary.warnings || 0 });
      } else {
        resolve({ testType, passed: false, warnings: finalSummary.warnings || 0 });
      }
    });
    
    child.on('error', (error) => {
      // Stop spinner
      if (spinnerInterval) {
        clearInterval(spinnerInterval);
        spinnerInterval = null;
      }
      
      // Clear spinner and show error icon
      process.stdout.write(`\r${' '.repeat(statusLine.length + 2)}\r`);
      process.stdout.write(`❌ ${statusLine}\n`);
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

function parseArgs() {
  const args = process.argv.slice(2);
  const testType = args[0];
  const formatOptions = {};
  
  // Parse flags
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--format' && args[i + 1]) {
      formatOptions.format = args[i + 1];
      i++; // Skip next arg
    } else if (args[i] === '--group-by' && args[i + 1]) {
      formatOptions.groupBy = args[i + 1];
      i++; // Skip next arg
    }
  }
  
  return { testType, formatOptions };
}

async function main() {
  const { testType, formatOptions } = parseArgs();
  
  if (!testType) {
    listTests();
    console.log('\nOptions:');
    console.log('  --format <format>     Output format: compact (default), verbose, build');
    console.log('  --group-by <type>      Group issues by: file (default), type');
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
  
  const result = await runTest(testType, false, false, formatOptions); // compact = false for individual runs
  process.exit(result.passed ? 0 : 1);
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
