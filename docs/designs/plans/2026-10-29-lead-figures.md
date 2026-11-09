# Lead figures

Status file for adding figures to essays. The rules for making a figure are in the [lead figure spec](../specs/2026-10-29-lead-figure-style-design.md); this file tracks the work. Updated 2026-11-02.

## Current status

**2026-11-08:** Quality-moves is parked. Jon wasn't happy with where it was going, and it's now the first item under Selected in `docs/ideas.md`. The record below stays as it was so the work can resume from it.

The current post is [Agentic AI doesn't make human interfaces go away](../../../src/posts/2026/2026-04-20-agentic-ai-doesnt-make-human-interfaces-go-away.md). Jon's framing: the figure isn't that build costs fell and the other costs didn't. It's what that implies. He wants two figures:

- **Design moves down the stack**, placed with the MCP paragraph ("it moves upstream to the object model…").
- **One foundation, two surfaces**, placed with the API-first paragraph. This one is the `leadFigure`.

Drafts are in `docs/designs/scratch/lead-figures/agentic-drafts/index.html`, with `shot.cjs` for light and dark screenshots.

- **A round (design moves down the stack):** Jon said neither A1 (layer thickness) nor A2 (paired bars) communicated well. Set aside, with no second figure for now.
- **B round:** B2, the left-to-right version, was "pretty good." Jon's statement of the idea: both humans and agents use different tools to understand and manipulate the same objects, and those tools are the only way the humans can understand what the agents are doing and find it correct and comfortable.
- **E round:** Jon prefers E1, the magnifying version. To improve it, the agent's line now splits outside the lens, with the junction at x 780 and the tools moved right, so both branches visibly enter the glass. Jon approved it ("It's good, make it so").
- **Built 2026-11-08 (uncommitted):** `scripts/figures/same-objects.js` generates `src/assets/images/2026/04/same-objects.svg`. The post has `leadFigure` and the image after the API-first paragraph. Its alt text states the figure's point, that the interface is the only way to see what the agent did, because the prose doesn't quite say that. The spec's house-style paragraph and a magnifier rule are updated. `figure-tokens`, `frontmatter`, `markdown`, `spell`, and a full `pnpm run build` pass. `pnpm run flatten-figures same-objects` wrote the light and dark copies. The connecting line uses `mix/ink-45`, the catalog's shared token for connecting lines, rather than a one-off 50% mix. **Figma catalog row added** below two-systems (frames 7:7 Light and 7:45 Dark). The clip path imported as a mask group and the lens stays magnified. All 48 paints are bound to the Site and Figures variables. The six stroke widths are bound to new `same-objects/*` variables in Figure strokes, including `tie-magnified` (5.6) and `go-magnified` (11.2) for the copies under the lens.
- **E round, first pass:** D2 was better. Jon then suggested a magnifying glass, someone looking at the objects. E1 makes the interface a magnifying glass over the changed objects, and everything under the lens is drawn 1.4× larger. E2 is the same glass with nothing enlarged. The handle runs down-left to the "Interface" label.
- **D round:** Jon preferred C1 over C2. In C1, though, the interface's miniature column of objects mirrored the real one, which wrongly suggested a second set, and the empty tools box was misleading. D1 makes the interface a screen listing the objects as rows, and the tools three pills: the active one changes both objects, the other two are idle. D2 drops the interface box and draws the interface as a red window around the changed objects themselves.
- **C round:** C1 draws the objects themselves. The agent's tools and the interface reach the same changed objects, and the interface shows them. C2 adds People and Agents, with a spec barrier ("?") on the direct route, so the interface is the only way to see what the agent did.

Seven essays have lead figures, committed in a4d806c5. The eighth, [Quality moves from specification to iteration](../../../src/posts/2026/2026-06-19-quality-moves.md), is in drafts. No direction has been picked yet.

The latest round has four drafts, F1 to F4. Jon asked for "four of them, radically different!" and hasn't responded to them yet:

- **F1. Target.** Quality is how close a shot lands to the bullseye. Specified takes one shot, and inspection marks the misses with red Xs, but the shot doesn't move. Iterated is a trail of shots that get darker and closer and end on the center. It makes the "inspecting quality in is impossible" point and shows no time.
- **F2. Flowchart.** Both rows run Build → Inspect → Ship. In Specified, Inspect sends work back to Build through red loops. Iterated starts from Prototype, which has its own loop, and passes straight through. It has no time scale. The two rework arrowheads crowd each other.
- **F3. Schedule.** A shared clock, with build starting together. Specified has a dashed spec block with a "?", then a build broken up by red rework, and ships late. Iterated has four prototype blocks that get darker, a short build, one rework, and ships early. This is the closest to Jon's E1 feedback.
- **F4. Fit.** A dashed outline stands for what customers need. Specified is a spec rectangle with grey patches, edged in red, bolted on where it misses. Iterated is the shape redrawn round by round until it fills the outline. In dark mode the growth rings look heavy.

When I showed the four, I suggested picking F1 or F3 and working the other's point into it. Jon hasn't weighed in on that.

The figure work since a4d806c5 is uncommitted: the Figma flattener and the docs for it. See Open tasks.

**Next post (2026-11-08):** [This is what we were waiting for](../../../src/posts/2026/2026-06-15-this-is-what-we-were-waiting-for.md). Jon chose the point "from handoff to hands-on": the designer used to reach the product only through specs, waiting, and tickets, and now works in it directly, with more customer time. Drafts are in `docs/designs/scratch/lead-figures/waiting-drafts/index.html`.

- **G round:** Jon said "Neither of these visibly make any sense." Abstract dots and lines (customers, designer, product) didn't say what was happening at any point. He wants a clear before and after.
- **J3, waiting on Jon:** Jon picked J1 as the winner, and it needs more work, especially in Then. His sequence for Then: value starts with customer contact. Over-tight scope negotiation siphons some off. Then comes a spec, which is handed to engineering, where interpretation and debt siphon more off and some goes to bugs. The rest reaches the product. Some bugs get fixed and reach the product, and the rest go to the backlog, another sink. His sequence for Now: the backlog still exists. Some ideas go from customers to the backlog, some from customers to the prototype, some from the backlog to the prototype, and the prototype nearly all makes it to the product. J3 draws both rows that way, with the row titles above the rows. J1's loops are dropped. Later changes, at Jon's request:
  - Effort bands keep a flat top edge, so it reads as a Sankey.
  - "Scope" became **Negotiation**, and its trace now goes to the backlog.
  - "Interpretation" became **Drift**, the essay's own word, pending Jon's pick. The other options were Misreads and Guesswork.
  - **Bugs** is labeled.
  - Jon asked for smaller labels. Instead of dropping below the 56-unit floor, the Then row was rearranged: one long Backlog pool along the bottom collects Negotiation and the unfixed bugs, and each drain's label sits beside its drop.
  - Jon then asked for both backlogs to be the same size, and for everything to flow right unless it's an obvious loop. Backlog is now a labeled box, the same size in both rows: in Then it's under Product, in Now it's between Customers and Prototype. Every drain peels off the bottom and travels right to its destination. Drift goes to a small dead-end pool out from under Engineering.
  - Jon accepted "Drift." Prototype to Product now narrows slightly ("we'd be lying if we said there were no bugs or drift in there. Just a lot less, hopefully"): a small Drift drain goes to a small pool, and a small Bugs drain's fixes go into Product. He added a missing idea, that UX can act directly on the product to close some backlog items. A strand labeled "Fixes" now runs from Backlog straight to Product, and the backlog's outflow is split between Prototype and Product. Band segments overlap by 1 unit to avoid hairline seams.
  - Jon asked for Drift to be labeled in both rows and for Backlog to be in the same place in both rows. He wasn't sure about the "Fixes" label, which was dropped, and he dropped the "Negotiation" label. Drift now sits under the middle box (Engineering or Prototype), with its label to the right. Backlog sits under the right end of the middle box, beside Product. In Now, the backlog feeds the prototype straight up and the product straight right.
  - Jon asked that the same items be the same shapes wherever possible, including the Sankey bands. He also pointed out that the Bugs label read as belonging to the backlog-bound part, not the fixed part ("This part is tricky!"). Both rows are now drawn from one template, `row()`, so only widths and color differ. Engineering and Prototype are the same width, the Drift pools match, and the parked strand (Negotiation in Then, Customers to Backlog in Now) takes the same route. The bugs now travel as one labeled strand and split only near Product: fixes rise into Product and the rest drop into the Backlog. That moved the Backlog under Product in both rows, so in Now the backlog-to-prototype feed is drawn as the one leftward loop. Boxes are 72 units tall.
  - Jon: "red things need to be things that UX works on – is it really everything?" Not everything. Red is now UX's own work only. In Then, that's Customers → Spec. In Now, it's Customers → Prototype, the backlog-to-prototype loop, and the direct fixes from Backlog into Product. Negotiation and parked ideas, the handoff to Engineering, building from the prototype, Drift, and Bugs are grey. The template takes a `ux` list of segment names.
  - Jon asked for wider UX strands, a partly red prototype band, and clearer direction on the backlog-to-product UX work. In Now, the loop and the direct fixes are 8 wide, and the parked strand is 14 so the widths balance. The band out of the prototype carries a 10-wide red strip along its top, which is UX's share of building. The two UX strands that arrive by loop end in a pointed tip, the figure's only arrowheads. Jon agreed the red strip at about a third of the band is fine, and suggested moving the Backlog a bit left in both rows. It now sits at x 890–1080, which makes the direct fixes leave its right side and turn up into Product. The Bugs label sits just above the bug strand's run.
- **Built 2026-11-08:** Jon said "Make it so. I'm sure I'll want to refine it later." `scripts/figures/handoff-to-hands-on.js` generates `src/assets/images/2026/06/handoff-to-hands-on.svg`. It's placed after the "handoff overhead" paragraph as the `leadFigure`, with alt text stating its point. Boxes are sized from the measured label widths, with about 13 units of padding. The full build passes. The Figma row (frames 8:7 and 8:37) has all paints bound, and its stroke widths are bound to `handoff-to-hands-on/band-*` variables. The spec gained the Sankey, same-shape, and one-meaning-per-color rules.
- **J round:** Jon found H2 interesting, but the loops in the new way of working weren't visible. H1 was interesting too, but he suggested showing designer effort being siphoned off into low-value sinks like the backlog. J1 shows the designer's effort as a line whose width is how much there is. Then, Specs, Waiting, and Backlog drain it into dead-end pools, and a trickle reaches the product. Now, nothing drains: it loops between Customers and Prototype, runs into Product, and loops on Product for fixes. J2 is H2 with the Now loops drawn under the strip.
- **H round:** each draft leans on something readers already know. H1 is a labeled flowchart. H2 is the designer's week as labeled time blocks. H3 has a star for the idea that degrades through Spec and Build and misses its red dashed outline, and arrives intact through a prototype.

**Next post (2026-11-08):** [Designers who ship](../../../src/posts/2026/2026-06-03-designers-who-ship.md). Jon likes two ideas: the translation layer, and range. On range he said "T-shaped is well-trodden ground." He reframed staying in your lane as "Bottleneck, or insufficiently valuable." He wants a diversity of approaches, and likes that "the prototype inherently demonstrates feasibility." Drafts are in `docs/designs/scratch/lead-figures/ship-drafts/index.html`, waiting on Jon:

- **T1, two failures and a fix:** PM's work flows through the designer to engineering. It pinches through the designer (Bottleneck), arcs over the designer (Bypassed), or gains a red stream of the designer's own (Range).
- **T2, three languages, then one:** documents, mockups, and code, with the designer converting between them, against one prototype all three touch.
- **R1, a range map:** territories around Design. Then, the designer's range is a dashed ellipse inside Design. Now, it's a red range that spills into each neighbor.
- **R1, revised:** Jon found R1 the most interesting, but "most designers will protest that they are at least a little bit in strategy, customers, and metrics. it's reaching into these MORE, and reaching into data and code, that add the power we seek." Then (dashed) now reaches a little over the borders into Strategy, Customers, and Metrics, and stops at Data and Code. Now (red) reaches much further into those three, and into Data and Code for the first time. Each range is labeled in place instead of with a legend. Jon then asked to remove "Then" and "Now" and show arrows where the designer's effect grew most. Two red arrows now run from the dashed edge out to the red edge, toward Data and Code. Jon called "prototype as proof of feasibility" (R2) an important idea, but said it "needs a lot of chewing, which we should do AFTER finalizing R1." Fine-tuning: the Then lobe reaches less far into Strategy (reach 50, down from 78). The Now lobes for Code and Data merge into one wide bulge across both, centered on their shared border at 126° with a 52° spread, which Jon called a "uniboob." The `range()` helper takes a bump as `[amplitude, angle, spread]` as well as by territory name. Jon liked the Strategy lobe. The dip in Then between Customers and Metrics was filled with a bump, `between: [45, -18, 22]`, so that edge runs smooth. Jon then asked to pull that stretch back to just past the Y junction where the Customers and Metrics borders meet. Then's bump is now `[28, -18, 22]`. Now extends smoothly from there with its own bump, `[48, -18, 22]`. The Metrics label moved outward to r 286 to clear the red edge, and it sits close to the frame's right edge. Jon clarified the intent: "Basically we're trying to make now a smooth offset from then, with the exception that we go into the joint code and data area more strongly, hence the arrows." Now is defined that way: `now(a) = then(a) + 45 + push(a)`, where `push` is one bump of 75 at 126° with a 52° spread. The arrows run from the dashed edge to the red edge at 100° and 152°. Jon then pulled in Metrics ("I'm starting to express the fantasy designer here"): Then's Metrics reach went from 78 to 52, and Now follows as its offset. The Metrics label is back at r 264 with the others. Jon then suggested Now push strongly into Metrics as well as Code and Data. `push` is now one continuous push across the lower right: Metrics `[55, 18, 32]`, a bridge `[45, 54, 30]`, and Code-and-Data `[75, 126, 52]`, with an arrow into each of the three. To fit the frame, the whole map scales by K = 0.82. Labels sit at r 300, and Metrics at r 332 to clear its arrow. Jon: "we push more into customers too, but the real story is the lower three. At the moment it accidentally looks like metrics gets the lion's share, which is not right." The cause was the map's sideways stretch (sx 1.9): a radial step toward Metrics looked almost twice the same step toward Data. Now is now `then(a) + (45 + 25·customers(a) + 100·lower(a)) / stretch(a)`. `stretch(a)` is the on-page length of one radial unit, which makes the offset and pushes look even. `lower` is a smooth window over Metrics, Data, and Code (full 15°–155°, easing over 50°), and the Customers bump is moderate. Labels are at r 300, with Data at r 326 to clear the red. Jon then asked to push further into Code and keep the curve smooth, with little or no inward bend through Code, Data, and Metrics. Now gains a Code bump (+45 at 150°, 40° spread). From −6° (just past the Metrics side of the Y junction) round to 204° (into Strategy), the red edge is replaced by that stretch's outer convex hull, then smoothed by repeated averaging with its ends pinned. A check finds no inward turns in that stretch. The arrows sit at 14°, 90°, and 150°, and end where their rays meet the drawn edge.
- **R1 built 2026-11-08:** Jon: "I think it's good enough for now!" `scripts/figures/designer-range.js` generates `src/assets/images/2026/06/designer-range.svg`. It follows the "new designer imperative" paragraph that ends "That's different from being asked to do everyone's job," as the `leadFigure`. Its alt text names the map and states the change. The border rays now stop at the frame's edge instead of running to r 900. The other figures regenerate byte-identical, and `figure-tokens`, `frontmatter`, `markdown`, and `spell` pass. **Figma catalog row** added below handoff-to-hands-on (frames 9:7 Light and 9:58 Dark), its 21 paints in each frame bound with none unmatched, and its stroke widths bound to new `designer-range/*` variables (range-now 6, range-then 5, region 4, grow 9). Binding a paint's color to a variable reset the red range's fill opacity to 1, which hid the arrows. It's set back to 0.3.
- **R2:** Jon called the prototype as proof of feasibility "an important idea but that diagram needs a lot of chewing." After two rounds he dropped it (below).
- **P round (R2 angles), 2026-11-08:** R1 committed as 42888aca. Jon asked for one example per angle, now on the drafts page above the first R2 for comparison. P1, when the question gets answered: each row runs from idea to ship, its width the cost of changing course, with red for the stretch where nobody knows whether it works; a diagram's red lasts until Build, a prototype's ends at the start. P2, what gets through: six ideas, two that can't work (red); a diagram passes all six to engineering, and a prototype stops the two. P3, happy path vs. real data: the same four steps, with red edge cases branching off three of them in the prototype row. P4, claimed vs. demonstrated: the diagram's Feasible, Useful, and Convenient in speech bubbles; the prototype's standing on red evidence glyphs (data, a person, a clock).
- **P1 revised:** Jon picked P1 but said "Does it work" floated loose, disembodied over the diagram. The red is how long you're uncertain. The three qualities settle at different times. Useful should come earlier, because a prototype gets better customer contact. Convenient gets an earlier sense from a prototype, but is only proven after launch. Feasible gets an earlier read, because a prototype makes you think through the interaction and the data. Two drafts give each quality its own lane (Useful, Feasible, Convenient) under a Diagram section and a Prototype section, with Build and Ship marked down both. P1b makes width the remaining uncertainty: each lane starts wide and narrows as evidence comes in, so red area is uncertainty over time. P1c keeps P1's cost wedge and colors each lane red (unsure), pale red (a fair sense), then grey (settled).
- **R2 dropped, 2026-11-08:** Jon: "Let's skip this figure entirely." Designers who ship keeps R1 as its only figure. The P-round drafts stay on the scratch page, in case the idea fits another post.

**Next post (2026-11-08):** [The Concept Sprint](../../../src/posts/2026/2026-05-04-concept-sprint.md). Jon: the facilitation-tips post "doesn't really have a good diagram option," but a little process diagram suits the older post: "Immersion. Benefit. Concept. Detail. Test. Plan. Pitch. Something like that?" Drafts are in `docs/designs/scratch/lead-figures/sprint-drafts/index.html`, with `shot.cjs`. In the post, Test and Plan (6a customer validation, 6b implementation planning) run in parallel, and problems and benefits are separate phases.

- **S round:** S1 is a line of stops with labels alternating above and below, Test and Plan side by side, and red on Test, the one stop with customers in the room. S2 shows how many ideas are in play: Immersion widens and Benefit narrows to one, Concept widens and narrows to one, then a red thread (the chosen concept) gains detail, splits into Test and Plan, and rejoins at Pitch. S3 is S2 with Immersion forking into separate Problems and Benefits lobes that meet at the chosen pair.
- **S3 revised:** Jon: "S3 is pretty good but problems precedes benefits. And we're watching for problems during immersion." S4 makes Immersion a pale field, with Problems (above) growing inside it, then clustered and narrowed to one. Benefits (below) comes after and narrows to one. The two meet before Concept. S5 is the same, but Benefits starts faintly during Immersion too, since the post has participants capture both there.
- **D round:** Jon reframed it: "Immersion is a bar. During immersion we uncover problems, then we catalog them and choose the best groups. Following from that we brainstorm benefits, group them, and choose the most valuable and relevant group(s). Then we brainstorm concepts, group them, and select the most feasible and benefit-delivering concept(s). Etc. It's fairly linear, but there are these diamonds." D1 puts a labeled Immersion bar in front on the center line, with the Problems diamond opening from behind it and widest where Immersion ends. Benefits and Concept diamonds follow, joined by short grey links. From the chosen concept, the red thread runs through Detail, splits into Test and Plan, and rejoins at Pitch. D2 puts the bar underneath like a schedule, with a dashed line where Immersion ends.
- **D1 revised (D3):** Jon picked D1 and asked for the diamonds to meet without links, Concept wide but short, and Plan dropped, with the remaining branch looping back to the end of Detail and going on into Pitch. D3 joins the diamonds point to point, flattens Concept, and draws Test as a red loop above the thread that leaves and rejoins it where Detail ends. Jon liked D3 and asked for a circular loop: Test is now a circle (radius 62) sitting on the thread at x 975, run counterclockwise, with an arrowhead heading down its left side.
- **Built 2026-11-09:** Jon: "Go ahead!" `scripts/figures/concept-sprint.js` generates `src/assets/images/2026/05/concept-sprint.svg`. It sits between the intro paragraph and "## Phases" as the `leadFigure`, with alt text that walks the path. The other figures regenerate byte-identical, and `figure-tokens`, `frontmatter`, `markdown`, `spell`, and a full `pnpm run build` pass. **Figma catalog row** added below designer-range (frames 10:7 Light and 10:28 Dark). All 18 paints in each frame are bound, none unmatched: the diamonds to `mix/ink-30`, the red to `link-color`, the labels to `text-color`, and the Immersion bar to a new `concept-sprint/bar` (ink 14%). The stroke widths are bound to new `concept-sprint/diamond` (10) and `concept-sprint/thread` (8) variables.
- **R2, asserted vs. shown:** columns Feasible, Useful, Convenient. A diagram gets three red question marks. A prototype has the Feasible check inside its own box, and Useful and Convenient checked by use.

## Open tasks

1. **Get Jon's read on F1–F4** and iterate on the drafts page until he picks a direction.
2. **Build the quality-moves figure** once it's picked:
   - Write `scripts/figures/<name>.js` and run `pnpm run generate-figures`.
   - In the post, add `leadFigure` and the image. Placement was not decided; the drafts page shows it after the thesis paragraph ("Getting quality right used to mean passing an inspection before we shipped…"). Use an empty alt only if the surrounding text makes the figure's point, with the MD045 disable comment above it.
   - Run `pnpm run test fast`, or at least `figure-tokens`, `frontmatter`, and `markdown`.
   - Add the figure to the spec's house-style paragraph, plus any new rule it established.
3. **Add the figure to the Figma catalog** as a new row. Rows run newest first, so 2026-06-19 goes below two-systems (2026-07-24) and above coordinated-experience (2025-07-27). Steps are in the spec under "Where things live": flatten, import light and dark, bind variables, and add Figures variables for any new mixes. The scripts that built the first bindings are in the scratch folder (see Background).
4. **Commit when Jon asks.** Uncommitted and ready:
   - `scripts/figures/flatten-for-figma.js` (new)
   - `package.json` (`flatten-figures` script)
   - `scripts/figures/generate-figures.js` (skips the flattener)
   - `docs/commands.md` (`flatten-figures` entry)
   - the spec's Figma catalog section
   - this file

   `src/_data/links.yaml` is also modified. That's Jon's link import, and it stays out of the figure commit.
5. **Pick the next post** after quality-moves. Candidates mentioned in conversation: designers-who-ship and concept-sprint. Not ranked.

## Maybe / for later

- **OG card with the lead figure.** Logged in `docs/ideas.md`. Try it once several posts have figures, and test it against diagrams, not only the landscape.
- **Homepage excerpts or page size.** The spec says revisit once five or six essays have figures. There are seven now, and it hasn't been revisited.
- **Generator modules for every figure.** Jon: "fine, we can reconsider later if there's cause to."
- **Older long posts**, after this year's, ranked by traffic.

## Open questions

- **Which quality-moves direction (F1–F4, a mix, or something else)?** Settled when Jon reacts to the drafts.
- **Does the figure need to show both points, that inspection can't add quality and that iterating ships sooner?** F1 shows only the first and F3 mostly the second. Settled by Jon's pick, or by a draft that does both and reads clearly at phone width.
- **Which 2026 essays still get figures, and in what order?** The posts over 700 words without a figure are listed under Background. Some may not be essays (portfolio-like or prototype write-ups), and some may not suit a figure. Settled by Jon going through the list.

## Settled decisions

These are also in the spec unless noted.

- Use only figures that carry the argument. No decorative heroes, stock imagery, or AI illustration.
- Essays only, roughly 700+ words, and only where a figure makes sense. Recent first, then older long posts by traffic.
- A figure goes in the body, not above it. `leadFigure` front matter points at the one figure that stands for the post. Essays only.
- Don't change the homepage or OG cards yet.
- Each figure is a standalone 2:1 SVG (viewBox 1200×600) shown with `<img>`. It's generated by a module, labels are outlined from Big Shoulders 700, and site tokens are copied into each SVG's `<style>`. The `figure-tokens` test catches drift.
- Alt text is a substitute for the image, not a description. If the prose already makes the point, the alt is empty. This is recorded in the spec, in `.agents/rules/web-frontend.mdc`, and in `~/.agents/writing-rules.md`.
- The Figma catalog holds every figure: one row per post, newest first, light and dark side by side, with variables matching the CSS tokens. The repo's SVG is the source of truth.
- Workflow: one post at a time. Draft options on a scratch page, iterate on Jon's feedback, then build.
- Commit only when Jon asks. Don't push or deploy without his say. (Conversation, not spec.)
- For quality-moves, from Jon's feedback (conversation, not spec):
  - The figure must say that inspecting quality in is **impossible**, not just less effective.
  - Quality rises by improving the concept, the left half, not by defending it from the paper cuts it takes during build, the right half.
  - The specified thing's quality is unknown at first.
  - Shoring up quality during build extends the process.
  - The iterated thing is closer to shipping when build begins.
  - When build starts, it should be clear and lined up across both types.
  - Iterated is shorter overall, and its quality starts from a known place.
  - Use one dashed line for Specified's unknown quality, not a fan of them.

## Background

- **What the post argues:** Quality used to come from specification and inspection, a step at the end. Now it comes from iterating before and after shipping. The closing paragraph cites Deming and Drucker against "something inspected in," and says quality is built into the concept, checked early, and improved each time you ship.
- **How the quality-moves drafts got here** (Jon's feedback each round):
  - **B round:** missed that inspecting quality in is impossible.
  - **C round:** same cuts with different starts, concept discs with bites, masses. This led to the framing above.
  - **D round:** D1's wedge was ambiguous and its Y axis unclear. In D2 it wasn't clear that size meant quality.
  - **E round:** E1, a quality-over-time chart, needed a clear build start aligned across both lines, a shorter Iterated with a known starting point, and one dashed line instead of a fan. That revision was shown, then Jon asked for radically different ideas, which became F1–F4.
- **Drafts page**, copied to gitignored scratch so it survives the session:
  - The page is `docs/designs/scratch/lead-figures/quality-moves-drafts/index.html`. Open it directly in a browser; its fonts load from absolute `file://` paths into `src/assets/fonts/lab/`. It shows F1–F4 and then E1.
  - `index-e.html` is the E-round page (E1, E2, D1).
  - `shot.cjs` screenshots each figure in light and dark as `e<N>-light|dark.png`, numbered by position on the page, so `e1`–`e4` are now F1–F4 and `e5` is E1. The `b*.png` files are from an older round.
  - `jscheck.cjs` runs the page script under Node to catch syntax errors.
  - On macOS there's no `timeout`, and `shot.cjs` has hung before. Run it as `(sleep 60; pkill -f shot.cjs) & node shot.cjs`.
- **Figma catalog:** [file ailr6PhPXO0SHSuWdZx31S](https://www.figma.com/design/ailr6PhPXO0SHSuWdZx31S).
  - Light/Dark frame IDs: three-horizons 1:8/1:9, many-little-diamonds 1:15/1:16, device-spine 1:22/1:23, benefit-concept-detail 1:29/1:30, craft-bottleneck 1:36/1:37, two-systems 1:43/1:44, handoff-to-hands-on 8:7/8:37, designer-range 9:7/9:58, same-objects 7:7/7:45, coordinated-experience 1:50/1:51.
  - To add a row without the scratch scripts: clone an existing row, rename it, and empty its frames. Then `upload_assets` the flattened SVGs, move the imported layers into the frames, and bind each paint to the Site or Figures variable whose value matches in that frame's mode. The same-objects row was done this way in three `use_figma` calls. Binding a paint's color resets that paint's opacity to 1, so set a translucent fill's opacity again after binding.
  - Variable collections: Site 3:2, Figures 3:3, Figure strokes 3:4.
  - The first variable bindings came from two one-off scripts, now in `docs/designs/scratch/lead-figures/figma-binding/`. `tokens.js` reads every shape's resolved light and dark color with Puppeteer. `payload.js` names those colors and maps each layer to a variable and stroke width. They use absolute paths and are not part of the repo's tooling.
- **Posts from 2026 over 700 words with no lead figure.** Counts are a raw `wc -w` of the body, so they're approximate:
  - a-conversation-about-religion
  - call-review-console
  - coordinated-experience-prototype
  - invoca-ia-vision
  - agentic-ai-doesnt-make-human-interfaces-go-away
  - data-dictionary-prototype
  - concept-sprint
  - concept-sprint-facilitation-tips
  - designers-who-ship
  - monotasker
  - this-is-what-we-were-waiting-for
  - quality-moves (in progress)
  - simple-is-really
- **Traffic ranking for older posts:** Jon supplied an Ahrefs export, `~/Downloads/https___jonplummer/Pages.csv`. It's what picked Toward coordinated experience (2025).

## Done

- Spec written: `docs/designs/specs/2026-10-29-lead-figure-style-design.md`.
- `leadFigure` front matter, validated in `scripts/test/frontmatter.js`, with an authoring doc entry.
- The `figure-tokens` drift test and `pnpm run generate-figures`.
- Figures for seven essays, in a4d806c5:
  - three-horizons, Teaching a product team to do discovery
  - many-little-diamonds, Many little diamonds
  - device-spine, Arguing with the agent
  - benefit-concept-detail, Prototyping in a regulated environment
  - craft-bottleneck, How do you raise the level of craft?
  - two-systems, The complaints that wouldn't go away
  - coordinated-experience, Toward coordinated experience
- The alt-text rule added to the project rules and `~/.agents/writing-rules.md`.
- Figma catalog built with all seven figures in light and dark. Its colors are tokenized into the Site, Figures, and Figure strokes collections, and the layers are bound to them.
- `pnpm run flatten-figures` and its docs (uncommitted).
- OG-card-with-figure idea logged in `docs/ideas.md`.
- Quality-moves drafts: rounds B through F.
