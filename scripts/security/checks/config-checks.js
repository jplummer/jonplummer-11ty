#!/usr/bin/env node

/**
 * Code & Configuration Security Checks
 * 
 * Checks for environment variables, package.json, file permissions, and git history
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

/**
 * Check environment variables
 * @param {Object} results - Results object
 * @param {Function} addFinding - Function to add findings
 * @returns {Promise<boolean>} True if passed
 */
async function checkEnvironmentVariables(results, addFinding) {
  const { runCheck } = require('../../utils/check-runner');
  return runCheck('Environment variables', async () => {
    const hasEnv = fs.existsSync('.env');
    const hasGitignore = fs.existsSync('.gitignore');
    let gitignoreContent = '';
    
    if (hasGitignore) {
      gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
    }
    
    const envInGitignore = gitignoreContent.includes('.env');
    
    if (hasEnv && !envInGitignore) {
      return {
        passed: false,
        details: '.env file exists but not in .gitignore',
        message: 'Environment variables: .env not in .gitignore',
        finding: {
          severity: 'critical',
          description: '.env file exists but is not in .gitignore',
          recommendation: 'Add ".env" to .gitignore immediately to prevent committing sensitive credentials to version control.'
        }
      };
    }
    
    if (hasEnv && envInGitignore) {
      return {
        passed: true,
        details: '.env file exists and is in .gitignore',
        message: 'Environment variables: .env properly ignored',
        finding: {
          severity: 'info',
          description: '.env file exists and is properly ignored in .gitignore'
        }
      };
    }
    
    if (!hasEnv) {
      return {
        passed: false,
        warning: true,
        details: 'No .env file found (may be using system env vars)',
        message: 'Environment variables: no .env file',
        finding: {
          severity: 'low',
          description: 'No .env file found',
          recommendation: 'If using environment variables, ensure they are properly configured and not committed to version control.'
        }
      };
    }
    
    return { passed: true };
  }, results, addFinding);
}

/**
 * Check package.json
 * @param {Object} results - Results object
 * @param {Function} addFinding - Function to add findings
 * @returns {Promise<boolean>} True if passed
 */
async function checkPackageJson(results, addFinding) {
  const { runCheck } = require('../../utils/check-runner');
  return runCheck('package.json', async () => {
    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const scripts = pkg.scripts || {};
      const hasDeployScript = 'deploy' in scripts;
      
      if (hasDeployScript) {
        return {
          passed: true,
          details: 'Deploy script found',
          message: 'package.json: deploy script present',
          finding: {
            severity: 'info',
            description: 'Deploy script found in package.json'
          }
        };
      } else {
        return {
          passed: false,
          warning: true,
          details: 'No deploy script found',
          message: 'package.json: no deploy script',
          finding: {
            severity: 'low',
            description: 'No deploy script found in package.json',
            recommendation: 'Consider adding a deploy script for consistent deployment procedures.'
          }
        };
      }
    } catch (error) {
      return {
        passed: false,
        details: `Error reading package.json: ${error.message}`,
        message: 'package.json: could not read',
        finding: {
          severity: 'high',
          description: `Error reading package.json: ${error.message}`,
          recommendation: 'Verify package.json exists and is valid JSON.'
        }
      };
    }
  }, results, addFinding);
}

/**
 * Check file permissions
 * @param {Object} results - Results object
 * @param {Function} addFinding - Function to add findings
 * @returns {Promise<boolean>} True if passed
 */
async function checkFilePermissions(results, addFinding) {
  const { runCheck } = require('../../utils/check-runner');
  return runCheck('File permissions', async () => {
    const sensitiveFiles = ['.env'];
    const issues = [];
    
    for (const file of sensitiveFiles) {
      if (fs.existsSync(file)) {
        try {
          const stats = fs.statSync(file);
          const mode = stats.mode.toString(8);
          const othersPerm = parseInt(mode.slice(-1));
          if (othersPerm >= 4) {
            issues.push(`${file}: permissions too open (${mode.slice(-3)})`);
          } else {
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
      return {
        passed: false,
        warning: true,
        details: issues.join('; '),
        message: `File permissions: ${issues.length} issue(s)`,
        finding: {
          severity: 'medium',
          description: `File permission issues found: ${issues.length} file(s)`,
          recommendation: 'Restrict file permissions on sensitive files. Use "chmod 600" for .env files to ensure only owner can read/write.',
          details: { issues }
        }
      };
    }
    
    return {
      passed: true,
      details: 'Sensitive files have appropriate permissions',
      message: 'File permissions: appropriate',
      finding: {
        severity: 'info',
        description: 'Sensitive files have appropriate permissions'
      }
    };
  }, results, addFinding);
}

/**
 * Check git history
 * @param {Object} results - Results object
 * @param {Function} addFinding - Function to add findings
 * @returns {Promise<boolean>} True if passed
 */
async function checkGitHistory(results, addFinding) {
  const { runCheck } = require('../../utils/check-runner');
  return runCheck('Git history', async () => {
    try {
      const output = execSync('git log --all --full-history --oneline -- .env', { encoding: 'utf8', stdio: 'pipe' });
      
      if (output.trim().length > 0) {
        return {
          passed: false,
          details: '.env file was found in git history (secrets may be exposed)',
          message: 'Git history: .env was committed',
          finding: {
            severity: 'critical',
            description: '.env file was found in git history',
            recommendation: 'If .env contained secrets, rotate all credentials immediately. Use "git filter-branch" or BFG Repo-Cleaner to remove from history. Consider using git-secrets to prevent future commits.'
          }
        };
      }
      
      return {
        passed: true,
        details: '.env not found in git history',
        message: 'Git history: .env not committed',
        finding: {
          severity: 'info',
          description: '.env file not found in git history'
        }
      };
    } catch (error) {
      // git log exits with non-zero if no matches found, which is good
      if (error.status === 1 && !error.stdout) {
        return {
          passed: true,
          details: '.env not found in git history',
          message: 'Git history: .env not committed',
          finding: {
            severity: 'info',
            description: '.env file not found in git history'
          }
        };
      }
      return {
        passed: false,
        warning: true,
        details: 'Could not check git history',
        message: 'Git history: could not check',
        finding: {
          severity: 'low',
          description: 'Could not check git history',
          recommendation: 'Verify git is available and the repository is properly initialized.'
        }
      };
    }
  }, results, addFinding);
}

module.exports = {
  checkEnvironmentVariables,
  checkPackageJson,
  checkFilePermissions,
  checkGitHistory
};

