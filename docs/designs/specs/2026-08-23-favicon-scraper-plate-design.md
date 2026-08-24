# Favicon scraper plate

**Date:** 2026-08-23  
**Status:** approved (approach A)

## Problem

Third-party blogrolls fetch a raster (`/favicon.ico` or `apple-touch-icon.png`) and show it as `<img>`. `icon.svg` already themes with `prefers-color-scheme`; that never runs on a cached bitmap. The current apple-touch PNG is a dark mark on black, so the mark disappears on dark pages.

## Goals

1. Scrapers get a dark mark on a light content-sheet field (`oklch(98% 0 0deg)` ≈ `#fafafa`).
2. This site’s tab icon and header mark stay as they are.

## Non-goals

- Changing `icon.svg`, `site-mark.njk`, OG mark, or `favicons.njk`.
- Rounded badge / transparent-corner tile (iOS fills apple-touch transparency with black; 32px rounding is mush).
- Making someone else’s `<img>` follow *their* color scheme.

## Approach

**Plate the rasters only.** Full-bleed square field, same bar geometry as `icon.svg` (50-unit inset in a 600 viewBox), mark `#2a2d32`.

| File | Role |
|---|---|
| `src/assets/images/icon.svg` | Unchanged. Browser tabs. |
| `src/assets/images/icon-raster.svg` | Source for rasters only; not linked in HTML. |
| `src/assets/images/apple-touch-icon.png` | 180×180 plated. |
| `src/favicon.ico` | Plated; include 32×32 (matches `sizes="32x32"`) and 256×256 (current ico size, sharper when a scraper displays ~46px). |

Regenerate with `pnpm run generate-favicon-rasters`.

## Caveat

Old Safari that ignores SVG favicons may show the light square in this site’s tab. Current Safari / Chrome / Firefox should keep using `icon.svg`.
