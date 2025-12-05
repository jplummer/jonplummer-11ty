#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { HtmlValidate, FileSystemConfigLoader } = require('html-validate');
const { checkSiteDirectory, getHtmlFiles, getRelativePath, readFile } = require('../utils/test-base');
const { printSummary, exitWithResults, getTestEmoji } = require('../utils/reporting-utils');

async function validate() {
  checkSiteDirectory();
  const htmlFiles = getHtmlFiles();

  const loader = new FileSystemConfigLoader();
  const htmlvalidate = new HtmlValidate(loader);
  let totalIssues = 0;
  let totalWarnings = 0;
  let filesWithIssues = 0;

  for (const file of htmlFiles) {
    const relativePath = getRelativePath(file);
    const content = readFile(file);

    const report = await htmlvalidate.validateString(content, file);

    if (!report.valid) {
      filesWithIssues++;
      // Only show header messages when there are issues (or in verbose mode)
      const compact = process.env.TEST_COMPACT_MODE === 'true';
      if (!compact || (totalIssues === 0 && totalWarnings === 0)) {
        if (totalIssues === 0 && totalWarnings === 0) {
          console.log('🔍 Starting HTML validity validation (html-validate)...\n');
          console.log(`Found ${htmlFiles.length} HTML files\n`);
        }
      }
      console.log(`📄 ${relativePath}:`);

      report.results.forEach(result => {
        result.messages.forEach(msg => {
          const symbol = msg.severity === 2 ? '❌' : '⚠️ ';
          console.log(`   ${symbol} [${msg.ruleId}] ${msg.message}`);
          console.log(`      Line ${msg.line}, Column ${msg.column}`);

          if (msg.severity === 2) {
            totalIssues++;
          } else {
            totalWarnings++;
          }
        });
      });
    }
  }

  // Check if running in compact mode (group runs)
  const compact = process.env.TEST_COMPACT_MODE === 'true';
  
  // Summary - compact mode shows single line for passing, full for failing
  printSummary('HTML Validation', getTestEmoji('html'), [
    { label: 'Files checked', value: htmlFiles.length },
    { label: 'Files with issues', value: filesWithIssues },
    { label: 'Total Errors', value: totalIssues },
    { label: 'Total Warnings', value: totalWarnings }
  ], { compact: compact });

  // Write summary file for test runner
  const summaryPath = path.join(__dirname, '.html-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({ 
    files: htmlFiles.length, 
    issues: totalIssues, 
    warnings: totalWarnings 
  }), 'utf8');
  
  exitWithResults(totalIssues, totalWarnings, {
    testType: 'HTML validation',
    warningMessage: '\n✅ No critical issues found, but there are warnings.',
    successMessage: '\n🎉 All HTML files passed validation!',
    issueMessage: '\n❌ Critical issues found that should be addressed.',
    compact: compact
  });
}

validate().catch(err => {
  console.error(err);
  process.exit(1);
});
