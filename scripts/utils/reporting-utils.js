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
  const { customSections = [], compact = false } = options;
  
  // Check if there are issues
  let hasIssues = false;
  if (Array.isArray(metrics)) {
    // Check if any metric indicates issues (errors, issues, warnings > 0, or files with issues > 0)
    hasIssues = metrics.some(m => {
      const label = m.label.toLowerCase();
      const value = typeof m.value === 'number' ? m.value : 0;
      return (label.includes('error') || label.includes('issue') || label.includes('warning') || 
              (label.includes('with') && label.includes('issue'))) && value > 0;
    });
  } else if (metrics && typeof metrics === 'object') {
    hasIssues = (metrics.errors > 0 || metrics.issues > 0 || metrics.warnings > 0);
  }
  
  // In compact mode for passing tests, suppress output (test runner will show its own summary)
  if (compact && !hasIssues) {
    return;
  }
  
  // Full summary for failing tests or non-compact mode
  console.log(`${emoji} ${testType} Summary:`);
  
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
    // Standard metrics array format - show only issues and warnings counts
    const issuesMetric = metrics.find(m => m.label.toLowerCase().includes('issue') || m.label.toLowerCase().includes('error'));
    const warningsMetric = metrics.find(m => m.label.toLowerCase().includes('warning'));
    const summaryParts = [];
    if (issuesMetric && issuesMetric.value > 0) {
      summaryParts.push(`${issuesMetric.value} issue${issuesMetric.value === 1 ? '' : 's'}`);
    }
    if (warningsMetric && warningsMetric.value > 0) {
      summaryParts.push(`${warningsMetric.value} warning${warningsMetric.value === 1 ? '' : 's'}`);
    }
    if (summaryParts.length > 0) {
      console.log(`   ${summaryParts.join(', ')}`);
    }
  }
  
  // Print grouped issue/warning counts if provided
  if (options.issueTypes && options.issueTypes.size > 0) {
    const issueCounts = Array.from(options.issueTypes.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .map(([type, count]) => `${count} ${type}`)
      .join(', ');
    console.log(`   Issues by type: ${issueCounts}`);
  }
  
  if (options.warningTypes && options.warningTypes.size > 0) {
    const warningCounts = Array.from(options.warningTypes.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .map(([type, count]) => `${count} ${type}`)
      .join(', ');
    console.log(`   Warnings by type: ${warningCounts}`);
  }
  
  // Print custom sections (like accessibility's light/dark mode)
  customSections.forEach(section => {
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
    warningList = null,
    compact = false
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
    const message = warningMessage || `\n⚠️  No critical issues, but consider addressing warnings.`;
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
    // Only show success message if not in compact mode (compact mode suppresses it)
    if (!compact) {
      const message = successMessage || `\n🎉 All ${testType} passed.`;
      console.log(message);
    }
    process.exit(0);
  }
}

/**
 * Test type emoji mapping
 * Provides unique emojis for each test type for easy terminal distinction
 * Trailing spaces are added to some emojis to work around rendering oddities of the MacOS terminal
 */
const TEST_EMOJIS = {
  'accessibility': '♿',
  'frontmatter': '📁',
  'html': '🧩',
  'internal-links': '🔗',
  'links-yaml': '📌',
  'markdown': '✏️ ',
  'spell': '🔤',
  'og-images': '🖼️ ',
  'rss-feed': '📡',
  'seo-meta': '🎯',
  'deploy': '🚀',
  'security-audit': '👮🏻‍♀️'
};

/**
 * Get emoji for a test type
 * @param {string} testType - Test type key
 * @returns {string} Emoji for the test type
 * Facepalm is the default to make underfined test types stand out
 */
function getTestEmoji(testType) {
  return TEST_EMOJIS[testType] || '🤦🏻‍♀️';
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
    'frontmatter': 'Frontmatter',
    'markdown': 'Markdown',
    'spell': 'Spell Check',
    'seo': 'SEO Meta',
    'seo-meta': 'SEO Meta',
    'accessibility': 'Accessibility',
    'rss': 'RSS Feed',
    'rss-feed': 'RSS Feed',
    'og-images': 'OG Images',
    'deploy': 'Deploy',
    'security-audit': 'Security Audit'
  };
  return displayNames[testType] || testType;
}

/**
 * Print overall test suite summary
 * @param {Array} results - Array of test result objects { testType: string, passed: boolean, emoji?: string, warnings?: number }
 */
function printOverallSummary(results) {
  // Handle empty results array edge case
  if (!results || results.length === 0) {
    console.log('');
    console.log('📊 Overall Test Summary');
    console.log('');
    console.log('   🤷 No tests were run. Did you forget to invite them?');
    console.log('');
    return true;
  }
  
  const passed = results.filter(r => r.passed);
  const failed = results.filter(r => !r.passed);
  const total = results.length;
  const totalWarnings = results.reduce((sum, r) => sum + (r.warnings || 0), 0);
  const testsWithWarnings = results.filter(r => (r.warnings || 0) > 0);
  
  console.log('');
  console.log('📊 Overall Test Summary');
  console.log('');
  console.log(`   Total tests: ${total}`);
  console.log(`   ✅ Passed: ${passed.length}`);
  console.log(`   ❌ Failed: ${failed.length}`);
  if (totalWarnings > 0) {
    console.log(`   ⚠️  Warnings: ${totalWarnings} (across ${testsWithWarnings.length} test${testsWithWarnings.length === 1 ? '' : 's'})`);
  }
  console.log('');
  
  if (passed.length > 0) {
    console.log('   ✅ Passed tests:');
    passed.forEach(result => {
      const emoji = result.emoji || getTestEmoji(result.testType);
      const displayName = getTestDisplayName(result.testType);
      const warningNote = (result.warnings || 0) > 0 ? ` (${result.warnings} warning${result.warnings === 1 ? '' : 's'})` : '';
      console.log(`      ${emoji} ${displayName}${warningNote}`);
    });
    console.log('');
  }
  
  if (failed.length > 0) {
    console.log(`   ❌ Failed tests:`);
    failed.forEach(result => {
      const emoji = result.emoji || getTestEmoji(result.testType);
      const displayName = getTestDisplayName(result.testType);
      const warningNote = (result.warnings || 0) > 0 ? ` (${result.warnings} warning${result.warnings === 1 ? '' : 's'})` : '';
      console.log(`      ${emoji} ${displayName}${warningNote}`);
    });
    console.log('');
  }
  
  // Collect tests that need attention (failures or warnings)
  const testsNeedingAttention = results.filter(r => !r.passed || (r.warnings || 0) > 0);
  
  if (failed.length > 0) {
    console.log('\n❌ Some tests failed. Please review the output above.');
    if (totalWarnings > 0) {
      console.log(`⚠️  Note: ${totalWarnings} warning${totalWarnings === 1 ? '' : 's'} found across ${testsWithWarnings.length} test${testsWithWarnings.length === 1 ? '' : 's'}.`);
    }
    
    // Show details tip after failure message
    if (testsNeedingAttention.length > 0) {
      console.log('');
      console.log('💡 To see details, run:');
      testsNeedingAttention.forEach(result => {
        console.log(`   pnpm run test ${result.testType}`);
      });
      console.log('');
    }
    
    return false;
  } else {
    if (totalWarnings > 0) {
      console.log(`\n🎉 All tests passed! ⚠️  ${totalWarnings} warning${totalWarnings === 1 ? '' : 's'} found across ${testsWithWarnings.length} test${testsWithWarnings.length === 1 ? '' : 's'}.`);
    } else {
      console.log('\n🎉 All tests passed!');
    }
    
    // Show details tip after success message (if there are warnings)
    if (testsNeedingAttention.length > 0) {
      console.log('');
      console.log('💡 To see details, run:');
      testsNeedingAttention.forEach(result => {
        console.log(`   pnpm run test ${result.testType}`);
      });
      console.log('');
    }
    
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
