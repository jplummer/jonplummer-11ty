#!/usr/bin/env node

/**
 * Test Runner Helper
 * 
 * Provides common patterns for test scripts to reduce duplication:
 * - --changed flag parsing and early exit
 * - Output formatting (direct run vs test-runner)
 * - Exit code handling
 * 
 * Usage:
 *   const { runTest, checkChangedFlag, outputAndExit } = require('../utils/test-runner-helper');
 */

const { createTestResult, outputResult, formatVerbose } = require('./test-results');

/**
 * Check if --changed flag is provided
 * @returns {boolean} True if --changed flag is present
 */
function checkChangedFlag() {
  const args = process.argv.slice(2);
  return args.includes('--changed');
}

/**
 * Create empty result and exit early (for --changed flag when no files changed)
 * @param {string} testType - Test type identifier
 * @param {string} testName - Human-readable test name
 * @param {string} message - Optional message to log
 * @returns {void} Exits process
 */
function exitWithEmptyResult(testType, testName, message = null) {
  if (message) {
    console.log(message);
  }
  const result = createTestResult(testType, testName);
  outputAndExit(result);
}

/**
 * Output result and exit with appropriate code
 * Handles both direct runs (formatted output) and test-runner (JSON output)
 * @param {Object} result - Test result object
 * @returns {void} Exits process
 */
function outputAndExit(result) {
  const isDirectRun = !process.env.TEST_RUNNER;
  
  if (isDirectRun) {
    // Direct run: show formatted output
    const formatted = formatVerbose(result, {});
    console.log(formatted);
  } else {
    // Test-runner: output JSON
    outputResult(result);
  }
  
  // Exit with appropriate code (errors block, warnings don't)
  process.exit(result.summary.issues > 0 ? 1 : 0);
}

/**
 * Run a test with common patterns handled
 * 
 * @param {Object} options - Test configuration
 * @param {string} options.testType - Test type identifier
 * @param {string} options.testName - Human-readable test name
 * @param {boolean} options.requiresSite - Whether test requires _site directory
 * @param {Function} options.validateFn - Function that performs validation and populates result
 * @param {Function} [options.getChangedFilesFn] - Function to get changed files (for --changed support)
 * @param {Function} [options.shouldSkipFn] - Function to check if test should be skipped (for --changed)
 * @param {string} [options.skipMessage] - Message to show when test is skipped
 * @returns {void} Exits process
 */
async function runTest(options) {
  const {
    testType,
    testName,
    requiresSite = false,
    validateFn,
    getChangedFilesFn = null,
    shouldSkipFn = null,
    skipMessage = null
  } = options;
  
  const useChanged = checkChangedFlag();
  
  // Handle --changed flag
  if (useChanged) {
    if (shouldSkipFn && shouldSkipFn()) {
      exitWithEmptyResult(testType, testName, skipMessage || `✅ No files changed for ${testName}`);
      return;
    }
    
    if (getChangedFilesFn) {
      const changedFiles = getChangedFilesFn();
      if (changedFiles.length === 0) {
        exitWithEmptyResult(testType, testName, `✅ No files changed since last commit`);
        return;
      }
      // Pass changedFiles to validateFn
      const result = createTestResult(testType, testName);
      await validateFn(result, { files: changedFiles, useChanged: true });
      outputAndExit(result);
      return;
    }
  }
  
  // Check site directory if needed
  if (requiresSite) {
    const { checkSiteDirectory } = require('./test-helpers');
    checkSiteDirectory();
  }
  
  // Run validation
  const result = createTestResult(testType, testName);
  await validateFn(result, { useChanged: false });
  
  // Output and exit
  outputAndExit(result);
}

module.exports = {
  checkChangedFlag,
  exitWithEmptyResult,
  outputAndExit,
  runTest
};

