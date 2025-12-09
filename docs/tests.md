# Test Scripts Documentation

## Overview

This project includes a suite of validation tests covering content structure, HTML output, SEO metadata, accessibility, and deployment readiness. Tests are grouped as "fast" (for frequent, quick checks) and "slow" (for in-depth checks run occasionally).

## Test Execution

- `npm run test` - List available test types
- `npm run test [type]` - Run a specific test type
- `npm run test fast` - Run all fast tests (excludes slow tests like accessibility)
- `npm run test all` - Run all tests including slow ones
- `npm run validate` - Quick HTML validity check (shortcut for `npm run test html`)

### Test Categories

Fast Tests (suitable for pre-commit hooks or frequent validation):
- `html` - HTML validity
- `links-yaml` - Links YAML structure
- `internal-links` - Internal link validity
- `content-structure` - Content structure validation
- `markdown` - Markdown syntax validation
- `seo-meta` - SEO and meta tags
- `og-images` - Open Graph images
- `rss-feed` - RSS feed validation

Slow Tests (run occasionally):
- `accessibility` - Accessibility validation using axe-core (launches browser)

Other Tests:
- `deploy` - Deployment connectivity and configuration testing

## Test Scripts

### html.js - HTML Validation

Validates HTML files in `_site/` directory for structural correctness, syntax errors, and deprecated elements using `html-validate`.

When to use:
- Before deployment to catch HTML errors
- After making template changes
- As part of `npm run test fast` or `npm run test all`
- Use `npm run validate` for quick HTML checks

Automatically invoked by:
- `npm run test fast` (included in fast tests)
- `npm run test all` (included in all tests)
- `npm run validate` (shortcut command)

Checks:
- HTML structure validation (html-validate)
- Syntax errors
- Deprecated elements
- Invalid attributes
- Missing required elements
- Severity levels: errors (blocking) and warnings (non-blocking)

Requirements: `_site/` directory must exist (run `npm run build` first)

### content-structure.js - Content Structure Validation

Validates source markdown files in `src/_posts/` for proper front matter structure, file naming conventions, and required fields. Also validates YAML data files in `src/_data/`.

When to use:
- When creating or editing posts
- Before committing new content
- As part of `npm run test fast` or `npm run test all`
- Automatically during deployment (pre-deploy validation)

Automatically invoked by:
- `npm run test fast` (included in fast tests)
- `npm run test all` (included in all tests)
- `scripts/deploy/deploy.js` (pre-deploy validation, before build)

Checks:
- Required fields: `title`, `date` (required), `slug` (required if not provided by directory structure)
- Title validation: 1-200 characters (ERROR if outside range). More lenient than `seo-meta.js` (30-60) because this validates source content
- Date validation: Valid ISO date format (YYYY-MM-DD or ISO datetime)
- Slug validation: Valid slug format (alphanumeric, hyphens, underscores)
- Meta description: 50-160 characters (WARNING if outside range, WARNING if missing). More lenient than `seo-meta.js` (120-160) because this validates source markdown. Missing description is WARNING here (not ERROR) - `seo-meta.js` will catch it as ERROR in final output
- File naming: Must follow `YYYY/YYYY-MM-DD-slug.md` convention
- Duplicate slugs: Checks for duplicate slugs across all posts
- YAML data files: Validates YAML syntax in `src/_data/*.yaml` files
- Draft exclusion: Automatically excludes files with `draft: true` in front matter

Note: This test uses more lenient ranges than `seo-meta.js` because it validates source markdown files, which may be edited before final output. The stricter `seo-meta.js` test validates the final HTML output with SEO best practices.

### markdown.js - Markdown Syntax Validation

Validates markdown syntax in source files using `markdownlint-cli2` and custom checks for unclosed links and H1 headings.

When to use:
- When writing or editing markdown content
- Before committing content changes
- As part of `npm run test fast` or `npm run test all`
- Automatically during deployment (pre-deploy validation)

Automatically invoked by:
- `npm run test fast` (included in fast tests)
- `npm run test all` (included in all tests)
- `scripts/deploy/deploy.js` (pre-deploy validation, before build)

Checks:
- markdownlint-cli2: Runs markdownlint rules from `.markdownlint.json` (blank lines around headings, list formatting, code block formatting, and other markdownlint rules)
- Unclosed markdown links: Detects `[text](url` patterns missing closing parenthesis
- H1 headings: Warns about H1 headings in markdown (templates add H1 from front matter title)
- Draft exclusion: Automatically excludes files with `draft: true` in front matter
- Directory exclusion: Excludes `docs/` directory from validation

Requirements: Source markdown files in `src/` directory, `.markdownlint.json` configuration file

### seo-meta.js - SEO and Meta Tags Validation

Validates SEO metadata in final HTML output, including title tags, meta descriptions, Open Graph tags, heading hierarchy, and duplicate titles.

When to use:
- Before deployment to ensure SEO compliance
- After template changes that affect meta tags
- As part of `npm run test fast` or `npm run test all`

Automatically invoked by:
- `npm run test fast` (included in fast tests)
- `npm run test all` (included in all tests)

Checks:
- Title tag: ERROR if missing, WARNING if length is not 30-60 characters (SEO best practice), WARNING if too many separators (|), skipped for redirect pages
- Meta description: ERROR if missing (critical for SEO), WARNING if length is not 120-160 characters (SEO best practice), ERROR if contains unescaped quotes, skipped for redirect pages
- Open Graph tags (WARNINGS): Required `og:title`, `og:description`, `og:type`, recommended `og:image`, `og:url`, validates tag lengths and formats, skipped for redirect pages
- Heading hierarchy: ERROR if no H1 heading found, ERROR if heading hierarchy skips levels (e.g., H2 → H4), ERROR if empty headings found, skipped for redirect pages and utility pages (e.g., og-image-preview)
- Duplicate titles: ERROR if multiple pages share the same title
- Canonical URL: WARNING if missing
- Language attribute: WARNING if missing on `<html>` tag

Note: This test uses stricter ranges than `content-structure.js` because it validates final HTML output with SEO best practices: Title 30-60 chars (vs 1-200 in content-structure), Meta description 120-160 chars (vs 50-160 in content-structure), Missing description is ERROR here (vs WARNING in content-structure)

Requirements: `_site/` directory must exist (run `npm run build` first)

### accessibility.js - Accessibility Validation

Tests HTML files for accessibility violations using `axe-core` via Puppeteer. Tests each page in both light and dark mode (dark mode tests contrast only).

When to use:
- Before major releases
- After significant template or content changes
- Periodically to ensure accessibility compliance
- As part of `npm run test all` (not included in fast tests due to speed)

Automatically invoked by:
- `npm run test all` (included in all tests, but NOT in fast tests)

Checks:
- Light mode: Full axe-core rule set (color contrast, ARIA attributes, keyboard navigation, focus management, semantic HTML, and all other WCAG accessibility rules)
- Dark mode: Color contrast only (tests contrast in dark mode)
- Violations: Reported as issues with impact level (critical, serious, moderate, minor)
- Incomplete checks: Reported as warnings (require manual review)
- Redirect pages: Automatically skipped (minimal HTML, redirect immediately)

Requirements: `_site/` directory must exist (run `npm run build` first), Puppeteer (launches headless browser), slower than other tests (runs browser for each page)

### links-yaml.js - Links YAML Validation

Validates the structure and format of `src/_data/links.yaml`, ensuring proper date keys, link objects, and required fields.

When to use:
- When editing `links.yaml` file
- Before committing changes to links data
- As part of `npm run test fast` or `npm run test all`

Automatically invoked by:
- `npm run test fast` (included in fast tests)
- `npm run test all` (included in all tests)

Checks:
- File existence: ERROR if `src/_data/links.yaml` not found
- YAML syntax: ERROR if YAML syntax is invalid
- Structure: Root must be an object with date keys
- Date keys: Each top-level key must be a valid date (YYYY-MM-DD format)
- Date values: Each date value must be an array
- Link objects: Each link in array must be an object with `url` (required, valid URL format), `title` (required, non-empty string 1-1000 chars), `description` (optional, string if provided)
- Unexpected fields: ERROR if link object contains fields other than url, title, description
- Empty arrays: WARNING if date entry has empty array
- Empty file: WARNING if no date entries found

Requirements: `src/_data/links.yaml` file must exist

### internal-links.js - Internal Link Validation

Validates that all internal links in HTML files point to existing pages or anchors. Checks both file links and anchor links within pages.

When to use:
- Before deployment to catch broken internal links
- After restructuring site URLs
- As part of `npm run test fast` or `npm run test all`

Automatically invoked by:
- `npm run test fast` (included in fast tests)
- `npm run test all` (included in all tests)

Checks:
- Internal file links: Absolute paths (starting with `/`), relative paths, checks for file existence with common extensions (`.html`, `.htm`, `/index.html`, `/index.htm`)
- Anchor links: Validates that anchor targets (`#id`) exist in target page, checks for matching `id` attributes or anchor elements
- Link classification: Only validates internal links (absolute, relative, anchor), skips external links, email links, phone links
- File tracking: Reports which file contains each broken link

Requirements: `_site/` directory must exist (run `npm run build` first)

### og-images.js - Open Graph Image Validation

Validates that all HTML pages have appropriate Open Graph images. Checks for missing OG images and warns about default images used on non-index pages.

When to use:
- Before deployment to ensure social media sharing works
- After adding new pages
- As part of `npm run test fast` or `npm run test all`
- Automatically during deployment (post-build validation)

Automatically invoked by:
- `npm run test fast` (included in fast tests)
- `npm run test all` (included in all tests)
- `scripts/deploy/deploy.js` (post-build validation, after build)

Checks:
- Missing OG image: ERROR if `og:image` meta tag is missing
- Default image usage: ERROR if default image (`/assets/images/og/index.png`) is used on non-index pages, allowed for main index (`index.html`) and paginated indexes (`page/1/index.html`, etc.), checks source file front matter to determine if default is explicitly set
- Redirect pages: Automatically skipped (don't need OG images)

Requirements: `_site/` directory must exist (run `npm run build` first)

### rss-feed.js - RSS Feed Validation

Validates RSS/XML feed files in `_site/` directory for proper structure, required elements, item validity, and feed health.

When to use:
- Before deployment to ensure RSS feeds work correctly
- After RSS template changes
- As part of `npm run test fast` or `npm run test all`

Automatically invoked by:
- `npm run test fast` (included in fast tests)
- `npm run test all` (included in all tests)

Checks:
- RSS structure: Valid XML format, RSS root element with version attribute (0.91, 0.92, 1.0, 2.0), channel element with required fields `title`, `description`, `link`
- RSS items: Required elements `title`, `description`, `link`, `pubDate` with valid date format, `guid` (required, non-empty), link format (should be absolute URL), description length (WARNING if > 1000 characters)
- Duplicate GUIDs: ERROR if multiple items share same GUID
- Feed freshness: WARNING if last update was > 30 days ago
- Feed size: WARNING if feed size > 500KB (suggests pagination)

Requirements: `_site/` directory must exist (run `npm run build` first), RSS/XML files in `_site/` directory (excludes sitemap files)

### deploy.js - Deployment Testing

Tests deployment configuration and connectivity without actually deploying. Validates environment variables, SSH connectivity, remote directory access, and rsync capability.

When to use:
- When setting up deployment for the first time
- When troubleshooting deployment issues
- When changing deployment configuration
- Before running actual deployment

Automatically invoked by: Not automatically invoked by other scripts. Run manually with `npm run test deploy`

Checks:
- Environment variables: `DEPLOY_HOST` (required), `DEPLOY_USERNAME` (required), `DEPLOY_REMOTE_PATH` (required), `DEPLOY_PASSWORD` (optional, masked in output)
- Local build directory: Checks that `_site/` directory exists
- rsync availability: Verifies rsync is installed and in PATH
- Authentication methods: Checks for SSH key (`~/.ssh/id_rsa`), checks for `sshpass` (for password authentication), checks for password in environment
- SSH connectivity: Tests SSH connection to remote server
- Remote directory access: Tests access to remote deployment directory
- rsync upload capability: Tests rsync file transfer (dry-run) with test file

Requirements: `.env` file with deployment configuration, `rsync` installed on system, SSH access to remote server, `_site/` directory must exist (run `npm run build` first)

## Deployment Integration

The deployment script (`scripts/deploy/deploy.js`) automatically runs specific tests:

Pre-deploy validation (before build):
- `markdown` - Validates markdown syntax
- `content-structure` - Validates content structure

Post-build validation (after build):
- `og-images` - Validates Open Graph images

These validations can be skipped with `--skip-checks` flag, but this is not recommended.

## Test Output Formats

All tests (except `deploy.js`) use a unified JSON output format that is automatically formatted by the test runner:

- Compact (default for group runs): Succinct summary
- Verbose (default for individual runs): Detailed output with file-by-file details
- Build (`--format build`): Blocking issues only, suitable for CI/CD
- Type grouping (`--group-by type`): Group issues by type for systematic fixes

## Test Architecture

The test suite uses a centralized architecture:

- test-result-builder.js: Utilities for building structured JSON test results
- test-formatter.js: Centralized formatter converting JSON to human-readable output
- test-runner.js: Orchestrates test execution and formatting
- test-base.js: Shared utilities for file operations and site directory checks
- html-utils.js: Cheerio-based HTML parsing
- validation-utils.js: Common validation functions
- file-utils.js: Common file operations

All validation tests output structured JSON that is automatically formatted by the test runner, enabling easy iteration on output design without modifying individual test scripts.
