#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { validateDate, validateSlug } = require('../utils/validation-utils');
const { getChangedFilesSinceHead } = require('../utils/test-helpers');
const { addFile, addIssue, addWarning } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const WISDOM_FILES = ['src/_data/wisdom-entries.yaml', 'src/_data/wisdom.js'];

function hasWisdomDataChanged() {
  const changed = getChangedFilesSinceHead();
  return WISDOM_FILES.some((f) => changed.includes(f));
}

function validateTag(tag, entryIndex, tagIndex) {
  if (typeof tag !== 'string' || !tag.trim()) {
    return `Entry ${entryIndex + 1}, tag ${tagIndex + 1}: Must be a non-empty string`;
  }
  const slugCheck = validateSlug(tag.trim(), 2, 80);
  if (!slugCheck.valid) {
    return `Entry ${entryIndex + 1}, tag ${tagIndex + 1}: ${slugCheck.error}`;
  }
  return null;
}

function validateEntry(entry, index, slugSet) {
  const issues = [];
  const prefix = `Entry ${index + 1}`;

  if (!entry || typeof entry !== 'object') {
    issues.push(`${prefix}: Must be an object`);
    return issues;
  }

  const allowed = ['slug', 'added', 'tags', 'body'];
  const extra = Object.keys(entry).filter((k) => !allowed.includes(k));
  if (extra.length) {
    issues.push(`${prefix}: Unexpected field(s): ${extra.join(', ')}`);
  }

  const hasSlug =
    entry.slug !== undefined && entry.slug !== null && String(entry.slug).trim() !== '';
  if (hasSlug) {
    const slugCheck = validateSlug(entry.slug);
    if (!slugCheck.valid) {
      issues.push(`${prefix}: slug — ${slugCheck.error}`);
    } else if (slugSet.has(entry.slug)) {
      issues.push(`${prefix}: Duplicate slug "${entry.slug}"`);
    } else {
      slugSet.add(entry.slug);
    }
  }

  const dateCheck = validateDate(String(entry.added || ''));
  if (!dateCheck.valid) {
    issues.push(`${prefix}: added — ${dateCheck.error}`);
  }

  if (!Array.isArray(entry.tags)) {
    issues.push(`${prefix}: tags must be an array`);
  } else if (entry.tags.length === 0) {
    issues.push(`${prefix}: tags must have at least one tag`);
  } else {
    const seen = new Set();
    entry.tags.forEach((tag, ti) => {
      const msg = validateTag(tag, index, ti);
      if (msg) issues.push(msg);
      const key = String(tag).trim().toLowerCase();
      if (seen.has(key)) {
        issues.push(`${prefix}: duplicate tag "${tag}"`);
      }
      seen.add(key);
    });
  }

  if (entry.body === undefined || entry.body === null) {
    issues.push(`${prefix}: Missing body`);
  } else if (typeof entry.body !== 'string' || entry.body.trim().length < 3) {
    issues.push(`${prefix}: body must be a non-empty string (min 3 characters)`);
  }

  return issues;
}

function validate(result) {
  const wisdomYaml = './src/_data/wisdom-entries.yaml';
  const fileObj = addFile(result, 'src/_data/wisdom-entries.yaml');

  if (!fs.existsSync(wisdomYaml)) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'file-not-found',
      message: `File not found: ${wisdomYaml}`
    });
    return;
  }

  const content = fs.readFileSync(wisdomYaml, 'utf8');
  let data;
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
      message: 'Root must be an object'
    });
    return;
  }

  const entries = data.entries;
  if (!Array.isArray(entries)) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'invalid-structure',
      message: 'Missing or invalid "entries" array'
    });
    return;
  }

  if (entries.length === 0) {
    addWarning(fileObj, {
      severity: 'warning',
      type: 'empty-entries',
      message: 'No wisdom entries (RSS feed may fail validation)'
    });
  }

  const slugSet = new Set();
  entries.forEach((entry, i) => {
    validateEntry(entry, i, slugSet).forEach((msg) => {
      addIssue(fileObj, {
        severity: 'error',
        type: 'wisdom-entry-error',
        message: msg
      });
    });
  });
}

runTest({
  testType: 'wisdom',
  testName: 'Wisdom YAML Validation',
  requiresSite: false,
  validateFn: validate,
  shouldSkipFn: () => {
    const { checkChangedFlag } = require('../utils/test-runner-helper');
    return checkChangedFlag() && !hasWisdomDataChanged();
  },
  skipMessage: '✅ wisdom data files not changed since last commit'
});
