# Portfolio cover crop in front matter

**Date:** 2026-08-13
**Status:** approved in discussion (position + zoom); written for review before implementation plan

## Problem

Portfolio grid thumbnails are a 16:9 box with `object-fit: cover`. The default crop is center, at the scale that just covers the box. Some covers (tall screenshots, tight wordmarks) need a different focal point, a tighter crop (zoom into a smaller area of the source), or both.

Today the only override is a per-slug CSS rule (`article.portfolio-item#monotasker img { object-position: center 20%; }`). Crop intent lives in the stylesheet, keyed by `fileSlug`, not next to `coverImage`. Adding more exceptions means more CSS IDs and a silent break if a slug changes. There is no zoom control at all.

## Goals

- Author thumbnail crop (focal point and optional zoom) on the portfolio post, beside `coverImage`.
- Keep the 16:9 card shape and size; `object-fit: cover` stays. Only which part of the source is visible changes.
- Grid-only: detail-page figures are unchanged.
- Migrate the existing Monotasker `center 20%` override into front matter and delete the slug CSS rule.

## Non-goals

- Choosing crops for the rest of the grid in this change (later, per post).
- Re-exporting or padding cover files.
- Per-item `object-fit` or aspect-ratio.
- Zoom below 1 (would letterbox inside the box).
- Client-side crop UI.
- CSS `object-view-box` (Chromium-only; no Safari/Firefox).

## Approach (chosen)

**Optional `coverPosition` and `coverZoom` front matter + CSS custom properties on the card.**

Zoom is a `scale()` of the already-covered image, clipped to the 16:9 frame. `transform-origin` matches `object-position` so the focal point stays put while zooming.

Rejected:

- More `#slug` CSS rules (works for one-offs; crop is not durable next to the image).
- Inline `object-position` / `scale` on the `<img>` (properties then live in HTML, not the stylesheet).
- `object-view-box` (Safari/Firefox unsupported).

## Behavior

### Front matter

Optional fields on a portfolio post:

```yaml
coverImage: 2026/06/onboarding.png
coverPosition: center 20%
coverZoom: 1.25
```

Either field may be used alone.

**`coverPosition`**

- Omitted → CSS default `center` (same as today for every item except Monotasker).
- Present → CSS `object-position` value. One or two tokens from `center` / `top` / `bottom` / `left` / `right` and percentages (`20%`, `50.5%`).
- `center 20%` is a plain YAML string and does not need quotes.

**`coverZoom`**

- Omitted → `1` (today’s cover scale).
- Present → unitless multiplier. YAML number is fine (`1.25`).
- Allowed range: **1 to 3** inclusive. `1` is a no-op; `1.25` shows a smaller region of the source at the same card size. Below 1 or above 3 → frontmatter issue (catches typos like `125`).

`coverImage` is already required in practice for grid cards; this spec does not add a new required-field check for it.

### Markup

`src/_includes/components/portfolio_list_item.njk` — only include used by `src/portfolio.njk`:

When either field is set, put matching custom properties on the `<article>`:

- `coverPosition` → `--cover-object-position`
- `coverZoom` → `--cover-zoom`

Site CSP already allows `style-src 'unsafe-inline'`. Eleventy’s image transform wraps the cover in `<picture>`; clip overflow there.

### CSS

Replace the `#monotasker` rule. Defaults stay in CSS:

```css
article.portfolio-item a > picture,
article.portfolio-item a > img {
  overflow: hidden;
}

article.portfolio-item img {
  object-position: var(--cover-object-position, center);
  transform-origin: var(--cover-object-position, center);
  scale: var(--cover-zoom, 1);
}
```

Keep existing `width` / `aspect-ratio` / `object-fit: cover`. Use the `scale` property (not `transform`) so other transforms are not clobbered. No further per-slug crop rules.

### First content move

`src/_posts/2026/2026-06-05-monotasker.md` gets `coverPosition: center 20%` only (no zoom unless we decide it needs it). Visual result on `/portfolio/` must match the current 20% vertical bias.

## Docs

`docs/authoring.md` Optional front matter: document `coverImage` (portfolio grid), `coverPosition` (grid crop focal point; CSS `object-position` syntax; omit for center), and `coverZoom` (grid crop zoom; unitless 1–3; omit for 1).

`.cursor/rules/memory.mdc` portfolio-grid bullet: crop overrides come from `coverPosition` / `coverZoom`, not `#slug` CSS.

## Tests

- **`test frontmatter`:** if `coverPosition` is present, it must be a string matching the token allowlist. If `coverZoom` is present, it must be a number (or numeric string) in **1–3**. Non-string position, empty, junk, zoom out of range → issue. Absence of either field is fine.
- **`test css` / stylesheet guard:** `jonplummer.css` uses `--cover-object-position` and `--cover-zoom` as above, clips overflow on the picture/img wrappers, and has no `article.portfolio-item#…` `object-position` rules.
- After a build (or when `_site/portfolio/index.html` exists): the Monotasker card’s `style` includes `--cover-object-position: center 20%`.

## Out of scope for the first PR

Setting `coverPosition` / `coverZoom` on Goal Manager or any other item besides the Monotasker position migration. Mechanism + that one move only.
