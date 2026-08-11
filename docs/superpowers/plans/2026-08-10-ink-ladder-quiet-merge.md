# Ink ladder quiet-merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse dim text greys into one quiet ink role (including license/colophon), keep visited as the same quiet (or a 1-step darker alias), move non-text borders onto `--border-color`, then optionally delete redundant selectors/tokens after visual acceptance.

**Architecture:** Conceptual roles are **ink** (`--text-color`), **quiet** (`--text-color-light` for now), **visited** (alias or 1-step quieter), **border/field** (structure). Accent (`--link-color` / hover) is out of scope for this plan — Phase B later. Active green is YAGNI for lived UI; handle only in post-acceptance cleanup if desired.

**Tech Stack:** `jonplummer.css` tokens + consumers; `docs/colors.md`; contrast via `pnpm run test color-contrast`; eye-check on live pages.

## Global Constraints

- Prefer design tokens; no new hardcoded greys.
- Do not sharpen accent or change dark-mode brass in this plan (Phase B).
- Visual acceptance gates cleanup: do not delete `--link-visited-color` or merge selectors until Jon signs off on the look.
- Gallery / `colorLabSchemes` / paste keys may keep `link-visited-color` for export parity even if site aliases it.
- APCA: quiet and visited on content background must still pass `pnpm run test color-contrast` (minLc 60).

---

### Task 1: Point quiet chrome at one ink — **done**

- [x] Quiet chrome → `--text-color-light`
- [x] Visited = quiet (A)
- [x] Borders → `--border-color`
- [x] Contrast + CSS
- [x] Eye-check accepted (2026-08-10) + hybrid page links + semibold `strong`

### Task 2: Post-acceptance cleanup — **done**

- [x] Contrast parser resolves `var(--token)` aliases
- [x] `--link-visited-color: var(--text-color-light)`
- [x] Lived `a:active` → `--link-hover-color` (keep `--link-active-color` for gallery)
- [x] Docs (`colors.md`, `ideas.md`, memory)
- [x] No rename of `--text-color-light` → `--text-color-quiet` (deferred unless wanted)
- [x] Verify + commit

### Task 3: Out of scope (later Phase B — accent / hover)

- Sharpen accent / fix dark-mode brass
- **Remaindered link posts** (`.link-item`): unvisited titles use `--link-color` at rest and again on hover → visual no-op. Options with accent work: ink/quiet at rest + accent (or hover token) on interaction; or keep accent at rest but hover → `--link-hover-color`
- Full monochrome / B&W live theme
