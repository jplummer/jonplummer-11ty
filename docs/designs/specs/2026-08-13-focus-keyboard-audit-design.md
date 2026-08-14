# Focus and keyboard navigation audit tooling

**Date:** 2026-08-13
**Status:** approved in discussion; written for review before implementation plan

## Problem

Focus and keyboard evaluation is a laborious part of an accessibility audit, and the labor is what degrades the result. Checking it properly means tabbing through every page, watching where the ring goes, noticing when it disappears behind something or stops matching the reading order, opening each interactive thing and confirming you can get back out — by hand, one stop at a time, with no artifact at the end except notes. That cost is why this part of an audit gets a shallow pass, gets sampled instead of covered, or gets skipped and asserted. The problem to solve is the tedium, not a missing test.

Automation does not currently fill the gap. `pnpm run test a11y` runs axe-core over every built page in light and dark, but axe evaluates static markup: it does not press Tab, does not know what order focus moves in, and cannot tell whether a focused element looks any different from an unfocused one. `pnpm run test color-contrast` checks token pairs in `jonplummer.css`, not focus indicators. This is not a shortcoming of axe — no static analyzer can answer these questions.

A read of the source already turned up two defects, which is a sign the surface has not had a careful pass:

- The article content-warning `<details>` summary styles its caret and its "Show text" / "Hide text" pseudo-content on `:hover` only (`jonplummer.css` 639–649). There is no `:focus-visible` equivalent, so a keyboard user does not get the affordance a mouse user gets.
- The `/color/` and `/type/` form controls (`<select>`, `<input type="range">`) have no focus styling in `color-gallery-embed.css` or the font-lab CSS. They fall through to UA rings drawn over custom-colored panels.

A static read cannot find the rest: tab order, focus that lands on something clipped or offscreen, focus lost when the DOM changes underneath it, or an indicator that exists in CSS but is invisible in practice.

One specific suspicion, unverified: `figure-lightbox.js` toggles `disabled` on the prev/next buttons at the ends of a gallery. If focus is on the next button when the last image is reached, that button becomes disabled while focused and the browser drops focus to `<body>`. Only a traversal test settles this.

## Goals

- Mechanize the laborious parts of a focus and keyboard audit, so that running one properly is cheap enough that it actually gets done properly.
- Support an infrequent, deliberate audit — a few times a year, or when something structural changes — producing evidence rather than only prose.
- Build the collector as portable tooling, usable against any site, this one being its first subject.
- Cover all five dimensions on the reading and portfolio surfaces: focus visibility, tab order, operability, focus management, and tab-stop economy.
- Separate what a machine can decide from what needs human or agent judgment, and don't encode the latter as assertions.
- Record evidence in a shape that can later feed a VPAT/ACR, without building that reporting now. See Future direction.

## Non-goals

- A test-suite member. This does not guard against recurring authoring mistakes; it finds broken patterns so they can be remediated. It is slow enough, and its output discursive enough, that it belongs in a person's hands rather than in a build.
- Exhaustive page coverage. The site is template-driven; one page per distinct template is the unit.
- Deep treatment of `/color/` and `/type/`. Those are experimental utility pages and get a sanity pass only.
- The demo documents under `src/assets/demos/`. They are separate documents with their own markup and are out of scope.
- Screen reader behavior, ARIA correctness, or contrast. axe and `test color-contrast` own those.
- Producing a VPAT or ACR in this pass. The fix list comes first.
- Fixing anything. This spec covers the audit; remediation follows from what it finds.

## Approach (chosen)

**A portable headless-browser evidence collector, a project-specific config, and an evaluator that reports deterministic failures separately from judgment calls.**

Rejected:

- **Manual walkthrough against a checklist.** This is the status quo whose cost is the problem. It catches judgment calls a machine misses, but it produces prose instead of evidence, leaves nothing to re-run, and is exactly the labor that makes audits get skimped. Kept as a small follow-up pass over the flagged items, not as the method.
- **Static review of CSS and templates only.** Cheap, and it already produced the two findings above, but it structurally cannot see tab order, clipping, or focus that goes nowhere.
- **Extending `scripts/test/accessibility.js`.** Would reuse the Puppeteer session, but ties keyboard auditing to this project's test harness and to `file://` loading, which defeats the portability goal.

## Architecture

Three layers with a hard line between them.

**Collector** (`scripts/focus-audit/collect.js` and friends) — site-agnostic. Takes a base URL, a list of paths, and an optional list of scenarios. Drives Puppeteer, emits structured JSON. Imports nothing from this project. This is the piece that lifts out to another site unchanged.

**Project config** (`scripts/focus-audit/jonplummer.config.js`) — the paths that represent each template, plus scenarios. Declarative data, not code, so a different site writes config rather than JavaScript.

**Evaluator and reporter** (`evaluate.js`, `report.js`) — turns evidence into a markdown report. Applies the deterministic rules itself; leaves judgment calls as flagged evidence with enough detail for a human or agent to rule on. The rules and their WCAG criterion tags live here rather than in the config, because WCAG is not site-specific — a second site inherits the whole rule set and supplies only paths and scenarios.

### Serving

The collector takes a base URL, so `http://localhost:8080` (the `pnpm run dev` server) and `https://jonplummer.com` are the same input. The dev server is the fast loop. A production run is worth doing at least once, because production `.htaccess` sets a CSP that the dev server omits, and CSP has silently disabled shipped JavaScript on this site before — a control that is dead in production and fine in dev is exactly the kind of defect this catches.

Not `file://`, despite the existing `a11y` test using it. Focus auditing depends on CSS resolving exactly as it does in production, and it follows links between pages.

## Behavior

### The sweep

From a clean page load, press Tab until focus returns to the first stop or leaves the document, with a cap to avoid runaway loops. Each stop records:

- Ordinal, a stable selector, tag name, computed role, accessible name from the accessibility tree, disabled state, and `href` or input type.
- Bounding box, and whether the element is genuinely visible — not only `display: none` and `visibility: hidden`, but zero-sized and clipped by an ancestor's overflow, which is how focusable things hide in practice.
- The containing landmark, so the report can say "the 14th stop, inside `main`".

Then the same sweep in reverse with Shift+Tab. Forward and reverse disagreeing is a defect that is otherwise near-impossible to notice by hand.

### Focus visibility evidence

This follows ACT rule [`oj04fd`](https://www.w3.org/WAI/standards-guidelines/act/rules/oj04fd/), "Element in sequential focus order has visible focus", whose expectation is: *there is at least one device pixel inside the scrolling area of the viewport whose HSL color value is different when the element is focused from when it is not.*

Three consequences, each of which corrects an earlier draft of this design:

- **Diff the whole viewport, not the element's box.** A focus indicator does not have to render on the element. The rule's own passing examples include a parent's border and a separate square drawn beside the element. Cropping to the element — even padded for outlines — would report false failures for legitimate indicators drawn elsewhere.
- **Compare HSL values, not raw pixel equality.** One differing pixel is the threshold. This is deliberately generous, and the rule says so.
- **Respect the one-second dwell.** The rule defines "focused" as matching `:focus` uninterruptedly for one second after interaction stops, and excludes from "focusable" any element that loses focus within a second of gaining it. Sampling immediately after `Tab` would misread pages whose scripts move focus.

Beyond the rule's minimum, record where the change sits — perimeter versus interior — and capture computed `outline`, `box-shadow`, `text-decoration`, `color`, `background-color` and `border` in both states, so the report says *what* changed rather than only that something did.

That extra detail exists because the rule is knowingly permissive. Its own Background notes that WCAG 2.0 and 2.1 set no requirement for the indicator's size or proximity, so content can pass with "barely perceptible changes at the other end of the page" and still be an accessibility problem. Passing `oj04fd` is the floor, not the goal, which is what the warning tier is for.

### Order checking

Compare tab order against DOM order, and against geometric order (top-to-bottom, left-to-right within a row tolerance). Mismatches are warnings, not failures — a mismatch is sometimes correct. The portfolio grid is the case to look at.

### Scenarios

Declarative steps: navigate, click a selector, press a key, tab N times, expect focus to match a selector. `activeElement` is recorded after every step, so a failed expectation comes with the full trail.

Scenarios for this site:

- **Skip link.** First stop on any page should be the skip link; activate it and record where focus lands and whether the page scrolled.
- **Figure lightbox.** Open from a post figure; record where focus lands. Tab repeatedly and check whether focus escapes the dialog. Arrow to the last image and check whether focus survives the next button becoming `disabled`. Press Escape and check focus returned to the triggering link.
- **Content-warning disclosure.** Focus the summary, confirm a visible indicator, toggle with Space and with Enter, confirm focus stays on the summary and the revealed content is reachable.
- **Utility pages.** A plain sweep of `/color/` and `/type/` only, to confirm every control is reachable and to count stops. No scenarios.

### Severity and criterion tagging

Every rule carries two labels: a severity, and the WCAG success criterion it produces evidence for. The criterion tag is the one part of the VPAT ambition that cannot be deferred — retrofitting it later means re-running everything to re-attribute findings, whereas attaching it at rule-definition time costs a string per rule.

**Failure** — deterministic, no interpretation needed:

| Rule | Evidences |
| --- | --- |
| Focused and unfocused renderings are pixel-identical | 2.4.7 Focus Visible (AA) |
| A control cannot be reached or activated by keyboard | 2.1.1 Keyboard (A) |
| Focus cannot be moved away from a component | 2.1.2 No Keyboard Trap (A) |
| Focus lands on an element that is not visible | 2.4.11 Focus Not Obscured, Minimum (AA) |
| Focus drops to `<body>` after a DOM change | 2.4.3 Focus Order (A) |
| Focus escapes an open modal dialog | 2.4.3 Focus Order (A) |
| Receiving focus triggers a change of context | 3.2.1 On Focus (A) |
| The skip link does not move focus to main content | 2.4.1 Bypass Blocks (A) |
| Forward and reverse sweeps disagree on order | 2.4.3 Focus Order (A) |

**Warning** — usually but not always wrong:

| Rule | Evidences |
| --- | --- |
| Tab order diverges from geometric order | 2.4.3 Focus Order (A) |
| Focus change confined to the interior, no perimeter ring | 2.4.13 Focus Appearance (AAA) |
| Indicator clipped by an ancestor | 2.4.11 Focus Not Obscured, Minimum (AA) |
| Unusually long run of stops before main content | 2.4.1 Bypass Blocks (A) |

**Inventory** — the full stop list per page, which is what makes the report re-readable later.

Where a published ACT rule covers the same ground, the rule's six-character identifier is recorded alongside the criterion — `oj04fd` for the focus-visibility check, confirmed; others looked up at implementation time. Citing the identifier gives a finding the same identity it would have in axe, Alfa or SortSite, which is worth more than a locally invented rule name.

Three honesty constraints on the tagging. A criterion tag says "this evidence bears on that criterion", not "this criterion passes" — and that is not merely caution, it is the outcome mapping ACT itself publishes: for `oj04fd`, any failed outcome means the criterion is not satisfied, while *all passed* outcomes mean only that the criterion "needs further testing". Second, 2.4.13 has area and contrast thresholds this design measures approximately at best. Third, the criteria here are the keyboard and focus subset of WCAG, a fraction of what a conformance report covers.

A numbering caution for whoever reads the ACT rule page: its Background prose calls 2.4.11 "Focus Appearance" and 2.4.12 "Focus Not Obscured (Minimum)", which was WCAG 2.2 draft numbering. The published numbering, used throughout this spec, is 2.4.11 Focus Not Obscured (Minimum) AA, 2.4.12 Focus Not Obscured (Enhanced) AAA, 2.4.13 Focus Appearance AAA.

Escaping a modal is worth a note, since it appears as a failure but is not literally a WCAG violation: no criterion requires a dialog to trap focus. It is listed because on this site it would mean the native `<dialog>` contract is broken, which reliably indicates something else is wrong.

### Pages

Sampling follows WCAG-EM 2.0 Step 3, which requires three things: a structured sample, a random sample, and every view of any complete process.

**Structured sample** — one page per distinct template, chosen to cover the variety of views, functionality and technologies on the site. Weighted toward reading and portfolio:

| Path | Why |
| --- | --- |
| `/` | `index.njk`, home lockup and post list |
| `/page/2/` | paginated index, pagination nav |
| `/2026/04/04/sometimes-you-take-over/` | `single_post.njk` with figures, so lightbox triggers |
| `/2026/02/11/a-conversation-about-religion/` | the only post with a content-warning `<details>` |
| `/portfolio/` | `portfolio.njk`, card grid, whole-card links |
| `/2026/02/20/call-review-console/` | `portfolio_detail.njk` |
| `/wisdom/` | wisdom list and tag links |
| `/colophon/` | page layout, sketch, footer |
| `/about/` | page layout, prose links |
| `/404.html` | error document, root-absolute assets |
| `/color/` | sanity pass only |
| `/type/` | sanity pass only |

Paths verified against the current `_site/`. If the figure post or the disclosure post changes, the config is the only place to update.

**Random sample** — WCAG-EM sets this at 10% of the structured sample, so one or two pages drawn at random from the sitemap each run. Its purpose is not to test more of the site; it is to test whether the structured sample is complete. If a random page surfaces something the twelve above never would, the template list is wrong and the fix is to widen it rather than to note the finding and move on. For a template-driven blog where the structured sample is a guess about which templates matter, this is the cheapest available check on that guess. The runner records which pages were drawn, so a run can be reproduced.

**Complete processes** — none. The site has no multi-step flow: no checkout, signup, or authentication. Stated rather than omitted, because "not applicable" and "not considered" look identical in a report otherwise.

### Output

`docs/designs/scratch/YYYY-MM-DD-focus-keyboard-audit.json` (evidence) and `…-audit.md` (report), both gitignored, dated by run.

**The JSON is EARL 1.0 serialized as JSON-LD**, not an invented shape. This is the format W3C/WAI accepts for accessibility tool results, and using it means the output is ingestible by other tooling instead of being ours alone. The structure is a top-level `@context` and `@graph`, where the graph is an array of `TestSubject` objects — each with a `source` URL and an `assertions` array. Each `Assertion` carries a `test` (the rule, with `isPartOf` listing the WCAG criteria that fail when it fails, as `WCAG2:` identifiers) and a `result.outcome` from the EARL vocabulary: `earl:passed`, `earl:failed`, `earl:inapplicable`, `earl:cantTell`, `earl:untested`.

That vocabulary absorbs a distinction this design had been inventing. The "judgment call flagged for a human" tier is `earl:cantTell` — the tool could not determine pass or fail. EARL's `mode` property carries the rest: this tool is `semiAuto`, since it automates applicability and evidence while leaving some expectations to a person. ACT additionally notes an `incomplete` outcome for rules whose applicability was automated but whose expectations must be evaluated manually, which describes several checks here; pick between `cantTell` and `incomplete` per rule at implementation time.

Per-stop evidence — the screenshot diffs, the computed style pairs, the geometry — lives as extension properties on the assertions rather than replacing any standard field. Standard consumers ignore it; our reporter and any agent doing the judgment pass use it.

Because audits recur, the JSON must be diffable between runs months apart. That means deterministic ordering, stable selectors, and no wall-clock values inside per-assertion records — one run-level timestamp, not one per observation. Comparing two runs should show what changed about the site, not what changed about the run. No differ is being built now; this is only the constraint that keeps one possible.

### Invocation

A `focus-audit` entry in `package.json` scripts, run as `pnpm run focus-audit -- --base-url http://localhost:8080`. The base URL is required with no default, so that pointing it at production is a deliberate act rather than something that happens by forgetting a flag. No `scripts/test-manifest.js` entry — it is not a suite member.

## Standards and references

Four documents define the parts of this that should not be invented locally. Read these before implementing.

| Document | What it settles here |
| --- | --- |
| [ACT Rules for WCAG 2](https://www.w3.org/WAI/standards-guidelines/act/rules/) — in particular [`oj04fd`](https://www.w3.org/WAI/standards-guidelines/act/rules/oj04fd/) | How a check is defined: applicability, expectation, outcome mapping to a criterion. `oj04fd` gives the focus-visibility test its exact expectation and its six-character identity. |
| [EARL 1.0 Schema](https://www.w3.org/TR/EARL10-Schema/) and the [WAI EARL JSON-LD reporting format](https://www.w3.org/WAI/standards-guidelines/act/report/earl/) | The result format: Assertion, TestSubject, TestCriterion, outcome vocabulary, test mode. The JSON-LD page gives the concrete structure to emit. |
| [WCAG-EM 2.0](https://www.w3.org/TR/WCAG-EM/) | The audit method: five steps, and Step 3's structured plus random plus complete-process sampling. |
| [ITI VPAT 2.5Rev](https://www.itic.org/policy/accessibility/vpat) | The eventual report: four editions, the four-level conformance vocabulary, the Remarks column. |

Worth internalizing across all four: none of them are pass/fail machinery. ACT rules are informative rather than normative — WCAG's success criteria remain the basis for conformance. EARL is a way to say what a tool observed, not what is true. An ACR is self-reported. The tooling's job throughout is to make evidence cheap and legible, and to leave verdicts to people.

## Docs

`docs/commands.md` — a Maintenance entry for `pnpm run focus-audit`, noting that it needs a base URL, that `pnpm run dev` provides one, that production is the more faithful target because of CSP, and that output lands in gitignored scratch.

`.cursor/rules/memory.mdc` — a bullet under Command relationships recording that focus/keyboard auditing is deliberately outside the test suite, and why.

## Tests

**None, deliberately.** The project rule is that testing is part of every change, so the reasoning is recorded rather than skipped: this is audit tooling for remediating broken patterns, not a guard against recurring authoring mistakes. Every run is slow, deliberate, and read closely by a person — a silently wrong result would not survive that reading the way a silently wrong CI check would. Unit tests over the pure helpers (diff classification, order comparison, scenario-step parsing) were considered and rejected on those grounds.

Revisit if either of two things happens: the tool starts running unattended, or VPAT/ACR work begins. Evidence that feeds a conformance attestation deserves tested helpers, because at that point nobody is reading each observation.

Verification for the implementation itself is empirical: run it against the dev server, confirm the stop inventory matches what a person tabbing through the page actually encounters, and confirm the two known CSS gaps (content-warning `:focus-visible`, unstyled gallery controls) appear in the report. A tool that misses a defect we already know about is not working.

## Future direction: VPAT/ACR

The eventual want is to turn audit output into an Accessibility Conformance Report. That is deliberately not in this pass — the fix list comes first, and a conformance report written against a surface with known unfixed defects is a report you would immediately have to redo.

**The template.** A VPAT is the blank form; a filled-in VPAT is an ACR. The current edition is **VPAT 2.5Rev (April 2025)**, published free by the Information Technology Industry Council in four editions: 508 (US federal), EU (EN 301 549), WCAG, and INT (all three combined). For a personal site with no procurement exposure, the **WCAG edition** is the right one. Use the official ITI template rather than a reproduction.

**The vocabulary.** Each criterion gets one of four conformance levels — Supports, Partially Supports, Does Not Support, Not Applicable — plus a Remarks and Explanations column. There is no certification, no submission, and no pass/fail scale; an ACR is a self-reported document whose value is entirely in how defensible its remarks are.

What that future needs from this design, and therefore what this design commits to now:

- **Criterion tags and ACT rule identifiers on every rule.** The only piece that would be expensive to retrofit.
- **EARL JSON-LD output.** Already the format, so no conversion step later.
- **Findings grouped by criterion**, not only by page. An ACR is organized per criterion across the whole product.
- **Evidence retained for remarks.** A remark is written from specifics — which pages, which controls, what was observed — so the JSON keeps enough to write one without re-running.
- **A defensible sample.** The remarks are only as good as the sample behind them, which is why the WCAG-EM three-part structure is in this pass rather than deferred.

What it does not commit to: emitting the conformance levels. Those are attestations, and a tool that guesses them produces a document a person has to defend. ACT's own outcome mapping makes the point precisely — all-passed means "needs further testing", not "Supports". The tool assembles evidence per criterion; a person decides the verdict.

Worth stating plainly for whenever that work starts: this covers the keyboard and focus criteria only. An ACR spans all of WCAG at the chosen level, including everything axe covers, contrast, media alternatives, and manual review of content. This is one input among several. WCAG-EM's five steps — define scope, explore, sample, evaluate, report — are the frame for that larger effort; this tool automates part of steps 3 and 4 for one slice of criteria.

## Out of scope for the first pass

Fixing anything the audit finds. The lightbox `disabled` suspicion, the content-warning disclosure, and the gallery control styling each get their own change once the evidence is in.
