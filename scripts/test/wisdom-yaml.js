#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { validateDate, validateSlug } = require('../utils/validation-utils');
const { getChangedFilesSinceHead } = require('../utils/test-helpers');
const { addFile, addIssue, addWarning } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const { buildWisdom, slugFromBody } = require('../../eleventy/utils/wisdom-build');
const { WISDOM_ENTRIES_YAML_PATH } = require('../../eleventy/utils/wisdom-entries-path');

const WISDOM_FILES = [
  'src/_data/wisdom-entries.yaml',
  'src/_data/wisdom.js',
  'eleventy/utils/wisdom-build.js',
  'eleventy/utils/wisdom-entries-path.js'
];

const PROJECT_ROOT = path.join(__dirname, '..', '..');

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

/**
 * After YAML structure passes, ensure buildWisdom matches sorting, tags, and slug rules.
 */
function validateWisdomBuildOutput(fileObj, data) {
  let built;
  try {
    built = buildWisdom(data);
  } catch (error) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'wisdom-build-error',
      message: `buildWisdom failed: ${error.message}`
    });
    return;
  }

  if (built.entries.length !== data.entries.length) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'wisdom-build-count',
      message: `buildWisdom produced ${built.entries.length} entries but YAML has ${data.entries.length}`
    });
    return;
  }

  for (let i = 0; i < built.entries.length - 1; i += 1) {
    const a = new Date(String(built.entries[i].added)).getTime();
    const b = new Date(String(built.entries[i + 1].added)).getTime();
    if (a < b) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'wisdom-build-sort',
        message: `buildWisdom sort: entry ${i + 1} is older than entry ${i + 2} (expected newest first)`
      });
    }
  }

  const tagSet = new Set();
  data.entries.forEach((entry) => {
    (entry.tags || []).forEach((t) => {
      if (t) tagSet.add(String(t).trim());
    });
  });
  const expectedTags = [...tagSet].sort();
  if (
    built.allTags.length !== expectedTags.length ||
    built.allTags.some((t, j) => t !== expectedTags[j])
  ) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'wisdom-build-tags',
      message: 'buildWisdom allTags does not match union of entry tags'
    });
  }

  const augmented = data.entries.map((e) => ({
    added: String(e.added),
    body: e.body,
    expectedSlug:
      typeof e.slug === 'string' && e.slug.trim() ? e.slug.trim() : slugFromBody(e.body)
  }));
  const sortedAug = [...augmented].sort((x, y) => new Date(y.added) - new Date(x.added));
  for (let i = 0; i < built.entries.length; i += 1) {
    const row = built.entries[i];
    const exp = sortedAug[i];
    if (row.slug !== exp.expectedSlug || String(row.added) !== exp.added) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'wisdom-build-slug',
        message: `buildWisdom row ${i + 1}: expected slug "${exp.expectedSlug}" and added "${exp.added}", got slug "${row.slug}" and added "${row.added}"`
      });
      break;
    }
  }
}

/**
 * Ensure getGlobalData().wisdom matches buildWisdom(parsed YAML on disk) (src/_data/wisdom.js wiring).
 */
async function validateWisdomGlobalDataMerge(fileObj) {
  try {
    const { Eleventy } = require('@11ty/eleventy');
    const inputDir = path.join(PROJECT_ROOT, 'src');
    const outputDir = path.join(PROJECT_ROOT, '_site-wisdom-test-stub');
    const configPath = path.join(PROJECT_ROOT, '.eleventy.js');
    const eleventy = new Eleventy(inputDir, outputDir, {
      quietMode: true,
      configPath
    });
    await eleventy.init();
    const gd = await eleventy.templateData.getGlobalData();

    const raw = fs.readFileSync(WISDOM_ENTRIES_YAML_PATH, 'utf8');
    const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA });
    const expected = buildWisdom(parsed);

    if (!gd.wisdom || !Array.isArray(gd.wisdom.entries)) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'eleventy-wisdom',
        message: 'Eleventy getGlobalData() missing wisdom.entries (check src/_data/wisdom.js)'
      });
      return;
    }

    const summarize = (rows) =>
      JSON.stringify(rows.map((r) => ({ slug: r.slug, added: String(r.added) })));
    if (summarize(expected.entries) !== summarize(gd.wisdom.entries)) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'eleventy-wisdom-drift',
        message: 'Global `wisdom` entries (slug/added) do not match buildWisdom(src/_data/wisdom-entries.yaml)'
      });
    }
    if (JSON.stringify(expected.allTags) !== JSON.stringify(gd.wisdom.allTags)) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'eleventy-wisdom-tags-drift',
        message: 'Global `wisdom.allTags` does not match buildWisdom(src/_data/wisdom-entries.yaml)'
      });
    }
  } catch (error) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'eleventy-wisdom-merge',
      message: `Eleventy global wisdom check failed: ${error.message}`
    });
  }
}

async function validate(result) {
  const wisdomRel = path.relative(process.cwd(), WISDOM_ENTRIES_YAML_PATH);
  const fileObj = addFile(result, wisdomRel);

  if (!fs.existsSync(WISDOM_ENTRIES_YAML_PATH)) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'file-not-found',
      message: `File not found: ${WISDOM_ENTRIES_YAML_PATH}`
    });
    return;
  }

  const content = fs.readFileSync(WISDOM_ENTRIES_YAML_PATH, 'utf8');
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

  if (fileObj.issues && fileObj.issues.length > 0) {
    return;
  }

  validateWisdomBuildOutput(fileObj, data);
  if (fileObj.issues && fileObj.issues.length > 0) {
    return;
  }

  await validateWisdomGlobalDataMerge(fileObj);
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
