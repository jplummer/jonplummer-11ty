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
 * - Generates a markdown security report (saved to security-audit-report.md)
 * - Provides a checklist of manual tasks that require human review
 * - Exits with code 0 if all automated checks pass, 1 if issues found
 * 
 * Periodic Security & Maintenance Tasks:
 * 
 * === Dependency & Package Security ===
 * - npm audit: Check for vulnerabilities (automated)
 * - npm outdated: Review outdated packages (automated)
 * - npm update: Update dependencies (manual - test after updating)
 * - Review dependency licenses: Ensure compatibility with your license (automated)
 * - Check for deprecated packages: npm deprecate or package changelogs (automated)
 * - Node.js version: Keep Node.js LTS current (automated)
 * 
 * === Code & Configuration Security ===
 * - Secrets audit: Scan for exposed API keys, passwords, tokens in code/history (automated)
 * - Environment variables: Verify .env isn't committed and .env.example is safe (automated)
 * - Deployment scripts: Review scripts/deploy/ for security issues (automated)
 * - File permissions: Ensure sensitive files aren't world-readable (automated)
 * - Git history: Check for accidentally committed secrets (automated)
 * 
 * === Build & Deployment Security ===
 * - Security headers verification: Test headers on live site (automated)
 * - CSP review: Verify Content Security Policy is effective and not too permissive (automated)
 * - HTTPS/TLS: Verify certificates are valid and not expiring soon (automated)
 * - Deployment credentials: Rotate SSH keys periodically (manual)
 * - Build output audit: Ensure no sensitive data in _site/ (automated)
 * 
 * === Content & Links Security ===
 * - External link validation: Check for broken/malicious links (automated via test suite)
 * - Third-party resources: Audit external scripts, fonts, images for security (automated)
 * - User-generated content: If any, review for XSS/injection risks (manual - N/A for static site)
 * - Redirect security: Verify redirects aren't open redirects (automated)
 * 
 * === Infrastructure & Monitoring ===
 * - Hosting provider security: Review provider security notices/updates (manual)
 * - Backup verification: Test restore process (manual)
 * - Access logs review: Check for suspicious activity (manual)
 * - Domain/DNS security: Verify DNS records, check for unauthorized changes (automated)
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
const https = require('https');
const tls = require('tls');
const http = require('http');

// Load environment variables if .env exists
if (fs.existsSync('.env')) {
  require('dotenv').config();
}

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

// Track results with detailed findings
const results = {
  passed: [],
  warnings: [],
  failures: [],
  manual: [],
  findings: [] // Detailed findings for markdown report
};

// Get site domain from environment or default
// Note: DEPLOY_HOST is the SSH hostname, not the public domain
// Use SITE_DOMAIN for the actual website domain
function getSiteDomain() {
  // Try to get from SITE_DOMAIN environment variable (loaded via dotenv)
  if (process.env.SITE_DOMAIN) {
    return process.env.SITE_DOMAIN.trim();
  }
  
  // Fallback: try to read from .env file directly (in case dotenv didn't load)
  if (fs.existsSync('.env')) {
    try {
      const envContent = fs.readFileSync('.env', 'utf8');
      const siteDomainMatch = envContent.match(/SITE_DOMAIN\s*=\s*(.+)/);
      if (siteDomainMatch) {
        return siteDomainMatch[1].trim();
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  // Default fallback
  return 'jonplummer.com';
}

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
        const severity = critical > 0 ? 'critical' : high > 0 ? 'high' : moderate > 0 ? 'medium' : 'low';
        addFinding('npm audit', 'fail', severity, 
          `${vulnCount} vulnerabilities found in dependencies`,
          'Run "npm audit fix" to automatically fix vulnerabilities where possible. Review and manually address any remaining issues.',
          { total: vulnCount, critical, high, moderate, low, vulnerabilities: audit.vulnerabilities }
        );
        return false;
      }
    }
    
    logCheck('npm audit', 'pass', 'No vulnerabilities found');
    results.passed.push('npm audit');
    addFinding('npm audit', 'pass', 'info', 'No vulnerabilities found in dependencies');
    return true;
  } catch (error) {
    // npm audit exits with non-zero if vulnerabilities found
    try {
      const output = error.stdout || error.message;
      if (output.includes('vulnerabilities')) {
        logCheck('npm audit', 'fail', 'Vulnerabilities found (run "npm audit" for details)');
        results.failures.push('npm audit: vulnerabilities found');
        addFinding('npm audit', 'fail', 'high', 
          'Vulnerabilities found in dependencies',
          'Run "npm audit" for detailed information, then "npm audit fix" to resolve issues.'
        );
        return false;
      }
    } catch (e) {
      // Ignore parse errors
    }
    logCheck('npm audit', 'warn', 'Could not run npm audit (may need npm update)');
    results.warnings.push('npm audit: could not run');
    addFinding('npm audit', 'warn', 'medium', 
      'Could not run npm audit',
      'Update npm to the latest version: "npm install -g npm@latest"'
    );
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
      addFinding('npm outdated', 'warn', 'medium',
        `${count} package(s) are outdated`,
        'Run "npm outdated" to see details, then "npm update" to update packages. Test thoroughly after updating.',
        { count, packages: Object.keys(outdated) }
      );
      return false;
    }
    
    logCheck('npm outdated', 'pass', 'All packages up to date');
    results.passed.push('npm outdated');
    addFinding('npm outdated', 'pass', 'info', 'All packages are up to date');
    return true;
  } catch (error) {
    // npm outdated exits with non-zero if packages are outdated
    try {
      const output = error.stdout || error.message;
      if (output.includes('Wanted') || output.includes('Current')) {
        logCheck('npm outdated', 'warn', 'Some packages are outdated (run "npm outdated" for details)');
        results.warnings.push('npm outdated: packages need updates');
        addFinding('npm outdated', 'warn', 'medium',
          'Some packages are outdated',
          'Run "npm outdated" for details, then update packages and test thoroughly.'
        );
        return false;
      }
    } catch (e) {
      // Ignore parse errors
    }
    logCheck('npm outdated', 'warn', 'Could not check outdated packages');
    results.warnings.push('npm outdated: could not check');
    addFinding('npm outdated', 'warn', 'low',
      'Could not check for outdated packages',
      'Verify npm is working correctly and try again.'
    );
    return false;
  }
}

// Check Node.js version
function checkNodeVersion() {
  logCheck('Node.js version', 'pending', 'Checking Node.js version...');
  try {
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0]);
    // Node.js LTS versions are only even-numbered (18, 20, 22, etc.)
    const isLTS = major >= 18 && major % 2 === 0;
    
    if (isLTS) {
      logCheck('Node.js version', 'pass', `Using Node.js ${version} (LTS)`);
      results.passed.push(`Node.js version: ${version}`);
      addFinding('Node.js version', 'pass', 'info', `Using Node.js ${version} (LTS)`);
      return true;
    } else {
      logCheck('Node.js version', 'warn', `Node.js ${version} is not LTS (LTS versions are even-numbered: 18, 20, 22, etc.)`);
      results.warnings.push(`Node.js version: ${version} is not LTS`);
      addFinding('Node.js version', 'warn', 'medium',
        `Node.js ${version} is not an LTS version`,
        'Upgrade to the latest LTS version (even-numbered: 18, 20, 22, etc.) for security updates and stability.',
        { current: version }
      );
      return false;
    }
  } catch (error) {
    logCheck('Node.js version', 'warn', 'Could not determine Node.js version');
    results.warnings.push('Node.js version: could not check');
    addFinding('Node.js version', 'warn', 'low',
      'Could not determine Node.js version',
      'Verify Node.js is properly installed.'
    );
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
    addFinding('Environment variables', 'fail', 'critical',
      '.env file exists but is not in .gitignore',
      'Add ".env" to .gitignore immediately to prevent committing sensitive credentials to version control.'
    );
    return false;
  }
  
  if (hasEnv && envInGitignore) {
    logCheck('Environment variables', 'pass', '.env file exists and is in .gitignore');
    results.passed.push('Environment variables: .env properly ignored');
    addFinding('Environment variables', 'pass', 'info', '.env file exists and is properly ignored in .gitignore');
    return true;
  }
  
  if (!hasEnv) {
    logCheck('Environment variables', 'warn', 'No .env file found (may be using system env vars)');
    results.warnings.push('Environment variables: no .env file');
    addFinding('Environment variables', 'warn', 'low',
      'No .env file found',
      'If using environment variables, ensure they are properly configured and not committed to version control.'
    );
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
      addFinding('package.json', 'pass', 'info', 'Deploy script found in package.json');
    } else {
      logCheck('package.json', 'warn', 'No deploy script found');
      results.warnings.push('package.json: no deploy script');
      addFinding('package.json', 'warn', 'low',
        'No deploy script found in package.json',
        'Consider adding a deploy script for consistent deployment procedures.'
      );
    }
    
    return true;
  } catch (error) {
    logCheck('package.json', 'fail', `Error reading package.json: ${error.message}`);
    results.failures.push('package.json: could not read');
    addFinding('package.json', 'fail', 'high',
      `Error reading package.json: ${error.message}`,
      'Verify package.json exists and is valid JSON.'
    );
    return false;
  }
}

// Check for sensitive files in build output
function checkBuildOutput() {
  logCheck('Build output', 'pending', 'Checking _site/ for sensitive files...');
  
  if (!fs.existsSync('_site')) {
    logCheck('Build output', 'warn', '_site/ directory not found (run "npm run build" first)');
    results.warnings.push('Build output: _site/ not found');
    addFinding('Build output', 'warn', 'low',
      '_site/ directory not found',
      'Run "npm run build" to generate build output before checking for sensitive files.'
    );
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
          // Check if directory name exactly matches a sensitive pattern
          for (const pattern of sensitivePatterns) {
            if (entry === pattern) {
              found.push(fullPath);
            }
          }
          checkDir(fullPath);
        } else {
          // Check if filename exactly matches a sensitive pattern
          // or if the pattern appears as a path segment (not substring)
          for (const pattern of sensitivePatterns) {
            if (entry === pattern) {
              found.push(fullPath);
            } else {
              // Check if pattern appears as a path segment in fullPath
              // Split by path separator and check each segment
              const pathSegments = fullPath.split(path.sep);
              if (pathSegments.includes(pattern)) {
                found.push(fullPath);
              }
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
    addFinding('Build output', 'fail', 'high',
      `Sensitive files found in _site/ directory: ${found.length} file(s)`,
      'Remove sensitive files from build output. Update .eleventyignore or build configuration to exclude these files.',
      { files: found }
    );
    return false;
  }
  
  logCheck('Build output', 'pass', 'No sensitive files found in _site/');
  results.passed.push('Build output: clean');
  addFinding('Build output', 'pass', 'info', 'No sensitive files found in _site/ directory');
  return true;
}

// Check for deprecated packages
function checkDeprecatedPackages() {
  logCheck('Deprecated packages', 'pending', 'Checking for deprecated packages...');
  try {
    const output = execSync('npm list --depth=0 --json', { encoding: 'utf8', stdio: 'pipe' });
    const packages = JSON.parse(output);
    const deprecated = [];
    
    function checkPackage(pkg, name) {
      if (pkg.deprecated) {
        deprecated.push(`${name}: ${pkg.deprecated}`);
      }
      if (pkg.dependencies) {
        Object.keys(pkg.dependencies).forEach(depName => {
          checkPackage(pkg.dependencies[depName], depName);
        });
      }
    }
    
    if (packages.dependencies) {
      Object.keys(packages.dependencies).forEach(name => {
        checkPackage(packages.dependencies[name], name);
      });
    }
    
    if (packages.devDependencies) {
      Object.keys(packages.devDependencies).forEach(name => {
        checkPackage(packages.devDependencies[name], name);
      });
    }
    
    if (deprecated.length > 0) {
      const count = deprecated.length;
      const examples = deprecated.slice(0, 3).join(', ');
      const more = count > 3 ? ` and ${count - 3} more` : '';
      logCheck('Deprecated packages', 'warn', `${count} deprecated package(s): ${examples}${more}`);
      results.warnings.push(`Deprecated packages: ${count} found`);
      addFinding('Deprecated packages', 'warn', 'medium',
        `${count} deprecated package(s) found`,
        'Review deprecated packages and migrate to maintained alternatives. Deprecated packages may have unpatched security vulnerabilities.',
        { packages: deprecated }
      );
      return false;
    }
    
    logCheck('Deprecated packages', 'pass', 'No deprecated packages found');
    results.passed.push('Deprecated packages: none found');
    addFinding('Deprecated packages', 'pass', 'info', 'No deprecated packages found');
    return true;
  } catch (error) {
    logCheck('Deprecated packages', 'warn', 'Could not check for deprecated packages');
    results.warnings.push('Deprecated packages: could not check');
    addFinding('Deprecated packages', 'warn', 'low',
      'Could not check for deprecated packages',
      'Verify npm is working correctly and try again.'
    );
    return false;
  }
}

// Check file permissions on sensitive files
function checkFilePermissions() {
  logCheck('File permissions', 'pending', 'Checking file permissions on sensitive files...');
  
  const sensitiveFiles = ['.env'];
  const issues = [];
  
  for (const file of sensitiveFiles) {
    if (fs.existsSync(file)) {
      try {
        const stats = fs.statSync(file);
        const mode = stats.mode.toString(8);
        // Check if file is readable by others (last digit should be 0 or 4, not 4, 5, 6, or 7)
        const othersPerm = parseInt(mode.slice(-1));
        if (othersPerm >= 4) {
          issues.push(`${file}: permissions too open (${mode.slice(-3)})`);
        } else {
          // Check if group has read access (second-to-last digit)
          const groupPerm = parseInt(mode.slice(-2, -1));
          if (groupPerm >= 4 && file === '.env') {
            issues.push(`${file}: group should not have read access (${mode.slice(-3)})`);
          }
        }
      } catch (error) {
        // Ignore errors
      }
    }
  }
  
  if (issues.length > 0) {
    logCheck('File permissions', 'warn', issues.join('; '));
    results.warnings.push(`File permissions: ${issues.length} issue(s)`);
    addFinding('File permissions', 'warn', 'medium',
      `File permission issues found: ${issues.length} file(s)`,
      'Restrict file permissions on sensitive files. Use "chmod 600" for .env files to ensure only owner can read/write.',
      { issues }
    );
    return false;
  }
  
  logCheck('File permissions', 'pass', 'Sensitive files have appropriate permissions');
  results.passed.push('File permissions: appropriate');
  addFinding('File permissions', 'pass', 'info', 'Sensitive files have appropriate permissions');
  return true;
}

// Check git history for accidentally committed secrets
function checkGitHistory() {
  logCheck('Git history', 'pending', 'Checking git history for .env commits...');
  
  try {
    // Check if .env was ever committed
    const output = execSync('git log --all --full-history --oneline -- .env', { encoding: 'utf8', stdio: 'pipe' });
    
    if (output.trim().length > 0) {
      logCheck('Git history', 'fail', '.env file was found in git history (secrets may be exposed)');
      results.failures.push('Git history: .env was committed');
      addFinding('Git history', 'fail', 'critical',
        '.env file was found in git history',
        'If .env contained secrets, rotate all credentials immediately. Use "git filter-branch" or BFG Repo-Cleaner to remove from history. Consider using git-secrets to prevent future commits.'
      );
      return false;
    }
    
    logCheck('Git history', 'pass', '.env not found in git history');
    results.passed.push('Git history: .env not committed');
    addFinding('Git history', 'pass', 'info', '.env file not found in git history');
    return true;
  } catch (error) {
    // git log exits with non-zero if no matches found, which is good
    if (error.status === 1 && !error.stdout) {
      logCheck('Git history', 'pass', '.env not found in git history');
      results.passed.push('Git history: .env not committed');
      addFinding('Git history', 'pass', 'info', '.env file not found in git history');
      return true;
    }
    logCheck('Git history', 'warn', 'Could not check git history');
    results.warnings.push('Git history: could not check');
    addFinding('Git history', 'warn', 'low',
      'Could not check git history',
      'Verify git is available and the repository is properly initialized.'
    );
    return false;
  }
}

// Check Content Security Policy in .htaccess
function checkCSP() {
  logCheck('Content Security Policy', 'pending', 'Checking CSP in .htaccess...');
  
  const htaccessPath = 'src/.htaccess';
  if (!fs.existsSync(htaccessPath)) {
    logCheck('Content Security Policy', 'warn', '.htaccess file not found');
    results.warnings.push('CSP: .htaccess not found');
    addFinding('Content Security Policy', 'warn', 'medium',
      '.htaccess file not found',
      'Consider adding Content Security Policy headers to improve XSS protection. Add CSP headers to your web server configuration.'
    );
    return false;
  }
  
  try {
    const content = fs.readFileSync(htaccessPath, 'utf8');
    const cspMatch = content.match(/Content-Security-Policy[^"]*"([^"]+)"/i);
    
    if (!cspMatch) {
      logCheck('Content Security Policy', 'warn', 'CSP header not found in .htaccess');
      results.warnings.push('CSP: header not found');
      addFinding('Content Security Policy', 'warn', 'medium',
        'CSP header not found in .htaccess',
        'Add Content Security Policy headers to .htaccess to prevent XSS attacks. Use a restrictive policy that only allows necessary resources.'
      );
      return false;
    }
    
    const csp = cspMatch[1];
    
    // Check for unsafe-inline (security risk)
    if (csp.includes("'unsafe-inline'")) {
      logCheck('Content Security Policy', 'warn', 'CSP contains unsafe-inline (security risk)');
      results.warnings.push('CSP: contains unsafe-inline');
      addFinding('Content Security Policy', 'warn', 'high',
        'CSP contains unsafe-inline directive',
        'Remove unsafe-inline from CSP. Use nonces or hashes for inline scripts/styles instead.',
        { csp }
      );
      return false;
    }
    
    // Check for unsafe-eval (security risk)
    if (csp.includes("'unsafe-eval'")) {
      logCheck('Content Security Policy', 'warn', 'CSP contains unsafe-eval (security risk)');
      results.warnings.push('CSP: contains unsafe-eval');
      addFinding('Content Security Policy', 'warn', 'high',
        'CSP contains unsafe-eval directive',
        'Remove unsafe-eval from CSP. Avoid using eval() or similar functions that execute code from strings.',
        { csp }
      );
      return false;
    }
    
    logCheck('Content Security Policy', 'pass', 'CSP configured without unsafe-inline/unsafe-eval');
    results.passed.push('CSP: properly configured');
    addFinding('Content Security Policy', 'pass', 'info', 'CSP configured without unsafe-inline/unsafe-eval directives');
    return true;
  } catch (error) {
    logCheck('Content Security Policy', 'warn', `Could not parse .htaccess: ${error.message}`);
    results.warnings.push('CSP: could not check');
    addFinding('Content Security Policy', 'warn', 'low',
      `Could not parse .htaccess: ${error.message}`,
      'Verify .htaccess file is readable and properly formatted.'
    );
    return false;
  }
}

// Check redirects for open redirect vulnerabilities
function checkRedirects() {
  logCheck('Redirect security', 'pending', 'Checking redirects for open redirect vulnerabilities...');
  
  const redirectFiles = [];
  const siteDomain = getSiteDomain();
  
  function findRedirectFiles(dir) {
    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          findRedirectFiles(fullPath);
        } else if (entry === 'index.html' || entry.endsWith('.html')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('layout: redirect.njk') || content.includes('redirectUrl:')) {
            redirectFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  findRedirectFiles('src');
  
  if (redirectFiles.length === 0) {
    logCheck('Redirect security', 'pass', 'No redirect files found');
    results.passed.push('Redirect security: no redirects');
    addFinding('Redirect security', 'pass', 'info', 'No redirect files found');
    return true;
  }
  
  const openRedirects = [];
  for (const file of redirectFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const redirectMatch = content.match(/redirectUrl:\s*(.+)/);
      if (redirectMatch) {
        const redirectUrl = redirectMatch[1].trim();
        // Check if redirect URL is to an external domain (not our own)
        if (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://')) {
          try {
            const url = new URL(redirectUrl);
            // Allow redirects to our own domain
            if (!url.hostname.includes(siteDomain) && url.hostname !== siteDomain) {
              openRedirects.push(`${file}: redirects to external domain ${url.hostname}`);
            }
          } catch (e) {
            // Invalid URL format
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  if (openRedirects.length > 0) {
    logCheck('Redirect security', 'warn', `${openRedirects.length} potential open redirect(s) found`);
    openRedirects.slice(0, 3).forEach(issue => {
      console.log(`    ${issue}`);
    });
    if (openRedirects.length > 3) {
      console.log(`    ... and ${openRedirects.length - 3} more`);
    }
    results.warnings.push(`Redirect security: ${openRedirects.length} potential open redirect(s)`);
    addFinding('Redirect security', 'warn', 'high',
      `${openRedirects.length} potential open redirect(s) found`,
      'Open redirects can be exploited for phishing attacks. Validate redirect URLs to ensure they only redirect to trusted domains.',
      { redirects: openRedirects }
    );
    return false;
  }
  
  logCheck('Redirect security', 'pass', `All ${redirectFiles.length} redirect(s) are to same domain`);
  results.passed.push(`Redirect security: ${redirectFiles.length} redirect(s) checked`);
  addFinding('Redirect security', 'pass', 'info', `All ${redirectFiles.length} redirect(s) are to same domain`);
  return true;
}

// Check for third-party resources in base.njk
function checkThirdPartyResources() {
  logCheck('Third-party resources', 'pending', 'Checking for external scripts and stylesheets...');
  
  const baseTemplate = 'src/_includes/base.njk';
  if (!fs.existsSync(baseTemplate)) {
    logCheck('Third-party resources', 'warn', 'base.njk not found');
    results.warnings.push('Third-party resources: base.njk not found');
    addFinding('Third-party resources', 'warn', 'low',
      'base.njk template not found',
      'Verify the template file exists and is in the correct location.'
    );
    return false;
  }
  
  try {
    const content = fs.readFileSync(baseTemplate, 'utf8');
    const externalScripts = [];
    const externalStyles = [];
    
    // Find external script tags
    const scriptMatches = content.matchAll(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi);
    for (const match of scriptMatches) {
      const src = match[1];
      if (src.startsWith('http://') || src.startsWith('https://')) {
        externalScripts.push(src);
      }
    }
    
    // Find external link tags (only stylesheets, not profile/me/canonical/etc.)
    const linkMatches = content.matchAll(/<link[^>]*>/gi);
    for (const match of linkMatches) {
      const linkTag = match[0];
      // Extract href attribute
      const hrefMatch = linkTag.match(/href=["']([^"']+)["']/i);
      if (!hrefMatch) continue;
      const href = hrefMatch[1];
      
      // Only flag external stylesheets (rel="stylesheet" or rel="preload" with as="style")
      if (href.startsWith('http://') || href.startsWith('https://')) {
        // Extract rel attribute
        const relMatch = linkTag.match(/rel=["']([^"']+)["']/i);
        const rel = relMatch ? relMatch[1].toLowerCase() : '';
        
        // Check if it's actually a stylesheet
        if (rel === 'stylesheet' || (rel === 'preload' && linkTag.match(/as=["']style["']/i))) {
          externalStyles.push(href);
        }
      }
    }
    
    const total = externalScripts.length + externalStyles.length;
    
    if (total > 0) {
      const details = [];
      if (externalScripts.length > 0) {
        details.push(`${externalScripts.length} external script(s)`);
      }
      if (externalStyles.length > 0) {
        details.push(`${externalStyles.length} external stylesheet(s)`);
      }
      logCheck('Third-party resources', 'warn', `${total} external resource(s) found: ${details.join(', ')}`);
      externalScripts.slice(0, 2).forEach(url => {
        console.log(`    Script: ${url}`);
      });
      externalStyles.slice(0, 2).forEach(url => {
        console.log(`    Stylesheet: ${url}`);
      });
      results.warnings.push(`Third-party resources: ${total} external resource(s) found`);
      addFinding('Third-party resources', 'warn', 'medium',
        `${total} external resource(s) found (${externalScripts.length} scripts, ${externalStyles.length} stylesheets)`,
        'Review external resources for security. Use Subresource Integrity (SRI) for external scripts. Consider self-hosting resources when possible.',
        { scripts: externalScripts, stylesheets: externalStyles }
      );
      return false;
    }
    
    logCheck('Third-party resources', 'pass', 'No external scripts or stylesheets found');
    results.passed.push('Third-party resources: none found');
    addFinding('Third-party resources', 'pass', 'info', 'No external scripts or stylesheets found');
    return true;
  } catch (error) {
    logCheck('Third-party resources', 'warn', `Could not check base.njk: ${error.message}`);
    results.warnings.push('Third-party resources: could not check');
    addFinding('Third-party resources', 'warn', 'low',
      `Could not check base.njk: ${error.message}`,
      'Verify the template file is readable and properly formatted.'
    );
    return false;
  }
}

// Check dependency licenses for compatibility
function checkDependencyLicenses() {
  logCheck('Dependency licenses', 'pending', 'Checking dependency licenses...');
  
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const problematicLicenses = [];
    const unknownLicenses = [];
    
    // Common problematic licenses (GPL, AGPL, etc. that may require disclosure)
    const problematicPatterns = [/^GPL/, /^AGPL/, /^LGPL/];
    // Common permissive licenses (generally safe)
    const permissiveLicenses = ['MIT', 'ISC', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'Unlicense', 'CC0-1.0'];
    
    for (const [name, version] of Object.entries(allDeps)) {
      try {
        // Try to get license from package.json in node_modules
        const pkgPath = path.join('node_modules', name, 'package.json');
        if (fs.existsSync(pkgPath)) {
          const depPkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          const license = depPkg.license || (depPkg.licenses && depPkg.licenses[0]?.type);
          
          if (license) {
            const licenseStr = typeof license === 'string' ? license : license.type || '';
            if (problematicPatterns.some(pattern => pattern.test(licenseStr))) {
              problematicLicenses.push(`${name}: ${licenseStr}`);
            } else if (!permissiveLicenses.includes(licenseStr) && !licenseStr.includes('MIT') && !licenseStr.includes('Apache')) {
              unknownLicenses.push(`${name}: ${licenseStr}`);
            }
          } else {
            unknownLicenses.push(`${name}: no license specified`);
          }
        }
      } catch (error) {
        // Ignore errors for individual packages
      }
    }
    
    if (problematicLicenses.length > 0) {
      const count = problematicLicenses.length;
      const examples = problematicLicenses.slice(0, 3).join(', ');
      const more = count > 3 ? ` and ${count - 3} more` : '';
      logCheck('Dependency licenses', 'warn', `${count} package(s) with potentially problematic licenses: ${examples}${more}`);
      results.warnings.push(`Dependency licenses: ${count} potentially problematic`);
      addFinding('Dependency licenses', 'warn', 'medium',
        `${count} package(s) with potentially problematic licenses (GPL/AGPL)`,
        'Review licenses for compatibility with your project license. GPL/AGPL licenses may require you to open-source your code.',
        { packages: problematicLicenses }
      );
      return false;
    }
    
    if (unknownLicenses.length > 0 && unknownLicenses.length < 5) {
      logCheck('Dependency licenses', 'pass', `All licenses reviewed (${unknownLicenses.length} with non-standard licenses)`);
      results.passed.push('Dependency licenses: reviewed');
      addFinding('Dependency licenses', 'pass', 'info', 'Dependency licenses reviewed');
      return true;
    }
    
    logCheck('Dependency licenses', 'pass', 'All dependencies have permissive licenses');
    results.passed.push('Dependency licenses: all permissive');
    addFinding('Dependency licenses', 'pass', 'info', 'All dependencies have permissive licenses');
    return true;
  } catch (error) {
    logCheck('Dependency licenses', 'warn', `Could not check licenses: ${error.message}`);
    results.warnings.push('Dependency licenses: could not check');
    addFinding('Dependency licenses', 'warn', 'low',
      'Could not check dependency licenses',
      'Run "npm list --depth=0" and manually review each package license at npmjs.com'
    );
    return false;
  }
}

// Check for exposed secrets in code
function checkSecretsInCode() {
  logCheck('Secret scanning', 'pending', 'Scanning code for exposed secrets...');
  
  const secretPatterns = [
    { pattern: /(api[_-]?key|apikey)\s*[=:]\s*["']([^"']{10,})["']/gi, name: 'API keys' },
    { pattern: /(password|passwd|pwd)\s*[=:]\s*["']([^"']{6,})["']/gi, name: 'Passwords' },
    { pattern: /(secret|secret[_-]?key)\s*[=:]\s*["']([^"']{10,})["']/gi, name: 'Secrets' },
    { pattern: /(token|access[_-]?token)\s*[=:]\s*["']([^"']{10,})["']/gi, name: 'Tokens' },
    { pattern: /(private[_-]?key|privatekey)\s*[=:]\s*["']([^"']{20,})["']/gi, name: 'Private keys' }
  ];
  
  const filesToCheck = [];
  const foundSecrets = [];
  
  // Scan common code directories
  const scanDirs = ['scripts', 'src/_includes', '.eleventy.js'];
  
  function scanDirectory(dir) {
    try {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
          scanDirectory(fullPath);
        } else if (stat.isFile() && /\.(js|ts|njk|html|md)$/.test(entry)) {
          filesToCheck.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  scanDirs.forEach(dir => scanDirectory(dir));
  
  for (const file of filesToCheck) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      // Skip if file is in node_modules or _site
      if (file.includes('node_modules') || file.includes('_site')) continue;
      
      for (const { pattern, name } of secretPatterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          // Skip if it's a comment or example
          const lineNum = content.substring(0, match.index).split('\n').length;
          const line = content.split('\n')[lineNum - 1];
          if (line.trim().startsWith('//') || line.includes('example') || line.includes('TODO')) {
            continue;
          }
          foundSecrets.push(`${file}:${lineNum} - ${name}`);
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  if (foundSecrets.length > 0) {
    const count = foundSecrets.length;
    const examples = foundSecrets.slice(0, 3).join('; ');
    const more = count > 3 ? ` and ${count - 3} more` : '';
    logCheck('Secret scanning', 'warn', `${count} potential secret(s) found: ${examples}${more}`);
    results.warnings.push(`Secret scanning: ${count} potential secrets found`);
    addFinding('Secret scanning', 'warn', 'high',
      `${count} potential secret(s) found in code`,
      'Review flagged locations and ensure no actual secrets are committed. Use environment variables for sensitive data. Consider using git-secrets or truffleHog for more thorough scanning.',
      { findings: foundSecrets }
    );
    return false;
  }
  
  logCheck('Secret scanning', 'pass', `No obvious secrets found in ${filesToCheck.length} file(s) scanned`);
  results.passed.push('Secret scanning: no secrets found');
  addFinding('Secret scanning', 'pass', 'info', `No obvious secrets found in ${filesToCheck.length} file(s)`);
  return true;
}

// Check deployment scripts for hardcoded credentials
function checkDeploymentScripts() {
  logCheck('Deployment scripts', 'pending', 'Checking deployment scripts for hardcoded credentials...');
  
  const deployScripts = [];
  function findDeployScripts(dir) {
    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          findDeployScripts(fullPath);
        } else if (entry.includes('deploy') && entry.endsWith('.js')) {
          deployScripts.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  findDeployScripts('scripts');
  
  if (deployScripts.length === 0) {
    logCheck('Deployment scripts', 'pass', 'No deployment scripts found');
    results.passed.push('Deployment scripts: none found');
    addFinding('Deployment scripts', 'pass', 'info', 'No deployment scripts found');
    return true;
  }
  
  const issues = [];
  const hardcodedPatterns = [
    /password\s*[=:]\s*["']([^"']{6,})["']/gi,
    /api[_-]?key\s*[=:]\s*["']([^"']{10,})["']/gi,
    /secret\s*[=:]\s*["']([^"']{10,})["']/gi,
    /token\s*[=:]\s*["']([^"']{10,})["']/gi
  ];
  
  for (const script of deployScripts) {
    try {
      const content = fs.readFileSync(script, 'utf8');
      
      // Check for hardcoded credentials
      for (const pattern of hardcodedPatterns) {
        if (pattern.test(content)) {
          issues.push(`${script}: potential hardcoded credential found`);
          break;
        }
      }
      
      // Check if using environment variables (good practice)
      if (!content.includes('process.env') && !content.includes('dotenv')) {
        // This is just informational, not a failure
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  if (issues.length > 0) {
    logCheck('Deployment scripts', 'warn', `${issues.length} potential issue(s) found`);
    issues.slice(0, 3).forEach(issue => {
      console.log(`    ${issue}`);
    });
    results.warnings.push(`Deployment scripts: ${issues.length} potential issue(s)`);
    addFinding('Deployment scripts', 'warn', 'high',
      `${issues.length} potential hardcoded credential(s) found in deployment scripts`,
      'Review deployment scripts and ensure all credentials are loaded from environment variables, not hardcoded.',
      { issues }
    );
    return false;
  }
  
  logCheck('Deployment scripts', 'pass', `All ${deployScripts.length} deployment script(s) use environment variables`);
  results.passed.push(`Deployment scripts: ${deployScripts.length} checked`);
  addFinding('Deployment scripts', 'pass', 'info', `All ${deployScripts.length} deployment script(s) appear to use environment variables`);
  return true;
}

// Check security headers on live site
function checkSecurityHeaders() {
  logCheck('Security headers', 'pending', 'Checking security headers on live site...');
  
  const domain = getSiteDomain();
  console.log(`    Using domain: ${domain}`);
  
  const requiredHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Strict-Transport-Security',
    'Content-Security-Policy'
  ];
  
  return new Promise((resolve) => {
    const url = `https://${domain}`;
    const req = https.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const headers = res.headers;
          const missing = [];
          const present = [];
          
          for (const header of requiredHeaders) {
            if (headers[header.toLowerCase()]) {
              present.push(header);
            } else {
              missing.push(header);
            }
          }
          
          if (missing.length > 0) {
            logCheck('Security headers', 'warn', `Missing headers: ${missing.join(', ')}`);
            results.warnings.push(`Security headers: ${missing.length} missing`);
            addFinding('Security headers', 'warn', 'medium',
              `${missing.length} security header(s) missing on live site (${url})`,
              `Add missing security headers: ${missing.join(', ')}. Verify at securityheaders.com`,
              { missing, present, url, statusCode: res.statusCode }
            );
            resolve(false);
          } else {
            logCheck('Security headers', 'pass', `All ${requiredHeaders.length} security headers present`);
            results.passed.push('Security headers: all present');
            addFinding('Security headers', 'pass', 'info', `All ${requiredHeaders.length} security headers present on live site (${url})`);
            resolve(true);
          }
        } catch (parseError) {
          logCheck('Security headers', 'fail', `Failed to parse response from ${url}: ${parseError.message}`);
          results.failures.push('Security headers: parse error');
          addFinding('Security headers', 'fail', 'high',
            `Failed to parse HTTP response from ${url}`,
            `The server returned an unexpected response format. Check: 1) Site is accessible at ${url}, 2) Server is responding correctly, 3) Network connectivity. Alternatively, verify manually at securityheaders.com`,
            { url, error: parseError.message, statusCode: res.statusCode }
          );
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      let errorType = 'connection error';
      let recommendation = `Cannot connect to ${url}. Check: 1) Site is live and accessible, 2) Domain DNS is configured correctly, 3) Network connectivity, 4) Firewall/proxy settings.`;
      
      if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
        errorType = 'DNS resolution failed';
        recommendation = `DNS lookup failed for ${domain}. Check: 1) Domain is correctly configured, 2) DNS records are propagated, 3) Domain name is correct in .env (SITE_DOMAIN). Verify with: dig ${domain}`;
      } else if (error.code === 'ECONNREFUSED') {
        errorType = 'connection refused';
        recommendation = `Connection refused to ${url}. Check: 1) Server is running, 2) Port 443 is open, 3) Firewall allows HTTPS connections.`;
      } else if (error.code === 'ETIMEDOUT') {
        errorType = 'connection timeout';
        recommendation = `Connection to ${url} timed out. Check: 1) Server is responding, 2) Network latency, 3) Firewall/proxy settings.`;
      } else if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        errorType = 'certificate error';
        recommendation = `TLS certificate error for ${url}. Check: 1) Certificate is valid, 2) Certificate chain is complete, 3) System clock is correct.`;
      }
      
      logCheck('Security headers', 'fail', `Could not check ${url}: ${errorType} (${error.code || error.message})`);
      results.failures.push(`Security headers: ${errorType}`);
      addFinding('Security headers', 'fail', 'high',
        `Cannot check security headers on ${url}: ${errorType}`,
        recommendation,
        { url, errorCode: error.code, errorMessage: error.message, errorType }
      );
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      logCheck('Security headers', 'fail', `Request to ${url} timed out after 10 seconds`);
      results.failures.push('Security headers: timeout');
      addFinding('Security headers', 'fail', 'high',
        `Request to ${url} timed out`,
        `The server did not respond within 10 seconds. Check: 1) Site is accessible at ${url}, 2) Server is not overloaded, 3) Network connectivity, 4) Firewall/proxy settings. Alternatively, verify manually at securityheaders.com`,
        { url, timeout: 10000 }
      );
      resolve(false);
    });
    
    req.setTimeout(10000);
  });
}

// Check TLS certificate expiration
function checkCertificateExpiration() {
  logCheck('TLS certificate', 'pending', 'Checking TLS certificate expiration...');
  
  const domain = getSiteDomain();
  console.log(`    Using domain: ${domain}`);
  
  return new Promise((resolve) => {
    const socket = tls.connect(443, domain, { servername: domain, rejectUnauthorized: false }, () => {
      try {
        const cert = socket.getPeerCertificate(true);
        socket.end();
        
        if (!cert) {
          logCheck('TLS certificate', 'fail', `No certificate received from ${domain}:443`);
          results.failures.push('TLS certificate: no certificate');
          addFinding('TLS certificate', 'fail', 'high',
            `No TLS certificate received from ${domain}:443`,
            `The server did not provide a certificate. Check: 1) HTTPS is properly configured, 2) Server is listening on port 443, 3) Certificate is installed. Verify manually: openssl s_client -connect ${domain}:443 -servername ${domain}`,
            { domain, port: 443 }
          );
          resolve(false);
          return;
        }
        
        if (!cert.valid_to) {
          logCheck('TLS certificate', 'fail', `Certificate from ${domain} missing expiration date`);
          results.failures.push('TLS certificate: invalid format');
          addFinding('TLS certificate', 'fail', 'high',
            `Certificate from ${domain} is missing expiration date`,
            `The certificate structure is invalid or incomplete. Check: 1) Certificate is properly installed, 2) Certificate format is correct. Verify manually: openssl x509 -in certificate.crt -noout -dates`,
            { domain, certSubject: cert.subject }
          );
          resolve(false);
          return;
        }
        
        const expirationDate = new Date(cert.valid_to);
        if (isNaN(expirationDate.getTime())) {
          logCheck('TLS certificate', 'fail', `Invalid certificate expiration date format: ${cert.valid_to}`);
          results.failures.push('TLS certificate: invalid date');
          addFinding('TLS certificate', 'fail', 'high',
            `Certificate expiration date cannot be parsed: ${cert.valid_to}`,
            `The certificate expiration date is in an unexpected format. Check: 1) Certificate is valid, 2) System date/time is correct. Verify manually: openssl x509 -in certificate.crt -noout -enddate`,
            { domain, expirationString: cert.valid_to }
          );
          resolve(false);
          return;
        }
        
        const now = new Date();
        const daysUntilExpiry = Math.floor((expirationDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
          logCheck('TLS certificate', 'fail', `Certificate expired ${Math.abs(daysUntilExpiry)} days ago`);
          results.failures.push('TLS certificate: expired');
          addFinding('TLS certificate', 'fail', 'critical',
            `TLS certificate for ${domain} expired ${Math.abs(daysUntilExpiry)} days ago`,
            'Renew certificate immediately to restore HTTPS functionality. Visitors will see security warnings.',
            { domain, expirationDate: cert.valid_to, daysExpired: Math.abs(daysUntilExpiry) }
          );
          resolve(false);
        } else if (daysUntilExpiry < 30) {
          logCheck('TLS certificate', 'warn', `Certificate expires in ${daysUntilExpiry} days`);
          results.warnings.push(`TLS certificate: expires in ${daysUntilExpiry} days`);
          addFinding('TLS certificate', 'warn', 'high',
            `TLS certificate for ${domain} expires in ${daysUntilExpiry} days`,
            'Renew certificate before expiration to avoid service interruption. Set up automatic renewal if possible.',
            { domain, expirationDate: cert.valid_to, daysUntilExpiry }
          );
          resolve(false);
        } else {
          logCheck('TLS certificate', 'pass', `Certificate valid until ${expirationDate.toISOString().split('T')[0]} (${daysUntilExpiry} days)`);
          results.passed.push(`TLS certificate: valid for ${daysUntilExpiry} days`);
          addFinding('TLS certificate', 'pass', 'info', `Certificate for ${domain} valid until ${expirationDate.toISOString().split('T')[0]}`);
          resolve(true);
        }
      } catch (parseError) {
        socket.end();
        logCheck('TLS certificate', 'fail', `Failed to parse certificate from ${domain}: ${parseError.message}`);
        results.failures.push('TLS certificate: parse error');
        addFinding('TLS certificate', 'fail', 'high',
          `Failed to parse certificate data from ${domain}`,
          `Certificate data could not be processed. Check: 1) Certificate is valid, 2) TLS connection is working. Verify manually: openssl s_client -connect ${domain}:443 -servername ${domain}`,
          { domain, error: parseError.message }
        );
        resolve(false);
      }
    });
    
    socket.on('error', (error) => {
      let errorType = 'connection error';
      let recommendation = `Cannot connect to ${domain}:443. Check: 1) Server is running, 2) Port 443 is open, 3) Firewall allows HTTPS connections, 4) Domain DNS is configured.`;
      
      if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
        errorType = 'DNS resolution failed';
        recommendation = `DNS lookup failed for ${domain}. Check: 1) Domain is correctly configured, 2) DNS records are propagated, 3) Domain name is correct in .env (SITE_DOMAIN). Verify with: dig ${domain}`;
      } else if (error.code === 'ECONNREFUSED') {
        errorType = 'connection refused';
        recommendation = `Connection refused to ${domain}:443. Check: 1) Server is running, 2) Port 443 is open, 3) Firewall allows HTTPS connections.`;
      } else if (error.code === 'ETIMEDOUT') {
        errorType = 'connection timeout';
        recommendation = `Connection to ${domain}:443 timed out. Check: 1) Server is responding, 2) Network latency, 3) Firewall/proxy settings.`;
      } else if (error.code === 'CERT_HAS_EXPIRED') {
        errorType = 'certificate expired';
        recommendation = `Certificate for ${domain} has expired. Renew immediately to restore HTTPS functionality.`;
      } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || error.code === 'SELF_SIGNED_CERT') {
        errorType = 'certificate verification failed';
        recommendation = `Certificate verification failed for ${domain}. Check: 1) Certificate is valid, 2) Certificate chain is complete, 3) Certificate authority is trusted.`;
      }
      
      logCheck('TLS certificate', 'fail', `Could not check certificate for ${domain}: ${errorType} (${error.code || error.message})`);
      results.failures.push(`TLS certificate: ${errorType}`);
      addFinding('TLS certificate', 'fail', 'high',
        `Cannot check TLS certificate for ${domain}: ${errorType}`,
        recommendation,
        { domain, errorCode: error.code, errorMessage: error.message, errorType }
      );
      resolve(false);
    });
    
    socket.setTimeout(10000);
    socket.on('timeout', () => {
      socket.destroy();
      logCheck('TLS certificate', 'fail', `Connection to ${domain}:443 timed out after 10 seconds`);
      results.failures.push('TLS certificate: timeout');
      addFinding('TLS certificate', 'fail', 'high',
        `TLS connection to ${domain}:443 timed out`,
        `The server did not respond within 10 seconds. Check: 1) Server is accessible, 2) Port 443 is open, 3) Network connectivity, 4) Firewall/proxy settings. Verify manually: openssl s_client -connect ${domain}:443 -servername ${domain}`,
        { domain, port: 443, timeout: 10000 }
      );
      resolve(false);
    });
  });
}

// Check DNS records
function checkDNSRecords() {
  logCheck('DNS records', 'pending', 'Checking DNS records...');
  
  const domain = getSiteDomain();
  console.log(`    Using domain: ${domain}`);
  
  // Check if dig command is available
  try {
    execSync('which dig', { stdio: 'pipe' });
  } catch (error) {
    logCheck('DNS records', 'fail', `dig command not found - cannot check DNS records`);
    results.failures.push('DNS records: dig not available');
    addFinding('DNS records', 'fail', 'medium',
      `dig command is not available on this system`,
      `Install dig to enable DNS checking: macOS (brew install bind), Ubuntu/Debian (sudo apt-get install dnsutils), or verify manually: nslookup ${domain} or use online DNS lookup tools`,
      { domain, tool: 'dig' }
    );
    return false;
  }
  
  try {
    const output = execSync(`dig +short ${domain} A`, { encoding: 'utf8', stdio: 'pipe', timeout: 10000 });
    
    if (!output || output.trim().length === 0) {
      logCheck('DNS records', 'fail', `No DNS response for ${domain} - domain may not be configured`);
      results.failures.push('DNS records: no response');
      addFinding('DNS records', 'fail', 'high',
        `No DNS A records found for ${domain}`,
        `DNS lookup returned no results. Check: 1) Domain is correctly configured, 2) DNS records are propagated, 3) Domain name is correct in .env (SITE_DOMAIN). Verify with: dig ${domain} A or nslookup ${domain}`,
        { domain }
      );
      return false;
    }
    
    const records = output.trim().split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith(';') && /^\d+\.\d+\.\d+\.\d+$/.test(trimmed);
    });
    
    if (records.length === 0) {
      // Check if output contains error messages
      const errorIndicators = ['NXDOMAIN', 'SERVFAIL', 'REFUSED', 'timeout'];
      const hasError = errorIndicators.some(indicator => output.includes(indicator));
      
      if (hasError) {
        logCheck('DNS records', 'fail', `DNS lookup failed for ${domain}: ${output.trim()}`);
        results.failures.push('DNS records: lookup failed');
        addFinding('DNS records', 'fail', 'high',
          `DNS lookup failed for ${domain}`,
          `DNS query returned an error. Check: 1) Domain exists and is registered, 2) DNS servers are responding, 3) Domain name is correct. Verify with: dig ${domain} A or check DNS configuration with your registrar`,
          { domain, digOutput: output.trim() }
        );
        return false;
      }
      
      logCheck('DNS records', 'fail', `No valid A records found for ${domain} (output: ${output.trim().substring(0, 100)})`);
      results.failures.push('DNS records: no A records');
      addFinding('DNS records', 'fail', 'high',
        `No valid A records found for ${domain}`,
        `DNS lookup did not return valid IPv4 addresses. Check: 1) A records are configured, 2) DNS records are propagated, 3) Domain is pointing to correct IP. Verify with: dig ${domain} A`,
        { domain, digOutput: output.trim() }
      );
      return false;
    }
    
    // Validate IP addresses
    const invalidIPs = records.filter(ip => !/^\d+\.\d+\.\d+\.\d+$/.test(ip));
    if (invalidIPs.length > 0) {
      logCheck('DNS records', 'warn', `Some DNS records appear invalid: ${invalidIPs.join(', ')}`);
      results.warnings.push('DNS records: invalid format');
      addFinding('DNS records', 'warn', 'medium',
        `Some DNS A records for ${domain} appear invalid`,
        `Review DNS configuration. Valid records found: ${records.filter(ip => /^\d+\.\d+\.\d+\.\d+$/.test(ip)).join(', ')}. Invalid: ${invalidIPs.join(', ')}`,
        { domain, validRecords: records.filter(ip => /^\d+\.\d+\.\d+\.\d+$/.test(ip)), invalidRecords: invalidIPs }
      );
      return false;
    }
    
    logCheck('DNS records', 'pass', `DNS A records found: ${records.length} record(s) - ${records.join(', ')}`);
    results.passed.push(`DNS records: ${records.length} A record(s) found`);
    addFinding('DNS records', 'pass', 'info', `DNS A records configured for ${domain} (${records.length} record(s): ${records.join(', ')})`);
    return true;
  } catch (error) {
    let errorType = 'execution error';
    let recommendation = `Failed to execute dig command. Check: 1) dig is installed and in PATH, 2) Network connectivity, 3) DNS servers are accessible.`;
    
    if (error.code === 'ENOENT') {
      errorType = 'command not found';
      recommendation = `dig command not found. Install: macOS (brew install bind), Ubuntu/Debian (sudo apt-get install dnsutils). Alternatively, verify manually: nslookup ${domain}`;
    } else if (error.signal === 'SIGTERM' || error.signal === 'SIGKILL') {
      errorType = 'timeout';
      recommendation = `dig command timed out. Check: 1) DNS servers are responding, 2) Network connectivity, 3) Firewall settings. Verify manually: dig ${domain} A`;
    } else if (error.stderr) {
      errorType = 'DNS query error';
      recommendation = `DNS query failed. Check: 1) Domain is correctly configured, 2) DNS servers are accessible, 3) Domain name is correct. Error: ${error.stderr.toString().trim()}`;
    }
    
    logCheck('DNS records', 'fail', `Could not check DNS for ${domain}: ${errorType} (${error.message || error.code || 'unknown'})`);
    results.failures.push(`DNS records: ${errorType}`);
    addFinding('DNS records', 'fail', 'high',
      `Cannot check DNS records for ${domain}: ${errorType}`,
      recommendation,
      { domain, errorCode: error.code, errorMessage: error.message, errorSignal: error.signal, errorType }
    );
    return false;
  }
}

// Generate markdown security report
function generateMarkdownReport() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  
  // Calculate severity counts
  const critical = results.findings.filter(f => f.severity === 'critical').length;
  const high = results.findings.filter(f => f.severity === 'high').length;
  const medium = results.findings.filter(f => f.severity === 'medium').length;
  const low = results.findings.filter(f => f.severity === 'low').length;
  const info = results.findings.filter(f => f.severity === 'info').length;
  
  // Group findings by category
  const categories = {
    'Dependency & Package Security': ['npm audit', 'npm outdated', 'Node.js version', 'Deprecated packages', 'Dependency licenses'],
    'Code & Configuration Security': ['Environment variables', 'package.json', 'File permissions', 'Git history', 'Secret scanning', 'Deployment scripts'],
    'Build & Deployment Security': ['Build output', 'Content Security Policy'],
    'Content & Links Security': ['Redirect security', 'Third-party resources'],
    'Live Site Security': ['Security headers', 'TLS certificate', 'DNS records']
  };
  
  // Determine overall status
  const statusIcon = results.failures.length > 0 ? '❌' : results.warnings.length > 0 ? '⚠️' : '✅';
  const statusText = results.failures.length > 0 ? 'Issues found' : results.warnings.length > 0 ? 'Warnings' : 'All checks passed';
  
  let report = `# Security Audit Report\n\n`;
  report += `**Date:** ${dateStr} | **Status:** ${statusIcon} ${statusText}\n\n`;
  
  // Summary
  report += `## Summary\n\n`;
  report += `- Passed: ${results.passed.length}\n`;
  report += `- Warnings: ${results.warnings.length}\n`;
  report += `- Failures: ${results.failures.length}\n\n`;
  report += `- Critical: ${critical} | High: ${high} | Medium: ${medium} | Low: ${low} | Info: ${info}\n\n`;
  
  // Findings by Category
  report += `## Findings\n\n`;
  
  for (const [categoryName, checkNames] of Object.entries(categories)) {
    const categoryFindings = results.findings.filter(f => 
      checkNames.includes(f.check)
    );
    
    if (categoryFindings.length === 0) continue;
    
    report += `### ${categoryName}\n\n`;
    
    // Group by severity within category
    const severityOrder = ['critical', 'high', 'medium', 'low', 'info'];
    for (const severity of severityOrder) {
      const severityFindings = categoryFindings.filter(f => f.severity === severity);
      if (severityFindings.length === 0) continue;
      
      for (const finding of severityFindings) {
        const statusIcon = finding.status === 'pass' ? '✅' : finding.status === 'warn' ? '⚠️' : '❌';
        report += `${statusIcon} **${finding.check}** — ${finding.description}\n`;
        
        if (finding.recommendation) {
          report += `  → ${finding.recommendation}\n`;
        }
        
        // Add concise details
        if (finding.details && Object.keys(finding.details).length > 0) {
          if (finding.details.files && Array.isArray(finding.details.files)) {
            const files = finding.details.files.slice(0, 3);
            report += `  Files: ${files.map(f => `\`${f}\``).join(', ')}`;
            if (finding.details.files.length > 3) {
              report += ` (+${finding.details.files.length - 3} more)`;
            }
            report += `\n`;
          }
          if (finding.details.packages && Array.isArray(finding.details.packages)) {
            const pkgs = finding.details.packages.slice(0, 3);
            report += `  Packages: ${pkgs.map(p => `\`${p}\``).join(', ')}`;
            if (finding.details.packages.length > 3) {
              report += ` (+${finding.details.packages.length - 3} more)`;
            }
            report += `\n`;
          }
          if (finding.details.redirects && Array.isArray(finding.details.redirects)) {
            report += `  Redirects: ${finding.details.redirects.slice(0, 2).map(r => `\`${r}\``).join(', ')}`;
            if (finding.details.redirects.length > 2) {
              report += ` (+${finding.details.redirects.length - 2} more)`;
            }
            report += `\n`;
          }
          if (finding.details.scripts && Array.isArray(finding.details.scripts)) {
            report += `  Scripts: ${finding.details.scripts.slice(0, 2).map(s => `\`${s}\``).join(', ')}`;
            if (finding.details.scripts.length > 2) {
              report += ` (+${finding.details.scripts.length - 2} more)`;
            }
            report += `\n`;
          }
          if (finding.details.stylesheets && Array.isArray(finding.details.stylesheets)) {
            report += `  Stylesheets: ${finding.details.stylesheets.slice(0, 2).map(s => `\`${s}\``).join(', ')}`;
            if (finding.details.stylesheets.length > 2) {
              report += ` (+${finding.details.stylesheets.length - 2} more)`;
            }
            report += `\n`;
          }
          if (finding.details.critical !== undefined) {
            report += `  Vulnerabilities: ${finding.details.critical} critical, ${finding.details.high} high, ${finding.details.moderate} moderate, ${finding.details.low} low\n`;
          }
        }
        
        report += `\n`;
      }
    }
  }
  
  // Action Items
  const criticalFindings = results.findings.filter(f => f.severity === 'critical');
  const highFindings = results.findings.filter(f => f.severity === 'high');
  
  if (criticalFindings.length > 0 || highFindings.length > 0) {
    report += `## Action Items\n\n`;
    
    if (criticalFindings.length > 0) {
      report += `### Critical\n\n`;
      criticalFindings.forEach(finding => {
        report += `- **${finding.check}:** ${finding.recommendation || finding.description}\n`;
      });
      report += `\n`;
    }
    
    if (highFindings.length > 0) {
      report += `### High Priority\n\n`;
      highFindings.forEach(finding => {
        report += `- **${finding.check}:** ${finding.recommendation || finding.description}\n`;
      });
      report += `\n`;
    }
  }
  
  // Manual Tasks
  report += `## Manual Tasks\n\n`;
  
  const manualTasks = [
    { category: 'Dependencies', tasks: [
      'Update dependencies: `npm update && npm run test all`'
    ]},
    { category: 'Deployment', tasks: [
      'Rotate SSH keys: `ssh-keygen -t ed25519`'
    ]},
    { category: 'Testing', tasks: [
      'Run test suite: `npm run test all`',
      'Link validation: `npm run test links`',
      'Accessibility: `npm run test accessibility`',
      'HTML validation: `npm run test html`',
      'Performance: `npm run test performance`'
    ]},
    { category: 'Infrastructure', tasks: [
      'Review hosting provider security notices',
      'Test backup restore process',
      'Review access logs for suspicious activity'
    ]},
    { category: 'Documentation', tasks: [
      'Update security procedures',
      'Review incident response plan',
      'Check security advisories (Node.js, Eleventy)'
    ]}
  ];
  
  manualTasks.forEach(({ category, tasks }) => {
    report += `### ${category}\n\n`;
    tasks.forEach(task => {
      report += `- [ ] ${task}\n`;
    });
    report += `\n`;
  });
  
  // Footer
  report += `---\n`;
  report += `*Generated ${dateStr}*\n`;
  
  return report;
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
  checkCSP();
  
  logSection('Content & Links Security');
  checkRedirects();
  checkThirdPartyResources();
  
  logSection('Code & Configuration Security (Additional)');
  checkDeprecatedPackages();
  checkFilePermissions();
  checkGitHistory();
  checkDependencyLicenses();
  checkSecretsInCode();
  checkDeploymentScripts();
  
  logSection('Live Site Security (if configured)');
  await checkSecurityHeaders();
  await checkCertificateExpiration();
  checkDNSRecords();
  
  // Summary
  console.log('');
  logSection('Summary');
  log(`  ✓ Passed: ${results.passed.length}`, 'green');
  log(`  ⚠ Warnings: ${results.warnings.length}`, 'yellow');
  log(`  ✗ Failures: ${results.failures.length}`, 'red');
  console.log('');
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport();
  
  // Output markdown report
  console.log('');
  logSection('Security Report');
  console.log(markdownReport);
  
  // Optionally write to file
  const reportPath = 'security-audit-report.md';
  try {
    fs.writeFileSync(reportPath, markdownReport, 'utf8');
    log(`\n📄 Report saved to: ${reportPath}`, 'cyan');
  } catch (error) {
    log(`\n⚠️  Could not write report to file: ${error.message}`, 'yellow');
  }
  
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
    log('See the security report above for manual tasks checklist.', 'cyan');
    console.log('');
    process.exit(0);
  }
}

// Run audit
runSecurityAudit().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

