#!/usr/bin/env node

/**
 * Unit tests for eleventy/utils/merge-posts-links.js, which decides where each
 * link from links.yaml lands among the posts on the home page and /page/N/,
 * and which links reach links-feed.xml.
 *
 * Dates arrive the way the site hands them over. A post's `data.date` is its
 * front matter text, usually "YYYY-MM-DD", and a link's date is its links.yaml
 * key. Both are read as midnight in America/Los_Angeles, so a post and a link
 * on one day share an instant.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { DateTime } = require('luxon');
const fs = require('fs');
const path = require('path');
const { mergePostsAndLinks, newestLinks, linkDate } = require('../../eleventy/utils/merge-posts-links');
const { readYamlData } = require('../../eleventy/config/data-extensions');

const post = (day) => ({ url: `/post/${day}/`, data: { date: day } });
/** The same post with its date already a Date, as some callers pass it. */
const parsedPost = (day) => ({
  url: `/post/${day}/`,
  data: { date: DateTime.fromISO(day, { zone: 'America/Los_Angeles' }).toJSDate() },
});
const link = (name) => ({ url: `https://example.com/${name}`, title: name });

/** What a page shows, top to bottom: 'post 2026-03-10' or 'link a'. */
const shown = (items) =>
  items.map((item) => (item.type === 'post' ? `post ${item.data.url.slice(6, 16)}` : `link ${item.data.title}`));

/** The instant the merge gives the first of these posts. */
const pages0Date = (posts) => mergePostsAndLinks(posts, {}, 0, null)[0].date.getTime();

/** Split posts into pages and merge each, the way src/index.11tydata.js does. */
function paginate(posts, links, size) {
  const pages = [];
  for (let i = 0; i < posts.length; i += size) pages.push(posts.slice(i, i + size));
  return pages.map((pagePosts, pageNumber) => {
    const next = pages[pageNumber + 1];
    return mergePostsAndLinks(pagePosts, links, pageNumber, next ? next[0].data.date : null);
  });
}

test('with no links file, the posts are returned as posts', () => {
  const items = mergePostsAndLinks([post('2026-03-10'), post('2026-03-01')], undefined, 0, null);
  assert.deepStrictEqual(shown(items), ['post 2026-03-10', 'post 2026-03-01']);
});

test('no posts gives an empty page, with or without links', () => {
  assert.deepStrictEqual(mergePostsAndLinks(undefined, { '2026-03-05': [link('a')] }, 0, null), []);
  assert.deepStrictEqual(mergePostsAndLinks([], { '2026-03-05': [link('a')] }, 0, null), []);
});

test('a link dated between two posts sits between them', () => {
  const items = mergePostsAndLinks(
    [post('2026-03-10'), post('2026-03-01')],
    { '2026-03-05': [link('a')] },
    0,
    null
  );
  assert.deepStrictEqual(shown(items), ['post 2026-03-10', 'link a', 'post 2026-03-01']);
});

test('posts given oldest first still come out newest first', () => {
  const items = mergePostsAndLinks(
    [post('2026-03-01'), post('2026-03-10')],
    { '2026-03-05': [link('a')] },
    0,
    null
  );
  assert.deepStrictEqual(shown(items), ['post 2026-03-10', 'link a', 'post 2026-03-01']);
});

test('on the first page, links newer than the newest post come first', () => {
  const items = mergePostsAndLinks([post('2026-03-10')], { '2026-03-12': [link('new')] }, 0, null);
  assert.deepStrictEqual(shown(items), ['link new', 'post 2026-03-10']);
});

test('on a later page, links newer than its newest post are left to the page before', () => {
  const items = mergePostsAndLinks([post('2026-03-10')], { '2026-03-12': [link('new')] }, 1, null);
  assert.deepStrictEqual(shown(items), ['post 2026-03-10']);
});

// docs/agent-memory.md: links-feed.njk must pass 0, or the feed stops at the
// newest post's date and looks frozen.
test('without a page number, links newer than the newest post are left out', () => {
  const items = mergePostsAndLinks([post('2026-03-10')], { '2026-03-12': [link('new')] });
  assert.deepStrictEqual(shown(items), ['post 2026-03-10']);
});

test('a link dated the same day as a post follows that post', () => {
  const items = mergePostsAndLinks(
    [post('2026-03-10'), post('2026-03-01')],
    { '2026-03-10': [link('same-day')] },
    0,
    null
  );
  assert.deepStrictEqual(shown(items), ['post 2026-03-10', 'link same-day', 'post 2026-03-01']);
});

test('links older than the last post stop at the next page’s first post', () => {
  const links = {
    '2026-03-08': [link('this-page')],
    '2026-03-05': [link('same-day-as-next-page')],
    '2026-03-02': [link('next-page')],
  };
  const items = mergePostsAndLinks([post('2026-03-10')], links, 0, post('2026-03-05').data.date);
  assert.deepStrictEqual(shown(items), ['post 2026-03-10', 'link this-page']);
});

test('on the last page, every older link follows the last post', () => {
  const items = mergePostsAndLinks(
    [post('2026-03-10')],
    { '2026-03-08': [link('a')], '2019-01-01': [link('ancient')] },
    3,
    null
  );
  assert.deepStrictEqual(shown(items), ['post 2026-03-10', 'link a', 'link ancient']);
});

test('links that share a date keep their order, and only the last is marked last in its group', () => {
  const items = mergePostsAndLinks(
    [post('2026-03-10')],
    { '2026-03-08': [link('one'), link('two'), link('three')] },
    0,
    null
  );
  const links = items.filter((item) => item.type === 'link');
  assert.deepStrictEqual(links.map((item) => item.data.title), ['one', 'two', 'three']);
  assert.deepStrictEqual(links.map((item) => item.data.isLastInGroup), [false, false, true]);
});

test('merging does not change the links it was given', () => {
  const links = { '2026-03-08': [link('one')] };
  mergePostsAndLinks([post('2026-03-10')], links, 0, null);
  assert.deepStrictEqual(links, { '2026-03-08': [link('one')] });
});

// The property the home page depends on: across all the pages, every link is
// shown once. A link shown twice, or on no page, is an authoring loss nobody
// would see. The fixture puts links on post days, on page-boundary days,
// before the oldest post, after the newest, and between two posts that share
// a day.
test('across every page, each link is shown exactly once and in date order', () => {
  const days = [
    '2026-03-28', '2026-03-25', '2026-03-25', '2026-03-20', '2026-03-15',
    '2026-03-10', '2026-03-10', '2026-03-05', '2026-03-01', '2026-02-20',
    '2026-02-10',
  ];
  const posts = days.map(post);
  const links = {};
  const names = [];
  for (let day = 1; day <= 31; day++) {
    for (const month of ['02', '03']) {
      if (month === '02' && day > 28) continue;
      const key = `2026-${month}-${String(day).padStart(2, '0')}`;
      links[key] = [link(`${key}-a`), link(`${key}-b`)];
      names.push(`${key}-a`, `${key}-b`);
    }
  }

  for (const size of [1, 2, 3, 5, 11]) {
    const pages = paginate(posts, links, size);
    const placed = pages.flatMap((items) => items.filter((item) => item.type === 'link').map((item) => item.data.title));
    assert.deepStrictEqual([...placed].sort(), [...names].sort(), `page size ${size}: every link once`);

    const postsShown = pages.flatMap((items) => items.filter((item) => item.type === 'post')).length;
    assert.strictEqual(postsShown, posts.length, `page size ${size}: every post once`);

    const dates = pages.flat().map((item) => item.date.getTime());
    assert.deepStrictEqual(dates, [...dates].sort((a, b) => b - a), `page size ${size}: newest first across pages`);
  }
});

// A post with a date-only value and a link on the same day share one instant,
// midnight Pacific. The two comparisons that split links between pages must
// agree there, or the link shows on two pages or on none.
test('a link at the same instant as a post is shown once, after that post', () => {
  const posts = [post('2026-03-10'), post('2026-03-05'), post('2026-03-01')];
  assert.strictEqual(pages0Date(posts), linkDate('2026-03-10').getTime());
  const links = { '2026-03-10': [link('ten')], '2026-03-05': [link('five')], '2026-03-01': [link('one')] };

  for (const size of [1, 2, 3]) {
    const pages = paginate(posts, links, size);
    assert.deepStrictEqual(
      shown(pages.flat()),
      ['post 2026-03-10', 'link ten', 'post 2026-03-05', 'link five', 'post 2026-03-01', 'link one'],
      `page size ${size}`
    );
  }
});

// links-feed.xml: the newest links and no more, so a new subscriber gets a
// recent handful and not every link since 2025.
test('the feed takes the newest links, newest date first, up to its limit', () => {
  const links = {
    '2026-03-01': [link('old-1'), link('old-2')],
    '2026-03-10': [link('new-1'), link('new-2')],
    '2026-03-05': [link('mid-1')],
  };
  const feed = newestLinks(links, 4);
  assert.deepStrictEqual(feed.map((item) => item.data.title), ['new-1', 'new-2', 'mid-1', 'old-1']);
  assert.deepStrictEqual(feed.map((item) => item.type), ['link', 'link', 'link', 'link']);
  assert.strictEqual(feed[0].date.toISOString(), '2026-03-10T07:00:00.000Z'); // midnight PDT
});

test('a limit larger than the file gives every link, and no links gives none', () => {
  assert.strictEqual(newestLinks({ '2026-03-10': [link('a'), link('b')] }, 20).length, 2);
  assert.deepStrictEqual(newestLinks(undefined, 20), []);
  assert.deepStrictEqual(newestLinks({}, 20), []);
});

// Eleventy reads links.yaml through readYamlData(). Until 2026-11-15 it used
// js-yaml's default schema, which turned an unquoted date key into a Date and
// then into a long string such as "Tue Mar 10 2026 …", printed in the build
// machine's time zone. The key must stay the text the file has.
test('Eleventy hands over an unquoted date key as YYYY-MM-DD text', () => {
  const links = readYamlData('2026-03-01:\n  - url: https://example.com/old\n    title: old\n"2026-03-10":\n  - url: https://example.com/new\n    title: new\n');
  assert.deepStrictEqual(Object.keys(links), ['2026-03-01', '2026-03-10']);
  const feed = newestLinks(links, 1);
  assert.deepStrictEqual(feed.map((item) => item.data.title), ['new']);
  assert.strictEqual(feed[0].date.toISOString(), '2026-03-10T07:00:00.000Z'); // midnight PDT
});

test('every key of the real links.yaml reaches the merge as a date it can read', () => {
  const file = path.join(__dirname, '..', '..', 'src', '_data', 'links.yaml');
  const keys = Object.keys(readYamlData(fs.readFileSync(file, 'utf8')));
  assert.ok(keys.length > 50, `expected the real file's keys, got ${keys.length}`);
  for (const key of keys) {
    assert.match(key, /^\d{4}-\d{2}-\d{2}$/);
    assert.strictEqual(linkDate(key).toISOString().slice(0, 4), key.slice(0, 4));
  }
});

// A data file never gets a Date from YAML, whatever it holds.
test('a YAML data file gives text for a date, never a Date', () => {
  const data = readYamlData('when: 2026-03-10\nstamp: 2026-03-10T08:00:00Z\ncount: 3\non: true\n');
  assert.deepStrictEqual(data, { when: '2026-03-10', stamp: '2026-03-10T08:00:00Z', count: 3, on: true });
});

// Until 2026-11-13 a link's date was midnight UTC, which is 4 or 5 pm the day
// before in Pacific time. The links feed and the /page/N/ titles format dates
// in Pacific time, so each link showed a day early.
test('a link date key is midnight Pacific on its day', () => {
  assert.strictEqual(linkDate('2026-03-10').toISOString(), '2026-03-10T07:00:00.000Z'); // PDT
  assert.strictEqual(linkDate('2026-01-15').toISOString(), '2026-01-15T08:00:00.000Z'); // PST
});

test('a link date reads back as its own day in Pacific time, all year', () => {
  const { formatPostDateAttr } = require('../../eleventy/utils/date-utils');
  for (const day of ['2026-01-01', '2026-03-08', '2026-03-09', '2026-07-04', '2026-11-01', '2026-11-02', '2026-12-31']) {
    assert.strictEqual(formatPostDateAttr(linkDate(day)), day);
  }
});

test('a key that is not a date is refused by name', () => {
  assert.throws(() => linkDate('someday'), /"someday" is not a date/);
  assert.throws(() => newestLinks({ '2026-13-45': [link('a')] }, 5), /2026-13-45/);
  // The long string a Date key turns into is refused too: its day depends on
  // the zone of the machine that printed it.
  assert.throws(() => linkDate(String(new Date('2026-03-10'))), /is not a date/);
});

// A post written at 8:30 pm Pacific on the 9th is later than midnight UTC on
// the 10th, so a link dated the 10th used to sit below it.
test('a link sits above a post written the evening before', () => {
  const evening = { url: '/post/2026-03-09/', data: { date: '2026-03-09T20:30:00-07:00' } };
  const items = mergePostsAndLinks([evening, post('2026-03-01')], { '2026-03-10': [link('a')] }, 0, null);
  assert.deepStrictEqual(shown(items), ['link a', 'post 2026-03-09', 'post 2026-03-01']);
});

// Until 2026-11-15 the merge read a date-only post as midnight UTC, the day
// before in Pacific time, so a /page/N/ title that started or ended on such a
// post was a day early.
test('a post keeps its own Pacific day, as text or as a Date', () => {
  const { formatPostDateAttr } = require('../../eleventy/utils/date-utils');
  for (const make of [post, parsedPost]) {
    const items = mergePostsAndLinks([make('2026-03-10'), make('2026-01-15')], {}, 1, null);
    assert.deepStrictEqual(items.map((item) => formatPostDateAttr(item.date)), ['2026-03-10', '2026-01-15']);
    assert.strictEqual(items[0].date.toISOString(), '2026-03-10T07:00:00.000Z');
  }
});

test('a link on a post\'s day follows it, whichever form the post\'s date takes', () => {
  const links = { '2026-03-10': [link('ten')], '2026-03-05': [link('five')] };
  for (const make of [post, parsedPost]) {
    const pages = paginate([make('2026-03-10'), make('2026-03-05')], links, 1);
    assert.deepStrictEqual(pages.map(shown), [['post 2026-03-10', 'link ten'], ['post 2026-03-05', 'link five']]);
  }
});

test('the feed needs a whole number for its limit', () => {
  assert.throws(() => newestLinks({ '2026-03-10': [link('a')] }, undefined), /limit/);
});
