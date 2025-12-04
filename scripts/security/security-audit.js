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
 * - Automates checks where possible (npm audit, outdated packages, security headers, etc.)
 * - Outputs a markdown security report to the console
 * - Provides a checklist of manual tasks that require human review
 * - Exits with code 0 if all automated checks pass, 1 if issues found
 */

const fs = require('fs');

// Load environment variables if .env exists
if (fs.existsSync('.env')) {
  require('dotenv').config();
}

const { log, logSection } = require('../utils/audit-logging');
const { exitWithResults } = require('../utils/reporting-utils');
const { generateMarkdownReport } = require('./report-generator');

// Import check modules
const dependencyChecks = require('./checks/dependency-checks');
const configChecks = require('./checks/config-checks');
const buildChecks = require('./checks/build-checks');
const contentChecks = require('./checks/content-checks');
const liveSiteChecks = require('./checks/live-site-checks');

// Track results with detailed findings
const results = {
  passed: [],
  warnings: [],
  failures: [],
  manual: [],
  findings: [] // Detailed findings for markdown report
};

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
}

// Main audit function
async function runSecurityAudit() {
  log('🔒 Security Audit', 'blue');
  log('Running automated security checks...\n');
  
  // Dependency & Package Security
  logSection('Dependency & Package Security', '📦');
  await dependencyChecks.checkNpmAudit(results, addFinding);
  await dependencyChecks.checkOutdatedPackages(results, addFinding);
  await dependencyChecks.checkNodeVersion(results, addFinding);
  await dependencyChecks.checkDeprecatedPackages(results, addFinding);
  
  // Code & Configuration Security
  logSection('Code & Configuration Security', '⚙️');
  await configChecks.checkEnvironmentVariables(results, addFinding);
  await configChecks.checkPackageJson(results, addFinding);
  await configChecks.checkFilePermissions(results, addFinding);
  await configChecks.checkGitHistory(results, addFinding);
  
  // Build & Deployment Security
  logSection('Build & Deployment Security', '🏗️');
  await buildChecks.checkBuildOutput(results, addFinding);
  await buildChecks.checkCSP(results, addFinding);
  
  // Content & Links Security
  logSection('Content & Links Security', '🔗');
  await contentChecks.checkRedirects(results, addFinding);
  await contentChecks.checkThirdPartyResources(results, addFinding);
  
  // Live Site Security (if configured)
  logSection('Live Site Security', '🌐');
  await liveSiteChecks.checkSecurityHeaders(results, addFinding);
  await liveSiteChecks.checkCertificateExpiration(results, addFinding);
  await liveSiteChecks.checkDNSRecords(results, addFinding);
  
  // Summary
  console.log('');
  logSection('Summary', '📊');
  log(`  ✓ Passed: ${results.passed.length}`, 'green');
  log(`  ⚠ Warnings: ${results.warnings.length}`, 'yellow');
  log(`  ✗ Failures: ${results.failures.length}`, 'red');
  console.log('');
  
  // Generate and output markdown report
  const markdownReport = generateMarkdownReport(results);
  
  console.log('');
  logSection('Security Report', '📄');
  console.log(markdownReport);
  console.log('');
  
  // Use unified exit function with security audit-specific messages
  exitWithResults(results, 0, {
    testType: 'security audit',
    issueMessage: '❌ Security audit found issues that need attention.',
    warningMessage: '⚠️  Security audit completed with warnings.',
    successMessage: '✅ All automated security checks passed!\n\nSee the security report above for manual tasks checklist.',
    issueList: results.failures.length > 0 ? results.failures : null,
    warningList: results.warnings.length > 0 ? results.warnings : null,
    customExitLogic: (issuesCount, warningsCount) => {
      // Custom exit logic to preserve colored logging for security audit
      if (issuesCount > 0) {
        log('❌ Security audit found issues that need attention.', 'red');
        console.log('');
        log('Failures:', 'red');
        results.failures.forEach(failure => {
          console.log(`  - ${failure}`);
        });
        console.log('');
        process.exit(1);
      } else if (warningsCount > 0) {
        log('⚠️  Security audit completed with warnings.', 'yellow');
        console.log('');
        log('Warnings:', 'yellow');
        results.warnings.forEach(warning => {
          console.log(`  - ${warning}`);
        });
        console.log('');
        process.exit(0);
      } else {
        log('✅ All automated security checks passed!', 'green');
        console.log('');
        log('See the security report above for manual tasks checklist.', 'cyan');
        console.log('');
        process.exit(0);
      }
    }
  });
}

// Run audit
runSecurityAudit().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
