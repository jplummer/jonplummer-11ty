#!/usr/bin/env node

/**
 * Security Audit Script
 * 
 * Performs periodic security and maintenance checks for the 11ty site.
 * This script automates security audits and provides a checklist for manual tasks.
 * 
 * Usage:
 *   node scripts/security/security-audit.js
 * 
 * Configuration:
 *   The script reads the site domain from the SITE_DOMAIN environment variable
 *   (or from .env file). If not set, defaults to 'jonplummer.com'.
 *   
 *   Add to .env file:
 *     SITE_DOMAIN=jonplummer.com
 *   
 *   Note: SITE_DOMAIN is the public-facing domain, not the SSH hostname.
 *   DEPLOY_HOST is used for deployment (SSH), SITE_DOMAIN is for live site checks.
 * 
 * The script:
 * - Automates checks where possible (pnpm audit, outdated packages, security headers, etc.)
 * - Outputs a markdown security report to the console
 * - Provides a checklist of manual tasks that require human review
 * - Exits with code 0 if all automated checks pass, 1 if issues found
 */

const fs = require('fs');
const { loadDotenvSilently } = require('../utils/env-utils');

// Load environment variables if .env exists
if (fs.existsSync('.env')) {
  loadDotenvSilently();
}

const { createTestResult, addFile, addIssue, addWarning, finalizeTestResult } = require('../utils/test-result-builder');
const { formatVerbose, formatCompact, formatBuild } = require('../utils/test-formatter');

// Import check modules
const dependencyChecks = require('./checks/dependency-checks');
const configChecks = require('./checks/config-checks');
const buildChecks = require('./checks/build-checks');
const contentChecks = require('./checks/content-checks');
const liveSiteChecks = require('./checks/live-site-checks');

// Track results with detailed findings (legacy format for check execution)
const results = {
  passed: [],
  warnings: [],
  failures: [],
  manual: [],
  findings: [] // Detailed findings for markdown report
};

// Track check results for JSON output
const checkResults = new Map(); // checkName -> { status, severity, description, recommendation, details }

// Add finding to results
function addFinding(checkName, status, severity, description, recommendation = '', details = {}) {
  results.findings.push({
    check: checkName,
    status: status, // 'pass', 'warn', 'fail'
    severity: severity, // 'critical', 'high', 'medium', 'low', 'info'
    description: description,
    recommendation: recommendation,
    details: details
  });
  
  // Also track for JSON output
  checkResults.set(checkName, {
    status,
    severity,
    description,
    recommendation,
    details
  });
}

// Main audit function
async function runSecurityAudit() {
  // Dependency & Package Security
  await dependencyChecks.checkNpmAudit(results, addFinding);
  await dependencyChecks.checkOutdatedPackages(results, addFinding);
  await dependencyChecks.checkNodeVersion(results, addFinding);
  await dependencyChecks.checkDeprecatedPackages(results, addFinding);
  
  // Code & Configuration Security
  await configChecks.checkEnvironmentVariables(results, addFinding);
  await configChecks.checkPackageJson(results, addFinding);
  await configChecks.checkFilePermissions(results, addFinding);
  await configChecks.checkGitHistory(results, addFinding);
  
  // Build & Deployment Security
  await buildChecks.checkBuildOutput(results, addFinding);
  await buildChecks.checkCSP(results, addFinding);
  
  // Content & Links Security
  await contentChecks.checkRedirects(results, addFinding);
  await contentChecks.checkThirdPartyResources(results, addFinding);
  
  // Live Site Security (if configured)
  await liveSiteChecks.checkSecurityHeaders(results, addFinding);
  await liveSiteChecks.checkCertificateExpiration(results, addFinding);
  await liveSiteChecks.checkDNSRecords(results, addFinding);
  
  // Build JSON result using test-result-builder
  const jsonResult = createTestResult('security-audit', 'Security Audit');
  
  // Map each check to a file entry
  const checkOrder = [
    // Dependency & Package Security
    'pnpm audit',
    'pnpm outdated',
    'Node.js version',
    'Deprecated packages',
    // Code & Configuration Security
    'Environment variables',
    'package.json',
    'File permissions',
    'Git history',
    // Build & Deployment Security
    'Build output',
    'Content Security Policy',
    // Content & Links Security
    'Redirect security',
    'Third-party resources',
    // Live Site Security
    'Security headers',
    'TLS certificate',
    'DNS records'
  ];
  
  // Map all checks to file entries (including passing ones for accurate summary)
  checkOrder.forEach(checkName => {
    const checkResult = checkResults.get(checkName);
    if (!checkResult) return; // Skip if check wasn't run
    
    const fileObj = addFile(jsonResult, checkName);
    
    // Map status to issues/warnings
    if (checkResult.status === 'fail') {
      addIssue(fileObj, {
        severity: 'error',
        type: checkResult.severity || 'error',
        message: checkResult.description,
        recommendation: checkResult.recommendation || '',
        details: checkResult.details
      });
    } else if (checkResult.status === 'warn') {
      // Map severity: critical/high warnings should be treated as more serious
      const warningSeverity = checkResult.severity === 'critical' || checkResult.severity === 'high'
        ? checkResult.severity
        : 'warning';
      
      addWarning(fileObj, {
        severity: warningSeverity,
        type: checkResult.severity || 'warning',
        message: checkResult.description,
        recommendation: checkResult.recommendation || '',
        details: checkResult.details
      });
    }
    // 'pass' status means no issues or warnings - file stays in 'passed' state
  });
  
  // Finalize result to calculate summary
  finalizeTestResult(jsonResult);
  
  // Output formatted result (matches test suite style)
  const formatOptions = { groupBy: 'file' };
  const format = process.env.SECURITY_AUDIT_FORMAT || 'verbose';
  
  let formattedOutput;
  if (format === 'compact') {
    formattedOutput = formatCompact(jsonResult);
  } else if (format === 'build') {
    formattedOutput = formatBuild(jsonResult);
  } else {
    formattedOutput = formatVerbose(jsonResult, formatOptions);
  }
  
  // Output formatted result (matches test suite style)
  console.log(formattedOutput);
  
  // Exit with appropriate code
  const summary = jsonResult.summary;
  const hasFailures = summary.issues > 0;
  
  if (hasFailures) {
    process.exit(1);
  } else if (summary.warnings > 0) {
    process.exit(0); // Warnings don't block
  } else {
    process.exit(0);
  }
}

// Run audit
runSecurityAudit().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
