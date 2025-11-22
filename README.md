This is the source code for my personal website. It is designed to be a long-term home for my writing and work.

## Philosophy

The web should be fast, accessible, and resilient. This site is built with those principles in mind:

- **Longevity**: Content is stored in plain text files (Markdown). This ensures it remains readable regardless of what software I use to publish it.
- **Performance**: The site uses no complex scripts or frameworks. It loads instantly because it delivers simple, pre-built pages that use system fonts and have no external dependencies.
- **Accessibility**: I use bog-standard semantic HTML code and vanilla CSS to ensure the site works for everyone, regardless of what device or assistive technology they use. I prefer semantic block elements lie SECTION, ARTICLE, etc. and try not to use meaningless blocks like DIV unless I have a pure layout need.

## How It's Built

I chose simple, reliable tools that require little maintenance.

- **[Eleventy](https://www.11ty.dev/)**: A tool that turns my text files into web pages.
- **CSS**: I write my own styling code without using any large libraries or frameworks.
- **Nunjucks**: A simple way to organize page layouts.
- **Git**: Keeps a history of every change I make.

## Features

- **Dark Mode**: Automatically adjusts to your screen's brightness settings.
- **RSS Feeds**: Allows readers to subscribe to updates without visiting the site.
- **Automated Checks**: I can run a single command to check for:
  - Broken links
  - Accessibility errors
  - Valid code structure

## Run It Yourself

If you want to see how the code works:

1. **Install**: `npm install`
2. **Run**: `npm run dev` (starts local server at `localhost:8080`)
3. **Build**: `npm run build` (creates the final site folder)

## 🤖 For AI Agents

This repository contains a cached copy of the official Eleventy documentation in `docs/reference/eleventy/` and a script to make that copy up-to-date. This puts the Eleventy documentation into agent context, which seems to work better than searching the web for Eleventy implementation details.

### CRITICAL INSTRUCTION

Before implementing any feature, filter, collection, or configuration, an agent MUST check `docs/reference/eleventy/` to see if Eleventy supports it natively.

- Do not reimplement standard Eleventy features (e.g. pagination, collections, data cascade, date functions).
- Use the provided documentation to understand the "Eleventy way" of doing things.
- Prefer using Eleventy-supplied capabilities over writing custom code.
