#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const axeCore = require('axe-core');
const { findHtmlFiles } = require('../utils/file-utils');

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
async function testFileWithAxe(browser, filePath) {
  const page = await browser.newPage();
  
  try {
    // Load the HTML file
    const fileUrl = `file://${path.resolve(filePath)}`;
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    
    // Inject axe-core
    await page.addScriptTag({ content: axeCore.source });
    
    // Run axe-core analysis
    const results = await page.evaluate(() => {
      return axe.run();
    });
    
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
    passes: 0
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
        const axeResults = await testFileWithAxe(browser, file);
        
        const violations = axeResults.violations || [];
        const incomplete = axeResults.incomplete || [];
        const hasIssues = violations.length > 0 || incomplete.length > 0;
        
        // Show progress for all files, with status indicator
        if (hasIssues) {
          console.log(`📄 [${fileNumber}/${htmlFiles.length}] ${relativePath}:`);
        } else {
          // Show passing files with a simple indicator
          console.log(`📄 [${fileNumber}/${htmlFiles.length}] ${relativePath}: ✅`);
        }
        
        if (violations.length > 0) {
          const formattedIssues = formatViolations(violations);
          
          formattedIssues.forEach(issue => {
            console.log(`   ❌ ${issue.help} (${issue.impact} impact)`);
            if (issue.nodes.length > 0) {
              issue.nodes.slice(0, 3).forEach(node => {
                console.log(`      - ${node}`);
              });
              if (issue.nodes.length > 3) {
                console.log(`      ... and ${issue.nodes.length - 3} more`);
              }
            }
            if (issue.helpUrl) {
              console.log(`      Learn more: ${issue.helpUrl}`);
            }
          });
          
          results.totalViolations += violations.length;
          results.filesWithViolations++;
        }
        
        if (incomplete.length > 0) {
          console.log(`   ⚠️  ${incomplete.length} incomplete check(s) (manual review needed)`);
          results.totalIncomplete += incomplete.length;
          results.filesWithIncomplete++;
        }
        
        if (violations.length === 0 && incomplete.length === 0) {
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
  console.log('📊 Accessibility Validation Summary:');
  console.log(`   Total files: ${results.total}`);
  console.log(`   Total violations: ${results.totalViolations}`);
  console.log(`   Files with violations: ${results.filesWithViolations}`);
  console.log(`   Total incomplete checks: ${results.totalIncomplete}`);
  console.log(`   Files with incomplete checks: ${results.filesWithIncomplete}`);
  console.log(`   Files passing all checks: ${results.passes}`);
  
  if (results.totalViolations > 0) {
    console.log('\n❌ Accessibility violations found that need attention.');
    process.exit(1);
  } else {
    console.log('\n🎉 All accessibility validation passed!');
  }
}

// Run validation
validateAccessibility().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
