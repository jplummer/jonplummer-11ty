This is the source code for my personal website. It is designed to be a long-term home for my writing and work.

## Philosophy

The web should be fast, accessible, and resilient. This site is built with those principles in mind:

- Longevity: Content is stored in plain text files. This ensures it remains portable – readable regardless of what software I use to publish it.
- Performance: The site should load instantly.
- Accessibility: The site should be accessible to all browsers and all visitors.

## Why It's Fast

Every page is pre-built as a plain HTML file at build time, not generated on-demand when someone visits. There's no JavaScript to parse or execute in the browser. There are no external dependencies; it uses system fonts and loads nothing from external servers. And the markup is reasonably slight, consisting of semantic HTML and vanilla CSS. This means smaller files, faster parsing, and natural accessibility without a lot of ARIA attributes or workarounds.

## How It's Built

I chose simple, reliable tools that require little maintenance.

- [Eleventy](https://www.11ty.dev/): A tool that turns my text files into web pages.
- Nunjucks: A simple way to organize page layouts.
- Git: Keeps a history of every change I make.

### Project Structure

The Eleventy configuration is organized into modules for maintainability:

- `.eleventy.js`: Main configuration file (orchestrates all modules)
- `eleventy/config/`: Configuration modules (plugins, filters, shortcodes, passthrough, events, preprocessors)
- `eleventy/filters/`: Filter functions
- `eleventy/shortcodes/`: Shortcode functions
- `eleventy/utils/`: Utilities (CSS extraction, date formatting, markdown rendering)

## Features

- Dark Mode: Automatically adjusts to your screen's brightness settings.
- RSS Feeds: Separate feeds for blog posts and links, allowing readers to subscribe to updates.
- SEO & Social Sharing: 
  - Open Graph meta tags for social media sharing
  - Article-specific meta tags for blog posts
  - Schema.org structured data (BlogPosting, Person, WebSite)
  - Auto-generated Open Graph images (1200×630px) for all posts and pages
  - Sitemap generation for search engines
  - No specific attention for garbage platforms like Facebook and Xitter, open standards only
- Automated Testing: Comprehensive test suite that checks:
  - HTML validity and structure
  - Links YAML structure and format
  - Broken internal links (critical for site navigation)
  - Accessibility (WCAG compliance via axe-core)
  - SEO meta tags
  - Open Graph images
  - RSS feed validity
  - Markdown syntax and structure
  - Content structure validation
- Automated OG Image Generation: Open Graph images are automatically generated using Puppeteer, using design tokens from the main stylesheet for consistency.
- URL Redirects: Server-side 301 redirects managed via `src/_data/redirects.yaml`, automatically generated in `.htaccess` during build.
- Pre-deploy Validation: Automatic checks before deployment to prevent authoring mistakes from going live.
- Security Audit: Automated security checks for dependencies, configuration, and live site security (headers, TLS, DNS).

## Run It Yourself

If you want to see how the code works:

1. Install: `npm install`
2. Run: `npm run dev` (starts local server at `localhost:8080`)
3. Build: `npm run build` (creates the final site folder)

## 🤖 For AI Agents

This repository contains a cached copy of the official Eleventy documentation in `docs/reference/eleventy/` and a script to make that copy up-to-date. This puts the Eleventy documentation into agent context, which seems to work better than searching the web for Eleventy implementation details.

### CRITICAL INSTRUCTION

Before implementing any feature, filter, collection, or configuration, an agent MUST check `docs/reference/eleventy/` to see if Eleventy supports it natively.

- Do not reimplement standard Eleventy features (e.g. pagination, collections, data cascade, date functions).
- Use the provided documentation to understand the "Eleventy way" of doing things.
- Prefer using Eleventy-supplied capabilities over writing custom code.
