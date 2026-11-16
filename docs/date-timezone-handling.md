# Date and Timezone Handling

## Authoring (the one method)

For new and edited posts, use a **quoted date-only** value that matches the `YYYY-MM-DD` in the filename:

```yaml
date: "2025-10-08"
```

`addDateParsing` treats that as midnight in **America/Los_Angeles**. Permalinks and on-page dates use that calendar day. Do not leave the value unquoted (`date: 2025-10-08` or `date: 2025-10-08T20:00:00.000Z`) — js-yaml turns those into JS `Date`s, and evening UTC clock faces can show the next day when formatted outside Pacific.

`pnpm run test frontmatter` rejects unquoted YAML dates sitewide, and for blog posts (`tags: post`) requires the front-matter date's Pacific day, the day the URL carries, to match the filename day. Its message gives the exact rename and the exact date to set. Portfolio items may keep a different front-matter date (those layouts do not show the date).

On-page `postDate` / `postDateAttr` always format in America/Los_Angeles (same zone as permalinks). Never rely on `new Date("YYYY-MM-DD")` — that is UTC midnight and shows the previous day in Pacific.

The three feeds print dates with the RSS plugin's `dateToRfc822("America/Los_Angeles")`, so a post dated `2026-10-28` reads `Wed, 28 Oct 2026 00:00:00 -0700`. Always pass the zone: without it the plugin prints in the build machine's zone, and the feed's text would change with where it was built. A wisdom entry's `added` is text, so `wisdom-feed.njk` runs it through `dateToRfc3339` first, which reads it as midnight Pacific.

The home page merge (`eleventy/utils/merge-posts-links.js`) follows the same rule. It is handed each post's `data.date` as front matter text and each link's date as a `links.yaml` key, and reads both as midnight Pacific on that day (`readPostDate`, `linkDate`). A key reaches it as `YYYY-MM-DD` text whether or not the file quotes it: Eleventy reads YAML data files with js-yaml's JSON schema (`readYamlData()` in `eleventy/config/data-extensions.js`), which never makes a Date.

If an older unquoted UTC-midnight timestamp already published on the previous LA day, keep that live URL: rename the filename, `date`, and OG basename to the published day. Do not 301 away from it.

Full ISO with offset (`"2025-10-08T12:00:00-07:00"`) still parses for older posts. Do not use it for new work; it adds a DST offset to remember and is not needed for display or URLs.

## Dating a post ahead

A post dated after today's Pacific day is held: left out of production builds, shown on the dev server, and published by the first build on or after its day. The rule is `publishState()` in `eleventy/utils/publish-state.js`, used by the draft preprocessor and by the line the build prints for each item left out. It compares Pacific calendar days, so the machine's time zone doesn't matter. Guard: `pnpm run test publish-state`.

## Load-bearing build behavior

Date handling preserves WordPress-era URLs: `eleventy/config/date-parsing.js` (`addDateParsing`) plus permalink generation in `src/posts/posts.11tydata.js`. Do not change date logic or existing post URLs without verifying every permalink remains unchanged. Portfolio pieces don't use it: since 2026-11-08 they live in `src/portfolio/` and build at `/portfolio/<slug>/` (`src/portfolio/portfolio.11tydata.js`), so their dates set nothing in the URL.

`pnpm run test post-urls` is the guard. It runs every post through the real parser and permalink code, in four machine time zones, and fails if any post would build anywhere but the URL its filename stands for. Run it after any change that touches dates.
