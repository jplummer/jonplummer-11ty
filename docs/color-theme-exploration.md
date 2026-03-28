# Color theme exploration

## Goal

Generate **many** candidate light/dark palettes (wider than hand-picked “safe” choices), **filter** them with the same APCA mindset as `pnpm run test color-contrast`, then **refine** a shortlist in `src/color-test.njk` and ship **2–4** solid themes in `src/assets/css/jonplummer.css`.

## Baby plan (pipeline)

1. **Wide** — Run the gallery generator (hue sweep, optional monochrome). Output is local HTML + JSON; not deployed.
2. **Pick** — Open `scripts/color-explore/output/index.html` in a browser, note IDs you like in `docs/ideas.md` or a scratch file.
3. **Refine** — Paste values into `/color-test/` custom editor or add a preset; tune by eye.
4. **Ship** — Promote winners to `jonplummer.css` using `light-dark(light, dark)` on each token. Run `pnpm run test color-contrast` and `pnpm run test a11y`.

## Commands

```bash
pnpm run color-gallery
```

Optional flags (see `scripts/color-explore/generate-gallery.js` header comment):

- `--step 30` — Hue step in degrees (default 30 → 12 themes).
- `--random 20` — Instead of a sweep, N random hues.
- `--monochrome` — Force near-zero chroma (grayscale exploration), still APCA-nudged.
- `--include-failed` — Include themes that could not meet minimum Lc after nudging (labeled in the page).

## Outputs

- `scripts/color-explore/output/index.html` — Scrollable gallery. Each theme shows **light and dark** slices of the real home layout (header, nav, post, remaindered link, pagination, footer) using `src/assets/css/jonplummer.css` plus inlined color tokens. Previews **pad** the frame with `--background-color` (same role as `body` on the site) around the `--content-background-color` bands, and show a small **legend** for those two tokens. **Open the file from the repo** so the relative stylesheet link resolves (`../../../src/assets/css/jonplummer.css`).
- `scripts/color-explore/output/themes.json` — Machine-readable token maps for scripting or LLM follow-ups.

The `output/` directory is gitignored.

## What this does *not* do (yet)

- No fetch-from-URL palette extraction.
- No LLM integration (use `themes.json` + your tool of choice).
- No automatic write to `jonplummer.css` (deliberate human gate).

## Related

- `src/color-test.njk` — Interactive refinement.
- `scripts/utils/suggest-colors.js` — One-off APCA nudges for specific failing colors.
- `scripts/test/color-contrast.js` — Authoritative pair checks for the live stylesheet.
