# Preview lockup facsimile + `/masthead/` retirement

**Date:** 2026-08-10  
**Status:** approved in discussion; written for review before implementation plan

## Problem

Production chrome is now mark + lockup (`.site-lockup`, inline SVG mark, Semibold logotype, tagline). Utility pages that embed **simulated mini-pages** still render the pre-lockup wordmark-only `hgroup`. Next to the real header, those facsimiles look outdated.

Affected surfaces:

| Surface | Mechanism | Action |
|---|---|---|
| `/color/` | `renderHomePreview()` in `scripts/color-explore/generate-gallery.js` → embed HTML/CSS | Update facsimile lockup |
| `/type/` | `siteHomePreviewFragment()` in `scripts/font-explore/generate-font-gallery.js` | Same |
| `/masthead/` | Phase 3 scale / tracking lab (strips + live-header JS) | Retire — obsolete vs shipped lockup |

Normal posts/pages and `/ogimages/` are out of this problem (live `base.njk` or PNG grid).

## Goals

1. Mini-page facsimiles on `/color/` and `/type/` read as the **current brand** (mark + logotype), not the old wordmark stack.
2. Keep them **facsimiles**: scaled and simplified vs production optical tokens — not pixel-perfect clones.
3. Remove `/masthead/` as a dead Phase 3 lab (already listed in `docs/ideas.md`).

## Non-goals

- Pixel-matching production lockup nudges (`--site-lockup-*`) inside cards.
- Changing the live site header (`base.njk` / production lockup CSS).
- Reworking OG lockup (separate pipeline / specs).
- Full-page color/type preview popout (separate ideas item).
- Adding a `/masthead/` redirect proactively (only if a 404 shows up later).
- Client-side JavaScript for previews.

## Approach (chosen)

**Shared build-time facsimile lockup + drop `/masthead/`.**

Rejected:

- Production classes + blind `transform: scale()` wrapper (optical math fights card scale).
- Patching color / type / masthead independently (drift).
- Rebuilding `/masthead/` as a lockup experiment lab (ideas already say drop it).

### Fidelity bar

- Ideal: match production lockup structure.
- Practical: **smaller A** — same recognizable structure, scaled down; **omit tagline** by default so cards stay uncrowded; soften or skip optical nudges at preview scale if they look wrong.
- Markup should stay close to production so live header CSS does as much work as possible (including mark home link + `hgroup` shape). Competing links inside non-navigable facsimiles are acceptable.

## Architecture

### Shared build-time helper (not browser JS)

`/color/` and `/type/` preview HTML is emitted by Node generators as string templates. A small shared **CommonJS** module (`scripts/utils/preview-site-lockup.js`) exports the lockup markup so the two generators do not diverge.

No new client-side scripts on those pages.

SVG geometry matches `src/_includes/components/site-mark.njk` (four rects, `fill="currentColor"`). Production partial remains the live-header source of truth; the helper duplicates the same paths with a comment noting that intentional sync point.

### Markup shape (preview headers)

Match production as closely as practical:

```html
<div class="site-lockup">
  <a href="#" rel="home" class="site-mark-link" aria-label="… home">
    <!-- inline SVG.site-mark, same geometry as site-mark.njk -->
  </a>
  <hgroup>
    <h1><a href="#" rel="home">…author…</a></h1>
    <!-- tagline <p> omitted by default; optional flag if a wider preview wants it -->
  </hgroup>
</div>
```

Wire into:

- `renderHomePreview()` (color gallery)
- `siteHomePreviewFragment()` (font gallery)

Then regenerate embeds (`eleventy.before` / `pnpm run build` for color; font-lab fragment path as used today).

### Preview CSS

Prefer inheriting `.site-lockup` / `.site-mark` / `hgroup` rules from `jonplummer.css`.

Under `.theme-root.home-preview` (color embed CSS from the gallery generator + `font-lab-scoped.css`):

- Smaller logotype size for card scale.
- Proportionally smaller mark height (keep aspect-ratio pattern; do not invent a separate mark asset).
- No tagline in default facsimile.
- Soften or override production optical nudges only if they look wrong at card scale.

Color embed CSS is generated — update the generator source that writes `color-gallery-embed.css`, then regen.

### `/masthead/` retirement

- Delete `src/masthead.njk` and related assets: `masthead-preview.css`, `masthead-preview.js`, strip/feed partials, OG PNG if unused elsewhere.
- **No redirect** unless a real 404 appears later.
- Clean: `scripts/test/seo-meta.js` `/masthead` exemption; figure-lightbox special-case for `masthead-preview-strip` (remove dead skip + test fixture); `docs/ideas.md` move “drop `/masthead/`” to Done.
- Note stale `_site/masthead/` may linger until a clean build / wipe (known Eleventy gotcha).

## Testing

- Unit: helper/fragment emits lockup with mark + author (and no tagline by default).
- After regen/build: `pnpm run test html`, `seo`, `css`; `pnpm run test fast` before calling done.
- Manual: `/color/` and `/type/` in light and dark — facsimile lockup reads as current brand and does not dominate the card.

## Success criteria

- Side-by-side with the real header, color/type mini-pages no longer look like the old wordmark-only masthead.
- `/masthead/` is gone from source and sitemap/SEO expectations; no proactive redirect.
- One shared build-time source for preview lockup markup used by both generators.
