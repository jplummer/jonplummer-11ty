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
 * 
 * Options:
 * - --dry-run: Run all checks and show what would be deployed, but don't actually deploy
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { loadDotenvSilently } = require('../utils/env-utils');
const { SPINNER_FRAMES } = require('../utils/spinner-utils');


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

async function deploy(config, siteDomain, dryRun) {
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
    const rsyncCommand = [
      'rsync',
      '-az', // Archive mode, compress
      '--delete', // Delete files on remote that don't exist locally
      '--exclude=.DS_Store', // Exclude macOS metadata files
      '--exclude=Thumbs.db', // Exclude Windows thumbnail files
      '--exclude=*.tmp', // Exclude temporary files
      '--stats', // Show transfer statistics summary (includes "Number of files transferred: 0" when nothing changes)
      '--human-readable', // Show sizes in human-readable format
    ];

    // Add --dry-run flag if in dry-run mode
    if (dryRun) {
      rsyncCommand.push('--dry-run');
      rsyncCommand.push('-v'); // Verbose output for dry-run
    }

    rsyncCommand.push(`${config.localPath}`); // Source directory
    rsyncCommand.push(`${config.username}@${config.host}:${config.remotePath}`); // Destination

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
        
        // Display buffered output
        if (dryRun) {
          console.log('📋 rsync dry-run output (no files will be transferred):');
          console.log('─'.repeat(60));
        }
        
        if (stdoutData) {
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
          resolve();
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

// Main async function to support await
(async () => {
  // Check for command-line flags
  const dryRun = process.argv.includes('--dry-run');

  // Debug: Log received arguments (helpful for troubleshooting)
  if (process.env.DEBUG_DEPLOY) {
    console.log('Debug: process.argv =', process.argv);
    console.log('Debug: dryRun =', dryRun);
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
    await deploy(config, siteDomain, dryRun);
    
    // Notify IndexNow after successful deployment (only if not dry-run)
    if (!dryRun) {
      try {
        const { processIndexNow } = require('../utils/indexnow');
        await processIndexNow({ quiet: false });
      } catch (error) {
        // Don't fail deployment if IndexNow fails
        console.log('⚠️  🔍 IndexNow: notification failed (deployment succeeded)');
        console.warn(`   ${error.message}\n`);
      }

      // Commit and push changelog if it was updated (keeps repo in sync)
      if (changelogChanged) {
        try {
          execSync('git add CHANGELOG.md', { cwd: process.cwd(), stdio: 'pipe' });
          execSync('git commit -m "changelog: update"', { cwd: process.cwd(), stdio: 'pipe' });
          execSync('git push', { cwd: process.cwd(), stdio: 'inherit' });
          console.log('✅ 📋 Changelog: committed and pushed\n');
        } catch (error) {
          console.log('⚠️  📋 Changelog: could not commit/push (deployment succeeded)');
          console.warn(`   ${error.message}\n`);
        }
      }
    }
  } catch (error) {
    process.exit(1);
  }
})();
