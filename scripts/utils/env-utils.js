#!/usr/bin/env node

/**
 * Environment Utilities
 * 
 * Utilities for loading environment variables silently
 */

const fs = require('fs');

/**
 * Load dotenv configuration silently (suppresses stdout/stderr messages)
 * @param {string} path - Optional path to .env file (defaults to '.env')
 * @returns {Object} Result object with { error, parsed }
 */
function loadDotenvSilently(path = '.env') {
  // Only load if file exists
  if (!fs.existsSync(path)) {
    return { error: null, parsed: {} };
  }

  // Temporarily suppress stdout and stderr
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  // Suppress all output
  process.stdout.write = () => true;
  process.stderr.write = () => true;
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};

  let result;
  try {
    result = require('dotenv').config({ path });
  } catch (error) {
    // Restore output before rethrowing
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
    throw error;
  }

  // Restore output
  process.stdout.write = originalStdoutWrite;
  process.stderr.write = originalStderrWrite;
  console.log = originalLog;
  console.warn = originalWarn;
  console.error = originalError;

  return result || { error: null, parsed: {} };
}

module.exports = {
  loadDotenvSilently
};
