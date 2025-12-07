#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { findMarkdownFiles } = require('../utils/file-utils');
const { parseFrontMatter } = require('../utils/frontmatter-utils');
const { createTestResult, addFile, addIssue, addWarning, outputResult } = require('../utils/test-result-builder');

// Find all markdown files in src/ directory, excluding drafts and docs/
function findSourceMarkdownFiles() {
  const srcDir = './src';
  if (!fs.existsSync(srcDir)) {
    return [];
  }

  const allFiles = findMarkdownFiles(srcDir);
  
  // Filter out drafts (check frontmatter for draft: true) and docs/ directory
  return allFiles.filter(file => {
    const relativePath = path.relative('./src', file);
    // Exclude docs/ directory (though it shouldn't be in src/, but just in case)
    if (relativePath.startsWith('docs/')) {
      return false;
    }
    // Exclude files with draft: true in frontmatter
    const content = fs.readFileSync(file, 'utf8');
    const { frontMatter } = parseFrontMatter(content);
    if (frontMatter && frontMatter.draft === true) {
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
  const markdownFiles = findSourceMarkdownFiles();
  
  if (markdownFiles.length === 0) {
    console.log('❌ No markdown files found in src/ directory');
    process.exit(1);
  }

  // Create test result using result builder
  const result = createTestResult('markdown', 'Markdown Validation');
  
  // Track files in result (we'll add them as we process)
  const fileMap = new Map();

  // Run markdownlint-cli2
  const lintResult = runMarkdownlint(markdownFiles);
  
  // Process markdownlint errors
  if (!lintResult.valid && lintResult.errors.length > 0) {
    // Group errors by file
    const errorsByFile = {};
    lintResult.errors.forEach(error => {
      if (!errorsByFile[error.file]) {
        errorsByFile[error.file] = [];
      }
      errorsByFile[error.file].push(error);
    });
    
    // Add files and markdownlint errors
    for (const [file, errors] of Object.entries(errorsByFile)) {
      const relativePath = path.relative('./src', file);
      let fileObj = fileMap.get(relativePath);
      if (!fileObj) {
        fileObj = addFile(result, file, relativePath);
        fileMap.set(relativePath, fileObj);
      }
      
      errors.forEach(error => {
        addIssue(fileObj, {
          type: 'markdownlint',
          message: error.message,
          ruleId: error.rule,
          line: error.line,
          column: error.column
        });
      });
    }
  }

  // Custom validations for each file
  for (const file of markdownFiles) {
    const relativePath = path.relative('./src', file);
    const content = fs.readFileSync(file, 'utf8');
    
    // Get or create file object
    let fileObj = fileMap.get(relativePath);
    if (!fileObj) {
      fileObj = addFile(result, file, relativePath);
      fileMap.set(relativePath, fileObj);
    }
    
    // Skip front matter for content checks
    const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    const markdownContent = frontMatterMatch ? frontMatterMatch[2] : content;
    
    // Check for unclosed link parentheses
    const linkIssues = checkUnclosedLinkParentheses(markdownContent, file);
    linkIssues.forEach(issue => {
      addIssue(fileObj, {
        type: 'markdown-link',
        message: issue.message,
        line: issue.line,
        column: issue.column,
        context: issue.context
      });
    });
    
    // Check for H1 headings (warnings)
    const h1Warnings = checkH1Headings(markdownContent, file);
    h1Warnings.forEach(warning => {
      addWarning(fileObj, {
        type: 'markdown-h1',
        message: warning.message,
        line: warning.line,
        column: warning.column,
        context: warning.context
      });
    });
  }

  // Output JSON result (formatter will handle display)
  outputResult(result);
  
  // Exit with appropriate code (errors block, warnings don't)
  process.exit(result.summary.issues > 0 ? 1 : 0);
}

// Run validation
validateMarkdown();

