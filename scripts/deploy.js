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

// Parse rsync output for file transfers and warnings
function parseRsyncOutput(output) {
  const warnings = [];
  const transferredFiles = [];
  const lines = output.split('\n');
  
  // Debug: log the raw output for troubleshooting
  if (process.env.DEBUG_DEPLOY) {
    console.log('\n🔍 DEBUG - Raw rsync output:');
    console.log('─'.repeat(40));
    lines.forEach((line, i) => {
      console.log(`${i.toString().padStart(3, ' ')}: ${line}`);
    });
    console.log('─'.repeat(40));
  }
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) continue;
    
    // File transfer lines (verbose output) - more flexible pattern matching
    // Pattern: [<>ch][fdL][-+?][-+?][-+?] size date time filename
    if (trimmed.match(/^[<>ch][fdL][-+?][-+?][-+?]\s+\d+\s+\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\s+(.+)$/)) {
      const match = trimmed.match(/^[<>ch][fdL][-+?][-+?][-+?]\s+\d+\s+\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\s+(.+)$/);
      if (match) {
        transferredFiles.push(match[1]);
      }
    }
    // Alternative pattern for files without timestamps
    else if (trimmed.match(/^[<>ch][fdL][-+?][-+?][-+?]\s+\d+\s+(.+)$/)) {
      const match = trimmed.match(/^[<>ch][fdL][-+?][-+?][-+?]\s+\d+\s+(.+)$/);
      if (match) {
        transferredFiles.push(match[1]);
      }
    }
    // Simple file listing pattern (just filename after status)
    else if (trimmed.match(/^[<>ch][fdL][-+?][-+?][-+?]\s+(.+)$/)) {
      const match = trimmed.match(/^[<>ch][fdL][-+?][-+?][-+?]\s+(.+)$/);
      if (match) {
        transferredFiles.push(match[1]);
      }
    }
    // Directory deletion errors
    else if (trimmed.includes('cannot delete non-empty directory:')) {
      const match = trimmed.match(/cannot delete non-empty directory: (.+)/);
      if (match) {
        warnings.push(`⚠️  Cannot delete non-empty directory: ${match[1]}`);
        warnings.push(`   This directory may contain files not in your local build.`);
        warnings.push(`   Consider manually cleaning it up on the server if needed.`);
      }
    }
    // Permission errors
    else if (trimmed.includes('Permission denied') || trimmed.includes('permission denied')) {
      warnings.push(`🔒 Permission denied: ${trimmed}`);
    }
    // File not found errors
    else if (trimmed.includes('No such file or directory')) {
      warnings.push(`📁 File not found: ${trimmed}`);
    }
    // Other rsync warnings
    else if (trimmed.startsWith('rsync warning:') || trimmed.startsWith('rsync: warning:')) {
      warnings.push(`⚠️  ${trimmed}`);
    }
    // Connection issues
    else if (trimmed.includes('Connection refused') || trimmed.includes('connection refused')) {
      warnings.push(`🔌 Connection refused: ${trimmed}`);
    }
  }
  
  return { warnings, transferredFiles };
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
    
    // First, run a dry-run to show what would be transferred
    console.log('\n🔍 Checking what files would be transferred...');
    let dryRunCommand;
    
    if (hasSSHKey) {
      dryRunCommand = [
        'rsync',
        '-azv', // Archive mode, compress, verbose
        '--dry-run', // Don't actually transfer
        '--delete', // Delete files on remote that don't exist locally
        '--exclude=.DS_Store', // Exclude macOS metadata files
        '--exclude=Thumbs.db', // Exclude Windows thumbnail files
        '--exclude=*.tmp', // Exclude temporary files
        `${config.localPath}`, // Source directory (with trailing slash)
        `${config.username}@${config.host}:${config.remotePath}` // Destination
      ];
    } else if (hasSshpass && hasPassword) {
      dryRunCommand = [
        'sshpass',
        '-p', config.password,
        'rsync',
        '-azv', // Archive mode, compress, verbose
        '--dry-run', // Don't actually transfer
        '--delete', // Delete files on remote that don't exist locally
        '--exclude=.DS_Store', // Exclude macOS metadata files
        '--exclude=Thumbs.db', // Exclude Windows thumbnail files
        '--exclude=*.tmp', // Exclude temporary files
        `${config.localPath}`, // Source directory (with trailing slash)
        `${config.username}@${config.host}:${config.remotePath}` // Destination
      ];
    } else {
      dryRunCommand = [
        'rsync',
        '-azv', // Archive mode, compress, verbose
        '--dry-run', // Don't actually transfer
        '--delete', // Delete files on remote that don't exist locally
        '--exclude=.DS_Store', // Exclude macOS metadata files
        '--exclude=Thumbs.db', // Exclude Windows thumbnail files
        '--exclude=*.tmp', // Exclude temporary files
        `${config.localPath}`, // Source directory (with trailing slash)
        `${config.username}@${config.host}:${config.remotePath}` // Destination
      ];
    }
    
    try {
      const dryRunOutput = execSync(dryRunCommand.join(' '), { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      const { transferredFiles: dryRunFiles } = parseRsyncOutput(dryRunOutput);
      
      if (dryRunFiles.length > 0) {
        console.log('\n📁 Files that will be transferred:');
        console.log('─'.repeat(40));
        dryRunFiles.forEach(file => {
          console.log(`   📄 ${file}`);
        });
        console.log(`\n   Total files to transfer: ${dryRunFiles.length}`);
        console.log('─'.repeat(40));
      } else {
        console.log('✅ No files need to be transferred - everything is up to date!');
      }
    } catch (error) {
      console.log('⚠️  Could not run dry-run check, proceeding with deployment...');
    }

    // Build rsync command with appropriate authentication
    let rsyncCommand;
    
    if (hasSSHKey) {
      // Use SSH key authentication
      rsyncCommand = [
        'rsync',
        '-azv', // Archive mode, compress, verbose
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
        '-azv', // Archive mode, compress, verbose
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
        '-azv', // Archive mode, compress, verbose
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

    // Execute rsync and capture output
    let rsyncOutput = '';
    let exitCode = 0;
    
    try {
      rsyncOutput = execSync(rsyncCommand.join(' '), { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
    } catch (error) {
      rsyncOutput = error.stdout || '';
      exitCode = error.status || 1;
      
      // Debug: show stderr for connection issues
      if (process.env.DEBUG_DEPLOY && error.stderr) {
        console.log('\n🔍 DEBUG - rsync stderr:');
        console.log('─'.repeat(40));
        console.log(error.stderr);
        console.log('─'.repeat(40));
      }
    }

    // Parse rsync output for file transfers and warnings
    const { warnings, transferredFiles } = parseRsyncOutput(rsyncOutput);
    
    // Display transferred files
    if (transferredFiles.length > 0) {
      console.log('\n📁 Files being uploaded:');
      console.log('─'.repeat(40));
      transferredFiles.forEach(file => {
        console.log(`   📄 ${file}`);
      });
      console.log(`\n   Total files: ${transferredFiles.length}`);
      console.log('─'.repeat(40));
    } else {
      // No files transferred - check if this is because everything is up to date
      const statsMatch = rsyncOutput.match(/Number of files transferred: (\d+)/);
      const totalFilesMatch = rsyncOutput.match(/Number of files: (\d+)/);
      
      if (statsMatch && totalFilesMatch) {
        const transferred = parseInt(statsMatch[1]);
        const total = parseInt(totalFilesMatch[1]);
        
        if (transferred === 0 && total > 0) {
          console.log('\n✅ All files are already up to date on the server!');
          console.log(`📊 Total files checked: ${total}`);
          console.log('   No files needed to be transferred.');
        } else if (transferred > 0) {
          console.log(`\n📊 Files transferred: ${transferred} of ${total} total files`);
        }
      }
    }
    
    // Display warnings if any
    if (warnings.length > 0) {
      console.log('\n⚠️  DEPLOYMENT WARNINGS:');
      console.log('─'.repeat(40));
      warnings.forEach(warning => {
        console.log(`   ${warning}`);
      });
      console.log('─'.repeat(40));
    }

    if (exitCode === 0) {
      console.log('\n✅ Full deployment completed successfully!');
      console.log(`🌐 Your site should be live at: https://${config.host}`);
      console.log('\n📊 All files have been synced to the remote server.');
      
      if (warnings.length > 0) {
        console.log('\n💡 Note: Some warnings occurred during deployment. Check the details above.');
      }
    } else {
      throw new Error(`rsync failed with exit code ${exitCode}`);
    }

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
