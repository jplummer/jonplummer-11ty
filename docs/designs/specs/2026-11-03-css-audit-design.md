# CSS audit, November 2026

On 2026-11-03 Jon ran the [modern-css.com CSS audit](https://modern-css.com/tools/css-audit/) against `jonplummer.css`. Its export, `css-audit.json`, isn't kept in the repo. On 2026-11-07 he read [Taming Typography: Building a Modern CSS Reset](https://css-tricks.com/taming-typography-modern-css-reset/) on CSS-Tricks and checked it against the same file. Both were worked through by 2026-11-08. These notes lived in `docs/ideas.md` until then, and moved here so the decisions and their evidence stay findable.

## Audit findings

The audit rated the stylesheet 88% modern: eight findings across 102 hits, all in `jonplummer.css`, with six of eight checks ready for the declared browser target.

### Prefixes, print properties, and viewport units – done 2026-11-07

The 21 `-webkit-mask-*` lines are gone, since the unprefixed `mask` sat beside each. Print rules use `break-after` and `break-inside`, and the unused `.page-break` class is deleted. The lightbox `max-height`s use `dvh`. Body `min-height` uses `svh`, so the sticky footer doesn't move while mobile browser toolbars show and hide.

Stylelint's `property-no-vendor-prefix` and `property-no-deprecated` are back on, so `pnpm run test css` fails if either kind of property returns. Three prefixes are exempt because the site needs them: `-webkit-box-decoration-break` (Safari only reads the prefixed form), and `-webkit-text-size-adjust` and `-moz-text-size-adjust` (iOS Safari, Firefox Android). Commit 721f9e90.

### Selector rewrites – done 2026-11-07

The figure subgrid's child list and the three print lists are `:is()`. Screen and print rules use logical properties (`inset-inline-*`, `padding-inline-start`, `border-inline-start`, `text-align: start`). `.sr-only` and the skip link hide with `clip-path: inset(50%)` in place instead of `left: -10000rem`, so a screen reader's cursor stays at the text's real position. A no-op `padding-left: 0` on portrait-grid captions is gone. Commit 756ca74c.

### Cascade architecture – done 2026-11-08, without `@layer`

The audit suggested cascade layers. Unlayered CSS beats every layer, so layering `jonplummer.css` would let the page-specific stylesheets, the inline first-paint shell in `critical.njk`, and the `/color/` previews' inline themes outrank all of it. The three problems layers were meant to solve were handled directly instead.

#### `!important` in print – tidied 2026-11-07

Nobody prints the site, so a whole-cascade restructure wasn't worth the risk to screen pages. 14 remain, down from 22. Each was kept only after a print-mode computed-style diff showed it was needed, and each sits under a comment saying what it beats: the `*` reset, the `article` reset, the code backgrounds, the decorative `::after`s, and four token overrides for the `/color/` previews' inline styles. The same pass fixed four print bugs:

- A second `@page` forced A4 on every printout. Printing now uses the dialog's paper.
- The `*` rule forced quiet text black. Print tokens now set black text and gray quiet text.
- Closed content warnings printed blank. `::details-content` now opens them, with the warning sentence kept as plain text.
- The print color tokens were mostly unused.

Two leftovers were fixed on 2026-11-08. Links to the site or the page itself (the logo mark and site title, `rel="home"`, and post titles, `rel="bookmark"`) no longer print a root-relative path after them. The `/color/` lab's badges print as dark text in an outline instead of pale green on nothing. Commits 5d8f2655 and 3845694a.

#### High-specificity selectors – done 2026-11-08

[Plan](../plans/2026-11-08-link-buckets-specificity.md). Links follow one set of state rules that read `--link-*` custom properties, and each bucket (reading, titles, demo pop-out, remaindered links, nav, quiet chrome) sets them once on its container. Link-state selectors went from 25 to six, and the highest from (0,3,3) to (0,2,1). The prev/next nav rules nest under one `nav:is(.post-navigation, .pagination)`.

A computed-style comparison of every element came out unchanged, with the exceptions listed below. It covered 19 pages at three widths, in light and dark, at rest, hover, focus, active, and print, plus visited links compared by pixel. The exceptions:

- the `/color/` and `/type/` preview titles, which lose an underline the real homepage never had
- two invisible differences: an image-only link, and print styles on nav links that print hides anyway

The comparison also showed that the real default link color was `inherit`, from the first-paint shell, not ink. The 11 selectors still above (0,2,1) describe specific states or structure (the lightbox's disabled buttons, the disclosure caret, the portfolio card hover) and don't fight anything.

#### `body >` selectors – reviewed 2026-11-08 and kept

`body > header` and `body > footer` keep the site's header and footer apart from article headers and footers (there are six headers on the homepage). `body > header nav` keeps the `/color/` and `/type/` mock pages' navs out of the site nav's rules (13 navs on `/color/`). `body > main` matches the same element as `main` on every page, but it stays so the shell rules read as a set, now written `body > :is(header, main)`. Commit 938d7abe.

### Already clean

The audit had no findings for floats, negative-margin gutters, translate centering, dark-mode duplicates (`light-dark()` is used correctly), RTL overrides, ID selectors, z-index stacking, Sass remnants, or JS-driven CSS hacks. Already in use: custom properties (215), `:is()`/`:where()` (26), `focus-visible` (17), logical properties (17, partial), `oklch` colors (19), `gap` (20), `text-wrap` (3), `:has()` (2), nesting (14), and view transitions (2).

## Browser support

The audit found 214 CSS features, 22 of them not yet Widely Available and none with a fallback. Most are intentional progressive enhancements or print-only. These got a closer look:

- `box-decoration-break: clone` needed no action (checked 2026-11-07). The audit says Safari never supports it, but Safari reads the prefixed form, and `:not(pre) > code` already sets `-webkit-box-decoration-break: clone` beside the unprefixed line.
- `@view-transition` (two uses; no Firefox, Safari 18.2 only) works as a progressive enhancement. Firefox just doesn't animate, and that's about 30% of desktop browsers.
- `::selection` (one use, not in iOS Safari) is a cosmetic gap.
- `orphans` (one use, not in Firefox) is print only.
- `page-break-*` was renamed to `break-*` on 2026-11-07 (above).

## Design tokens

The stylesheet has 58 custom properties. Color is well tokenized (87%), spacing less so (68%), and font sizes fall between (74%).

### Screen spacing – done 2026-11-07 (commit f1169942)

The audit matched values, not meanings: it suggested `--font-size-base` for `1rem` and `--font-size-lg` for `1.5rem`, but nearly every use is a margin or padding. The lightbox and lab code-panel `0.5rem`s are now `--spacing-xs`. The lightbox's `100vw/100dvh - 1rem` sizes use `--spacing-sm`, and the lab disclosure's off-grid `0.75rem` gap snapped up to `--spacing-sm`. There's no new token: the other screen `0.75rem` is the pop-out icon's size, not spacing.

### Print – done 2026-11-07

`0.5rem`, `1rem`, and `1.5rem` are `--spacing-xs`, `-sm`, and `-md`. The off-scale `0.75rem`, `0.25rem`, and `code` padding stay literal. Colors come from print overrides of the color tokens, with `color-scheme: light` so `light-dark()` can't print dark-mode values.

### Left on purpose

The two `light-dark()` color duplicates are the inline first-paint shell in `critical.njk`, which has to hard-code token values and is guarded by `test critical-css`. The lightbox backdrop and the OG preview's white field are fixed colors on purpose.

## Typography from CSS-Tricks

### Three small changes – done 2026-11-07 (commit 82997f3a)

- `text-wrap: pretty` on `li` and `blockquote`
- `text-underline-offset: 0.15em` on links, which only shows on hover and focus because reading links have no underline at rest (`skip-ink` already kept underlines off descenders)
- `hanging-punctuation: first last` on `p` and `blockquote`, which only Safari applies and which wasn't checked in Safari

### `text-box` for the header lockup – tried 2026-11-07, not adopted

Measured in headless Chrome, today's eye-tuned px tokens put the logotype's cap top and the tagline's baseline within 0.02px of the mark's edges at the default root size with the real fonts. They drift at a 20px root (top 0.8px), and with the `sans-serif` fallback that a cold `font-display: optional` load can get (top 1.9–3.4px). `text-box: trim-both cap alphabetic` on the logotype and tagline was exact in all four cases. That test sized the mark in `cap` units, with the tagline's cap height carried over by a registered `@property`.

It wasn't worth it. Firefox has no `text-box`, so it would add about 15 lines behind `@supports` on top of the tokens rather than replace them, and `main` would start 2.2px higher. Converting the tokens to rem doesn't fix the drift either: at a 20px root the top improves to 0.25px, but the bottom worsens to 0.7px. The tokens stay as they are.

### `font-synthesis: none` – skipped

The site loads only upright Libre Franklin, so italics in captions, blockquotes, and `em` are synthesized, and this rule would turn them upright.
