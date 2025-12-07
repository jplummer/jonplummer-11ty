#!/usr/bin/env node

/**
 * Test Result Builder Utility
 * 
 * Helper functions to build JSON test result structures incrementally.
 * Start minimal, add fields as tests need them.
 */

/**
 * Create a new test result object with minimum required fields
 * @param {string} testType - Test type identifier (e.g., 'html', 'rss-feed')
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
  
  // Write in chunks to avoid buffer limits, then flush
  const chunkSize = 16384; // 16KB chunks
  for (let i = 0; i < output.length; i += chunkSize) {
    process.stdout.write(output.slice(i, i + chunkSize));
  }
  
  // Explicitly flush stdout to ensure all data is written before process exits
  if (process.stdout.flushSync) {
    try {
      process.stdout.flushSync();
    } catch (e) {
      // flushSync might not be available in all Node versions
    }
  }
}

module.exports = {
  createTestResult,
  addFile,
  addIssue,
  addWarning,
  addGlobalIssue,
  addCustomSection,
  finalizeTestResult,
  outputResult
};

