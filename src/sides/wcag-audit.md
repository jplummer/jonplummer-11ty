---
title: wcag-audit
description: A tool that checks a page against WCAG 2.2 criteria and names the W3C rule behind the verdict.
date: "2026-08-09"
layout: layouts/side_detail.njk
tags: sideproject
permalink: /sides/wcag-audit/
status: In development
coverImage: 2026/09/wcag-audit-cover.jpg
githubUrl: https://github.com/jplummer/wcag-audit
ogImage: /assets/images/og/v2/sides-wcag-audit.png
---
![My site with a rule violation overlay](/assets/images/2026/09/wcag-audit-cover.jpg)
*Caught red-handed, on my own site, by my own tool.*

wcag-audit checks a page against all 86 [WCAG 2.2](https://www.w3.org/TR/WCAG22/) success criteria and hands back a verdict on each one, with a pointer to the [ACT rule](https://www.w3.org/WAI/standards-guidelines/act/rules/) or [W3C Understanding doc](https://www.w3.org/WAI/WCAG22/Understanding/) behind it.

Yes, it's ugly. Pretty will come later; for now my effort is going into better evaluations and better reporting.

Only 28 of the 86 get an automated check, via [axe-core](https://github.com/dequelabs/axe-core). Most criteria come down to human judgement, so Claude works through the other 58 by following a written procedure for each one. (An 87th one, [4.1.1 Parsing](https://www.w3.org/TR/WCAG22/#parsing), is obsolete as of WCAG 2.2.) Even the 28 are graded partially. A clean axe-core run means axe found nothing, which is not the same thing as "the page is good," so those criteria go to Claude too before any of them can pass.

## How it works

1) A registry pulls WCAG's machine-readable criteria and the [W3C](https://www.w3.org/)'s ACT rules straight from w3.org and normalizes them, so nothing goes stale and a re-run reports exactly what changed upstream.
2) A capture step loads the page in [Playwright](https://playwright.dev/), runs axe-core, and saves an evidence bundle: the DOM, screenshots at several widths and zoom levels, a full keyboard tab-order trace, and – added recently – a measured contrast ratio on every pointer target's border and focus outline.
3) Then Claude works through the criteria axe-core doesn't evaluate, group by group (content, structure, keyboard, forms, visual, media, behavior), following the procedure named for each one, and a report is written.
4) A last step turns a finished run into an [Accessibility Conformance Report (ACR)](https://www.itic.org/policy/accessibility/vpat) in VPAT 2.5Rev style. A criterion the audit couldn't settle is marked Not Evaluated instead of getting a conformance term it hasn't earned, and an ACR with even one of those is labeled a draft. A one-page audit can't back a claim about a whole product, and the ACR says so.

## Status

The first real test: the W3C's own [demo page](https://www.w3.org/WAI/demos/bad/before/home.html), broken on purpose, to check the pipeline against a known answer. The full run came back 23 fail, 26 pass, 33 not-applicable, and five needs-review, with 75 findings – matching axe's own report plus things axe doesn't check.

W3C also publishes a fixed version of the same page, and the test suite runs both. The tool should find every planted defect on the broken page and none of them on the fixed one. A short list still turns up on the fixed page, and the test expects it: AAA-level contrast, target size (a WCAG 2.2 criterion that came after the demo was built), and two axe best-practice rules that aren't actually WCAG criteria.

![The W3C's own "before" demo page, and four of the seven different axe rules it fails on – contrast, missing alt text, an unlabeled nav link, an unlabeled menu.](/assets/images/2026/09/wcag-audit-demo-snap.jpg)
*Seven rules fired on W3C's sample inaccessible page – contrast, missing alt text, unlabeled links, unlabeled form controls, missing landmarks, etc.*

Then I pointed it at this site and it found the borderline low-contrast red-on-gray pairing on the nav links and the paging navigation in the picture at the top of this page. For now each instance is its own finding. Every finding carries a fingerprint, though: the check that caught it plus a selector built from class names. Whole-site auditing will group findings by fingerprint, so the report will distinguish a problem you'd fix once in your design system or pattern library from one that needs attention page by page.

[Target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) and [focus visibility](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) now get measured directly from a fresh pass over every clickable element's geometry instead of being guessed from a screenshot. That helped with five of six criteria that I was stuck on. The remaining one, when a focus ring is drawn with box-shadow instead of outline, still needs a person because it can't be read from computed style. The report now points this out.

## Checking the AI's work

Because Claude does the judging, the test suite can’t evaluate those verdicts the way it evaluates the code. It can score them, though. A gold file records the right verdict for each criterion on a page with planted defects, with the reasoning behind each one, and a scorer compares a run against it.

The scorer keeps the kinds of error apart, because they cost different things. A false pass puts a conformance claim on something broken, and it's the only error that fails the check. A false fail sends someone off to fix what isn't broken. A needs-review where the gold file has an answer counts as a miss, a smaller one, and Claude's instructions say to prefer it to a wrong verdict. The opposite mistake, deciding when the evidence can't support a decision, gets counted as overreach.

There are two limits so far. The gold file was written by whoever planted the defects, so it records what was meant to be broken, I'm not sure anyone has reviewed it independently. And a session that has already read the gold file would be scoring itself, measuring nothing. To date the scorer has only checked the automated layer, where it agrees with the gold file on all four criteria axe decided.

## What's next

Phase one, a full audit of one page, is built. Phase two, designed but not started, covers a whole site: sampling pages by template, grouping findings that repeat across pages, and addressing criteria a single page can't answer, like [consistent navigation](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html). The first step is measuring what the AI pass costs on one page. That number decides how many pages Claude judges in full, which is still an open question.

The registry format, the evidence schema, and what's deliberately out of scope for phase one are in the repo's README and design docs.

<h2 id="privacy-and-terms">Privacy and terms</h2>

wcag-audit doesn't have an app, a server, or a database. It's a local tool: point it at a URL, and it runs a browser and axe-core on your own machine, writing its evidence bundle (screenshots, DOM, findings) to your own disk. The judgment pass is the exception. It runs in a [Claude Code](https://claude.com/claude-code) session, so the page's HTML, the screenshots, and whatever other evidence Claude reads go to Anthropic under your own Claude account and its terms. Run output is kept out of git, so nothing else leaves your machine unless you move it yourself. It doesn't run ads or sell data, it shares nothing with third parties beyond what the judgment pass sends to Anthropic, and it isn't directed at children or intended for anyone under 13.

This is a personal project, offered as-is, without warranty of any kind, and with no guarantee of error-free or continuous operation. I maintain it when I have time to, and may update or discontinue it at any time, though I'll try to give notice. Source is on [GitHub](https://github.com/jplummer/wcag-audit) under the [ISC License](https://opensource.org/license/isc-license-txt); see the repository for current terms.
