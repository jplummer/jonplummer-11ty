# Test Scripts Documentation

## Overview

This project includes a suite of validation tests covering content structure, HTML output, SEO metadata, accessibility, and deployment readiness, plus a separate suite of unit tests for our own tooling code. The split reflects three different questions:

- **Fast tests** (`pnpm run test fast`): is what I authored/changed fit to build, and is the built output fit to ship? Split further into pre-build content checks and post-build output checks by `scripts/build/build.js`.
- **Unit tests** (`pnpm run test unit`): does our own tooling code (parsers, deploy helpers) still behave correctly? Not tied to any authored content or build output — run on demand whenever `scripts/utils/`, `scripts/deploy/`, or content parsers change.
- **Slow tests** (`a11y`) and **infrastructure tests** (`deploy`, `security`): occasional/manual checks that need a browser, live network, or credentials.

## The test manifest

[`scripts/test-manifest.js`](../scripts/test-manifest.js) is the single source of truth for which tests exist, which script runs them, and which groups (`fast`, `pre`, `post`, `unit`, `changed`) and flags (`slow`, `nonJson`, `listInHelp`) they carry. `scripts/test-runner.js`, `scripts/build/build.js`, and `scripts/test-changed.js` all derive their lists from it instead of keeping separate copies — the category lists in this doc are a human-readable view of the manifest, not an independent source. To add a new test: add one entry to the `TESTS` array in `scripts/test-manifest.js` with the right `groups`, and it's automatically wired into `pnpm run test <id>`, `test fast`/`all`/`unit`/`changed` (as applicable), and the build phases — no other file needs editing. The manifest self-checks its own consistency (unknown script paths, `unit`/`fast` overlap, `changed` tests without real `--changed` support, etc.) every time it's loaded, so a broken roster fails loudly instead of drifting silently.

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

_Derived from [`scripts/test-manifest.js`](../scripts/test-manifest.js) — see [The test manifest](#the-test-manifest)._

**Fast Tests:** `html`, `links`, `wisdom`, `internal-links`, `frontmatter`, `markdown`, `spell`, `seo`, `og-images`, `color-contrast`, `css`, `rss`, `deploy-assets`, `error-document-assets`, `favicon-rasters`, `trailing-slash-links`, `critical-css`, `design-docs-location`, `portfolio-cover-crop`

**Unit Tests:** `portfolio-notes`, `cloudflare-purge`, `deploy-guards`, `indexnow`, `manifest-cursors`, `figure-lightbox`, `site-branding`, `preview-site-lockup`, `light-theme-colors`, `og-image-filename`, `source-file-utils`, `test-json-pipe` — see [Unit Tests](#unit-tests) below

**Slow Tests:** `a11y` (launches browser)

**Other Tests:** `deploy`, `security`

## Content Validation Tests

Tests that validate source files (markdown, YAML) before build.

### frontmatter.js

Validates markdown under `src/_posts/` (posts) and every top-level `src/*.md` template (static pages and error templates such as `404.md`). Also validates YAML data files in `src/_data/`.

Post markdown is parsed with **gray-matter** (same stack as Eleventy), not the regex-based `parseFrontMatter()` used elsewhere for simple delimiter splitting. A small regression guard asserts that a `## title:` line without a closing `---` delimiter fails parse the way the build would.

**Checks (posts):** Required fields (`title`, `date`, `slug` from path or front matter), date/slug format validation, file naming convention (`YYYY/YYYY-MM-DD-slug.md`), duplicate slugs. Optional `coverPosition` / `coverZoom` must match the portfolio grid allowlists when present.

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

Runs [Stylelint](https://stylelint.io) on `src/**/*.css` using `.stylelintrc.json` (extends `stylelint-config-standard` with project-specific rule overrides for modern CSS, print styles, and layout-specificity ordering). Also guards a top-level `figure { margin-inline: 0 }` so captioned blog images are not inset by the UA 40px figure margin, and `article figure figcaption` italic so blog captions match portfolio.

**Note:** With `--changed`, exits successfully if no `src/**/*.css` files changed since last commit.

### portfolio-cover-crop.js

Guards portfolio grid thumbnail crop authoring: `validateCoverPosition` / `validateCoverZoom` allowlists, `jonplummer.css` custom properties (no per-slug `object-position` rules), `portfolio_list_item.njk` wiring, Monotasker `coverPosition: center 20%`, and — when `_site/portfolio/index.html` exists — that card’s inline `--cover-object-position`. Included in `test fast` and in `scripts/build/build.js` post-build.

### favicon-rasters.js

Guards the scraper-facing rasters: `favicon.ico` and `apple-touch-icon.png` must sit on a light content field (`#fafafa`) with a dark mark; `icon.svg` must stay unplated and still theme with `prefers-color-scheme`. Source of the rasters is `icon-raster.svg` (not linked in HTML). Included in `test fast` and in `scripts/build/build.js` pre-build. Regenerate with `pnpm run generate-favicon-rasters`.

### critical-css.js

Guards the inline first-paint shell in `src/_includes/head/critical.njk` against the `:root` tokens in `jonplummer.css`. The shell must hardcode those values (it covers for a stylesheet that has not loaded), so five pairs are compared token-to-declaration: body `background-color` vs `--content-background-color`, body `color` vs `--text-color`, body `font-family` vs `--font-family`, the heading rule's `font-family` vs `--font-family-display`, and `color-scheme`. Reuses `extractCssCustomProperties()` from `eleventy/utils/css-utils.js` (the same parser the OG pipeline uses). A pair whose declaration or token cannot be found **fails** rather than being skipped, so restructuring either file surfaces here instead of silently disabling the check. Included in `test fast` and in `scripts/build/build.js` pre-build; needs no `_site/`.

**Why it exists:** on 2026-08-11, `d3a2c0bc` softened the light page field to `oklch(98%)` and updated five files but not the shell. For two days every cold light-mode load flashed pure white before the stylesheet darkened it — the exact flash the shell prevents — until `43b968b4` caught it by eye. Drift is invisible in built HTML, invisible on repeat visits (cached CSS), and shows only on a first paint.

### color-contrast.js

Reads `light-dark()` (and legacy dark `:root`) color pairs from `src/assets/css/jonplummer.css`, parses hex or `oklch()` as **raw** values, then computes APCA **Lc** twice: after culori **`toGamut('rgb')`** with **apca-w3** `sRGBtoY`, and after **`toGamut('p3')`** with **`displayP3toY`**. **Pass/fail** (exit code) uses the **sRGB** path only (same thresholds as before). **Warnings** cover large sRGB-vs-P3 Lc divergence (while sRGB still meets minimum) and P3 below minimum while sRGB passes. Shared helpers live in `scripts/utils/apca-dual.js`. Dark-mode **link on content** uses a craft floor **min Lc 55** (preferred still 75) so the denser dark accent can ship without failing the suite.

## HTML Output Tests

Tests that validate built HTML files in `_site/` directory. **Requires:** `pnpm run build` first.

### deploy-assets.js

After `pnpm run build`, verifies `_site/` contains self-hosted fonts (WOFF2 under `assets/fonts/lab/`, `@font-face` in `jonplummer.css`), font preloads, and inline critical shell in `<head>`. Runs automatically as part of `build.js`'s post-build phase. (Whether `scripts/deploy/deploy.js` itself excludes `assets/fonts/` from rsync is checked separately by `deploy-guards.js` — see [Unit Tests](#unit-tests).)

### html.js

Validates HTML files for structural correctness, syntax errors, and deprecated elements using `html-validate`. Also requires a leading `<!doctype html>` (html-validate's own doctype rule only checks form, not presence). Skips Google Search Console verification files (`google*.html` at the site root) — those are one-line tokens, not documents.

### internal-links.js

Validates that all internal links point to existing pages or anchors. Checks file links and anchor links (`#id`). Skips external/email/phone links.

### trailing-slash-links.js

Scans `src/**/*.{md,njk,html}` for root-absolute internal links that omit a trailing slash on directory-style paths (e.g. `/colophon` instead of `/colophon/`). Apache 301s those to the slashed URL; Ahrefs reports each linking page as a redirect issue. File URLs with an extension (e.g. `/feed.xml`) are allowed. Does not need `_site/`.

### design-docs-location.js

Guards the `docs/designs/` structure. Fails if the retired `docs/superpowers/` directory exists (the superpowers `writing-plans` / `brainstorming` skills default to that path and defer to user preference for it — see `CLAUDE.md` § Design records), if anything under the gitignored `docs/designs/scratch/` is tracked, or if `docs/designs/specs/` or `plans/` goes missing. Does not check for the old path in prose — the files that document this override have to name it. Does not need `_site/`.

### error-document-assets.js

Checks that the built `404.html` **and** `500.html` reference the stylesheet, font preloads, and all three favicons with root-absolute hrefs. Apache serves an ErrorDocument at whatever URL failed rather than at the page's own output path, so a file-relative href resolves against that failing URL and 404s in turn. Also reads `_site/.htaccess` and fails if it declares an `ErrorDocument` target that `ERROR_PAGES` does not cover, so adding one to the template cannot silently skip the check.

`500.html` was unchecked until 2026-09-04 and had shipped relative hrefs the whole time. The site-wide asset rule is root-absolute (a former `rootRelativePathPrefix` filter made them relative for `file://` browsing that never fully worked), so these pages are no longer a special case — they are the reason the rule exists.

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

Unit checks for `scripts/utils/cloudflare-purge.js`: local SHA-256 content-manifest diffing (changed/added/deleted), `_site/` path → public URL mapping, and `purgeChangedDeployContent` orchestration (no-baseline / no-changes / dry-run) used by post-deploy selective purge. A final check passes a pre-built `currentManifest` with a nonexistent `siteRoot` — hashing a missing directory throws, so the call succeeding proves `deploy.js`'s single shared hash walk is honored rather than silently rebuilt.

### deploy-guards.js

Regression guards for the deploy script — no network or `_site/` dependency. Two kinds of check: assertions against the rsync argv built by `scripts/utils/deploy-rsync.js`, and static string checks on `scripts/deploy/deploy.js`'s source for logic that can't be called (the file deploys on require). Checks: rsync doesn't exclude `color/` or `assets/fonts/`; a default deploy passes neither `--itemize-changes` nor `--stats` while `--verbose` and `--dry-run` pass both; `--dry-run` carries rsync's own `--dry-run`; the changelog commit logic is present; the Cloudflare selective-purge integration is wired up; and `_site` is hashed exactly once (one `buildContentManifest()` call site) with that manifest passed to both consumers. That last check is a call-site count on purpose — a reintroduced second walk is invisible at runtime, since both walks produce correct results and only cost time. Each check traces to a real past incident (accidentally excluding `/color/` or fonts from rsync, breaking the changelog auto-commit, and a deploy whose itemized listing overflowed the terminal). Live connectivity checks (SSH, rsync upload, `.env`) are a separate, manual-only test — see `deploy.js` below.

### indexnow.js

Unit checks for the URL-selection logic in `scripts/utils/indexnow.js`, against fixture manifests — no network. Covers `isIndexableHtmlPath` (drops `404.html`, `500.html`, `page/N/index.html`, and non-`.html` paths) and `selectIndexNowUrls` (added-only, changed-only, added+changed together, deleted excluded, no-previous-manifest → empty list, and URL mapping via `deployPathToUrl`). One orchestration check calls `processIndexNow` with a temp state file and a pre-built manifest, passing a deliberately nonexistent `siteRoot`: hashing a missing directory throws, so the call succeeding proves the injected manifest was used, and the temp file must still hold its original contents afterward because a dry run may not advance the cursor.

Reuses `scripts/utils/cloudflare-purge.js`'s content-hash manifest helpers (`buildContentManifest`, `diffContentManifests`, `loadContentManifest`, `saveContentManifest`, `deployPathToUrl`) but keeps its own state file, `.cache/indexnow-content-manifest.json`, separate from Cloudflare's. The two files hold the same snapshot after a healthy deploy, but they are independent cursors — "last state submitted" and "last state purged" — each advancing only when its own consumer succeeds, and each consumer can be disabled alone (`CLOUDFLARE_PURGE=0`, or a missing `INDEXNOW_API_KEY`). Sharing one file would let either one's failure or absence rewrite the other's retry state; with purging switched off, nothing would advance the shared cursor and IndexNow would resubmit a growing set every deploy. Only the `_site` hash walk is shared: `deploy.js` builds one manifest after rsync and passes it to both. Replaced a prior git-diff-based implementation (re-implemented Eleventy's permalink rules by hand and got them wrong) and its test, which validated plumbing but let real detection failures pass silently.

### manifest-cursors.js

Guards the two `.cache` content-hash state files against being merged or cross-contaminated. Runs the same composition `scripts/deploy/deploy.js` runs — one shared hash walk handed to `purgeChangedDeployContent` and `processIndexNow` — against a temp `_site` and temp state files, with `fetch` stubbed so nothing leaves the machine and the real `.cache/` is never touched.

Four properties: both cursors record the *identical* `generatedAt` (two hash walks would differ by milliseconds, so matching strings prove one manifest object reached both consumers); IndexNow still advances its cursor when Cloudflare purging is unconfigured; a failed purge leaves the Cloudflare cursor un-advanced without holding back IndexNow; and a failed IndexNow submission leaves its own cursor un-advanced without rolling back Cloudflare's. Those last three are why the second file exists — a single shared file cannot satisfy them, which is exactly what the test demonstrates when you point both paths at one file.

### preview-site-lockup.js

Unit checks for `scripts/utils/preview-site-lockup.js`: build-time `.site-lockup` HTML for `/color/` and `/type/` mini-page previews (mark SVG geometry, author link, optional tagline, HTML escaping). No `_site/` dependency.

### light-theme-colors.js

Unit checks for `extractLightThemeColorOverrides()` in `eleventy/utils/css-utils.js`: OG screenshots need forced-light `:root` colors. Asserts all required tokens extract (lived `light-dark()` colors plus `var()` aliases for hover/visited/active). No `_site/` dependency.

### og-image-filename.js

Unit checks for `generateOgImageFilename()` in `scripts/utils/og-image-filename.js`: date-only front matter (`YYYY-MM-DD`) must use calendar parts so local timezone does not shift the day (and double-prefix the slug). No `_site/` dependency.

### source-file-utils.js

Unit checks for `findSourceFile()` / `isRedirectPage()` in `scripts/utils/source-file-utils.js`, shared by `og-images.js` and `seo-meta.js` to resolve a built HTML path back to its source file: direct matches (`about.html` → `src/about.md`), the root index, permalink subdirectories (`ogimages/index.html` → `src/ogimages.njk`), post permalinks (`YYYY/MM/DD/slug/index.html` → `src/_posts/YYYY/YYYY-MM-DD-slug.md`, picked dynamically from an existing post so the fixture doesn't pin a slug that might later be renamed), and redirect-page detection (`data-redirect-url` attribute, meta refresh). Guards a past regression: the two test scripts carried separate copies of this logic and had drifted — `seo-meta.js`'s copy lacked the post-permalink block, so `test seo --changed` silently skipped every blog post. No `_site/` dependency.

## Infrastructure Tests

### deploy.js

Tests deployment configuration and connectivity: environment variables, SSH connectivity, remote directory access, rsync capability.

**Requirements:** `.env` file, `rsync`, SSH access, `_site/` directory

### security.js

Performs security and maintenance checks: `pnpm audit`, `pnpm outdated`, Node.js version, environment variables, `.htaccess` security headers, CSP, live site security (headers, TLS, DNS), manual checklist.

**Requirements:** `.env` file (optional `SITE_DOMAIN` for live checks), `_site/` directory for some checks

## Bundled Tests

### test-changed.js

Runs content-authoring tests on files changed since last commit. Test list comes from the `changed` group in [`scripts/test-manifest.js`](#the-test-manifest) (currently `spell`, `frontmatter`, `markdown`, `links`, `wisdom`, `css`, `seo`). Unit tests like `portfolio-notes` are deliberately excluded — they detect whether *tooling code* changed, not authored content; run `pnpm run test unit` for those.

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
