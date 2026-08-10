# Lightbox controls into the icon system

**Date:** 2026-08-10

## Problem

Figure lightbox prev/next/close use stroked SVGs with round line caps, and the hit targets use soft `border-radius`. That departs from the site icon vocabulary (solid, sharp, right angles) established by the JP mark, EOF square, disclosure caret, and new-tab icon.

## Goals

- Square hit targets with no rounding
- Prev/next use the shared disclosure caret (filled right triangle)
- Close uses a filled sharp × with **blunt terminals** — SVG strokes + `stroke-linecap: square` (perpendicular to each stroke; not axis-aligned polygon ends that read as points)
- Disabled prev/next fade the **icon only** so holding-shape translucency matches close
- Control colors follow tokens (`--text-color` / `--link-color` on hover-focus)

## Non-goals

- Pagination caret wiring (follow-up; reuse the same caret)
- Caption typography / italics
- Backdrop recipe changes unless review shows a problem

## Approach

**Chosen:** CSS `mask-image` icons via `:root` tokens (same pattern as `--icon-new-tab-mask` / `--icon-disclosure-caret-mask`), spans inside the existing buttons in `base.njk`. Prev mirrors the caret with `scaleX(-1)`.

Rejected: keep stroke SVGs with only `stroke-linecap: square`; incised-square close.

## Files

| Path | Change |
|---|---|
| `src/assets/css/jonplummer.css` | `--icon-close-mask`; lightbox button radius 0; mask-based icons; hover colors |
| `src/_includes/base.njk` | Replace inline stroke SVGs with masked spans |
| `docs/ideas.md` | Mark lightbox icon pass in craft sequence |

## Verification

Open a portfolio (or other) page with multiple figures; open lightbox; check prev/next/close shapes, sharp corners, light/dark, disabled prev/next at ends. `pnpm run lint:css` / `test css`.
