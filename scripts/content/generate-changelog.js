#!/usr/bin/env node

/**
 * Generate Changelog from Git History
 * 
 * Creates a CHANGELOG.md file from the git commit history,
 * organized by date (newest first).
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { SPINNER_FRAMES } = require('../utils/spinner-utils');

const CHANGELOG_PATH = path.join(__dirname, '../../CHANGELOG.md');

/**
 * Configuration for changelog generation rules
 * Modify these settings to customize how commits are processed
 */
const CONFIG = {
  // Commit prefixes that are considered significant (always shown individually)
  // Includes: features, security, testability, code clarity, site speed, authoring improvements
  significantPrefixes: ['feat', 'refactor', 'perf', 'breaking', 'security', 'test', 'accessibility', 'seo'],
  
  // Minimum commit message length to be considered significant
  minSignificantLength: 60,
  
  // Minimum number of commits with same prefix before combining them
  combineThreshold: 3,
  
  // Commit prefixes to exclude from changelog entirely
  excludePrefixes: [],
  
  // Regex patterns to exclude commits matching these patterns
  excludePatterns: [
    // Never mention CHANGELOG since it gets regenerated often
    /changelog/i,
    // Never mention plan.md (including variations like "update plan", "plan.md", etc.)
    /\bplan\.md\b/i,
    /update\s+plan\b/i,
    /updated\s+plan\b/i,
    // Exclude whitespace-only changes
    /\bwhitespace\b/i,
    /\btrailing\s+whitespace\b/i,
    /\bwhitespace\s+cleanup\b/i,
  ],
  
  // Custom labels for prefix groups when combined
  prefixLabels: {
    'other': 'Updates',
    'fix': 'Fixes',
    'docs': 'Documentation updates',
    'style': 'Style updates',
    'chore': 'Maintenance',
    'test': 'Test updates',
    'ci': 'CI/CD updates',
  },
  
  // Whether to treat commits without prefixes as significant
  treatNoPrefixAsSignificant: true,
};

/**
 * Escape HTML characters in commit messages to prevent them from being
 * interpreted as HTML tags when the changelog is rendered.
 * Only escapes < and > when they appear to be part of HTML tags.
 */
function escapeHtml(text) {
  // Escape & first (must be done before other replacements)
  text = text.replace(/&/g, '&amp;');
  
  // Only escape < and > if they appear to be part of HTML tags
  // Match < followed by optional /, letters, numbers, or spaces, then >
  text = text.replace(/<[\/]?[a-zA-Z0-9\s]*>/g, (match) => {
    return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  });
  
  return text;
}

/**
 * Extract commit prefix (feat:, fix:, docs:, etc.) from commit message
 */
function getCommitPrefix(message) {
  const match = message.match(/^([a-z]+):\s*/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Strip prefix from commit message for display in changelog
 */
function stripPrefix(message) {
  // Remove prefix pattern (e.g., "feat: ", "fix: ", "docs: ")
  return message.replace(/^[a-z]+:\s*/i, '').trim();
}

/**
 * Normalize capitalization: ensure first letter is capitalized
 */
function normalizeCapitalization(message) {
  if (!message || message.length === 0) {
    return message;
  }
  // Capitalize first letter, preserve rest
  return message.charAt(0).toUpperCase() + message.slice(1);
}

/**
 * Check if commit is about HTML validation errors
 */
function isHtmlErrorFix(message) {
  return /html\s+(validation\s+)?error/i.test(message) ||
         /fix\s+html/i.test(message) ||
         /html\s+validation/i.test(message);
}

/**
 * Check if commit is about styling refinements
 */
function isStylingRefinement(message) {
  const prefix = getCommitPrefix(message);
  if (prefix === 'style') {
    return true;
  }
  return /styling|style|css|design|typography|spacing|layout/i.test(message) &&
         !/feat|add|implement|new/i.test(message);
}

/**
 * Check if commit is about README
 */
function isReadmeCommit(message) {
  return /readme|README/i.test(message);
}

/**
 * Check if README commit is significant (content changes, not just formatting)
 */
function isSignificantReadmeUpdate(message) {
  if (!isReadmeCommit(message)) {
    return false;
  }
  // Significant if it mentions content, features, or substantial changes
  return /content|feature|add|update|change|improve|new|remove/i.test(message) &&
         !/format|whitespace|markdown\s+syntax|lint/i.test(message);
}

/**
 * Check if a commit should be excluded from the changelog
 */
function shouldExcludeCommit(message) {
  // Check exclude prefixes
  const prefix = getCommitPrefix(message);
  if (prefix && CONFIG.excludePrefixes.includes(prefix)) {
    return true;
  }
  
  // Check exclude patterns
  for (const pattern of CONFIG.excludePatterns) {
    if (pattern.test(message)) {
      return true;
    }
  }
  
  // Exclude README updates unless significant
  if (isReadmeCommit(message) && !isSignificantReadmeUpdate(message)) {
    return true;
  }
  
  return false;
}

/**
 * Check if commit message is significant enough to keep separate
 * (not just a simple fix or chore)
 * Ensures features, security, testability, code clarity, site speed, authoring are always mentioned
 */
function isSignificantCommit(message) {
  const prefix = getCommitPrefix(message);
  
  // Significant README updates are always significant
  if (isSignificantReadmeUpdate(message)) {
    return true;
  }
  
  // Check for important keywords that should always be mentioned
  const importantKeywords = [
    'security', 'test', 'testability', 'testing',
    'performance', 'speed', 'optimize', 'optimization',
    'authoring', 'author', 'clarity', 'refactor', 'refactoring',
    'feature', 'feat', 'accessibility', 'seo'
  ];
  const lowerMessage = message.toLowerCase();
  if (importantKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return true;
  }
  
  return CONFIG.significantPrefixes.includes(prefix) || 
         message.length > CONFIG.minSignificantLength ||
         (CONFIG.treatNoPrefixAsSignificant && !prefix);
}

/**
 * Combine similar commits on the same day
 * Groups commits by prefix and combines if 3+ with same prefix
 * Special handling for HTML error fixes and styling refinements
 */
function combineSimilarCommits(commits) {
  const grouped = {};
  const significant = [];
  const htmlErrorFixes = [];
  const stylingRefinements = [];
  
  // Separate commits into categories
  for (const commit of commits) {
    if (isSignificantCommit(commit)) {
      significant.push(normalizeCapitalization(stripPrefix(commit)));
    } else if (isHtmlErrorFix(commit)) {
      htmlErrorFixes.push(commit);
    } else if (isStylingRefinement(commit)) {
      stylingRefinements.push(commit);
    } else {
      const prefix = getCommitPrefix(commit) || 'other';
      if (!grouped[prefix]) {
        grouped[prefix] = [];
      }
      grouped[prefix].push(commit);
    }
  }
  
  const result = [...significant];
  
  // Condense HTML error fixes to a single line
  if (htmlErrorFixes.length > 0) {
    if (htmlErrorFixes.length === 1) {
      result.push(normalizeCapitalization(stripPrefix(htmlErrorFixes[0])));
    } else {
      result.push(`Fix HTML validation errors: ${htmlErrorFixes.length} commits`);
    }
  }
  
  // Condense styling refinements to a single line
  if (stylingRefinements.length > 0) {
    if (stylingRefinements.length === 1) {
      result.push(normalizeCapitalization(stripPrefix(stylingRefinements[0])));
    } else {
      result.push(`Styling refinements: ${stylingRefinements.length} commits`);
    }
  }
  
  // Combine groups with threshold+ commits
  for (const [prefix, commitList] of Object.entries(grouped)) {
    if (commitList.length >= CONFIG.combineThreshold) {
      // Combine into a single entry
      const prefixLabel = CONFIG.prefixLabels[prefix] || 
                         `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} updates`;
      result.push(`${prefixLabel}: ${commitList.length} commits`);
    } else {
      // Keep individual commits if fewer than threshold, but strip prefixes and normalize capitalization
      result.push(...commitList.map(msg => normalizeCapitalization(stripPrefix(msg))));
    }
  }
  
  // Remove duplicates (same message appearing multiple times on the same date)
  const seen = new Set();
  const deduplicated = [];
  for (const message of result) {
    if (!seen.has(message)) {
      seen.add(message);
      deduplicated.push(message);
    }
  }
  
  return deduplicated;
}

// Helper to clean up spinner
function cleanupSpinner(spinnerInterval) {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    // Clear the spinner line (on stdout, like test-runner.js)
    process.stdout.write('\r' + ' '.repeat(50) + '\r');
  }
}

// Clean up spinner on process exit or error
let globalSpinnerInterval = null;
process.on('exit', () => cleanupSpinner(globalSpinnerInterval));
process.on('SIGINT', () => {
  cleanupSpinner(globalSpinnerInterval);
  process.exit(0);
});
process.on('SIGTERM', () => {
  cleanupSpinner(globalSpinnerInterval);
  process.exit(0);
});

// Main execution
try {
  // Start spinner (use stdout like test-runner.js does)
  let spinnerFrame = 0;
  const spinnerMessage = 'Generating changelog from git history...';
  
  // Write initial spinner frame immediately
  process.stdout.write(`\r${SPINNER_FRAMES[0]} ${spinnerMessage}`);
  
  globalSpinnerInterval = setInterval(() => {
    spinnerFrame = (spinnerFrame + 1) % SPINNER_FRAMES.length;
    const spinner = SPINNER_FRAMES[spinnerFrame];
    process.stdout.write(`\r${spinner} ${spinnerMessage}`);
  }, 100);

  // Get all commits with date, message, and hash
  const commits = execSync('git log --format="%H|%ai|%s" --all --reverse', {
    encoding: 'utf-8',
    cwd: path.join(__dirname, '../..')
  }).trim().split('\n').filter(line => line.length > 0);

  // Group commits by date
  const commitsByDate = {};

  for (const commit of commits) {
    const [hash, dateTime, ...messageParts] = commit.split('|');
    const message = messageParts.join('|');
    
    // Skip excluded commits
    if (shouldExcludeCommit(message)) {
      continue;
    }
    
    const date = dateTime.split(' ')[0]; // Extract YYYY-MM-DD

    if (!commitsByDate[date]) {
      commitsByDate[date] = [];
    }
    commitsByDate[date].push(message);
  }

  // Sort dates (newest first)
  const sortedDates = Object.keys(commitsByDate).sort().reverse();

  // Generate changelog content
  // Note: No h1 heading here - the frontmatter title in changelog.md provides it
  let changelog = 'All notable changes to this project are documented in this file. ';
  changelog += 'The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), ';
  changelog += 'and this project adheres to chronological ordering (newest first).\n\n';

  for (const date of sortedDates) {
    changelog += `## ${date}\n\n`;

    // Combine similar commits on the same day
    const combinedCommits = combineSimilarCommits(commitsByDate[date]);

    // Add each commit message as a bullet point
    // Escape HTML to prevent tags from being interpreted as HTML
    for (const message of combinedCommits) {
      changelog += `- ${escapeHtml(message)}\n`;
    }

    changelog += '\n';
  }

  // Write changelog file
  fs.writeFileSync(CHANGELOG_PATH, changelog, 'utf-8');

  // Stop spinner and show success message
  cleanupSpinner(globalSpinnerInterval);
  globalSpinnerInterval = null;
  
  console.log(`✅ Changelog generated successfully!`);
  console.log(`   Location: ${CHANGELOG_PATH}`);
  console.log(`   Dates: ${sortedDates.length}`);
  console.log(`   Total commits: ${commits.length}`);

} catch (error) {
  // Stop spinner on error
  cleanupSpinner(globalSpinnerInterval);
  globalSpinnerInterval = null;
  
  console.error('\n❌ Error generating changelog:');
  console.error(error.message);
  process.exit(1);
}

