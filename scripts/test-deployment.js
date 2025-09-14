#!/usr/bin/env node

const SftpClient = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing SFTP deployment connectivity...\n');

// Load environment variables
if (fs.existsSync('.env')) {
  require('dotenv').config();
  console.log('✅ .env file found and loaded');
} else {
  console.log('❌ .env file not found');
  process.exit(1);
}

// Configuration from environment variables
const config = {
  host: process.env.DREAMHOST_HOST,
  username: process.env.DREAMHOST_USERNAME,
  password: process.env.DREAMHOST_PASSWORD,
  remotePath: process.env.DREAMHOST_REMOTE_PATH,
  localPath: './_site/'
};

// Test 1: Validate environment variables
console.log('\n📋 Testing environment variables...');
const requiredVars = ['DREAMHOST_HOST', 'DREAMHOST_USERNAME', 'DREAMHOST_PASSWORD', 'DREAMHOST_REMOTE_PATH'];
let missingVars = [];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
    console.log(`❌ Missing: ${varName}`);
  } else {
    // Mask sensitive values for display
    const value = process.env[varName];
    const maskedValue = varName.includes('PASSWORD') ? '***' : value;
    console.log(`✅ ${varName}: ${maskedValue}`);
  }
});

if (missingVars.length > 0) {
  console.log('\n❌ Missing required environment variables. Please check your .env file.');
  process.exit(1);
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

// Test 3: Test SFTP connectivity
console.log('\n🔐 Testing SFTP connectivity...');
const sftp = new SftpClient();

async function testSftpConnection() {
  try {
    console.log(`Testing connection to ${config.username}@${config.host}...`);
    
    await sftp.connect({
      host: config.host,
      username: config.username,
      password: config.password,
      port: 22
    });
    
    console.log('✅ SFTP connection successful');
    
    // Test 4: Test remote directory access
    console.log('\n📂 Testing remote directory access...');
    try {
      const list = await sftp.list(config.remotePath);
      console.log('✅ Remote directory accessible');
      console.log(`   Directory contents: ${list.length} items`);
    } catch (error) {
      console.log('❌ Cannot access remote directory');
      console.log('   This could be due to:');
      console.log('   - Incorrect remote path in .env');
      console.log('   - Insufficient permissions');
      console.log('   - Directory does not exist');
      console.log(`   Error: ${error.message}`);
      throw error;
    }
    
    // Test 5: Test file upload capability
    console.log('\n🔄 Testing file upload capability...');
    try {
      // Create a small test file
      const testContent = 'This is a test file for deployment validation.';
      const testFile = './_site/test-deployment.txt';
      fs.writeFileSync(testFile, testContent);
      
      // Upload the test file
      const testRemotePath = path.join(config.remotePath, 'test-deployment.txt').replace(/\\/g, '/');
      await sftp.put(testFile, testRemotePath);
      console.log('✅ File upload test successful');
      
      // Clean up test file locally and remotely
      fs.unlinkSync(testFile);
      await sftp.delete(testRemotePath);
      console.log('✅ Test file cleaned up');
      
    } catch (error) {
      console.log('❌ File upload test failed');
      console.log('   This could be due to:');
      console.log('   - Insufficient write permissions');
      console.log('   - Network connectivity issues');
      console.log('   - Server configuration problems');
      console.log(`   Error: ${error.message}`);
      throw error;
    }
    
    // All tests passed
    console.log('\n🎉 All SFTP deployment tests passed!');
    console.log('✅ Your deployment setup is ready to use.');
    console.log('\nNext steps:');
    console.log('  - Run "npm run deploy" for full deployment');
    console.log('  - Run "npm run deploy-changes" for incremental deployment');
    console.log('  - Check your site at: https://' + config.host.replace(/^.*\./, ''));
    
  } catch (error) {
    console.log('❌ SFTP connection failed');
    console.log('   This could be due to:');
    console.log('   - Incorrect host/username/password in .env');
    console.log('   - Server not accessible');
    console.log('   - Firewall blocking connection');
    console.log('   - SFTP not enabled on server');
    console.log(`   Error: ${error.message}`);
    process.exit(1);
  } finally {
    // Always close the connection
    await sftp.end();
  }
}

testSftpConnection();