#!/usr/bin/env node

const path = require('path');
const { HtmlValidate, FileSystemConfigLoader } = require('html-validate');
const { checkSiteDirectory, getHtmlFiles, getRelativePath, readFile } = require('./utils/test-base');

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

  console.log(`\n📊 Summary:`);
  console.log(`   Files checked: ${htmlFiles.length}`);
  console.log(`   Files with issues: ${filesWithIssues}`);
  console.log(`   Total Errors: ${totalIssues}`);
  console.log(`   Total Warnings: ${totalWarnings}`);

  if (totalIssues === 0) {
    if (totalWarnings > 0) {
      console.log('\n✅ No critical issues found, but there are warnings.');
      process.exit(0);
    } else {
      console.log('\n🎉 All HTML files passed validation!');
      process.exit(0);
    }
  } else {
    console.log('\n❌ Critical issues found that should be addressed.');
    process.exit(1);
  }
}

validate().catch(err => {
  console.error(err);
  process.exit(1);
});
