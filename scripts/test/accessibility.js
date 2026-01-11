#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer');
const axeCore = require('axe-core');
const { findHtmlFiles } = require('../utils/file-utils');
const { createTestResult, addFile, addIssue, addWarning, addCustomSection, outputResult } = require('../utils/test-results');

// Format axe-core violations for display
function formatViolations(violations) {
  const issues = [];
  
  violations.forEach(violation => {
    const nodes = violation.nodes.map(node => {
      const target = node.target.join(' > ');
      const failureSummary = node.failureSummary ? node.failureSummary.trim() : '';
      return `${target}${failureSummary ? `: ${failureSummary}` : ''}`;
    });
    
    issues.push({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: nodes,
      tags: violation.tags
    });
  });
  
  return issues;
}

// Get files changed since last commit
function getChangedFiles() {
  try {
    const output = execSync('git diff --name-only --diff-filter=ACMR HEAD', {
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    return output.trim().split('\n').filter(line => line.trim());
  } catch (error) {
    return [];
  }
}

// Check if templates, layouts, or CSS changed (affects all pages)
function hasGlobalFilesChanged(changedFiles) {
  return changedFiles.some(file => {
    // Templates and layouts
    if (file.startsWith('src/_includes/') || file.startsWith('eleventy/')) {
      return true;
    }
    // CSS files
    if (file.startsWith('src/assets/css/') && file.endsWith('.css')) {
      return true;
    }
    // Configuration that affects all pages
    if (file === '.eleventy.js' || file.startsWith('eleventy/config/')) {
      return true;
    }
    return false;
  });
}

// Map changed source file to built HTML file(s)
// Returns array of relative paths from _site directory
function mapSourceToBuiltHtml(sourceFile) {
  const builtFiles = [];
  const normalizedPath = sourceFile.replace(/\\/g, '/');
  
  // Posts: src/_posts/YYYY/YYYY-MM-DD-post-slug.md -> YYYY/MM/DD/post-slug/index.html
  // Posts are in year directories with date in filename
  if (normalizedPath.startsWith('src/_posts/')) {
    const postMatch = normalizedPath.match(/src\/_posts\/(\d{4})\/(\d{4})-(\d{2})-(\d{2})-([^/]+)\.md$/);
    if (postMatch) {
      const [, year, yearFromFilename, month, day, slug] = postMatch;
      // Use year from filename (should match directory, but filename is authoritative)
      builtFiles.push(`${yearFromFilename}/${month}/${day}/${slug}/index.html`);
    }
  }
  
  // Other markdown files: src/about.md -> about/index.html
  if (normalizedPath.startsWith('src/') && normalizedPath.endsWith('.md') && !normalizedPath.startsWith('src/_posts/')) {
    const relativePath = normalizedPath.replace(/^src\//, '').replace(/\.md$/, '');
    builtFiles.push(`${relativePath}/index.html`);
  }
  
  // Nunjucks templates: src/page.njk -> page/index.html
  if (normalizedPath.startsWith('src/') && normalizedPath.endsWith('.njk') && !normalizedPath.startsWith('src/_includes/')) {
    const relativePath = normalizedPath.replace(/^src\//, '').replace(/\.njk$/, '');
    // Skip if it's a layout or component
    if (!relativePath.startsWith('_includes/')) {
      builtFiles.push(`${relativePath}/index.html`);
      // Also check root index
      if (relativePath === 'index') {
        builtFiles.push('index.html');
      }
    }
  }
  
  return builtFiles;
}

// Get HTML files to test based on --changed flag
function getHtmlFilesToTest(useChanged, allHtmlFiles) {
  if (!useChanged) {
    return allHtmlFiles;
  }
  
  const changedFiles = getChangedFiles();
  
  if (changedFiles.length === 0) {
    return [];
  }
  
  // If templates/layouts/CSS changed, test all HTML files
  if (hasGlobalFilesChanged(changedFiles)) {
    return allHtmlFiles;
  }
  
  // Otherwise, map changed source files to built HTML files
  const htmlFilesToTest = new Set();
  const siteDir = path.resolve('./_site');
  
  for (const sourceFile of changedFiles) {
    const builtPaths = mapSourceToBuiltHtml(sourceFile);
    for (const builtPath of builtPaths) {
      const fullPath = path.join(siteDir, builtPath);
      if (fs.existsSync(fullPath)) {
        htmlFilesToTest.add(fullPath);
      }
    }
  }
  
  return Array.from(htmlFilesToTest);
}

// Process files in parallel with concurrency limit
async function processFilesInParallel(browser, htmlFiles, result, lightModeStats, darkModeStats, concurrency = 5) {
  let processedCount = 0;
  const totalFiles = htmlFiles.length;
  
  // Process files in batches
  for (let i = 0; i < htmlFiles.length; i += concurrency) {
    const batch = htmlFiles.slice(i, i + concurrency);
    
    // Process batch in parallel
    await Promise.all(batch.map(async (file) => {
      const relativePath = path.relative('./_site', file);
      
      // Skip redirect pages (they have minimal HTML and redirect immediately)
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('<title>Redirecting...</title>')) {
        processedCount++;
        process.stderr.write(`__TEST_PROGRESS__${processedCount}/${totalFiles}__`);
        return;
      }
      
      // Add file to result
      const fileObj = addFile(result, file, relativePath);
      
      try {
        // Test both modes in one page session (faster than two separate sessions)
        const { light: lightResults, dark: darkResults } = await testFileWithAxeBothModes(browser, file);
        const lightViolations = lightResults.violations || [];
        const lightIncomplete = lightResults.incomplete || [];
        const darkViolations = darkResults.violations || [];
        const darkIncomplete = darkResults.incomplete || [];
        
        // Add light mode violations as issues
        if (lightViolations.length > 0) {
          const formattedIssues = formatViolations(lightViolations);
          
          formattedIssues.forEach(issue => {
            // Build message with nodes info
            let message = `${issue.help} (${issue.impact} impact)`;
            if (issue.nodes.length > 0) {
              const nodeList = issue.nodes.slice(0, 3).join('; ');
              message += `: ${nodeList}`;
              if (issue.nodes.length > 3) {
                message += ` (and ${issue.nodes.length - 3} more)`;
              }
            }
            
            addIssue(fileObj, {
              type: 'accessibility-violation',
              message: message,
              ruleId: issue.id,
              impact: issue.impact,
              helpUrl: issue.helpUrl,
              description: issue.description,
              nodes: issue.nodes,
              tags: issue.tags
            });
          });
          
          lightModeStats.violations += lightViolations.length;
          lightModeStats.filesWithViolations++;
        }
        
        // Add light mode incomplete as warnings
        if (lightIncomplete.length > 0) {
          addWarning(fileObj, {
            type: 'accessibility-incomplete',
            message: `${lightIncomplete.length} incomplete check(s) (manual review needed)`,
            mode: 'light'
          });
          
          lightModeStats.incomplete += lightIncomplete.length;
        }
        
        // Add dark mode violations as issues
        if (darkViolations.length > 0) {
          const formattedIssues = formatViolations(darkViolations);
          
          formattedIssues.forEach(issue => {
            let message = `${issue.help} (${issue.impact} impact) [Dark mode]`;
            if (issue.nodes.length > 0) {
              const nodeList = issue.nodes.slice(0, 3).join('; ');
              message += `: ${nodeList}`;
              if (issue.nodes.length > 3) {
                message += ` (and ${issue.nodes.length - 3} more)`;
              }
            }
            
            addIssue(fileObj, {
              type: 'accessibility-violation',
              message: message,
              ruleId: issue.id,
              impact: issue.impact,
              helpUrl: issue.helpUrl,
              description: issue.description,
              nodes: issue.nodes,
              tags: issue.tags,
              mode: 'dark'
            });
          });
          
          darkModeStats.violations += darkViolations.length;
          darkModeStats.filesWithViolations++;
        }
        
        // Add dark mode incomplete as warnings
        if (darkIncomplete.length > 0) {
          addWarning(fileObj, {
            type: 'accessibility-incomplete',
            message: `${darkIncomplete.length} incomplete check(s) (manual review needed) [Dark mode]`,
            mode: 'dark'
          });
          
          darkModeStats.incomplete += darkIncomplete.length;
        }
        
      } catch (error) {
        addIssue(fileObj, {
          type: 'accessibility-error',
          message: `Error testing file: ${error.message}`
        });
      }
      
      processedCount++;
      process.stderr.write(`__TEST_PROGRESS__${processedCount}/${totalFiles}__`);
    }));
  }
}

// Test a single HTML file with axe-core in both light and dark modes
// Returns { light: results, dark: results }
async function testFileWithAxeBothModes(browser, filePath) {
  const page = await browser.newPage();
  
  try {
    // Set light mode preference first
    await page.emulateMediaFeatures([
      { name: 'prefers-color-scheme', value: 'light' }
    ]);
    
    // Load the HTML file
    // Use 'domcontentloaded' instead of 'networkidle0' for faster loads with static file:// URLs
    const fileUrl = `file://${path.resolve(filePath)}`;
    await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
    
    // Inject axe-core once
    await page.addScriptTag({ content: axeCore.source });
    
    // Test light mode (all rules)
    const lightResults = await page.evaluate(() => {
      return axe.run();
    });
    
    // Switch to dark mode and wait a moment for styles to recompute
    await page.emulateMediaFeatures([
      { name: 'prefers-color-scheme', value: 'dark' }
    ]);
    
    // Wait for styles to recompute after media query change
    await page.evaluate(() => {
      // Force style computation by reading computed styles
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        window.getComputedStyle(el).color;
        window.getComputedStyle(el).backgroundColor;
      });
    });
    // Small delay to ensure CSS custom properties are resolved
    // Use Promise-based delay instead of deprecated waitForTimeout
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Test dark mode (contrast only)
    const darkResults = await page.evaluate(() => {
      const config = {
        runOnly: {
          type: 'rule',
          values: ['color-contrast']
        }
      };
      return axe.run(config);
    });
    
    await page.close();
    
    return { light: lightResults, dark: darkResults };
  } catch (error) {
    await page.close();
    throw error;
  }
}

// Main accessibility validation using axe-core
async function validateAccessibility() {
  // Check if --changed flag is provided
  const args = process.argv.slice(2);
  const useChanged = args.includes('--changed');
  
  const siteDir = './_site';
  if (!fs.existsSync(siteDir)) {
    console.log('❌ _site directory not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  const allHtmlFiles = findHtmlFiles(siteDir);
  
  // Get HTML files to test (all or filtered by --changed)
  const htmlFiles = getHtmlFilesToTest(useChanged, allHtmlFiles);
  
  if (htmlFiles.length === 0) {
    // Create empty result
    const result = createTestResult('accessibility', 'Accessibility Validation');
    if (useChanged) {
      // Add a note that no files need testing
      addCustomSection(result, 'ℹ️  Note', {
        message: 'No HTML files need testing based on changed source files'
      });
    }
    outputResult(result);
    process.exit(0);
    return;
  }
  
  // Create test result using result builder
  const result = createTestResult('accessibility', 'Accessibility Validation');
  
  // Track light/dark mode stats for custom sections
  const lightModeStats = {
    violations: 0,
    incomplete: 0,
    filesWithViolations: 0
  };
  const darkModeStats = {
    violations: 0,
    incomplete: 0,
    filesWithViolations: 0
  };
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Process files in parallel with concurrency limit of 8
    // Increased from 5 to 8 for better performance (can be tuned based on system)
    await processFilesInParallel(browser, htmlFiles, result, lightModeStats, darkModeStats, 8);
    
  } finally {
    await browser.close();
  }
  
  // Add custom sections for light/dark mode stats
  addCustomSection(result, '☀️  Light mode', {
    violations: lightModeStats.violations,
    filesWithViolations: lightModeStats.filesWithViolations,
    incomplete: lightModeStats.incomplete
  });
  
  addCustomSection(result, '🌙 Dark mode (contrast only)', {
    violations: darkModeStats.violations,
    filesWithViolations: darkModeStats.filesWithViolations,
    incomplete: darkModeStats.incomplete
  });
  
  // Output JSON result (formatter will handle display - compact for group runs, verbose for individual)
  outputResult(result);
  
  // Exit with appropriate code (errors block, warnings don't)
  process.exit(result.summary.issues > 0 ? 1 : 0);
}

// Run validation
validateAccessibility().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
