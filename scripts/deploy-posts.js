#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying recent changes to Dreamhost...\n');

// Configuration - update these with your actual Dreamhost details
const config = {
  host: 'your-domain.com',
  username: 'your-username',
  remotePath: '/home/your-username/your-domain.com/',
  localPath: './_site/'
};

// Check if .env file exists for configuration
if (fs.existsSync('.env')) {
  require('dotenv').config();
  config.host = process.env.DREAMHOST_HOST || config.host;
  config.username = process.env.DREAMHOST_USERNAME || config.username;
  config.remotePath = process.env.DREAMHOST_REMOTE_PATH || config.remotePath;
}

// Calculate timestamp for one week ago
const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
const oneWeekAgoTimestamp = Math.floor(oneWeekAgo.getTime() / 1000);

console.log(`📅 Looking for files modified since: ${oneWeekAgo.toISOString()}`);

// Check if _site directory exists
if (!fs.existsSync('./_site')) {
  console.error('❌ _site directory not found. Please run "npm run build" first.');
  process.exit(1);
}

try {
  // Use rsync with --files-from to upload only recent files
  // First, find all files modified in the last week
  const findCommand = `find ./_site -type f -newermt "${oneWeekAgo.toISOString()}" -print0`;
  const files = execSync(findCommand, { encoding: 'utf8' }).split('\0').filter(f => f.length > 0);
  
  if (files.length === 0) {
    console.log('ℹ️  No files have been modified in the last week.');
    console.log('   Use "npm run deploy" to upload all files.');
    process.exit(0);
  }
  
  console.log(`📁 Found ${files.length} files modified in the last week:`);
  files.forEach(file => {
    const relativePath = path.relative('./_site', file);
    const stats = fs.statSync(file);
    const modifiedDate = stats.mtime.toISOString();
    console.log(`   - ${relativePath} (modified: ${modifiedDate})`);
  });
  
  console.log('\n📤 Uploading recent files...');
  
  // Create a temporary file list for rsync
  const tempFileList = '/tmp/rsync_files.txt';
  fs.writeFileSync(tempFileList, files.join('\n'));
  
  // Use rsync with --files-from to upload only the recent files
  const rsyncCommand = `rsync -avz --files-from=${tempFileList} --relative ./_site/ ${config.username}@${config.host}:${config.remotePath}`;
  
  console.log(`Running: ${rsyncCommand}\n`);
  execSync(rsyncCommand, { stdio: 'inherit' });
  
  // Clean up temporary file
  fs.unlinkSync(tempFileList);
  
  console.log('\n✅ Recent changes deployment completed successfully!');
  console.log(`🌐 Your updated site should be live at: https://${config.host}`);
  
} catch (error) {
  console.error('❌ Deployment failed:');
  console.error(error.message);
  process.exit(1);
}
