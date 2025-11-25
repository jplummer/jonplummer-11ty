# 📚 Front Matter Variables

- `layout` - Which template to use
- `title` - Page title
- `date` - Publication date (ISO format: "YYYY-MM-DDTHH:mm:ss-HH:mm")
- `tags` - Array of tags for collections (post, portfolio). For posts, additional tags beyond `post` are used as `article:tag` meta tags for SEO.
- `description` - Meta description for SEO (50-160 characters recommended)
- `ogImage` - Path to Open Graph image. For posts, can be set to `auto` or omitted to auto-generate. Generated images are saved to `/assets/images/og/` with format `YYYY-MM-DD-post-slug.png`.
- `permalink` - Custom URL structure
- `eleventyExcludeFromCollections` - Exclude from collections

**Note:** Drafts are handled by placing files in `_posts/_drafts/` folder, not via a `draft` variable.

# 🔀 Redirects

Redirects are used to handle URL changes, for example when post dates are corrected. They create an HTML page that redirects users to the correct URL. The need of a redirect is often visible in 404/4XX logs.

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
- You find lots of people getting a 404 page for a resource that exists elsewhere and you want to help them

# 🎨 Color ideas inspired by https://www.presentandcorrect.com/blogs/blog/rams-palette and found at https://mcochris.com:
- DR01: #aab7bf, #736356, #bfb1a8, #ad1d1d, #261201
- DR02: #84754a, #3a3124, #96937d, #b9ada4, #0d0000
- DR03: #bf7c2a, #c09c6f, #5f503e, #9c9c9c, #e1e4e1
- DR04: #84764b, #b7b183, #372e2d, #bcb3a6, #dbd7d3
- DR05: #af2e1b, #cc6324, #3b4b59, #bfa07a, #d9c3b0
- DR06: #ed8008, #ed3f1c, #bf1b1b, #736b1e, #d9d2c6
- DR07: #ae2f25, #e15e3e, #315b7b, #292a2e, #50474c
- DR08: #a43f14, #bd7033, #d8a367, #bebab0, #9a9a9a
- DR09: #c5441f, #f07032, #40341f, #8b8178, #d9cab8
- DR10: #0d703f, #f1b73a, #e6423a, #5b4a3b, #d3d8d2

Adjusted for contrast (WCAG AA)
- DR06a: #ed8008, #ed3f1c, #bf1b1b, #736b1e, #dadccf
- DR10a: #0d703f, #d97706, #e6423a, #5b4a3b, #d3d8d2, text: #2a2a2a

## Light Mode Colors (WCAG AA Compliant)

Based on DR10a palette, adjusted for light mode contrast:
- Background: #d3d8d2 (DR10 light gray)
- Content background: #fff
- Text: #2a2a2a (darker for contrast on #d3d8d2 background)
- Text light: #5a5a5a
- Link: #e6423a (DR10 red)
- Link hover: #d97706 (darker orange for contrast on white)
- Link visited: #5b4a3b (DR10 dark brown)
- Link active: #0d703f (DR10 green)

## Dark Mode Colors (WCAG AA Compliant)

Based on DR10a palette, adjusted for dark mode contrast:
- Background: #1a1a1a
- Content background: #2d2d2d
- Text: #e0e0e0
- Text light: #b0b0b0
- Link: #ff6b6b (lighter version of DR10 red #e6423a)
- Link hover: #f1b73a (DR10 yellow-orange)
- Link visited: #a89585 (lighter version of DR10 dark brown #5b4a3b, adjusted for WCAG AA)
- Link active: #2db366 (lighter version of DR10 green #0d703f)