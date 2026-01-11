#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('js-yaml');
const { validateDate, validateUrl, validateTitle } = require('../utils/validation-utils');
const { addFile, addIssue, addWarning } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

// Check if links.yaml changed since last commit
function hasLinksYamlChanged() {
  try {
    const output = execSync('git diff --name-only --diff-filter=ACMR HEAD', {
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    const changedFiles = output.trim().split('\n').filter(line => line.trim());
    return changedFiles.includes('src/_data/links.yaml');
  } catch (error) {
    return false;
  }
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
function validate(result) {
  const linksFile = './src/_data/links.yaml';
  const fileObj = addFile(result, 'src/_data/links.yaml');

  if (!fs.existsSync(linksFile)) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'file-not-found',
      message: `File not found: ${linksFile}`
    });
    return;
  }

  const content = fs.readFileSync(linksFile, 'utf8');
  let data;

  // Check YAML syntax - use JSON schema to prevent automatic date conversion
  try {
    data = yaml.load(content, { schema: yaml.JSON_SCHEMA });
  } catch (error) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'yaml-syntax-error',
      message: `YAML syntax error: ${error.message}`
    });
    return;
  }

  if (!data || typeof data !== 'object') {
    addIssue(fileObj, {
      severity: 'error',
      type: 'invalid-structure',
      message: 'Invalid structure: root must be an object'
    });
    return;
  }

  const dateKeys = Object.keys(data);

  if (dateKeys.length === 0) {
    addWarning(fileObj, {
      severity: 'warning',
      type: 'empty-file',
      message: 'No date entries found'
    });
  }

  // Validate each date entry
  for (const dateKey of dateKeys) {
    const dateCheck = validateDate(dateKey);
    if (!dateCheck.valid) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'invalid-date-key',
        message: `Date key "${dateKey}": ${dateCheck.error}`
      });
      continue;
    }

    const links = data[dateKey];

    // Check that date value is an array
    if (!Array.isArray(links)) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'invalid-date-value',
        message: `Date "${dateKey}": Value must be an array`
      });
      continue;
    }

    if (links.length === 0) {
      addWarning(fileObj, {
        severity: 'warning',
        type: 'empty-array',
        message: `Date "${dateKey}": Empty array (no links)`
      });
      continue;
    }

    // Validate each link in the array
    links.forEach((link, index) => {
      if (!link || typeof link !== 'object') {
        addIssue(fileObj, {
          severity: 'error',
          type: 'invalid-link-object',
          message: `Date "${dateKey}", Link ${index + 1}: Must be an object`
        });
        return;
      }

      const linkIssues = validateLink(link, index, dateKey);
      linkIssues.forEach(issueMessage => {
        addIssue(fileObj, {
          severity: 'error',
          type: 'link-validation-error',
          message: `Date "${dateKey}", ${issueMessage}`
        });
      });
    });
  }
}

// Run test with helper
runTest({
  testType: 'links',
  testName: 'Links YAML Validation',
  requiresSite: false,
  validateFn: validate,
  shouldSkipFn: () => {
    const { checkChangedFlag } = require('../utils/test-runner-helper');
    return checkChangedFlag() && !hasLinksYamlChanged();
  },
  skipMessage: '✅ links.yaml not changed since last commit'
});

