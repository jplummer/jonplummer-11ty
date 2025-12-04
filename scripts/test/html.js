#!/usr/bin/env node

const path = require('path');
const { HtmlValidate, FileSystemConfigLoader } = require('html-validate');
const { checkSiteDirectory, getHtmlFiles, getRelativePath, readFile } = require('../utils/test-base');
const { printSummary, exitWithResults, getTestEmoji } = require('../utils/reporting-utils');

async function validate() {
  // Main validation
  console.log('🔍 Starting HTML validity validation (html-validate)...\n');

  checkSiteDirectory();
  const htmlFiles = getHtmlFiles();
  console.log(`Found ${htmlFiles.length} HTML files\n`);

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
      console.log('');
    } else {
      console.log(`✅ ${relativePath}`);
    }
  }

  printSummary('HTML Validation', getTestEmoji('html'), [
    { label: 'Files checked', value: htmlFiles.length },
    { label: 'Files with issues', value: filesWithIssues },
    { label: 'Total Errors', value: totalIssues },
    { label: 'Total Warnings', value: totalWarnings }
  ]);

  exitWithResults(totalIssues, totalWarnings, {
    testType: 'HTML validation',
    warningMessage: '\n✅ No critical issues found, but there are warnings.',
    successMessage: '\n🎉 All HTML files passed validation!',
    issueMessage: '\n❌ Critical issues found that should be addressed.'
  });
}

validate().catch(err => {
  console.error(err);
  process.exit(1);
});
