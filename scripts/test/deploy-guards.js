#!/usr/bin/env node

/**
 * Unit tests guarding scripts/deploy/deploy.js against known past regressions.
 * No network or _site/ dependency. deploy.js is only read as text, never
 * required: it deploys when loaded. The helpers it calls are run for real,
 * against a throwaway node child and a scratch temp directory.
 */

const { test } = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
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

/** deploy.js as a string. Reading is the only safe thing to do with it. */
function readDeploySource() {
  assert.ok(fs.existsSync(DEPLOY_SCRIPT_PATH), 'scripts/deploy/deploy.js not found');
  return fs.readFileSync(DEPLOY_SCRIPT_PATH, 'utf8');
}

/** A sink for the spinner to draw into, so it stays off the terminal. */
function makeSink() {
  const sink = new PassThrough();
  const seen = { drawn: '' };
  sink.on('data', (chunk) => { seen.drawn += chunk; });
  return { sink, seen };
}

/**
 * rsync --delete makes the server mirror _site/, so anything stale in _site/
 * ships. build.js must empty it (except optimized images) before anything else
 * runs. Moving the portfolio pieces on 2026-11-08 left all 35 old pages in
 * _site/; a deleted page with a unique title would have shipped unnoticed.
 */
test('cleanSiteExceptImages leaves only img/ and its contents', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jp11ty-clean-'));
  try {
    fs.mkdirSync(path.join(dir, 'img'));
    fs.writeFileSync(path.join(dir, 'img', 'kept.webp'), 'x');
    fs.mkdirSync(path.join(dir, 'portfolio', 'gone'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'portfolio', 'gone', 'index.html'), 'stale');
    fs.writeFileSync(path.join(dir, '.htaccess'), 'stale');
    cleanSiteExceptImages(dir);
    const left = fs.readdirSync(dir);
    assert.ok(
      left.length === 1 && left[0] === 'img' && fs.existsSync(path.join(dir, 'img', 'kept.webp')),
      `cleanSiteExceptImages must leave only img/ and its contents; left ${JSON.stringify(left)}`
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('build.js cleans _site before its first test or build step', () => {
  const build = fs.readFileSync(BUILD_SCRIPT_PATH, 'utf8');
  const call = build.indexOf('cleanSiteExceptImages();');
  const firstRun = build.indexOf('run(`');
  assert.ok(
    call !== -1 && firstRun !== -1 && call <= firstRun,
    'scripts/build/build.js must call cleanSiteExceptImages() before its first test or build step'
  );
});

/**
 * deploy.js runs the changelog and rsync through runWithSpinner. It must hand
 * back the exit code and both buffered streams so rsync's failure output can
 * print, reject only when the command can't start, and clear its spinner line.
 * Runs a throwaway node child; the spinner draws into a sink, not the terminal.
 */
const CHILD_SCRIPT = 'process.stdout.write("out"); process.stderr.write("err"); process.exit(3)';

test('runWithSpinner resolves the exit code with both streams', async () => {
  const { sink } = makeSink();
  const run = await runWithSpinner([process.execPath, '-e', CHILD_SCRIPT], 'testing', { stream: sink });
  assert.ok(
    run.code === 3 && run.stdout === 'out' && run.stderr === 'err',
    `runWithSpinner must resolve the exit code and both streams; got ${JSON.stringify(run)}`
  );
});

test('runWithSpinner clears its spinner line when the command finishes', async () => {
  const { sink, seen } = makeSink();
  await runWithSpinner([process.execPath, '-e', CHILD_SCRIPT], 'testing', { stream: sink });
  assert.ok(
    seen.drawn.endsWith('\r\x1b[K'),
    'runWithSpinner must clear its spinner line when the command finishes'
  );
});

test("runWithSpinner rejects with ENOENT when a command can't start", async () => {
  const { sink } = makeSink();
  let error = null;
  try {
    await runWithSpinner(['definitely-not-a-command-jp11ty'], 'testing', { stream: sink });
  } catch (caught) {
    error = caught;
  }
  assert.ok(error, 'runWithSpinner must reject when the command cannot start');
  assert.strictEqual(
    error.code,
    'ENOENT',
    `runWithSpinner rejected with ${error.code || error.message}, expected ENOENT`
  );
});

// Excludes now live in scripts/utils/deploy-rsync.js, so check the built
// command rather than deploy.js's text.
test('rsync does not exclude color/ or assets/fonts/', () => {
  const rsyncExcludes = buildRsyncArgs({ ...RSYNC_TARGET, verbose: true })
    .filter((arg) => arg.startsWith('--exclude='));

  const forbiddenExcludes = [
    { needle: 'color', message: 'Deploy rsync must not exclude color/ (/color/ is a normal page)' },
    { needle: 'assets/fonts', message: 'Deploy rsync must not exclude assets/fonts/ (self-hosted WOFF2 required)' },
  ];
  for (const { needle, message } of forbiddenExcludes) {
    assert.ok(!rsyncExcludes.some((arg) => arg.includes(needle)), message);
  }
});

/**
 * A normal deploy must stay quiet: the build rewrites _site/, so rsync sees a
 * fresh mtime on nearly every file and --itemize-changes prints thousands of
 * lines that overflow the terminal (and once crashed the machine when pasted).
 * Detail belongs to --verbose and --dry-run only.
 */
test('default deploy passes neither --itemize-changes nor --stats', () => {
  const quiet = buildRsyncArgs(RSYNC_TARGET);
  for (const flag of ['--itemize-changes', '--stats']) {
    assert.ok(
      !quiet.includes(flag),
      `Default deploy must not pass ${flag} (thousands of mtime-only lines); gate it behind --verbose`
    );
  }
});

test('--verbose deploy passes --itemize-changes and --stats', () => {
  const verbose = buildRsyncArgs({ ...RSYNC_TARGET, verbose: true });
  for (const flag of ['--itemize-changes', '--stats']) {
    assert.ok(
      verbose.includes(flag),
      `--verbose deploy must pass ${flag} so the detail is still available for debugging`
    );
  }
});

test("--dry-run carries rsync's own --dry-run", () => {
  const dry = buildRsyncArgs({ ...RSYNC_TARGET, dryRun: true });
  assert.ok(dry.includes('--dry-run'), 'Dry-run deploy must pass rsync --dry-run');
});

test('--dry-run itemizes changes', () => {
  const dry = buildRsyncArgs({ ...RSYNC_TARGET, dryRun: true });
  assert.ok(
    dry.includes('--itemize-changes'),
    'Dry-run deploy must itemize changes — inspecting the transfer is its whole purpose'
  );
});

test('rsync args keep --delete and end with the destination', () => {
  const quiet = buildRsyncArgs(RSYNC_TARGET);
  assert.ok(
    quiet.includes('--delete') && quiet[quiet.length - 1] === `${RSYNC_TARGET.username}@${RSYNC_TARGET.host}:${RSYNC_TARGET.remotePath}`,
    'rsync args must keep --delete and end with the user@host:path destination'
  );
});

test('changelog commit and push logic is present in deploy.js', () => {
  const deployContent = readDeploySource();
  const hasChangelogCommitLogic =
    deployContent.includes('changelogChanged') &&
    deployContent.includes('git add CHANGELOG.md') &&
    deployContent.includes('changelog: update') &&
    deployContent.includes('git push');
  assert.ok(hasChangelogCommitLogic, 'Deploy script missing changelog commit/push logic');
});

test('Cloudflare selective purge is wired into deploy.js', () => {
  const deployContent = readDeploySource();
  const hasCloudflarePurge =
    deployContent.includes('cloudflare-purge') &&
    deployContent.includes('purgeChangedDeployContent') &&
    deployContent.includes('saveContentManifest') &&
    deployContent.includes('purgeCloudflareAfterDeploy');
  assert.ok(hasCloudflarePurge, 'Deploy script missing Cloudflare selective purge integration');
});

// One hash walk of _site, shared by Cloudflare purge and IndexNow. Counting
// call sites is the point: a second buildContentManifest() call would mean
// the tree is hashed twice again, which is invisible at runtime because both
// walks produce correct (just redundant) results. scripts/test/manifest-cursors.js
// covers the runtime half; this catches the refactor.
test('_site is hashed exactly once', () => {
  const deployContent = readDeploySource();
  const manifestWalkCount = (deployContent.match(/buildContentManifest\(/g) || []).length;
  assert.strictEqual(
    manifestWalkCount,
    1,
    `Deploy script must hash _site exactly once and share the manifest, found ${manifestWalkCount} buildContentManifest() call(s)`
  );
});

test('the one manifest is passed to both the purge and IndexNow', () => {
  const deployContent = readDeploySource();
  const sharesManifestWithBothConsumers =
    /purgeChangedDeployContent\([^)]*\{[^}]*currentManifest/.test(deployContent) &&
    /processIndexNow\(\{[^}]*currentManifest/.test(deployContent);
  assert.ok(
    sharesManifestWithBothConsumers,
    'Deploy script must pass currentManifest to both purgeChangedDeployContent and processIndexNow'
  );
});

// Child processes go through runWithSpinner. A hand-rolled spawn and
// spinner beside it is the ~90-line duplicate removed 2026-11-08.
test('deploy.js has no spawn or spinner of its own', () => {
  const deployContent = readDeploySource();
  assert.ok(
    !(/\bspawn\(/.test(deployContent) || deployContent.includes('setInterval(')),
    'Deploy script must run child processes through runWithSpinner (spinner-utils), not its own spawn and spinner'
  );
});

// The quiet default is only real if deploy.js uses the shared builder and
// still offers a way to get the detail back.
test('deploy.js builds rsync args with the shared builder and accepts --verbose', () => {
  const deployContent = readDeploySource();
  const usesSharedRsyncArgs =
    deployContent.includes("require('../utils/deploy-rsync')") &&
    deployContent.includes("process.argv.includes('--verbose')");
  assert.ok(usesSharedRsyncArgs, 'Deploy script must build rsync args via utils/deploy-rsync and accept --verbose');
});
