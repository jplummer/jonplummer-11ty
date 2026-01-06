#!/usr/bin/env node

/**
 * Dependency & Package Security Checks
 * 
 * Checks for pnpm vulnerabilities, outdated packages, deprecated packages, and Node.js version
 */

const { execSync } = require('child_process');

/**
 * Check pnpm audit for vulnerabilities
 * @param {Object} results - Results object
 * @param {Function} addFinding - Function to add findings
 * @returns {Promise<boolean>} True if passed
 */
async function checkNpmAudit(results, addFinding) {
  const { runCheck } = require('../../utils/check-runner');
  return runCheck('pnpm audit', async () => {
    try {
      const output = execSync('pnpm audit --json', { encoding: 'utf8', stdio: 'pipe' });
      const audit = JSON.parse(output);
      
      if (audit.vulnerabilities) {
        const vulnCount = Object.keys(audit.vulnerabilities).length;
        if (vulnCount > 0) {
          const critical = Object.values(audit.vulnerabilities).filter(v => v.severity === 'critical').length;
          const high = Object.values(audit.vulnerabilities).filter(v => v.severity === 'high').length;
          const moderate = Object.values(audit.vulnerabilities).filter(v => v.severity === 'moderate').length;
          const low = Object.values(audit.vulnerabilities).filter(v => v.severity === 'low').length;
          
          const severity = critical > 0 ? 'critical' : high > 0 ? 'high' : moderate > 0 ? 'medium' : 'low';
          return {
            passed: false,
            details: `${vulnCount} vulnerabilities found (${critical} critical, ${high} high, ${moderate} moderate, ${low} low)`,
            message: 'pnpm audit: vulnerabilities found',
            finding: {
              severity,
              description: `${vulnCount} vulnerabilities found in dependencies`,
              recommendation: 'Run "pnpm audit --fix" to automatically fix vulnerabilities where possible. Review and manually address any remaining issues.',
              details: { total: vulnCount, critical, high, moderate, low, vulnerabilities: audit.vulnerabilities }
            }
          };
        }
      }
      
      return {
        passed: true,
        details: 'No vulnerabilities found',
        message: 'pnpm audit',
        finding: {
          severity: 'info',
          description: 'No vulnerabilities found in dependencies'
        }
      };
    } catch (error) {
      // pnpm audit exits with non-zero if vulnerabilities found
      try {
        const output = error.stdout || error.message;
        if (output.includes('vulnerabilities')) {
          return {
            passed: false,
            details: 'Vulnerabilities found (run "pnpm audit" for details)',
            message: 'pnpm audit: vulnerabilities found',
            finding: {
              severity: 'high',
              description: 'Vulnerabilities found in dependencies',
              recommendation: 'Run "pnpm audit" for detailed information, then "pnpm audit --fix" to resolve issues.'
            }
          };
        }
      } catch (e) {
        // Ignore parse errors
      }
      return {
        passed: false,
        warning: true,
        details: 'Could not run pnpm audit (may need pnpm update)',
        message: 'pnpm audit: could not run',
        finding: {
          severity: 'medium',
          description: 'Could not run pnpm audit',
          recommendation: 'Update pnpm to the latest version: "brew upgrade pnpm" or "npm install -g pnpm@latest"'
        }
      };
    }
  }, results, addFinding);
}

/**
 * Check for outdated packages
 * @param {Object} results - Results object
 * @param {Function} addFinding - Function to add findings
 * @returns {Promise<boolean>} True if passed
 */
async function checkOutdatedPackages(results, addFinding) {
  const { runCheck } = require('../../utils/check-runner');
  return runCheck('pnpm outdated', async () => {
    try {
      const output = execSync('pnpm outdated --json', { encoding: 'utf8', stdio: 'pipe' });
      const outdated = JSON.parse(output);
      
      if (Object.keys(outdated).length > 0) {
        const count = Object.keys(outdated).length;
        const packages = Object.keys(outdated).slice(0, 5).join(', ');
        const more = count > 5 ? ` and ${count - 5} more` : '';
        return {
          passed: false,
          warning: true,
          details: `${count} package(s) outdated: ${packages}${more}`,
          message: `pnpm outdated: ${count} packages need updates`,
          finding: {
            severity: 'medium',
            description: `${count} package(s) are outdated`,
            recommendation: 'Run "pnpm outdated" to see details, then "pnpm update" to update packages. Test thoroughly after updating.',
            details: { count, packages: Object.keys(outdated) }
          }
        };
      }
      
      return {
        passed: true,
        details: 'All packages up to date',
        message: 'pnpm outdated',
        finding: {
          severity: 'info',
          description: 'All packages are up to date'
        }
      };
    } catch (error) {
      // pnpm outdated exits with non-zero if packages are outdated OR if there's an error
      let output = '';
      if (error.stdout) {
        output = error.stdout.toString();
      } else if (error.stderr) {
        output = error.stderr.toString();
      } else if (error.message) {
        output = error.message;
      }
      
      // Try to parse as JSON (pnpm outdated --json outputs JSON even on error)
      try {
        const outdated = JSON.parse(output);
        if (Object.keys(outdated).length > 0) {
          const count = Object.keys(outdated).length;
          const packages = Object.keys(outdated).slice(0, 5).join(', ');
          const more = count > 5 ? ` and ${count - 5} more` : '';
          return {
            passed: false,
            warning: true,
            details: `${count} package(s) outdated: ${packages}${more}`,
            message: `npm outdated: ${count} packages need updates`,
            finding: {
              severity: 'medium',
              description: `${count} package(s) are outdated`,
              recommendation: 'Run "npm outdated" to see details, then "npm update" to update packages. Test thoroughly after updating.',
              details: { count, packages: Object.keys(outdated) }
            }
          };
        } else {
          // Empty JSON object means no outdated packages (success case)
          return {
            passed: true,
            details: 'All packages up to date',
            message: 'pnpm outdated',
            finding: {
              severity: 'info',
              description: 'All packages are up to date'
            }
          };
        }
      } catch (parseError) {
        // Not JSON, check for text output indicating outdated packages
        if (output.includes('Wanted') || output.includes('Current') || output.includes('Package')) {
          return {
            passed: false,
            warning: true,
            details: 'Some packages are outdated (run "pnpm outdated" for details)',
            message: 'pnpm outdated: packages need updates',
            finding: {
              severity: 'medium',
              description: 'Some packages are outdated',
              recommendation: 'Run "pnpm outdated" for details, then update packages and test thoroughly.'
            }
          };
        }
      }
      
      // If we get here, it's a real error (not just outdated packages)
      const errorMsg = error.code === 'ENOENT' 
        ? 'npm command not found' 
        : error.code 
          ? `Error code: ${error.code}` 
          : error.message || 'Unknown error';
      
      return {
        passed: false,
        warning: true,
        details: `Could not check outdated packages: ${errorMsg}`,
        message: 'pnpm outdated: could not check',
        finding: {
          severity: 'low',
          description: `Could not check for outdated packages: ${errorMsg}`,
          recommendation: error.code === 'ENOENT' 
            ? 'Verify pnpm is installed and in your PATH. Run "which pnpm" to check.'
            : 'Verify pnpm is working correctly and try running "pnpm outdated" manually.'
        }
      };
    }
  }, results, addFinding);
}

/**
 * Check Node.js version
 * @param {Object} results - Results object
 * @param {Function} addFinding - Function to add findings
 * @returns {Promise<boolean>} True if passed
 */
async function checkNodeVersion(results, addFinding) {
  const { runCheck } = require('../../utils/check-runner');
  return runCheck('Node.js version', async () => {
    try {
      const version = process.version;
      const major = parseInt(version.slice(1).split('.')[0]);
      // Node.js LTS versions are only even-numbered (18, 20, 22, etc.)
      const isLTS = major >= 18 && major % 2 === 0;
      
      if (isLTS) {
        return {
          passed: true,
          details: `Using Node.js ${version} (LTS)`,
          message: `Node.js version: ${version}`,
          finding: {
            severity: 'info',
            description: `Using Node.js ${version} (LTS)`
          }
        };
      } else {
        return {
          passed: false,
          warning: true,
          details: `Node.js ${version} is not LTS (LTS versions are even-numbered: 18, 20, 22, etc.)`,
          message: `Node.js version: ${version} is not LTS`,
          finding: {
            severity: 'medium',
            description: `Node.js ${version} is not an LTS version`,
            recommendation: 'Upgrade to the latest LTS version (even-numbered: 18, 20, 22, etc.) for security updates and stability.',
            details: { current: version }
          }
        };
      }
    } catch (error) {
      return {
        passed: false,
        warning: true,
        details: 'Could not determine Node.js version',
        message: 'Node.js version: could not check',
        finding: {
          severity: 'low',
          description: 'Could not determine Node.js version',
          recommendation: 'Verify Node.js is properly installed.'
        }
      };
    }
  }, results, addFinding);
}

/**
 * Check for deprecated packages
 * @param {Object} results - Results object
 * @param {Function} addFinding - Function to add findings
 * @returns {Promise<boolean>} True if passed
 */
async function checkDeprecatedPackages(results, addFinding) {
  const { runCheck } = require('../../utils/check-runner');
  return runCheck('Deprecated packages', async () => {
    try {
      const output = execSync('pnpm list --depth=0 --json', { encoding: 'utf8', stdio: 'pipe' });
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
        return {
          passed: false,
          warning: true,
          details: `${count} deprecated package(s): ${examples}${more}`,
          message: `Deprecated packages: ${count} found`,
          finding: {
            severity: 'medium',
            description: `${count} deprecated package(s) found`,
            recommendation: 'Review deprecated packages and migrate to maintained alternatives. Deprecated packages may have unpatched security vulnerabilities.',
            details: { packages: deprecated }
          }
        };
      }
      
      return {
        passed: true,
        details: 'No deprecated packages found',
        message: 'Deprecated packages: none found',
        finding: {
          severity: 'info',
          description: 'No deprecated packages found'
        }
      };
    } catch (error) {
      return {
        passed: false,
        warning: true,
        details: 'Could not check for deprecated packages',
        message: 'Deprecated packages: could not check',
        finding: {
          severity: 'low',
          description: 'Could not check for deprecated packages',
          recommendation: 'Verify pnpm is working correctly and try again.'
        }
      };
    }
  }, results, addFinding);
}

module.exports = {
  checkNpmAudit,
  checkOutdatedPackages,
  checkNodeVersion,
  checkDeprecatedPackages
};

