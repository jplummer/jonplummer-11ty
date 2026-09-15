This is the source code for my personal website. It is designed to be a long-term home for my writing and work.

## Philosophy

The web should be fast, accessible, and resilient. This site is built with those principles in mind:

- Longevity: Content is stored in plain text files. This ensures it remains portable – readable regardless of what software I use to publish it.
- Performance: The site should load instantly.
- Accessibility: The site should be accessible to all browsers and all visitors.

## Why It's Fast

Every page is pre-built as a plain HTML file at build time, not generated on-demand when someone visits. Almost none of it needs JavaScript – the handful of interactions that do, like the portfolio lightbox and the 404 suggester, are the exception, not the rule, and the rest of the site works without it. There are no external dependencies; fonts are self-hosted and nothing loads from external servers. And the markup is reasonably slight, consisting of semantic HTML and vanilla CSS. This means smaller files, faster parsing, and natural accessibility without a lot of ARIA attributes or workarounds.

## How It's Built

I chose simple, reliable tools that require little maintenance.

- [Eleventy](https://www.11ty.dev/): A tool that turns my text files into web pages.
- [Nunjucks](https://mozilla.github.io/nunjucks/): A simple way to organize page layouts.
- [Git](https://git-scm.com) and [GitHub](https://github.com): Keeps a history of every change I make.

### Project Structure

The Eleventy configuration is organized into modules for maintainability:

- `.eleventy.js`: Main configuration file (orchestrates all modules)
- `eleventy/config/`: Configuration modules (plugins, filters, shortcodes, passthrough, events, preprocessors, transforms)
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
  - Open standards for social sharing, not special-casing for X or Meta
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

1. Install: `pnpm install`
2. Run: `pnpm run dev` (starts local server at `localhost:8080`)
3. Build: `pnpm run build` (creates the final site folder)

## 🤖 For AI Agents

### Instructions and memory

Project rules live in `.agents/rules/*.mdc`. The `.mdc` format is Cursor's, but the content is plain markdown after a short YAML frontmatter block, so any tool can read them. Each tool reaches the same files through its own entry point:

- **Cursor** reads `.cursor/rules/`, which is a symlink to `.agents/rules/`. Every rule carries `alwaysApply: true` in its frontmatter.
- **Claude Code** reads `CLAUDE.md`, which imports the rules by `@` path along with `docs/commands.md`, `docs/authoring.md`, `docs/tests.md`, and `docs/designs/font-stack-exploration.md`. Slash commands come from `.claude/commands/`, a symlink to `.agents/commands/`.

**Shared memory**: learnings from past sessions live in `docs/agent-memory.md`. Both agents are instructed to read the relevant section before working in an unfamiliar area and to append what they learn. `.agents/rules/memory.mdc` is a short pointer to that file, so the memory itself isn't loaded into every session.

### When debugging unexpected behavior

**Assume Eleventy is working correctly** and follow the debugging workflow:

- See `.cursor/rules/eleventy-debugging.mdc` for the systematic debugging process
- Use Eleventy's debug mode: `DEBUG=Eleventy* pnpm run build`
- Most "bugs" are actually misunderstandings of how Eleventy's features work
