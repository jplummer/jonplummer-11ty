#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const axeCore = require('axe-core');
const { findHtmlFiles } = require('../utils/file-utils');
const { printSummary, exitWithResults, getTestEmoji } = require('../utils/reporting-utils');

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
  console.log('♿ Starting accessibility validation with axe-core...\n');
  console.log('Testing approach:');
  console.log('  ☀️  Light mode: All accessibility rules');
  console.log('  🌙 Dark mode: Color contrast only\n');
  
  const siteDir = './_site';
  if (!fs.existsSync(siteDir)) {
    console.log('❌ _site directory not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  const htmlFiles = findHtmlFiles(siteDir);
  console.log(`Found ${htmlFiles.length} HTML files\n`);
  
  if (htmlFiles.length === 0) {
    console.log('⚠️  No HTML files found to test.');
    process.exit(0);
  }
  
  const results = {
    total: htmlFiles.length,
    totalViolations: 0,
    totalIncomplete: 0,
    filesWithViolations: 0,
    filesWithIncomplete: 0,
    passes: 0,
    lightMode: {
      violations: 0,
      incomplete: 0,
      filesWithViolations: 0
    },
    darkMode: {
      violations: 0,
      incomplete: 0,
      filesWithViolations: 0
    }
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
      
      // Skip redirect pages (they have minimal HTML and redirect immediately)
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('<title>Redirecting...</title>')) {
        console.log(`📄 [${fileNumber}/${htmlFiles.length}] ${relativePath}:`);
        console.log(`   ⏭️  Skipped (redirect page)`);
        console.log('');
        results.total--;
        continue;
      }
      
      try {
        // Test in light mode (all rules)
        const lightResults = await testFileWithAxe(browser, file, 'light');
        const lightViolations = lightResults.violations || [];
        const lightIncomplete = lightResults.incomplete || [];
        
        // Test in dark mode (contrast only)
        const darkResults = await testFileWithAxe(browser, file, 'dark', ['color-contrast']);
        const darkViolations = darkResults.violations || [];
        const darkIncomplete = darkResults.incomplete || [];
        
        const hasLightIssues = lightViolations.length > 0 || lightIncomplete.length > 0;
        const hasDarkIssues = darkViolations.length > 0 || darkIncomplete.length > 0;
        const hasIssues = hasLightIssues || hasDarkIssues;
        
        // Show progress for all files, with status indicator
        if (hasIssues) {
          console.log(`📄 [${fileNumber}/${htmlFiles.length}] ${relativePath}:`);
        } else {
          // Show passing files with a simple indicator
          console.log(`📄 [${fileNumber}/${htmlFiles.length}] ${relativePath}: ✅`);
        }
        
        // Light mode results
        if (hasLightIssues) {
          console.log(`   ☀️  Light mode:`);
          
          if (lightViolations.length > 0) {
            const formattedIssues = formatViolations(lightViolations);
            
            formattedIssues.forEach(issue => {
              console.log(`      ❌ ${issue.help} (${issue.impact} impact)`);
              if (issue.nodes.length > 0) {
                issue.nodes.slice(0, 3).forEach(node => {
                  console.log(`         - ${node}`);
                });
                if (issue.nodes.length > 3) {
                  console.log(`         ... and ${issue.nodes.length - 3} more`);
                }
              }
              if (issue.helpUrl) {
                console.log(`         Learn more: ${issue.helpUrl}`);
              }
            });
            
            results.totalViolations += lightViolations.length;
            results.lightMode.violations += lightViolations.length;
            results.lightMode.filesWithViolations++;
            results.filesWithViolations++;
          }
          
          if (lightIncomplete.length > 0) {
            console.log(`      ⚠️  ${lightIncomplete.length} incomplete check(s) (manual review needed)`);
            results.totalIncomplete += lightIncomplete.length;
            results.lightMode.incomplete += lightIncomplete.length;
            results.filesWithIncomplete++;
          }
        }
        
        // Dark mode results (contrast only)
        if (hasDarkIssues) {
          console.log(`   🌙 Dark mode (contrast only):`);
          
          if (darkViolations.length > 0) {
            const formattedIssues = formatViolations(darkViolations);
            
            formattedIssues.forEach(issue => {
              console.log(`      ❌ ${issue.help} (${issue.impact} impact)`);
              if (issue.nodes.length > 0) {
                issue.nodes.slice(0, 3).forEach(node => {
                  console.log(`         - ${node}`);
                });
                if (issue.nodes.length > 3) {
                  console.log(`         ... and ${issue.nodes.length - 3} more`);
                }
              }
              if (issue.helpUrl) {
                console.log(`         Learn more: ${issue.helpUrl}`);
              }
            });
            
            results.totalViolations += darkViolations.length;
            results.darkMode.violations += darkViolations.length;
            results.darkMode.filesWithViolations++;
            if (!hasLightIssues) {
              results.filesWithViolations++;
            }
          }
          
          if (darkIncomplete.length > 0) {
            console.log(`      ⚠️  ${darkIncomplete.length} incomplete check(s) (manual review needed)`);
            results.totalIncomplete += darkIncomplete.length;
            results.darkMode.incomplete += darkIncomplete.length;
            if (!hasLightIssues) {
              results.filesWithIncomplete++;
            }
          }
        }
        
        if (!hasIssues) {
          results.passes++;
        }
        
        // Add blank line only if we printed detailed output
        if (hasIssues) {
          console.log('');
        }
        
      } catch (error) {
        console.log(`📄 [${fileNumber}/${htmlFiles.length}] ${relativePath}:`);
        console.log(`   ❌ Error testing file: ${error.message}`);
        console.log('');
        results.totalViolations++;
        results.filesWithViolations++;
      }
    }
    
  } finally {
    await browser.close();
  }
  
  // Summary
  printSummary('Accessibility Validation', getTestEmoji('accessibility'), [
    { label: 'Total files', value: results.total },
    { label: 'Total violations', value: results.totalViolations },
    { label: 'Files with violations', value: results.filesWithViolations },
    { label: 'Total incomplete checks', value: results.totalIncomplete },
    { label: 'Files with incomplete checks', value: results.filesWithIncomplete },
    { label: 'Files passing all checks', value: results.passes }
  ], {
    customSections: [
      {
        title: '☀️  Light mode',
        lines: [
          `Violations: ${results.lightMode.violations}`,
          `Files with violations: ${results.lightMode.filesWithViolations}`,
          `Incomplete checks: ${results.lightMode.incomplete}`
        ]
      },
      {
        title: '🌙 Dark mode (contrast only)',
        lines: [
          `Violations: ${results.darkMode.violations}`,
          `Files with violations: ${results.darkMode.filesWithViolations}`,
          `Incomplete checks: ${results.darkMode.incomplete}`
        ]
      }
    ]
  });
  
  exitWithResults(results.totalViolations, 0, {
    testType: 'accessibility validation',
    successMessage: '\n🎉 All accessibility validation passed!'
  });
}

// Run validation
validateAccessibility().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
