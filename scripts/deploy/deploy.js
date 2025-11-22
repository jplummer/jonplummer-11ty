#!/usr/bin/env node

/**
 * Simple Deploy Script
 * 
 * Uses rsync to sync files to remote server with minimal complexity.
 * Preserves rsync's native output and error messages.
 * 
 * Requirements:
 * - rsync must be installed
 * - SSH access to remote server
 * - .env file with DREAMHOST_HOST, DREAMHOST_USERNAME, DREAMHOST_PASSWORD, DREAMHOST_REMOTE_PATH
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Deploying to Dreamhost via rsync...\n');

// Configuration
const config = {
  host: 'your-domain.com',
  username: 'your-username',
  password: null,
  remotePath: '/home/your-username/your-domain.com/',
  localPath: './_site/'
};

// Load .env configuration
if (fs.existsSync('.env')) {
  require('dotenv').config();
  config.host = process.env.DREAMHOST_HOST || config.host;
  config.username = process.env.DREAMHOST_USERNAME || config.username;
  config.password = process.env.DREAMHOST_PASSWORD || null;
  config.remotePath = process.env.DREAMHOST_REMOTE_PATH || config.remotePath;
}

// Check if _site directory exists
if (!fs.existsSync('./_site')) {
  console.error('❌ _site directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Regenerate changelog before deployment
console.log('📋 Regenerating CHANGELOG.md...');
try {
  execSync('node scripts/content/generate-changelog.js', { stdio: 'pipe' });
  console.log('   ✓ Changelog updated\n');
} catch (error) {
  console.warn('   ⚠️  Warning: Could not regenerate changelog (continuing anyway)');
  console.warn(`      ${error.message}\n`);
}

// Rebuild the site to include the new changelog
console.log('🏗️  Rebuilding site...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('   ✓ Build completed\n');
} catch (error) {
  console.error('❌ Build failed. Aborting deployment.');
  process.exit(1);
}

// Pre-deploy validation checks
const skipChecks = process.argv.includes('--skip-checks');

if (!skipChecks) {
  console.log('🔍 Running pre-deploy validation...\n');
  
  try {
    // Pre-build test (doesn't require _site/)
    console.log('   Running markdown validation...');
    execSync('npm run test markdown', { stdio: 'inherit' });
    
    // Post-build test (requires _site/, validates YAML + post structure)
    if (fs.existsSync('./_site')) {
      console.log('\n   Running content structure validation...');
      execSync('npm run test content', { stdio: 'inherit' });
    } else {
      console.log('   ⚠️  Skipping content test (requires _site/ directory)');
    }
    
    console.log('\n✅ All pre-deploy checks passed\n');
  } catch (error) {
    console.error('\n❌ Pre-deploy validation failed. Fix errors before deploying.');
    console.error('   To skip checks (not recommended): npm run deploy --skip-checks\n');
    process.exit(1);
  }
} else {
  console.log('⚠️  Skipping pre-deploy validation (--skip-checks flag used)\n');
}

// Check if rsync is available
function checkRsync() {
  try {
    execSync('which rsync', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if sshpass is available for password authentication
function checkSshpass() {
  try {
    execSync('which sshpass', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function deploy() {
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

    const hasSshpass = checkSshpass();
    const hasPassword = config.password !== null;

    if (!hasSshpass && !hasPassword) {
      console.error('❌ No authentication method available.');
      console.error('   Please either:');
      console.error('   1. Install sshpass and set DREAMHOST_PASSWORD in .env');
      console.error('   2. Set DREAMHOST_PASSWORD in .env (will prompt for password)');
      process.exit(1);
    }

    console.log('📤 Syncing files with rsync...');
    console.log(`   Local: ${config.localPath}`);
    console.log(`   Remote: ${config.username}@${config.host}:${config.remotePath}`);

    // Build rsync command
    let rsyncCommand;

    if (hasSshpass && hasPassword) {
      rsyncCommand = [
        'sshpass',
        '-p', config.password,
        'rsync',
        '-az', // Archive mode, compress
        '--delete', // Delete files on remote that don't exist locally
        '--exclude=.DS_Store', // Exclude macOS metadata files
        '--exclude=Thumbs.db', // Exclude Windows thumbnail files
        '--exclude=*.tmp', // Exclude temporary files
        '--progress', // Show progress
        '--stats', // Show transfer statistics
        `${config.localPath}`, // Source directory
        `${config.username}@${config.host}:${config.remotePath}` // Destination
      ];
    } else {
      // Use password prompt
      rsyncCommand = [
        'rsync',
        '-az', // Archive mode, compress
        '--delete', // Delete files on remote that don't exist locally
        '--exclude=.DS_Store', // Exclude macOS metadata files
        '--exclude=Thumbs.db', // Exclude Windows thumbnail files
        '--exclude=*.tmp', // Exclude temporary files
        '--progress', // Show progress
        '--stats', // Show transfer statistics
        `${config.localPath}`, // Source directory
        `${config.username}@${config.host}:${config.remotePath}` // Destination
      ];
    }

    console.log('\n🔄 Running rsync...\n');

    // Execute rsync with native output
    try {
      execSync(rsyncCommand.join(' '), {
        stdio: 'inherit' // Show rsync's native output
      });

      console.log('\n✅ Deployment completed successfully!');
      console.log(`🌐 Your site should be live at: https://${config.host}`);

    } catch (error) {
      console.error('\n❌ Deployment failed:');
      console.error(`   Exit code: ${error.status}`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Deployment failed:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

deploy();
