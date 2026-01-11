#!/usr/bin/env node

/**
 * Verification Script for Test Utility Consolidation
 * 
 * This script verifies that all test utilities are properly exported and
 * accessible after consolidation. Run this before and after consolidation
 * to ensure nothing breaks.
 */

const fs = require('fs');
const path = require('path');

// Expected exports from consolidated files
const EXPECTED_EXPORTS = {
  'test-results': [
    // Result Building
    'createTestResult',
    'addFile',
    'addIssue',
    'addWarning',
    'addGlobalIssue',
    'addCustomSection',
    'finalizeTestResult',
    'outputResult',
    // Reporting Helpers
    'getTestEmoji',
    'getTestDisplayName',
    'printSummary',
    'exitWithResults',
    'printOverallSummary',
    'TEST_EMOJIS',
    // Formatting
    'formatCompact',
    'formatVerbose',
    'formatVerboseByType',
    'formatBuild',
    'groupIssuesByType'
  ],
  'test-helpers': [
    'checkSiteDirectory',
    'getHtmlFiles',
    'getMarkdownFiles',
    'getRelativePath',
    'readFile'
  ]
};

// Files that use these utilities
const FILES_TO_CHECK = [
  'scripts/test-runner.js',
  'scripts/test/html.js',
  'scripts/test/seo-meta.js',
  'scripts/test/frontmatter.js',
  'scripts/test/links-yaml.js',
  'scripts/test/markdown.js',
  'scripts/test/spell.js',
  'scripts/test/accessibility.js',
  'scripts/test/internal-links.js',
  'scripts/test/og-images.js',
  'scripts/test/rss-feed.js',
  'scripts/security/security-audit.js'
];

function checkExports(filePath, expectedExports) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    return { exists: false, error: 'File not found' };
  }
  
  try {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve(fullPath)];
    const module = require(fullPath);
    
    const missing = [];
    const found = [];
    
    expectedExports.forEach(exportName => {
      if (module[exportName] !== undefined) {
        found.push(exportName);
      } else {
        missing.push(exportName);
      }
    });
    
    return {
      exists: true,
      found,
      missing,
      allPresent: missing.length === 0
    };
  } catch (error) {
    return {
      exists: true,
      error: error.message
    };
  }
}

function checkFileImports(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    return { exists: false };
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const imports = [];
  
  // Find all require() statements for utils
  const requireRegex = /require\(['"](\.\.\/)*utils\/([^'"]+)['"]\)/g;
  let match;
  
  while ((match = requireRegex.exec(content)) !== null) {
    imports.push({
      line: content.substring(0, match.index).split('\n').length,
      module: match[2],
      fullMatch: match[0]
    });
  }
  
  return {
    exists: true,
    imports
  };
}

function main() {
  console.log('🔍 Verifying Test Utilities\n');
  
  let allPassed = true;
  const results = {};
  
  // Check each utility file
  console.log('Checking consolidated utility file exports...\n');
  Object.entries(EXPECTED_EXPORTS).forEach(([fileName, exports]) => {
    const filePath = `scripts/utils/${fileName}.js`;
    const result = checkExports(filePath, exports);
    results[fileName] = result;
    
    if (!result.exists) {
      console.log(`❌ ${fileName}.js: File not found`);
      allPassed = false;
    } else if (result.error) {
      console.log(`❌ ${fileName}.js: Error - ${result.error}`);
      allPassed = false;
    } else if (!result.allPresent) {
      console.log(`❌ ${fileName}.js: Missing exports: ${result.missing.join(', ')}`);
      allPassed = false;
    } else {
      console.log(`✅ ${fileName}.js: All exports present (${exports.length} exports)`);
    }
  });
  
  // Check imports in files that use utilities
  console.log('\n\nChecking imports in test files...\n');
  FILES_TO_CHECK.forEach(filePath => {
    const result = checkFileImports(filePath);
    
    if (!result.exists) {
      console.log(`⚠️  ${filePath}: File not found (may be expected)`);
    } else if (result.imports.length === 0) {
      console.log(`ℹ️  ${filePath}: No utility imports found`);
    } else {
      const modules = [...new Set(result.imports.map(i => i.module))];
      console.log(`✅ ${filePath}: Imports ${modules.length} utility module(s): ${modules.join(', ')}`);
    }
  });
  
  // Summary
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ All utility files have expected exports');
    console.log('\nNext steps:');
    console.log('1. Run this script again after consolidation');
    console.log('2. Compare outputs to ensure all exports still available');
    console.log('3. Run: pnpm run test all');
    process.exit(0);
  } else {
    console.log('❌ Some utility files are missing exports');
    console.log('\nFix the issues above before proceeding with consolidation.');
    process.exit(1);
  }
}

main();

