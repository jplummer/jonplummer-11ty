#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { validateDate, validateUrl, validateTitle } = require('../utils/validation-utils');
const { createTestResult, addFile, addIssue, addWarning, outputResult } = require('../utils/test-result-builder');

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

  // Create test result
  const result = createTestResult('links-yaml', 'Links YAML Validation');
  const fileObj = addFile(result, 'src/_data/links.yaml');

  if (!fs.existsSync(linksFile)) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'file-not-found',
      message: `File not found: ${linksFile}`
    });
    outputResult(result);
    process.exit(1);
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
    outputResult(result);
    process.exit(1);
  }

  if (!data || typeof data !== 'object') {
    addIssue(fileObj, {
      severity: 'error',
      type: 'invalid-structure',
      message: 'Invalid structure: root must be an object'
    });
    outputResult(result);
    process.exit(1);
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

  // Output JSON result (formatter will handle display)
  outputResult(result);

  // Exit with appropriate code (errors block, warnings don't)
  process.exit(result.summary.issues > 0 ? 1 : 0);
}

// Run validation
validateLinksYaml();

