---
title: jonplummer-11ty
description: The Eleventy build behind this site, and the test suite and deploy pipeline that help me catch mistakes before they are public – a static site with as much tooling around it as content in it.
date: 2026-09-07
layout: layouts/side_detail.njk
tags: sideproject
permalink: /sides/jonplummer-11ty/
status: Running this site
coverImage: 2026/09/jonplummer-11ty-cover.jpg
githubUrl: https://github.com/jplummer/jonplummer-11ty
ogImage: /assets/images/og/sides.png
---
![The post “Care has to show up in the product” at desktop width in light mode, with the same post on a phone in dark mode laid over it. One page, two widths, two themes, and not one media query that knows what a phone is.](/assets/images/2026/09/jonplummer-11ty-cover.jpg)

This one is the site you're reading. [Eleventy](https://www.11ty.dev/), [Nunjucks](https://mozilla.github.io/nunjucks/), markdown files in git, [rsync](https://rsync.samba.org/) to a plain host. Nothing renders on demand, and almost nothing needs JavaScript to work.

That part is unremarkable – there are thousands of Eleventy blogs. What makes this a project rather than a configuration is everything around the build: 95 scripts, 34 tests, and a deploy pipeline that regenerates a changelog, purges a CDN, and notifies search engines before it hands control back. Six hundred commits in the year since I started, against 192 posts and 32 portfolio pieces. The ratio is not an accident.

## Why it exists

The site was originally on [WordPress](https://wordpress.org/). Even with a static site generation plugin and a caching plugin it was oddly slow. Moving it off meant writing a migration script, running it, reading what came out, and fixing what the script got wrong – rather than asking an agent to migrate a site and hoping. That's the pattern the whole repo follows, and it's the reason the tooling grew: every time I found a mistake by eye, I wrote something that would find the next one for me. I didn't ask agents to do the work of moving content, I asked agents to help me make tools to get that work done.

## The tests are largely for the writing

Nineteen of the 34 tests check authored content and built output rather than program behavior. They catch the things I regularly get wrong: a description with an unquoted colon in it, which breaks the YAML parse outright; a link to `/colophon` without the trailing slash [Apache](https://httpd.apache.org/) would 301; a page with no `og:image`; a heading level skipped. Spelling is in there too, though [cspell](https://cspell.org/) only ever warns – it finds proper nouns it doesn't know far more often than it finds typos, so blocking a build on it would train me to ignore it.

Another twelve are ordinary unit tests of the tooling itself – the notes parser, the deploy helpers, the manifest logic. If I add functionality I add tests. The remaining three need a browser, a network, or credentials, and run on demand.

A few of the content tests are worth pointing out because each came from a specific failure.

`color-contrast` pulls every `light-dark()` pair out of the stylesheet, normalizes each value through [culori](https://culorijs.org/) – they're authored as `oklch()`, with some older hex still around – and computes [APCA](https://github.com/Myndex/apca-w3) lightness contrast twice: once after mapping into the sRGB gamut, once after mapping into Display P3. The sRGB number is what fails the build. The P3 number only warns, either when the two diverge by four Lc or more, or when P3 lands below the minimum while sRGB still passes. That split is deliberate: sRGB is the conservative floor everyone sees, and a warning is the right weight for "this looks weaker on a wide-gamut screen than the math for the narrow one suggests."

`critical-css` compares the inline first-paint shell against the tokens in the stylesheet. On 11 August 2026 I softened the light page background from `oklch(100% 0 0deg)` to `oklch(98% 0 0deg)`. The commit touched five files; the inline shell wasn't one of them, and it went on hardcoding pure white. For the next two days every cold light-mode load flashed white before the stylesheet darkened it – the exact flash the shell exists to prevent. It's invisible in the built HTML, invisible on any repeat visit, and visible only on a first paint. I caught it by eye on the 13th while chasing some other bug. The test compares five pairs now, and a token or declaration it can't find fails rather than quietly being skipped.

`error-document-assets` checks that the built `404.html` and `500.html` reference their stylesheet, font preloads, and all three favicons with root-absolute paths. Apache serves an error document at whatever URL failed, so a relative path resolves against that failing URL and 404s in turn – a broken page that breaks harder. Nothing else catches it: on disk the relative path resolves fine, so every file-tree check passes. I fixed the 404 and wrote the test in August, then left the 500 page broken for another month because I'd only thought about the error page I'd actually looked at. The test now reads `.htaccess` and fails on any `ErrorDocument` target it doesn't cover.

`design-docs-location` fails the build if a directory named `docs/superpowers/` reappears. Two of the agent skills I use default to writing plans there; my preference is `docs/designs/`. Editing the skills doesn't hold, because they ship from a plugin cache keyed by commit and version, so an update discards the edit. Rather than arguing with the tool every few weeks, the repo just refuses the wrong answer.

None of these is clever. They're each a small piece of judgment I put into the scripts so I don't have to remember.

## The deploy

`pnpm run deploy` generates the changelog from git history, builds, runs the output checks, syncs the result up with rsync, purges [Cloudflare](https://www.cloudflare.com/), submits to [IndexNow](https://www.indexnow.org/), commits the changelog if it changed, and pushes. It prints a timestamp when it finishes, so a scrolled-back terminal still says when the site went out.

The cache purge doesn't trust rsync. Every build rewrites `_site/`, so rsync's transfer list says nearly everything changed when almost nothing did. Instead, after the upload, the deploy walks the output, hashes each file with SHA-256, and diffs against a local manifest – only URLs whose bytes actually changed get purged. It costs a few seconds and it buys a purge list that's usually a handful of URLs instead of the whole site, which leaves the edge cache warm for everything I didn't touch.

IndexNow does the same diff and keeps its own manifest, in a separate file. The two hold identical snapshots after a healthy deploy, which makes them look redundant. They aren't: they're independent cursors, "last state purged" and "last state submitted," each advancing only when its own step succeeds, and each able to be switched off alone. Share one file and a failed purge silently rewrites IndexNow's retry state; switch purging off entirely and nothing advances the cursor at all, so IndexNow resubmits a growing pile every deploy. A unit test runs the same composition the deploy runs, against temp directories with a stubbed `fetch`, and asserts the four properties a single shared file couldn't satisfy. The first one is my favorite: both manifests must record an identical `generatedAt`, because two hash walks would land milliseconds apart, so matching strings are the only proof that one manifest object reached both consumers.

## The labs

Two design tools live inside the site rather than beside it.

[/color/](/color/) is an APCA-aware theme gallery. The generator builds candidate palettes in OKLCH and nudges each one's lightness and chroma until it clears Lc 60 on the sRGB path, marking any that still can't get there. The page itself gives me a hue-rotation slider, a harmony lab with recipe and spread controls, and menus of the presets it built. Sweeping every hue or generating a batch of random palettes are flags on the command-line generator rather than controls on the page.

[/type/](/type/) renders a slice of the home page – header, a post, the link row, pagination, footer – at the real site type scale and colors, with one menu for the heading stack and another for everything else. A font pairing gets judged against actual content instead of a specimen sheet.

Both were built to answer one question and then kept, because the question comes back. The current pairing came out of `/type/`: [Big Shoulders](https://design.chicago.gov/typography/) for the wordmark and the top-level titles, [Libre Franklin](https://github.com/googlefonts/Libre-Franklin) for everything else, including h2 and below.

The breakpoints come from the same habit. There are three – 40rem, 54rem, and 60rem – and they're in rem rather than pixels because what they're really about is the text. The layout changes when a line of body copy gets long enough to be tiring to track back from, or short enough to be choppy. Nothing in the CSS knows what a device is: there isn't a single pixel value in a media query anywhere in it. Because the thresholds are in rem, they also move when a reader turns their text up, so the layout reflows for someone reading large the same way it does for someone with a narrow window. What you get at any moment is a measure that's comfortable at whatever width you're at and whatever size you've set your text, and neither the stylesheet nor I need to know either of those things.

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
roundups out of [NotePlan](https://noteplan.co/), and `focus-audit/` writes its results as
[EARL](https://www.w3.org/WAI/standards-guidelines/act/report/earl/), the W3C's vocabulary for
accessibility test results, so the runs diff against each other and other tools can read them.

`scripts/test-manifest.js` is the piece I'd point at first. It's the single list of which tests exist, what runs them, and which groups they belong to. The runner, the build, and the changed-files runner all derive their lists from it, so adding a test means adding one entry. The manifest checks its own consistency every time it loads – a test in both the fast and unit groups, or one claiming `--changed` support it doesn't have, fails loudly instead of drifting.

## Running it

```bash
pnpm install
pnpm run dev
```

[Node](https://nodejs.org/) 22.18 or newer, because cspell 10 wants it, and [pnpm](https://pnpm.io/) rather than npm. `pnpm run build` builds and validates without deploying. `pnpm run test fast` runs the 19 content and output tests; `pnpm run test unit` runs the tooling ones, and `pnpm run test all` adds the accessibility pass that launches a browser. Deploying needs a `.env` with SSH details, and optionally Cloudflare and IndexNow credentials – without them those steps print a note and skip.

It isn't a starter template and I wouldn't recommend cloning it. The content, the palette, and the mark are mine. But the deploy scripts, the test harness, and the two design labs are the parts most likely to be worth stealing, and they're written to come apart.

Which is also the honest answer to the obvious question: I built almost all of this with [Cursor](https://cursor.com/) and [Claude](https://claude.com/product/claude-code), and the way I did it is the whole point. The argument for that – and the case for why the small decisions here were decisions at all – is on [/colophon/](/colophon/).

<h2 id="privacy-and-terms">Privacy and terms</h2>

This site has no trackers, no cookies, no social media widgets, and no third-party scripts, stylesheets, or fonts. Every asset a page loads comes from this domain. My host records visits, pageviews, and referrers in its own logs, which is all I know about who's reading, and it's enough. Nothing here runs ads, sells data, or shares data with third parties, and none of it is directed at children or intended for anyone under 13.

The repository is public and split two ways. The code – build scripts, tests, deploy pipeline, Eleventy config, templates, CSS – is offered under the MIT License, so take what's useful. The content – posts, portfolio pieces, page copy, images, and the mark – is licensed [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/): quote it, translate it, build on it, with credit and not for money. The drawn portrait on [/colophon/](/colophon/) is Robert Ullman's work. I commissioned and paid for it and I publish it here, but it isn't mine to license onward, so it sits outside both licenses – please don't reuse it.

This is a personal project, offered as-is, without warranty of any kind, and with no guarantee of error-free or continuous operation. I maintain it because I use it, and may change or discontinue any of it at any time. Source is on [GitHub](https://github.com/jplummer/jonplummer-11ty).
