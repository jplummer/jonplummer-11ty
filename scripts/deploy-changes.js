#!/usr/bin/env node

const SftpClient = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying recent changes to Dreamhost via SFTP...\n');

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

// Calculate timestamp for one week ago
const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

console.log(`📅 Looking for files modified since: ${oneWeekAgo.toISOString()}`);

// Check if _site directory exists
if (!fs.existsSync('./_site')) {
  console.error('❌ _site directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Find files modified in the last week
function findRecentFiles(dir, since) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findRecentFiles(fullPath, since));
    } else if (stat.mtime > since) {
      files.push(fullPath);
    }
  }
  
  return files;
}

const sftp = new SftpClient();

async function deployChanges() {
  try {
    // Find recent files
    const recentFiles = findRecentFiles('./_site', oneWeekAgo);
    
    if (recentFiles.length === 0) {
      console.log('ℹ️  No files have been modified in the last week.');
      console.log('   Use "npm run deploy" to upload all files.');
      return;
    }
    
    console.log(`📁 Found ${recentFiles.length} files modified in the last week:`);
    recentFiles.forEach(file => {
      const relativePath = path.relative('./_site', file);
      const stats = fs.statSync(file);
      const modifiedDate = stats.mtime.toISOString();
      console.log(`   - ${relativePath} (modified: ${modifiedDate})`);
    });
    
    console.log('\n📤 Connecting to SFTP server...');
    
    // Connect to SFTP server
    await sftp.connect({
      host: config.host,
      username: config.username,
      password: config.password,
      port: 22
    });
    
    console.log('✅ Connected successfully!');
    
    // Upload each recent file
    console.log('📤 Uploading recent files...');
    for (const file of recentFiles) {
      const relativePath = path.relative('./_site', file);
      const remotePath = path.join(config.remotePath, relativePath).replace(/\\/g, '/');
      
      // Ensure remote directory exists
      const remoteDir = path.dirname(remotePath);
      try {
        await sftp.mkdir(remoteDir, true);
      } catch (error) {
        // Directory might already exist, which is fine
        if (!error.message.includes('File exists')) {
          throw error;
        }
      }
      
      // Upload the file
      await sftp.put(file, remotePath);
      console.log(`   ✅ Uploaded: ${relativePath}`);
    }
    
    console.log('\n✅ Recent changes deployment completed successfully!');
    console.log(`🌐 Your updated site should be live at: https://${config.host.replace(/^.*\./, '')}`);
    
  } catch (error) {
    console.error('❌ Deployment failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    // Always close the connection
    await sftp.end();
  }
}

deployChanges();
