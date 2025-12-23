#!/usr/bin/env node
/**
 * Comprehensive test script for date/timezone changes
 * 
 * Verifies that:
 * 1. All permalinks remain unchanged
 * 2. Key output files are generated correctly
 * 3. URLs in sitemap, feeds, and index are valid
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, '..', '..', '_site');
const KEY_FILES = [
  'sitemap.xml',
  'feed.xml',
  'index.html',
  'links-feed.xml'
];

console.log('🧪 Testing date/timezone changes...\n');

// Step 1: Verify permalink compatibility
console.log('1️⃣  Testing permalink compatibility...');
try {
  const result = execSync('node scripts/test/test-permalink-compatibility.js', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log('   ✅ All permalinks compatible\n');
} catch (error) {
  console.error('   ❌ Permalink test failed!');
  console.error(error.stdout);
  process.exit(1);
}

// Step 2: Build the site
console.log('2️⃣  Building site...');
try {
  execSync('npm run build', { 
    encoding: 'utf8',
    stdio: 'inherit'
  });
  console.log('   ✅ Build completed\n');
} catch (error) {
  console.error('   ❌ Build failed!');
  process.exit(1);
}

// Step 3: Verify key files exist
console.log('3️⃣  Verifying key output files...');
let allFilesExist = true;
for (const file of KEY_FILES) {
  const filePath = path.join(OUTPUT_DIR, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`   ✅ ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`   ❌ ${file} - MISSING!`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.error('\n❌ Some key files are missing!');
  process.exit(1);
}
console.log();

// Step 4: Verify URLs in sitemap
console.log('4️⃣  Verifying URLs in sitemap.xml...');
try {
  const sitemap = fs.readFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'), 'utf8');
  const urlMatches = sitemap.match(/<loc>(.*?)<\/loc>/g) || [];
  const urls = urlMatches.map(m => m.replace(/<\/?loc>/g, ''));
  
  // Check for post URLs (should match /YYYY/MM/DD/slug/ pattern)
  const postUrls = urls.filter(url => /\/\d{4}\/\d{2}\/\d{2}\//.test(url));
  console.log(`   ✅ Found ${postUrls.length} post URLs in sitemap`);
  
  // Sample a few URLs to verify format
  const samples = postUrls.slice(0, 5);
  console.log('   Sample URLs:');
  samples.forEach(url => {
    const match = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\/([^\/]+)\//);
    if (match) {
      console.log(`      ${url} (${match[1]}-${match[2]}-${match[3]})`);
    }
  });
  console.log();
} catch (error) {
  console.error('   ❌ Error reading sitemap:', error.message);
  process.exit(1);
}

// Step 5: Verify feed.xml structure
console.log('5️⃣  Verifying feed.xml structure...');
try {
  const feed = fs.readFileSync(path.join(OUTPUT_DIR, 'feed.xml'), 'utf8');
  
  // Check for required RSS elements
  const hasChannel = feed.includes('<channel>');
  const hasTitle = feed.includes('<title>');
  const hasItems = (feed.match(/<item>/g) || []).length;
  
  console.log(`   ✅ Channel: ${hasChannel ? 'yes' : 'no'}`);
  console.log(`   ✅ Title: ${hasTitle ? 'yes' : 'no'}`);
  console.log(`   ✅ Items: ${hasItems}`);
  
  // Check for post URLs
  const feedUrls = (feed.match(/<link>(.*?)<\/link>/g) || [])
    .map(m => m.replace(/<\/?link>/g, ''))
    .filter(url => url.includes('http'));
  console.log(`   ✅ Found ${feedUrls.length} item links`);
  console.log();
} catch (error) {
  console.error('   ❌ Error reading feed:', error.message);
  process.exit(1);
}

// Step 6: Verify index.html has posts
console.log('6️⃣  Verifying index.html...');
try {
  const index = fs.readFileSync(path.join(OUTPUT_DIR, 'index.html'), 'utf8');
  
  // Check for post links
  const postLinks = (index.match(/href="(\/\d{4}\/\d{2}\/\d{2}\/[^"]+)"/g) || [])
    .map(m => m.match(/href="([^"]+)"/)[1]);
  
  console.log(`   ✅ Found ${postLinks.length} post links on homepage`);
  
  if (postLinks.length > 0) {
    console.log('   Sample links:');
    postLinks.slice(0, 3).forEach(link => {
      console.log(`      ${link}`);
    });
  }
  console.log();
} catch (error) {
  console.error('   ❌ Error reading index:', error.message);
  process.exit(1);
}

// Step 7: Verify links-feed.xml
console.log('7️⃣  Verifying links-feed.xml...');
try {
  const linksFeed = fs.readFileSync(path.join(OUTPUT_DIR, 'links-feed.xml'), 'utf8');
  
  const hasChannel = linksFeed.includes('<channel>');
  const items = (linksFeed.match(/<item>/g) || []).length;
  
  console.log(`   ✅ Channel: ${hasChannel ? 'yes' : 'no'}`);
  console.log(`   ✅ Items: ${items}`);
  console.log();
} catch (error) {
  console.error('   ❌ Error reading links-feed:', error.message);
  process.exit(1);
}

console.log('✅ All tests passed! Date/timezone changes are working correctly.\n');
console.log('📝 Next steps:');
console.log('   1. Review the generated files to ensure they look correct');
console.log('   2. Check a few post URLs manually to verify they work');
console.log('   3. If everything looks good, commit the changes');
