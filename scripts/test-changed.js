#!/usr/bin/env node

/**
 * Test Changed Files
 * 
 * Runs authoring-related tests on files changed since last commit.
 * Tests: spell, frontmatter, markdown, links-yaml, seo-meta
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get files changed since last commit
function getChangedFiles() {
  try {
    const output = execSync('git diff --name-only --diff-filter=ACMR HEAD', {
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    const changedFiles = output.trim().split('\n').filter(line => line.trim());
    
    // Filter for relevant files (markdown, yaml)
    return changedFiles.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.md', '.yaml', '.yml'].includes(ext) && file.startsWith('src/');
    });
  } catch (error) {
    console.error('Error getting changed files from git:', error.message);
    return [];
  }
}

// Run a test and return results
function runTest(testName, useChanged = false) {
  try {
    let command;
    if (useChanged) {
      // Run test directly with --changed flag for formatted output
      command = `node scripts/test/${testName}.js --changed`;
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
    console.log('✅ No markdown or YAML files changed since last commit');
    process.exit(0);
  }
  
  console.log(`\n📝 Checking ${changedFiles.length} changed file(s):`);
  changedFiles.forEach(file => console.log(`   ${file}`));
  console.log('');
  
  const tests = [
    { name: 'spell', useChanged: true, scope: 'changed files only' },
    { name: 'frontmatter', useChanged: true, scope: 'changed files only' },
    { name: 'markdown', useChanged: true, scope: 'changed files only' },
    { name: 'links-yaml', useChanged: true, scope: 'changed files only' },
    { name: 'seo-meta', useChanged: true, scope: 'changed files only (if markdown files changed)' }
  ];
  
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

