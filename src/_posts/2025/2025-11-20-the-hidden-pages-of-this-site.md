---
title: The "hidden" pages of jonplummer.com
layout: single_post.njk
date: 2025-11-20T20:00:00.000Z
tags: post
description: A tour of the utility pages of this site—RSS feeds, documentation, sitemaps, and more—and how they are generated.
ogImage: /assets/images/og/2025-11-20-the-hidden-pages-of-this-site.png
---
This site has a handful of "hidden" pages. They aren't secret but they don't live in the main navigation; they serve utility functions rather than human browsing habits. Making them public and giving them URLs is a nod to the "view source" ethos of the web. Everything is here, everything is inspectable, and everything is open.

## 1. The main RSS feed

[/feed.xml](/feed.xml)

This is the lifeblood for those of us who still believe in the open web and subscribing to and reading periodic content on our own terms. It contains all the blog posts from the site.

### How the RSS feed is generated

It's built using a Nunjucks template (`feed.njk`) that iterates over the `collections.post` collection in 11ty. It outputs XML compliant with the RSS 2.0 specification. I use the `eleventy-plugin-rss` to help with some of the formatting, ensuring dates and absolute URLs are handled correctly.

### Why an RSS feed

If you use a feed reader (like NetNewsWire, Feedly, or Readwise Reader), this is how you get my updates without checking the site manually. It's the "subscribe" button of the decentralized web.

## 2. The links feed

[/links-feed.xml](/links-feed.xml)

A specialized feed for the "found links"—the interesting articles, tools, and videos I find around the web that don't warrant a full blog post but are worth sharing.

### How the links feed is generated

Similar to the main feed, this uses a Nunjucks template (`links-feed.njk`). However, it skips the main posts in favor of the short link posts that appear between them. This is easy because those posts appear in a separate data file (`src/_data/links.yaml`). This allows the feed to present a chronological stream of fun and interesting things.

### Why a links feed

If you only want the curated list of cool stuff I find and not my long-form rambling, or if you want to pipe these links into a different tool, this is the direct line.

## 3. The readme

[/readme/](/readme/)

This is the "About This Site" page's technical cousin. It renders the actual `README.md` file from the project's root directory. I produced it because GitHub expects one, and the source code for this site is on GitHub.

### How the readme is generated

This is one of my favorite little 11ty tricks. The page (`src/readme.md`) is just a wrapper. It uses a custom `readFile` filter to grab the contents of the project's `README.md`, then pipes it through a `markdown` filter to render it as HTML.

```js
// .eleventy.js
eleventyConfig.addFilter("readFile", (filePath) => {
  return fs.readFileSync(filePath, "utf8");
});
```

### Why a readme

It ensures that the documentation in the code repository and the "about this project" page on the live site are always perfectly in sync. No copy-pasta required. If you want to know how to build or run this site locally, this is where to begin.

## 4. The changelog

[/changelog/](/changelog/)

A chronological list of changes, fixes, and updates to the site's codebase and content.

### How the changelog is generated

Identical to the readme strategy, the `src/changelog.md` file includes the root `CHANGELOG.md` using the `readFile` filter. This keeps the project history transparent and accessible without me having to update two different files. Every time I commit a change and build the site, the latest commit message gets summarized and added to the changelog.

### Why a changelog

If you're wondering when a specific feature was added or if I've fixed a bug you noticed, this is the record. It's also a good accountability tool for me to see how often (or how rarely) I'm shipping updates.

## 5. The technologies list

[/technologies/](/technologies/)

A detailed breakdown of the building blocks: Eleventy, Node.js, specific plugins, and testing tools.

### How the technolgies list is generated

This one is currently a static Markdown file (`src/technologies.md`). While I could automate it by reading `package.json`, I prefer to generate then edit this list to add context about each tool and remove the overly-obvious, rather than just dumping a list of version numbers.

### Why a technologies list

If you're a developer looking to build a similar site, these are my ingredients. It breaks down not just the "what" but the specific libraries handling things like RSS, dates, and accessibility testing.

## 6. The sitemap

[/sitemap.xml](/sitemap.xml)

A map of the site for search engines.

### How the sitemap is generated

A Nunjucks template (`sitemap.njk`) iterates through all the collections (`post`, `portfolio`, `page`) and outputs an XML file that follows the sitemap protocol. It includes last-modified dates so crawlers know when to come back.

### Why a sitemap

You probably don't, unless you are a robot. But if you're building a site, you need one of these to ensure Baudu, Yandex, Yippy, Ecosia, Bing, Kagi, Ask, et al can find all your pages efficiently.
