# Build & Deploy Test Pipeline

**Date:** 2026-06-26

## Problem

Markdown validation complaints only appear at deploy time, not during a local build. More broadly, the test suite has no principled mapping onto build vs. deploy — some tests run twice, some not at all during build, and `deploy.js` duplicates checks that belong to the build pipeline.

## Principle

- **Build** tests all inputs to the build (source quality) and all results of the build (output quality).
- **Deploy** tests all inputs to the deploy (connectivity, config) and all results of the deploy (live submission).
- **Dev** runs no tests — fast feedback only.

## Test Assignments

### Build: pre-build (source inputs)

Run before `eleventy`, on source files. No `_site/` required.

`markdown`, `frontmatter`, `spell`, `css`, `links`, `wisdom`, `portfolio-notes`, `color-contrast`

### Build: post-build (build results)

Run after `eleventy`, on `_site/`. All fast.

`html`, `internal-links`, `og-images`, `seo`, `rss`, `indexnow`

### Deploy only

`deploy` test (SSH, env vars, rsync connectivity) — deploy input check, not a build concern.

IndexNow submission and changelog commit/push — deploy results.

### On-demand only

`a11y` — build result but slow (headless browser per page). Run manually: `pnpm run test a11y`.

`security` — live site audit. Run manually: `pnpm run security-audit`.

## Changes

### New: `scripts/build/build.js`

Orchestration script mirroring the style of `deploy.js`. Three phases:

1. **Pre-build** — run source-input tests in sequence, fail fast
2. **Build** — `generate-og-images` then `eleventy`
3. **Post-build** — run build-result tests in sequence, fail fast

`package.json` `build` script becomes: `node scripts/build/build.js`

### Simplified: `deploy.js`

Remove:
- Explicit `generate-og-images` call (now owned by `build.js`, was running twice)
- `test markdown` and `test frontmatter` pre-build calls (now owned by `build.js`)
- `test og-images` post-build call (now owned by `build.js`)
- `--skip-checks` flag (never used; removes an untested escape hatch)

Resulting deploy sequence: changelog → `build` → `deploy` test → rsync → indexnow submit → changelog commit/push

### Unchanged

- `dev` — `eleventy --serve --watch --quiet`, no tests
- `build:verbose` — update to call `build.js` with verbose flag, or document as deprecated
- `pnpm run test [type]` — all individual test commands remain available
- `pnpm run test fast` / `pnpm run test all` — remain as standalone check suites (useful for re-checking an existing `_site/` without rebuilding)

## Verification

1. `pnpm run build` — confirm all pre-build tests run, then eleventy, then post-build tests
2. Introduce a markdown error → `pnpm run build` should fail in the pre-build phase
3. `pnpm run deploy` — confirm it calls build (no duplicate test runs), then deploy-specific steps
4. `pnpm run dev` — confirm no tests run, just fast rebuild on save
5. `pnpm run test a11y` — confirm still works standalone
