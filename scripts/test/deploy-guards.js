#!/usr/bin/env node

/**
 * Unit tests guarding scripts/deploy/deploy.js against known past regressions.
 * Static source checks only — no network or _site/ dependency.
 */

const fs = require('fs');
const path = require('path');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const DEPLOY_SCRIPT_PATH = path.join(__dirname, '..', 'deploy', 'deploy.js');

async function validate(result) {
  const fileObj = addFile(result, 'scripts/deploy/deploy.js');

  if (!fs.existsSync(DEPLOY_SCRIPT_PATH)) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'deploy-guards',
      message: 'scripts/deploy/deploy.js not found',
    });
    return;
  }

  const deployContent = fs.readFileSync(DEPLOY_SCRIPT_PATH, 'utf8');

  if (deployContent.includes('--exclude=color/')) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'deploy-guards',
      message: 'Deploy rsync must not exclude color/ (/color/ is a normal page)',
    });
  }

  if (deployContent.includes('--exclude=assets/fonts')) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'deploy-guards',
      message: 'Deploy rsync must not exclude assets/fonts/ (self-hosted WOFF2 required)',
    });
  }

  const hasChangelogCommitLogic =
    deployContent.includes('changelogChanged') &&
    deployContent.includes('git add CHANGELOG.md') &&
    deployContent.includes('changelog: update') &&
    deployContent.includes('git push');
  if (!hasChangelogCommitLogic) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'deploy-guards',
      message: 'Deploy script missing changelog commit/push logic',
    });
  }

  const hasCloudflarePurge =
    deployContent.includes('cloudflare-purge') &&
    deployContent.includes('--itemize-changes') &&
    deployContent.includes('purgeCloudflareAfterDeploy');
  if (!hasCloudflarePurge) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'deploy-guards',
      message: 'Deploy script missing Cloudflare selective purge integration',
    });
  }
}

runTest({
  testType: 'deploy-guards',
  testName: 'Deploy Guards',
  requiresSite: false,
  validateFn: validate,
});
