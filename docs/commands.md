# 🔨 NPM Commands

## Quick Reference

### 💻 Daily Development

- `npm run dev` - Start development server with auto-rebuild on file changes (`--serve --watch`)
- `npm run build` - Build production site
- `npm run clean` - Clean build directory

### 🧪 Testing

- `npm run test` - List available test types
- `npm run validate` - Quick HTML validity check (shortcut for `npm run test html`)
- `npm run test all` - Run all tests in sequence
- `npm run test [type]` - Run a specific test type

### 🚢 Deployment

- `npm run deploy` - Deploy site to host via rsync

### 🔧 Maintenance

- `npm run update-docs` - Update cached Eleventy documentation
- `npm run changelog` - Generate CHANGELOG.md from git history
- `npm run generate-og-images` - Generate Open Graph images for posts and pages

---

## Detailed Explanations

### 🧪 Testing

#### Available Test Types

- `html` - Check HTML validity (structure, syntax, deprecated elements)
- `links` - Test all links (internal and external)
- `links-yaml` - Validate links.yaml structure and format
- `internal-links` - Test only internal links (critical)
- `content` - Test content structure
- `markdown` - Validate markdown syntax and structure
- `performance` - Analyze performance
- `seo` - Test SEO and meta tags
- `accessibility` - Test accessibility using axe-core
- `rss` - Test RSS feeds
- `deploy` - Test deployment (environment, local build check, dependencies, SSH, remote directory, rsync dry-run)

#### links.yaml Validation

The `links-yaml` test validates the structure and format of `_data/links.yaml`:

- Validates YAML syntax
- Checks date keys are in YYYY-MM-DD format and are valid dates
- Ensures each date entry contains an array of link objects
- Validates each link has required fields (`url`, `title`)
- Validates URL format (http/https)
- Validates description field if present
- Checks for unexpected fields in link objects

This is faster than running the full `content` test since it only validates the links.yaml file structure, not the entire site content.

#### Markdown Validation

The `markdown` test validates markdown syntax and structure for all markdown files that are rendered on the live site:

- Validates markdown syntax using markdownlint-cli2
- Checks for unclosed parentheses in markdown links (e.g., `[text](url` without closing `)`)
- Detects incorrect heading hierarchy (e.g., h2 → h4 skipping h3)
- Warns about H1 headings in markdown content (templates add H1 from front matter `title`)
- Validates spacing, formatting, and other markdown best practices

The test checks all `.md` files in `src/` directory, excluding:
- `_posts/_drafts/` (draft posts not published)
- `docs/` (documentation not part of live site)

Configuration is in `.markdownlint.json`. The test reports errors (which fail the build) and warnings (which don't fail but should be addressed).

### 🚢 Deployment

- `npm run deploy` - Deploy site via rsync (simplified script)

Prior complex deployment scripts were moved to `scripts/deploy/backup/`. The current script shows rsync's native output and handles errors simply.

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

### 🖼️ Open Graph Image Generation

- `npm run generate-og-images` - Generate Open Graph images for posts and pages

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

You can preview generated images in several ways:

1. **Finder**: Browse `src/assets/images/og/` directly
2. **Dev Server**: Run `npm run dev` and visit:
   - Individual images: `http://localhost:8080/assets/images/og/[filename].png`
   - Preview page: `http://localhost:8080/og-images-preview/`
3. **Build Output**: Images are copied to `_site/assets/images/og/` during build

#### Customization

To customize the OG image design, edit `src/_includes/og-image.njk`. The template uses your site's CSS custom properties, so changes to colors, typography, and spacing will automatically be reflected in the generated images.
