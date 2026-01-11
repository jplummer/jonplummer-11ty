#!/usr/bin/env node

/**
 * Create IndexNow Key File
 * 
 * Reads INDEXNOW_API_KEY from .env and creates the key file in src/
 * that will be deployed to the site root for IndexNow verification.
 */

const fs = require('fs');
const path = require('path');
const { loadDotenvSilently } = require('./env-utils');

// Load environment variables
if (fs.existsSync('.env')) {
  loadDotenvSilently();
}

const apiKey = process.env.INDEXNOW_API_KEY;

if (!apiKey) {
  console.error('❌ INDEXNOW_API_KEY not found in .env file');
  console.error('   Please add INDEXNOW_API_KEY to your .env file');
  process.exit(1);
}

const keyFileName = `${apiKey}.txt`;
const keyFilePath = path.join(process.cwd(), 'src', keyFileName);

// Check if file already exists and matches
let needsUpdate = true;
if (fs.existsSync(keyFilePath)) {
  const existingContent = fs.readFileSync(keyFilePath, 'utf8').trim();
  if (existingContent === apiKey) {
    needsUpdate = false;
  } else {
    // Key changed - need to update file and remove old key files
    console.log(`⚠️  Key in .env differs from existing key file. Updating...`);
    
    // Find and remove any other key files (in case key changed)
    const srcDir = path.join(process.cwd(), 'src');
    if (fs.existsSync(srcDir)) {
      const files = fs.readdirSync(srcDir);
      for (const file of files) {
        if (file.endsWith('.txt') && file !== keyFileName) {
          const filePath = path.join(srcDir, file);
          const content = fs.readFileSync(filePath, 'utf8').trim();
          // Check if it looks like an IndexNow key (simple heuristic: alphanumeric, reasonable length)
          if (/^[a-zA-Z0-9_-]{16,}$/.test(content)) {
            fs.unlinkSync(filePath);
            console.log(`   Removed old key file: src/${file}`);
          }
        }
      }
    }
  }
}

if (needsUpdate) {
  // Create or update the key file with the key as content
  fs.writeFileSync(keyFilePath, apiKey, 'utf8');
  console.log(`✅ Created/updated IndexNow key file: src/${keyFileName}`);
} else {
  console.log(`✅ IndexNow key file already exists and matches: src/${keyFileName}`);
}

console.log(`   This file will be deployed to: https://${process.env.SITE_DOMAIN || 'jonplummer.com'}/${keyFileName}`);

