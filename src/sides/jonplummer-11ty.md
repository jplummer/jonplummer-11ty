---
title: jonplummer-11ty
description: The Eleventy build behind this site, and the test suite and deploy pipeline that keep it honest – a static site with more tooling around it than content in it.
date: 2026-09-07
layout: layouts/side_detail.njk
tags: sideproject
permalink: /sides/jonplummer-11ty/
status: Running this site
githubUrl: https://github.com/jplummer/jonplummer-11ty
ogImage: /assets/images/og/sides.png
---
This one is the site you're reading. Eleventy, Nunjucks, markdown files in git, rsync to a plain host. Nothing renders on demand, and almost nothing needs JavaScript to work.

That part is unremarkable – there are thousands of Eleventy blogs. What makes this a project rather than a configuration is everything around the build: 95 scripts, 34 tests, and a deploy pipeline that regenerates a changelog, purges a CDN, and notifies search engines before it hands control back. Six hundred commits in a year, on a site with 224 posts. The ratio is not an accident.

## Why it exists

The site was on WordPress. Moving it off meant writing a migration script, running it, reading what came out, and fixing what the script got wrong – rather than asking an agent to migrate a site and hoping. That's the pattern the whole repo follows, and it's the reason the tooling grew: every time I found a mistake by eye, I wrote something that would find the next one for me.

## The tests are for the writing, not the code

Most of the 34 tests don't check program behavior. They check the things I actually get wrong: a post with an unquoted colon in its description, a link to `/colophon` without the trailing slash that Apache will 301, an image with no `og:image`, a heading level skipped, a word I've misspelled the same way for years.

A few are worth naming because they came from real failures.

`color-contrast` reads every `light-dark()` pair out of the stylesheet, parses OKLCH, and computes APCA contrast twice – once in sRGB and once in Display P3 – so a color that passes on my laptop and fails on a phone gets caught before it ships. The palette is authored inside that constraint rather than audited after.

`critical-css` compares the inline first-paint shell against the tokens in the stylesheet. In August 2026 I softened the light page background to `oklch(98%)`, updated five files, and missed the shell. For two days every cold light-mode load flashed pure white before the stylesheet darkened it – which is the exact flash the shell exists to prevent. Invisible in the built HTML, invisible on a second visit, visible only on a first paint. I caught it by eye. Now a test catches it.

`error-document-assets` checks that `404.html` and `500.html` reference their stylesheet and fonts with root-absolute paths. Apache serves an error document at whatever URL failed, so a relative path resolves against that failing URL and 404s in turn. The 500 page shipped relative paths for months, unchecked, because I'd only thought to test the 404.

`design-docs-location` fails the build if a directory named `docs/superpowers/` comes back. Two of the agent skills I use default to writing plans there; my preference is `docs/designs/`. Editing the skills doesn't hold, because they ship from a plugin cache keyed by commit. So instead of arguing with the tool, the repo just refuses the wrong answer.

None of these is clever. They're each a small piece of judgment I got to stop holding in my head.

## The deploy

`pnpm run deploy` regenerates the changelog from git history, builds, runs the output checks, syncs the result up with rsync, purges Cloudflare, submits to IndexNow, commits the changelog if it moved, and pushes. It prints a timestamp when it finishes, so a scrolled-back terminal still says when the site went out.

The cache purge doesn't trust rsync. Every build rewrites `_site/`, so rsync's transfer list says nearly everything changed when almost nothing did. Instead the deploy walks the output, hashes each file, and diffs against a local manifest – only URLs whose bytes actually changed get purged.

IndexNow does the same diff and keeps its own manifest, in a separate file. The two hold identical snapshots after a healthy deploy, but they're independent cursors: "last state purged" and "last state submitted," each advancing only when its own step succeeds. Sharing one file would mean a failed purge silently rewrites IndexNow's retry state, and turning purging off entirely would leave the cursor frozen while IndexNow resubmits a growing pile every deploy. There's a test whose whole job is to point both paths at one file and demonstrate that it breaks.

## The labs

Two design tools live inside the site rather than beside it. [/color/](/color/) is an APCA-aware theme gallery – hue sweeps, random palettes, every candidate scored for contrast in both gamuts before it's a candidate. [/type/](/type/) is a single card rendering the home page at real site scale, with menus for the heading stack and the body stack, so a font pairing is judged against actual content instead of a specimen sheet.

Both were built to answer one question and then kept, because the question comes back. The current pairing – Big Shoulders for the wordmark and headings, Libre Franklin for reading – came out of `/type/`.

## What's in the repo

```text
src/            posts, pages, portfolio, side projects, wisdom, CSS, fonts
eleventy/       config and utils – filters, shortcodes, collections, image handling
scripts/
  build/        the ordered build: source checks, OG images, Eleventy, output checks
  test/         34 tests, wired up through a single manifest
  deploy/       rsync, Cloudflare purge, IndexNow, changelog commit
  content/      OG image generation, PDF and deck conversion, NotePlan link import
  color-explore/  the APCA gallery generator behind /color/
  font-explore/   the type lab generator behind /type/
  focus-audit/    keyboard and focus sweep, EARL output, run on demand
  utils/        shared helpers – the ones with real logic have their own unit tests
docs/           commands, authoring, tests, and design records
```

`scripts/test-manifest.js` is the piece I'd point at first. It's the single list of which tests exist, what runs them, and which groups they belong to. The runner, the build, and the changed-files runner all derive their lists from it, so adding a test means adding one entry. The manifest checks its own consistency every time it loads – a test in both the fast and unit groups, or one claiming `--changed` support it doesn't have, fails loudly instead of drifting.

## Running it

```bash
pnpm install
pnpm run dev
```

Node 22.18 or newer, because cspell 10 wants it. `pnpm run build` builds and validates without deploying; `pnpm run test fast` runs everything except the browser-based accessibility pass. Deploying needs a `.env` with SSH details, and optionally Cloudflare and IndexNow credentials – without them those steps print a note and skip.

It isn't a starter template and I wouldn't recommend cloning it. The content, the palette, and the mark are mine. But the deploy scripts, the test harness, and the two design labs are the parts most likely to be worth stealing, and they're written to come apart.

Which is also the honest answer to the obvious question: I built almost all of this with Cursor and Claude, and the way I did it is the whole point. The argument for that – and the case for why the small decisions here were decisions at all – is on [/colophon/](/colophon/).

<h2 id="privacy-and-terms">Privacy and terms</h2>

This site has no trackers, no cookies, no social media widgets, and no third-party scripts or fonts. Everything it serves comes from its own domain. My host records visits, pageviews, and referrers in its own logs, which is all I know about who's reading, and it's enough. Nothing here runs ads, sells data, or shares data with third parties, and none of it is directed at children or intended for anyone under 13.

The repository is public and split two ways. The code – build scripts, tests, deploy pipeline, Eleventy config, templates, CSS – is offered under the MIT License, so take what's useful. The content – posts, portfolio pieces, page copy, images, and the mark – is licensed [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/): quote it, translate it, build on it, with credit and not for money. The drawn portrait on [/colophon/](/colophon/) is Robert Ullman's work, used with permission, and isn't covered by either license.

This is a personal project, offered as-is, without warranty of any kind, and with no guarantee of error-free or continuous operation. I maintain it because I use it, and may change or discontinue any of it at any time. Source is on [GitHub](https://github.com/jplummer/jonplummer-11ty).
