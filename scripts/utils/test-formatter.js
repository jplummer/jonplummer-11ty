#!/usr/bin/env node

/**
 * Test Formatter
 * 
 * Formats JSON test results into human-readable output.
 * Start with formatCompact() - get it perfect before adding more formats.
 * 
 * Output Formatting Standards:
 * - Use 2 spaces for first-level indentation (e.g., issue types, file paths)
 * - Use 4 spaces for second-level indentation (e.g., issue details, nested items)
 * - Use 6+ spaces for deeper nesting as needed
 * - This standard helps prevent long file paths from wrapping unnecessarily
 */

const { getTestEmoji, getTestDisplayName } = require('./reporting-utils');
const { finalizeTestResult } = require('./test-result-builder');

/**
 * Format compact output for group runs
 * Matches current compact output exactly: reassuring, focused, succinct
 * 
 * @param {Object} result - Test result object from result builder
 * @returns {string} Formatted output string
 */
function formatCompact(result) {
  // Always finalize to ensure summary is calculated correctly
  // (safe to call multiple times, recalculates from current state)
  finalizeTestResult(result);
  
  const emoji = getTestEmoji(result.testType);
  const displayName = getTestDisplayName(result.testType);
  const summary = result.summary;
  
  const resultIcon = summary.issues > 0 ? '❌' : '✅';
  const files = summary.files;
  const passing = summary.passed;
  const issues = summary.issues;
  const warnings = summary.warnings;
  
  // Design: Reassure first (what's good), then direct attention (what needs fixing)
  let summaryParts = [];
  if (files > 0) {
    const itemName = files === 1 ? 'file' : 'files';
    summaryParts.push(`📄 ${files} ${itemName} checked`);
  }
  // Show passing count prominently (reassuring)
  summaryParts.push(`✅ ${passing} passing`);
  // Show issues (critical) before warnings (less critical)
  if (issues > 0) {
    summaryParts.push(`❌ ${issues} issue${issues === 1 ? '' : 's'}`);
  }
  if (warnings > 0) {
    summaryParts.push(`⚠️  ${warnings} warning${warnings === 1 ? '' : 's'}`);
  }
  
  return `${resultIcon} ${emoji} ${displayName}: ${summaryParts.join(', ')}`;
}

/**
 * Format verbose output for individual runs
 * Starts with compact summary for consistency, then shows detailed by-file results
 * 
 * @param {Object} result - Test result object from result builder
 * @param {Object} options - Formatting options
 * @param {string} options.groupBy - 'file' (default) or 'type'
 * @returns {string} Formatted output string
 */
function formatVerbose(result, options = {}) {
  // Always finalize to ensure summary is calculated correctly
  finalizeTestResult(result);
  
  const groupBy = options.groupBy || 'file';
  
  if (groupBy === 'type') {
    return formatVerboseByType(result);
  }
  
  const output = [];
  const summary = result.summary;
  
  // Start with compact output for consistency with group runs
  output.push(formatCompact(result));
  output.push('');
  
  // Only show detailed results if there are issues or warnings
  if (summary.issues > 0 || summary.warnings > 0) {
    // Global issues (duplicates, etc.) - show first as they're often critical
    if (result.globalIssues && result.globalIssues.length > 0) {
      output.push('🌐 Global Issues:');
      result.globalIssues.forEach(issue => {
        output.push(`  ❌ ${issue.message}`);
        if (issue.files) {
          issue.files.forEach(file => output.push(`    - ${file}`));
        }
      });
      output.push('');
    }
    
    // Issue type summary - only show when valuable (multiple issues and at least one type with >1 occurrence)
    const issueTypes = groupIssuesByType(result);
    const totalIssues = summary.issues + summary.warnings;
    const hasRepeatedType = issueTypes.errors.some(({ count }) => count > 1) || 
                           issueTypes.warnings.some(({ count }) => count > 1);
    
    if (totalIssues > 1 && hasRepeatedType) {
      output.push('📊 Issues by type:');
      if (issueTypes.errors.length > 0) {
        issueTypes.errors.forEach(({ type, count, files }) => {
          output.push(`  ❌ ${type}: ${count} occurrence${count === 1 ? '' : 's'} in ${files.length} file${files.length === 1 ? '' : 's'}`);
        });
      }
      if (issueTypes.warnings.length > 0) {
        issueTypes.warnings.forEach(({ type, count, files }) => {
          output.push(`  ⚠️  ${type}: ${count} occurrence${count === 1 ? '' : 's'} in ${files.length} file${files.length === 1 ? '' : 's'}`);
        });
      }
      output.push('');
    }
    
    // Files with issues - sorted by severity (errors first)
    const filesWithIssues = result.files.filter(f => f.issues.length > 0 || f.warnings.length > 0);
    filesWithIssues.sort((a, b) => {
      // Sort by: errors first, then warnings, then by path
      const aHasErrors = a.issues.length > 0;
      const bHasErrors = b.issues.length > 0;
      if (aHasErrors !== bHasErrors) return bHasErrors - aHasErrors;
      return a.relativePath.localeCompare(b.relativePath);
    });
    
    filesWithIssues.forEach(file => {
      output.push(`📄 ${file.relativePath}:`);
      
      // Errors first (most actionable)
      if (file.issues.length > 0) {
        output.push(`  ❌ Errors:`);
        file.issues.forEach(issue => {
          let line = `    - ${issue.message}`;
          if (issue.line) {
            line += ` (line ${issue.line}`;
            if (issue.column) line += `, col ${issue.column}`;
            line += ')';
          }
          if (issue.ruleId) line += ` [${issue.ruleId}]`;
          if (issue.helpUrl) line += `\n      Learn more: ${issue.helpUrl}`;
          output.push(line);
          if (issue.recommendation) {
            output.push(`      → ${issue.recommendation}`);
          }
          if (issue.context) {
            output.push(`      Context: ${issue.context}`);
          }
        });
      }
      
      // Warnings second
      if (file.warnings.length > 0) {
        output.push(`  ⚠️  Warnings:`);
        file.warnings.forEach(warning => {
          let line = `    - ${warning.message}`;
          if (warning.line) {
            line += ` (line ${warning.line}`;
            if (warning.column) line += `, col ${warning.column}`;
            line += ')';
          }
          if (warning.ruleId) line += ` [${warning.ruleId}]`;
          if (warning.helpUrl) line += `\n      Learn more: ${warning.helpUrl}`;
          output.push(line);
          if (warning.recommendation) {
            output.push(`      → ${warning.recommendation}`);
          }
          if (warning.context) {
            output.push(`      Context: ${warning.context}`);
          }
        });
      }
      
      output.push('');
    });
    
    // Custom sections (e.g., accessibility light/dark mode)
    if (result.customSections && Object.keys(result.customSections).length > 0) {
      Object.entries(result.customSections).forEach(([name, data]) => {
        output.push(`  ${name}:`);
        if (typeof data === 'object' && !Array.isArray(data)) {
          Object.entries(data).forEach(([key, value]) => {
            output.push(`    ${key}: ${value}`);
          });
        } else {
          output.push(`    ${data}`);
        }
        output.push('');
      });
    }
    
    // Suggestions come last
    output.push('💡 Tip: Try --group-by type to see issues grouped by type (useful for systematic fixes)');
  }
  
  return output.join('\n');
}

/**
 * Format verbose output grouped by issue type
 * Alternative view useful for systematic fixes
 * 
 * @param {Object} result - Test result object from result builder
 * @returns {string} Formatted output string
 */
function formatVerboseByType(result) {
  // Always finalize to ensure summary is calculated correctly
  finalizeTestResult(result);
  
  // Alternative view: Group by issue type
  // Useful when same issue appears in many files - fix systematically
  const output = [];
  const summary = result.summary;
  
  // Start with compact output for consistency
  output.push(formatCompact(result));
  output.push('');
  
  // Only show detailed results if there are issues or warnings
  if (summary.issues > 0 || summary.warnings > 0) {
    // Global issues first
    if (result.globalIssues && result.globalIssues.length > 0) {
      output.push('🌐 Global Issues:');
      result.globalIssues.forEach(issue => {
        output.push(`  ❌ ${issue.message}`);
        if (issue.files) {
          issue.files.forEach(file => output.push(`    - ${file}`));
        }
      });
      output.push('');
    }
    
    // Group all issues by type (now includes message details for more specificity)
    const issueTypes = groupIssuesByType(result);
    
    // Helper to get a friendly description from the first issue's message
    function getFriendlyDescription(issues) {
      if (issues.length > 0 && issues[0].message) {
        return issues[0].message;
      }
      return 'Unknown issue';
    }
    
    // Show errors first
    if (issueTypes.errors.length > 0) {
      output.push('❌ Errors by type:');
      output.push('');
      issueTypes.errors.forEach(({ type, count, files, issues }) => {
        const friendlyDesc = getFriendlyDescription(issues);
        output.push(`  ❌ ${friendlyDesc}`);
        output.push(`  ${count} occurrence${count === 1 ? '' : 's'} in ${files.length} file${files.length === 1 ? '' : 's'}:`);
        // Show each file - just the path, no redundant message
        files.forEach(file => {
          const fileIssues = issues.filter(i => i.file === file);
          // If there are line numbers, include them
          const hasLineNumbers = fileIssues.some(i => i.line);
          if (hasLineNumbers) {
            fileIssues.forEach(issue => {
              let line = `  📄 ${file}`;
              if (issue.line) {
                line += ` (line ${issue.line}`;
                if (issue.column) line += `, col ${issue.column}`;
                line += ')';
              }
              output.push(line);
            });
          } else {
            // No line numbers - just show file once
            output.push(`  📄 ${file}`);
          }
        });
        output.push('');
      });
    }
    
    // Then warnings
    if (issueTypes.warnings.length > 0) {
      output.push('⚠️  Warnings by type:');
      output.push('');
      issueTypes.warnings.forEach(({ type, count, files, issues }) => {
        const friendlyDesc = getFriendlyDescription(issues);
        output.push(`  ⚠️  ${friendlyDesc}`);
        output.push(`  ${count} occurrence${count === 1 ? '' : 's'} in ${files.length} file${files.length === 1 ? '' : 's'}:`);
        // Show each file - just the path, no redundant message
        files.forEach(file => {
          const fileIssues = issues.filter(i => i.file === file);
          // If there are line numbers, include them
          const hasLineNumbers = fileIssues.some(i => i.line);
          if (hasLineNumbers) {
            fileIssues.forEach(issue => {
              let line = `  📄 ${file}`;
              if (issue.line) {
                line += ` (line ${issue.line}`;
                if (issue.column) line += `, col ${issue.column}`;
                line += ')';
              }
              output.push(line);
            });
          } else {
            // No line numbers - just show file once
            output.push(`  📄 ${file}`);
          }
        });
        output.push('');
      });
    }
    
    // Custom sections (e.g., accessibility light/dark mode)
    if (result.customSections && Object.keys(result.customSections).length > 0) {
      Object.entries(result.customSections).forEach(([name, data]) => {
        output.push(`  ${name}:`);
        if (typeof data === 'object' && !Array.isArray(data)) {
          Object.entries(data).forEach(([key, value]) => {
            output.push(`    ${key}: ${value}`);
          });
        } else {
          output.push(`    ${data}`);
        }
        output.push('');
      });
    }
  }
  
  return output.join('\n');
}

/**
 * Helper: Extract key detail from issue message for more specific grouping
 * 
 * @param {string} message - Issue message
 * @returns {string|null} Key detail phrase, or null if none found
 */
function extractMessageDetail(message) {
  if (!message) return null;
  
  // Look for common key phrases and extract a concise detail
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('too short')) {
    return 'too short';
  }
  if (lowerMessage.includes('too long')) {
    return 'too long';
  }
  if (lowerMessage.includes('too many')) {
    // Try to extract what there are too many of
    const match = message.match(/too many\s+(\w+)/i);
    if (match) {
      return `too many ${match[1]}`;
    }
    return 'too many';
  }
  if (lowerMessage.includes('missing')) {
    // Extract what's missing
    const match = message.match(/missing\s+([^,\.]+)/i);
    if (match) {
      const detail = match[1].trim();
      // Limit length
      return detail.length > 30 ? detail.substring(0, 27) + '...' : detail;
    }
    return 'missing';
  }
  if (lowerMessage.includes('unescaped')) {
    return 'unescaped quotes';
  }
  if (lowerMessage.includes('separators')) {
    return 'too many separators';
  }
  if (lowerMessage.includes('invalid')) {
    return 'invalid';
  }
  
  return null;
}

/**
 * Helper: Group all issues by type for summary view
 * Creates more specific grouping by combining type with message detail
 * 
 * @param {Object} result - Test result object from result builder
 * @returns {Object} Object with errors and warnings arrays, each containing type summaries
 */
function groupIssuesByType(result) {
  const errorTypes = new Map();
  const warningTypes = new Map();
  
  result.files.forEach(file => {
    file.issues.forEach(issue => {
      const baseType = issue.type || 'Unknown';
      const messageDetail = extractMessageDetail(issue.message);
      // Create a more specific type key
      const type = messageDetail ? `${baseType} (${messageDetail})` : baseType;
      
      if (!errorTypes.has(type)) {
        errorTypes.set(type, { type, baseType, count: 0, files: new Set(), issues: [] });
      }
      const entry = errorTypes.get(type);
      entry.count++;
      entry.files.add(file.relativePath);
      entry.issues.push({ ...issue, file: file.relativePath });
    });
    
    file.warnings.forEach(warning => {
      const baseType = warning.type || 'Unknown';
      const messageDetail = extractMessageDetail(warning.message);
      // Create a more specific type key
      const type = messageDetail ? `${baseType} (${messageDetail})` : baseType;
      
      if (!warningTypes.has(type)) {
        warningTypes.set(type, { type, baseType, count: 0, files: new Set(), issues: [] });
      }
      const entry = warningTypes.get(type);
      entry.count++;
      entry.files.add(file.relativePath);
      entry.issues.push({ ...warning, file: file.relativePath });
    });
  });
  
  // Convert Sets to Arrays and sort by count (most common first)
  const errors = Array.from(errorTypes.values())
    .map(e => ({ ...e, files: Array.from(e.files) }))
    .sort((a, b) => b.count - a.count);
  
  const warnings = Array.from(warningTypes.values())
    .map(w => ({ ...w, files: Array.from(w.files) }))
    .sort((a, b) => b.count - a.count);
  
  return { errors, warnings };
}

/**
 * Format build/deploy output for CI/CD
 * Focus: Blocking issues only, clear pass/fail
 * CRITICAL: Critical warnings are blockers (treat as errors)
 * 
 * @param {Object} result - Test result object from result builder
 * @returns {string} Formatted output string
 */
function formatBuild(result) {
  // Always finalize to ensure summary is calculated correctly
  finalizeTestResult(result);
  
  const emoji = getTestEmoji(result.testType);
  const displayName = getTestDisplayName(result.testType);
  const summary = result.summary;
  
  // Count blocking issues: errors + critical warnings
  // Critical warnings have severity: 'critical' or 'error'
  let blockingIssues = summary.issues;
  let criticalWarnings = 0;
  
  // Count critical warnings (treat as blocking)
  result.files.forEach(file => {
    file.warnings.forEach(warning => {
      if (warning.severity === 'critical' || warning.severity === 'error') {
        criticalWarnings++;
        blockingIssues++;
      }
    });
  });
  
  // Also check global issues for critical warnings
  if (result.globalIssues) {
    result.globalIssues.forEach(issue => {
      if (issue.severity === 'critical' || issue.severity === 'error') {
        blockingIssues++;
      }
    });
  }
  
  const output = [];
  
  // Clear pass/fail header
  if (blockingIssues === 0) {
    output.push(`✅ ${emoji} ${displayName}: PASSED`);
    output.push(`  All checks passed (${summary.files} files checked)`);
  } else {
    output.push(`❌ ${emoji} ${displayName}: FAILED`);
    output.push(`  ${blockingIssues} blocking issue${blockingIssues === 1 ? '' : 's'} found - deployment blocked`);
    if (criticalWarnings > 0) {
      output.push(`  (${summary.issues} error${summary.issues === 1 ? '' : 's'} + ${criticalWarnings} critical warning${criticalWarnings === 1 ? '' : 's'})`);
    }
  }
  output.push('');
  
  // Show blocking issues only (errors + critical warnings)
  if (blockingIssues > 0) {
    // Global issues first
    if (result.globalIssues && result.globalIssues.length > 0) {
      result.globalIssues.forEach(issue => {
        const isBlocking = issue.severity === 'critical' || issue.severity === 'error' || !issue.severity;
        if (isBlocking) {
          output.push(`  ❌ ${issue.message}`);
          if (issue.files) {
            issue.files.forEach(file => output.push(`    - ${file}`));
          }
        }
      });
      if (result.globalIssues.some(i => i.severity === 'critical' || i.severity === 'error' || !i.severity)) {
        output.push('');
      }
    }
    
    // Files with blocking issues
    const filesWithBlockingIssues = result.files.filter(file => {
      const hasErrors = file.issues.length > 0;
      const hasCriticalWarnings = file.warnings.some(w => w.severity === 'critical' || w.severity === 'error');
      return hasErrors || hasCriticalWarnings;
    });
    
    filesWithBlockingIssues.forEach(file => {
      output.push(`  📄 ${file.relativePath}:`);
      
      // Errors (always blocking)
      if (file.issues.length > 0) {
        file.issues.forEach(issue => {
          let line = `    ❌ ${issue.message}`;
          if (issue.line) {
            line += ` (line ${issue.line}`;
            if (issue.column) line += `, col ${issue.column}`;
            line += ')';
          }
          if (issue.ruleId) line += ` [${issue.ruleId}]`;
          output.push(line);
          if (issue.recommendation) {
            output.push(`      → ${issue.recommendation}`);
          }
        });
      }
      
      // Critical warnings (also blocking)
      const criticalWarningsInFile = file.warnings.filter(w => w.severity === 'critical' || w.severity === 'error');
      if (criticalWarningsInFile.length > 0) {
        criticalWarningsInFile.forEach(warning => {
          let line = `    ⚠️  ${warning.message} (critical)`;
          if (warning.line) {
            line += ` (line ${warning.line}`;
            if (warning.column) line += `, col ${warning.column}`;
            line += ')';
          }
          if (warning.ruleId) line += ` [${warning.ruleId}]`;
          output.push(line);
          if (warning.recommendation) {
            output.push(`      → ${warning.recommendation}`);
          }
        });
      }
      
      output.push('');
    });
    
    // Summary of non-blocking warnings (if any)
    const nonBlockingWarnings = summary.warnings - criticalWarnings;
    if (nonBlockingWarnings > 0) {
      output.push(`  ℹ️  ${nonBlockingWarnings} non-blocking warning${nonBlockingWarnings === 1 ? '' : 's'} found (not shown)`);
    }
  }
  
  return output.join('\n');
}

module.exports = {
  formatCompact,
  formatVerbose,
  formatVerboseByType,
  formatBuild,
  groupIssuesByType
};

