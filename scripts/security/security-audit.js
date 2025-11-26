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
 * The script:
 * - Automates checks where possible (npm audit, outdated packages, etc.)
 * - Provides a checklist of manual tasks that require human review
 * - Exits with code 0 if all automated checks pass, 1 if issues found
 * 
 * Periodic Security & Maintenance Tasks:
 * 
 * === Dependency & Package Security ===
 * - npm audit: Check for vulnerabilities (automated)
 * - npm outdated: Review outdated packages (automated)
 * - npm update: Update dependencies (manual - test after updating)
 * - Review dependency licenses: Ensure compatibility with your license (manual)
 * - Check for deprecated packages: npm deprecate or package changelogs (manual)
 * - Node.js version: Keep Node.js LTS current (manual)
 * 
 * === Code & Configuration Security ===
 * - Secrets audit: Scan for exposed API keys, passwords, tokens in code/history (manual)
 * - Environment variables: Verify .env isn't committed and .env.example is safe (automated check)
 * - Deployment scripts: Review scripts/deploy/ for security issues (manual)
 * - File permissions: Ensure sensitive files aren't world-readable (manual)
 * - Git history: Check for accidentally committed secrets (manual - use git-secrets or similar)
 * 
 * === Build & Deployment Security ===
 * - Security headers verification: Test headers on live site (manual - use securityheaders.com)
 * - CSP review: Verify Content Security Policy is effective and not too permissive (manual)
 * - HTTPS/TLS: Verify certificates are valid and not expiring soon (manual)
 * - Deployment credentials: Rotate SSH keys periodically (manual)
 * - Build output audit: Ensure no sensitive data in _site/ (manual)
 * 
 * === Content & Links Security ===
 * - External link validation: Check for broken/malicious links (automated via test suite)
 * - Third-party resources: Audit external scripts, fonts, images for security (manual)
 * - User-generated content: If any, review for XSS/injection risks (manual - N/A for static site)
 * - Redirect security: Verify redirects aren't open redirects (manual)
 * 
 * === Infrastructure & Monitoring ===
 * - Hosting provider security: Review provider security notices/updates (manual)
 * - Backup verification: Test restore process (manual)
 * - Access logs review: Check for suspicious activity (manual)
 * - Domain/DNS security: Verify DNS records, check for unauthorized changes (manual)
 * 
 * === Testing & Validation ===
 * - Run full test suite: Ensure all tests pass (manual - use npm run test all)
 * - Accessibility audit: Run axe-core tests (manual - use npm run test accessibility)
 * - HTML validation: Run html-validate (manual - use npm run test html)
 * - Performance monitoring: Check for regressions (manual - use npm run test performance)
 * 
 * === Documentation & Process ===
 * - Update security procedures: Document any new threats/mitigations (manual)
 * - Review incident response plan: Ensure it's current (manual)
 * - Check security advisories: Subscribe to Node.js, Eleventy, dependency advisories (manual)
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log(`=== ${title} ===`, 'cyan');
  console.log('');
}

function logCheck(name, status, details = '') {
  if (status === 'pending') {
    // Pending checks: show only the status message, not the check name
    if (details) {
      console.log(`    ${details}`);
    }
  } else {
    // Completed checks: show icon, name, and status
    const icon = status === 'pass' ? '✓' : status === 'warn' ? '⚠' : '✗';
    const color = status === 'pass' ? 'green' : status === 'warn' ? 'yellow' : 'red';
    log(`  ${icon} ${name}`, color);
    if (details) {
      console.log(`    ${details}`);
    }
  }
}

// Track results
const results = {
  passed: [],
  warnings: [],
  failures: [],
  manual: []
};

// Check npm audit
function checkNpmAudit() {
  logCheck('npm audit', 'pending', 'Checking for vulnerabilities...');
  try {
    const output = execSync('npm audit --json', { encoding: 'utf8', stdio: 'pipe' });
    const audit = JSON.parse(output);
    
    if (audit.vulnerabilities) {
      const vulnCount = Object.keys(audit.vulnerabilities).length;
      const critical = Object.values(audit.vulnerabilities).filter(v => v.severity === 'critical').length;
      const high = Object.values(audit.vulnerabilities).filter(v => v.severity === 'high').length;
      const moderate = Object.values(audit.vulnerabilities).filter(v => v.severity === 'moderate').length;
      const low = Object.values(audit.vulnerabilities).filter(v => v.severity === 'low').length;
      
      if (vulnCount > 0) {
        const details = `${vulnCount} vulnerabilities found (${critical} critical, ${high} high, ${moderate} moderate, ${low} low)`;
        logCheck('npm audit', 'fail', details);
        results.failures.push('npm audit: vulnerabilities found');
        return false;
      }
    }
    
    logCheck('npm audit', 'pass', 'No vulnerabilities found');
    results.passed.push('npm audit');
    return true;
  } catch (error) {
    // npm audit exits with non-zero if vulnerabilities found
    try {
      const output = error.stdout || error.message;
      if (output.includes('vulnerabilities')) {
        logCheck('npm audit', 'fail', 'Vulnerabilities found (run "npm audit" for details)');
        results.failures.push('npm audit: vulnerabilities found');
        return false;
      }
    } catch (e) {
      // Ignore parse errors
    }
    logCheck('npm audit', 'warn', 'Could not run npm audit (may need npm update)');
    results.warnings.push('npm audit: could not run');
    return false;
  }
}

// Check for outdated packages
function checkOutdatedPackages() {
  logCheck('npm outdated', 'pending', 'Checking for outdated packages...');
  try {
    const output = execSync('npm outdated --json', { encoding: 'utf8', stdio: 'pipe' });
    const outdated = JSON.parse(output);
    
    if (Object.keys(outdated).length > 0) {
      const count = Object.keys(outdated).length;
      const packages = Object.keys(outdated).slice(0, 5).join(', ');
      const more = count > 5 ? ` and ${count - 5} more` : '';
      logCheck('npm outdated', 'warn', `${count} package(s) outdated: ${packages}${more}`);
      results.warnings.push(`npm outdated: ${count} packages need updates`);
      return false;
    }
    
    logCheck('npm outdated', 'pass', 'All packages up to date');
    results.passed.push('npm outdated');
    return true;
  } catch (error) {
    // npm outdated exits with non-zero if packages are outdated
    try {
      const output = error.stdout || error.message;
      if (output.includes('Wanted') || output.includes('Current')) {
        logCheck('npm outdated', 'warn', 'Some packages are outdated (run "npm outdated" for details)');
        results.warnings.push('npm outdated: packages need updates');
        return false;
      }
    } catch (e) {
      // Ignore parse errors
    }
    logCheck('npm outdated', 'warn', 'Could not check outdated packages');
    results.warnings.push('npm outdated: could not check');
    return false;
  }
}

// Check Node.js version
function checkNodeVersion() {
  logCheck('Node.js version', 'pending', 'Checking Node.js version...');
  try {
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0]);
    const isLTS = major >= 18; // Node 18+ is LTS
    
    if (isLTS) {
      logCheck('Node.js version', 'pass', `Using Node.js ${version}`);
      results.passed.push(`Node.js version: ${version}`);
      return true;
    } else {
      logCheck('Node.js version', 'warn', `Node.js ${version} may not be LTS (consider upgrading)`);
      results.warnings.push(`Node.js version: ${version} may not be LTS`);
      return false;
    }
  } catch (error) {
    logCheck('Node.js version', 'warn', 'Could not determine Node.js version');
    results.warnings.push('Node.js version: could not check');
    return false;
  }
}

// Check for .env file and .gitignore
function checkEnvironmentVariables() {
  logCheck('Environment variables', 'pending', 'Checking .env and .gitignore...');
  
  const hasEnv = fs.existsSync('.env');
  const hasGitignore = fs.existsSync('.gitignore');
  let gitignoreContent = '';
  
  if (hasGitignore) {
    gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
  }
  
  const envInGitignore = gitignoreContent.includes('.env');
  
  if (hasEnv && !envInGitignore) {
    logCheck('Environment variables', 'fail', '.env file exists but not in .gitignore');
    results.failures.push('Environment variables: .env not in .gitignore');
    return false;
  }
  
  if (hasEnv && envInGitignore) {
    logCheck('Environment variables', 'pass', '.env file exists and is in .gitignore');
    results.passed.push('Environment variables: .env properly ignored');
    return true;
  }
  
  if (!hasEnv) {
    logCheck('Environment variables', 'warn', 'No .env file found (may be using system env vars)');
    results.warnings.push('Environment variables: no .env file');
    return false;
  }
  
  return true;
}

// Check package.json for security-related scripts
function checkPackageJson() {
  logCheck('package.json', 'pending', 'Checking package.json...');
  
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check for scripts that might expose sensitive info
    const scripts = pkg.scripts || {};
    const hasDeployScript = 'deploy' in scripts;
    
    if (hasDeployScript) {
      logCheck('package.json', 'pass', 'Deploy script found');
      results.passed.push('package.json: deploy script present');
    } else {
      logCheck('package.json', 'warn', 'No deploy script found');
      results.warnings.push('package.json: no deploy script');
    }
    
    return true;
  } catch (error) {
    logCheck('package.json', 'fail', `Error reading package.json: ${error.message}`);
    results.failures.push('package.json: could not read');
    return false;
  }
}

// Check for sensitive files in build output
function checkBuildOutput() {
  logCheck('Build output', 'pending', 'Checking _site/ for sensitive files...');
  
  if (!fs.existsSync('_site')) {
    logCheck('Build output', 'warn', '_site/ directory not found (run "npm run build" first)');
    results.warnings.push('Build output: _site/ not found');
    return false;
  }
  
  const sensitivePatterns = [
    '.env',
    '.git',
    'package.json',
    'package-lock.json',
    'node_modules'
  ];
  
  const found = [];
  function checkDir(dir) {
    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          checkDir(fullPath);
        } else {
          for (const pattern of sensitivePatterns) {
            if (entry.includes(pattern) || fullPath.includes(pattern)) {
              found.push(fullPath);
            }
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }
  
  checkDir('_site');
  
  if (found.length > 0) {
    logCheck('Build output', 'fail', `Sensitive files found in _site/: ${found.slice(0, 3).join(', ')}${found.length > 3 ? '...' : ''}`);
    results.failures.push('Build output: sensitive files found');
    return false;
  }
  
  logCheck('Build output', 'pass', 'No sensitive files found in _site/');
  results.passed.push('Build output: clean');
  return true;
}

// Main audit function
async function runSecurityAudit() {
  log('🔒 Security Audit', 'blue');
  log('Running automated security checks...\n');
  
  // Automated checks
  logSection('Dependency & Package Security');
  checkNpmAudit();
  checkOutdatedPackages();
  checkNodeVersion();
  
  logSection('Code & Configuration Security');
  checkEnvironmentVariables();
  checkPackageJson();
  
  logSection('Build & Deployment Security');
  checkBuildOutput();
  
  // Manual tasks checklist
  logSection('Manual Tasks Checklist');
  console.log('  The following tasks require manual review:');
  console.log('');
  
  const manualTasks = [
    'Dependency & Package Security:',
    '  [ ] Review dependency licenses for compatibility',
    '    How to: Run "npm list --depth=0" and check each package license at npmjs.com',
    '  [ ] Check for deprecated packages in changelogs',
    '    How to: Run "npm outdated" and check npmjs.com for deprecation notices',
    '  [ ] Update dependencies (test after updating)',
    '    How to: Run "npm update", then "npm run test all" to verify nothing broke',
    '',
    'Code & Configuration Security:',
    '  [ ] Scan codebase for exposed secrets (API keys, passwords, tokens)',
    '    How to: Search for patterns like "api_key", "password", "secret" in code files',
    '    Tool: Consider using "git-secrets" or "truffleHog" for automated scanning',
    '  [ ] Review deployment scripts for security issues',
    '    How to: Read scripts/deploy/deploy.js and verify no hardcoded credentials',
    '  [ ] Check file permissions on sensitive files',
    '    How to: Run "ls -la .env" (should be 600) and "ls -la scripts/deploy/"',
    '  [ ] Audit git history for accidentally committed secrets',
    '    How to: Run "git log --all --full-history -- .env" to check for past commits',
    '',
    'Build & Deployment Security:',
    '  [ ] Verify security headers on live site (securityheaders.com)',
    '    How to: Visit securityheaders.com, enter your domain, review score',
    '  [ ] Review Content Security Policy effectiveness',
    '    How to: Check src/.htaccess CSP header, test with browser DevTools Console',
    '  [ ] Verify HTTPS/TLS certificates are valid and not expiring',
    '    How to: Visit your site, click padlock icon, check expiration date',
    '  [ ] Rotate SSH keys periodically',
    '    How to: Generate new key with "ssh-keygen -t ed25519", add to server, remove old',
    '',
    'Content & Links Security:',
    '  [ ] Review third-party resources (scripts, fonts, images)',
    '    How to: Check src/_includes/base.njk for external <script> or <link> tags',
    '  [ ] Verify redirects are not open redirects',
    '    How to: Check src/*/redirect.njk files, ensure redirectUrl is your domain only',
    '  [ ] Run link validation: npm run test links',
    '    How to: Already automated - just run "npm run test links"',
    '',
    'Infrastructure & Monitoring:',
    '  [ ] Review hosting provider security notices',
    '    How to: Check Dreamhost email/panel for security alerts or updates',
    '  [ ] Test backup restore process',
    '    How to: Download a backup, restore to test location, verify it works',
    '  [ ] Review access logs for suspicious activity',
    '    How to: Check server logs for unusual IPs, failed login attempts, 404 patterns',
    '  [ ] Verify DNS records for unauthorized changes',
    '    How to: Run "dig yourdomain.com" and compare with expected values',
    '',
    'Testing & Validation:',
    '  [ ] Run full test suite: npm run test all',
    '    How to: Already automated - just run "npm run test all"',
    '  [ ] Run accessibility audit: npm run test accessibility',
    '    How to: Already automated - just run "npm run test accessibility"',
    '  [ ] Run HTML validation: npm run test html',
    '    How to: Already automated - just run "npm run test html"',
    '  [ ] Run performance tests: npm run test performance',
    '    How to: Already automated - just run "npm run test performance"',
    '',
    'Documentation & Process:',
    '  [ ] Update security procedures documentation',
    '    How to: Review docs/planning/plan.md and update security section if needed',
    '  [ ] Review incident response plan',
    '    How to: Document what to do if site is compromised (backup, restore, notify)',
    '  [ ] Check security advisories (Node.js, Eleventy, dependencies)',
    '    How to: Visit nodejs.org/en/blog/vulnerability, github.com/11ty/eleventy/releases'
  ];
  
  manualTasks.forEach(task => {
    if (task.trim() === '') {
      console.log('');
    } else if (task.endsWith(':')) {
      log(`  ${task}`, 'cyan');
    } else {
      console.log(`  ${task}`);
    }
  });
  
  // Summary
  console.log('');
  logSection('Summary');
  log(`  ✓ Passed: ${results.passed.length}`, 'green');
  log(`  ⚠ Warnings: ${results.warnings.length}`, 'yellow');
  log(`  ✗ Failures: ${results.failures.length}`, 'red');
  console.log('');
  
  if (results.failures.length > 0) {
    log('❌ Security audit found issues that need attention.', 'red');
    console.log('');
    log('Failures:', 'red');
    results.failures.forEach(failure => {
      console.log(`  - ${failure}`);
    });
    console.log('');
    process.exit(1);
  } else if (results.warnings.length > 0) {
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
    log('Remember to complete the manual tasks checklist above.', 'cyan');
    console.log('');
    process.exit(0);
  }
}

// Run audit
runSecurityAudit().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

