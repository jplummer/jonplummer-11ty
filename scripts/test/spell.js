#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { findFilesByExtension } = require('../utils/file-utils');
const { parseFrontMatter } = require('../utils/frontmatter-utils');
const { createTestResult, addFile, addIssue, outputResult } = require('../utils/test-result-builder');

// Find all markdown and YAML files in src/ directory, excluding drafts
function findSourceFiles() {
  const srcDir = './src';
  if (!fs.existsSync(srcDir)) {
    return [];
  }

  // Find markdown and YAML files
  const markdownFiles = findFilesByExtension(srcDir, ['.md']);
  const yamlFiles = findFilesByExtension(srcDir, ['.yaml', '.yml']);
  const allFiles = [...markdownFiles, ...yamlFiles];
  
  // Filter out drafts (check frontmatter for draft: true)
  return allFiles.filter(file => {
    // Only check frontmatter for markdown files
    if (file.endsWith('.md')) {
      const content = fs.readFileSync(file, 'utf8');
      const { frontMatter } = parseFrontMatter(content);
      if (frontMatter && frontMatter.draft === true) {
        return false;
      }
    }
    return true;
  });
}

// Run cspell on files
function runCspell(files) {
  if (files.length === 0) {
    return { valid: true, errors: [] };
  }

  try {
    // cspell accepts files as arguments
    // Quote file paths to handle spaces
    const fileArgs = files.map(f => `"${f}"`).join(' ');
    const command = `npx cspell --config cspell.json --no-must-find-files ${fileArgs}`;
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(__dirname, '../..'),
      shell: true
    });
    
    return { valid: true, errors: [] };
  } catch (error) {
    // Parse cspell output
    // cspell outputs to stdout on errors
    const output = (error.stdout || error.stderr || error.message || '').toString();
    const errors = [];
    
    // Parse cspell output format
    // Format: "file.md:line:column - Unknown word: word"
    // Or: "file.md:line - Unknown word: word"
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Match: "file:line:column - Unknown word: word"
      const match1 = line.match(/^(.+?):(\d+):(\d+)\s+-\s+Unknown word:\s+(.+)$/);
      if (match1) {
        const filePath = path.resolve(path.join(__dirname, '../..'), match1[1]);
        errors.push({
          file: filePath,
          line: parseInt(match1[2]),
          column: parseInt(match1[3]),
          word: match1[4].trim()
        });
        continue;
      }
      
      // Match: "file:line - Unknown word: word"
      const match2 = line.match(/^(.+?):(\d+)\s+-\s+Unknown word:\s+(.+)$/);
      if (match2) {
        const filePath = path.resolve(path.join(__dirname, '../..'), match2[1]);
        errors.push({
          file: filePath,
          line: parseInt(match2[2]),
          column: 1,
          word: match2[3].trim()
        });
        continue;
      }
      
      // Match: "file - Unknown word: word" (no line number)
      const match3 = line.match(/^(.+?)\s+-\s+Unknown word:\s+(.+)$/);
      if (match3) {
        const filePath = path.resolve(path.join(__dirname, '../..'), match3[1]);
        errors.push({
          file: filePath,
          line: 1,
          column: 1,
          word: match3[2].trim()
        });
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
}

// Main validation function
function validateSpelling() {
  const files = findSourceFiles();
  
  if (files.length === 0) {
    console.log('❌ No markdown or YAML files found in src/ directory');
    process.exit(1);
  }

  // Create test result using result builder
  const result = createTestResult('spell', 'Spell Check');
  
  // Track files in result
  const fileMap = new Map();

  // Run cspell
  const spellResult = runCspell(files);
  
  // Process spelling errors
  if (!spellResult.valid && spellResult.errors.length > 0) {
    // Group errors by file
    const errorsByFile = {};
    spellResult.errors.forEach(error => {
      if (!errorsByFile[error.file]) {
        errorsByFile[error.file] = [];
      }
      errorsByFile[error.file].push(error);
    });
    
    // Add files and spelling errors
    for (const [file, errors] of Object.entries(errorsByFile)) {
      const relativePath = path.relative('./src', file);
      let fileObj = fileMap.get(relativePath);
      if (!fileObj) {
        fileObj = addFile(result, file, relativePath);
        fileMap.set(relativePath, fileObj);
      }
      
      errors.forEach(error => {
        addIssue(fileObj, {
          type: 'spelling',
          message: `Unknown word: "${error.word}"`,
          word: error.word,
          line: error.line,
          column: error.column
        });
      });
    }
  }

  // Add files that passed (no errors)
  for (const file of files) {
    const relativePath = path.relative('./src', file);
    if (!fileMap.has(relativePath)) {
      addFile(result, file, relativePath);
    }
  }

  // Output JSON result (formatter will handle display)
  outputResult(result);
  
  // Exit with appropriate code
  process.exit(result.summary.issues > 0 ? 1 : 0);
}

// Run validation
validateSpelling();

