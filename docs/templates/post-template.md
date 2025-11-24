---
title: Post title here
layout: single_post.njk
date: "YYYY-MM-DDTHH:mm:ss-HH:mm"
tags: post
description: "Meta description for SEO (50-160 characters recommended)"
ogImage: /assets/images/og/YYYY-MM-DD-post-slug.png
---

Post content starts here.

## Front Matter Fields

### Required Fields

- **`title`** - Post title (used in page title, Open Graph, and schema markup)
- **`layout`** - Template to use (typically `single_post.njk`)
- **`date`** - Publication date in ISO format: `"YYYY-MM-DDTHH:mm:ss-HH:mm"`
- **`tags`** - Array of tags. Must include `post` for the post collection. Additional tags (beyond `post`) will be used as `article:tag` meta tags for SEO.

### Optional Fields

- **`description`** - Meta description for SEO (50-160 characters recommended). Used in meta description, Open Graph description, and schema markup. If omitted, defaults to the title.
- **`ogImage`** - Path to Open Graph image. If set to `auto` or omitted, an OG image will be auto-generated at build time using the post title, description, and date. Generated images are saved to `/assets/images/og/` with the filename format `YYYY-MM-DD-post-slug.png`. You can manually set this to use a custom image.

## Automatic SEO Features

The following SEO and social media meta tags are automatically generated for all posts:

### Open Graph Tags
- `og:type` - Set to `"article"` for posts
- `og:title` - From `title` frontmatter
- `og:description` - From `description` frontmatter (or title if not provided)
- `og:url` - Canonical URL
- `og:image` - From `ogImage` frontmatter (or auto-generated)
- `og:image:width` - 1200px
- `og:image:height` - 630px
- `og:image:alt` - Descriptive alt text based on title and description

### Article Meta Tags
- `article:published_time` - From `date` frontmatter (RFC3339 format)
- `article:author` - "Jon Plummer"
- `article:section` - "Blog"
- `article:tag` - One tag per additional tag in `tags` array (excluding `post`)

### Schema.org Structured Data
- BlogPosting schema with:
  - `headline` - From `title`
  - `datePublished` and `dateModified` - From `date`
  - `author` - Person schema for Jon Plummer
  - `publisher` - Person schema
  - `description` - From `description` frontmatter
  - `image` - From `ogImage` frontmatter
  - `url` - Canonical URL

## Example with Additional Tags

```yaml
---
title: Design Quality Expectations for Product Teams
layout: single_post.njk
date: "2023-02-02T12:00:00-08:00"
tags: 
  - post
  - design
  - leadership
description: "Be it version three or an MVP, the experience we deliver should be valuable to specific users be usable by those users conform to or enhance the user's"
ogImage: /assets/images/og/2023-02-02-quality-expectations.png
---
```

In this example, `design` and `leadership` will be added as `article:tag` meta tags.

