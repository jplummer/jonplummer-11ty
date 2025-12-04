#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { validateDate, validateUrl, validateTitle } = require('../utils/validation-utils');
const { printSummary, exitWithResults, getTestEmoji } = require('../utils/reporting-utils');

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
    // Link titles have no length constraints (unlike SEO meta titles)
    // Just validate that it's a non-empty string
    const titleCheck = validateTitle(link.title, 1, 1000);
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
  const totalLinks = dateKeys.reduce((sum, key) => {
    const links = data[key];
    return sum + (Array.isArray(links) ? links.length : 0);
  }, 0);

  if (allIssues.length > 0) {
    console.log('❌ Validation issues found:\n');
    allIssues.forEach(issue => {
      console.log(`   ${issue}`);
    });
  }

  printSummary('Links YAML Validation', getTestEmoji('links-yaml'), [
    { label: 'Date entries', value: dateKeys.length },
    { label: 'Total links', value: totalLinks },
    { label: 'Issues', value: allIssues.length }
  ]);

  exitWithResults(allIssues.length, 0, {
    testType: 'links.yaml validation',
    successMessage: '\n✅ links.yaml is valid!'
  });
}

// Run validation
validateLinksYaml();

