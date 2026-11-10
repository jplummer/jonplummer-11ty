#!/usr/bin/env node

/**
 * Unit tests for eleventy/utils/merge-posts-links.js, which decides where each
 * link from links.yaml lands among the posts on the home page and /page/N/,
 * and which links reach links-feed.xml.
 *
 * Dates are built the way the site builds them: a post's date is midnight in
 * America/Los_Angeles (eleventy/config/date-parsing.js), and a link's date is
 * its YYYY-MM-DD key read by `new Date()`, which is midnight UTC.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { DateTime } = require('luxon');
const { mergePostsAndLinks, newestLinks } = require('../../eleventy/utils/merge-posts-links');

const post = (day) => ({
  url: `/post/${day}/`,
  data: { date: DateTime.fromISO(day, { zone: 'America/Los_Angeles' }).toJSDate() },
});
const link = (name) => ({ url: `https://example.com/${name}`, title: name });

/** What a page shows, top to bottom: 'post 2026-03-10' or 'link a'. */
const shown = (items) =>
  items.map((item) => (item.type === 'post' ? `post ${item.data.url.slice(6, 16)}` : `link ${item.data.title}`));

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

// A post whose front matter gives a time can land on the very instant of a
// link's date (midnight UTC). The two comparisons that split links between
// pages must agree there, or the link shows on two pages or on none.
test('a link at the same instant as a post is shown once, after that post', () => {
  const utcPost = (day) => ({ url: `/post/${day}/`, data: { date: new Date(day) } });
  const posts = [utcPost('2026-03-10'), utcPost('2026-03-05'), utcPost('2026-03-01')];
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
  assert.strictEqual(feed[0].date.toISOString(), '2026-03-10T00:00:00.000Z');
});

test('a limit larger than the file gives every link, and no links gives none', () => {
  assert.strictEqual(newestLinks({ '2026-03-10': [link('a'), link('b')] }, 20).length, 2);
  assert.deepStrictEqual(newestLinks(undefined, 20), []);
  assert.deepStrictEqual(newestLinks({}, 20), []);
});

// Eleventy reads links.yaml with js-yaml's default schema, which turns each
// date key into a Date and then into a long string such as
// "Tue Mar 10 2026 …". The feed must read those as it reads YYYY-MM-DD.
test('the feed reads date keys in the form Eleventy hands them over', () => {
  const links = {
    [String(new Date('2026-03-01'))]: [link('old')],
    [String(new Date('2026-03-10'))]: [link('new')],
  };
  const feed = newestLinks(links, 1);
  assert.deepStrictEqual(feed.map((item) => item.data.title), ['new']);
  assert.strictEqual(feed[0].date.toISOString(), '2026-03-10T00:00:00.000Z');
});

test('the feed needs a whole number for its limit', () => {
  assert.throws(() => newestLinks({ '2026-03-10': [link('a')] }, undefined), /limit/);
});
