---
title: "More hidden pages: /type, /color, and /ogimages"
layout: layouts/single_post.njk
date: "2026-04-14T12:00:00-07:00"
tags: post
description: "A follow-up to the hidden-pages tour: three lab-style URLs for font stacks, OKLCH color themes, and Open Graph previews—public, not in the main nav, built with Eleventy."
ogImage: /assets/images/og/2026-04-14-more-hidden-pages-type-color-and-ogimages.png
---
Last year I wrote about [a first batch of "hidden" pages](/2025/11/20/the-hidden-pages-of-this-site/) on this site – RSS feeds, a technologies list, the changelog, etc. Those are mostly about *consuming* or *documenting* the project. Here are three more URLs in the same spirit: they are not in the main navigation, but they are not secret. They are small labs for *playing with* how the site looks when shared or read, still in the "everything is inspectable" vein.

## 1. /type

[/type/](/type)

A single home-page-shaped preview at the correct type scale from `jonplummer.css`, with two menus: one for headings (`h1`–`h4`) and one for everything else. Font stacks come from [Modern Font Stacks](https://modernfontstacks.com); these stacks are nice because they rely on fonts that ship with the popular operating systems. The first option on the body menu keeps body text on the heading stack until you pick a specific second stack. There is a collapsible block of example CSS you can copy when you like a pairing.

### Why /type

When I think of changing `--font-family` or heading tokens in CSS, I have a place to audition stacks against the same article and nav styling the blog uses, not a separate mini layout.

## 2. /color

[/color/](/color)

An embedded color theme gallery: smaller and rougher home layout previews, wired to live `light-dark()` tokens. The heavy lifting is OKLCH builds, harmony and preset cards, and APCA-minded checks.

### Why /color

Shipping palettes is still manual work in `jonplummer.css`, but comparing candidates on a simulated layout beats guessing from swatches alone. Keeping the embed on a first-class URL makes that workflow easy to get to. This is just for playing around – actually authoring a good alternative palette is real work.

## 3. /ogimages

[/ogimages/](/ogimages)

A preview of the Open Graph image template: rendered examples with different titles and descriptions, plus a grid of the generated PNGs cached in `src/assets/images/og/`.

### How /ogimages/ is built

`src/ogimages.njk` uses Eleventy's `renderFile` shortcode against `og-image-body.njk` for the inline examples and loops a data-fed list for the rest. Styling lives in `jonplummer.css` under the preview-page rules.

### Why /ogimages

Social cards are easy to break with a long title or a missing description. This page is where I sanity-check the template after edits without spelunking `_site`.

---

Together, `/type`, `/color`, and `/ogimages` use `tags: page` with the shared layout—the same arrangement as `/changelog` and `/technologies`. They are included in `collections.page` (for example `sitemap.xml`). They still do not appear in `/feed.xml` or `/links-feed.xml`, because those feeds list `collections.post` or the curated links, not static pages. The changelog and technologies URLs behave the same way. If you are poking at how this site is put together, start with the [earlier hidden-pages post](/2025/11/20/the-hidden-pages-of-this-site/) for feeds and docs, then add these three when you decide to play with type, color, or social image generation.
