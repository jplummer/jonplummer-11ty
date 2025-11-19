#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { HtmlValidate, FileSystemConfigLoader } = require('html-validate');
const { findHtmlFiles } = require('../utils/file-utils');

async function validate() {
  // Main validation
  console.log('🔍 Starting HTML validity validation (html-validate)...\n');

  const siteDir = './_site';
  if (!fs.existsSync(siteDir)) {
    console.log('❌ _site directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  const htmlFiles = findHtmlFiles(siteDir);
  console.log(`Found ${htmlFiles.length} HTML files\n`);

  const loader = new FileSystemConfigLoader();
  const htmlvalidate = new HtmlValidate(loader);
  let totalIssues = 0;
  let totalWarnings = 0;
  let filesWithIssues = 0;

  for (const file of htmlFiles) {
    const relativePath = path.relative('./_site', file);
    const content = fs.readFileSync(file, 'utf8');

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
