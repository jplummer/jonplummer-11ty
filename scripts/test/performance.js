#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get file size in bytes
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

// Get directory size recursively
function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        totalSize += getDirectorySize(fullPath);
      } else {
        totalSize += stat.size;
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
  }
  
  return totalSize;
}

// Format bytes to human readable format
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Find all files by extension
function findFilesByExtension(dir, extensions) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findFilesByExtension(fullPath, extensions));
    } else {
      const ext = path.extname(item).toLowerCase();
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

// Analyze image files
function analyzeImages(imageFiles) {
  const results = {
    total: imageFiles.length,
    totalSize: 0,
    largeImages: [],
    unoptimizedImages: [],
    byType: {}
  };
  
  for (const file of imageFiles) {
    const size = getFileSize(file);
    const ext = path.extname(file).toLowerCase();
    const relativePath = path.relative('./_site', file);
    
    results.totalSize += size;
    
    // Track by file type
    if (!results.byType[ext]) {
      results.byType[ext] = { count: 0, size: 0 };
    }
    results.byType[ext].count++;
    results.byType[ext].size += size;
    
    // Check for large images (>500KB)
    if (size > 500 * 1024) {
      results.largeImages.push({
        file: relativePath,
        size: size,
        formattedSize: formatBytes(size)
      });
    }
    
    // Check for unoptimized formats
    if (['.bmp', '.tiff', '.tif'].includes(ext)) {
      results.unoptimizedImages.push({
        file: relativePath,
        size: size,
        format: ext
      });
    }
  }
  
  return results;
}

// Analyze CSS files
function analyzeCSS(cssFiles) {
  const results = {
    total: cssFiles.length,
    totalSize: 0,
    largeFiles: [],
    unminifiedFiles: []
  };
  
  for (const file of cssFiles) {
    const size = getFileSize(file);
    const relativePath = path.relative('./_site', file);
    
    results.totalSize += size;
    
    // Check for large CSS files (>100KB)
    if (size > 100 * 1024) {
      results.largeFiles.push({
        file: relativePath,
        size: size,
        formattedSize: formatBytes(size)
      });
    }
    
    // Check if file appears to be minified
    const content = fs.readFileSync(file, 'utf8');
    const isMinified = !content.includes('\n') || content.split('\n').length < 10;
    
    if (!isMinified) {
      results.unminifiedFiles.push({
        file: relativePath,
        size: size
      });
    }
  }
  
  return results;
}

// Analyze JavaScript files
function analyzeJS(jsFiles) {
  const results = {
    total: jsFiles.length,
    totalSize: 0,
    largeFiles: [],
    unminifiedFiles: []
  };
  
  for (const file of jsFiles) {
    const size = getFileSize(file);
    const relativePath = path.relative('./_site', file);
    
    results.totalSize += size;
    
    // Check for large JS files (>100KB)
    if (size > 100 * 1024) {
      results.largeFiles.push({
        file: relativePath,
        size: size,
        formattedSize: formatBytes(size)
      });
    }
    
    // Check if file appears to be minified
    const content = fs.readFileSync(file, 'utf8');
    const isMinified = !content.includes('\n') || content.split('\n').length < 10;
    
    if (!isMinified) {
      results.unminifiedFiles.push({
        file: relativePath,
        size: size
      });
    }
  }
  
  return results;
}

// Check for duplicate files
function findDuplicateFiles(allFiles) {
  const fileHashes = new Map();
  const duplicates = [];
  
  for (const file of allFiles) {
    try {
      const content = fs.readFileSync(file);
      const hash = require('crypto').createHash('md5').update(content).digest('hex');
      
      if (fileHashes.has(hash)) {
        duplicates.push({
          hash: hash,
          files: [fileHashes.get(hash), file]
        });
      } else {
        fileHashes.set(hash, file);
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  return duplicates;
}

// Main performance analysis
function analyzePerformance() {
  console.log('⚡ Starting performance analysis...\n');
  
  const siteDir = './_site';
  if (!fs.existsSync(siteDir)) {
    console.log('❌ _site directory not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  // Get overall site size
  const totalSize = getDirectorySize(siteDir);
  console.log(`📊 Total site size: ${formatBytes(totalSize)}\n`);
  
  // Analyze different file types
  const imageFiles = findFilesByExtension(siteDir, ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.tif']);
  const cssFiles = findFilesByExtension(siteDir, ['.css']);
  const jsFiles = findFilesByExtension(siteDir, ['.js']);
  const htmlFiles = findFilesByExtension(siteDir, ['.html']);
  
  console.log(`📁 File counts:`);
  console.log(`   HTML files: ${htmlFiles.length}`);
  console.log(`   Image files: ${imageFiles.length}`);
  console.log(`   CSS files: ${cssFiles.length}`);
  console.log(`   JS files: ${jsFiles.length}\n`);
  
  // Analyze images
  if (imageFiles.length > 0) {
    console.log('🖼️  Image Analysis:');
    const imageResults = analyzeImages(imageFiles);
    
    console.log(`   Total size: ${formatBytes(imageResults.totalSize)}`);
    console.log(`   Average size: ${formatBytes(imageResults.totalSize / imageResults.total)}`);
    
    // Show breakdown by type
    Object.entries(imageResults.byType).forEach(([ext, data]) => {
      console.log(`   ${ext}: ${data.count} files, ${formatBytes(data.size)}`);
    });
    
    // Large images
    if (imageResults.largeImages.length > 0) {
      console.log(`\n   ⚠️  Large images (>500KB):`);
      imageResults.largeImages.forEach(img => {
        console.log(`      ${img.file}: ${img.formattedSize}`);
      });
    }
    
    // Unoptimized images
    if (imageResults.unoptimizedImages.length > 0) {
      console.log(`\n   ⚠️  Unoptimized formats:`);
      imageResults.unoptimizedImages.forEach(img => {
        console.log(`      ${img.file}: ${formatBytes(img.size)} (${img.format})`);
      });
    }
    
    console.log('');
  }
  
  // Analyze CSS
  if (cssFiles.length > 0) {
    console.log('🎨 CSS Analysis:');
    const cssResults = analyzeCSS(cssFiles);
    
    console.log(`   Total size: ${formatBytes(cssResults.totalSize)}`);
    console.log(`   Average size: ${formatBytes(cssResults.totalSize / cssResults.total)}`);
    
    if (cssResults.largeFiles.length > 0) {
      console.log(`\n   ⚠️  Large CSS files (>100KB):`);
      cssResults.largeFiles.forEach(file => {
        console.log(`      ${file.file}: ${file.formattedSize}`);
      });
    }
    
    if (cssResults.unminifiedFiles.length > 0) {
      console.log(`\n   ⚠️  Unminified CSS files:`);
      cssResults.unminifiedFiles.forEach(file => {
        console.log(`      ${file.file}: ${formatBytes(file.size)}`);
      });
    }
    
    console.log('');
  }
  
  // Analyze JavaScript
  if (jsFiles.length > 0) {
    console.log('📜 JavaScript Analysis:');
    const jsResults = analyzeJS(jsFiles);
    
    console.log(`   Total size: ${formatBytes(jsResults.totalSize)}`);
    console.log(`   Average size: ${formatBytes(jsResults.totalSize / jsResults.total)}`);
    
    if (jsResults.largeFiles.length > 0) {
      console.log(`\n   ⚠️  Large JS files (>100KB):`);
      jsResults.largeFiles.forEach(file => {
        console.log(`      ${file.file}: ${file.formattedSize}`);
      });
    }
    
    if (jsResults.unminifiedFiles.length > 0) {
      console.log(`\n   ⚠️  Unminified JS files:`);
      jsResults.unminifiedFiles.forEach(file => {
        console.log(`      ${file.file}: ${formatBytes(file.size)}`);
      });
    }
    
    console.log('');
  }
  
  // Check for duplicate files
  const allFiles = [...imageFiles, ...cssFiles, ...jsFiles];
  const duplicates = findDuplicateFiles(allFiles);
  
  if (duplicates.length > 0) {
    console.log('🔄 Duplicate Files:');
    duplicates.forEach(dup => {
      console.log(`   ${dup.files[0]} === ${dup.files[1]}`);
    });
    console.log('');
  }
  
  // Performance recommendations
  console.log('💡 Performance Recommendations:');
  
  if (totalSize > 10 * 1024 * 1024) { // 10MB
    console.log('   ⚠️  Site is larger than 10MB - consider optimization');
  }
  
  if (imageFiles.length > 0) {
    const imageResults = analyzeImages(imageFiles);
    if (imageResults.totalSize > 5 * 1024 * 1024) { // 5MB
      console.log('   ⚠️  Images are taking up significant space - consider compression');
    }
  }
  
  if (cssFiles.length > 0) {
    const cssResults = analyzeCSS(cssFiles);
    if (cssResults.unminifiedFiles.length > 0) {
      console.log('   💡 Consider minifying CSS files');
    }
  }
  
  if (jsFiles.length > 0) {
    const jsResults = analyzeJS(jsFiles);
    if (jsResults.unminifiedFiles.length > 0) {
      console.log('   💡 Consider minifying JavaScript files');
    }
  }
  
  if (duplicates.length > 0) {
    console.log('   💡 Remove duplicate files to reduce size');
  }
  
  console.log('\n✅ Performance analysis complete!');
}

// Run analysis
analyzePerformance();
