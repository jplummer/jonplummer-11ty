#!/usr/bin/env node

/**
 * Simple Deploy Script
 * 
 * Uses rsync to sync files to remote server with minimal complexity.
 * Preserves rsync's native output and error messages.
 * 
 * Requirements:
 * - rsync must be installed
 * - SSH access to remote server (passwordless SSH key authentication)
 * - .env file with DEPLOY_HOST, DEPLOY_USERNAME, DEPLOY_REMOTE_PATH
 * - Optional: CLOUDFLARE_ZONE_ID + CLOUDFLARE_API_TOKEN to purge changed URLs post-deploy
 * 
 * Options:
 * - --dry-run: Run all checks and show what would be deployed, but don't actually deploy
 * - --verbose: Show rsync's per-file listing and transfer statistics. Off by
 *   default because a normal deploy re-uploads every file the build touched,
 *   which is thousands of lines; the Cloudflare purge step reports what actually
 *   changed. Failures and rsync warnings print either way.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { loadDotenvSilently } = require('../utils/env-utils');
const { SPINNER_FRAMES } = require('../utils/spinner-utils');
const { buildRsyncArgs } = require('../utils/deploy-rsync');


// Check if rsync is available
function checkRsync() {
  try {
    execSync('which rsync', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Run a command with a spinner
function runWithSpinner(command, message, options = {}) {
  return new Promise((resolve, reject) => {
    const { showOutput = false, shell = false } = options;
    let spinnerInterval = null;
    let spinnerFrame = 0;
    let stdoutData = '';
    let stderrData = '';
    
    // Start spinner (write to stderr so it doesn't interfere with stdout)
    spinnerInterval = setInterval(() => {
      const spinner = SPINNER_FRAMES[spinnerFrame];
      process.stderr.write(`\r${spinner} ${message}`);
      spinnerFrame = (spinnerFrame + 1) % SPINNER_FRAMES.length;
    }, 100);
    
    // Spawn process
    let child;
    if (shell) {
      // Pass full command string unsplit to avoid DEP0190 warning
      const cmd = Array.isArray(command) ? command.join(' ') : command;
      child = spawn(cmd, [], { stdio: ['inherit', 'pipe', 'pipe'], shell: true });
    } else {
      const commandParts = Array.isArray(command) ? command : command.split(' ');
      child = spawn(commandParts[0], commandParts.slice(1), { stdio: ['inherit', 'pipe', 'pipe'] });
    }
    
    // Handle output
    child.stdout.on('data', (data) => {
      const text = data.toString();
      stdoutData += text;
      
      if (showOutput) {
        // Stop spinner when output arrives
        if (spinnerInterval) {
          clearInterval(spinnerInterval);
          spinnerInterval = null;
          // Clear spinner line
          process.stderr.write('\r' + ' '.repeat(message.length + 3) + '\r');
        }
        process.stdout.write(text);
      }
    });
    
    child.stderr.on('data', (data) => {
      const text = data.toString();
      stderrData += text;
      
      if (showOutput) {
        // Stop spinner when output arrives
        if (spinnerInterval) {
          clearInterval(spinnerInterval);
          spinnerInterval = null;
          // Clear spinner line
          process.stderr.write('\r' + ' '.repeat(message.length + 3) + '\r');
        }
        process.stderr.write(text);
      }
    });
    
    // Handle completion
    child.on('close', (code) => {
      // Stop spinner
      if (spinnerInterval) {
        clearInterval(spinnerInterval);
        spinnerInterval = null;
      }
      
      // Clear spinner line
      process.stderr.write('\r' + ' '.repeat(message.length + 3) + '\r');
      
      if (code === 0) {
        resolve({ stdout: stdoutData, stderr: stderrData });
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    // Handle spawn errors
    child.on('error', (error) => {
      // Stop spinner
      if (spinnerInterval) {
        clearInterval(spinnerInterval);
        spinnerInterval = null;
      }
      process.stderr.write('\r' + ' '.repeat(message.length + 3) + '\r');
      reject(error);
    });
  });
}

async function deploy(config, siteDomain, dryRun, verbose = false) {
  try {
    // Check prerequisites
    if (!checkRsync()) {
      console.error('❌ rsync is not installed or not in PATH.');
      console.error('   Please install rsync:');
      console.error('   - macOS: brew install rsync');
      console.error('   - Ubuntu/Debian: sudo apt-get install rsync');
      console.error('   - Windows: Install WSL or use Git Bash');
      process.exit(1);
    }

    // Build rsync command (SSH key authentication is automatic)
    const rsyncCommand = buildRsyncArgs({
      localPath: config.localPath,
      username: config.username,
      host: config.host,
      remotePath: config.remotePath,
      dryRun,
      verbose,
    });

    // Safety check: NEVER deploy if dryRun is true, even if rsync flag is missing
    if (dryRun && !rsyncCommand.includes('--dry-run')) {
      console.error('\n❌ SAFETY CHECK FAILED: dryRun is true but rsync --dry-run flag is missing!');
      console.error('   This should never happen. Aborting to prevent accidental deployment.');
      process.exit(1);
    }

    // Execute rsync with spinner and buffered output
    return new Promise((resolve, reject) => {
      let spinnerInterval = null;
      let spinnerFrame = 0;
      let stdoutData = '';
      let stderrData = '';
      
      // Start spinner
      const spinnerMessage = dryRun ? 'Deploying (dry-run)...' : 'Deploying via rsync...';
      spinnerInterval = setInterval(() => {
        const spinner = SPINNER_FRAMES[spinnerFrame];
        process.stdout.write(`\r${spinner} ${spinnerMessage}`);
        spinnerFrame = (spinnerFrame + 1) % SPINNER_FRAMES.length;
      }, 100);
      
      // Spawn rsync process
      const rsyncProcess = spawn(rsyncCommand[0], rsyncCommand.slice(1), {
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: false
      });
      
      // Buffer stdout
      rsyncProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });
      
      // Buffer stderr
      rsyncProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });
      
      // Handle completion
      rsyncProcess.on('close', (code) => {
        // Stop spinner
        if (spinnerInterval) {
          clearInterval(spinnerInterval);
          spinnerInterval = null;
        }
        
        // Clear spinner line
        process.stdout.write('\r' + ' '.repeat(50) + '\r');
        
        // Display buffered output. A quiet deploy withholds rsync's listing —
        // it's thousands of mtime-only lines — but a failure shows everything,
        // and rsync's warnings on stderr always print.
        const showListing = dryRun || verbose || code !== 0;

        if (dryRun) {
          console.log('📋 rsync dry-run output (no files will be transferred):');
          console.log('─'.repeat(60));
        }

        if (stdoutData && showListing) {
          process.stdout.write(stdoutData);
        }
        if (stderrData) {
          process.stderr.write(stderrData);
        }

        if (dryRun) {
          console.log('─'.repeat(60));
        }
        
        // Handle result
        if (code === 0) {
          if (dryRun) {
            console.log('✅ 🚀 Deploy: dry run completed (no files deployed)');
            console.log('   This was a test run only - no changes were made to the server.');
          } else {
            console.log(`\n✅ 🚀 Deploy: completed`);
            console.log(`   🌐 Site live at: https://${siteDomain}`);
          }
          resolve({ stdout: stdoutData, stderr: stderrData });
        } else {
          console.error('\n❌ Deployment failed:');
          console.error(`   Exit code: ${code}`);
          reject(new Error(`rsync exited with code ${code}`));
        }
      });
      
      // Handle spawn errors
      rsyncProcess.on('error', (error) => {
        // Stop spinner
        if (spinnerInterval) {
          clearInterval(spinnerInterval);
          spinnerInterval = null;
        }
        process.stdout.write('\r' + ' '.repeat(50) + '\r');
        console.error('\n❌ Deployment failed:');
        console.error(`   ${error.message}`);
        reject(error);
      });
    });

  } catch (error) {
    console.error('\n❌ Deployment failed:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

function logCloudflarePurgeResult(purgeResult, { dryRun }) {
  if (purgeResult.skipped && purgeResult.reason === 'not-configured') {
    console.log('ℹ️  ☁️  Cloudflare purge: skipped (set CLOUDFLARE_ZONE_ID + CLOUDFLARE_API_TOKEN in .env)\n');
    return;
  }

  if (purgeResult.skipped && purgeResult.reason === 'no-baseline') {
    console.log('ℹ️  ☁️  Cloudflare purge: no baseline manifest yet — establishing one now, nothing purged this run\n');
    return;
  }

  if (purgeResult.skipped && purgeResult.reason === 'no-changes') {
    console.log('✅ ☁️  Cloudflare purge: nothing to purge (content unchanged)\n');
    return;
  }

  const prefix = dryRun
    ? '☁️  Cloudflare purge (dry-run, from content hash): would purge'
    : '✅ ☁️  Cloudflare purge (from content hash):';
  if (dryRun) {
    console.log(`${prefix} ${purgeResult.urls.length} URL(s)`);
  } else {
    console.log(`${prefix} ${purgeResult.purged} URL(s) in ${purgeResult.batches} batch(es)`);
  }

  const urls = purgeResult.urls;
  const show = urls.length <= 8 ? urls : urls.slice(0, 5).concat([`… and ${urls.length - 5} more`]);
  for (const url of show) {
    console.log(`   ${url}`);
  }
  console.log('');
}

async function purgeCloudflareAfterDeploy(siteDomain, dryRun, localPath) {
  const {
    purgeChangedDeployContent,
    saveContentManifest,
    defaultManifestPath,
    isCloudflarePurgeConfigured,
  } = require('../utils/cloudflare-purge');

  // dry-run still computes would-purge even without creds (same as today's list behavior)
  if (!dryRun && !isCloudflarePurgeConfigured()) {
    logCloudflarePurgeResult({ skipped: true, reason: 'not-configured' }, { dryRun: false });
    return;
  }

  try {
    const purgeResult = await purgeChangedDeployContent(localPath, siteDomain, { dryRun });
    logCloudflarePurgeResult(purgeResult, { dryRun });
    if (purgeResult.writeManifest && purgeResult.currentManifest) {
      saveContentManifest(defaultManifestPath(), purgeResult.currentManifest);
    }
  } catch (error) {
    console.log('⚠️  ☁️  Cloudflare purge: failed (deployment succeeded)');
    console.warn(`   ${error.message}\n`);
    // do not write manifest
  }
}

// Main async function to support await
(async () => {
  // Check for command-line flags
  const dryRun = process.argv.includes('--dry-run');
  const verbose = process.argv.includes('--verbose');

  // Debug: Log received arguments (helpful for troubleshooting)
  if (process.env.DEBUG_DEPLOY) {
    console.log('Debug: process.argv =', process.argv);
    console.log('Debug: dryRun =', dryRun);
    console.log('Debug: verbose =', verbose);
    console.log('');
  }

  // Configuration
  const config = {
    host: 'your-domain.com',
    username: 'your-username',
    remotePath: '/home/your-username/your-domain.com/',
    localPath: './_site/'
  };

  // Load .env configuration (suppress dotenv debug messages)
  if (fs.existsSync('.env')) {
    loadDotenvSilently();
    
    config.host = process.env.DEPLOY_HOST || config.host;
    config.username = process.env.DEPLOY_USERNAME || config.username;
    config.remotePath = process.env.DEPLOY_REMOTE_PATH || config.remotePath;
  }

  // Get public site domain for final message (not SSH hostname)
  let siteDomain = process.env.SITE_DOMAIN || 'jonplummer.com';

  // Regenerate changelog before deployment
  let changelogChanged = false;
  try {
    // Check if changelog exists and get its content before regeneration
    const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
    let oldContent = null;
    
    if (fs.existsSync(changelogPath)) {
      oldContent = fs.readFileSync(changelogPath, 'utf8');
    }
    
    await runWithSpinner('node scripts/content/generate-changelog.js --deploy', 'Regenerating CHANGELOG.md...');
    
    // Check if content actually changed
    if (oldContent !== null) {
      const newContent = fs.readFileSync(changelogPath, 'utf8');
      changelogChanged = oldContent !== newContent;
    } else {
      // File didn't exist before, so it was created (changed)
      changelogChanged = true;
    }
    
    if (changelogChanged) {
      console.log('✅ 📋 Changelog: updated\n');
    } else {
      console.log('✅ 📋 Changelog: up-to-date\n');
    }
  } catch (error) {
    console.log('⚠️  📋 Changelog: could not regenerate (continuing anyway)');
    console.warn(`   ${error.message}\n`);
    // If changelog generation failed, assume it didn't change
    changelogChanged = false;
  }

  // Build site (source checks, OG images, Eleventy, output checks)
  try {
    execSync('pnpm run build', { stdio: 'inherit', shell: true });
  } catch {
    console.error('\n❌ 🏗️  Build failed. Aborting deployment.\n');
    process.exit(1);
  }

  // Now run the actual deployment
  if (dryRun) {
    console.log('🧪 Dry run mode: Testing deployment without actually deploying...\n');
  } else {
    console.log('🚀 Deploying via rsync...\n');
  }
  
  try {
    await deploy(config, siteDomain, dryRun, verbose);

    await purgeCloudflareAfterDeploy(siteDomain, dryRun, config.localPath);

    // Notify IndexNow — runs even on --dry-run so it prints what it would
    // submit; dryRun itself is what stops it from POSTing or writing state.
    try {
      const { processIndexNow } = require('../utils/indexnow');
      await processIndexNow({ siteRoot: config.localPath, siteDomain, dryRun });
    } catch (error) {
      // Don't fail deployment if IndexNow fails
      console.log('⚠️  🔍 IndexNow: notification failed (deployment succeeded)');
      console.warn(`   ${error.message}\n`);
    }

    if (!dryRun) {
      // Commit changelog if it was updated (keeps repo in sync)
      if (changelogChanged) {
        try {
          execSync('git add CHANGELOG.md', { cwd: process.cwd(), stdio: 'pipe' });
          execSync('git commit -m "changelog: update"', { cwd: process.cwd(), stdio: 'pipe' });
          console.log('✅ 📋 Changelog: committed\n');
        } catch (error) {
          console.log('⚠️  📋 Changelog: could not commit (deployment succeeded)');
          console.warn(`   ${error.message}\n`);
        }
      }

      // Always push after a successful deploy — not just when the changelog
      // changed — so locally committed work never gets stranded unpushed.
      try {
        execSync('git push', { cwd: process.cwd(), stdio: 'inherit' });
        console.log('✅ 📤 Pushed to remote\n');
      } catch (error) {
        console.log('⚠️  📤 Push failed (deployment succeeded) — push manually');
        console.warn(`   ${error.message}\n`);
      }
    }
  } catch (error) {
    process.exit(1);
  }
})();
