#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { validateDate, validateSlug, validateTitle, validateMetaDescription } = require('../utils/validation-utils');
const { getMarkdownFiles, readFile } = require('../utils/test-base');
const { parseFrontMatter } = require('../utils/frontmatter-utils');
const { printSummary, exitWithResults, getTestEmoji } = require('../utils/reporting-utils');

// Front matter parsing and file finding now use shared utilities

// Validation functions now use shared validation-utils
// Note: content-structure.js uses different validation rules (e.g., title max 200, description 50-160)
// So we adapt the shared validators with appropriate parameters

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
    // Content structure allows longer titles (up to 200 chars)
    const titleCheck = validateTitle(frontMatter.title, 1, 200);
    if (!titleCheck.valid) {
      issues.push(`Title: ${titleCheck.error}`);
    }
  }

  if (frontMatter.date) {
    // Extract YYYY-MM-DD from ISO date strings (e.g., "2025-11-20T20:00:00.000Z" -> "2025-11-20")
    // Also handle Date objects by converting to string first
    let dateToValidate = frontMatter.date;
    if (dateToValidate instanceof Date) {
      dateToValidate = dateToValidate.toISOString().split('T')[0];
    } else if (typeof dateToValidate === 'string') {
      if (dateToValidate.includes('T')) {
        dateToValidate = dateToValidate.split('T')[0];
      }
    } else {
      issues.push(`Date: Date must be a string or Date object`);
      return { issues, warnings };
    }
    const dateCheck = validateDate(dateToValidate);
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
  if (frontMatter.description) {
    // Content structure uses 50-160 char range for descriptions
    const descCheck = validateMetaDescription(frontMatter.description, 50, 160);
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
  const relativePath = path.relative('./src/_posts', filePath);

  if (!expectedPattern.test(relativePath)) {
    return { valid: false, error: 'File not in expected directory structure (YYYY/YYYY-MM-DD-slug.md)' };
  }

  // Extract expected slug from filename (remove .md extension)
  const fileNameWithoutExt = fileName.replace('.md', '');
  const slugMatch = fileNameWithoutExt.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
  const expectedSlug = slugMatch ? slugMatch[1] : null;

  return { valid: true, expectedSlug };
}

// Validate YAML data files
function validateYamlDataFiles() {
  const dataDir = './src/_data';
  if (!fs.existsSync(dataDir)) {
    return { valid: true, issues: 0, files: 0 };
  }

  const yamlFiles = fs.readdirSync(dataDir)
    .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
    .map(file => path.join(dataDir, file));

  if (yamlFiles.length === 0) {
    return { valid: true, issues: 0, files: 0 };
  }

  console.log('📋 Validating YAML data files...\n');

  let totalIssues = 0;

  for (const file of yamlFiles) {
    const fileName = path.basename(file);
    const content = fs.readFileSync(file, 'utf8');

    try {
      yaml.load(content);
      console.log(`   ✅ ${fileName}`);
    } catch (error) {
      console.log(`   ❌ ${fileName}`);
      console.log(`      Error: ${error.message}`);
      totalIssues++;
    }
  }

  console.log('');

  if (totalIssues > 0) {
    console.log(`❌ Found ${totalIssues} YAML syntax error(s) in data files.`);
    return { valid: false, issues: totalIssues, files: yamlFiles.length };
  } else {
    console.log(`✅ All ${yamlFiles.length} YAML data file(s) are valid.`);
    return { valid: true, issues: 0, files: yamlFiles.length };
  }
}

// Main validation function
function validateContentStructure() {
  // Validate YAML data files first
  const yamlValidation = validateYamlDataFiles();

  if (!yamlValidation.valid) {
    console.log('\n❌ YAML data file validation failed.');
    process.exit(1);
  }

  console.log('\n📝 Starting content structure validation...\n');

  const postsDir = './src/_posts';
  if (!fs.existsSync(postsDir)) {
    console.log('❌ _posts directory not found');
    process.exit(1);
  }

  // Get markdown files and exclude drafts (check frontmatter for draft: true)
  const allMarkdownFiles = getMarkdownFiles(postsDir);
  const markdownFiles = allMarkdownFiles.filter(file => {
    const content = readFile(file);
    const { frontMatter } = parseFrontMatter(content);
    // Exclude files with draft: true in frontmatter
    return !(frontMatter && frontMatter.draft === true);
  });
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
    const relativePath = path.relative('./src/_posts', file);
    const content = readFile(file);
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
  printSummary('Content Structure', getTestEmoji('content-structure'), [
    { label: 'Total files', value: results.total },
    { label: 'Valid files', value: results.valid },
    { label: 'Issues', value: results.issues },
    { label: 'Warnings', value: results.warnings },
    { label: 'Duplicate slugs', value: results.duplicateSlugs.length }
  ]);

  // Custom exit logic: duplicate slugs count as issues
  const totalIssues = results.issues + results.duplicateSlugs.length;
  exitWithResults(totalIssues, results.warnings, {
    testType: 'content structure validation',
    successMessage: '\n🎉 All content structure validation passed!'
  });
}

// Run validation
validateContentStructure();
