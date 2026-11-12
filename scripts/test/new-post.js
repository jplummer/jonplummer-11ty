#!/usr/bin/env node

/**
 * Unit tests for `pnpm run new-post` (scripts/content/new-post.js), which
 * starts a post as a draft so its date never has to be typed. Every file is
 * written to a scratch folder; src/posts is never touched.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { slugFromTitle, buildPost, createPost } = require('../content/new-post');
const { parseFrontMatter } = require('../utils/frontmatter-utils');

const SCRIPT = path.join(__dirname, '..', 'content', 'new-post.js');

/** A scratch project folder holding an empty src/posts. */
function scratchProject(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'new-post-'));
  fs.mkdirSync(path.join(root, 'src', 'posts'), { recursive: true });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function allFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? allFiles(full) : [full];
  });
}

test('a title becomes a lowercase slug with hyphens', () => {
  assert.strictEqual(slugFromTitle('Teaching a product team to do discovery'), 'teaching-a-product-team-to-do-discovery');
  assert.strictEqual(slugFromTitle("Don't Panic: a “Guide”"), 'dont-panic-a-guide');
  assert.strictEqual(slugFromTitle('Café Société — déjà vu'), 'cafe-societe-deja-vu');
  assert.strictEqual(slugFromTitle('  10 things / 2 ideas  '), '10-things-2-ideas');
});

test('a title with nothing to make a slug from gives "untitled"', () => {
  assert.strictEqual(slugFromTitle(''), 'untitled');
  assert.strictEqual(slugFromTitle('???'), 'untitled');
  assert.strictEqual(slugFromTitle('日本語'), 'untitled');
});

test("the date is today's Pacific day, in the folder, the filename, and the front matter", () => {
  // 5:30 pm PST on Nov 10 is already Nov 11 in UTC.
  const evening = buildPost('A post', new Date('2026-11-11T01:30:00Z'));
  assert.strictEqual(evening.relativePath, path.join('src', 'posts', '2026', '2026-11-10-a-post.md'));
  assert.ok(evening.content.includes('\ndate: "2026-11-10"\n'));

  // One minute either side of Pacific midnight at New Year.
  assert.strictEqual(
    buildPost('A post', new Date('2027-01-01T07:59:00Z')).relativePath,
    path.join('src', 'posts', '2026', '2026-12-31-a-post.md')
  );
  assert.strictEqual(
    buildPost('A post', new Date('2027-01-01T08:00:00Z')).relativePath,
    path.join('src', 'posts', '2027', '2027-01-01-a-post.md')
  );
});

test('the file is a draft post whose front matter reads back as written', () => {
  const title = 'He said "it\'s fine": a note – with a \\ backslash & a #hash';
  const post = buildPost(title, new Date('2026-11-11T20:00:00Z'));
  const { frontMatter, error } = parseFrontMatter(post.content);
  assert.ifError(error);
  assert.deepStrictEqual(frontMatter, {
    title,
    layout: 'layouts/single_post.njk',
    date: '2026-11-11', // a string: an unquoted date would arrive as a Date
    tags: 'post',
    description: '',
    draft: true,
  });
  assert.ok(post.content.includes('# To publish:'), 'the file says how to publish it');
  assert.ok(!post.content.includes('ogImage'), 'the OG card is left to the generator');
});

test('no title gives an untitled draft', () => {
  const post = buildPost('   ', new Date('2026-11-11T20:00:00Z'));
  assert.strictEqual(post.relativePath, path.join('src', 'posts', '2026', '2026-11-11-untitled.md'));
  assert.strictEqual(parseFrontMatter(post.content).frontMatter.title, 'Untitled');
});

test('the post is written into its year folder, which is made if missing', (t) => {
  const root = scratchProject(t);
  const written = createPost('First post', { now: new Date('2026-11-11T20:00:00Z'), root });
  assert.strictEqual(written, path.join('src', 'posts', '2026', '2026-11-11-first-post.md'));
  assert.deepStrictEqual(allFiles(root), [path.join(root, written)]);
});

test('an existing file is refused and left as it was', (t) => {
  const root = scratchProject(t);
  const now = new Date('2026-11-11T20:00:00Z');
  const written = path.join(root, createPost('Same title', { now, root }));
  fs.writeFileSync(written, 'my words so far');
  assert.throws(() => createPost('Same title', { now, root }), /already exists/);
  assert.strictEqual(fs.readFileSync(written, 'utf8'), 'my words so far');
});

test('a folder with no src/posts is refused, and nothing is made there', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'new-post-empty-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.throws(() => createPost('A post', { root }), /src\/posts/);
  assert.deepStrictEqual(fs.readdirSync(root), []);
});

test('the command writes one draft and says where', (t) => {
  const root = scratchProject(t);
  const run = spawnSync(process.execPath, [SCRIPT, 'Working', 'title'], { cwd: root, encoding: 'utf8' });
  assert.strictEqual(run.status, 0, run.stderr);
  const files = allFiles(root);
  assert.strictEqual(files.length, 1);
  assert.match(path.basename(files[0]), /^\d{4}-\d{2}-\d{2}-working-title\.md$/);
  assert.ok(run.stdout.includes(path.relative(root, files[0])), 'prints the path it wrote');
});

test('the command refuses a flag it does not know, and writes nothing', (t) => {
  const root = scratchProject(t);
  const run = spawnSync(process.execPath, [SCRIPT, 'A post', '--date=2026-12-01'], { cwd: root, encoding: 'utf8' });
  assert.strictEqual(run.status, 1);
  assert.deepStrictEqual(allFiles(root), []);
});
