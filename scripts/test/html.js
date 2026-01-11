#!/usr/bin/env node

const { HtmlValidate, FileSystemConfigLoader } = require('html-validate');
const { getHtmlFiles, getRelativePath, readFile } = require('../utils/test-helpers');
const { addFile, addIssue, addWarning } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

async function validate(result) {
  const htmlFiles = getHtmlFiles();

  const loader = new FileSystemConfigLoader();
  const htmlvalidate = new HtmlValidate(loader);

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
}

// Run test with helper
runTest({
  testType: 'html',
  testName: 'HTML Validation',
  requiresSite: true,
  validateFn: async (result) => {
    await validate(result);
  }
}).catch(err => {
  console.error(err);
  process.exit(1);
});
