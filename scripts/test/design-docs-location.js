#!/usr/bin/env node

/**
 * The superpowers writing-plans / brainstorming skills default to
 * docs/superpowers/ for plans and specs, and both defer to user preference for
 * the location. This project's preference is docs/designs/, stated in CLAUDE.md
 * and .cursor/rules/memory.mdc — not in the skills, whose SKILL.md files ship
 * from a plugin cache keyed by commit SHA (Cursor) and version (Claude) where
 * edits are discarded on the next update.
 *
 * A stated preference is persuasion, not enforcement, so this test is the
 * backstop: a skill that writes to the old path fails the build here instead of
 * quietly splitting the design record across two directories for months.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const ROOT = path.join(__dirname, '..', '..');
const RETIRED_DIR = 'docs/superpowers';
const SCRATCH_DIR = 'docs/designs/scratch';
const RULE_ID = 'design-docs-location';

// Directories the structure promises exist (see memory.mdc § Project structure).
const REQUIRED_DIRS = ['docs/designs/specs', 'docs/designs/plans'];

/**
 * Runs git and returns trimmed stdout lines. Exit code 1 means "no matches"
 * for grep and "no files" for ls-files, both of which are successful outcomes
 * here, so only unexpected failures are allowed to throw.
 */
function gitLines(args) {
  try {
    const stdout = execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
    return stdout.split('\n').filter(Boolean);
  } catch (error) {
    if (error.status === 1) return [];
    throw error;
  }
}

function checkRetiredDirectoryAbsent(result) {
  const fileObj = addFile(result, `${RETIRED_DIR}/`, 'retired design docs path');
  if (!fs.existsSync(path.join(ROOT, RETIRED_DIR))) return;

  const strays = gitLines(['ls-files', '--cached', '--others', '--', RETIRED_DIR]);
  const detail = strays.length ? ` Contains: ${strays.join(', ')}.` : '';
  addIssue(fileObj, {
    type: RULE_ID,
    message:
      `${RETIRED_DIR}/ exists — a superpowers skill probably wrote there.` +
      `${detail} Move the file(s) into docs/designs/{specs,plans}/ and remove the directory; ` +
      'do not recreate it.',
    ruleId: RULE_ID,
  });
}

function checkScratchNotTracked(result) {
  const fileObj = addFile(result, `${SCRATCH_DIR}/`, 'scratch stays local');
  const tracked = gitLines(['ls-files', '--cached', '--', SCRATCH_DIR]);

  for (const file of tracked) {
    addIssue(fileObj, {
      type: RULE_ID,
      message: `${file} is tracked — ${SCRATCH_DIR}/ is for local-only agent reports`,
      ruleId: RULE_ID,
    });
  }
}

function checkRequiredDirs(result) {
  const fileObj = addFile(result, 'docs/designs/', 'expected structure');
  for (const dir of REQUIRED_DIRS) {
    if (!fs.existsSync(path.join(ROOT, dir))) {
      addIssue(fileObj, {
        type: RULE_ID,
        message: `${dir}/ is missing — design records are expected here`,
        ruleId: RULE_ID,
      });
    }
  }
}

/**
 * Deliberately not checked: whether any file still mentions the retired path
 * as text. That check was written and removed — CLAUDE.md, the memory rule,
 * docs/tests.md, and this file all have to name the old path to explain the
 * override, so it failed on its own documentation. Stale prose is cosmetic;
 * a skill writing to the wrong directory is the failure worth catching.
 */
async function validate(result) {
  checkRetiredDirectoryAbsent(result);
  checkScratchNotTracked(result);
  checkRequiredDirs(result);
}

runTest({
  testType: RULE_ID,
  testName: 'Design docs location',
  validateFn: validate,
});
