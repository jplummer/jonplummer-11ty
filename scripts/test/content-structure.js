#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { validateDate, validateSlug } = require('../utils/validation-utils');
const { getMarkdownFiles, readFile } = require('../utils/test-base');
const { parseFrontMatter } = require('../utils/frontmatter-utils');
const { createTestResult, addFile, addIssue, addWarning, addGlobalIssue, outputResult } = require('../utils/test-result-builder');

// Front matter parsing and file finding now use shared utilities

// Validation functions now use shared validation-utils
// Focuses on structure validation (YAML syntax, required fields, formats)
// SEO-specific checks (title/description length) are handled by seo-meta.js

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
    // Basic validation: must be a non-empty string
    if (typeof frontMatter.title !== 'string' || frontMatter.title.trim().length === 0) {
      issues.push(`Title: must be a non-empty string`);
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

  // Optional fields - no validation needed (SEO checks are handled by seo-meta.js)

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
function validateYamlDataFiles(result) {
  const dataDir = './src/_data';
  if (!fs.existsSync(dataDir)) {
    return { valid: true };
  }

  const yamlFiles = fs.readdirSync(dataDir)
    .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
    .map(file => path.join(dataDir, file));

  if (yamlFiles.length === 0) {
    return { valid: true };
  }

  for (const file of yamlFiles) {
    const relativePath = path.relative('./src', file);
    const content = fs.readFileSync(file, 'utf8');

    try {
      yaml.load(content);
      // Add file even if valid (so it's counted)
      addFile(result, file, relativePath);
    } catch (error) {
      const fileObj = addFile(result, file, relativePath);
      addIssue(fileObj, {
        type: 'yaml-syntax',
        message: `YAML syntax error: ${error.message}`
      });
      return { valid: false };
    }
  }

  return { valid: true };
}

// Main validation function
function validateContentStructure() {
  // Create test result using result builder
  const result = createTestResult('content-structure', 'Content Structure');
  
  // Validate YAML data files first
  const yamlValidation = validateYamlDataFiles(result);

  if (!yamlValidation.valid) {
    outputResult(result);
    process.exit(1);
    return;
  }

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

  const slugMap = new Map();
  const duplicateSlugs = [];

  // First pass: validate individual files
  for (const file of markdownFiles) {
    const relativePath = path.relative('./src/_posts', file);
    const content = readFile(file);
    const { frontMatter, error } = parseFrontMatter(content);

    // Add file to result
    const fileObj = addFile(result, file, relativePath);

    if (error) {
      addIssue(fileObj, {
        type: 'frontmatter-parse',
        message: `Front matter parsing error: ${error}`
      });
      continue;
    }

    if (!frontMatter) {
      addIssue(fileObj, {
        type: 'frontmatter-missing',
        message: 'No front matter found'
      });
      continue;
    }

    // Validate file naming
    const fileNameCheck = validateFileName(file);
    if (!fileNameCheck.valid) {
      addIssue(fileObj, {
        type: 'file-naming',
        message: fileNameCheck.error
      });
    }
    
    // Validate required fields
    const fieldValidation = validateRequiredFields(frontMatter, file);
    
    // Add issues
    fieldValidation.issues.forEach(issue => {
      addIssue(fileObj, {
        type: 'frontmatter-field',
        message: issue
      });
    });
    
    // Add warnings
    fieldValidation.warnings.forEach(warning => {
      addWarning(fileObj, {
        type: 'frontmatter-field',
        message: warning
      });
    });

    // Track slugs for duplicate checking (reuse fileNameCheck from above)
    const slugToTrack = frontMatter.slug || (fileNameCheck.valid ? fileNameCheck.expectedSlug : null);

    if (slugToTrack) {
      if (slugMap.has(slugToTrack)) {
        duplicateSlugs.push({
          slug: slugToTrack,
          files: [slugMap.get(slugToTrack), relativePath]
        });
      } else {
        slugMap.set(slugToTrack, relativePath);
      }
    }
  }

  // Add duplicate slugs as global issues
  duplicateSlugs.forEach(dup => {
    addGlobalIssue(result, {
      type: 'duplicate-slug',
      message: `Duplicate slug "${dup.slug}"`,
      files: dup.files
    });
  });

  // Output JSON result (formatter will handle display)
  outputResult(result);
  
  // Exit with appropriate code (errors block, warnings don't)
  process.exit(result.summary.issues > 0 ? 1 : 0);
}

// Run validation
validateContentStructure();
