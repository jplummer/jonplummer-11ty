#!/usr/bin/env node

/**
 * Unit tests that pin every post's URL to its filename.
 *
 * A post's URL is /YYYY/MM/DD/slug/. It is built by two pieces of code this
 * test reads and never changes: the date parser in
 * eleventy/config/date-parsing.js and the permalink function in
 * src/posts/posts.11tydata.js. The filename (YYYY-MM-DD-slug.md) is the record
 * of where a post lives, so for every post the two must give the same answer,
 * whatever time zone the build machine is in. A change to date handling that
 * would move a published URL fails here.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const configureDateParsing = require('../../eleventy/config/date-parsing');
const { permalink } = require('../../src/posts/posts.11tydata');
const { parseFrontMatter } = require('../utils/frontmatter-utils');

const POSTS_DIR = path.join(__dirname, '..', '..', 'src', 'posts');

// The callback Eleventy would be given, captured without running Eleventy.
let parseDate;
configureDateParsing({ addDateParsing: (callback) => { parseDate = callback; } });

/** The URL the site builds for a front matter date and a file slug. */
function urlFor(dateValue, fileSlug, inputPath = 'fixture.md') {
  const parsed = parseDate.call({ page: { inputPath } }, dateValue);
  // Eleventy turns the parser's DateTime into a Date before the permalink runs.
  return permalink({ date: parsed.toJSDate(), page: { fileSlug } });
}

function postFiles(dir = POSTS_DIR) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return postFiles(full);
    return entry.name.endsWith('.md') ? [full] : [];
  });
}

/** Every post's built URL, keyed by its path under src/posts. */
function builtUrls() {
  const urls = {};
  for (const file of postFiles()) {
    const { frontMatter } = parseFrontMatter(fs.readFileSync(file, 'utf8'));
    const fileSlug = path.basename(file, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '');
    urls[path.relative(POSTS_DIR, file)] = urlFor(frontMatter.date, fileSlug, file);
  }
  return urls;
}

/** The URL a filename stands for: 2026-10-28-my-post.md → /2026/10/28/my-post/ */
function urlFromFilename(file) {
  const match = path.basename(file, '.md').match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
  return match ? `/${match[1]}/${match[2]}/${match[3]}/${match[4]}/` : null;
}

// Run as a plain script, this file prints every post's URL. The time zone test
// below starts it that way with TZ set, since a process can't change its own.
if (process.env.POST_URLS_PRINT) {
  process.stdout.write(JSON.stringify(builtUrls()));
  process.exit(0);
}

test('a date-only value gives that day in the URL', () => {
  assert.strictEqual(urlFor('2026-10-28', 'my-post'), '/2026/10/28/my-post/');
  assert.strictEqual(urlFor('2026-01-01', 'new-year'), '/2026/01/01/new-year/');
  assert.strictEqual(urlFor('2025-12-31', 'old-year'), '/2025/12/31/old-year/');
});

test('a time with a Pacific offset gives its Pacific day, at any hour', () => {
  assert.strictEqual(urlFor('2025-10-08T00:00:00-07:00', 'p'), '/2025/10/08/p/');
  assert.strictEqual(urlFor('2025-10-08T23:59:59-07:00', 'p'), '/2025/10/08/p/');
  assert.strictEqual(urlFor('2025-01-15T20:30:00-08:00', 'p'), '/2025/01/15/p/');
});

test('the days daylight saving starts and ends keep their own day', () => {
  // 2026: clocks go forward on Mar 8 and back on Nov 1.
  for (const day of ['2026-03-07', '2026-03-08', '2026-03-09', '2026-10-31', '2026-11-01', '2026-11-02']) {
    const [year, month, date] = day.split('-');
    assert.strictEqual(urlFor(day, 'p'), `/${year}/${month}/${date}/p/`, day);
  }
});

test('every post builds at the URL its filename stands for', () => {
  const urls = builtUrls();
  const files = Object.keys(urls);
  assert.ok(files.length > 100, `expected the real posts, found ${files.length}`);
  const moved = files
    .filter((file) => urls[file] !== urlFromFilename(file))
    .map((file) => `${file}: builds at ${urls[file]}, filename says ${urlFromFilename(file)}`);
  assert.deepStrictEqual(moved, []);
});

test('every post builds at the same URL whatever time zone the machine is in', () => {
  const here = builtUrls();
  for (const zone of ['UTC', 'Asia/Tokyo', 'Pacific/Honolulu', 'America/Los_Angeles']) {
    const env = { ...process.env, TZ: zone, POST_URLS_PRINT: '1' };
    // A node:test child prints nothing while this is set.
    delete env.NODE_TEST_CONTEXT;
    const child = spawnSync(process.execPath, [__filename], { env, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    assert.strictEqual(child.status, 0, `TZ=${zone}: ${child.stderr}`);
    assert.deepStrictEqual(JSON.parse(child.stdout), here, `TZ=${zone}`);
  }
});
