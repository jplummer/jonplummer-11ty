#!/usr/bin/env node

/**
 * Unit tests for what a production build leaves out: drafts of any kind, and
 * posts dated after today (held). Covers the rule itself
 * (eleventy/utils/publish-state.js), the list the build prints
 * (scripts/utils/unpublished.js), draft wisdom entries
 * (eleventy/utils/wisdom-build.js), and a real Eleventy build of a scratch
 * site with the site's own preprocessor, in production mode and in dev mode.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { publishState } = require('../../eleventy/utils/publish-state');
const { buildWisdom } = require('../../eleventy/utils/wisdom-build');
const { listUnpublished, formatUnpublished } = require('../utils/unpublished');

const REPO = path.join(__dirname, '..', '..');

// 9 am PST on Nov 11, 2026.
const NOW = new Date('2026-11-11T17:00:00Z');

function scratch(t, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'publish-state-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), content);
  }
  return root;
}

const page = (fields, body = 'Body.') => `---\n${fields.join('\n')}\n---\n${body}\n`;

test('a post dated today or earlier is live, and one dated after today is held', () => {
  assert.deepStrictEqual(publishState({ tags: 'post', date: '2026-11-10' }, NOW), { state: 'live' });
  assert.deepStrictEqual(publishState({ tags: 'post', date: '2026-11-11' }, NOW), { state: 'live' });
  assert.deepStrictEqual(publishState({ tags: 'post', date: '2026-11-12' }, NOW), { state: 'held', until: '2026-11-12' });
  assert.deepStrictEqual(publishState({ tags: ['post', 'design'], date: '2027-01-01' }, NOW), { state: 'held', until: '2027-01-01' });
});

test('a held post goes live at Pacific midnight on its day, not UTC midnight', () => {
  const post = { tags: 'post', date: '2026-11-12' };
  // 4 pm PST on the 11th is already the 12th in UTC.
  assert.strictEqual(publishState(post, new Date('2026-11-12T00:00:00Z')).state, 'held');
  assert.strictEqual(publishState(post, new Date('2026-11-12T07:59:00Z')).state, 'held');
  assert.strictEqual(publishState(post, new Date('2026-11-12T08:00:00Z')).state, 'live');
});

test('the date is read as the site reads it, whatever form it arrives in', () => {
  // A time with an offset: 11 pm PST on the 11th.
  assert.strictEqual(publishState({ tags: 'post', date: '2026-11-11T23:00:00-08:00' }, NOW).state, 'live');
  assert.strictEqual(publishState({ tags: 'post', date: '2026-11-12T00:30:00-08:00' }, NOW).state, 'held');
  // Eleventy may hand the preprocessor a Date: midnight Pacific on the 12th.
  assert.deepStrictEqual(
    publishState({ tags: 'post', date: new Date('2026-11-12T08:00:00Z') }, NOW),
    { state: 'held', until: '2026-11-12' }
  );
});

test('only posts are held: other pages with a future date are live', () => {
  assert.strictEqual(publishState({ tags: 'portfolio', date: '2030-01-01' }, NOW).state, 'live');
  assert.strictEqual(publishState({ date: '2030-01-01' }, NOW).state, 'live');
  assert.strictEqual(publishState({ tags: 'post' }, NOW).state, 'live');
  assert.strictEqual(publishState({}, NOW).state, 'live');
});

test('draft: true makes any page a draft, and wins over a future date', () => {
  assert.deepStrictEqual(publishState({ draft: true }, NOW), { state: 'draft' });
  assert.deepStrictEqual(publishState({ draft: true, tags: 'portfolio' }, NOW), { state: 'draft' });
  assert.deepStrictEqual(publishState({ draft: true, tags: 'post', date: '2030-01-01' }, NOW), { state: 'draft' });
  assert.strictEqual(publishState({ draft: false, tags: 'post', date: '2026-11-01' }, NOW).state, 'live');
});

test('a draft wisdom entry is left out of a production build and kept on the dev server', () => {
  const root = {
    entries: [
      { added: '2026-11-01', tags: ['craft'], body: 'Published.' },
      { added: '2026-11-05', tags: ['only-in-draft'], body: 'Not yet.', draft: true },
    ],
  };
  const production = buildWisdom(root, 'build');
  assert.deepStrictEqual(production.entries.map((entry) => entry.body), ['Published.']);
  assert.deepStrictEqual(production.allTags, ['craft'], 'a tag only a draft uses gets no tag page');

  for (const mode of ['serve', 'watch', undefined]) {
    const dev = buildWisdom(root, mode);
    assert.deepStrictEqual(dev.entries.map((entry) => entry.body), ['Not yet.', 'Published.'], `run mode ${mode}`);
    assert.deepStrictEqual(dev.allTags, ['craft', 'only-in-draft'], `run mode ${mode}`);
  }
});

test('the build names every draft and held post, and nothing that is live', (t) => {
  const src = scratch(t, {
    'posts/2026/2026-11-01-live.md': page(['title: Live post', 'tags: post', 'date: "2026-11-01"']),
    'posts/2026/2026-11-20-held.md': page(['title: Held post', 'tags: post', 'date: "2026-11-20"']),
    'posts/2026/2026-12-25-later.md': page(['title: Later post', 'tags: post', 'date: "2026-12-25"']),
    'posts/2026/2026-11-05-draft.md': page(['title: Draft post', 'tags: post', 'date: "2026-11-05"', 'draft: true']),
    'portfolio/2026-11-02-piece.md': page(['title: Draft piece', 'tags: portfolio', 'date: "2030-01-01"', 'draft: true']),
    'portfolio/2030-01-01-future-piece.md': page(['title: Future piece', 'tags: portfolio', 'date: "2030-01-01"']),
    'sides/thing.md': page(['title: Draft side project', 'draft: true']),
    'about.md': page(['title: About', 'date: "2020-01-01"']),
    '_includes/partial.md': page(['title: Not a page', 'draft: true']),
    '_data/wisdom-entries.yaml': [
      'entries:',
      '  - added: "2026-11-01"',
      '    tags: [craft]',
      '    body: Published wisdom.',
      '  - added: "2026-11-02"',
      '    tags: [craft]',
      '    draft: true',
      '    body: |',
      '      A draft thought that runs on for rather longer than sixty characters in all.',
      '',
    ].join('\n'),
  });

  const lines = formatUnpublished(listUnpublished({ srcDir: src, now: NOW }));
  const rel = (name) => path.join(src, name);
  assert.deepStrictEqual(lines, [
    `⏳ Held until 2026-11-20: Held post (${rel('posts/2026/2026-11-20-held.md')})`,
    `⏳ Held until 2026-12-25: Later post (${rel('posts/2026/2026-12-25-later.md')})`,
    `✏️  Draft, not published: Draft piece (${rel('portfolio/2026-11-02-piece.md')})`,
    `✏️  Draft, not published: Draft post (${rel('posts/2026/2026-11-05-draft.md')})`,
    `✏️  Draft, not published: Draft side project (${rel('sides/thing.md')})`,
    `✏️  Draft, not published: Wisdom: A draft thought that runs on for rather longer than sixty… (${rel('_data/wisdom-entries.yaml')})`,
  ]);
});

test('a site with nothing held or in draft prints no lines', (t) => {
  const src = scratch(t, {
    'posts/2026/2026-11-01-live.md': page(['title: Live post', 'tags: post', 'date: "2026-11-01"']),
  });
  assert.deepStrictEqual(formatUnpublished(listUnpublished({ srcDir: src, now: NOW })), []);
});

// The rule above only matters if Eleventy obeys it. Build a scratch site with
// the site's own preprocessor and date parsing, without writing any output,
// and list the pages Eleventy would make.
function builtUrls(root, runMode) {
  const script = `
    const { default: Eleventy } = await import('@11ty/eleventy');
    const elev = new Eleventy(${JSON.stringify(path.join(root, 'src'))}, ${JSON.stringify(path.join(root, '_site'))}, {
      configPath: ${JSON.stringify(path.join(root, 'eleventy.config.js'))},
      runMode: ${JSON.stringify(runMode)},
      quietMode: true,
    });
    const pages = await elev.toJSON();
    process.stdout.write(JSON.stringify(pages.map((p) => p.url).sort()));
  `;
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  delete env.ELEVENTY_RUN_MODE;
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', script], { cwd: REPO, env, encoding: 'utf8' });
  assert.strictEqual(run.status, 0, run.stderr);
  return JSON.parse(run.stdout);
}

test('Eleventy leaves drafts and held posts out of a production build and shows them in dev', (t) => {
  const root = scratch(t, {
    'eleventy.config.js': [
      `const configurePreprocessors = require(${JSON.stringify(path.join(REPO, 'eleventy/config/preprocessors.js'))});`,
      `const configureDateParsing = require(${JSON.stringify(path.join(REPO, 'eleventy/config/date-parsing.js'))});`,
      'module.exports = function (eleventyConfig) {',
      '  configureDateParsing(eleventyConfig);',
      '  configurePreprocessors(eleventyConfig);',
      '};',
      '',
    ].join('\n'),
    'src/live.md': page(['title: Live', 'tags: post', 'date: "2020-01-01"', 'permalink: /live/']),
    'src/held.md': page(['title: Held', 'tags: post', 'date: "2999-01-01"', 'permalink: /held/']),
    'src/draft.md': page(['title: Draft', 'tags: post', 'date: "2020-01-02"', 'draft: true', 'permalink: /draft/']),
    'src/draft-page.md': page(['title: Draft page', 'draft: true', 'permalink: /draft-page/']),
    'src/future-page.md': page(['title: Future page', 'date: "2999-01-01"', 'permalink: /future-page/']),
  });

  assert.deepStrictEqual(builtUrls(root, 'build'), ['/future-page/', '/live/']);
  assert.deepStrictEqual(builtUrls(root, 'serve'), ['/draft-page/', '/draft/', '/future-page/', '/held/', '/live/']);
});
