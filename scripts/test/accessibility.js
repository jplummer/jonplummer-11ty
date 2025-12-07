#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const axeCore = require('axe-core');
const { findHtmlFiles } = require('../utils/file-utils');
const { createTestResult, addFile, addIssue, addWarning, addCustomSection, outputResult } = require('../utils/test-result-builder');

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

// Test a single HTML file with axe-core
async function testFileWithAxe(browser, filePath, colorScheme = 'light', rulesOnly = null) {
  const page = await browser.newPage();
  
  try {
    // Emulate color scheme preference
    if (colorScheme === 'dark') {
      await page.emulateMediaFeatures([
        { name: 'prefers-color-scheme', value: 'dark' }
      ]);
    } else {
      await page.emulateMediaFeatures([
        { name: 'prefers-color-scheme', value: 'light' }
      ]);
    }
    
    // Load the HTML file
    const fileUrl = `file://${path.resolve(filePath)}`;
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    
    // Inject axe-core
    await page.addScriptTag({ content: axeCore.source });
    
    // Run axe-core analysis
    const results = await page.evaluate((rulesConfig) => {
      if (rulesConfig && rulesConfig.length > 0) {
        // Run only specified rules using runOnly option
        const config = {
          runOnly: {
            type: 'rule',
            values: rulesConfig
          }
        };
        return axe.run(config);
      } else {
        // Run all rules
        return axe.run();
      }
    }, rulesOnly);
    
    await page.close();
    
    return results;
  } catch (error) {
    await page.close();
    throw error;
  }
}

// Main accessibility validation using axe-core
async function validateAccessibility() {
  const siteDir = './_site';
  if (!fs.existsSync(siteDir)) {
    console.log('❌ _site directory not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  const htmlFiles = findHtmlFiles(siteDir);
  
  if (htmlFiles.length === 0) {
    // Create empty result
    const result = createTestResult('accessibility', 'Accessibility Validation');
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
    // Test each file
    for (let i = 0; i < htmlFiles.length; i++) {
      const file = htmlFiles[i];
      const relativePath = path.relative('./_site', file);
      const fileNumber = i + 1;
      
      // Send progress update to test runner (via stderr with special marker)
      process.stderr.write(`__TEST_PROGRESS__${fileNumber}/${htmlFiles.length}__`);
      
      // Skip redirect pages (they have minimal HTML and redirect immediately)
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('<title>Redirecting...</title>')) {
        // Don't add redirect pages to result
        continue;
      }
      
      // Add file to result
      const fileObj = addFile(result, file, relativePath);
      
      try {
        // Test in light mode (all rules)
        const lightResults = await testFileWithAxe(browser, file, 'light');
        const lightViolations = lightResults.violations || [];
        const lightIncomplete = lightResults.incomplete || [];
        
        // Test in dark mode (contrast only)
        const darkResults = await testFileWithAxe(browser, file, 'dark', ['color-contrast']);
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
    }
    
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
