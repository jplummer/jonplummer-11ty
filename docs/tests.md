# Test Scripts Documentation

## Overview

This project includes a suite of validation tests covering content structure, HTML output, SEO metadata, accessibility, and deployment readiness. Tests are grouped as "fast" (for frequent, quick checks) and "slow" (for in-depth checks run occasionally).

## Test Execution

- `pnpm run test` - List available test types
- `pnpm run test [type]` - Run a specific test type (checks all files)
- `pnpm run test fast` - Run all fast tests (excludes slow tests like a11y)
- `pnpm run test all` - Run all tests including slow ones
- `pnpm run test changed` - Run authoring tests on files changed since last commit
- `pnpm run validate` - Quick HTML validity check (shortcut for `pnpm run test html`)

**Common commands for individual tests:**
- `pnpm run test [type]` - Check all files
- `node scripts/test/[type].js --changed` - Check only changed files (where supported)

**Exceptions:**
- `spell`: Also supports `node scripts/test/spell.js <file>` to check specific files
- `security`: Can also use `pnpm run security-audit`

### Test Categories

**Fast Tests:** `html`, `links`, `internal-links`, `frontmatter`, `markdown`, `spell`, `seo`, `og-images`, `rss`

**Slow Tests:** `a11y` (launches browser)

**Other Tests:** `deploy`, `security`

## Content Validation Tests

Tests that validate source files (markdown, YAML) before build.

### frontmatter.js

Validates source markdown files in `src/_posts/` for proper front matter structure, file naming conventions, and required fields. Also validates YAML data files in `src/_data/`.

**Checks:** Required fields (`title`, `date`, `slug`), date/slug format validation, file naming convention (`YYYY/YYYY-MM-DD-slug.md`), duplicate slugs, YAML data file syntax.

### markdown.js

Validates markdown syntax using `markdownlint-cli2` and custom checks for unclosed links and H1 headings. Excludes drafts and `docs/` directory.

### spell.js

Validates spelling in markdown and YAML files using `cspell`. Uses custom dictionary (`cspell-custom-words.txt`), excludes drafts, reports warnings (not errors).

**Note:** Also supports `node scripts/test/spell.js <file>` to check specific files.

### links.js

Validates structure and format of `src/_data/links.yaml`: date keys (YYYY-MM-DD), link objects with required `url` and `title` fields, optional `description`.

**Note:** With `--changed`, skips if links.yaml hasn't changed.

## HTML Output Tests

Tests that validate built HTML files in `_site/` directory. **Requires:** `pnpm run build` first.

### html.js

Validates HTML files for structural correctness, syntax errors, and deprecated elements using `html-validate`.

### internal-links.js

Validates that all internal links point to existing pages or anchors. Checks file links and anchor links (`#id`). Skips external/email/phone links.

### og-images.js

Validates that all HTML pages have appropriate Open Graph images. Missing `og:image` (ERROR), default image on non-index pages (ERROR), skips redirect pages.

### rss.js

Validates RSS/XML feed files for proper structure, required elements, and feed health. Checks RSS structure, item validity, duplicate GUIDs (ERROR), feed freshness (>30 days = WARNING), feed size (>500KB = WARNING).

### seo.js

Validates SEO metadata: title tags (10-200 chars), meta descriptions (20-300 chars), Open Graph tags, heading hierarchy (H1 required, no skipped levels), duplicate titles, canonical URL, language attribute. Skips redirect and utility pages.

**Note:** With `--changed`, only checks if markdown files changed (skips if only links.yaml changed).

### a11y.js

Tests HTML files for accessibility violations using `axe-core` via Puppeteer. Tests each page in light mode (full WCAG compliance) and dark mode (color contrast only). Skips redirect pages.

**Note:** Slow test (launches browser for each page).

## Infrastructure Tests

### deploy.js

Tests deployment configuration and connectivity: environment variables, SSH connectivity, remote directory access, rsync capability.

**Requirements:** `.env` file, `rsync`, SSH access, `_site/` directory

### security.js

Performs security and maintenance checks: `pnpm audit`, `pnpm outdated`, Node.js version, environment variables, `.htaccess` security headers, CSP, live site security (headers, TLS, DNS), manual checklist.

**Requirements:** `.env` file (optional `SITE_DOMAIN` for live checks), `_site/` directory for some checks

## Bundled Tests

### test-changed.js

Runs authoring tests on files changed since last commit: `spell`, `frontmatter`, `markdown`, `links` (if changed), `seo` (if markdown changed).

## Deployment Integration

The deployment script automatically runs: `markdown` and `frontmatter` (pre-build), `og-images` (post-build). Can be skipped with `--skip-checks` (not recommended).

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
