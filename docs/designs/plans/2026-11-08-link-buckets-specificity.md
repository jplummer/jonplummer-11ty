# Link buckets: lower selector specificity without changing a pixel

Plan, 2026-11-08. Source: the `ideas.md` CSS audit entry on high-specificity selectors (15 hits) and `body >` ballast (13 hits).

## Why

The specificity in `jonplummer.css` comes almost entirely from links. The stylesheet's own comment names four link "buckets" (nav, reading, controls, quiet chrome), but the CSS doesn't express them. Each place that uses a bucket restates the link states behind its own prefix:

```css
article.link-item section a:any-link:is(:hover, :focus-visible) { color: var(--link-color); }
```

Each such rule has to outrank the base link rules and every other context, so specificity climbs to (0,3,3). Of the 44 screen selectors at (0,3,0) or (0,2,2) and above, 17 are link-state rules and 16 are the prev/next nav carets, which list `nav.post-navigation` and `nav.pagination` separately every time. The other 11 describe a specific state or structure and don't fight anything: the lightbox's disabled buttons, the disclosure caret, the portfolio card hover, link items next to each other, the portfolio description, and the skip link.

## Goals

- Code that reads like the comment: each bucket says its colors once, and each context says which bucket it's in.
- Link-state selectors written once, at low specificity.
- **No visual change.** Every computed style, in every state, mode and width, stays the same. This is a refactor, not a redesign.

## Non-goals

- `@layer`. Considered and rejected for now, as it was for print. Unlayered CSS beats any layer, so layering `jonplummer.css` would let the page-specific stylesheets (`color-gallery-embed.css`, `og-card.css`, the font lab), the inline first-paint shell in `critical.njk`, and the `/color/` previews' inline theme styles outrank all of it. That's a site-wide cascade change for no visual gain.
- HTML or template changes.
- The 11 other high selectors listed above. They're specific because they describe a specific state or structure, and they don't fight anything.
- Print. It's tidied already; its computed styles are checked below only to confirm nothing moved.

## Design

### 1. Link buckets as custom properties

One set of state rules reads per-bucket custom properties, with the reading bucket as the default:

```css
/* Reading (default): ink, quiet once visited, accent + underline on hover */
a:any-link   { color: var(--link-rest, var(--text-color));  text-decoration: var(--link-rest-line, none); }
a:visited    { color: var(--link-visited, var(--text-color-light)); }
a:any-link:is(:hover, :focus-visible, :active) {
  color: var(--link-hover, var(--link-color));
  text-decoration: var(--link-hover-line, underline);
}
```

Contexts then set a bucket on a container, with no pseudo-classes in their selectors. Custom properties inherit, so the innermost bucket wins:

```css
/* Nav: accent at rest, no visited quiet, ink + underline on hover */
body > header nav, nav.pagination, nav.post-navigation {
  --link-rest: var(--link-color);
  --link-visited: var(--link-color);
  --link-hover: var(--text-color);
}
```

The buckets, from the current rules:

| Bucket | Where | Rest | Visited | Hover / focus |
|---|---|---|---|---|
| Reading (default) | body text | ink, underline in articles and pages | quiet | accent, underline |
| Nav | site nav, pagination, post navigation | accent, no underline | accent | ink, underline |
| Title (the comment's "controls") | logotype, post titles, demo pop-out link | ink, no underline | ink | accent; underline except the logotype |
| Quiet chrome | colophon, footer text, footer nav | quiet, underline | quiet | ink |

The table is a starting point. Where it and the current CSS disagree, the CSS wins, and the computed-style diff below arbitrates. One case to check: `body > header nav a[aria-current="page"]` looks redundant, since nav links are accent at rest and when visited, and hover already outranks it.

Custom property names are settled during implementation. They must not collide with the `:root` tokens (`--link-color`, `--link-hover-color`, `--link-visited-color`, `--link-active-color`), which print overrides and `test color-contrast` reads. The spike showed `var()` works under `:visited`: Chrome substitutes the element's own custom properties, and a visited link drew in the bucket's visited color.

### 2. Prev/next nav carets with `:is()`

`nav.post-navigation a.prev, nav.pagination a.prev, …` becomes `nav:is(.post-navigation, .pagination) a.prev`. Same specificity, half the lines, and the pairing reads as one idea. This mirrors what the print block already does.

### 3. `body >` ballast

Only 8 screen selectors use `body >`, mostly to tell the site header from an article's header. Each one is reviewed after step 1. One stays only if it still decides something, and that is checked by removing it and running the diff. This is the step most likely to end as "leave it".

## Testing

The bar is zero difference, and proof that the harness would have seen one. Build the site at `HEAD` and after each step, serve both, and compare:

1. **Computed styles, every element and its `::before`/`::after`, every property** (custom properties excluded, since new ones are expected). Pages: one per template and component: home, `/page/2/`, a post with figures, the content-warning post, a link-heavy page, portfolio list and detail, sides list and detail (Book Map, for the demo pop-out), about, now, wisdom and a wisdom tag page, `/color/`, `/type/`, changelog, 404, `/ogimages/`. Each at 375, 768 and 1280px, in light and dark.
2. **Interaction states.** The same dumps with every link, summary and button forced into `:hover`, then `:focus-visible`, then `:active`, through the DevTools protocol (`CSS.forcePseudoState`, confirmed in the spike). Forcing all at once also catches parent styles that react to a hovered child, such as portfolio cards.
3. **`:visited`.** `getComputedStyle` hides visited colors on purpose, so this uses pixels: on four pages, visit each link through an on-site navigation (external ones answered by a stub, so nothing leaves the machine), then screenshot every link and compare before and after.
4. **Print**: the existing print-mode dump, expected unchanged.
5. **Sensitivity check**: plant one deliberate change (a nav hover color, say) and confirm each layer of the harness reports it, then remove it.
6. **Suites**: `pnpm run test fast` (Stylelint, color-contrast, critical-css), `test unit`, and `test a11y`.

Any difference stops the work until it's explained. A difference that turns out to fix a bug, for example a state that was never reachable, is reported, not quietly kept.

## Steps and commits

1. Build the harness (scratch only, not committed) and record the `HEAD` baseline.
2. Link buckets → harness → commit.
3. Nav `:is()` → harness → commit.
4. `body >` review → harness → commit, or a note in `ideas.md` saying why they stay.
5. `ideas.md`: close the specificity and ballast items with the numbers, and record why `@layer` was set aside.

## Done when

- No link-state or nav-caret selector goes above (0,2,1), the specificity of the one base hover rule. The 11 other high selectors stay as they are.
- Each link bucket appears once in the CSS, under a comment naming its colors.
- The harness reports zero differences across every page, width, mode and state, plus visited and print, and the planted change shows it would have caught one.
