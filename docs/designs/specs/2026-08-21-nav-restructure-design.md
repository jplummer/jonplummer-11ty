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

`components/utility_sibling_nav.njk` (a cross-link list for "hidden
utility pages, below site header, not main nav") is *not* currently
rendered on `/color` or `/type` — despite an earlier draft of this spec
claiming otherwise. It's only included on `src/style-exercise.njk`, which
is itself excluded from the build (gated via `.eleventyignore`, pending
its return). Once `/color` and `/type` are reachable from every page via
the footer's Labs group, that component's premise (that they're otherwise
undiscoverable) stops holding — including for `style-exercise` whenever
it returns. That cleanup is out of scope for this spec, though, since the
component only touches a currently-disabled page; it can be addressed
separately when `style-exercise` actually comes back.

## Goal

Split navigation into two tiers:

- **Header**: the small set of primary destinations, unchanged from what a
  visitor needs to find first.
- **Footer**: a complete site map, grouped — the same primary destinations
  repeated for discoverability, plus everything else (content pages and
  lab/utility pages).

This is a prerequisite for adding `/friends` — the new page's nav placement
depends on this restructure landing first.

## Design

### The `/home` slug and redirect

Every other nav label reads as a real, typeable URL (`/about`, `/now`,
`/wisdom`, `/colophon`...). The current conditional home link breaks that
pattern: it's labeled `/index` — developer jargon that's never matched a
real route — while its `href` goes to `/`.

This spec replaces `/index` with `/home` everywhere it appears (header and
the new footer group below), and adds a matching redirect so the label is
genuinely reachable:

```yaml
# src/_data/redirects.yaml
- from: /home/
  to: /
```

Same pattern as the existing `/uses/ → /technologies/` entry. The nav
links themselves still point straight to `/` — not through `/home/` — same
principle as `/uses/` redirecting to `/technologies/` without the footer
ever linking to `/uses/` directly. Linking through your own redirect adds a
needless hop, and `seo.js` skips redirect pages entirely, so they're never
the correct link target.

### Header (`components/nav.njk`)

Trim to 4 destinations (5 including the conditional home link):

- `/` (only rendered when `page.url != "/"`, as today), labeled `/home`
- `/about`
- `/now`
- `/portfolio`

`/wisdom` drops out of the header — it's not being updated regularly and
isn't a destination on its own terms per current judgment. It moves to the
footer's "Also read" group instead.

Markup changes: remove the `/wisdom` `<li>`, relabel the conditional home
link's text from `/index` to `/home`.

### Footer nav (new `components/footer_nav.njk`)

New include, added to `base.njk`'s `<footer>` **before** `license.njk` —
the nav reads first, the copyright line comes last. Four labeled groups:

- **Start here**: `/home`, `/about`, `/now`, `/portfolio` — mirrors the
  header exactly, always all four (no conditional omission of `/home` the
  way the header does; the footer is a complete map regardless of which
  page you're on)
- **Also read**: `/sides`, `/wisdom`, alphabetical (`/friends` will slot in
  first — f < s < w — whenever it ships)
- **How this site works**: `/colophon`, `/changelog`, `/technologies`
- **Labs**: `/color`, `/type`

`/sides` shipped in a separate session partway through this work and was
folded in here rather than left stranded in the header (see the spec's
original assumption below, now superseded). `/friends` is still **not**
added — it's unbuilt as of this spec, and linking a page that doesn't
exist would fail `internal-links` and `seo` tests. It gets a one-line
`<li>` added to "Also read", alphabetically positioned, when it ships.

`style-exercise` stays excluded — it's already gated out of the build via
`.eleventyignore` pending its return.

Markup:

```html
<nav class="footer-nav" aria-label="More on this site">
  <div class="footer-nav-group">
    <h2>Start here</h2>
    <ul>
      <li><a href="/">/home</a></li>
      <li><a href="/about/">/about</a></li>
      <li><a href="/now/">/now</a></li>
      <li><a href="/portfolio/">/portfolio</a></li>
    </ul>
  </div>
  <div class="footer-nav-group">
    <h2>Also read</h2>
    <ul>
      <li><a href="/sides/">/sides</a></li>
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
(`aria-current="page"` when `page.url` matches). Unlike the header — where
links aren't underlined at rest, so dropping the underline for the current
page signals nothing extra — footer links **are** underlined at rest
(existing "quiet chrome" convention). So the footer's current-page link
keeps its underline and instead shifts to full-ink (`--text-color`) rather
than the muted (`--text-color-light`) other links use: staying in the
footer's own visual system rather than copying the header's.

### `license.njk`

Drop the inline `/colophon` link — it's now redundant with the one in the
footer nav's "How this site works" group, sitting right above it. Simplify
to plain text: `Copyright {% year %} {{ site.author }}`.

### Styling

New rules in `jonplummer.css` for `.footer-nav`, `.footer-nav-group`,
`.footer-nav-group h2`: a row of four columns on wider viewports, stacking
to one column on narrow ones, small type consistent with the existing
footer/license treatment. No new custom properties expected — reuse
existing spacing/type tokens.

**Superseded from the original version of this spec**: an earlier version
of this section broadened the existing `.license` indent selector (a
"Trial (easy revert)" rule that aligned the footer with the article column
on blog/post/portfolio pages, staying flush-left on full-width `page`
pages) to also cover `.footer-nav`. Live review after implementation
found that page-type-dependent alignment "always seemed a little odd" —
so instead, the footer is now **always full-bleed and flush**, regardless
of page type, and that indent rule is deleted outright rather than
extended. This also resolves the open question logged in `docs/ideas.md`
about full-width `page` layouts vs. the blog-post column — the footer no
longer participates in that distinction at all.

**Full-bleed footer, centered content column**: `header`/`main` keep
their existing centered `max-width` column (`jonplummer.css` "Main layout
containers" rule); `footer` is excluded from that rule and goes edge to
edge instead, so its background can span the full viewport width.
`.footer-nav` and `.license` each re-apply the same `max-width` /
`padding-inline` / `margin-inline: auto` centering directly, so footer
content still lines up with the page above it.

**Sticky-bottom footer**: `body` becomes a flex column
(`display: flex; flex-direction: column; min-height: 100vh`) with
`body > main { flex: 1 0 auto; }` absorbing leftover space, so on a short
page the footer still sits at the bottom of the viewport rather than
riding up under the content. This surfaced a flexbox interaction worth
documenting: a flex item with `width: auto` and *bounded* intrinsic
content (like `header`'s logo + title + nav, ~626px) has its auto margins
pre-empt cross-axis stretch and shrinks to content width instead of
filling to `max-width` — while `main`'s unbounded flowing text happened to
fill anyway, masking the bug until `header` was inspected directly.
Explicit `width: 100%` on both `header` and `main` sidesteps this.

**Color break**: `body > footer` gets
`background-color: color-mix(in oklch, var(--content-background-color) 99%, black 1%)`
— a very subtle (~1%) darkening off whatever's actually painted behind
`header`/`main` (`--content-background-color`, set on `body` itself; not
`--background-color`, a different token used elsewhere for cards/sections
that is *not* what's visually adjacent to the footer — mixing from the
wrong token was caught via live computed-style comparison before this
landed, and would have produced a footer several times darker than
intended). No new custom property — matches an existing `color-mix()`
idiom already used elsewhere in this file.

### Testing

Covered entirely by the existing fast suite, no new test script:

- `internal-links` — footer links resolve
- `html` — valid markup
- `seo` — no orphaned/broken links introduced
- `color-contrast` — footer nav text/links meet contrast minimums
- `css` / `lint:css` — new footer-nav rules
- `a11y` (slow suite) — grouped nav landmarks, heading structure

Manual check: after `pnpm run build`, confirm `/home/` appears as a
`Redirect 301` rule in `_site/.htaccess` and that visiting it (on the live
site, post-deploy) lands on `/`.

### Explicitly out of scope

- No dropdown/JS-driven menu — footer nav is always visible, same posture as
  `license.njk` today.
- No mobile-specific collapse behavior.
- No changes to `utility_sibling_nav.njk` or `utilityPages.js` — it isn't
  rendered anywhere live today (only on the disabled `style-exercise.njk`),
  so removing it is deferred to whenever `style-exercise` returns, not
  bundled into this spec.
- Adding `/friends` to the footer data — a one-line change when it ships.
- No sitewide change to how `header`/`main` are centered — only `footer`'s
  containment model changes (full-bleed vs. centered-column).
