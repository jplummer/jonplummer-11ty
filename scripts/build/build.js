#!/usr/bin/env node

const { execSync } = require('child_process');
const { getTestsByGroup } = require('../test-manifest');

const PRE_BUILD_TESTS = getTestsByGroup('pre').map((t) => t.id);
const POST_BUILD_TESTS = getTestsByGroup('post').map((t) => t.id);

function run(command, errorLabel) {
  try {
    execSync(command, { stdio: 'inherit', shell: true });
  } catch {
    if (errorLabel) console.error(`\n❌ ${errorLabel}\n`);
    process.exit(1);
  }
}

// Phase 1: Pre-build — source quality
for (const test of PRE_BUILD_TESTS) {
  run(`node scripts/test-runner.js ${test} --format build`);
}

// Phase 2: Build
run('node scripts/content/generate-og-images.js --quiet');
run('eleventy --quiet', '🏗️  Build failed');
console.log('✅ 🏗️  Build: completed\n');

// Phase 3: Post-build — output quality
for (const test of POST_BUILD_TESTS) {
  run(`node scripts/test-runner.js ${test} --format build`);
}
