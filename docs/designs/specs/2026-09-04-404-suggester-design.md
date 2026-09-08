# "Did you mean" suggester for /404

Status: approved, not yet implemented
Date: 2026-09-04

## What this is for

Nearly every 404 is a near miss. Someone truncates a URL pasting it out of a chat
client, drops a character typing from memory, or follows a link that lost its
trailing slash. The address is wrong but the intent is recoverable, and right now
the page throws all of that away: it apologizes, lists five recent posts, and asks
the visitor to report the broken link.

Apache serves an ErrorDocument at whatever URL failed rather than at the page's own
output path, so `location.pathname` in the browser holds the exact address that
missed. That is the one piece of information the page has and does not use.

This adds a suggester that reads the failed path, compares it against every real
destination on the site, and offers the closest few when any of them are close
enough. When nothing is close, it says so.

Scope is deliberately narrow. This targets typos and truncation. Recovering
WordPress-era URLs is a different problem with a different shape, and
`src/_data/redirects.yaml` is already the right place for known moves. This is not
site search, and it appears on no other page.

## Decisions and why

**Titles matter more than reusing an existing file.** `sitemap.xml` looked like a
free index, but it carries only `<loc>` and `<lastmod>`. Suggestions built from it
would read as raw URLs rather than "Care has to show up in the product", which is
most of the value. It also carries 38 `/page/N/` routes nobody links to, leaving 257 real
destinations.

**The index ships as JavaScript, not JSON.** Measured against the current build,
257 entries come to 23.8KB raw and 7.4KB gzipped. `application/javascript` is in
the `mod_deflate` list in `src/.htaccess.njk`; `application/json` is not, and
adding it speculatively is not worth it when a script file works. Shipping the data
inside a real script also sidesteps a question about how `script-src 'self'` treats
a `<script type="application/json">` data block, which would otherwise need
testing on the live host.

**The index is generated; the logic is not.** An Eleventy template over collections
cannot go stale. A generated logic file can, and the site already carries that
failure mode: `eleventy/config/shortcodes.js:33` exists to tell you to re-run
`pnpm run font-gallery` when `font-lab-card.fragment.html` is missing. The matcher
is small enough to hand-write, so it is hand-written and unit tested.

## Components

### The index: `src/404-index.njk`

Front matter sets `permalink: /assets/js/404-index.js` and
`eleventyExcludeFromCollections: true`. The body walks the same collections
`src/sitemap.njk` walks, in the same order, with two differences: it skips the
pagination block at the end, and it emits a title alongside each URL.

Covered: the home page, `collections.page` excluding the two entries whose
`purpose` is `404` or `500`, `/wisdom/` and one entry per `wisdom.allTags` tag,
`/portfolio/`, `/sides/`, then every item in `collections.post`,
`collections.portfolio`, and `collections.sideproject`.

Output is a single assignment:

```js
window.jp404Index=[["/2026/08/12/care-has-to-show-up-in-the-product/","Care has to show up in the product"],...];
```

Pairs rather than objects, because 257 repetitions of `{"url":…,"title":…}` buys
nothing. Both values go through Nunjucks' `dump` filter, which emits valid JSON
with escaping handled, rather than hand-rolled quoting. Post titles additionally
run through `smartquotes | striptags`, matching how every other list on the site
renders a title.

Synthesized titles for the destinations that are not collection items: "Home",
"Collected wisdom", "Wisdom tagged `<tag>`", "Portfolio", "Side projects".

### The matcher: `src/assets/js/404-suggest.js`

One file, hand-written, served as-is. Pure functions at the top, DOM glue at the
bottom behind `typeof document !== 'undefined'`, and a `module.exports` behind
`typeof module !== 'undefined' && module.exports` so Node can require exactly the
file the browser receives. Both guards are inert in the environment they are not
written for.

Normalization, applied to the failed path and to every candidate: lowercase, strip
the leading and trailing slash, strip a trailing `.html`, and collapse every run of
non-alphanumeric characters to a single hyphen. This is what makes a missing
trailing slash and a `%20` in the path cost nothing.

Scoring is two rules. If a candidate's normalized path starts with the normalized
failed path, and the failed path is at least eight characters, it scores 0.95 —
this is truncation, and it is the case we can be most confident about. Otherwise
the score is the Dice coefficient over character trigrams: twice the count of
shared trigrams divided by the total count in both. Dice lands between zero and
one, so the threshold is an interpretable number rather than a magic constant, and
a single dropped character only destroys the three trigrams that touch it.

`rankCandidates(failedPath, index, options)` returns the highest-scoring entries
above `threshold`, at most `limit`, ordered best first. Starting values are
`threshold: 0.45` and `limit: 3`, to be tuned against the test cases rather than
defended as chosen.

The eight-character floor on the prefix rule keeps a two-character path from
matching a third of the site.

### The page: `src/404.md`

Above the "Recent posts" heading:

```html
<div id="suggestions" hidden></div>
<script src="/assets/js/404-index.js" defer></script>
<script src="/assets/js/404-suggest.js" defer></script>
```

Index first, both deferred. Root-absolute `src` attributes, because an
ErrorDocument is served at the failing URL and a relative path would resolve
against it — the same rule `scripts/test/error-document-assets.js` exists to
enforce.

With JavaScript off, the div stays hidden and the page is exactly what shipped in
`678dc472`. With it on, the script fills the div and unhides it.

## Copy

When at least one candidate clears the threshold, a heading reading "Did you mean
one of these?" above a list of linked titles.

When none do: "Nothing on the site looks close to that address."

That second line only ever renders when the matcher actually ran, so it reports a
real result rather than implying one. The existing invitation to report a broken
link stays at the foot of the page either way — a visitor who was sent here by a
bad link is still the only person who knows what they clicked.

## Testing

A new `404-suggest` entry in the `unit` group of `scripts/test-manifest.js`,
implemented as `scripts/test/404-suggest.js` and following the shape of
`scripts/test/figure-lightbox.js`. It requires `src/assets/js/404-suggest.js`
directly and runs against a fixture index of about a dozen realistic pairs defined
in the test, so it has no `_site` dependency and belongs in `unit` rather than
`fast`.

We have almost no real 404s to learn from — traffic is low — so the cases are real
site URLs put through the mutations this feature targets, and the test says so
plainly. One truncated post URL. One with a character dropped mid-slug. One with
two characters transposed. One directory path missing its trailing slash. One
path with no relationship to anything on the site, asserting an empty result:
refusing to guess is behavior worth pinning, not an absence of behavior.

Separately, one assertion added to `scripts/test/error-document-assets.js`, which
already exists to check that error-page assets resolve: `404.html` must reference
both scripts with root-absolute `src` attributes, and both files must be present
in `_site`.

## Verification

`pnpm run build`, then `pnpm run test unit` and `pnpm run test fast`. By hand on
the dev server, request a truncated post URL, a misspelled one, and something like
`/asdfgh/`, and confirm the first two suggest and the third says nothing is close.
Then disable JavaScript and confirm the page renders as it does today.

## Non-goals

No search UI anywhere else on the site. No reading of server logs — that stays the
deferred item in `docs/ideas.md`. No attempt at WordPress-era URL recovery. If the
index grows past roughly ten times its current size, the question of fetching it
rather than shipping it inline is worth reopening; at 7.4KB gzipped it is not.

## Open question

The threshold is a judgment call and the first number is a guess. The unit test is
what makes tuning it deliberate: changing 0.45 should require changing an assertion
and looking at what that costs.
