#!/usr/bin/env node

/**
 * Preview Deploy Changes Script
 * 
 * This script shows what "npm run deploy-changes" would do without actually making changes.
 * It uses rsync's --dry-run option to show what files would be uploaded, updated, or removed.
 * 
 * Requirements:
 * - rsync must be installed on your system
 * - SSH access to your remote server (preferably with SSH key authentication)
 * - .env file with DREAMHOST_HOST, DREAMHOST_USERNAME, and DREAMHOST_REMOTE_PATH
 * 
 * Usage:
 * - npm run preview-deploy-changes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Previewing what "npm run deploy-changes" would do...\n');

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

// Parse rsync dry-run output to categorize changes
function parseRsyncOutput(output) {
  const lines = output.split('\n');
  const changes = {
    uploading: [],
    updating: [],
    deleting: [],
    warnings: [],
    stats: {}
  };

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Only process lines that look like file operations or statistics
    if (trimmed.startsWith('deleting ')) {
      const file = trimmed.replace('deleting ', '');
      changes.deleting.push(file);
      
      // Check if this is a directory that might have deletion issues
      if (file.endsWith('/') || file.includes('/')) {
        changes.warnings.push(`⚠️  Directory will be deleted: ${file}`);
        changes.warnings.push(`   This may fail if the directory contains files not in your local build.`);
      }
    } else if (trimmed.startsWith('>f+++++++++') || trimmed.startsWith('>d+++++++++')) {
      // New file or directory (verbose format)
      const file = trimmed.substring(11).trim();
      if (file) {
        changes.uploading.push(file);
      }
    } else if (trimmed.startsWith('>f') || trimmed.startsWith('>d')) {
      // Updated file or directory
      const file = trimmed.substring(2).trim();
      if (file) {
        changes.updating.push(file);
      }
    } else if (trimmed.includes('Number of files:')) {
      // Parse statistics
      const match = trimmed.match(/Number of files: (\d+)/);
      if (match) changes.stats.files = parseInt(match[1]);
    } else if (trimmed.includes('Number of regular files transferred:')) {
      const match = trimmed.match(/Number of regular files transferred: (\d+)/);
      if (match) changes.stats.transferred = parseInt(match[1]);
    } else if (trimmed.includes('Total file size:')) {
      const match = trimmed.match(/Total file size: (\d+) bytes/);
      if (match) changes.stats.totalSize = parseInt(match[1]);
    } else if (trimmed.includes('Total transferred file size:')) {
      const match = trimmed.match(/Total transferred file size: (\d+) bytes/);
      if (match) changes.stats.transferredSize = parseInt(match[1]);
    }
    // Skip everything else (progress bars, formatting, etc.)
  }

  return changes;
}

// Format file size for display
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Display changes in a nice format
function displayChanges(changes) {
  console.log('📋 DEPLOYMENT PREVIEW\n');
  console.log('='.repeat(50));

  // Files to upload (new)
  if (changes.uploading.length > 0) {
    console.log('\n📤 FILES TO UPLOAD (New):');
    console.log('─'.repeat(30));
    changes.uploading.forEach(file => {
      console.log(`   + ${file}`);
    });
    console.log(`   Total: ${changes.uploading.length} files`);
  } else {
    console.log('\n📤 FILES TO UPLOAD: None');
  }

  // Files to update (modified)
  if (changes.updating.length > 0) {
    console.log('\n🔄 FILES TO UPDATE (Modified):');
    console.log('─'.repeat(30));
    changes.updating.forEach(file => {
      console.log(`   ~ ${file}`);
    });
    console.log(`   Total: ${changes.updating.length} files`);
  } else {
    console.log('\n🔄 FILES TO UPDATE: None');
  }

  // Files to delete
  if (changes.deleting.length > 0) {
    console.log('\n🗑️  FILES TO DELETE (Remote only):');
    console.log('─'.repeat(30));
    changes.deleting.forEach(file => {
      console.log(`   - ${file}`);
    });
    console.log(`   Total: ${changes.deleting.length} files`);
  } else {
    console.log('\n🗑️  FILES TO DELETE: None');
  }

  // Warnings
  if (changes.warnings.length > 0) {
    console.log('\n⚠️  POTENTIAL ISSUES:');
    console.log('─'.repeat(30));
    changes.warnings.forEach(warning => {
      console.log(`   ${warning}`);
    });
  }

  // Statistics
  if (Object.keys(changes.stats).length > 0) {
    console.log('\n📊 TRANSFER STATISTICS:');
    console.log('─'.repeat(30));
    if (changes.stats.files !== undefined) {
      console.log(`   Files to process: ${changes.stats.files}`);
    }
    if (changes.stats.transferred !== undefined) {
      console.log(`   Files to transfer: ${changes.stats.transferred}`);
    }
    if (changes.stats.totalSize !== undefined) {
      console.log(`   Total size: ${formatBytes(changes.stats.totalSize)}`);
    }
    if (changes.stats.transferredSize !== undefined) {
      console.log(`   Data to transfer: ${formatBytes(changes.stats.transferredSize)}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  
  // Summary
  const totalChanges = changes.uploading.length + changes.updating.length + changes.deleting.length;
  if (totalChanges === 0) {
    console.log('✅ No changes needed - local and remote are in sync!');
  } else {
    console.log(`📈 Summary: ${totalChanges} total changes`);
    console.log(`   • ${changes.uploading.length} new files`);
    console.log(`   • ${changes.updating.length} modified files`);
    console.log(`   • ${changes.deleting.length} files to remove`);
  }
}

function previewDeployChanges() {
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

    console.log(`📡 Connecting to: ${config.username}@${config.host}`);
    console.log(`📁 Local path: ${config.localPath}`);
    console.log(`📁 Remote path: ${config.remotePath}`);
    console.log('\n🔍 Running dry-run analysis...\n');

    // Build rsync command with dry-run and verbose output
    let rsyncCommand;
    
    if (hasSSHKey) {
      // Use SSH key authentication
      rsyncCommand = [
        'rsync',
        '-az', // Archive mode, compress
        '--delete', // Delete files on remote that don't exist locally
        '--exclude=.DS_Store', // Exclude macOS metadata files
        '--exclude=Thumbs.db', // Exclude Windows thumbnail files
        '--exclude=*.tmp', // Exclude temporary files
        '--dry-run', // Don't actually transfer files
        '--verbose', // Show detailed output
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
        '-az', // Archive mode, compress
        '--delete', // Delete files on remote that don't exist locally
        '--exclude=.DS_Store', // Exclude macOS metadata files
        '--exclude=Thumbs.db', // Exclude Windows thumbnail files
        '--exclude=*.tmp', // Exclude temporary files
        '--dry-run', // Don't actually transfer files
        '--verbose', // Show detailed output
        '--stats', // Show transfer statistics
        `${config.localPath}`, // Source directory (with trailing slash)
        `${config.username}@${config.host}:${config.remotePath}` // Destination
      ];
    } else {
      // Use password prompt (will ask for password interactively)
      rsyncCommand = [
        'rsync',
        '-az', // Archive mode, compress
        '--delete', // Delete files on remote that don't exist locally
        '--exclude=.DS_Store', // Exclude macOS metadata files
        '--exclude=Thumbs.db', // Exclude Windows thumbnail files
        '--exclude=*.tmp', // Exclude temporary files
        '--dry-run', // Don't actually transfer files
        '--verbose', // Show detailed output
        '--stats', // Show transfer statistics
        `${config.localPath}`, // Source directory (with trailing slash)
        `${config.username}@${config.host}:${config.remotePath}` // Destination
      ];
    }

    // Execute rsync dry-run
    const result = execSync(rsyncCommand.join(' '), { 
      stdio: 'pipe',
      encoding: 'utf8'
    });

    // Parse and display the results
    const changes = parseRsyncOutput(result);
    displayChanges(changes);

    console.log('\n💡 To actually deploy these changes, run: npm run deploy-changes');

  } catch (error) {
    console.error('\n❌ Preview failed:');
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

previewDeployChanges();
