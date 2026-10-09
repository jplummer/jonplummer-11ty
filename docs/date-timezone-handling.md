# Date and Timezone Handling

## Authoring (the one method)

For new and edited posts, use a **quoted date-only** value that matches the `YYYY-MM-DD` in the filename:

```yaml
date: "2025-10-08"
```

`addDateParsing` treats that as midnight in **America/Los_Angeles**. Permalinks and on-page dates use that calendar day. Do not leave the value unquoted (`date: 2025-10-08` or `date: 2025-10-08T20:00:00.000Z`) — js-yaml turns those into JS `Date`s, and evening UTC clock faces can show the next day when formatted outside Pacific.

`pnpm run test frontmatter` rejects unquoted YAML dates sitewide, and for blog posts (`tags: post`) requires the front-matter calendar day to match the filename day. Portfolio items may keep a different front-matter date (those layouts do not show the date).

Full ISO with offset (`"2025-10-08T12:00:00-07:00"`) still parses for older posts. Do not use it for new work; it adds a DST offset to remember and is not needed for display or URLs.

## Load-bearing build behavior

Date handling preserves WordPress-era URLs: `eleventy/config/date-parsing.js` (`addDateParsing`) plus permalink generation in `src/_posts/_posts.11tydata.js`. Do not change date logic or existing post URLs without verifying every permalink remains unchanged.
