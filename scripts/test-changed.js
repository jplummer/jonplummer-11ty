#!/usr/bin/env node

/**
 * Test Changed Files
 *
 * Runs authoring-related tests on files changed since last commit.
 * Test list comes from the 'changed' group in scripts/test-manifest.js —
 * the single source of truth for which content-authoring tests support --changed.
 */

const { execSync } = require('child_process');
const path = require('path');
const { getChangedFilesSinceHead } = require('./utils/test-helpers');
const { getTestsByGroup, getTestScriptBasename } = require('./test-manifest');

const CHANGED_TESTS = getTestsByGroup('changed');

function getChangedFiles() {
  return getChangedFilesSinceHead().filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.md', '.yaml', '.yml', '.css'].includes(ext) && file.startsWith('src/');
  });
}

// Run a test and return results
function runTest(testName, useChanged = false) {
  try {
    let command;
    if (useChanged) {
      // Map test name to script file name
      const scriptName = getTestScriptBasename(testName) || testName;
      // Run test directly with --changed flag for formatted output
      command = `node scripts/test/${scriptName}.js --changed`;
    } else {
      // Run through test-runner (checks all files)
      command = `node scripts/test-runner.js ${testName}`;
    }
    
    execSync(command, {
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: 'inherit' // Show output directly
    });
    return { success: true };
  } catch (error) {
    return { 
      success: false,
      code: error.status || 1
    };
  }
}

// Main function
function main() {
  const changedFiles = getChangedFiles();

  if (changedFiles.length === 0) {
    console.log('✅ No markdown, YAML, or CSS files changed since last commit');
    process.exit(0);
  }

  console.log(`\n📝 Checking ${changedFiles.length} changed file(s):`);
  changedFiles.forEach(file => console.log(`   ${file}`));
  console.log('');

  const tests = CHANGED_TESTS.map(({ id }) => ({
    name: id,
    useChanged: true,
    scope: 'changed files only'
  }));

  let allPassed = true;
  const results = [];
  
  for (const test of tests) {
    console.log(`\n🔍 Running ${test.name} (${test.scope})...`);
    const result = runTest(test.name, test.useChanged);
    results.push({ name: test.name, ...result });
    
    if (!result.success) {
      allPassed = false;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary:');
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`  ${icon} ${result.name}`);
  });
  
  if (allPassed) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. See output above for details.');
    process.exit(1);
  }
}

main();

