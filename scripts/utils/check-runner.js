#!/usr/bin/env node

/**
 * Check Runner Utility
 * 
 * Generic runner for security checks that handles logging, error handling,
 * and result tracking in a consistent way.
 */

const { logCheck } = require('./audit-logging');

/**
 * Run a security check with consistent error handling and result tracking
 * @param {string} checkName - Name of the check
 * @param {Function} checkFn - Async or sync function that performs the check and returns result object
 * @param {Object} results - Results object to update { passed, warnings, failures, findings }
 * @param {Function} addFinding - Function to add findings
 * @returns {Promise<boolean>} True if check passed, false otherwise
 */
async function runCheck(checkName, checkFn, results, addFinding) {
  const { logCheck } = require('./audit-logging');
  logCheck(checkName, 'pending', 'Checking...');
  
  try {
    const result = await checkFn();
    
    if (result.passed) {
      logCheck(checkName, 'pass', result.details || '');
      results.passed.push(result.message || checkName);
      if (result.finding) {
        addFinding(checkName, 'pass', result.finding.severity || 'info', 
          result.finding.description, result.finding.recommendation || '', result.finding.details || {});
      }
      return true;
    } else if (result.warning) {
      logCheck(checkName, 'warn', result.details || '');
      results.warnings.push(result.message || checkName);
      if (result.finding) {
        addFinding(checkName, 'warn', result.finding.severity || 'medium', 
          result.finding.description, result.finding.recommendation || '', result.finding.details || {});
      }
      return false;
    } else {
      logCheck(checkName, 'fail', result.details || '');
      results.failures.push(result.message || checkName);
      if (result.finding) {
        addFinding(checkName, 'fail', result.finding.severity || 'high', 
          result.finding.description, result.finding.recommendation || '', result.finding.details || {});
      }
      return false;
    }
  } catch (error) {
    logCheck(checkName, 'fail', `Error: ${error.message}`);
    results.failures.push(`${checkName}: ${error.message}`);
    addFinding(checkName, 'fail', 'high', 
      `Check failed with error: ${error.message}`,
      'Review the error message and verify the check can run correctly.',
      { error: error.message, stack: error.stack });
    return false;
  }
}

module.exports = {
  runCheck
};

