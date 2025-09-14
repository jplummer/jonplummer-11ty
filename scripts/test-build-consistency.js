#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Create a hash of file contents
function hashFile(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  } catch (error) {
    return null;
  }
}

// Create a hash of directory contents (excluding timestamps)
function hashDirectory(dirPath, excludePatterns = []) {
  const hashes = [];
  
  function processDirectory(currentPath) {
    try {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);
        
        // Skip excluded patterns
        if (excludePatterns.some(pattern => fullPath.includes(pattern))) {
          continue;
        }
        
        if (stat.isDirectory()) {
          processDirectory(fullPath);
        } else {
          const hash = hashFile(fullPath);
          if (hash) {
            hashes.push({
              path: path.relative(dirPath, fullPath),
              hash: hash,
              size: stat.size
            });
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
  }
  
  processDirectory(dirPath);
  return hashes.sort((a, b) => a.path.localeCompare(b.path));
}

// Check for timestamp-dependent content
function checkTimestampDependencies(htmlContent) {
  const issues = [];
  
  // Check for current year in content
  const currentYear = new Date().getFullYear();
  const yearRegex = new RegExp(`\\b${currentYear}\\b`, 'g');
  const yearMatches = htmlContent.match(yearRegex);
  
  if (yearMatches && yearMatches.length > 0) {
    issues.push(`Contains current year (${currentYear}) - may cause build inconsistency`);
  }
  
  // Check for "now" or "today" references
  const nowRegex = /\b(now|today|current|latest)\b/gi;
  const nowMatches = htmlContent.match(nowRegex);
  
  if (nowMatches && nowMatches.length > 0) {
    issues.push(`Contains time-dependent words: ${nowMatches.join(', ')}`);
  }
  
  // Check for relative dates
  const relativeDateRegex = /\b(yesterday|tomorrow|last week|next week|last month|next month)\b/gi;
  const relativeMatches = htmlContent.match(relativeDateRegex);
  
  if (relativeMatches && relativeMatches.length > 0) {
    issues.push(`Contains relative dates: ${relativeMatches.join(', ')}`);
  }
  
  return issues;
}

// Check for build-specific paths or URLs
function checkBuildSpecificContent(htmlContent) {
  const issues = [];
  
  // Check for localhost references
  if (htmlContent.includes('localhost') || htmlContent.includes('127.0.0.1')) {
    issues.push('Contains localhost references');
  }
  
  // Check for development URLs
  if (htmlContent.includes('file://') || htmlContent.includes('C:\\') || htmlContent.includes('/Users/')) {
    issues.push('Contains development file paths');
  }
  
  // Check for build-specific comments
  if (htmlContent.includes('<!-- build:') || htmlContent.includes('<!-- endbuild -->')) {
    issues.push('Contains build-specific comments');
  }
  
  return issues;
}

// Compare two builds
function compareBuilds(build1Path, build2Path) {
  console.log('🔄 Comparing builds...\n');
  
  const build1Hashes = hashDirectory(build1Path, ['node_modules', '.git']);
  const build2Hashes = hashDirectory(build2Path, ['node_modules', '.git']);
  
  const differences = [];
  
  // Find files that exist in one build but not the other
  const build1Paths = new Set(build1Hashes.map(item => item.path));
  const build2Paths = new Set(build2Hashes.map(item => item.path));
  
  // Files only in build1
  for (const path of build1Paths) {
    if (!build2Paths.has(path)) {
      differences.push({
        type: 'missing_in_build2',
        path: path,
        build1: 'exists',
        build2: 'missing'
      });
    }
  }
  
  // Files only in build2
  for (const path of build2Paths) {
    if (!build1Paths.has(path)) {
      differences.push({
        type: 'missing_in_build1',
        path: path,
        build1: 'missing',
        build2: 'exists'
      });
    }
  }
  
  // Compare common files
  for (const item1 of build1Hashes) {
    const item2 = build2Hashes.find(item => item.path === item1.path);
    if (item2) {
      if (item1.hash !== item2.hash) {
        differences.push({
          type: 'content_different',
          path: item1.path,
          build1: item1.hash,
          build2: item2.hash
        });
      }
    }
  }
  
  return differences;
}

// Test build consistency
function testBuildConsistency() {
  console.log('🔄 Testing build consistency...\n');
  
  const siteDir = './_site';
  const tempDir = './_temp_build';
  
  if (!fs.existsSync(siteDir)) {
    console.log('❌ _site directory not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  // Create a temporary directory for second build
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  
  try {
    // Run a second build
    console.log('📦 Running second build for comparison...');
    execSync('npm run build', { stdio: 'pipe' });
    
    // Move the second build to temp directory
    fs.renameSync(siteDir, tempDir);
    
    // Run third build
    console.log('📦 Running third build...');
    execSync('npm run build', { stdio: 'pipe' });
    
    // Compare builds
    const differences = compareBuilds(siteDir, tempDir);
    
    if (differences.length === 0) {
      console.log('✅ Builds are consistent - no differences found');
    } else {
      console.log(`❌ Found ${differences.length} differences between builds:`);
      
      differences.forEach(diff => {
        console.log(`   ${diff.type}: ${diff.path}`);
        if (diff.type === 'content_different') {
          console.log(`      Build 1: ${diff.build1.substring(0, 8)}...`);
          console.log(`      Build 2: ${diff.build2.substring(0, 8)}...`);
        }
      });
    }
    
    // Check for timestamp dependencies in current build
    console.log('\n🕒 Checking for timestamp dependencies...');
    const htmlFiles = findHtmlFiles(siteDir);
    let timestampIssues = 0;
    
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const issues = checkTimestampDependencies(content);
      
      if (issues.length > 0) {
        const relativePath = path.relative(siteDir, file);
        console.log(`   ${relativePath}:`);
        issues.forEach(issue => console.log(`      - ${issue}`));
        timestampIssues += issues.length;
      }
    }
    
    // Check for build-specific content
    console.log('\n🔧 Checking for build-specific content...');
    let buildSpecificIssues = 0;
    
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const issues = checkBuildSpecificContent(content);
      
      if (issues.length > 0) {
        const relativePath = path.relative(siteDir, file);
        console.log(`   ${relativePath}:`);
        issues.forEach(issue => console.log(`      - ${issue}`));
        buildSpecificIssues += issues.length;
      }
    }
    
    // Summary
    console.log('\n📊 Build Consistency Summary:');
    console.log(`   Build differences: ${differences.length}`);
    console.log(`   Timestamp dependencies: ${timestampIssues}`);
    console.log(`   Build-specific content: ${buildSpecificIssues}`);
    
    if (differences.length > 0 || timestampIssues > 0 || buildSpecificIssues > 0) {
      console.log('\n❌ Build consistency issues found.');
      process.exit(1);
    } else {
      console.log('\n🎉 Build consistency validation passed!');
    }
    
  } finally {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  }
}

// Find HTML files helper
function findHtmlFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findHtmlFiles(fullPath));
    } else if (item.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Run test
testBuildConsistency();
