#!/usr/bin/env node

/**
 * Test Results Utilities
 * 
 * Consolidated utilities for building, formatting, and reporting test results.
 * 
 * This file combines functionality from:
 * - test-result-builder.js: Building test result objects
 * - test-formatter.js: Formatting results for display
 * - reporting-utils.js: Reporting helpers and summaries
 * 
 * Sections:
 * 1. Result Building - Create and populate test result objects
 * 2. Reporting Helpers - Emoji mapping, display names, summary printing
 * 3. Formatting - Format results for different output modes (compact, verbose, build)
 */

// ============================================================================
// Section 1: Result Building
// ============================================================================

/**
 * Create a new test result object with minimum required fields
 * @param {string} testType - Test type identifier (e.g., 'html', 'rss')
 * @param {string} testName - Human-readable test name (e.g., 'HTML Validation')
 * @returns {Object} Initialized test result object
 */
function createTestResult(testType, testName) {
  return {
    testType,
    testName,
    summary: {
      files: 0,
      filesWithIssues: 0,
      filesWithWarnings: 0,
      issues: 0,
      warnings: 0,
      passed: 0
    },
    files: []
  };
}

/**
 * Add a file to the test result
 * @param {Object} result - Test result object
 * @param {string} relativePath - Relative path to the file (from site root or source)
 * @param {string} [absolutePath] - Optional absolute path (for future use)
 * @returns {Object} File object that can be used to add issues/warnings
 */
function addFile(result, relativePath, absolutePath = null) {
  const fileObj = {
    relativePath,
    status: 'passed',
    issues: [],
    warnings: []
  };
  
  // Only add absolute path if provided (not needed for most tests)
  if (absolutePath) {
    fileObj.path = absolutePath;
  }
  
  result.files.push(fileObj);
  result.summary.files++;
  return fileObj;
}

/**
 * Add an issue (error) to a file
 * @param {Object} fileObj - File object from addFile()
 * @param {Object} issue - Issue object with at minimum: { severity: 'error', type: string, message: string }
 * @returns {void}
 */
function addIssue(fileObj, issue) {
  if (!fileObj.issues) {
    fileObj.issues = [];
  }
  
  // Ensure required fields
  if (!issue.severity) {
    issue.severity = 'error';
  }
  if (!issue.type) {
    issue.type = 'unknown';
  }
  if (!issue.message) {
    issue.message = 'Unknown issue';
  }
  
  fileObj.issues.push(issue);
  fileObj.status = 'failed';
}

/**
 * Add a warning to a file
 * @param {Object} fileObj - File object from addFile()
 * @param {Object} warning - Warning object with at minimum: { severity: 'warning', type: string, message: string }
 * @returns {void}
 */
function addWarning(fileObj, warning) {
  if (!fileObj.warnings) {
    fileObj.warnings = [];
  }
  
  // Ensure required fields
  if (!warning.severity) {
    warning.severity = 'warning';
  }
  if (!warning.type) {
    warning.type = 'unknown';
  }
  if (!warning.message) {
    warning.message = 'Unknown warning';
  }
  
  fileObj.warnings.push(warning);
  // Only change status to warning if file was passing (don't override 'failed')
  if (fileObj.status === 'passed') {
    fileObj.status = 'warning';
  }
}

/**
 * Add a global issue (cross-file issue like duplicates)
 * @param {Object} result - Test result object
 * @param {Object} issue - Global issue object with at minimum: { severity: 'error', type: string, message: string }
 * @returns {void}
 */
function addGlobalIssue(result, issue) {
  if (!result.globalIssues) {
    result.globalIssues = [];
  }
  
  // Ensure required fields
  if (!issue.severity) {
    issue.severity = 'error';
  }
  if (!issue.type) {
    issue.type = 'unknown';
  }
  if (!issue.message) {
    issue.message = 'Unknown global issue';
  }
  
  result.globalIssues.push(issue);
}

/**
 * Add a custom section (for tests like accessibility with light/dark mode)
 * @param {Object} result - Test result object
 * @param {string} sectionName - Name of the custom section
 * @param {Object} data - Data for the section
 * @returns {void}
 */
function addCustomSection(result, sectionName, data) {
  if (!result.customSections) {
    result.customSections = {};
  }
  
  result.customSections[sectionName] = data;
}

/**
 * Finalize test result by calculating summary from files
 * @param {Object} result - Test result object
 * @returns {Object} Finalized test result object
 */
function finalizeTestResult(result) {
  let filesWithIssues = 0;
  let filesWithWarnings = 0;
  let totalIssues = 0;
  let totalWarnings = 0;
  let passed = 0;

  result.files.forEach(file => {
    const fileIssues = file.issues?.length || 0;
    const fileWarnings = file.warnings?.length || 0;
    
    if (fileIssues > 0) {
      filesWithIssues++;
      totalIssues += fileIssues;
      // Count warnings even if file has issues
      totalWarnings += fileWarnings;
    } else if (fileWarnings > 0) {
      filesWithWarnings++;
      totalWarnings += fileWarnings;
    } else {
      passed++;
    }
  });

  // Add global issues to total
  totalIssues += result.globalIssues?.length || 0;

  result.summary = {
    files: result.files.length,
    filesWithIssues,
    filesWithWarnings,
    issues: totalIssues,
    warnings: totalWarnings,
    passed
  };

  return result;
}

/**
 * Output result as JSON with markers for test runner to detect
 * @param {Object} result - Test result object
 * @returns {void}
 */
function outputResult(result) {
  finalizeTestResult(result);
  // Write everything in one operation to ensure markers and JSON are in same buffer
  const jsonStr = JSON.stringify(result, null, 2);
  const output = '__TEST_JSON_START__\n' + jsonStr + '\n__TEST_JSON_END__\n';
  
  // Write everything at once - for piped stdout, this should work fine
  // If the output is very large, Node.js will handle buffering automatically
  process.stdout.write(output);
  
  // Explicitly flush stdout to ensure all data is written before process exits
  if (process.stdout.flushSync) {
    try {
      process.stdout.flushSync();
    } catch (e) {
      // flushSync might not be available in all Node versions
    }
  }
}

// ============================================================================
// Section 2: Reporting Helpers
// ============================================================================

/**
 * Test type emoji mapping
 * Provides unique emojis for each test type for easy terminal distinction
 * Trailing spaces are added to some emojis to work around rendering oddities of the MacOS terminal
 */
const TEST_EMOJIS = {
  'a11y': '🌈',
  'frontmatter': '🗂️ ',
  'html': '🧩',
  'internal-links': '🔗',
  'links': '📌',
  'markdown': '✍️ ',
  'spell': '🧙',
  'og-images': '📸',
  'rss': '📡',
  'seo': '📈',
  'deploy': '🚀',
  'security': '🛡️',
  'indexnow': '📣'
};

/**
 * Get emoji for a test type
 * @param {string} testType - Test type key
 * @returns {string} Emoji for the test type
 * Facepalm is the default to make undefined test types stand out
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
    'links': 'Links YAML',
    'internal-links': 'Internal Links',
    'content': 'Content Structure',
    'frontmatter': 'Frontmatter',
    'markdown': 'Markdown',
    'spell': 'Spell Check',
    'seo': 'SEO Meta',
    'a11y': 'Accessibility',
    'rss': 'RSS Feed',
    'og-images': 'OG Images',
    'deploy': 'Deploy',
    'security': 'Security Audit'
  };
  return displayNames[testType] || testType;
}

/**
 * Get description for test type (short description for list view)
 * @param {string} testType - Test type key
 * @returns {string} Description
 */
function getTestDescription(testType) {
  const descriptions = {
    'html': 'HTML validity',
    'links': 'Links YAML structure',
    'internal-links': 'Internal link validity',
    'frontmatter': 'Frontmatter validation',
    'markdown': 'Markdown syntax',
    'spell': 'Spell checking',
    'seo': 'SEO and meta tags',
    'og-images': 'Open Graph images',
    'a11y': 'Accessibility (WCAG compliance)',
    'rss': 'RSS feed validation',
    'deploy': 'Deployment connectivity',
    'indexnow': 'IndexNow configuration',
    'security': 'Security audit'
  };
  return descriptions[testType] || '';
}

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

// ============================================================================
// Section 3: Formatting
// ============================================================================

/**
 * Helper: Build summary line for test result (used in verbose output header)
 * @param {Object} result - Test result object
 * @returns {string} Summary line
 */
function buildSummaryLine(result) {
  const emoji = getTestEmoji(result.testType);
  const displayName = getTestDisplayName(result.testType);
  const summary = result.summary;
  
  const resultIcon = summary.issues > 0 ? '❌' : '✅';
  const files = summary.files;
  const passing = summary.passed;
  const issues = summary.issues;
  const warnings = summary.warnings;
  
  // Design: Reassure first (what's good), then direct attention (what needs fixing)
  let summaryParts = [];
  if (files > 0) {
    // For security, skip "checked" line (redundant with "passing" line)
    // For other tests, show "files checked"
    if (result.testType !== 'security') {
      const itemName = files === 1 ? 'file' : 'files';
      summaryParts.push(`📄 ${files} ${itemName} checked`);
    }
  }
  // Show passing count prominently (reassuring)
  summaryParts.push(`✅ ${passing} passing`);
  // Show issues (critical) before warnings (less critical)
  if (issues > 0) {
    summaryParts.push(`❌ ${issues} issue${issues === 1 ? '' : 's'}`);
  }
  if (warnings > 0) {
    summaryParts.push(`⚠️  ${warnings} warning${warnings === 1 ? '' : 's'}`);
  }
  
  return `${resultIcon} ${emoji} ${displayName}: ${summaryParts.join(', ')}`;
}

/**
 * Helper: Extract key detail from issue message for more specific grouping
 * 
 * @param {string} message - Issue message
 * @returns {string|null} Key detail phrase, or null if none found
 */
function extractMessageDetail(message) {
  if (!message) return null;
  
  // Look for common key phrases and extract a concise detail
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('too short')) {
    return 'too short';
  }
  if (lowerMessage.includes('too long')) {
    return 'too long';
  }
  if (lowerMessage.includes('too many')) {
    // Try to extract what there are too many of
    const match = message.match(/too many\s+(\w+)/i);
    if (match) {
      return `too many ${match[1]}`;
    }
    return 'too many';
  }
  if (lowerMessage.includes('missing')) {
    // Extract what's missing
    const match = message.match(/missing\s+([^,\.]+)/i);
    if (match) {
      const detail = match[1].trim();
      // Limit length
      return detail.length > 30 ? detail.substring(0, 27) + '...' : detail;
    }
    return 'missing';
  }
  if (lowerMessage.includes('unescaped')) {
    return 'unescaped quotes';
  }
  if (lowerMessage.includes('separators')) {
    return 'too many separators';
  }
  if (lowerMessage.includes('invalid')) {
    return 'invalid';
  }
  
  return null;
}

/**
 * Helper: Group all issues by type for summary view
 * Creates more specific grouping by combining type with message detail
 * 
 * @param {Object} result - Test result object from result builder
 * @returns {Object} Object with errors and warnings arrays, each containing type summaries
 */
function groupIssuesByType(result) {
  const errorTypes = new Map();
  const warningTypes = new Map();
  
  result.files.forEach(file => {
    file.issues.forEach(issue => {
      const baseType = issue.type || 'Unknown';
      const messageDetail = extractMessageDetail(issue.message);
      // Create a more specific type key
      const type = messageDetail ? `${baseType} (${messageDetail})` : baseType;
      
      if (!errorTypes.has(type)) {
        errorTypes.set(type, { type, baseType, count: 0, files: new Set(), issues: [] });
      }
      const entry = errorTypes.get(type);
      entry.count++;
      entry.files.add(file.relativePath);
      entry.issues.push({ ...issue, file: file.relativePath });
    });
    
    file.warnings.forEach(warning => {
      const baseType = warning.type || 'Unknown';
      const messageDetail = extractMessageDetail(warning.message);
      // Create a more specific type key
      const type = messageDetail ? `${baseType} (${messageDetail})` : baseType;
      
      if (!warningTypes.has(type)) {
        warningTypes.set(type, { type, baseType, count: 0, files: new Set(), issues: [] });
      }
      const entry = warningTypes.get(type);
      entry.count++;
      entry.files.add(file.relativePath);
      entry.issues.push({ ...warning, file: file.relativePath });
    });
  });
  
  // Convert Sets to Arrays and sort by count (most common first)
  const errors = Array.from(errorTypes.values())
    .map(e => ({ ...e, files: Array.from(e.files) }))
    .sort((a, b) => b.count - a.count);
  
  const warnings = Array.from(warningTypes.values())
    .map(w => ({ ...w, files: Array.from(w.files) }))
    .sort((a, b) => b.count - a.count);
  
  return { errors, warnings };
}

/**
 * Format verbose output for individual runs
 * Starts with summary for consistency, then shows detailed by-file results
 * 
 * @param {Object} result - Test result object from result builder
 * @param {Object} options - Formatting options (currently unused, kept for API compatibility)
 * @returns {string} Formatted output string
 */
function formatVerbose(result, options = {}) {
  // Always finalize to ensure summary is calculated correctly
  finalizeTestResult(result);
  
  const output = [];
  const summary = result.summary;
  
  // Start with summary line for consistency
  output.push(buildSummaryLine(result));
  output.push('');
  
  // Show detailed results if there are issues/warnings, or if all files passed (for smoke testing)
  if (summary.issues > 0 || summary.warnings > 0) {
    // Global issues (duplicates, etc.) - show first as they're often critical
    if (result.globalIssues && result.globalIssues.length > 0) {
      output.push('🌐 Global Issues:');
      result.globalIssues.forEach(issue => {
        output.push(`  ❌ ${issue.message}`);
        if (issue.files) {
          issue.files.forEach(file => output.push(`    - ${file}`));
        }
      });
      output.push('');
    }
    
    // Issue type summary - only show when valuable (multiple issues and at least one type with >1 occurrence)
    const issueTypes = groupIssuesByType(result);
    const totalIssues = summary.issues + summary.warnings;
    const hasRepeatedType = issueTypes.errors.some(({ count }) => count > 1) || 
                           issueTypes.warnings.some(({ count }) => count > 1);
    
    if (totalIssues > 1 && hasRepeatedType) {
      output.push('📊 Issues by type:');
      if (issueTypes.errors.length > 0) {
        issueTypes.errors.forEach(({ type, count, files }) => {
          output.push(`  ❌ ${type}: ${count} occurrence${count === 1 ? '' : 's'} in ${files.length} file${files.length === 1 ? '' : 's'}`);
        });
      }
      if (issueTypes.warnings.length > 0) {
        issueTypes.warnings.forEach(({ type, count, files }) => {
          output.push(`  ⚠️  ${type}: ${count} occurrence${count === 1 ? '' : 's'} in ${files.length} file${files.length === 1 ? '' : 's'}`);
        });
      }
      output.push('');
    }
    
    // Files with issues - sorted by severity (errors first)
    const filesWithIssues = result.files.filter(f => f.issues.length > 0 || f.warnings.length > 0);
    filesWithIssues.sort((a, b) => {
      // Sort by: errors first, then warnings, then by path
      const aHasErrors = a.issues.length > 0;
      const bHasErrors = b.issues.length > 0;
      if (aHasErrors !== bHasErrors) return bHasErrors - aHasErrors;
      return a.relativePath.localeCompare(b.relativePath);
    });
    
    filesWithIssues.forEach(file => {
      output.push(`📄 ${file.relativePath}:`);
      
      // Errors first (most actionable)
      if (file.issues.length > 0) {
        output.push(`  ❌ Errors:`);
        file.issues.forEach(issue => {
          let line = `    - ${issue.message}`;
          if (issue.line) {
            line += ` (line ${issue.line}`;
            if (issue.column) line += `, col ${issue.column}`;
            line += ')';
          }
          if (issue.ruleId) line += ` [${issue.ruleId}]`;
          if (issue.helpUrl) line += `\n      Learn more: ${issue.helpUrl}`;
          output.push(line);
          if (issue.recommendation) {
            output.push(`      → ${issue.recommendation}`);
          }
          if (issue.context) {
            output.push(`      Context: ${issue.context}`);
          }
        });
      }
      
      // Warnings second
      if (file.warnings.length > 0) {
        output.push(`  ⚠️  Warnings:`);
        file.warnings.forEach(warning => {
          let line = `    - ${warning.message}`;
          if (warning.line) {
            line += ` (line ${warning.line}`;
            if (warning.column) line += `, col ${warning.column}`;
            line += ')';
          }
          if (warning.ruleId) line += ` [${warning.ruleId}]`;
          if (warning.helpUrl) line += `\n      Learn more: ${warning.helpUrl}`;
          output.push(line);
          if (warning.recommendation) {
            output.push(`      → ${warning.recommendation}`);
          }
          if (warning.context) {
            output.push(`      Context: ${warning.context}`);
          }
        });
      }
      
      output.push('');
    });
    
    // Custom sections (e.g., accessibility light/dark mode)
    if (result.customSections && Object.keys(result.customSections).length > 0) {
      Object.entries(result.customSections).forEach(([name, data]) => {
        output.push(`  ${name}:`);
        if (typeof data === 'object' && !Array.isArray(data)) {
          Object.entries(data).forEach(([key, value]) => {
            output.push(`    ${key}: ${value}`);
          });
        } else {
          output.push(`    ${data}`);
        }
        output.push('');
      });
    }
  } else {
    // All tests passed - show a brief confirmation for verbose mode
    output.push('✅ All files passed validation with no issues or warnings.');
  }
  
  return output.join('\n');
}


/**
 * Format build/deploy output for CI/CD
 * Focus: Blocking issues only, clear pass/fail
 * CRITICAL: Critical warnings are blockers (treat as errors)
 * 
 * @param {Object} result - Test result object from result builder
 * @returns {string} Formatted output string
 */
function formatBuild(result) {
  // Always finalize to ensure summary is calculated correctly
  finalizeTestResult(result);
  
  const emoji = getTestEmoji(result.testType);
  const displayName = getTestDisplayName(result.testType);
  const summary = result.summary;
  
  // Count blocking issues: errors + critical warnings
  // Critical warnings have severity: 'critical' or 'error'
  let blockingIssues = summary.issues;
  let criticalWarnings = 0;
  
  // Count critical warnings (treat as blocking)
  result.files.forEach(file => {
    file.warnings.forEach(warning => {
      if (warning.severity === 'critical' || warning.severity === 'error') {
        criticalWarnings++;
        blockingIssues++;
      }
    });
  });
  
  // Also check global issues for critical warnings
  if (result.globalIssues) {
    result.globalIssues.forEach(issue => {
      if (issue.severity === 'critical' || issue.severity === 'error') {
        blockingIssues++;
      }
    });
  }
  
  const output = [];
  
  // Clear pass/fail header
  if (blockingIssues === 0) {
    output.push(`✅ ${emoji} ${displayName}: PASSED`);
    if (result.testType === 'security' || result.testType === 'security-audit') {
      output.push(`  All checks passed (${summary.files} checks)`);
    } else {
      output.push(`  All checks passed (${summary.files} files checked)`);
    }
  } else {
    output.push(`❌ ${emoji} ${displayName}: FAILED`);
    output.push(`  ${blockingIssues} blocking issue${blockingIssues === 1 ? '' : 's'} found - deployment blocked`);
    if (criticalWarnings > 0) {
      output.push(`  (${summary.issues} error${summary.issues === 1 ? '' : 's'} + ${criticalWarnings} critical warning${criticalWarnings === 1 ? '' : 's'})`);
    }
  }
  output.push('');
  
  // Show blocking issues only (errors + critical warnings)
  if (blockingIssues > 0) {
    // Global issues first
    if (result.globalIssues && result.globalIssues.length > 0) {
      result.globalIssues.forEach(issue => {
        const isBlocking = issue.severity === 'critical' || issue.severity === 'error' || !issue.severity;
        if (isBlocking) {
          output.push(`  ❌ ${issue.message}`);
          if (issue.files) {
            issue.files.forEach(file => output.push(`    - ${file}`));
          }
        }
      });
      if (result.globalIssues.some(i => i.severity === 'critical' || i.severity === 'error' || !i.severity)) {
        output.push('');
      }
    }
    
    // Files with blocking issues
    const filesWithBlockingIssues = result.files.filter(file => {
      const hasErrors = file.issues.length > 0;
      const hasCriticalWarnings = file.warnings.some(w => w.severity === 'critical' || w.severity === 'error');
      return hasErrors || hasCriticalWarnings;
    });
    
    filesWithBlockingIssues.forEach(file => {
      output.push(`  📄 ${file.relativePath}:`);
      
      // Errors (always blocking)
      if (file.issues.length > 0) {
        file.issues.forEach(issue => {
          let line = `    ❌ ${issue.message}`;
          if (issue.line) {
            line += ` (line ${issue.line}`;
            if (issue.column) line += `, col ${issue.column}`;
            line += ')';
          }
          if (issue.ruleId) line += ` [${issue.ruleId}]`;
          output.push(line);
          if (issue.recommendation) {
            output.push(`      → ${issue.recommendation}`);
          }
        });
      }
      
      // Critical warnings (also blocking)
      const criticalWarningsInFile = file.warnings.filter(w => w.severity === 'critical' || w.severity === 'error');
      if (criticalWarningsInFile.length > 0) {
        criticalWarningsInFile.forEach(warning => {
          let line = `    ⚠️  ${warning.message} (critical)`;
          if (warning.line) {
            line += ` (line ${warning.line}`;
            if (warning.column) line += `, col ${warning.column}`;
            line += ')';
          }
          if (warning.ruleId) line += ` [${warning.ruleId}]`;
          output.push(line);
          if (warning.recommendation) {
            output.push(`      → ${warning.recommendation}`);
          }
        });
      }
      
      output.push('');
    });
    
    // Summary of non-blocking warnings (if any)
    const nonBlockingWarnings = summary.warnings - criticalWarnings;
    if (nonBlockingWarnings > 0) {
      output.push(`  ℹ️  ${nonBlockingWarnings} non-blocking warning${nonBlockingWarnings === 1 ? '' : 's'} found (not shown)`);
    }
  }
  
  return output.join('\n');
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  // Result Building
  createTestResult,
  addFile,
  addIssue,
  addWarning,
  addGlobalIssue,
  addCustomSection,
  finalizeTestResult,
  outputResult,
  
  // Reporting Helpers
  getTestEmoji,
  getTestDisplayName,
  getTestDescription,
  printSummary,
  exitWithResults,
  printOverallSummary,
  TEST_EMOJIS,
  
  // Formatting
  formatVerbose,
  formatBuild,
  groupIssuesByType
};

