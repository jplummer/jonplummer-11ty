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

---

## Detailed Explanations

### 🧪 Testing

#### Available Test Types

- `html` - Check HTML validity (structure, syntax, deprecated elements)
- `links` - Test all links (internal and external)
- `links-yaml` - Validate links.yaml structure and format
- `internal-links` - Test only internal links (critical)
- `content` - Test content structure
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
