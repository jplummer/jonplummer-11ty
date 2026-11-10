/**
 * How many items each feed carries, newest first.
 *
 * Small on purpose (Jon, 2026-11-10): subscribing to a feed shouldn't bring a
 * flood of old items. A reader keeps what it has already fetched, so a short
 * feed takes nothing from existing subscribers. The one cost: more items
 * published between two checks than the feed holds, and the oldest of them
 * are never seen. The largest links import so far was 16.
 *
 * `pnpm run test rss` fails a feed that carries more than its number.
 */
module.exports = {
  posts: 5, // feed.xml
  links: 20, // links-feed.xml
  wisdom: 5, // wisdom-feed.xml
};
