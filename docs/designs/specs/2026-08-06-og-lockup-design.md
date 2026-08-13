# OG image lockup (mark + Semibold wordmark)

**Date:** 2026-08-06

## Goal

Replace the OG masthead (Thin author + tagline) with mark + Semibold wordmark, no tagline — same brand signal as the live header, scaled for 1200×630.

## Complexity ceiling

Stay as simple as the current OG setup: one body partial, two style surfaces (`og-image.njk` + `.og-image-rendered`). Do **not** reuse live-header optical tokens (`--site-lockup-*`).

## Proportions

Live: logotype `2.25rem` / article `h1` `2.5rem` = **0.9**.  
OG title stays `3.5rem` → OG wordmark **`3.15rem`** Semibold, `line-height: 1`, normal tracking, uppercase.

## Markup (`og-image-body.njk`)

```html
<div class="og-hgroup">
  <img class="og-mark" src="/assets/images/jp-mark.svg" alt="" width="50" height="50" eleventy:ignore>
  <div class="og-logotype"><a href="/">{{ site.author }}</a></div>
</div>
```

## CSS (both surfaces)

- `.og-hgroup`: flex, `align-items: center`, gap; font-size `3.15rem` so mark `height: 1em` matches the wordmark line.
- `.og-mark`: `height: 1cap` (cap height of the hgroup logotype face); `width: auto`; `flex-shrink: 0`.
- `.og-logotype`: inherits size/weight from hgroup (or explicit Semibold uppercase).
- Drop tagline rules.
- `color-scheme: light` on OG root so `jp-mark.svg` uses its light fill under forced-light OG chrome.

## Out of scope until preview is approved

- Regenerating PNG files: `generate-og-images.js` embeds the mark as a **data URI** (Puppeteer `setContent` fails `file://` `<img>` loads — `naturalWidth` 0). `/ogimages/` preview keeps `/assets/images/jp-mark.svg`. Also `emulateMediaFeatures` light for SVG fills.
