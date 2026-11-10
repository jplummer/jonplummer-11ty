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
const { runWithSpinner } = require('../utils/spinner-utils');
const { cleanSiteExceptImages } = require('../utils/clean-site');
const os = require('os');
const { PassThrough } = require('stream');

const DEPLOY_SCRIPT_PATH = path.join(__dirname, '..', 'deploy', 'deploy.js');
const BUILD_SCRIPT_PATH = path.join(__dirname, '..', 'build', 'build.js');

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

/**
 * deploy.js runs the changelog and rsync through runWithSpinner. It must hand
 * back the exit code and both buffered streams so rsync's failure output can
 * print, reject only when the command can't start, and clear its spinner line.
 * Runs a throwaway node child; the spinner draws into a sink, not the terminal.
 */
async function checkRunWithSpinner(result) {
  const fileObj = addFile(result, 'scripts/utils/spinner-utils.js');
  const fail = (message) => addIssue(fileObj, { severity: 'error', type: 'deploy-guards', message });

  let drawn = '';
  const sink = new PassThrough();
  sink.on('data', (chunk) => { drawn += chunk; });

  const script = 'process.stdout.write("out"); process.stderr.write("err"); process.exit(3)';
  const run = await runWithSpinner([process.execPath, '-e', script], 'testing', { stream: sink });
  if (run.code !== 3 || run.stdout !== 'out' || run.stderr !== 'err') {
    fail(`runWithSpinner must resolve the exit code and both streams; got ${JSON.stringify(run)}`);
  }
  if (!drawn.endsWith('\r\x1b[K')) {
    fail('runWithSpinner must clear its spinner line when the command finishes');
  }

  try {
    await runWithSpinner(['definitely-not-a-command-jp11ty'], 'testing', { stream: sink });
    fail('runWithSpinner must reject when the command cannot start');
  } catch (error) {
    if (error.code !== 'ENOENT') fail(`runWithSpinner rejected with ${error.code || error.message}, expected ENOENT`);
  }
}

/**
 * rsync --delete makes the server mirror _site/, so anything stale in _site/
 * ships. build.js must empty it (except optimized images) before anything else
 * runs. Moving the portfolio pieces on 2026-11-08 left all 35 old pages in
 * _site/; a deleted page with a unique title would have shipped unnoticed.
 */
function checkSiteCleaned(result) {
  const fileObj = addFile(result, 'scripts/utils/clean-site.js');
  const fail = (message) => addIssue(fileObj, { severity: 'error', type: 'deploy-guards', message });

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jp11ty-clean-'));
  try {
    fs.mkdirSync(path.join(dir, 'img'));
    fs.writeFileSync(path.join(dir, 'img', 'kept.webp'), 'x');
    fs.mkdirSync(path.join(dir, 'portfolio', 'gone'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'portfolio', 'gone', 'index.html'), 'stale');
    fs.writeFileSync(path.join(dir, '.htaccess'), 'stale');
    cleanSiteExceptImages(dir);
    const left = fs.readdirSync(dir);
    if (left.length !== 1 || left[0] !== 'img' || !fs.existsSync(path.join(dir, 'img', 'kept.webp'))) {
      fail(`cleanSiteExceptImages must leave only img/ and its contents; left ${JSON.stringify(left)}`);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  const build = fs.readFileSync(BUILD_SCRIPT_PATH, 'utf8');
  const call = build.indexOf('cleanSiteExceptImages();');
  const firstRun = build.indexOf('run(`');
  if (call === -1 || firstRun === -1 || call > firstRun) {
    fail('scripts/build/build.js must call cleanSiteExceptImages() before its first test or build step');
  }
}

async function validate(result) {
  checkSiteCleaned(result);
  await checkRunWithSpinner(result);
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

  // One hash walk of _site, shared by Cloudflare purge and IndexNow. Counting
  // call sites is the point: a second buildContentManifest() call would mean
  // the tree is hashed twice again, which is invisible at runtime because both
  // walks produce correct (just redundant) results. scripts/test/manifest-cursors.js
  // covers the runtime half; this catches the refactor.
  const manifestWalkCount = (deployContent.match(/buildContentManifest\(/g) || []).length;
  if (manifestWalkCount !== 1) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'deploy-guards',
      message: `Deploy script must hash _site exactly once and share the manifest, found ${manifestWalkCount} buildContentManifest() call(s)`,
    });
  }

  const sharesManifestWithBothConsumers =
    /purgeChangedDeployContent\([^)]*\{[^}]*currentManifest/.test(deployContent) &&
    /processIndexNow\(\{[^}]*currentManifest/.test(deployContent);
  if (!sharesManifestWithBothConsumers) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'deploy-guards',
      message: 'Deploy script must pass currentManifest to both purgeChangedDeployContent and processIndexNow',
    });
  }

  // Child processes go through runWithSpinner. A hand-rolled spawn and
  // spinner beside it is the ~90-line duplicate removed 2026-11-08.
  if (/\bspawn\(/.test(deployContent) || deployContent.includes('setInterval(')) {
    addIssue(fileObj, {
      severity: 'error',
      type: 'deploy-guards',
      message: 'Deploy script must run child processes through runWithSpinner (spinner-utils), not its own spawn and spinner',
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
