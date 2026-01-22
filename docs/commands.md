# 🥁 PNPM Commands

## Quick Reference

### 🧣 Deployment Workflow

Recommended process for deploying changes with an up-to-date changelog:

1. Make changes (write posts, update content, etc.)
2. `pnpm run build` - Verify local build works
3. `pnpm run test fast` - Run validation checks
4. Fix any issues found, then repeat steps 2-3 until all tests pass
5. `git commit` - Commit changes (required: changelog generation reads from git history)
6. `pnpm run deploy` - Deploy to live site (automatically regenerates changelog and runs validation)
7. Verify the live site works as expected
8. `git push` - Push commits to remote repository

**Why this order?** The deploy script regenerates the changelog from git commit history, so commits must exist before deployment. See [Deployment Process](#deployment-process) for details.

### 💻 Daily Development

- `pnpm run dev` - Start development server with auto-rebuild on file changes (`--serve --watch --quiet`)
- `pnpm run dev:verbose` - Start development server with verbose output (`--serve --watch`)
- `pnpm run build` - Build production site (`--quiet`)
- `pnpm run build:verbose` - Build production site with verbose output
- `pnpm run clean` - Clean build directory

### 🧪 Testing

- `pnpm run test` - List available test types
- `pnpm run validate` - Quick HTML validity check (shortcut for `pnpm run test html`)
- `pnpm run test fast` - Run fast tests (excludes slow tests like a11y)
- `pnpm run test all` - Run all tests in sequence (includes slow tests)
- `pnpm run test [type]` - Run a specific test type
- `pnpm run test [type] -- --format [format]` - Specify output format: `verbose` (default) or `build`

### 🚢 Deployment

- `pnpm run deploy` - Deploy site to host via rsync
- `pnpm run deploy --dry-run` - Test deployment without actually deploying (runs all checks and shows what would be synced)
- `pnpm run deploy --skip-checks` - Deploy without running validation checks (not recommended)

### 📝 Content Authoring

- `pnpm run import-links` - Import links from NotePlan to links.yaml
- `pnpm run import-links --clear` - Import and clear NotePlan note
- `pnpm run import-links --date=2025-12-25` - Import with specific date

See [noteplan-import.md](noteplan-import.md) for complete workflow documentation.

### 🔧 Maintenance

- `pnpm run update-docs` - Update cached Eleventy documentation
- `pnpm run changelog` - Generate CHANGELOG.md from git history
- `pnpm run convert-pdf` - Convert PDF pages to images for portfolio items
- `pnpm run generate-og-images` - Generate Open Graph images for posts and pages
- `pnpm run security-audit` - Run security audit and maintenance checks

---

## Detailed Explanations

See [tests.md](tests.md) for detailed test documentation.

### 🚢 Deployment

- `pnpm run deploy` - Deploy site via rsync (simplified script)
- `pnpm run deploy --dry-run` - Test deployment without actually deploying. Runs all validation checks, generates OG images, and shows what would be synced via rsync's dry-run mode.
- `pnpm run deploy --skip-checks` - Deploy without running validation checks (not recommended)

Prior complex deployment scripts were moved to `scripts/deploy/backup/`. The current script shows rsync's native output and handles errors simply.

#### Deployment Process

The deploy script performs these steps in order:

1. **Regenerates changelog** from git history
2. **Generates OG images** for any missing/outdated images (before build) - skipped with `--skip-checks`
3. **Runs pre-deploy validation** (markdown, content structure) on source files - skipped with `--skip-checks`
4. **Builds the site** once (includes changelog + OG image frontmatter updates)
5. **Runs post-build validation** (og-images) on built HTML - skipped with `--skip-checks`
6. **Deploys via rsync** - uses `--dry-run` flag when `--dry-run` option is used

#### Testing Deployment

Use `--dry-run` to test the full deployment process without actually deploying:

```bash
pnpm run deploy --dry-run
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


### 📋 Changelog Generation

- `pnpm run changelog` - Generate CHANGELOG.md from git commit history

The changelog is automatically generated from the git commit history, organized by date (newest first). It includes all commits from the beginning of the project and follows the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

The changelog is automatically regenerated before each deployment. You can also run this command manually whenever you want to update it.

### 📄 PDF Page Conversion

- `pnpm run convert-pdf <pdf-file> [year/month]` - Convert PDF pages to images for portfolio display

**For authoring usage** (how to use PDFs in portfolio items), see [authoring.md](authoring.md#pdf-pages).

This script converts each page of a PDF to a PNG image for page-by-page display in portfolio items. The images are saved to `src/assets/images/[year]/[month]/` and the PDF is copied to `src/assets/pdfs/[year]/[month]/` for reference.

#### Usage

```bash
pnpm run convert-pdf "Product Trio.pdf" 2022/12
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

- `pnpm run generate-og-images` - Generate Open Graph images for posts and pages

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
pnpm run generate-og-images
```

The script will:
- Generate images for posts and pages that don't have them
- Regenerate images if the source file (title, description, date) has changed
- Regenerate images if `ogImage` is set in frontmatter but the image file doesn't exist
- Skip images that are up to date (incremental generation - typically <1 second if all up-to-date)
- Skip portfolio items (individual portfolio pieces don't need OG images)
- Skip files with manually set `ogImage` values only if the image file exists

**Force Regeneration**: To regenerate all images (useful after changing OG image styling):

```bash
pnpm run generate-og-images -- --force
```

The `--force` flag will:
- Regenerate all images, even if they exist and are up to date
- Override the skip logic for manually set `ogImage` values
- Useful when you've updated the `og-image.njk` template or CSS styling

#### Previewing Images

**Preview the template at: `http://localhost:8080/og-image-preview/`**

This preview page shows:
- Live examples of the OG image template with sample data
- A gallery of all generated OG images

You can also preview generated images in other ways:

1. **Finder**: Browse `src/assets/images/og/` directly
2. **Dev Server**: Run `pnpm run dev` and visit individual images: `http://localhost:8080/assets/images/og/[filename].png`
3. **Build Output**: Images are copied to `_site/assets/images/og/` during build

**Note**: The preview page is excluded from deployment (it's for authoring only).

#### Customization

To customize the OG image design, edit `src/_includes/og-image.njk`. The template uses your site's CSS custom properties, so changes to colors, typography, and spacing will automatically be reflected in the generated images.

### 🔒 Security Audit

- `pnpm run security-audit` - Run security audit and maintenance checks

The security audit script performs periodic security and maintenance checks for the site. It automates checks where possible and provides a checklist of manual tasks.

#### Configuration

The script requires a `SITE_DOMAIN` environment variable for live site security checks (security headers, TLS certificate, DNS records). Add to your `.env` file:

```
SITE_DOMAIN=jonplummer.com
```

**Note**: `SITE_DOMAIN` is the public-facing domain name, not the SSH hostname. `DEPLOY_HOST` is used for deployment (SSH access), while `SITE_DOMAIN` is used for checking the live website. If `SITE_DOMAIN` is not set, the script defaults to `jonplummer.com`.

#### Automated Checks

The script automatically checks:
- **pnpm audit**: Scans for known vulnerabilities in dependencies
- **pnpm outdated**: Identifies packages that need updates
- **Node.js version**: Verifies you're using an LTS version (even-numbered versions: 18, 20, 22, etc.)
- **Deprecated packages**: Checks for deprecated pnpm packages
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
pnpm run security-audit
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
- **Command**: `pnpm run security-audit`
- **Tasks**:
  - Run the security audit script
  - Review and address automated check results
  - Complete manual tasks checklist (dependency updates, SSH key rotation, backup restore testing, etc.)

See [Security Audit](#-security-audit) section above for detailed information about what the audit checks.
