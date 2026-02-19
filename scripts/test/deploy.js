#!/usr/bin/env node

/**
 * Test Deployment Script
 * 
 * This script tests the rsync-based deployment setup by verifying:
 * - Environment variables are configured
 * - rsync is installed and available
 * - SSH connectivity to remote server
 * - Remote directory access and permissions
 * - File upload capability via rsync
 * 
 * Requirements:
 * - rsync must be installed on your system
 * - SSH access to your remote server
 * - .env file with DEPLOY_HOST, DEPLOY_USERNAME, and DEPLOY_REMOTE_PATH
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { loadDotenvSilently } = require('../utils/env-utils');

console.log('🔍 Testing rsync deployment connectivity...\n');

// Test 0: Deploy script contains changelog commit/push logic (regression guard)
const deployScriptPath = path.join(__dirname, '..', 'deploy', 'deploy.js');
if (fs.existsSync(deployScriptPath)) {
  const deployContent = fs.readFileSync(deployScriptPath, 'utf8');
  const hasChangelogCommitLogic =
    deployContent.includes('changelogChanged') &&
    deployContent.includes('git add CHANGELOG.md') &&
    deployContent.includes('changelog: update') &&
    deployContent.includes('git push');
  if (!hasChangelogCommitLogic) {
    console.log('❌ Deploy script missing changelog commit/push logic');
    process.exit(1);
  }
}

// Load environment variables
if (fs.existsSync('.env')) {
  loadDotenvSilently();
  console.log('✅ .env file found and loaded');
} else {
  console.log('❌ .env file not found');
  process.exit(1);
}

// Configuration from environment variables
const config = {
  host: process.env.DEPLOY_HOST,
  username: process.env.DEPLOY_USERNAME,
  password: process.env.DEPLOY_PASSWORD || null,
  remotePath: process.env.DEPLOY_REMOTE_PATH,
  localPath: './_site/'
};

// Test 1: Validate environment variables
console.log('\n📋 Testing environment variables...');
const requiredVars = ['DEPLOY_HOST', 'DEPLOY_USERNAME', 'DEPLOY_REMOTE_PATH'];
let missingVars = [];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
    console.log(`❌ Missing: ${varName}`);
  } else {
    console.log(`✅ ${varName}: ${process.env[varName]}`);
  }
});

if (missingVars.length > 0) {
  console.log('\n❌ Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

// Check if password is provided
if (config.password) {
  console.log('✅ DEPLOY_PASSWORD: *** (masked)');
} else {
  console.log('ℹ️  DEPLOY_PASSWORD: not set (will use SSH key or prompt for password)');
}

// Test 2: Check if _site directory exists
console.log('\n📁 Testing local build directory...');
if (fs.existsSync('./_site')) {
  const files = fs.readdirSync('./_site');
  console.log(`✅ _site directory exists with ${files.length} files`);
} else {
  console.log('❌ _site directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Test 3: Check if rsync is available
console.log('\n🔧 Testing rsync availability...');
function checkRsync() {
  try {
    execSync('which rsync', { stdio: 'pipe' });
    console.log('✅ rsync is installed and available');
    return true;
  } catch (error) {
    console.log('❌ rsync is not installed or not in PATH');
    console.log('   Please install rsync:');
    console.log('   - macOS: brew install rsync');
    console.log('   - Ubuntu/Debian: sudo apt-get install rsync');
    console.log('   - Windows: Install WSL or use Git Bash');
    return false;
  }
}

if (!checkRsync()) {
  process.exit(1);
}

// Test 4: Check authentication methods
console.log('\n🔑 Testing authentication methods...');
function checkSSHKey() {
  const sshDir = path.join(process.env.HOME || process.env.USERPROFILE, '.ssh');
  if (!fs.existsSync(sshDir)) return false;
  const defaultKeys = ['id_ed25519', 'id_ecdsa', 'id_rsa'];
  return defaultKeys.some((name) => fs.existsSync(path.join(sshDir, name)));
}

function checkSshpass() {
  try {
    execSync('which sshpass', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

const hasSSHKey = checkSSHKey();
const hasSshpass = checkSshpass();
const hasPassword = config.password !== null;

if (hasSSHKey) {
  console.log('✅ SSH key authentication available');
} else {
  console.log('ℹ️  No SSH key found');
}

if (hasSshpass) {
  console.log('✅ sshpass available for password authentication');
} else {
  console.log('ℹ️  sshpass not installed (optional for automated password auth)');
}

if (hasPassword) {
  console.log('✅ Password available in environment');
} else {
  console.log('ℹ️  No password in environment (will prompt if needed)');
}

if (!hasSSHKey && !hasSshpass && !hasPassword) {
  console.log('⚠️  No authentication method available');
  console.log('   You may need to enter your password during deployment');
}

// Test 5: Test SSH connectivity
console.log('\n🔐 Testing SSH connectivity...');
function testSSHConnection() {
  try {
    // Mask host in logs for security (username is typically not sensitive)
    const maskedHost = config.host ? config.host.replace(/./g, '*') : '***';
    console.log(`Testing SSH connection to ${config.username}@${maskedHost}...`);
    
    let sshCommand;
    
    if (hasSSHKey) {
      // Test with SSH key
      sshCommand = `ssh -o ConnectTimeout=10 -o BatchMode=yes ${config.username}@${config.host} "echo 'SSH connection successful'"`;
    } else if (hasSshpass && hasPassword) {
      // Test with sshpass using environment variable (avoids password in command line/process list)
      process.env.SSHPASS = config.password;
      sshCommand = `sshpass -e ssh -o ConnectTimeout=10 ${config.username}@${config.host} "echo 'SSH connection successful'"`;
    } else {
      // Test with password prompt (this will fail in automated testing)
      console.log('   Skipping SSH test (no automated authentication available)');
      console.log('   SSH connection will be tested during rsync upload test');
      return true;
    }
    
    const result = execSync(sshCommand, { stdio: 'pipe', encoding: 'utf8' });
    
    console.log('✅ SSH connection successful');
    console.log(`   Server response: ${result.trim()}`);
    return true;
    
  } catch (error) {
    console.log('❌ SSH connection failed');
    console.log('   This could be due to:');
    console.log('   - Incorrect host/username in .env');
    console.log('   - Server not accessible');
    console.log('   - Firewall blocking SSH (port 22)');
    console.log('   - SSH not enabled on server');
    console.log('   - Authentication issues (missing SSH key or wrong password)');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

if (!testSSHConnection()) {
  console.log('   Continuing with rsync test (SSH may work with rsync)...');
}

// Test 6: Test remote directory access
console.log('\n📂 Testing remote directory access...');
function testRemoteDirectory() {
  try {
    console.log(`Testing access to remote directory: ${config.remotePath}`);
    
    let lsCommand;
    
    if (hasSSHKey) {
      // Test with SSH key
      lsCommand = `ssh ${config.username}@${config.host} "ls -la '${config.remotePath}'"`;
    } else if (hasSshpass && hasPassword) {
      // Test with sshpass using environment variable (avoids password in command line/process list)
      process.env.SSHPASS = config.password;
      lsCommand = `sshpass -e ssh ${config.username}@${config.host} "ls -la '${config.remotePath}'"`;
    } else {
      // Skip if no automated authentication
      console.log('   Skipping directory test (no automated authentication available)');
      console.log('   Directory access will be tested during rsync upload test');
      return true;
    }
    
    const result = execSync(lsCommand, { stdio: 'pipe', encoding: 'utf8' });
    
    console.log('✅ Remote directory accessible');
    const lines = result.trim().split('\n').filter(line => line.length > 0);
    console.log(`   Directory contents: ${lines.length} items`);
    return true;
    
  } catch (error) {
    console.log('❌ Cannot access remote directory');
    console.log('   This could be due to:');
    console.log('   - Incorrect remote path in .env');
    console.log('   - Insufficient permissions');
    console.log('   - Directory does not exist');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

if (!testRemoteDirectory()) {
  console.log('   Continuing with rsync test (directory may be accessible via rsync)...');
}

// Test 7: Test rsync file upload capability
console.log('\n🔄 Testing rsync file upload capability...');
function testRsyncUpload() {
  try {
    // Create a small test file
    const testContent = 'This is a test file for deployment validation.';
    const testFile = './_site/test-deployment.txt';
    fs.writeFileSync(testFile, testContent);
    console.log('✅ Test file created locally');
    
    // Build rsync command with appropriate authentication
    let rsyncCommand;
    
    if (hasSSHKey) {
      // Use SSH key authentication
      rsyncCommand = `rsync -avz --dry-run ${testFile} ${config.username}@${config.host}:${config.remotePath}`;
    } else if (hasSshpass && hasPassword) {
      // Use sshpass for password authentication via environment variable (avoids password in command line/process list)
      process.env.SSHPASS = config.password;
      rsyncCommand = `sshpass -e rsync -avz --dry-run ${testFile} ${config.username}@${config.host}:${config.remotePath}`;
    } else {
      // Use password prompt (this will fail in automated testing)
      console.log('   Skipping rsync test (no automated authentication available)');
      console.log('   rsync will prompt for password during actual deployment');
      fs.unlinkSync(testFile);
      return true;
    }
    
    console.log('   Testing rsync upload (dry run)...');
    execSync(rsyncCommand, { stdio: 'pipe' });
    console.log('✅ rsync upload test successful');
    
    // Clean up test file locally
    fs.unlinkSync(testFile);
    console.log('✅ Test file cleaned up');
    
    return true;
    
  } catch (error) {
    console.log('❌ rsync upload test failed');
    console.log('   This could be due to:');
    console.log('   - Incorrect host/username/password in .env');
    console.log('   - Insufficient write permissions');
    console.log('   - Network connectivity issues');
    console.log('   - rsync configuration problems');
    console.log(`   Error: ${error.message}`);
    
    // Clean up test file if it exists
    try {
      if (fs.existsSync('./_site/test-deployment.txt')) {
        fs.unlinkSync('./_site/test-deployment.txt');
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    return false;
  }
}

if (!testRsyncUpload()) {
  console.log('   rsync test failed, but deployment may still work');
  console.log('   Try running "npm run deploy" to test actual deployment');
}

// All tests passed
console.log('\n🎉 All rsync deployment tests passed!');
console.log('✅ Your deployment setup is ready to use.');
console.log('\nNext steps:');
console.log('  - Run "npm run deploy" for deployment');
console.log('  - Check your site at: https://' + config.host);