# 🔨 NPM Commands

## Quick Reference

### 💻 Daily Development

- `npm run dev` - Start development server with auto-rebuild on file changes (`--serve --watch`)
- `npm run build` - Build production site
- `npm run clean` - Clean build directory

### 🧪 Testing

- `npm run test` - List available test types
- `npm run validate` - Quick HTML validity check (shortcut for `npm run test html`)
- `npm run test fast` - Run fast tests (excludes slow tests: accessibility)
- `npm run test all` - Run all tests in sequence (includes slow tests)
- `npm run test [type]` - Run a specific test type
- `npm run test [type] -- --format [format]` - Specify output format: `compact`, `verbose`, or `build`
- `npm run test [type] -- --group-by [type]` - Group issues by `file` (default) or `type`

### 🚢 Deployment

- `npm run deploy` - Deploy site to host via rsync
- `npm run deploy --dry-run` - Test deployment without actually deploying (runs all checks and shows what would be synced)
- `npm run deploy --skip-checks` - Deploy without running validation checks (not recommended)

### 🔧 Maintenance

- `npm run update-docs` - Update cached Eleventy documentation
- `npm run changelog` - Generate CHANGELOG.md from git history
- `npm run convert-pdf` - Convert PDF pages to images for portfolio items
- `npm run generate-og-images` - Generate Open Graph images for posts and pages
- `npm run security-audit` - Run security audit and maintenance checks

---

## Detailed Explanations

### 🧪 Testing

#### Available Test Types

**Fast Tests** (suitable for frequent validation):
- `html` - Check HTML validity (structure, syntax, deprecated elements)
- `internal-links` - Test only internal links (critical)
- `content-structure` - Test content structure
- `markdown` - Validate markdown syntax and structure
- `seo-meta` - Test SEO and meta tags
- `og-images` - Validate Open Graph images
- `rss-feed` - Test RSS feeds

**Slow Tests** (run occasionally):
- `accessibility` - Test accessibility using axe-core - launches browser

**Other Tests**:
- `links-yaml` - Validate links.yaml structure and format
- `deploy` - Test deployment (environment, local build check, dependencies, SSH, remote directory, rsync dry-run)

#### Test Suite Focus

The test suite is designed to:
- **Prevent authoring mistakes**: markdown, content structure, links-yaml validation
- **Ensure deploys work**: html, internal-links, seo-meta, rss-feed validation
- **Basic security checks**: deploy validation, security audit script

Use `npm run test fast` for quick validation during development. Use `npm run test all` for comprehensive checks before deployment.

#### Test Suite Architecture

The test suite uses a centralized JSON output format with a formatter system:

- **test-result-builder.js**: Utilities for building structured JSON test results
- **test-formatter.js**: Centralized formatter that converts JSON to human-readable output
- **test-runner.js**: Orchestrates test execution, detects JSON output, and formats results

**Output Formats**:
- **Compact** (default for group runs): Succinct summary showing files checked, passing, issues, warnings
- **Verbose** (default for individual runs): Detailed output with issue type summary and file-by-file details
- **Build** (`--format build`): Blocking issues only, clear pass/fail for CI/CD
- **Type grouping** (`--group-by type`): Alternative view grouping issues by type for systematic fixes

**Shared Utilities**:
- **html-utils.js**: Cheerio-based HTML parsing (replaces fragile regex)
- **validation-utils.js**: Common validation functions (title, description, URL, date, slug)
- **test-base.js**: Common file operations (checking `_site` exists, finding files, reading files)

All tests output structured JSON that is automatically formatted by the test runner. This enables easy iteration on output design without modifying individual test scripts.

#### links.yaml Validation

The `links-yaml` test validates the structure and format of `_data/links.yaml`:

- Validates YAML syntax
- Checks date keys are in YYYY-MM-DD format and are valid dates
- Ensures each date entry contains an array of link objects
- Validates each link has required fields (`url`, `title`)
- Validates URL format (http/https)
- Validates description field if present
- Checks for unexpected fields in link objects

This is faster than running the full `content-structure` test since it only validates the links.yaml file structure, not the entire site content.

#### Markdown Validation

The `markdown` test validates markdown syntax and structure for all markdown files that are rendered on the live site:

- Validates markdown syntax using markdownlint-cli2
- Checks for unclosed parentheses in markdown links (e.g., `[text](url` without closing `)`)
- Detects incorrect heading hierarchy (e.g., h2 → h4 skipping h3)
- Warns about H1 headings in markdown content (templates add H1 from front matter `title`)
- Validates spacing, formatting, and other markdown best practices

The test checks all `.md` files in `src/` directory, excluding:
- Files with `draft: true` in frontmatter (draft posts not published)
- `docs/` (documentation not part of live site)

Configuration is in `.markdownlint.json`. The test reports errors (which fail the build) and warnings (which don't fail but should be addressed).

### 🚢 Deployment

- `npm run deploy` - Deploy site via rsync (simplified script)
- `npm run deploy --dry-run` - Test deployment without actually deploying. Runs all validation checks, generates OG images, and shows what would be synced via rsync's dry-run mode.
- `npm run deploy --skip-checks` - Deploy without running validation checks (not recommended)

Prior complex deployment scripts were moved to `scripts/deploy/backup/`. The current script shows rsync's native output and handles errors simply.

#### Deployment Process

The deploy script performs these steps in order:

1. **Regenerates changelog** from git history
2. **Builds the site** to include the new changelog
3. **Runs validation checks** (markdown, content structure) - skipped with `--skip-checks`
4. **Generates OG images** for any missing/outdated images - skipped with `--skip-checks`
5. **Rebuilds the site** to include OG image frontmatter updates - skipped with `--skip-checks`
6. **Validates OG images** for all generated pages - skipped with `--skip-checks`
7. **Deploys via rsync** - uses `--dry-run` flag when `--dry-run` option is used

#### Testing Deployment

Use `--dry-run` to test the full deployment process without actually deploying:

```bash
npm run deploy --dry-run
```

This will:
- Run all validation checks
- Generate any missing OG images
- Show what files would be synced (via rsync's dry-run)
- Not actually deploy anything

This is useful for:
- Verifying the deployment process works end-to-end
- Checking what files would be changed on the server
- Testing configuration changes

### 📚 Update Eleventy Documentation

- `npm run update-docs` - Pull latest 11ty documentation from official repo

The Eleventy documentation is cached in `docs/reference/eleventy/` to provide context to Cursor and prevent confusion about what 11ty naturally provides. This script:

1. Clones the `11ty/11ty-website` repository to a temporary directory (shallow clone)
2. Copies the `docs` directory to `docs/reference/eleventy/docs`
3. Cleans up temporary files

The script outputs a summary showing the commit hash and file count changes (added/removed/unchanged) to help track what was updated.

Run this periodically to keep the cached docs up to date with the latest 11ty features and changes.

### 📋 Changelog Generation

- `npm run changelog` - Generate CHANGELOG.md from git commit history

The changelog is automatically generated from the git commit history, organized by date (newest first). It includes all commits from the beginning of the project and follows the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

The changelog is automatically regenerated before each deployment. You can also run this command manually whenever you want to update it.

### 📄 PDF Page Conversion

- `npm run convert-pdf <pdf-file> [year/month]` - Convert PDF pages to images for portfolio display

**For authoring usage** (how to use PDFs in portfolio items), see [authoring.md](authoring.md#pdf-pages).

This script converts each page of a PDF to a PNG image for page-by-page display in portfolio items. The images are saved to `src/assets/images/[year]/[month]/` and the PDF is copied to `src/assets/pdfs/[year]/[month]/` for reference.

#### Usage

```bash
npm run convert-pdf "Product Trio.pdf" 2022/12
```

The `year/month` parameter is optional. If omitted, it defaults to the current year/month.

#### What It Does

1. Converts each PDF page to a PNG image
2. Saves images to `src/assets/images/[year]/[month]/` with naming pattern `[slug]-page-[number].png`
3. Copies the PDF to `src/assets/pdfs/[year]/[month]/`
4. Generates a markdown template with figure elements for each page

#### Output

The script outputs a markdown template that you can copy into your portfolio item markdown file. The template includes:
- Figure elements for each page with placeholder notes
- A link to download the full PDF

You then add notes for each page in the `<figcaption>` elements.

### 🖼️ Open Graph Image Generation

- `npm run generate-og-images` - Generate Open Graph images for posts and pages

**For authoring usage** (how to use `ogImage` in front matter, auto vs manual), see [authoring.md](authoring.md#open-graph-images).

This script automatically generates OG images (1200×630px) for all posts and pages using Puppeteer to render HTML templates with your site's styling. The images are saved to `src/assets/images/og/` and the `ogImage` field is automatically added to each file's frontmatter.

#### How It Works

1. **Scans** all posts in `src/_posts/` and pages in `src/` (excluding portfolio items)
2. **Renders** each page's title, description, and date (if a post) using the `og-image.njk` template
3. **Generates** PNG images using Puppeteer (headless browser)
4. **Updates** frontmatter with the `ogImage` path
5. **Skips** regeneration if the image already exists and source data hasn't changed (incremental generation)

#### Image Template

The OG images use the `src/_includes/og-image.njk` template which includes:
- "Jon Plummer" branding
- Page title
- Description (if available)
- Date (for blog posts)
- Light mode styling using your site's CSS custom properties

#### Usage

**Automatic Generation**: OG images are now automatically generated:
- **During development**: When you save a post or page file, the image is automatically generated (via `eleventy.beforeWatch`)
- **Before deployment**: The deploy script automatically checks and generates any missing/outdated images

**Manual Generation**: You can also run the script manually:

```bash
npm run generate-og-images
```

The script will:
- Generate images for posts and pages that don't have them
- Regenerate images if the source file (title, description, date) has changed
- Skip images that are up to date (incremental generation - typically <1 second if all up-to-date)
- Skip portfolio items (individual portfolio pieces don't need OG images)
- Skip files with manually set `ogImage` values

#### Previewing Images

**Preview the template at: `http://localhost:8080/og-image-preview/`**

This preview page shows:
- Live examples of the OG image template with sample data
- A gallery of all generated OG images

You can also preview generated images in other ways:

1. **Finder**: Browse `src/assets/images/og/` directly
2. **Dev Server**: Run `npm run dev` and visit individual images: `http://localhost:8080/assets/images/og/[filename].png`
3. **Build Output**: Images are copied to `_site/assets/images/og/` during build

**Note**: The preview page is excluded from deployment (it's for authoring only).

#### Customization

To customize the OG image design, edit `src/_includes/og-image.njk`. The template uses your site's CSS custom properties, so changes to colors, typography, and spacing will automatically be reflected in the generated images.

### 🔒 Security Audit

- `npm run security-audit` - Run security audit and maintenance checks

The security audit script performs periodic security and maintenance checks for the site. It automates checks where possible and provides a checklist of manual tasks.

#### Configuration

The script requires a `SITE_DOMAIN` environment variable for live site security checks (security headers, TLS certificate, DNS records). Add to your `.env` file:

```
SITE_DOMAIN=jonplummer.com
```

**Note**: `SITE_DOMAIN` is the public-facing domain name, not the SSH hostname. `DEPLOY_HOST` is used for deployment (SSH access), while `SITE_DOMAIN` is used for checking the live website. If `SITE_DOMAIN` is not set, the script defaults to `jonplummer.com`.

#### Automated Checks

The script automatically checks:
- **npm audit**: Scans for known vulnerabilities in dependencies
- **npm outdated**: Identifies packages that need updates
- **Node.js version**: Verifies you're using an LTS version (even-numbered versions: 18, 20, 22, etc.)
- **Deprecated packages**: Checks for deprecated npm packages
- **Environment variables**: Ensures `.env` is properly ignored by git
- **Package.json**: Validates configuration
- **Build output**: Scans `_site/` for sensitive files that shouldn't be deployed
- **File permissions**: Checks that sensitive files have appropriate permissions
- **Git history**: Verifies `.env` was never committed
- **Content Security Policy**: Validates CSP headers in `.htaccess`
- **Redirect security**: Reports redirect count (informational)
- **Third-party resources**: Identifies external scripts and stylesheets (informational)
- **Security headers**: Checks live site for required security headers (requires `SITE_DOMAIN`)
- **TLS certificate**: Verifies certificate expiration (requires `SITE_DOMAIN`)
- **DNS records**: Validates DNS A records (requires `SITE_DOMAIN`)

#### Manual Tasks Checklist

The script also provides a focused checklist of manual security tasks relevant to static sites:
- Updating dependencies (requires testing after updates)
- SSH key rotation
- Backup restore testing
- Hosting provider security notices review
- Full test suite execution

#### Usage

Run the audit periodically (e.g., monthly or before major deployments):

```bash
npm run security-audit
```

The script exits with:
- **Code 0**: All automated checks passed (warnings may still be present)
- **Code 1**: Failures found that need attention

See `scripts/security/security-audit.js` header comments for the complete list of security and maintenance tasks.

---

## 🔄 Periodic Maintenance

These tasks should be performed regularly, not as one-time work items.

### Security Audit

- **Frequency**: Monthly or before major deployments
- **Command**: `npm run security-audit`
- **Tasks**:
  - Run the security audit script
  - Review and address automated check results
  - Complete manual tasks checklist (dependency updates, SSH key rotation, backup restore testing, etc.)

See [Security Audit](#-security-audit) section above for detailed information about what the audit checks.
