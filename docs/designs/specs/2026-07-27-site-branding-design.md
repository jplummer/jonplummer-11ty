# Site branding (author + tagline)

**Date:** 2026-07-27

## Problem

The site author name and tagline were duplicated across templates, feeds, schema, OG markup, and color/font gallery generators. Changing the tagline required a multi-file hunt and was easy to miss (e.g. live masthead vs titles).

## Goals

- Store author and tagline once.
- Derive the common compound title in that same place.
- Each consumer asks for one field; never concatenate author + tagline locally.
- Drop the unused colon compound form.

## Non-goals

- Factoring narrative prose on `/about/` that happens to echo the tagline.
- Changing `package.json` `author` (not template-driven).
- A generic separator formatter API.

## Data shape

In `src/_data/site.js`:

- `author` — `Jon Plummer` (stored)
- `tagline` — `Making ideas tangible` (stored)
- `title` — `${author} – ${tagline}` (derived only)

Existing `domain` / `url` unchanged.

## Colon form

Audit found `Jon Plummer: {tagline}` only on three RSS `<link rel="alternate" title>` attributes. Not required by RSS/browsers; used to avoid a second en dash. **Dropped** in favor of `Posts – {{ site.title }}` (and the same for Links / Collected wisdom).

## Consumers

| Need | Field |
|---|---|
| Masthead / OG / gallery name | `site.author` |
| Masthead / OG / gallery tagline | `site.tagline` |
| Default document title, schema WebSite name, index title | `site.title` |
| Feed alternate link titles | prefix + `site.title` |
| Pagination titles | date range + `site.title` |
| RSS channel description lead | `site.tagline` |
| article:author, schema Person name, license | `site.author` |

Node generators call `require('…/site.js')()` so they share the same module as Eleventy. `generate-og-images.js` passes `site` into the Nunjucks render context; `/ogimages/` `renderFile` calls must pass `site: site` because RenderPlugin does not inherit page globals. `site.js` is in `OG_SHARED_DEPS` so tagline changes regenerate PNGs.

## Testing

Unit test asserts `title === `${author} – ${tagline}`` and that key templates/scripts do not hardcode the tagline or compound title (except `site.js` itself and generated embed HTML that is produced from the generators).
