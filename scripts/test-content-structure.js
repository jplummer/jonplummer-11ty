#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Find all markdown files in _posts
function findMarkdownFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath));
    } else if (item.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Parse front matter from markdown file
function parseFrontMatter(content) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    return { frontMatter: null, content: content };
  }
  
  try {
    const frontMatter = yaml.load(match[1]);
    return { frontMatter, content: match[2] };
  } catch (error) {
    return { frontMatter: null, content: content, error: error.message };
  }
}

// Validate date format
function validateDate(dateString) {
  if (!dateString) return { valid: false, error: 'Missing date' };
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  
  // Check if date is reasonable (not too far in future/past)
  const now = new Date();
  const year = date.getFullYear();
  const currentYear = now.getFullYear();
  
  if (year < 2000 || year > currentYear + 1) {
    return { valid: false, error: 'Date seems unreasonable' };
  }
  
  return { valid: true, date: date };
}

// Validate slug format
function validateSlug(slug) {
  if (!slug) return { valid: false, error: 'Missing slug' };
  
  // Check for valid slug characters (lowercase, hyphens, numbers)
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return { valid: false, error: 'Invalid slug format (should be lowercase with hyphens)' };
  }
  
  // Check length
  if (slug.length < 3) {
    return { valid: false, error: 'Slug too short' };
  }
  
  if (slug.length > 100) {
    return { valid: false, error: 'Slug too long' };
  }
  
  return { valid: true };
}

// Validate title
function validateTitle(title) {
  if (!title) return { valid: false, error: 'Missing title' };
  
  if (title.trim().length === 0) {
    return { valid: false, error: 'Empty title' };
  }
  
  if (title.length > 200) {
    return { valid: false, error: 'Title too long' };
  }
  
  return { valid: true };
}

// Validate meta description
function validateMetaDescription(description) {
  if (!description) return { valid: false, error: 'Missing meta description' };
  
  if (description.trim().length === 0) {
    return { valid: false, error: 'Empty meta description' };
  }
  
  if (description.length > 160) {
    return { valid: false, error: 'Meta description too long (should be ≤160 chars)' };
  }
  
  if (description.length < 50) {
    return { valid: false, error: 'Meta description too short (should be ≥50 chars)' };
  }
  
  return { valid: true };
}

// Check for required fields
function validateRequiredFields(frontMatter, filePath) {
  const issues = [];
  const warnings = [];
  
  // Extract slug from directory path if not in front matter
  const fileNameCheck = validateFileName(filePath);
  const hasSlugInPath = fileNameCheck.valid && fileNameCheck.expectedSlug;
  const hasSlugInFrontMatter = frontMatter.slug;
  
  // Required fields - slug is only required if not provided by directory structure
  const requiredFields = ['title', 'date'];
  for (const field of requiredFields) {
    if (!frontMatter[field]) {
      issues.push(`Missing required field: ${field}`);
    }
  }
  
  // Check slug - only require if not provided by directory structure
  if (!hasSlugInPath && !hasSlugInFrontMatter) {
    issues.push(`Missing required field: slug`);
  }
  
  // Validate individual fields
  if (frontMatter.title) {
    const titleCheck = validateTitle(frontMatter.title);
    if (!titleCheck.valid) {
      issues.push(`Title: ${titleCheck.error}`);
    }
  }
  
  if (frontMatter.date) {
    const dateCheck = validateDate(frontMatter.date);
    if (!dateCheck.valid) {
      issues.push(`Date: ${dateCheck.error}`);
    }
  }
  
  // Validate slug - check both front matter and directory path
  if (hasSlugInFrontMatter) {
    const slugCheck = validateSlug(frontMatter.slug);
    if (!slugCheck.valid) {
      issues.push(`Slug: ${slugCheck.error}`);
    }
  } else if (hasSlugInPath) {
    // Validate slug from directory path
    const slugCheck = validateSlug(fileNameCheck.expectedSlug);
    if (!slugCheck.valid) {
      issues.push(`Slug (from path): ${slugCheck.error}`);
    }
  }
  
  // Optional but recommended fields
  if (frontMatter.metaDescription) {
    const descCheck = validateMetaDescription(frontMatter.metaDescription);
    if (!descCheck.valid) {
      warnings.push(`Meta description: ${descCheck.error}`);
    }
  } else {
    warnings.push('Missing meta description (recommended for SEO)');
  }
  
  // Check for duplicate slugs
  if (frontMatter.slug) {
    const slug = frontMatter.slug;
    // This would need to be checked across all files - we'll do this separately
  }
  
  return { issues, warnings };
}

// Check file naming convention
function validateFileName(filePath) {
  const fileName = path.basename(filePath);
  const dirName = path.dirname(filePath);
  
  // Check if file is in expected directory structure (YYYY/YYYY-MM-DD-slug.md)
  const expectedPattern = /^\d{4}\/\d{4}-\d{2}-\d{2}-[^\/]+\.md$/;
  const relativePath = path.relative('./_posts', filePath);
  
  if (!expectedPattern.test(relativePath)) {
    return { valid: false, error: 'File not in expected directory structure (YYYY/YYYY-MM-DD-slug.md)' };
  }
  
  // Extract expected slug from filename (remove .md extension)
  const fileNameWithoutExt = fileName.replace('.md', '');
  const slugMatch = fileNameWithoutExt.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
  const expectedSlug = slugMatch ? slugMatch[1] : null;
  
  return { valid: true, expectedSlug };
}

// Main validation function
function validateContentStructure() {
  console.log('📝 Starting content structure validation...\n');
  
  const postsDir = './_posts';
  if (!fs.existsSync(postsDir)) {
    console.log('❌ _posts directory not found');
    process.exit(1);
  }
  
  const markdownFiles = findMarkdownFiles(postsDir);
  console.log(`Found ${markdownFiles.length} markdown files\n`);
  
  const results = {
    total: markdownFiles.length,
    valid: 0,
    issues: 0,
    warnings: 0,
    duplicateSlugs: [],
    slugMap: new Map()
  };
  
  // First pass: validate individual files
  for (const file of markdownFiles) {
    const relativePath = path.relative('./_posts', file);
    const content = fs.readFileSync(file, 'utf8');
    const { frontMatter, error } = parseFrontMatter(content);
    
    console.log(`📄 ${relativePath}:`);
    
    if (error) {
      console.log(`   ❌ Front matter parsing error: ${error}`);
      results.issues++;
      continue;
    }
    
    if (!frontMatter) {
      console.log(`   ❌ No front matter found`);
      results.issues++;
      continue;
    }
    
    // Validate file naming
    const fileNameCheck = validateFileName(file);
    if (!fileNameCheck.valid) {
      console.log(`   ❌ ${fileNameCheck.error}`);
      results.issues++;
    }
    
    // Validate required fields
    const fieldValidation = validateRequiredFields(frontMatter, file);
    
    if (fieldValidation.issues.length > 0) {
      console.log(`   ❌ Issues:`);
      fieldValidation.issues.forEach(issue => console.log(`      - ${issue}`));
      results.issues += fieldValidation.issues.length;
    }
    
    if (fieldValidation.warnings.length > 0) {
      console.log(`   ⚠️  Warnings:`);
      fieldValidation.warnings.forEach(warning => console.log(`      - ${warning}`));
      results.warnings += fieldValidation.warnings.length;
    }
    
    // Track slugs for duplicate checking - use front matter slug if available, otherwise use directory slug
    const fileNameCheckForSlug = validateFileName(file);
    const slugToTrack = frontMatter.slug || (fileNameCheckForSlug.valid ? fileNameCheckForSlug.expectedSlug : null);
    
    if (slugToTrack) {
      if (results.slugMap.has(slugToTrack)) {
        results.duplicateSlugs.push({
          slug: slugToTrack,
          files: [results.slugMap.get(slugToTrack), relativePath]
        });
      } else {
        results.slugMap.set(slugToTrack, relativePath);
      }
    }
    
    if (fieldValidation.issues.length === 0) {
      console.log(`   ✅ Valid`);
      results.valid++;
    }
    
    console.log('');
  }
  
  // Check for duplicate slugs
  if (results.duplicateSlugs.length > 0) {
    console.log('🔄 Duplicate slug check:');
    results.duplicateSlugs.forEach(dup => {
      console.log(`   ❌ Duplicate slug "${dup.slug}" in:`);
      dup.files.forEach(file => console.log(`      - ${file}`));
    });
    console.log('');
  }
  
  // Summary
  console.log('📊 Content Structure Summary:');
  console.log(`   Total files: ${results.total}`);
  console.log(`   Valid files: ${results.valid}`);
  console.log(`   Issues: ${results.issues}`);
  console.log(`   Warnings: ${results.warnings}`);
  console.log(`   Duplicate slugs: ${results.duplicateSlugs.length}`);
  
  if (results.issues > 0 || results.duplicateSlugs.length > 0) {
    console.log('\n❌ Content structure issues found that need attention.');
    process.exit(1);
  } else if (results.warnings > 0) {
    console.log('\n⚠️  No critical issues, but consider addressing warnings.');
  } else {
    console.log('\n🎉 All content structure validation passed!');
  }
}

// Run validation
validateContentStructure();
