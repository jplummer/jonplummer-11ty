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

const CHANGELOG_PATH = path.join(__dirname, '../../CHANGELOG.md');

/**
 * Escape HTML characters in commit messages to prevent them from being
 * interpreted as HTML tags when the changelog is rendered.
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Extract commit prefix (feat:, fix:, docs:, etc.) from commit message
 */
function getCommitPrefix(message) {
  const match = message.match(/^([a-z]+):\s*/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Check if commit message is significant enough to keep separate
 * (not just a simple fix or chore)
 */
function isSignificantCommit(message) {
  const prefix = getCommitPrefix(message);
  const significantPrefixes = ['feat', 'refactor', 'perf', 'breaking'];
  return significantPrefixes.includes(prefix) || 
         message.length > 60 || // Long messages are usually more descriptive
         !prefix; // Commits without prefixes are often important
}

/**
 * Combine similar commits on the same day
 * Groups commits by prefix and combines if 3+ with same prefix
 */
function combineSimilarCommits(commits) {
  const grouped = {};
  const significant = [];
  
  // Separate significant commits from routine ones
  for (const commit of commits) {
    if (isSignificantCommit(commit)) {
      significant.push(commit);
    } else {
      const prefix = getCommitPrefix(commit) || 'other';
      if (!grouped[prefix]) {
        grouped[prefix] = [];
      }
      grouped[prefix].push(commit);
    }
  }
  
  const result = [...significant];
  
  // Combine groups with 3+ commits
  for (const [prefix, commitList] of Object.entries(grouped)) {
    if (commitList.length >= 3) {
      // Combine into a single entry
      const prefixLabel = prefix === 'other' ? 'Updates' : 
                         prefix === 'fix' ? 'Fixes' :
                         prefix === 'docs' ? 'Documentation updates' :
                         prefix === 'style' ? 'Style updates' :
                         prefix === 'chore' ? 'Maintenance' :
                         `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} updates`;
      result.push(`${prefixLabel}: ${commitList.length} commits`);
    } else {
      // Keep individual commits if fewer than 3
      result.push(...commitList);
    }
  }
  
  return result;
}

console.log('📝 Generating changelog from git history...\n');

try {
  // Get all commits with date and message
  const commits = execSync('git log --format="%ai|%s" --all --reverse', {
    encoding: 'utf-8',
    cwd: path.join(__dirname, '../..')
  }).trim().split('\n');

  // Group commits by date
  const commitsByDate = {};

  for (const commit of commits) {
    const [dateTime, ...messageParts] = commit.split('|');
    const message = messageParts.join('|');
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

  console.log(`✅ Changelog generated successfully!`);
  console.log(`   Location: ${CHANGELOG_PATH}`);
  console.log(`   Dates: ${sortedDates.length}`);
  console.log(`   Total commits: ${commits.length}`);

} catch (error) {
  console.error('\n❌ Error generating changelog:');
  console.error(error.message);
  process.exit(1);
}

