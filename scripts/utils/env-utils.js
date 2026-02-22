#!/usr/bin/env node

/**
 * Environment Utilities
 * 
 * Utilities for loading environment variables silently
 */

const fs = require('fs');

/**
 * Load dotenv configuration silently (suppresses dotenv's injection banner)
 * @param {string} envPath - Optional path to .env file (defaults to '.env')
 * @returns {Object} Result object with { error, parsed }
 */
function loadDotenvSilently(envPath = '.env') {
  if (!fs.existsSync(envPath)) {
    return { error: null, parsed: {} };
  }
  return require('dotenv').config({ path: envPath, quiet: true }) || { error: null, parsed: {} };
}

module.exports = {
  loadDotenvSilently
};
