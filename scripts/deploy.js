#!/usr/bin/env node

/**
 * Full Deploy Script
 * 
 * This script uses rsync to deploy all files to the remote server.
 * It performs a complete sync, uploading all files from the _site directory.
 * 
 * Requirements:
 * - rsync must be installed on your system
 * - SSH access to your remote server (preferably with SSH key authentication)
 * - .env file with DREAMHOST_HOST, DREAMHOST_USERNAME, and DREAMHOST_REMOTE_PATH
 * 
 * Installation:
 * - macOS: brew install rsync
 * - Ubuntu/Debian: sudo apt-get install rsync
 * - Windows: Use WSL or Git Bash (rsync is included)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying to Dreamhost via rsync...\n');

// Configuration
const config = {
  host: 'your-domain.com',
  username: 'your-username',
  password: null, // Will be set from .env if available
  remotePath: '/home/your-username/your-domain.com/',
  localPath: './_site/'
};

// Check if .env file exists for configuration
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

// Check if rsync is available
function checkRsync() {
  try {
    execSync('which rsync', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if SSH key is available for passwordless authentication
function checkSSHKey() {
  const sshKeyPath = path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'id_rsa');
  return fs.existsSync(sshKeyPath);
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

    // Check authentication method
    const hasSSHKey = checkSSHKey();
    const hasSshpass = checkSshpass();
    const hasPassword = config.password !== null;

    if (!hasSSHKey && !hasSshpass && !hasPassword) {
      console.error('❌ No authentication method available.');
      console.error('   Please either:');
      console.error('   1. Set up SSH key authentication (recommended)');
      console.error('   2. Install sshpass and set DREAMHOST_PASSWORD in .env');
      console.error('   3. Set DREAMHOST_PASSWORD in .env (will prompt for password)');
      process.exit(1);
    }

    if (hasSSHKey) {
      console.log('✅ SSH key authentication available');
    } else if (hasSshpass && hasPassword) {
      console.log('✅ Password authentication via sshpass available');
    } else if (hasPassword) {
      console.warn('⚠️  Password authentication will prompt for password');
      console.warn('   Consider installing sshpass for automated password authentication');
    }

    console.log('📤 Syncing all files with rsync...');
    console.log(`   Local: ${config.localPath}`);
    console.log(`   Remote: ${config.username}@${config.host}:${config.remotePath}`);

    // Build rsync command with appropriate authentication
    let rsyncCommand;
    
    if (hasSSHKey) {
      // Use SSH key authentication
      rsyncCommand = [
        'rsync',
        '-az', // Archive mode, compress (removed verbose)
        '--delete', // Delete files on remote that don't exist locally
        '--exclude=.DS_Store', // Exclude macOS metadata files
        '--exclude=Thumbs.db', // Exclude Windows thumbnail files
        '--exclude=*.tmp', // Exclude temporary files
        '--progress', // Show progress
        '--stats', // Show transfer statistics
        `${config.localPath}`, // Source directory (with trailing slash)
        `${config.username}@${config.host}:${config.remotePath}` // Destination
      ];
    } else if (hasSshpass && hasPassword) {
      // Use sshpass for password authentication
      rsyncCommand = [
        'sshpass',
        '-p', config.password,
        'rsync',
        '-az', // Archive mode, compress (removed verbose)
        '--delete', // Delete files on remote that don't exist locally
        '--exclude=.DS_Store', // Exclude macOS metadata files
        '--exclude=Thumbs.db', // Exclude Windows thumbnail files
        '--exclude=*.tmp', // Exclude temporary files
        '--progress', // Show progress
        '--stats', // Show transfer statistics
        `${config.localPath}`, // Source directory (with trailing slash)
        `${config.username}@${config.host}:${config.remotePath}` // Destination
      ];
    } else {
      // Use password prompt (will ask for password interactively)
      rsyncCommand = [
        'rsync',
        '-az', // Archive mode, compress (removed verbose)
        '--delete', // Delete files on remote that don't exist locally
        '--exclude=.DS_Store', // Exclude macOS metadata files
        '--exclude=Thumbs.db', // Exclude Windows thumbnail files
        '--exclude=*.tmp', // Exclude temporary files
        '--progress', // Show progress
        '--stats', // Show transfer statistics
        `${config.localPath}`, // Source directory (with trailing slash)
        `${config.username}@${config.host}:${config.remotePath}` // Destination
      ];
    }

    console.log('\n🔄 Running rsync command...');
    // Mask password in display
    const displayCommand = hasSshpass && hasPassword 
      ? rsyncCommand.map((arg, i) => i === 2 ? '***' : arg).join(' ')
      : rsyncCommand.join(' ');
    console.log(`   ${displayCommand}\n`);

    // Execute rsync
    const result = execSync(rsyncCommand.join(' '), { 
      stdio: 'inherit',
      encoding: 'utf8'
    });

    console.log('\n✅ Full deployment completed successfully!');
    console.log(`🌐 Your site should be live at: https://${config.host}`);
    console.log('\n📊 All files have been synced to the remote server.');

  } catch (error) {
    console.error('\n❌ Deployment failed:');
    if (error.status === 255) {
      console.error('   SSH connection failed. Please check:');
      console.error('   - Host and username are correct');
      console.error('   - SSH key is set up properly');
      console.error('   - Remote server is accessible');
    } else if (error.status === 23) {
      console.error('   Partial transfer due to file errors. Check file permissions.');
    } else {
      console.error(`   Error code: ${error.status}`);
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

deploy();
