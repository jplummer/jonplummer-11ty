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
  let changelog = '# Changelog\n\n';
  changelog += 'All notable changes to this project are documented in this file.\n\n';
  changelog += 'The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\n';
  changelog += 'and this project adheres to chronological ordering (newest first).\n\n';

  for (const date of sortedDates) {
    changelog += `## ${date}\n\n`;

    // Add each commit message as a bullet point
    for (const message of commitsByDate[date]) {
      changelog += `- ${message}\n`;
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

