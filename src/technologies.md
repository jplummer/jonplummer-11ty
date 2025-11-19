---
title: "Technologies – Jon Plummer"
description: "The technologies and dependencies that go into developing jonplummer.com are listed here. This list os geenrated by Cursor, but it's pretty good at figuriung out what is actually in use."
date: 2025-11-15
layout: base.njk
tags: page
permalink: "/technologies/"
---
# Technologies and dependencies

- **Eleventy (11ty)**
  - Static site generator using Node.js
  - Dependencies:
    - **@11ty/eleventy**: Core static site generator framework
  - Template engines:
    - **Nunjucks (.njk)**: Primary templating language with template inheritance, filters, and shortcodes
    - **Markdown (.md)**: Content format for blog posts and pages
      - **markdown-it**: Markdown parser used by Eleventy for processing .md files (configured with HTML support, line breaks, and auto-linkification)
    - **HTML**: Supported template format
  - Data formats:
    - **YAML (.yaml, .yml)**: Used for data files in `_data/` directory (e.g., `links.yaml`)
      - **js-yaml**: YAML parser for processing .yaml and .yml data files
    - **JSON**: Supported data format (though YAML is preferred for new data files)
  - Plugins:
    - **@11ty/eleventy-plugin-rss**: Generates RSS/XML feeds from collections
    - **@11ty/eleventy-plugin-syntaxhighlight**: Adds syntax highlighting for code blocks
    - **eleventy-plugin-date**: Provides date formatting filters using Luxon

- **Node.js**
  - JavaScript runtime for running build scripts, test scripts, and deployment scripts
  - Module system: **CommonJS** (uses `require()` and `module.exports`)
  - Built-in modules used:
    - **fs**: File system operations
    - **path**: Path manipulation utilities
    - **child_process**: Executing shell commands (rsync, validation)
    - **http/https**: HTTP client for link checking
    - **url**: URL parsing and manipulation
    - **crypto**: Hashing for file comparison

- **Testing & Validation**
  - **puppeteer**: Headless browser automation for accessibility testing (launches Chromium to test HTML files)
  - **axe-core**: Accessibility testing engine used by test-accessibility.js (analyzes HTML for WCAG compliance violations)
  - **html-validate**: Offline HTML5 validator used by test-html.js (validates HTML syntax, nesting, and attributes)
  - **xmldom**: XML DOM parser for RSS feed validation in test scripts

- **Deployment**
  - **dotenv**: Loads environment variables from .env file for deployment scripts
  - **rsync**: File synchronization for deployment (must be installed on system)
  - **SSH**: Secure shell access for remote deployment (must be configured)

- **Web Standards**
  - **HTML**: Output format for all generated pages
  - **RSS/XML**: RSS feed generation for blog posts and links
  - **CSS**: Styling (vanilla CSS with custom properties)
