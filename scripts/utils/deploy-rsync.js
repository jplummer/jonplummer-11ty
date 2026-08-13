/**
 * rsync argument construction for scripts/deploy/deploy.js.
 *
 * Kept in its own module so `pnpm run test deploy-guards` can assert the actual
 * flags — deploy.js runs a deploy inside a top-level IIFE, so a test can't
 * require it.
 *
 * Detail flags (--itemize-changes, --stats) are opt-in. Every build rewrites
 * _site/, so rsync sees a new mtime on nearly every file and itemizes thousands
 * of lines that say nothing about what actually changed; that output once fed
 * the purge step, but purge now diffs content hashes and reports its own counts.
 * Dry-run is an inspection mode, so it keeps the detail unconditionally.
 */

const EXCLUDES = [
  '--exclude=.DS_Store', // macOS metadata files
  '--exclude=Thumbs.db', // Windows thumbnail files
  '--exclude=*.tmp', // temporary files
];

const DETAIL_ARGS = [
  '--itemize-changes', // per-path change listing
  '--stats', // transfer statistics summary
  '--human-readable', // sizes as KB/MB (affects --stats and --itemize-changes)
];

/**
 * Builds the full rsync argv, including the 'rsync' command itself at index 0.
 *
 * @param {object} options
 * @param {string} options.localPath - Source directory (e.g. './_site/')
 * @param {string} options.username - SSH username
 * @param {string} options.host - SSH host
 * @param {string} options.remotePath - Destination path on the remote
 * @param {boolean} [options.dryRun] - Add --dry-run and force detailed output
 * @param {boolean} [options.verbose] - Force detailed output on a real deploy
 * @returns {string[]} rsync argv
 */
function buildRsyncArgs({ localPath, username, host, remotePath, dryRun = false, verbose = false }) {
  const args = [
    'rsync',
    '-az', // archive mode, compress
    '--delete', // remove remote files that no longer exist locally
    ...EXCLUDES,
  ];

  if (dryRun || verbose) {
    args.push(...DETAIL_ARGS);
  }

  if (dryRun) {
    args.push('--dry-run');
    args.push('-v');
  }

  args.push(localPath);
  args.push(`${username}@${host}:${remotePath}`);

  return args;
}

module.exports = { buildRsyncArgs, DETAIL_ARGS };
