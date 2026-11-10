# Test Scripts Documentation

## Overview

This project includes a suite of validation tests covering content structure, HTML output, SEO metadata, accessibility, and deployment readiness, plus a separate suite of unit tests for our own tooling code. The split reflects three different questions:

- **Fast tests** (`pnpm run test fast`): is what I authored/changed fit to build, and is the built output fit to ship? Split further into pre-build content checks and post-build output checks by `scripts/build/build.js`.
- **Unit tests** (`pnpm run test unit`): does our own tooling code (parsers, deploy helpers) still behave correctly? Not tied to any authored content or build output — run on demand whenever `scripts/utils/`, `scripts/deploy/`, or content parsers change.
- **Slow tests** (`a11y`) and **infrastructure tests** (`deploy`, `security`): occasional/manual checks that need a browser, live network, or credentials.

## The test manifest

[`scripts/test-manifest.js`](../scripts/test-manifest.js) is the single source of truth for which tests exist, which script runs them, and which groups (`fast`, `pre`, `post`, `unit`, `changed`) and flags (`slow`, `nonJson`, `listInHelp`) they carry. `scripts/test-runner.js`, `scripts/build/build.js`, and `scripts/test-changed.js` all derive their lists from it instead of keeping separate copies — the category lists in this doc are a human-readable view of the manifest, not an independent source. To add a new test: add one entry to the `TESTS` array in `scripts/test-manifest.js` with the right `groups` and its `name`, `description`, and `emoji` (how the runner shows it; all three are required), and it's automatically wired into `pnpm run test <id>`, `test fast`/`all`/`unit`/`changed` (as applicable), and the build phases. A `unit` entry must be a `node:test` file (see [Unit Tests](#unit-tests)); the manifest refuses to load otherwise. The only other edit is the Fast or Unit list under [Test Categories](#test-categories) below, which nothing checks. The manifest self-checks its own consistency (unknown script paths, `unit`/`fast` overlap, `changed` tests without real `--changed` support, etc.) every time it's loaded, so a broken roster fails loudly instead of drifting silently.

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

**Fast Tests:** `html`, `links`, `wisdom`, `shortlinks`, `portfolios`, `internal-links`, `frontmatter`, `markdown`, `spell`, `seo`, `og-images`, `color-contrast`, `css`, `rss`, `deploy-assets`, `error-document-assets`, `favicon-rasters`, `trailing-slash-links`, `critical-css`, `figure-tokens`, `design-docs-location`, `docs-links`, `portfolio-cover-crop`

**Unit Tests:** `portfolio-notes`, `cloudflare-purge`, `deploy-guards`, `indexnow`, `manifest-cursors`, `figure-lightbox`, `404-suggest`, `site-branding`, `preview-site-lockup`, `og-image-filename`, `og-card`, `date-utils`, `og-shared-fingerprint`, `og-card-digest`, `changelog-format`, `source-file-utils`, `test-json-pipe`, `live-smoke`, `noteplan-import`, `unit-reporter`, `unit-wiring` — see [Unit Tests](#unit-tests) below

**Slow Tests:** `a11y` (launches browser)

**Other Tests:** `deploy`, `security`

## Content Validation Tests

Tests that validate source files (markdown, YAML) before build.

### frontmatter.js

Validates markdown under `src/posts/` (posts), `src/portfolio/` (portfolio pieces), `src/sides/`, and every top-level `src/*.md` template (static pages and error templates such as `404.md`). Also validates YAML data files in `src/_data/`.

Post markdown is parsed with **gray-matter** (same stack as Eleventy), through `parseFrontMatter()` in `scripts/utils/frontmatter-utils.js`, the one parser every script and test uses. Regression guards cover broken `## title:` parse failure, rejection of unquoted YAML `Date` timestamps, blog filename/date match, and allowing portfolio date≠filename.

**Checks (posts):** Required fields (`title`, `date`, `slug` from path or front matter), date/slug format validation, file naming convention (`YYYY/YYYY-MM-DD-slug.md` for posts, `portfolio/YYYY-MM-DD-slug.md` for pieces), duplicate slugs. A `portfolio`-tagged file under `posts/`, or an untagged one under `portfolio/`, fails: the directory decides the URL. `date` must be a quoted string (rejects JS `Date` from unquoted YAML). Blog posts (`tags` includes `post`) must have front-matter calendar day equal to the filename `YYYY-MM-DD`; portfolio may diverge on purpose. Optional `coverPosition` / `coverZoom` must match the portfolio grid allowlists when present. Optional `leadFigure` must be a path under `/assets/images/` that exists and that the post body shows. A `description` that doesn't end in sentence punctuation gets a warning, since it may have been cut off: 86 WordPress-era excerpts stopped mid-sentence until 2026-11-08.

**Checks (top-level `src/*.md`):** Parse succeeds; required `title`; `date` except on `404.md` / `500.md` (quoted string, same Date-object rejection as posts).

**Checks (`src/sides/`):** `status` vocabulary when present; `date` if present must be a quoted string (same Date-object rejection).

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

### shortlinks.js

Validates `src/_data/shortlinks.yaml` (slug alphabet, uniqueness, absolute https destinations, retired → home) and, when `_site/.htaccess` exists, checks that each RewriteRule is present and appears before the wisdom-tag rule. Warns on duplicate destinations. Included in `test fast` and in both pre-build and post-build phases. An `.htaccess` older than `shortlinks.yaml` is a stale build and only warns, because the pre-build phase runs before Eleventy rewrites `_site/`; the post-build phase checks the fresh file and errors on any missing rule. Live 302 checks run in **deploy**, not here.

### portfolios.js

Validates `src/_data/portfolios.yaml`, the curated portfolio lists. A `main` list (`/portfolio/`) is required and takes only `intro` and `pieces`. Every other list needs a valid id (lowercase, hyphens; not `all`, which is the hidden index, and not any piece's slug), a `status` of `draft`, `live`, or `retired`, a title of 10–200 characters, and a description of 20–300, the same lengths `seo` checks on built pages. Every `pieces` URL must name a real portfolio piece or side project, read from source, and appear once per list. Fixture checks at the top guard the rules themselves, including that drafts build only outside production and that lists are hidden unless `indexed: true`. Reads source only, so it checks draft lists a production build never renders. Warns about pieces that are in no list. Spec: [portfolios from one list file](designs/specs/2026-11-08-two-portfolios-design.md).

### css.js

Runs [Stylelint](https://stylelint.io) on `src/**/*.css` using `.stylelintrc.json` (extends `stylelint-config-standard` with project-specific rule overrides for modern CSS, print styles, and layout-specificity ordering). Also guards a top-level `figure { margin-inline: 0 }` so captioned blog images are not inset by the UA 40px figure margin, and `article figure figcaption` italic so blog captions match portfolio.

**Note:** With `--changed`, exits successfully if no `src/**/*.css` files changed since last commit.

### portfolio-cover-crop.js

Guards portfolio grid thumbnail crop authoring: `validateCoverPosition` / `validateCoverZoom` allowlists, `jonplummer.css` custom properties (no per-slug `object-position` rules), `portfolio_list_item.njk` wiring, Monotasker `coverPosition: center 20%`, and — when `_site/portfolio/index.html` exists — that card’s inline `--cover-object-position`. In the built `/portfolio/` and `/sides/` pages, every card image must sit inside `span.card-cover`, the crop box the card template owns. The image transform emits a `<picture>` for opaque sources but a bare webp `<img>` for PNGs with an alpha channel, and a bare `<img>` can’t clip its own `scale`. Until 2026-11-08 the crop box was whichever of the two the transform emitted, so five zoomed portfolio covers grew past their grid column. Included in `test fast` and in `scripts/build/build.js` post-build.

### favicon-rasters.js

Guards the scraper-facing rasters: `favicon.ico` and `apple-touch-icon.png` must sit on a light content field (`#fafafa`) with a dark mark; `icon.svg` must stay unplated and still theme with `prefers-color-scheme`. Source of the rasters is `icon-raster.svg` (not linked in HTML). Included in `test fast` and in `scripts/build/build.js` pre-build. Regenerate with `pnpm run generate-favicon-rasters`.

### critical-css.js

Guards the inline first-paint shell in `src/_includes/head/critical.njk` against the `:root` tokens in `jonplummer.css`. The shell must hardcode those values (it covers for a stylesheet that has not loaded), so five pairs are compared token-to-declaration: body `background-color` vs `--content-background-color`, body `color` vs `--text-color`, body `font-family` vs `--font-family`, the heading rule's `font-family` vs `--font-family-display`, and `color-scheme`. Reuses `extractCssCustomProperties()` from `eleventy/utils/css-utils.js` (the same parser the OG pipeline uses). A pair whose declaration or token cannot be found **fails** rather than being skipped, so restructuring either file surfaces here instead of silently disabling the check. Included in `test fast` and in `scripts/build/build.js` pre-build; needs no `_site/`.

**Why it exists:** on 2026-08-11, `d3a2c0bc` softened the light page field to `oklch(98%)` and updated five files but not the shell. For two days every cold light-mode load flashed pure white before the stylesheet darkened it — the exact flash the shell prevents — until `43b968b4` caught it by eye. Drift is invisible in built HTML, invisible on repeat visits (cached CSS), and shows only on a first paint.

### figure-tokens.js

Generated post figures (`scripts/figures/`) are standalone SVGs shown with `<img>`, so they can't read the site stylesheet. Each copies `--text-color`, `--content-background-color`, and `--link-color` into its own `<style>`. This test finds every SVG under `src/assets/images/` that carries the "Generated by scripts/figures/" comment and fails if any copy differs from `jonplummer.css :root`, or if a generated figure declares none of them (the parser stopped seeing them). Fix a failure with `pnpm run generate-figures` and commit the SVG. It doesn't regenerate figures itself, so the suite never depends on fontkit or the label font. Included in `test fast` and `scripts/build/build.js` pre-build; needs no `_site/`. Spec: [lead figures](designs/specs/2026-10-29-lead-figure-style-design.md).

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

### docs-links.js

Checks that relative markdown links in `docs/` point at files that exist. Skips `docs/designs/plans/`, `specs/`, and `archive/`, which are dated records and name files as they were, and the gitignored `scratch/`. Ignores links inside code spans and fenced blocks, URLs with a scheme, root-absolute site paths, and bare `#anchors`. Does not check that an anchor exists in the target, and can't catch stale prose. Added 2026-10-24 after six links in `docs/designs/` were found pointing at `commands.md` and `tests.md` as siblings instead of one folder up. Does not need `_site/`.

### error-document-assets.js

Checks that the built `404.html` **and** `500.html` reference the stylesheet, font preloads, and all three favicons with root-absolute hrefs. Apache serves an ErrorDocument at whatever URL failed rather than at the page's own output path, so a file-relative href resolves against that failing URL and 404s in turn. Also reads `_site/.htaccess` and fails if it declares an `ErrorDocument` target that `ERROR_PAGES` does not cover, so adding one to the template cannot silently skip the check.

`500.html` was unchecked until 2026-09-04 and had shipped relative hrefs the whole time. The site-wide asset rule is root-absolute (a former `rootRelativePathPrefix` filter made them relative for `file://` browsing that never fully worked), so these pages are no longer a special case — they are the reason the rule exists.

### og-images.js

Validates that all HTML pages have appropriate Open Graph images. Missing `og:image` (ERROR), default image on non-index pages (ERROR), skips redirect pages.

### rss.js

Validates RSS/XML feed files for proper structure, required elements, and feed health. Checks RSS structure, item validity, duplicate GUIDs (ERROR), feed freshness (>30 days = WARNING, except `wisdom-feed.xml`, which grows when it grows), feed size (>500KB = WARNING).

### seo.js

Validates SEO metadata: title tags (10-200 chars), meta descriptions (20-300 chars), Open Graph tags, heading hierarchy (H1 required, no skipped levels), duplicate titles, canonical URL, language attribute. Skips redirects, blog pagination URLs, and error pages (404/500). Also reads `src/_includes/schema/person.njk` against `src/about.md`. `worksFor` is a current employer, so the schema may include it. The test fails only when the schema names one while the about page still says "I'm looking for my next role." Take that sentence off the page in the same change that adds the employer. Every `application/ld+json` block in the built HTML must also parse as JSON; the schema includes are hand-written JSON inside Nunjucks, where a trailing comma breaks them with no build error. With `--changed` that check covers only pages whose markdown changed, so run the full `seo` test after editing a schema include. It also fails if `_site/sitemap.xml` lists any URL twice. `sitemap.njk` writes URLs from several loops, and on 2026-10-16 four index pages were listed twice: once from `collections.page` and once from a hand-written block. And it fails if a page whose HTML carries `<meta name="robots" content="noindex">` (front matter `noindex: true`) is listed in the sitemap.

**Note:** With `--changed`, runs when markdown or `src/_includes/schema/` changed (skips if only links.yaml changed). The person-schema check still runs in that mode, including when the only change is the schema include.

### a11y.js

Tests HTML files for accessibility violations using `axe-core` via Puppeteer. Tests each page in light mode (full WCAG compliance) and dark mode (color contrast only). Skips redirect pages.

A short `EXCLUDED_PATHS` list at the top of the script names pages the sweep does not audit, each with its reason, and the run prints them back under **Not audited**, with every skipped page listed, so an exclusion stays a decision rather than a silence. A path ending in `/` skips the whole folder. Only one entry is on it today: `assets/demos/`. Demos are artifacts of the work the posts discuss, not pages the site's templates produce, so the sweep doesn't hold them to the site's own standard. Two cases put them there:

- The captured React prototype at `assets/demos/data-dictionary/data-dictionary.html` pulls React, Babel, and Tailwind from CDNs and renders its whole UI after `DOMContentLoaded`. The script loads pages with `waitUntil: 'domcontentloaded'`, so axe measured a half-mounted DOM there and the two color-mode passes disagreed with each other run to run (558 orphaned nodes in one, 557 and an extra `landmark-one-main` in the other).
- The Leaflet map at `assets/demos/erindouglass-bookmap/index.html` has no `<main>` or `<h1>` and draws its controls outside any landmark, so it failed `landmark-one-main`, `page-has-heading-one`, and `region` from the day it was added (2026-09-10) until the folder was skipped on 2026-11-08.

**Note:** Slow test (launches browser for each page).

## Unit Tests

Tests of our own tooling code (parsers, deploy helpers) — not authored content or build output. No network dependency, and no `_site/` needed, so they run fast and can run any time. One of them, `figure-lightbox`, also looks at a built page when `_site/` is there, and shows as skipped (⚠️) when it isn't. Not part of `build.js` or `deploy.js`; run them on demand with `pnpm run test unit` whenever you touch `scripts/utils/`, `scripts/deploy/`, or content parsers under `scripts/content/`.

Every unit test is written for Node's built-in test runner: `const { test } = require('node:test')`, `assert` from `node:assert`, one `test('…', …)` per behavior. `pnpm run test unit` runs them all in one `node --test --test-concurrency=1` call, one file at a time, because several write temp files and one launches a browser. A test that hasn't finished in two minutes is stopped and reported as failing, so a hung test can't hold the run open in silence. `scripts/utils/unit-reporter.js` prints each file's line with the number of tests it ran:

```text
✅ 🤷 404 suggestions: 🧪 25 tests, ✅ 25 passing
❌ 📅 Date Utils: 🧪 4 tests, ✅ 1 passing, ❌ 3 failing
    - date-only string displays LA calendar day: Expected values to be strictly equal: '' !== 'Dec 30, 2025'
```

`pnpm run test <id>` on one unit test also lists every test by name; add `--format build` for only its line. To add one: write the file under `scripts/test/`, add a manifest entry in the `unit` group, and add its id to the Unit list above. Don't report through `test-results.js` or `test-runner-helper.js` in a unit test; those belong to the site checks. (`test-json-pipe` requires `test-results.js` because that is the code it tests.)

Until 2026-11-09 unit tests reported through the site checks' results model, which counts files. A unit test handed it one made-up file, so 26 checks printed as `1 file checked, 1 passing`, and deleting 25 of them would have printed the same line. Plan: [unit tests on node:test](designs/plans/2026-11-09-unit-tests-on-node-test.md).

### unit-reporter.js

Tests the reporter itself by running `node --test` against small fixture files in `scripts/test/fixtures/unit-reporter/` and reading what it printed. Each case is something Node's own rules would let through or hide: a file with no tests counts as a pass in Node and must fail here; a skipped or todo test arrives as a pass and must show in the line and turn the icon to ⚠️; a file that crashes on load sends no summary and must print `stopped before reporting results` with its stack trace, including when the file was named by a relative path; a `before` hook that throws must show its failures, never `0 tests`; a file whose tests are all skipped ran nothing and must fail; a file that throws after its tests passed, or whose `after` hook throws, has all-passing counts and must fail with `failed outside its tests` and the error; a test that never settles must be stopped by the timeout and named. A failure inside a group and a subtest must still fail the file and be named, and two files with the same basename must be reported as two. Also covers the short failure line, the closing summary (printed for several files, not for one), and the verbose listing. A `node --test` started from inside a test prints nothing unless `NODE_TEST_CONTEXT` is removed from its environment; the test's `run()` helper does that.

### unit-wiring.js

Covers how unit tests are wired into `pnpm run test`. `isNodeTestSource()` in `scripts/test-manifest.js` is the rule the manifest applies to every unit entry on load: the file must load `node:test` in a statement of its own, in either quote style, and must not load `test-runner-helper`. A mention of either in a comment or a string counts for nothing. Until 2026-11-10 the rule was a text search, which a comment could satisfy and which refused this test's own file for naming the helper. It also runs the runner on one unit test, with and without `--format build`, to check that the flag drops the per-test listing.

### portfolio-notes.js

Runs fixture assertions against `parseNotesContent()` in `scripts/utils/portfolio-notes.js` (numbered lines including empty slides, `Slide N:` / `N)` variants, blank-line blocks). Guards regression for `convert-pdf-pages-with-notes` and `convert-presentation-portfolio`.

### cloudflare-purge.js

Unit checks for `scripts/utils/cloudflare-purge.js`: local SHA-256 content-manifest diffing (changed/added/deleted), `_site/` path → public URL mapping, and `purgeChangedDeployContent` orchestration (no-baseline / no-changes / dry-run) used by post-deploy selective purge. A final check passes a pre-built `currentManifest` with a nonexistent `siteRoot` — hashing a missing directory throws, so the call succeeding proves `deploy.js`'s single shared hash walk is honored rather than silently rebuilt.

### deploy-guards.js

Regression guards for the deploy script — no network or `_site/` dependency. Two kinds of check: assertions against the rsync argv built by `scripts/utils/deploy-rsync.js`, and static string checks on `scripts/deploy/deploy.js`'s source for logic that can't be called (the file deploys on require). Checks: rsync doesn't exclude `color/` or `assets/fonts/`; a default deploy passes neither `--itemize-changes` nor `--stats` while `--verbose` and `--dry-run` pass both; `--dry-run` carries rsync's own `--dry-run`; the changelog commit logic is present; the Cloudflare selective-purge integration is wired up; and `_site` is hashed exactly once (one `buildContentManifest()` call site) with that manifest passed to both consumers. It also runs `runWithSpinner` from `scripts/utils/spinner-utils.js` against a throwaway node child: it must resolve the exit code with both buffered streams, reject with `ENOENT` when a command can't start, and clear its spinner line. And `deploy.js` must not call `spawn(` or `setInterval(` itself, so the hand-rolled rsync spinner removed 2026-11-08 can't come back beside the shared one. That last check is a call-site count on purpose — a reintroduced second walk is invisible at runtime, since both walks produce correct results and only cost time. Each check traces to a real past incident (accidentally excluding `/color/` or fonts from rsync, breaking the changelog auto-commit, and a deploy whose itemized listing overflowed the terminal). Live connectivity checks (SSH, rsync upload, `.env`) are a separate, manual-only test — see `deploy.js` below. It also runs `cleanSiteExceptImages` (`scripts/utils/clean-site.js`) on a scratch directory, which must leave only `img/`, and checks that `scripts/build/build.js` calls it before its first test or build step. rsync's `--delete` mirrors `_site/` to the server, so a stale page in `_site/` ships; moving the portfolio pieces on 2026-11-08 left all 35 old pages there until a manual clean.

### indexnow.js

Unit checks for the URL-selection logic in `scripts/utils/indexnow.js`, against fixture manifests — no network. Covers `isIndexableHtmlPath` (drops `404.html`, `500.html`, `page/N/index.html`, and non-`.html` paths) and `selectIndexNowUrls`, which is bounded by the built sitemap: added-only, changed-only, added+changed together, no-previous-manifest → empty list, URL mapping via `deployPathToUrl`, changed pages outside the sitemap left out (`/changelog/`, demos, the Google verification file), pages that join or leave the sitemap submitted (a deleted page, a newly noindexed one), no guessing about departures when the stored state predates the recorded sitemap, and `/page/N/` left out even when it joins the sitemap. Also `selectAllIndexNowUrls` (catch-up submits the sitemap minus pagination) and `readSitemapUrls` (every `<loc>`, `&amp;` decoded). One orchestration check calls `processIndexNow` with a temp state file and a pre-built manifest, passing a deliberately nonexistent `siteRoot`: hashing a missing directory throws, so the call succeeding proves the injected manifest was used, and the temp file must still hold its original contents afterward because a dry run may not advance the cursor.

Reuses `scripts/utils/cloudflare-purge.js`'s content-hash manifest helpers (`buildContentManifest`, `diffContentManifests`, `loadContentManifest`, `saveContentManifest`, `deployPathToUrl`) but keeps its own state file, `.cache/indexnow-content-manifest.json`, separate from Cloudflare's. The two files hold the same snapshot after a healthy deploy, but they are independent cursors — "last state submitted" and "last state purged" — each advancing only when its own consumer succeeds, and each consumer can be disabled alone (`CLOUDFLARE_PURGE=0`, or a missing `INDEXNOW_API_KEY`). Sharing one file would let either one's failure or absence rewrite the other's retry state; with purging switched off, nothing would advance the shared cursor and IndexNow would resubmit a growing set every deploy. Only the `_site` hash walk is shared: `deploy.js` builds one manifest after rsync and passes it to both. Replaced a prior git-diff-based implementation (re-implemented Eleventy's permalink rules by hand and got them wrong) and its test, which validated plumbing but let real detection failures pass silently.

### manifest-cursors.js

Guards the two `.cache` content-hash state files against being merged or cross-contaminated. Runs the same composition `scripts/deploy/deploy.js` runs — one shared hash walk handed to `purgeChangedDeployContent` and `processIndexNow` — against a temp `_site` and temp state files, with `fetch` stubbed so nothing leaves the machine and the real `.cache/` is never touched.

Four properties: both cursors record the *identical* `generatedAt` (two hash walks would differ by milliseconds, so matching strings prove one manifest object reached both consumers); IndexNow still advances its cursor when Cloudflare purging is unconfigured; a failed purge leaves the Cloudflare cursor un-advanced without holding back IndexNow; and a failed IndexNow submission leaves its own cursor un-advanced without rolling back Cloudflare's. Those last three are why the second file exists — a single shared file cannot satisfy them, which is exactly what the test demonstrates when you point both paths at one file.

### preview-site-lockup.js

Unit checks for `scripts/utils/preview-site-lockup.js`: build-time `.site-lockup` HTML for `/color/` and `/type/` mini-page previews (mark SVG geometry, author link, optional tagline, HTML escaping). No `_site/` dependency.

### og-card.js

Unit checks for the OG card ([spec](designs/specs/2026-10-09-og-dark-card-design.md)). Labels: `Post`, `Portfolio`, `Side project`, or a page's nav-style path (`/about`); paginated and untagged templates get no card of their own. The inline mark in `og-image-body.njk` must match `jp-mark.svg`. Then a real Puppeteer render: the title font is Big Shoulders, not the fallback (the generator guards every image the same way); a short title fits at the 168px maximum with its cap height on the hang line; the longest title bottoms out at 96px, truncates at a word with an ellipsis, and stays inside its box. Needs Puppeteer's browser; no `_site/` dependency.

### og-image-filename.js

Unit checks for `generateOgImageFilename()` in `scripts/utils/og-image-filename.js`: date-only front matter (`YYYY-MM-DD`) must use calendar parts so local timezone does not shift the day (and double-prefix the slug). Also checks that the URL and disk path share the versioned directory (`/assets/images/og/v2/`) and that side projects name their card after the permalink. No `_site/` dependency.

### date-utils.js

Unit checks for `formatPostDate` / `formatPostDateAttr` in `eleventy/utils/date-utils.js`: date-only strings format as the America/Los_Angeles calendar day (not UTC midnight → previous Pacific day). No `_site/` dependency.

### og-shared-fingerprint.js

Unit checks for the OG shared fingerprint in `scripts/utils/og-shared-fingerprint.js`, run against a temp copy of the real inputs. The fingerprint is stable across runs; it ignores CSS rules outside `:root`, so a lightbox or layout edit doesn't re-render every card; and it changes when a design token, the card template, the card styles, or the fit script changes. No `_site/` dependency.

### og-card-digest.js

Unit checks for the OG card digest in `scripts/utils/og-card-digest.js`, which each PNG carries in a text chunk, and for the generator's choice to render, keep, or stamp a card (`cardAction` in `generate-og-images.js`). The digest changes with the title, the label, whether the label is a path, and the shared fingerprint, and with nothing else. Writing it leaves every other PNG chunk byte-identical, replaces an earlier digest instead of adding a second, and keeps every chunk's CRC valid. A missing file or a non-PNG reads as no digest. A card is rendered when its PNG is missing, its digest differs, or `--force` is passed, stamped when it differs and `--stamp` is passed, and kept otherwise, including after its file time changes. Works on temp copies of a real card. No `_site/` dependency.

### changelog-format.js

Unit checks for `wrapFilenames()` in `scripts/utils/changelog-format.js`, used by `generate-changelog.js`. Bare filenames like `ideas.md` are wrapped in backticks so markdown-it's linkify does not treat `.md` as Moldova's TLD (`https://ideas.md`). Also wraps other source extensions as code, leaves slash-prefixed paths and URLs alone, and asserts the generator still calls the helper. No `_site/` dependency.

### source-file-utils.js

Unit checks for `findSourceFile()` / `isRedirectPage()` in `scripts/utils/source-file-utils.js`, shared by `og-images.js` and `seo-meta.js` to resolve a built HTML path back to its source file: direct matches (`about.html` → `src/about.md`), the root index, permalink subdirectories (`ogimages/index.html` → `src/ogimages.njk`), portfolio pieces (`portfolio/slug/index.html` → `src/portfolio/YYYY-MM-DD-slug.md`, checked before the subdirectory fallback that would otherwise answer `src/portfolio.njk`), post permalinks (`YYYY/MM/DD/slug/index.html` → `src/posts/YYYY/YYYY-MM-DD-slug.md`, picked dynamically from an existing post so the fixture doesn't pin a slug that might later be renamed), and redirect-page detection (`data-redirect-url` attribute, meta refresh). Guards a past regression: the two test scripts carried separate copies of this logic and had drifted — `seo-meta.js`'s copy lacked the post-permalink block, so `test seo --changed` silently skipped every blog post. No `_site/` dependency.

### live-smoke.js

Unit checks for `scripts/utils/live-smoke.js`, which builds the list of requests `pnpm run smoke` makes against the live site and judges each answer. Covers one redirect check per `redirects.yaml` entry, retired lists checked with and without the slash, the random 404 path, root files and the page sample taken from the inputs, `Location` matching (relative against absolute, one trailing slash ignored, a different host rejected), and that a wrong status, `Location`, header, or body each produce their own failure. No network: the live run is `scripts/deploy/smoke-live.js`, described in [commands.md § Live smoke check](commands.md#live-smoke-check).

### noteplan-import.js

Unit tests for `scripts/content/import-noteplan-links.js`, which reads the "Links to import" note and rewrites `src/_data/links.yaml`. Every import rewrites the whole file through the script's own parser and formatter, so a fault there changes or drops links that are already published. Two tests use the real `links.yaml` as the fixture: the script must read it exactly as a YAML parser does, and writing it back must change nothing, byte for byte. The rest cover one line of the note (title, URL, optional description, a link inside the description, the invisible characters NotePlan pastes), the bullets a note may use, duplicate URLs across dates and within one note, and newest-date-first output. Reads `links.yaml`, never writes it, and doesn't touch NotePlan: the script runs only as a command, so requiring it loads its functions and nothing else. Added 2026-11-10; the script had no test before.

## Infrastructure Tests

### deploy.js

Tests deployment configuration and connectivity: environment variables, SSH connectivity, remote directory access, rsync capability.

**Requirements:** `.env` file, `rsync`, SSH access, `_site/` directory

### security.js

Performs security and maintenance checks: `pnpm audit`, `pnpm outdated`, Node.js version, environment variables, `.htaccess` security headers, CSP, live site security (headers, TLS, DNS), manual checklist.

**Requirements:** `.env` file (optional `SITE_DOMAIN` for live checks), `_site/` directory for some checks

## Bundled Tests

### test-changed.js

Runs content-authoring tests on files changed since last commit. Test list comes from the `changed` group in [`scripts/test-manifest.js`](#the-test-manifest) (currently `spell`, `frontmatter`, `markdown`, `links`, `wisdom`, `css`, `seo`). Unit tests like `portfolio-notes` are deliberately excluded — they check tooling code, not authored content; run `pnpm run test unit` for those.

## Deployment Integration

`pnpm run deploy` runs `pnpm run build` in full — all of `build.js`'s pre-build content checks, OG image generation, Eleventy, and post-build output checks (including `deploy-assets`). It does not run the `unit` suite; if you've touched deploy tooling, run `pnpm run test unit` yourself first.

**Changelog and push on deploy:** the script regenerates `CHANGELOG.md` before building; if it changed, deploy commits it after a successful deploy. Either way — changelog changed or not — deploy always runs `git push` afterward (skipped with `--dry-run`), so locally committed work never gets stranded unpushed. To verify manually: make a content commit, run `pnpm run deploy` (not dry-run), then check that a "changelog: update" commit (if any) and your own commit both landed on remote. `deploy-guards.js` (see [Unit Tests](#unit-tests)) statically checks that this commit/push logic is still present in `deploy.js`'s source.

## Test Architecture

There are two kinds of test, and each reports in the way that fits it.

**Unit tests** run on `node:test` and report tests, through `scripts/utils/unit-reporter.js`. See [Unit Tests](#unit-tests).

**Site checks** (everything in `fast`, plus `a11y`) walk many files and report issues per file. All of them except `deploy.js` and `security` use a unified JSON output format automatically formatted by the test runner:

- **Verbose** (default): Detailed output with summary and file-by-file details
- **Build** (`--format build`): Blocking issues only, suitable for CI/CD

A test's icon comes from its exit code as well as its issue count (`resultIcon()` in `test-results.js`). A test file that crashes reports no issues, so the runner prints `❌ … stopped before reporting results (exit code 1)` under its stack trace. Until 2026-11-09 it printed a ✅ there, or nothing in a group run, though the exit code was right. `test-json-pipe.js` guards the icon.

**Core Utilities:**
- `test-results.js`: Building test results, formatting output
- `test-helpers.js`: File operations and site directory checks
- `test-runner.js`: Orchestrates execution and formats results; hands unit tests to `node --test`
- `unit-reporter.js`: The `node:test` reporter for unit tests
- `test-runner-helper.js`: Common patterns (--changed flag, output formatting, exit codes)
- `html-utils.js`: HTML parsing
- `validation-utils.js`: Common validation functions
