---
title: Post title here
layout: single_post.njk
date: "YYYY-MM-DDTHH:mm:ss-HH:mm"  # or "YYYY-MM-DD" for date-only (assumes PST/PDT)
tags: post
description: "Meta description for SEO (20-300 characters recommended, warnings only if outside range)"
ogImage: /assets/images/og/YYYY-MM-DD-post-slug.png
---

Post content starts here.

## Front Matter Reference

For detailed information about front matter variables, see the [Authoring Guide](../authoring.md#front-matter-variables).

**Quick reference:**
- **Required**: `title`, `layout`, `date`, `tags` (must include `post`)
- **Optional**: `description`, `ogImage` (use `auto` or omit for auto-generation), `permalink`, `eleventyExcludeFromCollections`, `draft` (set to `true` to exclude from production builds)

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

