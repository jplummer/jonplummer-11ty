#!/usr/bin/env node

/**
 * Unit tests for scripts/content/import-noteplan-links.js, which reads the
 * "Links to import" note from NotePlan and rewrites src/_data/links.yaml.
 * Requiring the script runs nothing; these call its functions with text.
 * The real links.yaml is read, never written.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const {
  parseLink,
  parseNotePlanNote,
  parseLinksYaml,
  addLinksToData,
  formatLinksYaml,
  readNote,
  resolveTargetDate,
} = require('../content/import-noteplan-links');

const LINKS_YAML = path.join(__dirname, '..', '..', 'src', '_data', 'links.yaml');

test('a standard line gives the title, URL, and description', () => {
  assert.deepStrictEqual(
    parseLink('* [Time\'s Up, Babycakes – Blair Enns](https://example.com/times-up/) Value-based pricing matters more now.'),
    {
      url: 'https://example.com/times-up/',
      title: 'Time\'s Up, Babycakes – Blair Enns',
      description: 'Value-based pricing matters more now.',
    }
  );
});

test('a line with nothing after the link has no description', () => {
  assert.deepStrictEqual(parseLink('- [A title](https://example.com/a)'), {
    url: 'https://example.com/a',
    title: 'A title',
    description: undefined,
  });
});

test('a link inside the description stays in the description', () => {
  const link = parseLink('* [A title](https://example.com/a) See the [podcast](https://example.com/pod) too.');
  assert.strictEqual(link.url, 'https://example.com/a');
  assert.strictEqual(link.description, 'See the [podcast](https://example.com/pod) too.');
});

test('invisible characters NotePlan pastes around a URL are removed', () => {
  const link = parseLink('* [A title](﻿https://example.com/a￼ ) note');
  assert.strictEqual(link.url, 'https://example.com/a');
});

test('a note gives its bulleted links in order and skips the heading and blank lines', () => {
  const note = [
    '# Links to import',
    '',
    '* [One](https://example.com/1) first',
    '- [Two](https://example.com/2)',
    '• [Three](https://example.com/3) third',
    '',
  ].join('\n');
  assert.deepStrictEqual(
    parseNotePlanNote(note).map((link) => link.url),
    ['https://example.com/1', 'https://example.com/2', 'https://example.com/3']
  );
});

test('a URL already in the file is skipped, under any date', () => {
  const data = { '2026-01-01': [{ url: 'https://example.com/old', title: 'Old' }] };
  const results = addLinksToData(data, '2026-01-05', [
    { url: 'https://example.com/old', title: 'Old again' },
    { url: 'https://example.com/new', title: 'New' },
  ]);
  assert.deepStrictEqual(results.added.map((link) => link.url), ['https://example.com/new']);
  assert.deepStrictEqual(
    results.skipped.map(({ link, existingDate }) => [link.url, existingDate]),
    [['https://example.com/old', '2026-01-01']]
  );
  assert.deepStrictEqual(data['2026-01-05'].map((link) => link.url), ['https://example.com/new']);
});

test('the same URL twice in one note is added once', () => {
  const data = {};
  const results = addLinksToData(data, '2026-01-05', [
    { url: 'https://example.com/a', title: 'A' },
    { url: 'https://example.com/a', title: 'A again' },
  ]);
  assert.strictEqual(results.added.length, 1);
  assert.strictEqual(results.skipped.length, 1);
  assert.strictEqual(data['2026-01-05'].length, 1);
});

test('new links join the end of a date that already has links', () => {
  const data = { '2026-01-05': [{ url: 'https://example.com/a', title: 'A' }] };
  addLinksToData(data, '2026-01-05', [{ url: 'https://example.com/b', title: 'B' }]);
  assert.deepStrictEqual(
    data['2026-01-05'].map((link) => link.url),
    ['https://example.com/a', 'https://example.com/b']
  );
});

test('the file is written newest date first, with a blank line between dates', () => {
  const text = formatLinksYaml({
    '2026-01-01': [{ url: 'https://example.com/a', title: 'A' }],
    '2026-03-01': [{ url: 'https://example.com/c', title: 'C', description: 'Third' }],
    '2026-02-01': [{ url: 'https://example.com/b', title: 'B' }],
  });
  assert.deepStrictEqual(
    text.split('\n').filter((line) => /^\d{4}-/.test(line)),
    ['2026-03-01:', '2026-02-01:', '2026-01-01:']
  );
  assert.ok(text.includes('\n\n2026-02-01:'), 'dates are separated by a blank line');
  assert.ok(text.endsWith('\n') && !text.endsWith('\n\n'), 'the file ends with one newline');
});

test('quotes, colons, and apostrophes survive being written and read back', () => {
  const link = {
    url: 'https://example.com/a?b=1&c=2',
    title: 'Comment: "Feeling sad" – it\'s complicated',
    description: 'He said "it\'s fine": a note with a \\ backslash.',
  };
  const text = formatLinksYaml({ '2026-01-01': [link] });
  // JSON_SCHEMA keeps the date key a string; the default schema makes it a Date.
  assert.deepStrictEqual(yaml.load(text, { schema: yaml.JSON_SCHEMA })['2026-01-01'], [link]);
  assert.deepStrictEqual(parseLinksYaml(text)['2026-01-01'], [link]);
});

// Every import rewrites the whole file through parseLinksYaml and
// formatLinksYaml. Anything the hand-written parser misreads is lost or
// changed for every link already published, so the real file is the fixture.
test('the script reads the real links.yaml the same way a YAML parser does', () => {
  const text = fs.readFileSync(LINKS_YAML, 'utf8');
  const fromYaml = yaml.load(text, { schema: yaml.JSON_SCHEMA });
  const fromScript = parseLinksYaml(text);
  assert.ok(Object.keys(fromYaml).length > 0, 'links.yaml has dates');
  assert.deepStrictEqual(fromScript, fromYaml);
});

test('rewriting the real links.yaml changes nothing', () => {
  const text = fs.readFileSync(LINKS_YAML, 'utf8');
  assert.strictEqual(formatLinksYaml(parseLinksYaml(text)), text);
});

// The cases below each lost or damaged a link until 2026-11-10.

test('a URL with parentheses is read whole', () => {
  assert.deepStrictEqual(
    parseLink('* [Dongle – Wikipedia](https://en.wikipedia.org/wiki/Dongle_(disambiguation)) A note (with an aside).'),
    {
      url: 'https://en.wikipedia.org/wiki/Dongle_(disambiguation)',
      title: 'Dongle – Wikipedia',
      description: 'A note (with an aside).',
    }
  );
});

test('a title with square brackets is read whole', () => {
  assert.deepStrictEqual(parseLink('* [Review: [REC] – Someone](https://example.com/rec) Scary.'), {
    url: 'https://example.com/rec',
    title: 'Review: [REC] – Someone',
    description: 'Scary.',
  });
});

test('bracketed text before the link is not taken for the link', () => {
  const link = parseLink('* [sic] [The title](https://example.com/a) note');
  assert.strictEqual(link.title, 'The title');
  assert.strictEqual(link.url, 'https://example.com/a');
});

test('a line that holds a URL but was not imported is reported with its line number', () => {
  const note = [
    '# Links to import',
    '',
    '* [Fine](https://example.com/fine) imported',
    '1. [Numbered](https://example.com/numbered)',
    '[No bullet](https://example.com/bare)',
    '* https://example.com/no-title just pasted',
    '* [Never closed](https://example.com/open',
    'A plain sentence with no address in it.',
  ].join('\n');
  const { links, unread } = readNote(note);
  assert.deepStrictEqual(links.map((link) => link.url), ['https://example.com/fine']);
  assert.deepStrictEqual(unread.map((line) => line.number), [4, 5, 6, 7]);
  assert.strictEqual(unread[0].text, '1. [Numbered](https://example.com/numbered)');
});

test('a note that imports cleanly reports no unread lines', () => {
  const { links, unread } = readNote('# Links to import\n\n* [A](https://example.com/a) note\n- [B](https://example.com/b)\n');
  assert.strictEqual(links.length, 2);
  assert.deepStrictEqual(unread, []);
});

test("today's date is the Pacific calendar day, not the UTC one", () => {
  // 5:30 pm PST on Nov 10 is already Nov 11 in UTC.
  assert.strictEqual(resolveTargetDate([], new Date('2026-11-11T01:30:00Z')), '2026-11-10');
  // One minute either side of Pacific midnight in summer (PDT, UTC-7).
  assert.strictEqual(resolveTargetDate([], new Date('2026-07-01T06:59:00Z')), '2026-06-30');
  assert.strictEqual(resolveTargetDate([], new Date('2026-07-01T07:00:00Z')), '2026-07-01');
});

test('--date is read with an equals sign or a space', () => {
  const now = new Date('2026-11-11T01:30:00Z');
  assert.strictEqual(resolveTargetDate(['--date=2025-12-25'], now), '2025-12-25');
  assert.strictEqual(resolveTargetDate(['--clear', '--date', '2025-12-25'], now), '2025-12-25');
});

test('a --date that is not a real YYYY-MM-DD day is refused', () => {
  const now = new Date('2026-11-11T01:30:00Z');
  for (const args of [['--date=tomorrow'], ['--date=2025-13-01'], ['--date=2025-02-30'], ['--date'], ['--date', '--clear']]) {
    assert.throws(() => resolveTargetDate(args, now), /--date/, `expected ${JSON.stringify(args)} to be refused`);
  }
});

test("two apostrophes in a row survive being read back from the file", () => {
  const link = { url: 'https://example.com/a', title: "The ''scare quotes'' piece: part 2" };
  assert.deepStrictEqual(parseLinksYaml(formatLinksYaml({ '2026-01-01': [link] }))['2026-01-01'], [link]);
});

test('a links file that is not valid YAML stops the import', () => {
  assert.throws(() => parseLinksYaml('2026-01-01:\n  - url: "https://example.com/a\n    title: A\n'));
});
