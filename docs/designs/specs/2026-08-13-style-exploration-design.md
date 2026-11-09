# One style-exploration tool

Filed in `docs/ideas.md` on 2026-08-13 and moved here on 2026-11-08, when the entry outgrew a bullet. Nothing is built yet. This is the discussion so far, not a finished spec.

## The idea

Draw the separate labs into one tool: selectors and generators for type, spacing, and color scheme (and whatever else earns a slot), all feeding one realistic preview of the actual site instead of a facsimile per lab.

## What exists today

Three unrelated pipelines:

- `scripts/color-explore/generate-gallery.js` builds the `/color/` embed: hue reference, DR presets, a harmony lab with an APCA nudge, and B&W, wild, and terminal combo cards.
- `scripts/font-explore/generate-font-gallery.js` and `/assets/js/font-lab-card.js` sit behind `/type/`.
- `scripts/utils/preview-site-lockup.js` is the build-time lockup facsimile both mini-previews share.

Spacing has no selector or generator yet, so that part is new work rather than consolidation.

The realistic preview is the old full-page rehearsal idea. `src/style-exercise.njk` is its ancestor and shows the shape: scoped tokens applied to a real page. It's listed in `.eleventyignore`, and `/style-exercise/` 301s to `/color/`. That page, `src/assets/css/style-exercise.css`, and `src/assets/js/color-lab.js` are cruft today (the page isn't built, nothing else loads the other two, and the sibling nav they used is gone), but they're the closest thing to the preview this tool wants. They were kept on purpose on 2026-09-04: reuse or delete them when the consolidation lands, not before.

## Constraints

- `/color/` and `/type/` keep working in their current public form throughout. The new tool is additive until the day it replaces them.
- Don't restructure `generate-gallery.js` before this lands (extracting its ~470-line runtime string literal, splitting it into modules). That reorganizes something slated for redesign and pays twice.
- Fix the harmony recipe table that's duplicated between build and runtime (`buildHarmonySchemes` / `pair()` vs. runtime `linkDeltas`) only if the drift bites first.
- Moving the gallery build out of `eleventy.before` was considered and dropped on 2026-11-08 (see Decided in `ideas.md`). Revisit that wiring as part of this tool.

## Settled along the way

Folded in from older ideas entries on 2026-11-07:

- The preview is a dedicated exercise page that stresses the site's tokens and type, not one real post stretched to cover everything.
- Browse thumbnails start as text plus swatches, with live mini-previews only if they stay cheap.
- Paths stay top-level (`/color/`, `/type/`, `/ogimages/`), with no `/labs/` prefix.
- SEO expectations are relaxed, but an intentional visitor must never hit a 404, so the build makes sure the artifacts exist or the page says plainly what's missing.

## Open questions

- Canonical scheme IDs shared across generators, exports, and preview URLs.
- Whether scheme tweaks are author-only (edit data, redeploy) or visitor-editable with persistence. That's out of scope until this area stabilizes; revisit once the browse and pop-out story exists.
- On the color side: apply the three-color preview placement rules to every gallery card, not only Default site.

## Background

Three complexity audits from 2026-08-13 each put this at the top: `docs/designs/scratch/complexity-grok4.6.md` (item 1), `complexity-opus5.md` (Tier 3), and `complexity-composer2.5.md` (item 1). `scratch/` is gitignored, so they exist only on Jon's machine.
