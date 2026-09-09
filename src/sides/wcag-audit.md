---
title: wcag-audit
description: A tool that checks a page against all 87 WCAG 2.2 criteria and traces every verdict to a named W3C rule, not a plain pass or fail.
date: 2026-08-09
layout: layouts/side_detail.njk
tags: sideproject
permalink: /sides/wcag-audit/
status: In development
coverImage: 2026/09/wcag-audit-cover.jpg
githubUrl: https://github.com/jplummer/wcag-audit
ogImage: /assets/images/og/sides.png
---
![My site with a rule violation overlay](/assets/images/2026/09/wcag-audit-cover.jpg)
*Caught red-handed, on my own site, by my own tool.*

wcag-audit uses [axe-core](https://github.com/dequelabs/axe-core) to check a page against 28 [WCAG 2.2](https://www.w3.org/TR/WCAG22/) success criteria and hand back a verdict on each one, with a pointer to the [ACT rule](https://www.w3.org/WAI/standards-guidelines/act/rules/) or [W3C Understanding doc](https://www.w3.org/WAI/WCAG22/Understanding/) behind it.

Yes, it's ugly. Pretty will come later.

28 isn't very many; there are 87 WCAG success criteria. But most of those require some sort of human judgement. I'd like to get to where we can check all 87, even in a rudimentary way, with the help of AI, but I'm starting small. And the 28 that get any automated check are graded partially – a clean axe-core run means axe found nothing, not that the page is good.

## How it works

1) A registry pulls WCAG's machine-readable criteria and the [W3C](https://www.w3.org/)'s ACT rules straight from w3.org and normalizes them, so nothing is hand-typed and a re-run reports exactly what changed upstream.
2) A capture step loads the page in [Playwright](https://playwright.dev/), runs axe-core, and saves an evidence bundle: the DOM, screenshots at several widths and zoom levels, a full keyboard tab-order trace, and – added recently – a measured contrast ratio on every pointer target's border and focus outline.
3) Then Claude works through the criteria axe can't touch, group by group (content, structure, keyboard, forms, visual, media, behavior), following the procedure named for each one, and a report is written.

## Status

The first real test: the W3C's own [demo page](https://www.w3.org/WAI/demos/bad/before/home.html), broken on purpose, to check the pipeline against a known answer. The full run came back 23 fail, 26 pass, 33 not-applicable, and five needs-review across the 87 criteria, with 75 findings – matching axe's own report, plus things axe doesn't check.

![The W3C's own "before" demo page, and four of the seven different axe rules it fails on – contrast, missing alt text, an unlabeled nav link, an unlabeled menu.](/assets/images/2026/09/wcag-audit-demo-snap.jpg)
*Seven rules fired on W3C's sample inaccessible page - contrast, missing alt text, unlabeled links, unlabeled form controls, missing landmarks, etc.*

Then I pointed it at this site and it found five failures of its own: the low-contrast red-on-gray pairing on the nav links and the paging navigation that I mentioned above. Critically, this is reported on as one problem rather than each individual instance being a separate finding. The idea here is to make it clear what problems you might sort out by fixing your design system or pattern library versus what might require more local attention.

[Target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) and [focus visibility](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) now get measured directly from a fresh pass over every clickable element's geometry instead of being guessed from a screenshot. That helped with five of six criteria that I was stuck on. The remaining one, when a focus ring is drawn with box-shadow instead of outline, which can't be read from computed style, still needs a person. The report now points this out.

## What's next

Phase one, still in work, evaluates one page. Later phases, in design now, will cover a whole site: sampling pages by template, clustering findings that repeat across pages, and working toward [Accessibility Conformance Report (ACR)](https://www.itic.org/policy/accessibility/vpat)-style output. How much of that sampling still needs a person's judgment, rather than a verdict inherited from a matching page, is an open question.

The registry format, the evidence schema, and what's deliberately out of scope for phase one are in the repo's README and design docs.

<h2 id="privacy-and-terms">Privacy and terms</h2>

wcag-audit doesn't have an app, a server, or a database. It's a local tool: point it at a URL, and it runs a browser and axe-core on your own machine, writing its evidence bundle to your own disk. Nothing it captures – screenshots, DOM, findings – goes anywhere unless you commit and push it yourself. It doesn't run ads, sell data, or share data with third parties, and it isn't directed at children or intended for anyone under 13.

This is a personal project, offered as-is, without warranty of any kind, and with no guarantee of error-free or continuous operation. I maintain it when I have time to, and may update or discontinue it at any time, though I'll try to give notice. Source is on [GitHub](https://github.com/jplummer/wcag-audit) under the [ISC License](https://opensource.org/license/isc-license-txt); see the repository for current terms.
