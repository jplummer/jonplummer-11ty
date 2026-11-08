# Lead figures

Status file for adding figures to essays. The rules for making a figure are in the [lead figure spec](../specs/2026-10-29-lead-figure-style-design.md); this file tracks the work. Updated 2026-11-02.

## Current status

**2026-11-08:** Quality-moves is parked. Jon wasn't happy with where it was going, and it's now the first item under Selected in `docs/ideas.md`. The record below stays as it was so the work can resume from it.

The current post is [Agentic AI doesn't make human interfaces go away](../../../src/_posts/2026/2026-04-20-agentic-ai-doesnt-make-human-interfaces-go-away.md). Jon's framing: the figure isn't that build costs fell and the other costs didn't. It's what that implies. He wants two figures:

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

Seven essays have lead figures, committed in a4d806c5. The eighth, [Quality moves from specification to iteration](../../../src/_posts/2026/2026-06-19-quality-moves.md), is in drafts. No direction has been picked yet.

The latest round has four drafts, F1 to F4. Jon asked for "four of them, radically different!" and hasn't responded to them yet:

- **F1. Target.** Quality is how close a shot lands to the bullseye. Specified takes one shot, and inspection marks the misses with red Xs, but the shot doesn't move. Iterated is a trail of shots that get darker and closer and end on the center. It makes the "inspecting quality in is impossible" point and shows no time.
- **F2. Flowchart.** Both rows run Build → Inspect → Ship. In Specified, Inspect sends work back to Build through red loops. Iterated starts from Prototype, which has its own loop, and passes straight through. It has no time scale. The two rework arrowheads crowd each other.
- **F3. Schedule.** A shared clock, with build starting together. Specified has a dashed spec block with a "?", then a build broken up by red rework, and ships late. Iterated has four prototype blocks that get darker, a short build, one rework, and ships early. This is the closest to Jon's E1 feedback.
- **F4. Fit.** A dashed outline stands for what customers need. Specified is a spec rectangle with grey patches, edged in red, bolted on where it misses. Iterated is the shape redrawn round by round until it fills the outline. In dark mode the growth rings look heavy.

When I showed the four, I suggested picking F1 or F3 and working the other's point into it. Jon hasn't weighed in on that.

The figure work since a4d806c5 is uncommitted: the Figma flattener and the docs for it. See Open tasks.

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
  - Light/Dark frame IDs: three-horizons 1:8/1:9, many-little-diamonds 1:15/1:16, device-spine 1:22/1:23, benefit-concept-detail 1:29/1:30, craft-bottleneck 1:36/1:37, two-systems 1:43/1:44, same-objects 7:7/7:45, coordinated-experience 1:50/1:51.
  - To add a row without the scratch scripts: clone an existing row, rename it, and empty its frames. Then `upload_assets` the flattened SVGs, move the imported layers into the frames, and bind each paint to the Site or Figures variable whose value matches in that frame's mode. The same-objects row was done this way in three `use_figma` calls.
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
