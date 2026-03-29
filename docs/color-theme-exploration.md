# Color theme exploration

## Goal

Generate **many** candidate light/dark palettes (wider than hand-picked “safe” choices), **filter** them with the same APCA mindset as `pnpm run test color-contrast`, then **refine** a shortlist in `src/color-test.njk` and ship **2–4** solid themes in `src/assets/css/jonplummer.css`.

## Baby plan (pipeline)

1. **Wide** — Run the gallery generator (default **one hue-reference card** with an in-page **hue rotation** slider, or `--hue-sweep` for a multi-card wheel, or random, optional monochrome). By default it also adds **one Harmony lab card** (recipe dropdown and **hue rotation**, plus **analogous spread** / **split spread** / **harmony skew** only when the selected recipe uses them; lightness/chroma stay from the APCA-nudged build for each recipe), **one Black & white card** (radios: Strict / Newsprint / High contrast), **wild** high-chroma recipes (each with rotation), then **five terminal-inspired** palettes. **`themes.json` still lists nine `harmony-*` presets** (same CLI tuning / hide-failed rules as other sections). The page groups those under **collapsible section headings** (click to expand/collapse): hue reference → harmony schemes → B&W → wild → terminal. Output is local HTML + JSON; not deployed. Internally, candidate colors stay **OKLCH objects** (culori) through generation, nudging, and preview; **APCA** still uses **sRGB-gamut–mapped hex** (`culori` `toGamut('rgb')`) because `apca-w3` expects that. JSON/HTML export remains **`oklch(...)` strings** (`themes.json` still lists **three** B&W presets by id: `bw-strict`, `bw-paper`, `bw-contrast`, plus `harmony-*` ids). On the **Harmony lab**, **Copy tokens** updates with the live controls; other cards: preview sliders only change **inline** styles unless noted. Rotating **H** at fixed **L** and **C** in OKLCH usually keeps APCA in the same ballpark, but **relative luminance in sRGB** shifts slightly with hue, so it is **not** a strict guarantee the build’s Lc floor holds at every angle—spot-check if that matters.
2. **Pick** — Open `scripts/color-explore/output/index.html` in a browser; note candidate IDs in a scratch file or try them in `/color-test/` (see [Companion tooling](#companion-tooling) below).
3. **Refine** — Paste values into `/color-test/` custom editor or add a preset; tune by eye.
4. **Ship** — Promote winners to `jonplummer.css` using `light-dark(light, dark)` on each token. Run `pnpm run test color-contrast` and `pnpm run test a11y`.

## Commands

```bash
pnpm run color-gallery
```

After changing the generator, run that again — `output/index.html` is gitignored, so an old file in the browser will look unchanged until you regenerate (hard-refresh optional).

Gallery **theme cards** use `<section class="card">`, not `<article>`, so `jonplummer.css`’s post grid (`1fr 2fr`) does not eat the light/dark row.

Optional flags (see `scripts/color-explore/generate-gallery.js` header comment):

- `--hue-sweep` — Emit multiple hue cards (spacing from `--step`) instead of one reference card + slider.
- `--step 30` — With `--hue-sweep`, degrees between cards (default 30 → 12 themes).
- `--base-hue 0` — Starting hue for the single reference card when not using `--hue-sweep` or `--random` (default 0).
- `--random 20` — Instead of the reference card / sweep, N random hues (extras still apply unless `--no-extras`).
- `--monochrome` — Force near-zero chroma on the sweep/random pack, still APCA-nudged.
- `--no-extras` — Skip harmony schemes, B&W combo, wild pack, and terminal-inspired themes (only the hue sweep / random / mono set).
- `--wild 12` — How many wild themes to add (default 8; use `--wild 0` to omit wild cards when extras are on).
- `--include-failed` — Include themes that could not meet minimum Lc after nudging (labeled in the page).
- `--analogous-spread 28` — Degrees from base for **adjacent (analogous)** link hues (clamped 6–55). Wider = more separation on the wheel.
- `--split-spread 28` — Degrees **split complementary** arms sit **before/after** true complement (180° ± spread; clamped 12–48). Larger = arms farther from red–green opposition.
- `--harmony-skew 12` — How far **skewed triadic**, **skewed tetradic**, and **skewed split complementary** pull off perfect angles (clamped 0–40). `0` makes skewed triadic match triadic; higher = closer to monochromatic on those recipes.

`themes.json` includes a `harmonyTuning` object (when extras are on) with the **applied** values after clamping, so exports stay reproducible.

## Outputs

- `scripts/color-explore/output/index.html` — Scrollable gallery with **collapsible sections** (`<details>`): hue reference, **harmony schemes** (one **Harmony lab** card), black & white, wild, terminal-inspired. Each theme shows **light and dark** slices of the real home layout (header, nav, post, remaindered link, pagination, footer) using `src/assets/css/jonplummer.css` plus inlined color tokens. **Hue reference** and **wild** cards include **Preview hue rotation**. The **Harmony lab** combines recipe choice, hue rotation, contextual angle sliders, and **Copy tokens** that tracks the preview. The **B&W** card uses **radios** to swap presets; **Copy tokens** updates with the selection. Previews **pad** the frame with `--background-color` around the `--content-background-color` bands, with a small **legend** for those tokens. **Open the file from the repo** so the relative stylesheet link resolves (`../../../src/assets/css/jonplummer.css`).
- `scripts/color-explore/output/themes.json` — Token maps with **`oklch(L C H)`** strings (L 0–1, C chroma, H degrees), same as the gallery “Copy tokens” block — paste into `:root` or `light-dark(..., ...)` in modern browsers ([baseline `oklch()`](https://caniuse.com/css-oklch)). When harmony schemes are generated, includes **`harmonyTuning`** (`analogousSpread`, `splitSpread`, `harmonySkew`).

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

| What | How |
|------|-----|
| **Theme gallery** | `pnpm run color-gallery` → `scripts/color-explore/output/` (this doc, [Commands](commands.md)). |
| **Color test page** | `src/color-test.njk` — run `pnpm run dev` or `pnpm run build`, open **`/color-test/`**. Twelve presets, custom color inputs, dev-only (not deployed). Paste tokens from the gallery or `themes.json` before promoting to `jonplummer.css`. |
| **Suggest colors script** | `node scripts/utils/suggest-colors.js` — small standalone APCA helper (hardcoded sample pairs in the file; edit for your background/foregrounds). Not registered in `package.json`. |
| **Contrast test** | `pnpm run test color-contrast` — reads `light-dark()` pairs from `src/assets/css/jonplummer.css` (hex or `oklch()`), converts via culori for APCA. See [tests.md](tests.md) for the fast-test list. |

## Related

- `src/assets/css/jonplummer.css` — Production tokens to ship winners into.
- `scripts/test/color-contrast.js` — Implementation of the contrast check above.
- [Font stack exploration](font-stack-exploration.md) — sibling workflow for type (`pnpm run font-gallery`).
