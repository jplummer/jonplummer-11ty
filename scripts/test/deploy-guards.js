#!/usr/bin/env node

/**
 * Unit tests guarding scripts/deploy/deploy.js against known past regressions.
 * Static source checks only — no network or _site/ dependency.
 */

const fs = require('fs');
const path = require('path');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');
const { buildRsyncArgs } = require('../utils/deploy-rsync');

const DEPLOY_SCRIPT_PATH = path.join(__dirname, '..', 'deploy', 'deploy.js');

const RSYNC_TARGET = {
  localPath: './_site/',
  username: 'deploy-user',
  host: 'example.com',
  remotePath: '/home/deploy-user/example.com/',
};

/**
 * A normal deploy must stay quiet: the build rewrites _site/, so rsync sees a
 * fresh mtime on nearly every file and --itemize-changes prints thousands of
 * lines that overflow the terminal (and once crashed the machine when pasted).
 * Detail belongs to --verbose and --dry-run only.
 */
function checkRsyncVerbosity(result) {
  const fileObj = addFile(result, 'scripts/utils/deploy-rsync.js');

  const quiet = buildRsyncArgs(RSYNC_TARGET);
  for (const flag of ['--itemize-changes', '--stats']) {
    if (quiet.includes(flag)) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'deploy-guards',
        message: `Default deploy must not pass ${flag} (thousands of mtime-only lines); gate it behind --verbose`,
      });
    }
  }

  const verbose = buildRsyncArgs({ ...RSYNC_TARGET, verbose: true });
  for (const flag of ['--itemize-changes', '--stats']) {
    if (!verbose.includes(flag)) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'deploy-guards',
        message: `--verbose deploy must pass ${flag} so the detail is still available for debugging`,
      });
    }
  }

  const dry = buildRsyncArgs({ ...RSYNC_TARGET, dryRun: true });
  if (!dry.includes('--dry-run')) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'deploy-guards',
      message: 'Dry-run deploy must pass rsync --dry-run',
    });
  }
  if (!dry.includes('--itemize-changes')) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'deploy-guards',
      message: 'Dry-run deploy must itemize changes — inspecting the transfer is its whole purpose',
    });
  }

  // Excludes and destination survive in every mode.
  if (!quiet.includes('--delete') || quiet[quiet.length - 1] !== `${RSYNC_TARGET.username}@${RSYNC_TARGET.host}:${RSYNC_TARGET.remotePath}`) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'deploy-guards',
      message: 'rsync args must keep --delete and end with the user@host:path destination',
    });
  }
}

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

  // Excludes now live in scripts/utils/deploy-rsync.js, so check the built
  // command rather than this file's text.
  const rsyncExcludes = buildRsyncArgs({ ...RSYNC_TARGET, verbose: true })
    .filter((arg) => arg.startsWith('--exclude='));

  const forbiddenExcludes = [
    { needle: 'color', message: 'Deploy rsync must not exclude color/ (/color/ is a normal page)' },
    { needle: 'assets/fonts', message: 'Deploy rsync must not exclude assets/fonts/ (self-hosted WOFF2 required)' },
  ];
  for (const { needle, message } of forbiddenExcludes) {
    if (rsyncExcludes.some((arg) => arg.includes(needle))) {
      addIssue(fileObj, { severity: 'error', type: 'deploy-guards', message });
    }
  }

  checkRsyncVerbosity(result);

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
    deployContent.includes('purgeChangedDeployContent') &&
    deployContent.includes('saveContentManifest') &&
    deployContent.includes('purgeCloudflareAfterDeploy');
  if (!hasCloudflarePurge) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'deploy-guards',
      message: 'Deploy script missing Cloudflare selective purge integration',
    });
  }

  // The quiet default is only real if deploy.js uses the shared builder and
  // still offers a way to get the detail back.
  const usesSharedRsyncArgs =
    deployContent.includes("require('../utils/deploy-rsync')") &&
    deployContent.includes("process.argv.includes('--verbose')");
  if (!usesSharedRsyncArgs) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'deploy-guards',
      message: 'Deploy script must build rsync args via utils/deploy-rsync and accept --verbose',
    });
  }
}

runTest({
  testType: 'deploy-guards',
  testName: 'Deploy Guards',
  requiresSite: false,
  validateFn: validate,
});
