# Header lockup (mark + Semibold logotype)

**Date:** 2026-08-06

## Problem

The site header is author name + tagline only, set in Thin uppercase Big Shoulders at `--font-size-3xl`. There is no mark in the masthead. A ready JP bar mark and a tighter Semibold logotype treatment are defined for the live header.

## Goals

- Show the JP mark beside the title stack in the site header.
- Switch the logotype to Semibold at a dedicated size (`2.25rem` / 36px), normal tracking, `line-height: 1`.
- Keep two home links (mark and title) so each has a full click target; leave the tagline unlinked.
- Keep mark `alt=""` so assistive tech does not duplicate the adjacent `h1`.

## Non-goals

- OG image header styling (`.og-hgroup`) — revisit after the live header looks right.
- Favicon / apple-touch updates — leave current assets.
- Changing `critical.njk` (it only sets `font-family` on titles).
- Inlining the SVG or wiring it to CSS color tokens (the file already themes via `prefers-color-scheme`).

## Approach

**Approach A (chosen):** Apply the drop-in implementation literally — shared `hgroup h1` / `hgroup` rules, not scoped to `body > header`. Utility pages that reuse `hgroup` (color gallery, masthead preview, font lab) will inherit the new logotype weight and size. That is acceptable brand consistency for this pass; scope tighter later only if a tool preview looks wrong.

Rejected: scoped selectors only (B); inline SVG for token theming (C).

## Files

| Path | Change |
|---|---|
| `src/assets/images/jp-mark.svg` | Add — tight viewBox to ink (`50 50 500 500`); light `#2a2a2a` / dark `#e0e0e0` fills |
| `src/_includes/base.njk` | `.site-lockup` wrapping mark link + `hgroup` (h1 + tagline only — valid hgroup content) |
| `src/assets/css/jonplummer.css` | `--font-size-logotype`; split `header` / `hgroup` layout; logotype + stack spacing |

Source asset (outside repo, approved for use as-is):

`/Users/jonplummer/Documents/Claude/Projects/Online presence improvement project/jp-mark.svg`

## Markup

```html
<header>
    <a class="skip" href="#main">Skip to content</a>
    <div class="site-lockup">
        <a href="/" rel="home" class="site-mark-link" aria-label="{{ site.author }} home">
            <img class="site-mark" src="/assets/images/jp-mark.svg" alt="" width="52" height="52" eleventy:ignore>
        </a>
        <hgroup>
            <h1><a href="/" rel="home">{{ site.author }}</a></h1>
            <p>{{ site.tagline }}</p>
        </hgroup>
    </div>
    {% include "components/nav.njk" %}
</header>
```

Mark link uses `aria-label` (decorative `alt=""`) so WCAG H30 is satisfied without duplicating the adjacent h1 for screen readers. `hgroup` only contains heading + `p` (html-validate content model).
## CSS summary

- Token: `--font-size-logotype: 2.25rem` near other `--font-size-*` (deliberately off the modular scale).
- Optical lockup tokens (literals, not live `±1px` calcs) — cap→baseline across two fonts + `<img>` isn’t native CSS layout:
  - `--site-lockup-stack-gap: 6.2px` — space between logotype and tagline
  - `--site-lockup-cap-nudge: 2.2px` — mark top below h1 em top (Big Shoulders capital ink)
  - `--site-lockup-inline-nudge: 3px` — `margin-inline-start` on `.site-lockup` vs main column
  - `--site-lockup-tagline-ascent: 0.9375` — Public Sans italic ascent/em for baseline math in mark height
  - **Units decision (2026-08-11):** leave these as `px`. Full-page browser zoom scales CSS `px` with `rem`, so the tuned lockup stays proportional under Cmd/Ctrl +/-. Mixing `px` nudges with `rem` type looks fragile on paper but is not a browser-zoom bug. Real drift only if root font-size changes (user default text / text-only zoom) while nudges stay absolute — low priority; revisit `rem` later if that matters.
- `hgroup`: flex baseline (galleries / other uses); **`.site-lockup`** is the header flex row (mark + title stack).
- `.site-lockup hgroup { display: block }` so logotype stacks above tagline.
- `.site-mark-link` / `.site-mark`: block; mark link `flex-shrink: 0` + `aria-label`; mark sized so ink top ≈ logotype capital ink and ink bottom ≈ tagline alphabetic baseline.
- Mark `<img>` must include **`eleventy:ignore`** so the image transform does not rasterize the SVG (would drop `prefers-color-scheme` fills).
- SVG `viewBox="50 50 500 500"` — tight to bar ink (no padding).
- `hgroup h1`: display family, logotype size, `line-height: 1`, Semibold, uppercase, normal letter-spacing.
- Tagline: `.site-lockup hgroup p { margin-top: var(--site-lockup-stack-gap) }`.
- Leave `hgroup h1 a:any-link` / hover-focus rules alone.

## Verification

With `pnpm run dev` running, confirm visually: mark + Semibold name stack, light and dark schemes, mark and title both navigate home.

Automated: `pnpm run test css`, `pnpm run test frontmatter`; optionally `pnpm run test a11y`.

## Follow-ups (not this change)

- Align OG `.og-hgroup` with the settled live header.
- Favicons from the mark if desired later.
- Optional: convert optical nudge tokens from `px` → `rem` if root-font-size / text-only zoom tracking becomes worth the re-tune (see Future in `docs/ideas.md`).
