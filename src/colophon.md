---
title: /colophon
description: How this site is built, and where I've written about that topic.
date: 2026-08-10T00:00:00.000Z
layout: base.njk
tags: page
permalink: /colophon/
ogImage: /assets/images/og/colophon.png
---
(updated {{ date | postDate }})

This site is built with Eleventy, Nunjucks, and plain-text markdown files, kept in github. Every page is pre-built at deploy time – nothing renders on demand, and almost nothing needs JavaScript to work. This makes the site fast and cheap to serve and easy to cache. The exceptions, like the portfolio lightbox, are sparing and deliberate.

Type is [Libre Franklin](https://github.com/googlefonts/Libre-Franklin) for reading and [Big Shoulders](https://design.chicago.gov/typography/) for the wordmark and headings, both self-hosted as variable fonts, nothing loaded from anyone else's server. Color is authored in OKLCH and checked against APCA contrast targets automatically, in both light mode and dark, for every token – accessibility isn't a pass at the end, it's a constraint the palette is built inside of from the start. Layout runs on an eight-pixel grid, with a reading measure chosen for comfort, not density. Responsive breakpoints are chosen for favorable measures rather than device-specific dimensions.

None of that is decorative; it's all meant to make the site fast to load and easy to read. It's related to the argument I make about software generally: powerful tools don't reduce the need for careful, coordinated interfaces. They raise the bar for what careful means.

## The small decisions

This site looks spare. That's on purpose, not by default. Sparse isn't the same as undone – here's some of what's actually been decided, even where it doesn't show at a glance.

- **Type is a modular scale from one base size and one ratio** – new sizes stay proportional, nobody's picking pixel values by eye.
- **Headings and paragraphs use balanced and pretty text-wrapping** – no awkward one-word line breaks, no ragged last lines.
- **Layout runs on an eight-pixel grid** – spacing is never a guess.
- **Responsive breakpoints are chosen by reading measure, not device width** – the layout changes when a line gets too long to read comfortably, not at an arbitrary screen size.
- **Motion is functional, not decorative** – a one-time view-transition on navigation, short hover transitions, nothing else. All of it is off under reduced-motion settings.
- **Dark mode follows your system setting** – no toggle to find, remember, or leave in the wrong state.
- **There's a real print stylesheet** – greyscale, correct page margins, link URLs printed out in full. Try it on a post.
- **The mark hides my initials in four rectangles** – a stem and a foot for the J, a stem and a bowl for the P.
- **There's no loading state to design** – nothing to wait for, since the HTML is already there when the page arrives.
- **Old URLs still work** – corrected post dates and slug changes get server-side redirects, not broken links.

I used AI to build a lot of this, but not by having agents do the work directly. When the site needed to move off WordPress, Cursor and I wrote and tested a migration script, then ran it and checked what came out – we didn't just ask an agent to migrate the site, we built and verified the thing that did. Same with spelling: cspell and a test script catch typos on every build now, because we built that, instead of asking an agent to proofread once. Accessibility checks, redirects, pre-deploy validation – same pattern. Everything here is software Cursor helped me build, running every time, not a task it did for me once. Nothing shipped without me reading it, running it, and rejecting what wasn't right.

No analytics, no trackers, no cookies, no social media widgets – I don't know who's reading this, and that's fine. I just count visits, pageviews, and referrers.

I'm considering a short series on how specific pieces of this came together – the type system, the color and token pipeline, and what it took to rebuild this site with an AI-assisted 11ty workflow. Each one will get linked here as it's published.

The full build – tests, deploy scripts, redirects, the works – is public at [github.com/jplummer/jonplummer-11ty](https://github.com/jplummer/jonplummer-11ty). For the exhaustive dependency list, see [/technologies](/technologies/) – this page is the why, that one's the what. The full history of changes is at [/changelog](/changelog/).

<figure class="colophon-signature">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="/assets/images/jon-sketch-by-rob-ullman-dark.png">
    <img src="/assets/images/jon-sketch-by-rob-ullman-light.png" alt="A drawn portrait of Jon Plummer, bald with glasses and a beard, smiling" width="120" eleventy:ignore>
  </picture>
  <figcaption>illustration by <a href="https://www.robullman.com/">Robert Ullman</a></figcaption>
</figure>
