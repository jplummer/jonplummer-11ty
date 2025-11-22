#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { findMarkdownFiles } = require('../utils/file-utils');

// Find all markdown files in src/ directory, excluding _drafts and docs/
function findSourceMarkdownFiles() {
  const srcDir = './src';
  if (!fs.existsSync(srcDir)) {
    return [];
  }

  const allFiles = findMarkdownFiles(srcDir);
  
  // Filter out _drafts and docs/ directories
  return allFiles.filter(file => {
    const relativePath = path.relative('./src', file);
    // Exclude _drafts directory
    if (relativePath.includes('_drafts/')) {
      return false;
    }
    // Exclude docs/ directory (though it shouldn't be in src/, but just in case)
    if (relativePath.startsWith('docs/')) {
      return false;
    }
    return true;
  });
}

// Check for unclosed parentheses in markdown links
function checkUnclosedLinkParentheses(content, filePath) {
  const issues = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Find all markdown link patterns: [text](url)
    // We need to check if any have unclosed parentheses
    let pos = 0;
    while (pos < line.length) {
      // Find opening bracket for link text
      const bracketOpen = line.indexOf('[', pos);
      if (bracketOpen === -1) break;
      
      // Find closing bracket for link text
      const bracketClose = line.indexOf(']', bracketOpen + 1);
      if (bracketClose === -1) break;
      
      // Check if next character is opening parenthesis
      if (bracketClose + 1 < line.length && line[bracketClose + 1] === '(') {
        // Find the URL part - look for closing parenthesis
        let parenOpen = bracketClose + 1;
        let parenClose = -1;
        let depth = 1;
        
        // Search for matching closing parenthesis, handling nested parens in URLs
        for (let i = parenOpen + 1; i < line.length; i++) {
          if (line[i] === '(') depth++;
          else if (line[i] === ')') {
            depth--;
            if (depth === 0) {
              parenClose = i;
              break;
            }
          }
        }
        
        // If no closing parenthesis found, it's an error
        if (parenClose === -1) {
          issues.push({
            line: index + 1,
            column: bracketOpen + 1,
            message: `Unclosed markdown link: missing closing parenthesis`,
            context: line.trim()
          });
          break; // Only report one error per line
        }
        
        pos = parenClose + 1;
      } else {
        pos = bracketClose + 1;
      }
    }
  });
  
  return issues;
}

// Check for H1 headings in markdown (templates add H1 from front matter)
function checkH1Headings(content, filePath) {
  const warnings = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Check for H1 headings (single #)
    if (/^#\s+/.test(line.trim()) && !/^##/.test(line.trim())) {
      warnings.push({
        line: index + 1,
        column: 1,
        message: `H1 heading found in markdown (templates add H1 from front matter title)`,
        context: line.trim()
      });
    }
  });
  
  return warnings;
}

// Run markdownlint-cli2
function runMarkdownlint(files) {
  if (files.length === 0) {
    return { valid: true, output: '', errors: [] };
  }

  try {
    // markdownlint-cli2 uses glob patterns, so we need to quote each file
    const filePatterns = files.map(f => `"${f}"`).join(' ');
    const command = `npx markdownlint-cli2 ${filePatterns} --config .markdownlint.json`;
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(__dirname, '../..')
    });
    
    return { valid: true, output, errors: [] };
  } catch (error) {
    // Parse markdownlint output
    // markdownlint-cli2 outputs to stderr on errors
    const output = (error.stderr || error.stdout || error.message || '').toString();
    const errors = [];
    
    // Parse markdownlint-cli2 output format
    // Format: "src/about.md:9 error MD022/blanks-around-headings Headings should be surrounded by blank lines [Expected: 1; Actual: 0; Below] [Context: "# /about"]"
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Match: "file.md:line error rule message [details]"
      const match = line.match(/^(.+\.md):(\d+)(?::(\d+))?\s+error\s+(.+)$/);
      if (match) {
        const filePath = path.resolve(path.join(__dirname, '../..'), match[1]);
        const message = match[4].split(' [')[0]; // Remove [Context: ...] part
        errors.push({
          file: filePath,
          line: parseInt(match[2]),
          column: match[3] ? parseInt(match[3]) : 1,
          message: message,
          rule: message.split(' ')[0]
        });
      }
    }
    
    return { valid: false, output, errors };
  }
}

// Main validation function
function validateMarkdown() {
  console.log('📝 Starting markdown syntax validation...\n');

  const markdownFiles = findSourceMarkdownFiles();
  
  if (markdownFiles.length === 0) {
    console.log('❌ No markdown files found in src/ directory');
    process.exit(1);
  }

  console.log(`Found ${markdownFiles.length} markdown file(s)\n`);

  let totalErrors = 0;
  let totalWarnings = 0;
  const allIssues = [];

  // Run markdownlint-cli2
  const lintResult = runMarkdownlint(markdownFiles);
  
  if (!lintResult.valid) {
    totalErrors += lintResult.errors.length;
    allIssues.push(...lintResult.errors);
  }

  // Custom validations for each file
  for (const file of markdownFiles) {
    const relativePath = path.relative('./src', file);
    const content = fs.readFileSync(file, 'utf8');
    
    // Skip front matter for content checks
    const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    const markdownContent = frontMatterMatch ? frontMatterMatch[2] : content;
    
    const fileErrors = [];
    const fileWarnings = [];
    
    // Check for unclosed link parentheses
    const linkIssues = checkUnclosedLinkParentheses(markdownContent, file);
    fileErrors.push(...linkIssues);
    
    // Check for H1 headings
    const h1Warnings = checkH1Headings(markdownContent, file);
    fileWarnings.push(...h1Warnings);
    
    if (fileErrors.length > 0 || fileWarnings.length > 0) {
      console.log(`📄 ${relativePath}:`);
      
      if (fileErrors.length > 0) {
        console.log(`   ❌ Errors:`);
        fileErrors.forEach(issue => {
          console.log(`      Line ${issue.line}, Column ${issue.column}: ${issue.message}`);
          console.log(`      ${issue.context}`);
        });
        totalErrors += fileErrors.length;
      }
      
      if (fileWarnings.length > 0) {
        console.log(`   ⚠️  Warnings:`);
        fileWarnings.forEach(warning => {
          console.log(`      Line ${warning.line}, Column ${warning.column}: ${warning.message}`);
          console.log(`      ${warning.context}`);
        });
        totalWarnings += fileWarnings.length;
      }
      
      console.log('');
    }
  }

  // Display markdownlint errors
  if (lintResult.errors.length > 0) {
    // Group errors by file
    const errorsByFile = {};
    lintResult.errors.forEach(error => {
      if (!errorsByFile[error.file]) {
        errorsByFile[error.file] = [];
      }
      errorsByFile[error.file].push(error);
    });
    
    for (const [file, errors] of Object.entries(errorsByFile)) {
      const relativePath = path.relative('./src', file);
      console.log(`📄 ${relativePath}:`);
      console.log(`   ❌ Markdownlint errors:`);
      errors.forEach(error => {
        console.log(`      Line ${error.line}, Column ${error.column}: ${error.message}`);
      });
      console.log('');
    }
  }

  // Summary
  console.log('📊 Markdown Validation Summary:');
  console.log(`   Files checked: ${markdownFiles.length}`);
  console.log(`   Errors: ${totalErrors}`);
  console.log(`   Warnings: ${totalWarnings}`);

  if (totalErrors > 0) {
    console.log('\n❌ Markdown validation found errors that need attention.');
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log('\n⚠️  No critical errors, but consider addressing warnings.');
  } else {
    console.log('\n✅ All markdown files are valid!');
  }
}

// Run validation
validateMarkdown();

