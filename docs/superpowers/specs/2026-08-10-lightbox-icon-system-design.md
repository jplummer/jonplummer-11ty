# Lightbox controls into the icon system

**Date:** 2026-08-10

## Problem

Figure lightbox prev/next/close use stroked SVGs with round line caps, and the hit targets use soft `border-radius`. That departs from the site icon vocabulary (solid, sharp, right angles) established by the JP mark, EOF square, disclosure caret, and new-tab icon.

## Goals

- Square hit targets with no rounding
- Prev/next use an **open nav caret** (stroke chevron, `stroke-linecap: square` — same flavor as close ×), not the filled disclosure triangle
- Close uses strokes + `stroke-linecap: square` (blunt, perpendicular terminals)
- Disabled prev/next fade the **icon only** so holding-shape translucency matches close
- Control colors follow tokens (`--text-color` / `--link-color` on hover-focus)

## Non-goals

- Caption typography / italics
- Backdrop recipe changes unless review shows a problem

## Approach

**Chosen:** CSS `mask-image` icons via `:root` tokens. Lightbox prev/next and site pagination/post-nav share **`--icon-nav-caret-mask`** (open stroke chevron). Close uses **`--icon-close-mask`**. Filled **`--icon-disclosure-caret-mask`** stays for disclose-in-place only. Prev mirrors with `scaleX(-1)`.

**Nav caret geometry:** Tip must be exactly **90°** (same angle family as the disclosure triangle). Path `M5 2L9 6L5 10` — equal `|Δx|=|Δy|` arms from the tip. Earlier `M4 2L9 6L4 10` was ~77° and reads as out-of-system.

Rejected: filled disclosure triangle for paging; incised-square close; round line caps; acute chevron tips.

## Files

| Path | Change |
|---|---|
| `src/assets/css/jonplummer.css` | `--icon-close-mask`; lightbox button radius 0; mask-based icons; hover colors |
| `src/_includes/base.njk` | Replace inline stroke SVGs with masked spans |
| `docs/ideas.md` | Mark lightbox icon pass in craft sequence |

## Verification

Open a portfolio (or other) page with multiple figures; open lightbox; check prev/next/close shapes, sharp corners, light/dark, disabled prev/next at ends. `pnpm run lint:css` / `test css`.
