# Color theme exploration

## Goal

Generate **many** candidate light/dark palettes (wider than hand-picked “safe” choices), **filter** them with the same APCA mindset as `pnpm run test color-contrast`, then **refine** a shortlist (gallery + `**/color/`** for comparison) and ship **2–4** solid themes in `src/assets/css/jonplummer.css`.

## Baby plan (pipeline)

1. **Wide** — Run the gallery generator (default **one hue-reference card** with an in-page **hue rotation** slider, or `--hue-sweep` for a multi-card wheel, or random, optional monochrome). By default it also adds **one Harmony lab card** (recipe dropdown and **hue rotation**, plus **analogous spread** / **split spread** / **harmony skew** only when the selected recipe uses them; lightness/chroma stay from the APCA-nudged build for each recipe), **one Black & white card** (preset `<select>`: Strict / Newsprint / High contrast), **wild** high-chroma recipes (each with rotation), then **five terminal-inspired** palettes. **`themes.json`** still lists nine **`harmony-*`** presets (same CLI tuning / hide-failed rules as other sections). The page groups those under **collapsible section headings** (click to expand/collapse): hue reference → harmony schemes → B&W → wild → terminal. Standalone gallery HTML + JSON live under `scripts/color-explore/output/` (gitignored). The live **`/color/`** page uses a **trimmed embed** (no duplicate title or long generator blurb; flatter section/card chrome via `color-gallery-embed--site` + appended CSS) from `src/_includes/partials/color-gallery-embed-inner.html` and `src/assets/css/color-gallery-embed.css` (`colorGalleryEmbed` in `src/color.njk`). Those files are **rewritten at each Eleventy build** (`runColorGalleryBuild` in `eleventy/config/events.js`); commit them when generator output should change on CI or for review. Use **`pnpm run color-gallery`** for non-default CLI modes and to refresh gitignored **`output/`**. Internally, candidate colors stay **OKLCH objects** (culori) through generation, nudging, and preview. **APCA nudging and pass/fail** use the **sRGB** gamut path (`toGamut('rgb')` + `apca-w3` `sRGBtoY`), matching `pnpm run test color-contrast`. Each card badge and each `themes.json` entry also reports **minimum Lc on a Display P3** gamut map (`toGamut('p3')` + `displayP3toY`) as **`worstLcP3`**, alongside **`worstLcSrgb`**. JSON/HTML export remains **`oklch(...)` strings** (`themes.json` still lists **three** B&W presets by id: `bw-strict`, `bw-paper`, `bw-contrast`, plus `harmony-*` ids). On the **Harmony lab**, **Copy tokens** updates with the live controls; other cards: preview sliders only change **inline** styles unless noted. Rotating **H** at fixed **L** and **C** in OKLCH usually keeps APCA in the same ballpark, but **relative luminance in sRGB** shifts slightly with hue, so it is **not** a strict guarantee the build’s Lc floor holds at every angle—spot-check if that matters.
2. **Pick** — Open `scripts/color-explore/output/index.html` in a browser; note candidate IDs in a scratch file or try them in `/color/` (see [Companion tooling](#companion-tooling) below).
3. **Refine** — Paste tokens from the gallery or `themes.json` into `jonplummer.css` and tune by eye. In-page custom hex pickers are tracked in `docs/ideas.md` (not shipped yet).
4. **Ship** — Promote winners to `jonplummer.css` using `light-dark(light, dark)` on each token. Run `pnpm run test color-contrast` and `pnpm run test a11y`.

## Commands

```bash
pnpm run color-gallery
```

After changing the generator, run **`pnpm run build`** (or `dev`) to refresh the live embed; run **`pnpm run color-gallery`** again when you want gitignored **`output/index.html`** / **`themes.json`** or non-default flags. `output/index.html` is gitignored, so an old file on disk will look unchanged until you regenerate (hard-refresh optional).

Gallery **theme cards** use `<section class="card">`, not `<article>`, so `jonplummer.css`’s post grid (`1fr 2fr`) does not eat the light/dark row.

Optional flags (see `scripts/color-explore/generate-gallery.js` header comment):

- `--hue-sweep` — Emit multiple hue cards (spacing from `--step`) instead of one reference card + slider.
- `--step 30` — With `--hue-sweep`, degrees between cards (default 30 → 12 themes).
- `--base-hue 0` — Starting hue for the single reference card when not using `--hue-sweep` or `--random` (default 0).
- `--random 20` — Instead of the reference card / sweep, N random hues (extras still apply unless `--no-extras`).
- `--monochrome` — Force near-zero chroma on the sweep/random pack, still APCA-nudged.
- `--no-extras` — Skip harmony schemes, B&W combo, wild pack, and terminal-inspired themes (only the hue sweep / random / mono set).
- `--wild 12` — How many wild themes to add (default 8; use `--wild 0` to omit wild cards when extras are on). Each card picks one of **ten** high-chroma recipes in rotation (complementary, neon dark, triadic links, candy wash, clash, voltage, spectral rim, saltwater taffy, bruise, lasergrid) — all solid `oklch()` tokens for APCA nudging and export.
- `--include-failed` — Include themes that could not meet minimum Lc after nudging (labeled in the page).
- `--analogous-spread 28` — Degrees from base for **adjacent (analogous)** link hues (clamped 6–55). Wider = more separation on the wheel.
- `--split-spread 28` — Degrees **split complementary** arms sit **before/after** true complement (180° ± spread; clamped 12–48). Larger = arms farther from red–green opposition.
- `--harmony-skew 12` — How far **skewed triadic**, **skewed tetradic**, and **skewed split complementary** pull off perfect angles (clamped 0–40). `0` makes skewed triadic match triadic; higher = closer to monochromatic on those recipes.

`themes.json` includes a `harmonyTuning` object (when extras are on) with the **applied** values after clamping, so exports stay reproducible.

## Outputs

- `scripts/color-explore/output/index.html` — Scrollable gallery with **collapsible sections** (`<details>`): hue reference, **harmony schemes** (one **Harmony lab** card), black & white, wild, terminal-inspired. Each theme shows **light and dark** slices of the real home layout (header, nav, post, remaindered link, pagination, footer) using `src/assets/css/jonplummer.css` plus inlined color tokens. **Hue reference** and **wild** cards include **Preview hue rotation**. The **Harmony lab** combines recipe choice, hue rotation, contextual angle sliders, and **Copy tokens** that tracks the preview. The **B&W** and **DR** combo cards use a **preset `<select>`**; **Copy tokens** updates with the selection. **Copy tokens** expands to the same `**:root` block shape** as `jonplummer.css` (`color-scheme`, `light-dark(oklch(L% C Hdeg), …)` per variable). Previews **pad** the frame with `--background-color` around the `--content-background-color` bands, with a small **legend** for those tokens. **Open the file from the repo** so the relative stylesheet link resolves (`../../../src/assets/css/jonplummer.css`). The page header links to the **font stack output**, `**/type/`**, `**/color/**`, and `**/ogimages/**` (see generated HTML meta line).
- `scripts/color-explore/output/themes.json` — Token maps with `**oklch(L C H)**` strings (L 0–1, C chroma, H degrees) for machine use — same numeric values as the gallery, but not the same string shape as the in-page **Copy tokens** snippet (which uses `**oklch(L% … Hdeg)`** + `light-dark(...)` like `jonplummer.css`). Each theme includes `**worstLcSrgb**` and `**worstLcP3**` (minimum Lc across the same pairs as the contrast test). Top-level `**apcaDual**` explains the two pipelines. When harmony schemes are generated, includes `**harmonyTuning**` (`analogousSpread`, `splitSpread`, `harmonySkew`).

The `output/` directory is gitignored.

## Terminal / IDE palettes worth mining

Existing gallery presets: Solarized, Gruvbox, Dracula, Nord, Toothpaste. Other widely reused themes (check each project’s license / attribution before shipping):

- **Catppuccin** — latte / frappe / macchiato / mocha variants.
- **Tokyo Night** — Storm / Night / Day.
- **Rosé Pine** — dawn / moon / main.
- **Everforest** — soft/medium/hard, light and dark.
- **Night Owl** and **Light Owl** (Sarah Drasner).
- **One Dark** (Atom) / **One Light**.
- **Material** / **Palenight** (community Material themes).
- **GitHub** light and dark (VS Code / Primer).
- **Monokai** / **Monokai Pro**, **Zenburn**, **Jellybeans**, **Andromeda**.
- **Alacritty** / **Windows Terminal** canned schemes (Campbell, Solarized, etc.).

Good sources of hex tables: official theme repos, [terminal.sexy](https://terminal.sexy) exports, and editor theme JSON. Map accent hues to link tokens and keep APCA nudging on import.

## What this does *not* do (yet)

- No fetch-from-URL palette extraction.
- No LLM integration (use `themes.json` + your tool of choice).
- No automatic write to `jonplummer.css` (deliberate human gate).

## Companion tooling

These sit alongside the gallery; pnpm shortcuts also appear under **Maintenance** in [commands.md](commands.md).


| What                      | How                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Theme gallery**         | `pnpm run color-gallery` → `scripts/color-explore/output/` (this doc, [Commands](commands.md)).                                                                                                                                                                                                                                                                                                                                                                                            |
| **Live color gallery**    | `src/color.njk` + embed partial + scoped CSS — run `pnpm run dev` or `pnpm run build`, open `**/color/`**. Embed markup/CSS are produced during **`eleventy.before`** (same defaults as `pnpm run color-gallery` with no flags). Gallery **page chrome** uses the same **design tokens** as the rest of the site. Commit the two `src/…` embed files when you change the generator and want that diff in git / CI. |
| **Suggest colors script** | `node scripts/utils/suggest-colors.js` — small standalone APCA helper (hardcoded sample pairs in the file; edit for your background/foregrounds). Not registered in `package.json`.                                                                                                                                                                                                                                                                                                        |
| **Contrast test**         | `pnpm run test color-contrast` — reads `light-dark()` pairs from `src/assets/css/jonplummer.css` (hex or `oklch()`); **sRGB** gamut path gates pass/fail; **Display P3** path adds context and warnings. See [tests.md](tests.md).                                                                                                                                                                                                                                                         |


## Related

- `src/assets/css/jonplummer.css` — Production tokens to ship winners into.
- `scripts/test/color-contrast.js` — Implementation of the contrast check above.
- `scripts/utils/apca-dual.js` — Shared sRGB vs Display P3 APCA Lc helpers (gallery + test).
- [Font stack exploration](font-stack-exploration.md) — sibling workflow for type (`pnpm run font-gallery`).

