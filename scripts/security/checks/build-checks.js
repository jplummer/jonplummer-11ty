#!/usr/bin/env node

/**
 * Build & Deployment Security Checks
 * 
 * Checks for sensitive files in build output and Content Security Policy
 */

const fs = require('fs');
const path = require('path');

/**
 * Check build output for sensitive files
 * @param {Object} results - Results object
 * @param {Function} addFinding - Function to add findings
 * @returns {Promise<boolean>} True if passed
 */
async function checkBuildOutput(results, addFinding) {
  const { runCheck } = require('../../utils/check-runner');
  return runCheck('Build output', async () => {
    if (!fs.existsSync('_site')) {
      return {
        passed: false,
        warning: true,
        details: '_site/ directory not found (run "pnpm run build" first)',
        message: 'Build output: _site/ not found',
        finding: {
          severity: 'low',
          description: '_site/ directory not found',
          recommendation: 'Run "pnpm run build" to generate build output before checking for sensitive files.'
        }
      };
    }
    
    const sensitivePatterns = ['.env', '.git', 'package.json', 'package-lock.json', 'pnpm-lock.yaml', 'node_modules'];
    const found = [];
    
    function checkDir(dir) {
      try {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            for (const pattern of sensitivePatterns) {
              if (entry === pattern) {
                found.push(fullPath);
              }
            }
            checkDir(fullPath);
          } else {
            for (const pattern of sensitivePatterns) {
              if (entry === pattern) {
                found.push(fullPath);
              } else {
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
      return {
        passed: false,
        details: `Sensitive files found in _site/: ${found.slice(0, 3).join(', ')}${found.length > 3 ? '...' : ''}`,
        message: 'Build output: sensitive files found',
        finding: {
          severity: 'high',
          description: `Sensitive files found in _site/ directory: ${found.length} file(s)`,
          recommendation: 'Remove sensitive files from build output. Update .eleventyignore or build configuration to exclude these files.',
          details: { files: found }
        }
      };
    }
    
    return {
      passed: true,
      details: 'No sensitive files found in _site/',
      message: 'Build output: clean',
      finding: {
        severity: 'info',
        description: 'No sensitive files found in _site/ directory'
      }
    };
  }, results, addFinding);
}

/**
 * Check Content Security Policy
 * @param {Object} results - Results object
 * @param {Function} addFinding - Function to add findings
 * @returns {Promise<boolean>} True if passed
 */
async function checkCSP(results, addFinding) {
  const { runCheck } = require('../../utils/check-runner');
  return runCheck('Content Security Policy', async () => {
    // .htaccess is generated from a Nunjucks template via Eleventy's data cascade
    const htaccessPath = 'src/.htaccess.njk';
    if (!fs.existsSync(htaccessPath)) {
      return {
        passed: false,
        warning: true,
        details: '.htaccess.njk template not found',
        message: 'CSP: .htaccess.njk not found',
        finding: {
          severity: 'medium',
          description: '.htaccess.njk template not found',
          recommendation: 'Consider adding Content Security Policy headers to improve XSS protection. The .htaccess template should exist at src/.htaccess.njk.'
        }
      };
    }
    
    try {
      const content = fs.readFileSync(htaccessPath, 'utf8');
      const cspMatch = content.match(/Content-Security-Policy[^"]*"([^"]+)"/i);
      
      if (!cspMatch) {
        return {
          passed: false,
          warning: true,
          details: 'CSP header not found in .htaccess.njk',
          message: 'CSP: header not found',
          finding: {
            severity: 'medium',
            description: 'CSP header not found in .htaccess.njk',
            recommendation: 'Add Content Security Policy headers to .htaccess.njk to prevent XSS attacks. Use a restrictive policy that only allows necessary resources.'
          }
        };
      }
      
      const csp = cspMatch[1];
      
      if (csp.includes("'unsafe-inline'")) {
        return {
          passed: false,
          warning: true,
          details: 'CSP contains unsafe-inline (security risk)',
          message: 'CSP: contains unsafe-inline',
          finding: {
            severity: 'high',
            description: 'CSP contains unsafe-inline directive',
            recommendation: 'Remove unsafe-inline from CSP. Use nonces or hashes for inline scripts/styles instead.',
            details: { csp }
          }
        };
      }
      
      if (csp.includes("'unsafe-eval'")) {
        return {
          passed: false,
          warning: true,
          details: 'CSP contains unsafe-eval (security risk)',
          message: 'CSP: contains unsafe-eval',
          finding: {
            severity: 'high',
            description: 'CSP contains unsafe-eval directive',
            recommendation: 'Remove unsafe-eval from CSP. Avoid using eval() or similar functions that execute code from strings.',
            details: { csp }
          }
        };
      }
      
      return {
        passed: true,
        details: 'CSP configured without unsafe-inline/unsafe-eval',
        message: 'CSP: properly configured',
        finding: {
          severity: 'info',
          description: 'CSP configured without unsafe-inline/unsafe-eval directives'
        }
      };
    } catch (error) {
      return {
        passed: false,
        warning: true,
        details: `Could not parse .htaccess.njk: ${error.message}`,
        message: 'CSP: could not check',
        finding: {
          severity: 'low',
          description: `Could not parse .htaccess.njk: ${error.message}`,
          recommendation: 'Verify .htaccess.njk template is readable and properly formatted.'
        }
      };
    }
  }, results, addFinding);
}

module.exports = {
  checkBuildOutput,
  checkCSP
};

