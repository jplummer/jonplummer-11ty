# Mark theming, 404 assets, colophon sketch — design

Date: 2026-08-06  
Status: approved direction; awaiting review of this written spec before implementation

## Goals

1. Header mark follows light/dark using site color tokens, including Safari.
2. ErrorDocument 404 pages load CSS/fonts/favicons at any fake URL (including trailing-slash paths like `/moof/`).
3. Colophon portrait: one transparent PNG (black ink); dark mode via CSS `filter: invert(1)`.

## Non-goals

- Changing OG mark pipeline beyond keeping forced-light rendering.
- Manual theme toggle (site still tracks `prefers-color-scheme` / `light-dark()`).
- Re-commissioning illustration from Rob Ullman.

---

## 1. Header mark — inline SVG + CSS tokens

### Problem

`jp-mark.svg` uses `@media (prefers-color-scheme: dark)` inside an `<img>`. That works in Chrome; Safari/WebKit is unreliable for color-scheme media inside SVG-as-image.

### Approach (1A)

Replace the header `<img class="site-mark">` with an inline SVG (four rects) using `fill="currentColor"`. Style the SVG with `color: var(--text-color)` so ink matches body text from `jonplummer.css`.

### Details

- Markup: keep the home link + `aria-label`; SVG is decorative (`aria-hidden="true"`), same optical sizing via existing `.site-mark` rules (adapt from `img` to `svg` as needed: `display:block`, height calc, `aspect-ratio: 1`, `width: auto`).
- Prefer a small Nunjucks partial (e.g. `_includes/components/site-mark.njk`) included from `base.njk` so the geometry stays one place for the header.
- Keep `src/assets/images/jp-mark.svg` unchanged for OG generation (forced light + data URI). Header no longer loads that file.
- Do **not** rely on Safari-fixed SVG-in-`<img>` theming.

### Testing

- Visual: light and dark — mark matches `--text-color`.
- `pnpm run test html` (and fast suite as usual) after template change.
- Confirm Eleventy image transform does not wrap/rasterize the inline SVG (no `<img>`).

---

## 2. 404 ErrorDocument asset URLs

### Problem

`404.html` is served at arbitrary missing URLs. Relative asset hrefs from `rootRelativePathPrefix` (empty at site root → `assets/css/...`) resolve against the browser URL:

- `/moof` → `/assets/css/...` (works)
- `/moof/` → `/moof/assets/css/...` (breaks)

### Approach

Already drafted locally (uncommitted) in `meta_basic.njk` and `favicons.njk`: when `permalink == "/404.html"`, set `assetPrefix` to `"/"` so hrefs are root-absolute. Other pages keep `rootRelativePathPrefix` for `file://` depth.

### Why it wasn’t live

The change existed only in the working tree — never committed or deployed. Live HTML still has `href="assets/css/jonplummer.css"`.

### Testing

- Assert built `_site/404.html` stylesheet, font preloads, and favicon hrefs start with `/` (or are absolute paths beginning with `/assets` / `/favicon`).
- Manually: `/moof` and `/moof/` both styled after deploy; purge Cloudflare for `404.html` if the edge caches HTML.

---

## 3. Colophon sketch — one transparent PNG + dark invert (3A)

### Problem

`jon-sketch-by-rob-ullman.png` is RGB (no alpha): black ink on opaque white. In dark mode it shows as a white square.

### Approach (3A)

Derive **one** transparent PNG from the current file: knock out near-white → alpha; keep black ink. In dark mode, invert with CSS so ink goes light and transparency stays transparent:

```css
@media (prefers-color-scheme: dark) {
  .colophon-signature img {
    filter: invert(1);
  }
}
```

Markup stays a single `<img>` (no `<picture>`). Revisit with dual assets (former 3B) later if invert quality or ink color needs tighter control.

### Details

- Replace opaque `jon-sketch-by-rob-ullman.png` in place with the transparent RGBA version (same path/filename so `colophon.md` links stay unchanged), or write transparent bytes over that file after verifying. Recoverable from git if needed.
- Derivation: one-off during implementation (threshold knock-out); no permanent `scripts/` tool unless we expect re-runs.
- `eleventy:ignore` on the `<img>` so the image transform does not bake an opaque raster and drop alpha.
- Invert ink is pure white, not `--text-color` — acceptable for a sketch; noted as revisit point.

### Testing

- Visual `/colophon/` light and dark: no white box; ink readable; page background shows through.
- `pnpm run test html` after any markup/CSS change.

---

## Implementation order

1. 404 asset prefix + regression test (unblocks deploy of existing draft).
2. Inline site mark partial + CSS tweak.
3. Derive transparent colophon PNG in place + dark invert CSS.

## Out of scope for this change set

- Committing unrelated dirty files (`craft` post, memory.mdc) unless the user includes them.
- Deploy — only when the user asks.
