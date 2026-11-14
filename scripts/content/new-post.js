#!/usr/bin/env node

/**
 * Start a new post as a draft.
 *
 *   pnpm run new-post "Working title"
 *
 * Writes src/posts/<year>/<today>-<slug>.md with the front matter a post
 * needs and `draft: true`. The title, the slug, and the date are working
 * values: all three can change until the post is published, and the comment
 * the file carries says what to do then. Today is the Pacific calendar day,
 * wherever the machine is.
 */

const fs = require('fs');
const path = require('path');
const { todayIsoDate } = require('../../eleventy/utils/date-utils');
const { validateSlug } = require('../utils/validation-utils');

const UNTITLED = 'Untitled';

/** "Don't Panic: a Guide" → "dont-panic-a-guide" */
function slugFromTitle(title) {
  const slug = String(title)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // accents left behind by NFKD
    .replace(/['’‘]/g, '') // don't → dont, not don-t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return validateSlug(slug).valid ? slug : 'untitled';
}

/**
 * The path and contents of a new draft post.
 * @param {string} title - Working title; blank gives "Untitled"
 * @param {Date} [now] - The instant to take today's date from
 * @returns {{ relativePath: string, content: string, date: string, slug: string }}
 */
function buildPost(title, now = new Date()) {
  const cleanTitle = String(title || '').trim().replace(/\s+/g, ' ') || UNTITLED;
  const date = todayIsoDate(now);
  const slug = slugFromTitle(cleanTitle);
  const content = [
    '---',
    // JSON's string form is also a valid YAML double-quoted string.
    `title: ${JSON.stringify(cleanTitle)}`,
    'layout: layouts/single_post.njk',
    `date: "${date}"`,
    'tags: post',
    'description: ""',
    '# To publish: set date to the publishing day, rename this file to',
    '# YYYY-MM-DD-slug.md to match the date and the final title, write the',
    '# description, then delete these lines. A future date is held until that day.',
    'draft: true',
    '---',
    '',
    '',
  ].join('\n');
  return {
    relativePath: path.join('src', 'posts', date.slice(0, 4), `${date}-${slug}.md`),
    content,
    date,
    slug,
  };
}

/**
 * Write a new draft post under `root`. Never overwrites.
 * @returns {string} The path written, relative to `root`
 */
function createPost(title, { now = new Date(), root = process.cwd() } = {}) {
  if (!fs.existsSync(path.join(root, 'src', 'posts'))) {
    throw new Error(`No src/posts folder in ${root}. Run this from the project folder.`);
  }
  const post = buildPost(title, now);
  const fullPath = path.join(root, post.relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  try {
    // 'wx' fails if the file exists, so a post is never written over.
    fs.writeFileSync(fullPath, post.content, { flag: 'wx' });
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new Error(`${post.relativePath} already exists. Nothing was written.`);
    }
    throw error;
  }
  return post.relativePath;
}

function main(args) {
  const flags = args.filter((arg) => arg.startsWith('--'));
  if (flags.length > 0) {
    console.log('Usage: pnpm run new-post "Working title"');
    process.exit(flags.every((flag) => flag === '--help') ? 0 : 1);
  }
  try {
    const written = createPost(args.join(' '));
    console.log(`📝 Started a draft: ${written}`);
    console.log('   It shows on the dev server and stays out of the live site until you delete draft: true.');
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = { slugFromTitle, buildPost, createPost };
