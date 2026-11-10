#!/usr/bin/env node

/**
 * Import Links from NotePlan
 * 
 * Parses a NotePlan note containing links and adds them to links.yaml
 * 
 * Usage:
 *   pnpm run import-links
 *   pnpm run import-links --clear            (clears the note after importing)
 *   pnpm run import-links --date=2025-01-21  (that date instead of today's)
 *
 * Unit test: scripts/test/noteplan-import.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');
const { DateTime } = require('luxon');
const { formatYamlString } = require('../utils/frontmatter-utils');

// NotePlan path (setapp version)
const NOTEPLAN_NOTES_DIR = path.join(
  os.homedir(),
  'Library/Containers/co.noteplan.NotePlan-setapp/Data/Library/Application Support/co.noteplan.NotePlan-setapp/Notes'
);

const LINKS_YAML_PATH = './src/_data/links.yaml';
const NOTE_NAME = 'Links to import'; // Note title to look for

const SKIP_NOTE_DIRS = new Set(['@Trash', '@Archive']);

/**
 * Collect NotePlan note files (.txt legacy, .md current) under Notes/
 */
function collectNotePlanNoteFiles(dir) {
  const files = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_NOTE_DIRS.has(entry.name)) {
        continue;
      }
      files.push(...collectNotePlanNoteFiles(fullPath));
      continue;
    }

    if (entry.isFile() && (entry.name.endsWith('.txt') || entry.name.endsWith('.md'))) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Find NotePlan note by title in first line or filename stem
 */
function findNotePlanNote(searchTitle) {
  if (!fs.existsSync(NOTEPLAN_NOTES_DIR)) {
    console.error('❌ NotePlan Notes folder not found at:', NOTEPLAN_NOTES_DIR);
    console.error('   Check that NotePlan is installed and has notes.');
    process.exit(1);
  }

  const files = collectNotePlanNoteFiles(NOTEPLAN_NOTES_DIR);

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const firstLine = content.split('\n')[0];
    const stem = path.basename(filePath, path.extname(filePath));

    if (firstLine.includes(searchTitle) || stem === searchTitle) {
      return filePath;
    }
  }

  return null;
}

/**
 * Strip invisible characters NotePlan sometimes inserts around pasted URLs
 */
function sanitizeUrl(url) {
  return url.replace(/\uFEFF|\uFFFC/g, '').trim();
}

/**
 * Index of the bracket that closes the one at `open`, counting nested pairs.
 * -1 when it never closes.
 */
function matchingClose(text, open, openChar, closeChar) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === openChar) depth++;
    else if (text[i] === closeChar && --depth === 0) return i;
  }
  return -1;
}

/**
 * Parse a NotePlan link entry
 * Format: * [Title – Author](URL) Description here
 *
 * Brackets in the title and parentheses in the URL are matched in pairs, so
 * `[Review: [REC]](…)` and `(…/Dongle_(disambiguation))` are read whole. The
 * first `[…]` that is followed at once by `(…)` is the link.
 */
function parseLink(line) {
  for (let open = line.indexOf('['); open !== -1; open = line.indexOf('[', open + 1)) {
    const close = matchingClose(line, open, '[', ']');
    if (close === -1 || line[close + 1] !== '(') continue;
    const urlEnd = matchingClose(line, close + 1, '(', ')');
    if (urlEnd === -1) continue;

    const title = line.slice(open + 1, close).trim();
    const url = sanitizeUrl(line.slice(close + 2, urlEnd));
    if (!title || !url) continue;

    // Everything after the link is the description
    const description = line.slice(urlEnd + 1).trim() || undefined;
    return { url, title, description };
  }
  return null;
}

/**
 * Read a NotePlan note: the links on its bulleted lines, plus every other
 * line that holds a web address and so looks like a link that was meant to be
 * imported (no bullet, a numbered item, a bare URL, a link that never closes).
 * main() prints those and won't clear the note while there are any.
 * @returns {{ links: object[], unread: { number: number, text: string }[] }}
 */
function readNote(content) {
  const links = [];
  const unread = [];

  content.split('\n').forEach((line, index) => {
    const trimmed = line.trim();
    // Skip empty lines and headers
    if (!trimmed || trimmed.startsWith('#')) return;

    const link = /^[*\-•]/.test(trimmed) ? parseLink(trimmed) : null;
    if (link) {
      links.push(link);
    } else if (/https?:\/\//i.test(trimmed)) {
      unread.push({ number: index + 1, text: trimmed });
    }
  });

  return { links, unread };
}

/**
 * Parse NotePlan note content: the links only.
 */
function parseNotePlanNote(content) {
  return readNote(content).links;
}

/**
 * The date key new links are filed under: --date=YYYY-MM-DD (or --date
 * YYYY-MM-DD), else today's calendar day in America/Los_Angeles. UTC would
 * file an evening import under tomorrow. Throws on a --date it can't use.
 */
function resolveTargetDate(args, now = new Date()) {
  const index = args.findIndex((arg) => arg === '--date' || arg.startsWith('--date='));
  if (index === -1) {
    return DateTime.fromJSDate(now, { zone: 'America/Los_Angeles' }).toISODate();
  }
  const value = args[index] === '--date' ? args[index + 1] : args[index].slice('--date='.length);
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !DateTime.fromISO(value).isValid) {
    throw new Error(`--date needs a real day as YYYY-MM-DD, such as --date=2025-12-25; got "${value || ''}"`);
  }
  return value;
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
 * Parse existing links.yaml content into { 'YYYY-MM-DD': [link, …] }.
 * JSON_SCHEMA keeps the date keys as strings; the default schema makes them
 * Dates. Throws on invalid YAML, which stops the import before it writes.
 * A date with no links is left out, so it isn't written back.
 */
function parseLinksYaml(content) {
  const data = yaml.load(content, { schema: yaml.JSON_SCHEMA }) || {};
  const result = {};
  for (const [date, links] of Object.entries(data)) {
    if (Array.isArray(links) && links.length > 0) {
      result[date] = links;
    }
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

// Runs only as a command. Requiring this file (scripts/test/noteplan-import.js
// does) loads the functions above and touches neither NotePlan nor links.yaml.
function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');
  let targetDate;
  try {
    targetDate = resolveTargetDate(args);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }

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
  const { links: parsedLinks, unread } = readNote(noteContent);

  // Lines that hold a web address but weren't read as a link. Printed on
  // every path out of here, so a skipped link is never silent.
  const reportUnread = () => {
    if (unread.length === 0) return;
    console.log(`⚠️  ${unread.length} line(s) hold a web address but were not imported:`);
    for (const { number, text } of unread) {
      console.log(`   line ${number}: ${text}`);
    }
    console.log('   Each link needs a bullet and this shape: * [Title – Author](URL) Description\n');
  };

  if (parsedLinks.length === 0) {
    reportUnread();
    console.log('⚠️  No links found in note.');
    console.log('   Add links in format: * [Title – Author](URL) Description');
    process.exit(0);
  }

  console.log(`📝 Found ${parsedLinks.length} link(s) to import\n`);

  // Read existing links.yaml
  if (!fs.existsSync(LINKS_YAML_PATH)) {
    console.error(`❌ links.yaml not found at: ${LINKS_YAML_PATH}`);
    process.exit(1);
  }

  const yamlContent = fs.readFileSync(LINKS_YAML_PATH, 'utf8');
  let linksData;
  try {
    linksData = parseLinksYaml(yamlContent);
  } catch (error) {
    console.error(`❌ ${LINKS_YAML_PATH} is not valid YAML, so nothing was imported:`);
    console.error(`   ${error.message.split('\n')[0]}`);
    process.exit(1);
  }

  // Add new links (skips duplicates)
  const results = addLinksToData(linksData, targetDate, parsedLinks);

  // Only write if there are changes
  if (results.added.length > 0) {
    // Format and write back
    const newYamlContent = formatLinksYaml(linksData);
    fs.writeFileSync(LINKS_YAML_PATH, newYamlContent, 'utf8');

    console.log(`✅ Imported ${results.added.length} new link(s) (date: ${targetDate}):\n`);
    for (const link of results.added) {
      console.log(`   • ${link.title}`);
      console.log(`     ${link.url}`);
    }
    if (results.skipped.length > 0) {
      console.log(`\n⚠️  Skipped ${results.skipped.length} duplicate(s).`);
    }
    console.log('');
    reportUnread();

    // Clear note if requested, unless that would throw away a line we couldn't read
    if (shouldClear && unread.length > 0) {
      console.log('⚠️  Did not clear the NotePlan note, so those lines are kept. Fix them and import again;');
      console.log('   the links imported just now will be skipped as duplicates.\n');
    } else if (shouldClear) {
      clearNote(notePath);
      console.log('✅ Cleared NotePlan note\n');
    }

    console.log('Next steps:');
    console.log('  1. pnpm run test links  (validate)');
    console.log('  2. pnpm run build  (build site)');
    console.log('  3. pnpm run deploy  (deploy to live site)');
    console.log('');
  } else {
    console.log(`ℹ️  No new links to import. Skipped ${results.skipped.length} duplicate(s).\n`);
    reportUnread();
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  sanitizeUrl,
  parseLink,
  parseNotePlanNote,
  readNote,
  resolveTargetDate,
  parseLinksYaml,
  urlExists,
  addLinksToData,
  formatLinkYaml,
  formatLinksYaml,
};
