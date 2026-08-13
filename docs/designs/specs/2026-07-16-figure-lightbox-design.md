# Figure lightbox

**Date:** 2026-07-16

## Problem

Content figures (especially portfolio diagrams and slide images) render at content width. Readers need a way to view an image as large as the browser allows without leaving the page, and to step through other figures on the same page.

## Goals

- Click a content figure’s image to open a near-fullscreen lightbox.
- Size the displayed image to the smaller of: available viewport (with minimal padding) or the image’s intrinsic dimensions (do not upscale past natural size).
- Show the figure’s `figcaption` in the lightbox when present.
- Prev/next (and arrow keys) move through other lightboxable figures on the page; do not wrap at the ends.
- Close via Escape, backdrop click, and an explicit close control.
- Work site-wide for content figures; stay compatible with CSP (`script-src 'self'`).
- Progressive enhancement: without JS, the figure still links to a large image URL.

## Non-goals (v1)

- Videos inside figures.
- Pinch-zoom / pan inside the dialog.
- Download control.
- Deep-link / URL hash to a specific open figure.
- High-contrast styling for prev/next controls (close control remains usable; prev/next may be subdued).
- Utility/chrome images (nav, OG grid, color gallery, masthead tools, etc.).

## Approach

Native HTML `<dialog>` plus a small same-origin script. One shared dialog in the base layout; the script fills it from the clicked figure.

Rejected alternatives:

- **CSS-only `:target` / checkbox overlays** — awkward for prev/next + caption swapping and focus management once gallery behavior is required.
- **Third-party lightbox library** — extra dependency and CSP/styling friction for modest benefit.

## Behavior

### Scope

Lightboxable targets: `<figure>` elements inside `main` that contain an image (`img` or `picture > img`), excluding known utility chrome (e.g. masthead preview figures, gallery embeds). Bare content images outside `<figure>` are out of scope for v1. Videos in figures are ignored.

### Open

- Click the figure image (or its progressive-enhancement link).
- JS opens the shared `<dialog>` with `showModal()`.
- Dialog image `src` is the largest useful URL from the existing `<picture>` / `srcset`, falling back to `img.src`.
- Caption slot is filled from that figure’s `figcaption` text when present; otherwise the caption area is hidden.

### Size

CSS: image fits within the dialog content box (`max-width` / `max-height` relative to the viewport, minimal padding ≈ `0.5rem`), `object-fit: contain`, and must not scale larger than the image’s intrinsic width/height.

### Gallery

- Document order of lightboxable figures on the page.
- Prev/next buttons and ←/→ keys move one step; no wrap. On the first figure, prev is disabled / key is a no-op; on the last, next likewise.
- Updating the open figure refreshes image, caption, and control disabled state.

### Close

Escape (native dialog), backdrop click, and close control. Focus returns per dialog behavior.

### Progressive enhancement

Figure media is wrapped in `<a href="{largeImageUrl}">` so no-JS users (and open-in-new-tab) still get the large image. With JS, the click is intercepted and the dialog opens instead.

### Discoverability

Lightboxable figure images use a `zoom-in` cursor (or equivalent).

### Motion

If any open/close transition is added, honor `prefers-reduced-motion: reduce` (no animation).

## Architecture

| Piece | Role |
| --- | --- |
| `src/_includes/base.njk` | Shared `<dialog>` markup (image, caption, prev, next, close); load `/assets/js/figure-lightbox.js` with `defer`. |
| `src/assets/js/figure-lightbox.js` | Discover figures, wire clicks/keys, populate dialog, gallery navigation, close handling. |
| `src/assets/css/jonplummer.css` | Dialog layout, minimal padding, backdrop, caption, control styling (prev/next may be subdued). |

Optional build-time help (implementation choice): if wrapping every figure in an `<a>` is cleaner as an Eleventy transform or markdown tweak than in JS on load, prefer that — behavior must match the progressive-enhancement goal either way.

### Image URL selection

Prefer the largest width candidate already present in `srcset` / `<source>` from `@11ty/eleventy-img` (widths include up to 1600 and `auto`). Do not introduce a second image pipeline for v1.

### Accessibility

- Use `showModal()` for top layer, backdrop, and focus management.
- Dialog has an accessible name (e.g. `aria-label` or labelled-by close/title pattern).
- Controls are real `<button>`s; prev/next reflect disabled state when at ends.
- Caption text remains readable; decorative chrome stays out of the way.

## Testing

**Manual**

- Portfolio page with many figures (open, caption, prev/next, ends don’t wrap).
- Blog post with figures.
- Keyboard: Esc, arrows; backdrop and close.
- No-JS / disable script: link navigates to large image.
- Reduced-motion preference if transitions exist.

**Automated**

- Smoke: built pages from `base.njk` include `figure-lightbox.js`.
- No brittle full lightbox E2E required for v1.
- Existing `test fast` / a11y unchanged unless a template change introduces a regression worth asserting.

## Success criteria

- On a multi-figure portfolio page, a click enlarges the image to viewport-or-intrinsic (whichever is smaller) with minimal padding.
- Caption appears when the source figure has one.
- Arrow keys and controls move through figures without wrapping.
- No-JS path still reaches a large image via the figure link.
- CSP remains satisfied (no inline script).
