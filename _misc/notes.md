# 🔨 NPM Commands

## 💻 Development

- `npm run dev` - Start development server with live reload
- `npm run build` - Build production site
- `npm run start` - Start development server
- `npm run clean` - Clean build directory

## 🔍 Test generated site

### 🧪 Tests

- `npm run test` - List available test types
- `npm run test [type]` - Run a specific test type
- `npm run test all` - Run all tests in sequence (html, internal-links, content, performance, seo, accessibility, rss)
- `npm run validate` - Shortcut for `npm run test html` (HTML validity check)

Available test types:
- `html` - Check HTML validity (structure, syntax, deprecated elements)
- `links` - Test all links (internal and external)
- `internal-links` - Test only internal links (critical)
- `content` - Test content structure
- `performance` - Analyze performance
- `seo` - Test SEO and meta tags
- `accessibility` - Test accessibility using axe-core
- `rss` - Test RSS feeds
- `deploy` - Test deployment (environment, local build check, dependencies, SSH, remote directory, rsync dry-run)

## 🚢 Deploy site to host

- `npm run deploy` - Deploy site via rsync (simplified script)

  Note: Complex deployment scripts moved to scripts/deploy/backup/. Current script shows rsync's native output and handles errors simply.

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

# 🎨 Color ideas

https://www.presentandcorrect.com/blogs/blog/rams-palette
Dieter Rams 01          #af2e1b, #cc6324, #3b4b59, #bfa07a, #d9c3b0
Dieter Rams 02          #aab7bf, #736356, #bfb1a8, #ad1d1d, #261201
Dieter Rams 03          #ed8008, #ed3f1c, #bf1b1b, #736b1e, #d9d2c6
Dieter Rams 03 adjusted #ed8008, #ed3f1c, #bf1b1b, #736b1e, #dadccf
Dieter Rams 04          #bf7c2a, #c09c6f, #5f503e, #9c9c9c, #e1e4e1

https://www.color-hex.com/color-palettes/popular.php

https://mcochris.com