#!/usr/bin/env node

/**
 * Import Links from NotePlan
 * 
 * Parses a NotePlan note containing links and adds them to links.yaml
 * 
 * Usage:
 *   npm run import-links
 *   npm run import-links -- --clear  (clears note after importing)
 *   npm run import-links -- --date 2025-01-21  (use specific date instead of today)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// NotePlan path (setapp version)
const NOTEPLAN_NOTES_DIR = path.join(
  os.homedir(),
  'Library/Containers/co.noteplan.NotePlan-setapp/Data/Library/Application Support/co.noteplan.NotePlan-setapp/Notes'
);

const LINKS_YAML_PATH = './src/_data/links.yaml';
const NOTE_NAME = 'Links to import'; // Note title to look for

// Parse command line arguments
const args = process.argv.slice(2);
const shouldClear = args.includes('--clear');
const dateArg = args.find(arg => arg.startsWith('--date='));
const targetDate = dateArg ? dateArg.split('=')[1] : new Date().toISOString().split('T')[0];

/**
 * Find NotePlan note by searching for content
 */
function findNotePlanNote(searchTitle) {
  // Search in Personal folder (most common location)
  const personalDir = path.join(NOTEPLAN_NOTES_DIR, 'Personal');
  
  if (!fs.existsSync(personalDir)) {
    console.error('❌ NotePlan Personal folder not found at:', personalDir);
    console.error('   Check that NotePlan is installed and has notes.');
    process.exit(1);
  }

  // Get all .txt files in Personal folder
  const files = fs.readdirSync(personalDir)
    .filter(file => file.endsWith('.txt'))
    .map(file => path.join(personalDir, file));

  // Search file contents for the title
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Check if first line contains the search title
    const firstLine = content.split('\n')[0];
    if (firstLine.includes(searchTitle)) {
      return filePath;
    }
  }

  return null;
}

/**
 * Parse a NotePlan link entry
 * Format: * [Title – Author](URL) Description here
 */
function parseLink(line) {
  // Match markdown link: [text](url)
  const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (!linkMatch) {
    return null;
  }

  const title = linkMatch[1].trim();
  const url = linkMatch[2].trim();

  // Everything after the link is the description
  const afterLink = line.substring(linkMatch.index + linkMatch[0].length).trim();
  const description = afterLink || undefined;

  return {
    url,
    title,
    description
  };
}

/**
 * Parse NotePlan note content
 */
function parseNotePlanNote(content) {
  const lines = content.split('\n');
  const links = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines, headers, and non-bullet lines
    if (!trimmed || trimmed.startsWith('#') || !trimmed.match(/^[*\-•]/)) {
      continue;
    }

    const link = parseLink(trimmed);
    if (link) {
      links.push(link);
    }
  }

  return links;
}

/**
 * Format YAML string with proper quoting and escaping
 */
function formatYamlString(value) {
  if (!value || typeof value !== 'string') {
    return value;
  }

  // Check if needs quoting
  const needsQuoting = /[:#|>&*!%@`'"\n\r]/.test(value) || 
                       /^\s|\s$/.test(value) ||
                       /^[0-9-]/.test(value) ||
                       ['true', 'false', 'null', 'yes', 'no', 'on', 'off'].includes(value.toLowerCase());

  if (!needsQuoting) {
    return value;
  }

  // Escape and quote
  if (value.includes('"') && value.includes("'")) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  } else if (value.includes('"')) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  } else if (value.includes("'")) {
    return `"${value.replace(/\\/g, '\\\\')}"`;
  } else {
    return `"${value.replace(/\\/g, '\\\\')}"`;
  }
}

/**
 * Format a single link for YAML output
 */
function formatLinkYaml(link) {
  const parts = [];
  parts.push(`  - url: ${formatYamlString(link.url)}`);
  parts.push(`    title: ${formatYamlString(link.title)}`);
  if (link.description) {
    parts.push(`    description: ${formatYamlString(link.description)}`);
  }
  return parts.join('\n');
}

/**
 * Parse existing links.yaml content
 */
function parseLinksYaml(content) {
  const result = {};
  const lines = content.split('\n');
  let currentDate = null;
  let currentLinks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Date key (YYYY-MM-DD:)
    if (/^\d{4}-\d{2}-\d{2}:$/.test(line)) {
      if (currentDate && currentLinks.length > 0) {
        result[currentDate] = currentLinks;
      }
      currentDate = line.replace(':', '');
      currentLinks = [];
      i++;
    }
    // Link entry start (- url:)
    else if (line.startsWith('- url:')) {
      const linkObj = {};
      
      // Extract URL
      const urlMatch = line.match(/url:\s*(.+)$/);
      if (urlMatch) {
        let url = urlMatch[1].trim();
        // Remove quotes
        if ((url.startsWith('"') && url.endsWith('"')) || 
            (url.startsWith("'") && url.endsWith("'"))) {
          url = url.slice(1, -1);
        }
        // Unescape (handle both backslash escapes and doubled apostrophes)
        url = url.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/''/g, "'");
        linkObj.url = url;
      }
      
      i++;
      
      // Look for title (next line, indented)
      if (i < lines.length && lines[i].trim().startsWith('title:')) {
        const titleMatch = lines[i].trim().match(/title:\s*(.+)$/);
        if (titleMatch) {
          let title = titleMatch[1].trim();
          // Remove quotes
          if ((title.startsWith('"') && title.endsWith('"')) || 
              (title.startsWith("'") && title.endsWith("'"))) {
            title = title.slice(1, -1);
          }
          // Unescape (handle both backslash escapes and doubled apostrophes)
          title = title.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/''/g, "'");
          linkObj.title = title;
        }
        i++;
      }
      
      // Look for description (next line, indented, optional)
      if (i < lines.length && lines[i].trim().startsWith('description:')) {
        const descMatch = lines[i].trim().match(/description:\s*(.+)$/);
        if (descMatch) {
          let desc = descMatch[1].trim();
          // Remove quotes
          if ((desc.startsWith('"') && desc.endsWith('"')) || 
              (desc.startsWith("'") && desc.endsWith("'"))) {
            desc = desc.slice(1, -1);
          }
          // Unescape (handle both backslash escapes and doubled apostrophes)
          desc = desc.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/''/g, "'");
          linkObj.description = desc;
        }
        i++;
      }
      
      if (linkObj.url && linkObj.title) {
        currentLinks.push(linkObj);
      }
    }
    // Empty line or other content - skip
    else {
      i++;
    }
  }

  // Add last date group
  if (currentDate && currentLinks.length > 0) {
    result[currentDate] = currentLinks;
  }

  return result;
}

/**
 * Check if URL already exists in links data
 */
function urlExists(data, url) {
  for (const dateKey in data) {
    const links = data[dateKey];
    if (Array.isArray(links)) {
      for (const link of links) {
        if (link.url === url) {
          return { exists: true, date: dateKey };
        }
      }
    }
  }
  return { exists: false };
}

/**
 * Add links to YAML data structure (skips duplicates)
 */
function addLinksToData(data, date, newLinks) {
  if (!data[date]) {
    data[date] = [];
  }
  
  const results = {
    added: [],
    skipped: []
  };
  
  for (const link of newLinks) {
    const duplicate = urlExists(data, link.url);
    if (duplicate.exists) {
      results.skipped.push({ link, existingDate: duplicate.date });
    } else {
      data[date].push(link);
      results.added.push(link);
    }
  }
  
  return results;
}

/**
 * Format complete links.yaml structure
 */
function formatLinksYaml(data) {
  const lines = [];
  const dates = Object.keys(data).sort((a, b) => b.localeCompare(a));
  
  for (const date of dates) {
    lines.push(`${date}:`);
    const links = data[date];
    if (Array.isArray(links)) {
      for (const link of links) {
        lines.push(formatLinkYaml(link));
      }
    }
    // Add blank line between date groups (except after last)
    if (date !== dates[dates.length - 1]) {
      lines.push('');
    }
  }
  
  return lines.join('\n') + '\n';
}

/**
 * Clear the NotePlan note content
 */
function clearNote(notePath) {
  const header = '# Links to import\n\n';
  fs.writeFileSync(notePath, header, 'utf8');
}

// Main execution
console.log('🔍 Looking for NotePlan note: "' + NOTE_NAME + '"...\n');

const notePath = findNotePlanNote(NOTE_NAME);
if (!notePath) {
  console.error('❌ Note not found: "' + NOTE_NAME + '"');
  console.error('   Create a note in NotePlan with that title and add links.');
  process.exit(1);
}

console.log(`✅ Found note: ${path.basename(notePath)}\n`);

// Read and parse NotePlan note
const noteContent = fs.readFileSync(notePath, 'utf8');
const parsedLinks = parseNotePlanNote(noteContent);

if (parsedLinks.length === 0) {
  console.log('⚠️  No links found in note.');
  console.log('   Add links in format: * [Title – Author](URL) Description');
  process.exit(0);
}

console.log(`📝 Found ${parsedLinks.length} link(s) to import\n`);

// Display what will be imported
for (let i = 0; i < parsedLinks.length; i++) {
  const link = parsedLinks[i];
  console.log(`   ${i + 1}. ${link.title}`);
  console.log(`      URL: ${link.url}`);
  if (link.description) {
    const truncDesc = link.description.length > 60 
      ? link.description.substring(0, 57) + '...' 
      : link.description;
    console.log(`      Description: ${truncDesc}`);
  }
  console.log('');
}

// Read existing links.yaml
if (!fs.existsSync(LINKS_YAML_PATH)) {
  console.error(`❌ links.yaml not found at: ${LINKS_YAML_PATH}`);
  process.exit(1);
}

const yamlContent = fs.readFileSync(LINKS_YAML_PATH, 'utf8');
const linksData = parseLinksYaml(yamlContent);

// Add new links (skips duplicates)
const results = addLinksToData(linksData, targetDate, parsedLinks);

// Show skipped duplicates
if (results.skipped.length > 0) {
  console.log(`⚠️  Skipped ${results.skipped.length} duplicate(s):\n`);
  for (const item of results.skipped) {
    console.log(`   • ${item.link.title}`);
    console.log(`     URL: ${item.link.url}`);
    console.log(`     Already exists on: ${item.existingDate}`);
    console.log('');
  }
}

// Only write if there are changes
if (results.added.length > 0) {
  // Format and write back
  const newYamlContent = formatLinksYaml(linksData);
  fs.writeFileSync(LINKS_YAML_PATH, newYamlContent, 'utf8');

  console.log(`✅ Imported ${results.added.length} link(s) to links.yaml with date: ${targetDate}\n`);

  // Clear note if requested
  if (shouldClear) {
    clearNote(notePath);
    console.log('✅ Cleared NotePlan note\n');
  }

  console.log('Next steps:');
  console.log('  1. pnpm run test links  (validate)');
  console.log('  2. pnpm run build  (build site)');
  console.log('  3. pnpm run deploy  (deploy to live site)');
  console.log('');
} else {
  console.log('ℹ️  No new links to import (all were duplicates)\n');
  process.exit(0);
}
