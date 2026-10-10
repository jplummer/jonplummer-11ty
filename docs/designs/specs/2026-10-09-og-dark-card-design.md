# OG dark card

**Date:** 2026-10-09
**Supersedes:** [2026-08-06-og-lockup-design.md](2026-08-06-og-lockup-design.md)

## Problem

LinkedIn shows a link's OG image at about 128×72 CSS px – a tenth of its size. The old card was laid out like a page: lockup, 64px title, body-size description and date, all in the top half of a 98%-white field. At feed size the title was about seven points, the description and date were noise, and the white field vanished into LinkedIn's white card.

## Design

One fixed 1200×630 card, built to be read at thumbnail size.

- **Field:** the site's dark-mode content background. The card sets `color-scheme: dark` so the site's `light-dark()` tokens resolve to their dark halves – no copied color values.
- **Label (top):** Libre Franklin in the accent color, the way nav links sit in accent at rest.
  - Post → `Post`, portfolio piece → `Portfolio`, side project → `Side project` (semibold).
  - Every other page → its nav-style path, e.g. `/about`, `/portfolio` (medium weight). The home card is `/`.
- **Title:** Big Shoulders Semibold, hung from a fixed line – the first line's cap height always sits at the same y, and the title grows downward. Sized to fit: starts at 168px and steps down to 96px. If it still doesn't fit, it's cut at a word boundary with an ellipsis, dropping trailing punctuation first. Hyphenated words never break at the hyphen.
- **Byline (bottom):** mark + `JON PLUMMER` in quiet ink. The mark is exactly one cap height tall and sits on the baseline, so its ink matches the flat capitals top and bottom (verified by pixel scan at 400px). Round letters overshoot it by about 1%, as they should.
- **Dropped:** description and date. LinkedIn, Slack, and iMessage print the page title and description beside the image already.

`text-box: trim-both cap alphabetic` pins the label, title, and byline to cap height and baseline. Puppeteer 24's Chrome supports it.

Across the 254 titles at launch: 43 fit at the full 168px, 97 at 140–166px, 32 at 120–138px, and 82 at 96–118px. One truncates: "Confusing terms: globalization, internationalization, translation, localization."

## Scope changes

- **Portfolio pieces and side projects get their own cards.** They used to borrow `portfolio.png` and `sides.png` ("individual portfolio pieces don't need OG images"). Jon reversed that 2026-10-09.
- **Home card restored.** `/assets/images/og/index.png` – the fallback in `base.njk`, used by the home page, paginated indexes, wisdom tag pages, and the style exercise – was deleted in `6e07b6d0` and has 404'd since. The generator now renders it from site data: label `/`, title `site.tagline`.
- **Versioned image path.** Cards live in `/assets/images/og/v2/`. Platforms cache link-preview images by URL, so a new path is what gets the new design into fresh shares. Bump `OG_IMAGE_VERSION` in `scripts/utils/og-image-filename.js` when a redesign should refresh previews; ordinary regenerations keep the path.

## Where things live

- `src/assets/css/og-card.css` – all card styles, scoped to `.og-card`. Inlined by the generator; linked from `/ogimages/` and `/style-exercise/` only. The old `.og-image-rendered` copy is gone from `jonplummer.css`, so visitors no longer download card styles.
- `src/assets/js/og-card-fit.js` – the fit-and-truncate script. Inlined by the generator; loaded as an external file on the two preview pages (the site CSP disallows inline script). It runs on authoring pages only, never on content pages.
- `src/_includes/og-image-body.njk` – card markup, shared by generator and previews. The mark is inline SVG (`fill: currentColor`) so it takes the byline color; its rects must match `jp-mark.svg` (tested).
- `scripts/utils/og-card.js` – which sources get a card, and the label for each. Shared by the generator and the `/ogimages/` gallery sort.

## Tests

- `og-card` (unit): labels per kind, page paths, eligibility; mark geometry matches `jp-mark.svg`; a rendered long title fits its box and ends in an ellipsis.
- `og-images`: now also fails when an `og:image` path doesn't exist in `_site/` – the check that would have caught the missing `index.png`.
- `og-image-filename`, `og-shared-fingerprint`: updated for the versioned directory and the new shared inputs.

## Not changed

LinkedIn keeps whatever image a post had when it was published. New shares get the new card; old posts don't change.
