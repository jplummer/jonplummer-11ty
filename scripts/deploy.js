#!/usr/bin/env node

const SftpClient = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying to Dreamhost via SFTP...\n');

// Configuration
const config = {
  host: 'your-domain.com',
  username: 'your-username',
  password: 'your-password',
  remotePath: '/home/your-username/your-domain.com/',
  localPath: './_site/'
};

// Check if .env file exists for configuration
if (fs.existsSync('.env')) {
  require('dotenv').config();
  config.host = process.env.DREAMHOST_HOST || config.host;
  config.username = process.env.DREAMHOST_USERNAME || config.username;
  config.password = process.env.DREAMHOST_PASSWORD || config.password;
  config.remotePath = process.env.DREAMHOST_REMOTE_PATH || config.remotePath;
}

// Check if _site directory exists
if (!fs.existsSync('./_site')) {
  console.error('❌ _site directory not found. Please run "npm run build" first.');
  process.exit(1);
}

const sftp = new SftpClient();

async function deploy() {
  try {
    console.log(`📤 Connecting to ${config.host}...`);
    
    // Connect to SFTP server
    await sftp.connect({
      host: config.host,
      username: config.username,
      password: config.password,
      port: 22
    });
    
    console.log('✅ Connected successfully!');
    
    // Ensure remote directory exists
    console.log('📁 Ensuring remote directory exists...');
    try {
      await sftp.mkdir(config.remotePath, true);
    } catch (error) {
      // Directory might already exist, which is fine
      if (!error.message.includes('File exists')) {
        throw error;
      }
    }
    
    // Upload all files from _site directory
    console.log('📤 Uploading files...');
    await sftp.uploadDir(config.localPath, config.remotePath);
    
    console.log('\n✅ Deployment completed successfully!');
    console.log(`🌐 Your site should be live at: https://${config.host.replace(/^.*\./, '')}`);
    
  } catch (error) {
    console.error('❌ Deployment failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    // Always close the connection
    await sftp.end();
  }
}

deploy();
