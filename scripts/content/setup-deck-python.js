#!/usr/bin/env node

/**
 * One-time setup: project-local venv for python-pptx (PEP 668 / Homebrew Python).
 *
 * Usage: pnpm run setup-deck-python
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { VENV_DIR } = require('../utils/deck-python');

const requirements = path.join(__dirname, 'requirements-deck.txt');
const bootstrapPython = process.platform === 'win32' ? 'python' : 'python3';

function run(cmd, args, label) {
  const result = spawnSync(cmd, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`\nError: ${label} failed (exit ${result.status ?? 'unknown'}).`);
    process.exit(result.status || 1);
  }
}

if (!fs.existsSync(requirements)) {
  console.error(`Error: requirements file not found: ${requirements}`);
  process.exit(1);
}

console.log(`Creating venv at ${VENV_DIR} …`);
run(bootstrapPython, ['-m', 'venv', VENV_DIR], 'python -m venv');

const pip =
  process.platform === 'win32'
    ? path.join(VENV_DIR, 'Scripts', 'pip')
    : path.join(VENV_DIR, 'bin', 'pip');

console.log('Installing python-pptx …');
run(pip, ['install', '-r', requirements], 'pip install');

console.log('\nDone. Use: pnpm run convert-presentation <pdf> <pptx> [year/month]');
