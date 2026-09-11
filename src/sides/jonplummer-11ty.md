---
title: jonplummer-11ty
description: The Eleventy build behind this site, and the test suite and deploy pipeline that help me catch mistakes before they are public – a static site with as much tooling around it as content in it.
date: 2026-09-07
layout: layouts/side_detail.njk
tags: sideproject
permalink: /sides/jonplummer-11ty/
status: Self-hosted
coverImage: 2026/09/jonplummer-11ty-cover.jpg
githubUrl: https://github.com/jplummer/jonplummer-11ty
ogImage: /assets/images/og/sides.png
---
![The post “Care has to show up in the product” at desktop width in light mode, with the same post on a phone in dark mode laid over it. One page, two widths, two themes, and not one media query that knows what a phone is.](/assets/images/2026/09/jonplummer-11ty-cover.jpg)

This one is the site you're reading now. [Eleventy](https://www.11ty.dev/), [Nunjucks](https://mozilla.github.io/nunjucks/), markdown files in git, [`rsync`ed](https://rsync.samba.org/) to a plain host. Nothing renders on demand, and nearly nothing needs JavaScript to work, so it is lightning-fast.

That part is unremarkable – there are thousands of Eleventy blogs. What makes this a project rather than a configuration is everything around the build: 95 scripts, 34 tests, and a deploy pipeline that regenerates a changelog, purges a CDN, and notifies search engines of what's new and changed. I've made six hundred-ish commits in the year since I started, against a corpus of 192 posts and 32 portfolio pieces. Yes, that means a lot of effort is going into things behind the scenes, but I think it's helping me make a more solid and consistent site and avoid dumb mistakes.

## Why this, why now

The site was originally on [WordPress](https://wordpress.org/). Even with a static site generation plugin and a caching plugin it was oddly slow. Moving it off meant writing a migration script, running it, reading what came out, and iterating on the script, rather than making manual fixes to the content. This helped me understand my content better and produce clean markdown ready for 11ty. I've kept that method as I've worked on other aspects of the site – every time I found a mistake by eye, I wrote something that would find the next one for me and point it out. And rather than ask agents to do the work of moving content or fixing mistakes, I asked agents to help me make tools to find mistakes. More on this at [My recent experience with AI-assisted coding](/2025/11/16/my-recent-experience-vibe-coding/).

## A lot of the tests look at authoring

Nineteen of the 34 tests check authored content and built output rather than program behavior. They catch things I regularly get wrong, such as: a description with unescaped characters that break the YAML; a link to `/colophon` without the trailing slash [Apache](https://httpd.apache.org/) would 301; a page with no `og:image`; a skipped heading level. Spelling is in there too, though [cspell](https://cspell.org/) only ever warns – it finds proper nouns it doesn't know far more often than it finds typos, so blocking the build on it would train me to ignore it.

Another twelve are ordinary unit tests of the tooling itself. If I add functionality I add tests. The remaining three need a browser, a network, or credentials, and run on demand.

The tests also mean I don't have to remember to do things – if I slip up, it'll be caught. A few of the tests are worth pointing out because each came from a mistake I made more than once.

I fiddle with the colors a lot. `color-contrast` pulls every `light-dark()` pair out of the stylesheet, normalizes each value through [culori](https://culorijs.org/) – they're authored as `oklch()`, with some older hex still around – and computes [APCA](https://github.com/Myndex/apca-w3) lightness contrast twice: once after mapping into the sRGB gamut, once after mapping into Display P3. The sRGB number is what could draw a WCAG compliance warning. The P3 number also warns when the two diverge by four Lc or more, or when P3 lands below the minimum while sRGB still passes. More on this at [OKLCH, APCA, and why one luminance number may not be enough](/2026/03/28/oklch-apca-and-wide-gamut-luminance/).

`critical-css` compares the inline first-paint shell against the tokens in the stylesheet. In August 2026 I softened the light page background from `oklch(100% 0 0deg)` to `oklch(98% 0 0deg)`. That commit touched five files, but the inline shell wasn't one of them, and for the next two days every cold light-mode page load flashed white before the stylesheet darkened it – the exact flash the shell was there to prevent. It's invisible in the built HTML, invisible on any repeat visit, but many of my visitors are first-timers. I saw the flash on the 13th while chasing some other bug. The test prevents this mistake from being made live again.

`error-document-assets` checks that the built `404.html` and `500.html` reference their stylesheet, font preloads, and all three favicons with root-absolute paths. Apache serves an error document at whatever URL failed, so a relative path resolves against that failing URL and 404s in turn – a broken page that breaks harder. Nothing else catches it: on disk the relative path resolves fine, so every file-tree check passes. I fixed the 404 a while back, but mistakenly left the 500 page broken for another month because I'd only thought about the error page I'd actually looked at. The test now reads `.htaccess` and points out any `ErrorDocument` target it doesn't cover.

`design-docs-location` throws an error if a directory named `docs/superpowers/` reappears. Two of the agent skills I use default to writing plans there; my preference is `docs/designs/`. Editing the skills doesn't hold, because these skills come from outside. Rather than arguing with the tool every few weeks, the test just refuses the wrong answer.

None of these is clever, and some might be overkill, but that means there's less I have to remember in order to do a good job.

## Building and deploying run a raft of tests

`pnpm run deploy` generates the changelog from git history, builds, runs the output checks, syncs the result up with rsync, purges [Cloudflare](https://www.cloudflare.com/), submits to [IndexNow](https://www.indexnow.org/), commits the changelog if it changed, and pushes. It prints a timestamp when it finishes, so the scrollback says when the site went out.

Since every build rewrites `_site/`, rsync's transfer list thinks nearly everything changed when almost nothing did, so we need to make our own purge list. After the upload, the deploy walks the output, hashes each file with SHA-256, and diffs against a local manifest – only URLs whose bytes actually changed should be purged. It costs only a few seconds to figure out a list that's usually a handful of URLs instead of the whole site, which is polite to the CDN.

For IndexNow I do the same diff but keep a separate file. After a healthy build the cache and IndexNow lists are the same, but since either process could fail independently of the other they need to be able to be out of sync for a while. And one can operate as-is while I work on the other, if need be.

## The labs

Two design tools live as pages on the site.

[/color](/color/) is an APCA-aware theme explorer. The generator builds candidate palettes in OKLCH and nudges each one's lightness and chroma until it clears Lc 60 on the sRGB path, marking any that still can't get there. The page itself gives me a hue-rotation slider, a harmony lab with recipe and spread controls, and menus of the presets it built with CSS variables ready to copy.

[/type](/type/) renders a simulation of the home page – header, a post, the link row, pagination, footer – at the live site type scale and colors, with one menu for the heading typeface and another for everything else, so I can see a font pairing as if it were live.

## My favorite aspect of the design

There are three breakpoints – 40rem, 54rem, and 60rem – and they're in rem rather than pixels because they're really about readability. The layout changes not when we're at a typical tablet or phone width but when a line of body copy gets long enough to be tiring to track back from or short enough to be choppy. Because the thresholds are in rem, they also adjust when a reader turns their text up or down or zooms in or out, so the layout reflows for someone reading large type the same way it does for someone with a narrow window. What you get at any moment is a text measure that's comfortable at whatever width you're at and whatever size you've set your text, with no CSS gymnastics to speak of.

## What's in the repo

```text
src/            posts and portfolio items (both under _posts/), pages,
                side projects, wisdom, CSS, self-hosted fonts
eleventy/       config and utils – filters, shortcodes, collections, image handling
scripts/
  build/        the ordered build: source checks, OG images, Eleventy, output checks
  test/         33 of the 34 test scripts, wired up through a single manifest
  deploy/       rsync, Cloudflare purge, IndexNow, changelog commit
  content/      OG image generation, PDF and deck conversion, NotePlan link import
  security/     the audit, and the 34th test script
  color-explore/  the APCA gallery generator behind /color/
  font-explore/   the type lab generator behind /type/
  focus-audit/    keyboard and focus sweep, EARL output, run on demand
  utils/        shared helpers – the ones with real logic have their own unit tests
docs/           commands, authoring, tests, and design records
```

Two of those directories lean on things outside the repo: `content/` imports link
roundups out of [NotePlan](https://noteplan.co/), and `focus-audit/` writes its results as [EARL](https://www.w3.org/WAI/standards-guidelines/act/report/earl/), the W3C's vocabulary for accessibility test results, so the runs diff against each other and other tools can read them.

It isn't a starter template and I wouldn't recommend cloning it. The content, the palette, and the mark are mine, of course. But the deploy scripts, the test harness, and the two design labs might be worth cribbing from.

<h2 id="privacy-and-terms">Privacy and terms</h2>

This site has no trackers, no cookies, no social media widgets, and no third-party scripts or stylesheets. Every asset a page loads comes from this domain. My host records visits, pageviews, and referrers in its own logs, which is all I know about who's reading, and it's enough. Nothing here runs ads, sells data, or shares data with third parties, and none of it is directed at children or intended for anyone under 13.

The repository is public and split two ways. The code – build scripts, tests, deploy pipeline, Eleventy config, templates, CSS – is offered under the MIT License, so take what's useful. The content – posts, portfolio pieces, page copy, images, and the mark – is licensed [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/): quote it, translate it, build on it, with credit and not for money. The drawn portrait on [/colophon/](/colophon/) is Robert Ullman's work. I commissioned and paid for it and I publish it here, but it isn't mine to license onward, so it sits outside both licenses – please don't reuse it.

This is a personal project, offered as-is, without warranty of any kind, and with no guarantee of error-free or continuous operation. I maintain it because I use it, and may change or discontinue any of it at any time. Source is on [GitHub](https://github.com/jplummer/jonplummer-11ty).
