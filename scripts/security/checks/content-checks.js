#!/usr/bin/env node

/**
 * Content & Links Security Checks
 * 
 * Checks for redirects and third-party resources
 */

const fs = require('fs');
const path = require('path');
const { getSiteDomain } = require('../../utils/network-utils');

/**
 * Check redirects
 * @param {Object} results - Results object
 * @param {Function} addFinding - Function to add findings
 * @returns {Promise<boolean>} True if passed
 */
async function checkRedirects(results, addFinding) {
  const { runCheck } = require('../../utils/check-runner');
  return runCheck('Redirect security', async () => {
    const redirectFiles = [];
    
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
            if (content.includes('redirectUrl:')) {
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
      return {
        passed: true,
        details: 'No redirect files found',
        message: 'Redirect security: no redirects',
        finding: {
          severity: 'info',
          description: 'No redirect files found'
        }
      };
    }
    
    return {
      passed: true,
      details: `${redirectFiles.length} redirect file(s) found (review manually if needed)`,
      message: `Redirect security: ${redirectFiles.length} redirect(s) found`,
      finding: {
        severity: 'info',
        description: `${redirectFiles.length} redirect file(s) found`
      }
    };
  }, results, addFinding);
}

/**
 * Check third-party resources
 * @param {Object} results - Results object
 * @param {Function} addFinding - Function to add findings
 * @returns {Promise<boolean>} True if passed
 */
async function checkThirdPartyResources(results, addFinding) {
  const { runCheck } = require('../../utils/check-runner');
  return runCheck('Third-party resources', async () => {
    const baseTemplate = 'src/_includes/base.njk';
    if (!fs.existsSync(baseTemplate)) {
      return {
        passed: false,
        warning: true,
        details: 'base.njk not found',
        message: 'Third-party resources: base.njk not found',
        finding: {
          severity: 'low',
          description: 'base.njk template not found',
          recommendation: 'Verify the template file exists and is in the correct location.'
        }
      };
    }
    
    try {
      const content = fs.readFileSync(baseTemplate, 'utf8');
      const externalScripts = [];
      const externalStyles = [];
      
      const scriptMatches = content.matchAll(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi);
      for (const match of scriptMatches) {
        const src = match[1];
        if (src.startsWith('http://') || src.startsWith('https://')) {
          externalScripts.push(src);
        }
      }
      
      const linkMatches = content.matchAll(/<link[^>]*>/gi);
      for (const match of linkMatches) {
        const linkTag = match[0];
        const hrefMatch = linkTag.match(/href=["']([^"']+)["']/i);
        if (!hrefMatch) continue;
        const href = hrefMatch[1];
        
        if (href.startsWith('http://') || href.startsWith('https://')) {
          const relMatch = linkTag.match(/rel=["']([^"']+)["']/i);
          const rel = relMatch ? relMatch[1].toLowerCase() : '';
          
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
        return {
          passed: true,
          details: `${total} external resource(s) found: ${details.join(', ')} (informational)`,
          message: `Third-party resources: ${total} found`,
          finding: {
            severity: 'info',
            description: `${total} external resource(s) found (${externalScripts.length} scripts, ${externalStyles.length} stylesheets)`,
            recommendation: 'Review external resources periodically for security and availability.',
            details: { scripts: externalScripts, stylesheets: externalStyles }
          }
        };
      }
      
      return {
        passed: true,
        details: 'No external scripts or stylesheets found',
        message: 'Third-party resources: none found',
        finding: {
          severity: 'info',
          description: 'No external scripts or stylesheets found'
        }
      };
    } catch (error) {
      return {
        passed: false,
        warning: true,
        details: `Could not check base.njk: ${error.message}`,
        message: 'Third-party resources: could not check',
        finding: {
          severity: 'low',
          description: `Could not check base.njk: ${error.message}`,
          recommendation: 'Verify the template file is readable and properly formatted.'
        }
      };
    }
  }, results, addFinding);
}

module.exports = {
  checkRedirects,
  checkThirdPartyResources
};

