#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Validate date format (YYYY-MM-DD)
function validateDate(dateString) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return { valid: false, error: 'Date must be in YYYY-MM-DD format' };
  }

  // Parse components directly to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);

  // Validate ranges
  if (year < 2000 || year > 2100) {
    return { valid: false, error: 'Year must be between 2000 and 2100' };
  }
  if (month < 1 || month > 12) {
    return { valid: false, error: 'Month must be between 1 and 12' };
  }
  if (day < 1 || day > 31) {
    return { valid: false, error: 'Day must be between 1 and 31' };
  }

  // Create date using local time to check validity
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day) {
    return { valid: false, error: 'Invalid date (e.g., 2025-02-30)' };
  }

  return { valid: true };
}

// Validate URL format
function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL must be a non-empty string' };
  }

  try {
    const urlObj = new URL(url);
    // Basic validation - must have http or https protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'URL must use http or https protocol' };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// Validate title
function validateTitle(title) {
  if (!title || typeof title !== 'string') {
    return { valid: false, error: 'Title must be a non-empty string' };
  }

  if (title.trim().length === 0) {
    return { valid: false, error: 'Title cannot be empty' };
  }

  return { valid: true };
}

// Validate description (optional but should be valid if present)
function validateDescription(description) {
  if (description === undefined || description === null) {
    return { valid: true }; // Description is optional
  }

  if (typeof description !== 'string') {
    return { valid: false, error: 'Description must be a string if provided' };
  }

  return { valid: true };
}

// Validate a single link object
function validateLink(link, linkIndex, dateKey) {
  const issues = [];

  // Check required fields
  if (!link.url) {
    issues.push(`Link ${linkIndex + 1}: Missing required field 'url'`);
  } else {
    const urlCheck = validateUrl(link.url);
    if (!urlCheck.valid) {
      issues.push(`Link ${linkIndex + 1}: URL - ${urlCheck.error}`);
    }
  }

  if (!link.title) {
    issues.push(`Link ${linkIndex + 1}: Missing required field 'title'`);
  } else {
    const titleCheck = validateTitle(link.title);
    if (!titleCheck.valid) {
      issues.push(`Link ${linkIndex + 1}: Title - ${titleCheck.error}`);
    }
  }

  // Validate description if present
  if (link.description !== undefined) {
    const descCheck = validateDescription(link.description);
    if (!descCheck.valid) {
      issues.push(`Link ${linkIndex + 1}: Description - ${descCheck.error}`);
    }
  }

  // Check for unexpected fields
  const allowedFields = ['url', 'title', 'description'];
  const linkFields = Object.keys(link);
  const unexpectedFields = linkFields.filter(field => !allowedFields.includes(field));
  if (unexpectedFields.length > 0) {
    issues.push(`Link ${linkIndex + 1}: Unexpected field(s): ${unexpectedFields.join(', ')}`);
  }

  return issues;
}

// Main validation function
function validateLinksYaml() {
  const linksFile = './src/_data/links.yaml';

  if (!fs.existsSync(linksFile)) {
    console.log(`❌ File not found: ${linksFile}`);
    process.exit(1);
  }

  console.log('📋 Validating links.yaml structure...\n');

  const content = fs.readFileSync(linksFile, 'utf8');
  let data;

  // Check YAML syntax - use JSON schema to prevent automatic date conversion
  try {
    data = yaml.load(content, { schema: yaml.JSON_SCHEMA });
  } catch (error) {
    console.log(`❌ YAML syntax error: ${error.message}`);
    process.exit(1);
  }

  if (!data || typeof data !== 'object') {
    console.log('❌ Invalid structure: root must be an object');
    process.exit(1);
  }

  const allIssues = [];
  const dateKeys = Object.keys(data);

  if (dateKeys.length === 0) {
    console.log('⚠️  Warning: No date entries found');
  }

  // Validate each date entry
  for (const dateKey of dateKeys) {
    const dateCheck = validateDate(dateKey);
    if (!dateCheck.valid) {
      allIssues.push(`Date key "${dateKey}": ${dateCheck.error}`);
      continue;
    }

    const links = data[dateKey];

    // Check that date value is an array
    if (!Array.isArray(links)) {
      allIssues.push(`Date "${dateKey}": Value must be an array`);
      continue;
    }

    if (links.length === 0) {
      console.log(`   ⚠️  "${dateKey}": Empty array (no links)`);
      continue;
    }

    // Validate each link in the array
    links.forEach((link, index) => {
      if (!link || typeof link !== 'object') {
        allIssues.push(`Date "${dateKey}", Link ${index + 1}: Must be an object`);
        return;
      }

      const linkIssues = validateLink(link, index, dateKey);
      linkIssues.forEach(issue => {
        allIssues.push(`Date "${dateKey}", ${issue}`);
      });
    });
  }

  // Report results
  if (allIssues.length > 0) {
    console.log('❌ Validation issues found:\n');
    allIssues.forEach(issue => {
      console.log(`   ${issue}`);
    });
    console.log(`\n❌ Found ${allIssues.length} issue(s) in links.yaml`);
    process.exit(1);
  } else {
    const totalLinks = dateKeys.reduce((sum, key) => {
      const links = data[key];
      return sum + (Array.isArray(links) ? links.length : 0);
    }, 0);
    console.log(`✅ links.yaml is valid`);
    console.log(`   ${dateKeys.length} date entry/entries`);
    console.log(`   ${totalLinks} link/links total`);
    process.exit(0);
  }
}

// Run validation
validateLinksYaml();

