#!/usr/bin/env node

/**
 * Security Audit Report Generator
 * 
 * Generates markdown security reports from audit findings
 */

/**
 * Generate markdown security report
 * @param {Object} results - Results object with findings
 * @returns {string} Markdown report
 */
function generateMarkdownReport(results) {
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
    'Dependency & Package Security': ['npm audit', 'npm outdated', 'Node.js version', 'Deprecated packages'],
    'Code & Configuration Security': ['Environment variables', 'package.json', 'File permissions', 'Git history'],
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
    'Update dependencies: `npm update && npm run test all`',
    'Rotate SSH keys periodically: `ssh-keygen -t ed25519`',
    'Run test suite: `npm run test all`',
    'Test backup restore process',
    'Review hosting provider security notices'
  ];
  
  manualTasks.forEach(task => {
    report += `- [ ] ${task}\n`;
  });
  report += `\n`;
  
  // Footer
  report += `---\n`;
  report += `*Generated ${dateStr}*\n`;
  
  return report;
}

module.exports = {
  generateMarkdownReport
};

