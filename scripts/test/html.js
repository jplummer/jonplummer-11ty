#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { HtmlValidate, FileSystemConfigLoader } = require('html-validate');
const { checkSiteDirectory, getHtmlFiles, getRelativePath, readFile } = require('../utils/test-base');
const { createTestResult, addFile, addIssue, addWarning, outputResult } = require('../utils/test-result-builder');

async function validate() {
  checkSiteDirectory();
  const htmlFiles = getHtmlFiles();

  const loader = new FileSystemConfigLoader();
  const htmlvalidate = new HtmlValidate(loader);
  
  // Create test result using result builder
  const result = createTestResult('html', 'HTML Validation');

  for (const file of htmlFiles) {
    const relativePath = getRelativePath(file);
    const content = readFile(file);

    const report = await htmlvalidate.validateString(content, file);

    // Add file to result
    const fileObj = addFile(result, file, relativePath);

    if (!report.valid) {
      report.results.forEach(resultItem => {
        resultItem.messages.forEach(msg => {
          const issueData = {
            type: 'html-validation',
            message: msg.message,
            ruleId: msg.ruleId,
            line: msg.line,
            column: msg.column
          };
          
          // Add context if available
          if (msg.context) {
            issueData.context = msg.context;
          }
          
          // Severity 2 = error, severity 1 = warning
          if (msg.severity === 2) {
            addIssue(fileObj, issueData);
          } else {
            addWarning(fileObj, issueData);
          }
        });
      });
    }
  }

  // Output JSON result (formatter will handle display)
  outputResult(result);
  
  // Exit with appropriate code (errors block, warnings don't)
  process.exit(result.summary.issues > 0 ? 1 : 0);
}

validate().catch(err => {
  console.error(err);
  process.exit(1);
});
