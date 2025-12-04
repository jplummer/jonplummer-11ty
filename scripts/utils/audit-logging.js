#!/usr/bin/env node

/**
 * Audit Logging Utilities
 * 
 * Color-coded logging functions for security audit output
 */

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Log a colored message
 * @param {string} message - Message to log
 * @param {string} color - Color name (default: 'reset')
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Log a section header with emoji
 * @param {string} title - Section title
 * @param {string} emoji - Emoji for the section
 */
function logSection(title, emoji) {
  console.log('');
  log(`${emoji} ${title}`, 'cyan');
  console.log('');
}

/**
 * Log a check result
 * @param {string} name - Check name
 * @param {string} status - Status: 'pending', 'pass', 'warn', 'fail'
 * @param {string} details - Optional details message
 */
function logCheck(name, status, details = '') {
  if (status === 'pending') {
    // Pending checks: show only the status message, not the check name
    if (details) {
      console.log(`    ${details}`);
    }
  } else {
    // Completed checks: show icon, name, and status
    const icon = status === 'pass' ? '✓' : status === 'warn' ? '⚠' : '✗';
    const color = status === 'pass' ? 'green' : status === 'warn' ? 'yellow' : 'red';
    log(`  ${icon} ${name}`, color);
    if (details) {
      console.log(`    ${details}`);
    }
  }
}

module.exports = {
  log,
  logSection,
  logCheck,
  colors
};

