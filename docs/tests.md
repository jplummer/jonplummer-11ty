# Test Scripts Documentation

## Overview

This project includes a suite of validation tests covering content structure, HTML output, SEO metadata, accessibility, and deployment readiness. Tests are grouped as "fast" (for frequent, quick checks) and "slow" (for in-depth checks run occasionally).

## Test Execution

- `pnpm run test` - List available test types
- `pnpm run test [type]` - Run a specific test type
- `pnpm run test fast` - Run all fast tests (excludes slow tests like accessibility)
- `pnpm run test all` - Run all tests including slow ones
- `pnpm run test changed` - Run authoring tests on files changed since last commit (spell, frontmatter, markdown, links-yaml, seo-meta)
- `pnpm run validate` - Quick HTML validity check (shortcut for `pnpm run test html`)

### Test Categories

Fast Tests (suitable for pre-commit hooks or frequent validation):
- `html` - HTML validity
- `links-yaml` - Links YAML structure
- `internal-links` - Internal link validity
- `frontmatter` - Frontmatter validation
- `markdown` - Markdown syntax validation
- `spell` - Spell checking
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
- As part of `pnpm run test fast` or `pnpm run test all`
- Use `pnpm run validate` for quick HTML checks

Automatically invoked by:
- `pnpm run test fast` (included in fast tests)
- `pnpm run test all` (included in all tests)
- `pnpm run validate` (shortcut command)

Checks:
- HTML structure validation (html-validate)
- Syntax errors
- Deprecated elements
- Invalid attributes
- Missing required elements
- Severity levels: errors (blocking) and warnings (non-blocking)

Requirements: `_site/` directory must exist (run `pnpm run build` first)

### frontmatter.js - Frontmatter Validation

Validates source markdown files in `src/_posts/` for proper front matter structure, file naming conventions, and required fields. Also validates YAML data files in `src/_data/`.

When to use:
- When creating or editing posts
- Before committing new content
- As part of `pnpm run test fast` or `pnpm run test all`
- Automatically during deployment (pre-deploy validation)

Commands:
- `pnpm run test frontmatter` - Check all files
- `node scripts/test/frontmatter.js --changed` - Check only changed files

Automatically invoked by:
- `pnpm run test fast` (included in fast tests)
- `pnpm run test all` (included in all tests)
- `scripts/deploy/deploy.js` (pre-deploy validation, before build)

Checks:
- Required fields: `title`, `date` (required), `slug` (required if not provided by directory structure)
- Title validation: Must be non-empty string (length validation handled by `seo-meta.js`)
- Date validation: Valid ISO date format (YYYY-MM-DD or ISO datetime)
- Slug validation: Valid slug format (alphanumeric, hyphens, underscores)
- Meta description: Optional field (length validation handled by `seo-meta.js`). Missing description is WARNING here (not ERROR) - `seo-meta.js` will catch it as ERROR in final output
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
- As part of `pnpm run test fast` or `pnpm run test all`
- Automatically during deployment (pre-deploy validation)

Commands:
- `pnpm run test markdown` - Check all files
- `node scripts/test/markdown.js --changed` - Check only changed files

Automatically invoked by:
- `pnpm run test fast` (included in fast tests)
- `pnpm run test all` (included in all tests)
- `scripts/deploy/deploy.js` (pre-deploy validation, before build)

Checks:
- markdownlint-cli2: Runs markdownlint rules from `.markdownlint.json` (blank lines around headings, list formatting, code block formatting, and other markdownlint rules)
- Unclosed markdown links: Detects `[text](url` patterns missing closing parenthesis
- H1 headings: Warns about H1 headings in markdown (templates add H1 from front matter title)
- Draft exclusion: Automatically excludes files with `draft: true` in front matter
- Directory exclusion: Excludes `docs/` directory from validation

Requirements: Source markdown files in `src/` directory, `.markdownlint.json` configuration file

### spell.js - Spell Check

Validates spelling in markdown and YAML files using `cspell`. Checks all markdown files in `src/` and all YAML files including `src/_data/links.yaml`.

When to use:
- When writing or editing content
- Before committing content changes
- As part of `pnpm run test fast` or `pnpm run test all`
- To catch spelling errors before deployment

Automatically invoked by:
- `pnpm run test fast` (included in fast tests)
- `pnpm run test all` (included in all tests)

Commands:
- `pnpm run test spell` - Check all markdown and YAML files
- `pnpm run test:spell:changed` - Check only files changed since last commit (recommended for new posts and links.yaml)
- `pnpm run test:spell:file <file>` - Check specific file(s)

Checks:
- Markdown files: All `.md` files in `src/` directory
- YAML files: All `.yaml` and `.yml` files in `src/` directory (including `src/_data/links.yaml`)
- Custom dictionary: Uses `cspell-custom-words.txt` for project-specific terms
- Draft exclusion: Automatically excludes markdown files with `draft: true` in front matter
- Unknown words: Reports spelling warnings (not errors) with file, line, column, and word
- Ignores: Links, URLs, domains, hashtags, YAML paths/strings (see `docs/cspell-patterns.md` for details)

Configuration:
- `cspell.json`: Main configuration file specifying file patterns, ignore paths, dictionary settings, and regex patterns
- `cspell-custom-words.txt`: Custom dictionary for project-specific terms, names, and technical terms (one word per line)

Requirements: Source markdown and YAML files in `src/` directory, `cspell.json` configuration file

### test-changed.js - Test Changed Files

Runs authoring-related tests on files changed since the last commit. Ideal for catching common authoring problems before committing.

When to use:
- Before committing new posts or changes to links.yaml
- When editing content to catch issues early
- As a quick validation before deployment

Command:
- `pnpm run test changed` - Runs all authoring tests on changed files (or `pnpm run test:changed`)

Tests run (all check only changed files when using `--changed` flag):
- **spell** - Checks only changed markdown/YAML files
- **frontmatter** - Checks only changed markdown files (and YAML data files if changed)
- **markdown** - Checks only changed markdown files
- **links-yaml** - Checks links.yaml only if it changed (skips if unchanged)
- **seo-meta** - Checks only if markdown files changed (skips if only links.yaml changed, since links.yaml doesn't affect page SEO metadata)

### seo-meta.js - SEO and Meta Tags Validation

Validates SEO metadata in final HTML output, including title tags, meta descriptions, Open Graph tags, heading hierarchy, and duplicate titles.

Commands:
- `pnpm run test seo-meta` - Check all files
- `node scripts/test/seo-meta.js --changed` - Check only if markdown files changed (skips if only links.yaml changed, since links.yaml doesn't affect page SEO metadata)

When to use:
- Before deployment to ensure SEO compliance
- After template changes that affect meta tags
- As part of `pnpm run test fast` or `pnpm run test all`

Automatically invoked by:
- `pnpm run test fast` (included in fast tests)
- `pnpm run test all` (included in all tests)

Checks:
- Title tag: ERROR if missing, WARNING if length is not 10-200 characters (relaxed limits), WARNING if too many separators (|), skipped for redirect pages
- Meta description: ERROR if missing (critical for SEO), WARNING if length is not 20-300 characters (relaxed limits), ERROR if contains unescaped quotes, skipped for redirect pages
- Open Graph tags (WARNINGS): Required `og:title`, `og:description`, `og:type`, recommended `og:image`, `og:url`, validates tag lengths and formats, skipped for redirect pages
- Heading hierarchy: ERROR if no H1 heading found, ERROR if heading hierarchy skips levels (e.g., H2 → H4), ERROR if empty headings found, skipped for redirect pages and utility pages (e.g., og-image-preview)
- Duplicate titles: ERROR if multiple pages share the same title
- Canonical URL: WARNING if missing
- Language attribute: WARNING if missing on `<html>` tag

Note: Length validation uses relaxed limits (Title 10-200 chars, Description 20-300 chars) and generates warnings only, not errors. Missing content is still an ERROR. Open Graph limits remain stricter (title ≤95 chars, description ≤200 chars) due to platform requirements.

Requirements: `_site/` directory must exist (run `pnpm run build` first)

### accessibility.js - Accessibility Validation

Tests HTML files for accessibility violations using `axe-core` via Puppeteer. Tests each page in both light and dark mode (dark mode tests contrast only).

When to use:
- Before major releases
- After significant template or content changes
- Periodically to ensure accessibility compliance
- As part of `pnpm run test all` (not included in fast tests due to speed)

Automatically invoked by:
- `pnpm run test all` (included in all tests, but NOT in fast tests)

Checks:
- Light mode: Full axe-core rule set (color contrast, ARIA attributes, keyboard navigation, focus management, semantic HTML, and all other WCAG accessibility rules)
- Dark mode: Color contrast only (tests contrast in dark mode)
- Violations: Reported as issues with impact level (critical, serious, moderate, minor)
- Incomplete checks: Reported as warnings (require manual review)
- Redirect pages: Automatically skipped (minimal HTML, redirect immediately)

Requirements: `_site/` directory must exist (run `pnpm run build` first), Puppeteer (launches headless browser), slower than other tests (runs browser for each page)

### links-yaml.js - Links YAML Validation

Validates the structure and format of `src/_data/links.yaml`, ensuring proper date keys, link objects, and required fields.

When to use:
- When editing `links.yaml` file
- Before committing changes to links data
- As part of `pnpm run test fast` or `pnpm run test all`

Commands:
- `pnpm run test links-yaml` - Check links.yaml
- `node scripts/test/links-yaml.js --changed` - Check only if links.yaml changed (skips if unchanged)

Automatically invoked by:
- `pnpm run test fast` (included in fast tests)
- `pnpm run test all` (included in all tests)

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
- As part of `pnpm run test fast` or `pnpm run test all`

Automatically invoked by:
- `pnpm run test fast` (included in fast tests)
- `pnpm run test all` (included in all tests)

Checks:
- Internal file links: Absolute paths (starting with `/`), relative paths, checks for file existence with common extensions (`.html`, `.htm`, `/index.html`, `/index.htm`)
- Anchor links: Validates that anchor targets (`#id`) exist in target page, checks for matching `id` attributes or anchor elements
- Link classification: Only validates internal links (absolute, relative, anchor), skips external links, email links, phone links
- File tracking: Reports which file contains each broken link

Requirements: `_site/` directory must exist (run `pnpm run build` first)

### og-images.js - Open Graph Image Validation

Validates that all HTML pages have appropriate Open Graph images. Checks for missing OG images and warns about default images used on non-index pages.

When to use:
- Before deployment to ensure social media sharing works
- After adding new pages
- As part of `pnpm run test fast` or `pnpm run test all`
- Automatically during deployment (post-build validation)

Automatically invoked by:
- `pnpm run test fast` (included in fast tests)
- `pnpm run test all` (included in all tests)
- `scripts/deploy/deploy.js` (post-build validation, after build)

Checks:
- Missing OG image: ERROR if `og:image` meta tag is missing
- Default image usage: ERROR if default image (`/assets/images/og/index.png`) is used on non-index pages, allowed for main index (`index.html`) and paginated indexes (`page/1/index.html`, etc.), checks source file front matter to determine if default is explicitly set
- Redirect pages: Automatically skipped (don't need OG images)

Requirements: `_site/` directory must exist (run `pnpm run build` first)

### rss-feed.js - RSS Feed Validation

Validates RSS/XML feed files in `_site/` directory for proper structure, required elements, item validity, and feed health.

When to use:
- Before deployment to ensure RSS feeds work correctly
- After RSS template changes
- As part of `pnpm run test fast` or `pnpm run test all`

Automatically invoked by:
- `pnpm run test fast` (included in fast tests)
- `pnpm run test all` (included in all tests)

Checks:
- RSS structure: Valid XML format, RSS root element with version attribute (0.91, 0.92, 1.0, 2.0), channel element with required fields `title`, `description`, `link`
- RSS items: Required elements `title`, `description`, `link`, `pubDate` with valid date format, `guid` (required, non-empty), link format (should be absolute URL), description length (WARNING if > 1000 characters)
- Duplicate GUIDs: ERROR if multiple items share same GUID
- Feed freshness: WARNING if last update was > 30 days ago
- Feed size: WARNING if feed size > 500KB (suggests pagination)

Requirements: `_site/` directory must exist (run `pnpm run build` first), RSS/XML files in `_site/` directory (excludes sitemap files)

### deploy.js - Deployment Testing

Tests deployment configuration and connectivity without actually deploying. Validates environment variables, SSH connectivity, remote directory access, and rsync capability.

When to use:
- When setting up deployment for the first time
- When troubleshooting deployment issues
- When changing deployment configuration
- Before running actual deployment

Automatically invoked by: Not automatically invoked by other scripts. Run manually with `pnpm run test deploy`

Checks:
- Environment variables: `DEPLOY_HOST` (required), `DEPLOY_USERNAME` (required), `DEPLOY_REMOTE_PATH` (required), `DEPLOY_PASSWORD` (optional, masked in output)
- Local build directory: Checks that `_site/` directory exists
- rsync availability: Verifies rsync is installed and in PATH
- Authentication methods: Checks for SSH key (`~/.ssh/id_rsa`), checks for `sshpass` (for password authentication), checks for password in environment
- SSH connectivity: Tests SSH connection to remote server
- Remote directory access: Tests access to remote deployment directory
- rsync upload capability: Tests rsync file transfer (dry-run) with test file

Requirements: `.env` file with deployment configuration, `rsync` installed on system, SSH access to remote server, `_site/` directory must exist (run `pnpm run build` first)

## Deployment Integration

The deployment script (`scripts/deploy/deploy.js`) automatically runs specific tests:

Pre-deploy validation (before build):
- `markdown` - Validates markdown syntax
- `frontmatter` - Validates frontmatter

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

The test suite uses a centralized JSON output format with a formatter system. All validation tests use the unified format:

**Core Utilities**:
- **test-results.js**: Consolidated utilities for building structured JSON test results, formatting output, and reporting (`createTestResult`, `addFile`, `addIssue`, `addWarning`, `outputResult`, `formatVerbose`, `formatCompact`, `formatBuild`)
- **test-helpers.js**: Shared utilities for file operations and site directory checks
- **test-runner.js**: Orchestrates test execution, detects JSON output via markers (`__TEST_JSON_START__`/`__TEST_JSON_END__`), and formats results

**Output Formats**:
- **Compact** (default for group runs): Succinct summary showing files checked, passing, issues, warnings
- **Verbose** (default for individual runs): Detailed output with issue type summary and file-by-file details
- **Build** (`--format build`): Blocking issues only, clear pass/fail for CI/CD (treats critical warnings as blocking)
- **Type grouping** (`--group-by type`): Alternative view grouping issues by type for systematic fixes

**Shared Utilities**:
- **html-utils.js**: Cheerio-based HTML parsing (replaces fragile regex)
- **validation-utils.js**: Common validation functions (title, description, URL, date, slug)
- **file-utils.js**: Common file operations (finding markdown files, checking `_site` exists)

All validation tests output structured JSON that is automatically formatted by the test runner. This enables easy iteration on output design without modifying individual test scripts. The `deploy` test is a special case (connectivity test) that outputs directly to console rather than using the JSON format.
