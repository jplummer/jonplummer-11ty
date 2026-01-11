#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { findFilesByExtension } = require('../utils/file-utils');
const { parseFrontMatter } = require('../utils/frontmatter-utils');
const { createTestResult, addFile, addWarning, outputResult } = require('../utils/test-result-builder');

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
    // Use default output format (not JSON) for easier parsing
    const command = `npx cspell --config cspell.json --no-must-find-files ${fileArgs}`;
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(__dirname, '../..'),
      shell: true
    });
    
    // If we get here, cspell found no errors (exit code 0)
    // But let's verify by checking if output contains anything
    if (output && output.trim()) {
      // cspell sometimes outputs info even on success, but this shouldn't happen
      console.error('Unexpected cspell output on success:', output);
    }
    
    return { valid: true, errors: [] };
  } catch (error) {
    // Parse cspell output
    // cspell outputs to stdout on errors
    const output = (error.stdout || error.stderr || error.message || '').toString();
    const errors = [];
    
    // Parse cspell output format
    // Modern cspell format is typically: "file:line:column word"
    // Or: "file:line:column\nword" (word on next line)
    // Or: "file:line:column - Unknown word: word"
    const lines = output.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip empty lines
      if (!line.trim()) continue;
      
      // Match: "file:line:column - Unknown word (word)" or "file:line:column - Unknown word (word) fix: ..."
      const match1 = line.match(/^(.+?):(\d+):(\d+)\s+-\s+Unknown word\s+\(([^)]+)\)/);
      if (match1) {
        const filePath = path.resolve(path.join(__dirname, '../..'), match1[1]);
        // Extract just the word (before any "fix:" suggestions)
        let word = match1[4].trim();
        // Remove any "fix:" suggestions that might be in the word
        if (word.includes(' fix:')) {
          word = word.split(' fix:')[0].trim();
        }
        if (word) {
          errors.push({
            file: filePath,
            line: parseInt(match1[2]),
            column: parseInt(match1[3]),
            word: word
          });
        }
        continue;
      }
      
      // Match: "file:line:column word" (simple format without "Unknown word")
      const match1b = line.match(/^(.+?):(\d+):(\d+)\s+(.+)$/);
      if (match1b && !match1b[4].includes('Unknown word')) {
        const filePath = path.resolve(path.join(__dirname, '../..'), match1b[1]);
        const word = match1b[4].trim();
        if (word) {
          errors.push({
            file: filePath,
            line: parseInt(match1b[2]),
            column: parseInt(match1b[3]),
            word: word
          });
        }
        continue;
      }
      
      // Match: "file:line:column" (word might be on next line)
      const match2 = line.match(/^(.+?):(\d+):(\d+)\s*$/);
      if (match2 && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine && !nextLine.includes(':')) {
          // Next line is likely the word
          const filePath = path.resolve(path.join(__dirname, '../..'), match2[1]);
          errors.push({
            file: filePath,
            line: parseInt(match2[2]),
            column: parseInt(match2[3]),
            word: nextLine
          });
          i++; // Skip the next line since we processed it
          continue;
        }
      }
      
      // Match: "file:line:column - Unknown word: word"
      const match3 = line.match(/^(.+?):(\d+):(\d+)\s+-\s+Unknown word:\s+(.+)$/);
      if (match3) {
        const filePath = path.resolve(path.join(__dirname, '../..'), match3[1]);
        errors.push({
          file: filePath,
          line: parseInt(match3[2]),
          column: parseInt(match3[3]),
          word: match3[4].trim()
        });
        continue;
      }
      
      // Match: "file:line - Unknown word: word"
      const match4 = line.match(/^(.+?):(\d+)\s+-\s+Unknown word:\s+(.+)$/);
      if (match4) {
        const filePath = path.resolve(path.join(__dirname, '../..'), match4[1]);
        errors.push({
          file: filePath,
          line: parseInt(match4[2]),
          column: 1,
          word: match4[3].trim()
        });
        continue;
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
        fileObj = addFile(result, relativePath, file);
        fileMap.set(relativePath, fileObj);
      }
      
      errors.forEach(error => {
        addWarning(fileObj, {
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
  // Note: When there are many errors, this makes the JSON large, but it's needed for accurate reporting
  for (const file of files) {
    const relativePath = path.relative('./src', file);
    if (!fileMap.has(relativePath)) {
      addFile(result, file, relativePath);
    }
  }

  // Output JSON result (formatter will handle display)
  outputResult(result);
  
  // Give stdout time to flush before exiting
  // Use setImmediate to ensure all writes are complete
  setImmediate(() => {
    process.exit(result.summary.issues > 0 ? 1 : 0);
  });
}

// Run validation
validateSpelling();

