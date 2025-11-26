# 📋 Notes

## What's here

- 📋 Front Matter Variables
- 🎨 Open Graph Images
- ➡️ Redirects
- 🌈 Color Ideas
- 🔒 Security Audit

---

# 📋 Front Matter Variables

- `layout` - Which template to use
- `title` - Page title
- `date` - Publication date (ISO format: "YYYY-MM-DDTHH:mm:ss-HH:mm")
- `tags` - Array of tags for collections (post, portfolio). For posts, additional tags beyond `post` are used as `article:tag` meta tags for SEO.
- `description` - Meta description for SEO (50-160 characters recommended)
- `ogImage` - Path to Open Graph image. For posts, can be set to `auto` or omitted to auto-generate. Generated images are saved to `/assets/images/og/` with format `YYYY-MM-DD-post-slug.png`.
- `permalink` - Custom URL structure
- `eleventyExcludeFromCollections` - Exclude from collections

**Note:** Drafts are handled by placing files in `_posts/_drafts/` folder, not via a `draft` variable.

# 🎨 Open Graph Images

Open Graph images are automatically generated for posts and pages using the `og-image.njk` template. The template is rendered into 1200x630px PNG images using Puppeteer.

## Previewing OG Images

**Preview the template at: `http://localhost:8080/og-image-preview/`**

This preview page shows:
- Live examples of the OG image template with sample data
- A gallery of all generated OG images

The preview page is excluded from deployment.

## How OG Images Work

1. **Template**: `src/_includes/og-image.njk` contains the HTML/CSS template
   - Uses CSS custom properties from the main stylesheet
   - Forces light theme colors for consistency
   - Fixed 1200x630px dimensions (Open Graph standard)
   - Includes author name, "Today I Learned" tagline, post title, description, and date

2. **Generation**: `scripts/content/generate-og-images.js` uses Puppeteer to:
   - Read the `og-image.njk` template
   - Extract CSS custom properties from the main stylesheet
   - Render the template with post data
   - Generate PNG images saved to `src/assets/images/og/`

3. **Auto-generation**: Posts with `ogImage: auto` or no `ogImage` field will have images generated automatically
   - Images are generated during `npm run generate-og-images`
   - Images are also generated incrementally during `npm run dev` when posts change
   - Manual `ogImage` values are preserved (won't be overwritten)

4. **Styling**: The template matches site styling:
   - Title uses article `h1` styling (semibold, 3.5rem)
   - Author name and tagline use link color (red)
   - Light theme colors are forced (consistent appearance)
   - 4rem padding around content
   - Light gray background bars at top/bottom

## Regenerating OG Images

To regenerate all OG images (e.g., after styling changes):

```bash
npm run generate-og-images
```

To force regeneration of images that have manual `ogImage` values, delete the `src/assets/images/og` directory first:

```bash
rm -rf src/assets/images/og
npm run generate-og-images
```

# ➡️ Redirects

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

# 🌈 Color Ideas

Color ideas inspired by https://www.presentandcorrect.com/blogs/blog/rams-palette and found at https://mcochris.com:
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

# 🔒 Security Audit

The security audit script (`scripts/security/security-audit.js`) performs periodic security and maintenance checks for the site. It automates checks where possible and provides a checklist of manual tasks that require human review.

## Configuration

The script requires a `SITE_DOMAIN` environment variable for live site security checks. Add to your `.env` file:

```
SITE_DOMAIN=jonplummer.com
```

**Important**: `SITE_DOMAIN` is the public-facing domain name (e.g., `jonplummer.com`), not the SSH hostname. `DEPLOY_HOST` is used for deployment (SSH access), while `SITE_DOMAIN` is used for checking the live website. If `SITE_DOMAIN` is not set, the script defaults to `jonplummer.com`.

## Running the Security Audit

```bash
npm run security-audit
```

## What It Checks

The script performs automated checks for:

### Dependency & Package Security
- npm audit vulnerabilities
- Outdated packages
- Node.js LTS version (even-numbered: 18, 20, 22, etc.)
- Deprecated packages

### Code & Configuration Security
- Environment variable handling (`.env` in `.gitignore`)
- Package.json configuration
- File permissions on sensitive files
- Git history for accidentally committed secrets

### Build & Deployment Security
- Sensitive files in build output
- Content Security Policy configuration

### Content & Links Security
- Redirect security (informational)
- Third-party resources (informational)

### Live Site Security (requires `SITE_DOMAIN`)
- Security headers on live site
- TLS certificate expiration
- DNS records

It also provides a focused checklist of manual tasks relevant to static sites, including dependency updates (with testing), SSH key rotation, hosting provider notices, and backup testing.

See the script's header comments for the complete list of security and maintenance tasks.
