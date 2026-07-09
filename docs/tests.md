# Test Scripts Documentation

## Overview

This project includes a suite of validation tests covering content structure, HTML output, SEO metadata, accessibility, and deployment readiness, plus a separate suite of unit tests for our own tooling code. The split reflects three different questions:

- **Fast tests** (`pnpm run test fast`): is what I authored/changed fit to build, and is the built output fit to ship? Split further into pre-build content checks and post-build output checks by `scripts/build/build.js`.
- **Unit tests** (`pnpm run test unit`): does our own tooling code (parsers, deploy helpers) still behave correctly? Not tied to any authored content or build output — run on demand whenever `scripts/utils/`, `scripts/deploy/`, or content parsers change.
- **Slow tests** (`a11y`) and **infrastructure tests** (`deploy`, `security`): occasional/manual checks that need a browser, live network, or credentials.

## Test Execution

- `pnpm run test` - List available test types
- `pnpm run test [type]` - Run a specific test type (checks all files)
- `pnpm run test fast` - Run all fast tests (excludes slow tests like a11y)
- `pnpm run test all` - Run all tests including slow ones
- `pnpm run test unit` - Run all unit tests of our own tooling code
- `pnpm run test changed` - Run authoring tests on files changed since last commit
- `pnpm run validate` - Quick HTML validity check (shortcut for `pnpm run test html`)

**Common commands for individual tests:**
- `pnpm run test [type]` - Check all files
- `node scripts/test/[type].js --changed` - Check only changed files (where supported)

**Exceptions:**
- `spell`: Also supports `node scripts/test/spell.js <file>` to check specific files
- `security`: Can also use `pnpm run security-audit`

### Test Categories

**Fast Tests:** `html`, `links`, `wisdom`, `internal-links`, `frontmatter`, `markdown`, `spell`, `seo`, `og-images`, `color-contrast`, `css`, `rss`, `deploy-assets`, `indexnow`

**Unit Tests:** `portfolio-notes`, `cloudflare-purge`, `deploy-guards` — see [Unit Tests](#unit-tests) below

**Slow Tests:** `a11y` (launches browser)

**Other Tests:** `deploy`, `security`

## Content Validation Tests

Tests that validate source files (markdown, YAML) before build.

### frontmatter.js

Validates markdown under `src/_posts/` (posts) and every top-level `src/*.md` template (static pages and error templates such as `404.md`). Also validates YAML data files in `src/_data/`.

Post markdown is parsed with **gray-matter** (same stack as Eleventy), not the regex-based `parseFrontMatter()` used elsewhere for simple delimiter splitting. A small regression guard asserts that a `## title:` line without a closing `---` delimiter fails parse the way the build would.

**Checks (posts):** Required fields (`title`, `date`, `slug` from path or front matter), date/slug format validation, file naming convention (`YYYY/YYYY-MM-DD-slug.md`), duplicate slugs.

**Checks (top-level `src/*.md`):** Parse succeeds; required `title`; `date` except on `404.md` / `500.md`.

**Checks (data):** YAML data file syntax.

### markdown.js

Validates markdown syntax using `markdownlint-cli2` and custom checks for unclosed links and H1 headings. Excludes drafts and `docs/` directory.

### spell.js

Validates spelling in markdown and YAML files using `cspell`. Uses custom dictionary (`cspell-custom-words.txt`), excludes drafts, reports warnings (not errors). `cspell` 10.x requires Node **>= 22.18** (see root `package.json` `engines`).

**Note:** Also supports `node scripts/test/spell.js <file>` to check specific files.

### links.js

Validates structure and format of `src/_data/links.yaml`: date keys (YYYY-MM-DD), link objects with required `url` and `title` fields, optional `description`.

**Note:** With `--changed`, skips if links.yaml hasn't changed.

### wisdom-yaml.js

Validates `src/_data/wisdom-entries.yaml` for the Collected wisdom section (`/wisdom/`): `entries` array, required fields (`slug`, `added`, `tags`, `body`), slug format and uniqueness, `added` as `YYYY-MM-DD`, at least one tag per entry (slug-style tags), no unexpected fields. After that passes, checks `eleventy/utils/wisdom-build.js` output (sort order, `allTags`, slug rules) and runs an Eleventy `getGlobalData()` smoke check so global `wisdom` matches `buildWisdom` of the file on disk.

**Note:** With `--changed`, skips if `src/_data/wisdom-entries.yaml`, `src/_data/wisdom.js`, `wisdom-build.js`, or `wisdom-entries-path.js` under the paths above hasn't changed.

### css.js

Runs [Stylelint](https://stylelint.io) on `src/**/*.css` using `.stylelintrc.json` (extends `stylelint-config-standard` with project-specific rule overrides for modern CSS, print styles, and layout-specificity ordering).

**Note:** With `--changed`, exits successfully if no `src/**/*.css` files changed since last commit.

### color-contrast.js

Reads `light-dark()` (and legacy dark `:root`) color pairs from `src/assets/css/jonplummer.css`, parses hex or `oklch()` as **raw** values, then computes APCA **Lc** twice: after culori **`toGamut('rgb')`** with **apca-w3** `sRGBtoY`, and after **`toGamut('p3')`** with **`displayP3toY`**. **Pass/fail** (exit code) uses the **sRGB** path only (same thresholds as before). **Warnings** cover large sRGB-vs-P3 Lc divergence (while sRGB still meets minimum) and P3 below minimum while sRGB passes. Shared helpers live in `scripts/utils/apca-dual.js`.

## HTML Output Tests

Tests that validate built HTML files in `_site/` directory. **Requires:** `pnpm run build` first.

### deploy-assets.js

After `pnpm run build`, verifies `_site/` contains self-hosted fonts (WOFF2 under `assets/fonts/lab/`, `@font-face` in `jonplummer.css`), font preloads, and inline critical shell in `<head>`. Runs automatically as part of `build.js`'s post-build phase. (Whether `scripts/deploy/deploy.js` itself excludes `assets/fonts/` from rsync is checked separately by `deploy-guards.js` — see [Unit Tests](#unit-tests).)

### html.js

Validates HTML files for structural correctness, syntax errors, and deprecated elements using `html-validate`.

### internal-links.js

Validates that all internal links point to existing pages or anchors. Checks file links and anchor links (`#id`). Skips external/email/phone links.

### og-images.js

Validates that all HTML pages have appropriate Open Graph images. Missing `og:image` (ERROR), default image on non-index pages (ERROR), skips redirect pages.

### rss.js

Validates RSS/XML feed files for proper structure, required elements, and feed health. Checks RSS structure, item validity, duplicate GUIDs (ERROR), feed freshness (>30 days = WARNING), feed size (>500KB = WARNING).

### seo.js

Validates SEO metadata: title tags (10-200 chars), meta descriptions (20-300 chars), Open Graph tags, heading hierarchy (H1 required, no skipped levels), duplicate titles, canonical URL, language attribute. Skips redirects, blog pagination URLs, and error pages (404/500).

**Note:** With `--changed`, only checks if markdown files changed (skips if only links.yaml changed).

### a11y.js

Tests HTML files for accessibility violations using `axe-core` via Puppeteer. Tests each page in light mode (full WCAG compliance) and dark mode (color contrast only). Skips redirect pages.

**Note:** Slow test (launches browser for each page).

## Unit Tests

Tests of our own tooling code (parsers, deploy helpers) — not authored content or build output. No `_site/` or network dependency, so they run fast and can run any time. Not part of `build.js` or `deploy.js`; run them on demand with `pnpm run test unit` whenever you touch `scripts/utils/`, `scripts/deploy/`, or content parsers under `scripts/content/`.

### portfolio-notes.js

Runs fixture assertions against `parseNotesContent()` in `scripts/utils/portfolio-notes.js` (numbered lines including empty slides, `Slide N:` / `N)` variants, blank-line blocks). Guards regression for `convert-pdf-pages-with-notes` and `convert-presentation-portfolio`. With `--changed`, skips if neither the parser nor this test file changed since the last commit — this checks whether the *parser code* changed, not authored content, which is why it lives here rather than in `pnpm run test changed`.

### cloudflare-purge.js

Unit checks for `scripts/utils/cloudflare-purge.js`: rsync `--itemize-changes` parsing and `_site/` path → public URL mapping used by post-deploy selective purge.

### deploy-guards.js

Static regression guards for `scripts/deploy/deploy.js`'s source — no network or `_site/` dependency. Checks: rsync doesn't exclude `color/` or `assets/fonts/`, the changelog commit logic is present, and the Cloudflare selective-purge integration is wired up. Each check traces to a real past incident (accidentally excluding `/color/` or fonts from rsync, breaking the changelog auto-commit). Live connectivity checks (SSH, rsync upload, `.env`) are a separate, manual-only test — see `deploy.js` below.

## Infrastructure Tests

### deploy.js

Tests deployment configuration and connectivity: environment variables, SSH connectivity, remote directory access, rsync capability.

**Requirements:** `.env` file, `rsync`, SSH access, `_site/` directory

### security.js

Performs security and maintenance checks: `pnpm audit`, `pnpm outdated`, Node.js version, environment variables, `.htaccess` security headers, CSP, live site security (headers, TLS, DNS), manual checklist.

**Requirements:** `.env` file (optional `SITE_DOMAIN` for live checks), `_site/` directory for some checks

## Bundled Tests

### test-changed.js

Runs content-authoring tests on files changed since last commit. Test list comes from `CONTENT_CHANGED_TESTS` in `scripts/utils/test-runner-helper.js` — the single source of truth, kept in sync with each test script's actual `--changed` support (currently `spell`, `frontmatter`, `markdown`, `links`, `wisdom`, `css`, `seo`). Unit tests like `portfolio-notes` are deliberately excluded — they detect whether *tooling code* changed, not authored content; run `pnpm run test unit` for those.

## Deployment Integration

`pnpm run deploy` runs `pnpm run build` in full — all of `build.js`'s pre-build content checks, OG image generation, Eleventy, and post-build output checks (including `deploy-assets`). It does not run the `unit` suite; if you've touched deploy tooling, run `pnpm run test unit` yourself first.

**Changelog and push on deploy:** the script regenerates `CHANGELOG.md` before building; if it changed, deploy commits it after a successful deploy. Either way — changelog changed or not — deploy always runs `git push` afterward (skipped with `--dry-run`), so locally committed work never gets stranded unpushed. To verify manually: make a content commit, run `pnpm run deploy` (not dry-run), then check that a "changelog: update" commit (if any) and your own commit both landed on remote. `deploy-guards.js` (see [Unit Tests](#unit-tests)) statically checks that this commit/push logic is still present in `deploy.js`'s source.

## Test Architecture

All tests (except `deploy.js`) use a unified JSON output format automatically formatted by the test runner:

- **Verbose** (default): Detailed output with summary and file-by-file details
- **Build** (`--format build`): Blocking issues only, suitable for CI/CD

**Core Utilities:**
- `test-results.js`: Building test results, formatting output
- `test-helpers.js`: File operations and site directory checks
- `test-runner.js`: Orchestrates execution and formats results
- `test-runner-helper.js`: Common patterns (--changed flag, output formatting, exit codes)
- `html-utils.js`: HTML parsing
- `validation-utils.js`: Common validation functions
