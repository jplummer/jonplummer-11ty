# Nav restructure: lean header, grouped footer nav

## Context

The site nav (`src/_includes/components/nav.njk`) is a single flat list in the
header, currently `/about`, `/now`, `/portfolio`, `/wisdom` (plus a
conditional `/` link on non-home pages). A `/friends` blogroll-style page is
planned, and a `/sides` page is expected later. Adding both directly to the
header list would leave 6-7 flat text links with no differentiation between
primary destinations and secondary/exploratory ones.

The footer currently carries only a copyright line with an inline link to
`/colophon` (`src/_includes/components/license.njk`) — there is no footer
nav.

Several pages already exist outside the header nav with no footer presence
either: `/colophon`, `/changelog`, `/technologies`, `/color`, `/type`.
`/color` and `/type` cross-link each other via
`components/utility_sibling_nav.njk` ("hidden utility pages, below site
header, not main nav"), which stays as-is — that's page-to-page navigation
between labs, not site-wide.

## Goal

Split navigation into two tiers:

- **Header**: the small set of primary destinations, unchanged from what a
  visitor needs to find first.
- **Footer**: a grouped, more complete nav for everything else — content
  pages and lab/utility pages.

This is a prerequisite for adding `/friends` — the new page's nav placement
depends on this restructure landing first.

## Design

### Header (`components/nav.njk`)

Trim to 4 destinations (5 including the conditional home link):

- `/` (only rendered when `page.url != "/"`, as today)
- `/about`
- `/now`
- `/portfolio`

`/wisdom` drops out of the header — it's not being updated regularly and
isn't a destination on its own terms per current judgment. It moves to the
footer's Content group instead.

No markup changes beyond removing the `/wisdom` `<li>`.

### Footer nav (new `components/footer_nav.njk`)

New include, added to `base.njk`'s `<footer>` alongside the existing
`license.njk`. Three labeled groups:

- **Also read**: `/wisdom` (`/friends` and `/sides` join this group when
  they ship — not part of this change)
- **How this site works**: `/colophon`, `/changelog`, `/technologies`
- **Labs**: `/color`, `/type`

`/sides` and `/friends` are **not** added yet — both are unbuilt or not yet
built as of this spec. Adding a link to a page that doesn't exist would fail
`internal-links` and `seo` tests. Each gets a one-line addition to the
relevant array when it ships.

`style-exercise` stays excluded — it's already gated out of the build via
`.eleventyignore` pending its return.

Markup:

```html
<nav class="footer-nav" aria-label="More on this site">
  <div class="footer-nav-group">
    <h2>Also read</h2>
    <ul>
      <li><a href="/wisdom/">/wisdom</a></li>
    </ul>
  </div>
  <div class="footer-nav-group">
    <h2>How this site works</h2>
    <ul>
      <li><a href="/colophon/">/colophon</a></li>
      <li><a href="/changelog/">/changelog</a></li>
      <li><a href="/technologies/">/technologies</a></li>
    </ul>
  </div>
  <div class="footer-nav-group">
    <h2>Labs</h2>
    <ul>
      <li><a href="/color/">/color</a></li>
      <li><a href="/type/">/type</a></li>
    </ul>
  </div>
</nav>
```

Current-page handling follows the existing `nav.njk` pattern
(`aria-current="page"` when `page.url` matches).

### Data source

A small `src/_data/footerNav.js` exporting the three groups as
`{ label, items: [{ url, label }] }`, mirroring the shape (not the file) of
`utilityPages.siblings`. The include loops over `footerNav` rather than
hardcoding the list inline, so adding `/friends` or `/sides` later is a
one-line data change, no template edit.

### `license.njk`

Left as-is. Its `/colophon` link duplicates the one now in the footer nav's
"How this site works" group — that's an acceptable small redundancy
(copyright line reads naturally with the link inline) rather than a reason
to restructure the license line.

### Styling

New rules in `jonplummer.css` for `.footer-nav`, `.footer-nav-group`,
`.footer-nav-group h2`: a row of three columns on wider viewports, stacking
to one column on narrow ones, small type consistent with the existing
footer/license treatment. No new custom properties expected — reuse
existing spacing/type tokens.

### Testing

Covered entirely by the existing fast suite, no new test script:

- `internal-links` — footer links resolve
- `html` — valid markup
- `seo` — no orphaned/broken links introduced
- `color-contrast` — footer nav text/links meet contrast minimums
- `css` / `lint:css` — new footer-nav rules
- `a11y` (slow suite) — grouped nav landmarks, heading structure

### Explicitly out of scope

- No dropdown/JS-driven menu — footer nav is always visible, same posture as
  `license.njk` today.
- No mobile-specific collapse behavior.
- No changes to `utility_sibling_nav.njk` or its cross-linking between
  `/color` and `/type`.
- Adding `/sides` and `/friends` to the footer data — each happens as a
  one-line change when that page ships, not part of this spec.
