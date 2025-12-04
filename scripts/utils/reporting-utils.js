#!/usr/bin/env node

/**
 * Reporting Utilities
 * 
 * Common functions for formatting test results and summaries
 */

/**
 * Print test summary with formatted metrics
 * 
 * Supports multiple formats:
 * - Test scripts: printSummary('Test Name', '🎯', [{ label: 'Files', value: 10 }])
 * - Content scripts: printSummary('Script Name', '📝', contentResults) where contentResults is { updated, skipped, errors }
 * 
 * @param {string} testType - Name of the test type (e.g., "Accessibility Validation")
 * @param {string} emoji - Unique emoji for this test type
 * @param {Array|Object} metrics - Array of metric objects { label: string, value: any }, or content results object
 * @param {Object} options - Additional options
 * @param {Array} options.customSections - Array of custom section objects { title: string, lines: string[] }
 */
function printSummary(testType, emoji, metrics, options = {}) {
  const { customSections = [] } = options;
  
  console.log(`\n${emoji} ${testType} Summary:`);
  
  // Handle content script format: { updated, skipped, errors }
  if (metrics && typeof metrics === 'object' && !Array.isArray(metrics)) {
    if (typeof metrics.updated === 'number' || typeof metrics.skipped === 'number' || typeof metrics.errors === 'number') {
      // Content script results format
      if (typeof metrics.updated === 'number') {
        console.log(`   Updated: ${metrics.updated}`);
      }
      if (typeof metrics.skipped === 'number') {
        console.log(`   Skipped: ${metrics.skipped}`);
      }
      if (typeof metrics.errors === 'number') {
        console.log(`   Errors: ${metrics.errors}`);
      }
    } else {
      // Fallback: treat as metrics array (shouldn't happen, but be safe)
      if (Array.isArray(metrics)) {
        metrics.forEach(metric => {
          console.log(`   ${metric.label}: ${metric.value}`);
        });
      }
    }
  } else if (Array.isArray(metrics)) {
    // Standard metrics array format
    metrics.forEach(metric => {
      console.log(`   ${metric.label}: ${metric.value}`);
    });
  }
  
  // Print custom sections (like accessibility's light/dark mode)
  customSections.forEach(section => {
    console.log('');
    console.log(`   ${section.title}:`);
    section.lines.forEach(line => {
      console.log(`      ${line}`);
    });
  });
}

/**
 * Exit with appropriate code and message based on results
 * 
 * Supports multiple result formats:
 * - Test scripts: exitWithResults(issues, warnings, options)
 * - Content scripts: exitWithResults({ errors }, 0, options) or exitWithResults(contentResults, 0, options)
 * - Security audit: exitWithResults({ failures: [], warnings: [] }, 0, options)
 * 
 * @param {number|Object} issues - Number of critical issues, or result object with errors/failures
 * @param {number|Array} warnings - Number of warnings, or array of warnings (for security audit)
 * @param {Object} options - Additional options
 * @param {string} options.testType - Test type name for success message
 * @param {string} options.issueMessage - Custom issue message
 * @param {string} options.warningMessage - Custom warning message
 * @param {string} options.successMessage - Custom success message
 * @param {Function} options.customExitLogic - Custom function to determine exit behavior
 * @param {Array} options.issueList - Array of issue messages to print (for security audit)
 * @param {Array} options.warningList - Array of warning messages to print (for security audit)
 */
function exitWithResults(issues, warnings = 0, options = {}) {
  const {
    testType = 'validation',
    issueMessage = null,
    warningMessage = null,
    successMessage = null,
    customExitLogic = null,
    issueList = null,
    warningList = null
  } = options;
  
  // Normalize input: handle result objects (content scripts, security audit)
  let issuesCount = 0;
  let warningsCount = 0;
  
  if (typeof issues === 'object' && issues !== null) {
    // Content script format: { errors, updated, skipped }
    if (typeof issues.errors === 'number') {
      issuesCount = issues.errors;
      warningsCount = typeof warnings === 'number' ? warnings : 0;
    }
    // Security audit format: { failures: [], warnings: [] }
    else if (Array.isArray(issues.failures)) {
      issuesCount = issues.failures.length;
      warningsCount = Array.isArray(issues.warnings) ? issues.warnings.length : 0;
      // Use provided lists if available
      if (issueList === null && issues.failures.length > 0) {
        options.issueList = issues.failures;
      }
      if (warningList === null && issues.warnings && issues.warnings.length > 0) {
        options.warningList = issues.warnings;
      }
    }
    // Fallback: assume it's a number-like object
    else {
      issuesCount = Number(issues) || 0;
      warningsCount = typeof warnings === 'number' ? warnings : (Array.isArray(warnings) ? warnings.length : 0);
    }
  } else {
    // Standard format: numbers
    issuesCount = Number(issues) || 0;
    warningsCount = typeof warnings === 'number' ? warnings : (Array.isArray(warnings) ? warnings.length : 0);
  }
  
  // Use custom exit logic if provided
  if (customExitLogic) {
    customExitLogic(issuesCount, warningsCount);
    return;
  }
  
  // Default exit logic
  if (issuesCount > 0) {
    const message = issueMessage || `\n❌ ${testType} issues found that need attention.`;
    console.log(message);
    
    // Print issue list if provided (for security audit)
    if (issueList && issueList.length > 0) {
      console.log('');
      console.log('Issues:');
      issueList.forEach(issue => {
        console.log(`  - ${issue}`);
      });
      console.log('');
    }
    
    process.exit(1);
  } else if (warningsCount > 0) {
    const message = warningMessage || `\n⚠️ No critical issues, but consider addressing warnings.`;
    console.log(message);
    
    // Print warning list if provided (for security audit)
    if (warningList && warningList.length > 0) {
      console.log('');
      console.log('Warnings:');
      warningList.forEach(warning => {
        console.log(`  - ${warning}`);
      });
      console.log('');
    }
    
    process.exit(0);
  } else {
    const message = successMessage || `\n🎉 All ${testType} passed.`;
    console.log(message);
    process.exit(0);
  }
}

/**
 * Test type emoji mapping
 * Provides unique emojis for each test type for easy terminal distinction
 */
const TEST_EMOJIS = {
  'accessibility': '♿',
  'content-structure': '📝',
  'html': '🧩',
  'internal-links': '🔗',
  'links-yaml': '📌',
  'markdown': '✏️',
  'rss-feed': '📡',
  'seo-meta': '🎯',
  'deploy': '🚀'
};

/**
 * Get emoji for a test type
 * @param {string} testType - Test type key
 * @returns {string} Emoji for the test type
 */
function getTestEmoji(testType) {
  return TEST_EMOJIS[testType] || '🤦';
}

/**
 * Get display name for test type
 * @param {string} testType - Test type key
 * @returns {string} Display name
 */
function getTestDisplayName(testType) {
  const displayNames = {
    'html': 'HTML Validation',
    'links-yaml': 'Links YAML',
    'internal-links': 'Internal Links',
    'content': 'Content Structure',
    'content-structure': 'Content Structure',
    'markdown': 'Markdown',
    'seo': 'SEO Meta',
    'seo-meta': 'SEO Meta',
    'accessibility': 'Accessibility',
    'rss': 'RSS Feed',
    'rss-feed': 'RSS Feed',
    'deploy': 'Deploy'
  };
  return displayNames[testType] || testType;
}

/**
 * Print overall test suite summary
 * @param {Array} results - Array of test result objects { testType: string, passed: boolean, emoji?: string }
 */
function printOverallSummary(results) {
  const passed = results.filter(r => r.passed);
  const failed = results.filter(r => !r.passed);
  const total = results.length;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Overall Test Summary');
  console.log('='.repeat(60));
  console.log(`   Total tests: ${total}`);
  console.log(`   ✅ Passed: ${passed.length}`);
  console.log(`   ❌ Failed: ${failed.length}`);
  console.log('');
  
  if (passed.length > 0) {
    console.log('   ✅ Passed tests:');
    passed.forEach(result => {
      const emoji = result.emoji || getTestEmoji(result.testType);
      const displayName = getTestDisplayName(result.testType);
      console.log(`      ${emoji} ${displayName}`);
    });
    console.log('');
  }
  
  if (failed.length > 0) {
    console.log('   ❌ Failed tests:');
    failed.forEach(result => {
      const emoji = result.emoji || getTestEmoji(result.testType);
      const displayName = getTestDisplayName(result.testType);
      console.log(`      ${emoji} ${displayName}`);
    });
    console.log('');
  }
  
  console.log('='.repeat(60));
  
  if (failed.length > 0) {
    console.log('\n❌ Some tests failed. Please review the output above.');
    return false;
  } else {
    console.log('\n🎉 All tests passed!');
    return true;
  }
}

module.exports = {
  printSummary,
  exitWithResults,
  getTestEmoji,
  getTestDisplayName,
  printOverallSummary,
  TEST_EMOJIS
};

