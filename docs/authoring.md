# Authoring

## Front Matter Variables

### Required

- **`layout`** - Template to use (e.g., `single_post.njk`)
- **`title`** - Page title
- **`date`** - Publication date: `"YYYY-MM-DDTHH:mm:ss-HH:mm"` (posts only)
- **`tags`** - Array including `post`. Additional tags become `article:tag` meta tags.

### Optional

- **`description`** - Meta description (50-160 chars). Defaults to title if omitted.
- **`ogImage`** - OG image path. Use `auto` or omit to auto-generate. Format: `/assets/images/og/YYYY-MM-DD-post-slug.png`
- **`permalink`** - Custom URL structure
- **`eleventyExcludeFromCollections`** - Set to `true` to exclude

**Note:** Drafts go in `_posts/_drafts/`, not via a `draft` variable.

## Open Graph Images

OG images are auto-generated for posts and pages.

### Usage

- **Auto-generate**: Set `ogImage: auto` or omit the field
- **Manual**: Set `ogImage` to a custom path (e.g., `/assets/images/custom-og.png`)

Generated images use format: `/assets/images/og/YYYY-MM-DD-post-slug.png`

### Preview

Preview at `http://localhost:8080/og-image-preview/` (excluded from deployment)

### Generation

- **Dev**: Auto-generated on file save
- **Deploy**: Auto-checked before deployment
- **Manual**: Run `npm run generate-og-images`

For technical details, see [commands.md](commands.md#-open-graph-image-generation).

## Redirects

Handle URL changes (e.g., corrected post dates) by creating redirect pages.

### Create a Redirect

1. Create HTML file at old URL path (e.g., `src/2022/11/09/post-slug/index.html`)
2. Add front matter:

```yaml
---
layout: redirect.njk
redirectUrl: https://jonplummer.com/2022/11/08/corrected-url/
---
```

The `redirect.njk` template uses three redirect methods: JavaScript redirect (primary), meta refresh (fallback), manual link (for accessibility)

### When to Use

- Post date corrections
- Slug changes
- URL structure migrations
- Any permanent URL change preserving old links
- Addressing high-volumne 404 errors when the resource exists
