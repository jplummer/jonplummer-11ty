# 🔨 NPM Commands

## 💻 Development

- `npm run dev` - Start development server with live reload
- `npm run build` - Build production site
- `npm run start` - Start development server
- `npm run clean` - Clean build directory

## 🧪 Testing

- `npm run test` - List available test types
- `npm run test [type]` - Run a specific test type
- `npm run test all` - Run all tests in sequence (html, internal-links, content, performance, seo, accessibility, rss)
- `npm run validate` - Shortcut for `npm run test html` (HTML validity check)

Available test types:
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

### 📋 links.yaml validation

The `links-yaml` test validates the structure and format of `_data/links.yaml`:

- Validates YAML syntax
- Checks date keys are in YYYY-MM-DD format and are valid dates
- Ensures each date entry contains an array of link objects
- Validates each link has required fields (`url`, `title`)
- Validates URL format (http/https)
- Validates description field if present
- Checks for unexpected fields in link objects

This is faster than running the full `content` test since it only validates the links.yaml file structure, not the entire site content.

## 🚢 Deploy site to host

- `npm run deploy` - Deploy site via rsync (simplified script)

Prior complex deployment scripts were moved to scripts/deploy/backup/. Current script shows rsync's native output and handles errors simply.

# 📚 Front Matter Variables

- `layout` - Which template to use
- `title` - Page title
- `date` - Publication date
- `tags` - Array of tags for collections (post, portfolio)
- `permalink` - Custom URL structure
- `draft` - Whether to publish or not
- `eleventyExcludeFromCollections` - Exclude from collections

# 🔀 Redirects

Redirects are used to handle URL changes (e.g., when post dates are corrected). They create an HTML page that redirects users to the correct URL.

## How to Create a Redirect

1. Create an HTML file at the old URL path (e.g., `2022/11/09/post-slug/index.html`)
2. Add front matter with:
   - `layout: redirect.njk`
   - `redirectUrl: <full URL to redirect to>`

Example:

```yaml
---
layout: redirect.njk
redirectUrl: https://jonplummer.com/2022/11/08/philosophy-of-ux-research-and-design-horizon-three-benefit/
---
```

## How Redirects Work

The `redirect.njk` template generates an HTML page with:
- **Meta refresh** (`<meta http-equiv="refresh">`) for immediate server-side redirect
- **JavaScript redirect** (`window.location.href`) as primary method
- **Canonical link** pointing to the destination URL
- **Fallback link** in the body for accessibility

This provides three layers of redirection to ensure browsers and crawlers follow the redirect:
1. JavaScript (fastest, most compatible)
2. Meta refresh (backup for JS-disabled browsers)
3. Manual link (accessibility fallback)

## When to Use Redirects

Use redirects when:
- A post's date needs to be corrected (old URL → new URL with corrected date)
- A post slug changes
- Migrating from an old URL structure
- Any other permanent URL change that needs to preserve old links

# 🎨 Color ideas inspired by https://www.presentandcorrect.com/blogs/blog/rams-palette and https://mcochris.com:
* DR01: #aab7bf, #736356, #bfb1a8, #ad1d1d, #261201
* DR02: #84754a, #3a3124, #96937d, #b9ada4, #0d0000
* DR03: #bf7c2a, #c09c6f, #5f503e, #9c9c9c, #e1e4e1
* DR04: #84764b, #b7b183, #372e2d, #bcb3a6, #dbd7d3
* DR05: #af2e1b, #cc6324, #3b4b59, #bfa07a, #d9c3b0
* DR06: #ed8008, #ed3f1c, #bf1b1b, #736b1e, #d9d2c6
* DR07: #ae2f25, #e15e3e, #315b7b, #292a2e, #50474c
* DR08: #a43f14, #bd7033, #d8a367, #bebab0, #9a9a9a
* DR09: #c5441f, #f07032, #40341f, #8b8178, #d9cab8
* DR10: #0d703f, #f1b73a, #e6423a, #5b4a3b, #d3d8d2

Adjusted for contrast (WCAG AA)
* DR06a: #ed8008, #ed3f1c, #bf1b1b, #736b1e, #dadccf
* ✔ DR10a: #0d703f, #d97706, #e6423a, #5b4a3b, #d3d8d2, text: #2a2a2a