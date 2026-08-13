# Mark / 404 / Colophon Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Safari-safe header mark via CSS tokens; root-absolute 404 assets; transparent colophon sketch with dark invert.

**Architecture:** Spec `docs/designs/specs/2026-08-06-mark-404-colophon-polish-design.md` (3A colophon). Do not commit the spec unless asked.

**Tech Stack:** Nunjucks, `jonplummer.css`, Node one-off for PNG alpha, existing `scripts/test/*` harness.

---

### Task 1: 404 root-absolute asset regression test + fix

**Files:**
- Create/extend: `scripts/test/` (prefer small dedicated test or add to existing html/seo if pattern fits)
- Modify: `src/_includes/head/meta_basic.njk`, `src/_includes/head/favicons.njk` (draft already present)

**Steps:**
1. Write failing test: after build (or read `_site/404.html` if present), assert stylesheet + favicon hrefs start with `/`.
2. Run test — expect fail on relative `assets/...` if fix reverted; with current draft, may pass after build.
3. Ensure draft `assetPrefix = "/" if permalink == "/404.html"` is correct; verify via build.
4. Run `pnpm run test` for the new check.

### Task 2: Inline site mark

**Files:**
- Create: `src/_includes/components/site-mark.njk`
- Modify: `src/_includes/base.njk`, `src/assets/css/jonplummer.css`
- Leave: `src/assets/images/jp-mark.svg` for OG

**Steps:**
1. Partial: inline SVG viewBox `50 50 500 500`, four rects, `fill="currentColor"`, `aria-hidden="true"`, class `site-mark`.
2. Include from `base.njk` inside home link.
3. CSS: `.site-mark { color: var(--text-color); }` (keep height/aspect rules; ensure `svg.site-mark` works).

### Task 3: Colophon transparent PNG + invert

**Files:**
- Replace: `src/assets/images/jon-sketch-by-rob-ullman.png` (RGBA)
- Modify: `src/colophon.md` (`eleventy:ignore` on img), `src/assets/css/jonplummer.css` (dark invert)

**Steps:**
1. One-off derive: near-white → alpha; overwrite PNG.
2. Add `eleventy:ignore`; CSS dark `filter: invert(1)`.
3. Visual/build checks.

### Task 4: Verify

- `pnpm run build` then `pnpm run test fast` (or targeted tests).
- Update `.cursor/rules/memory.mdc` with learnings.
- Do not commit unless asked.
