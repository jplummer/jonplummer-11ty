# Colors

Live tokens live in `src/assets/css/jonplummer.css` (`:root` with `light-dark()`). The `/color/` gallery **Default (site)** preset and `src/_data/colorLabSchemes.js` **`default`** key should stay aligned with that file.

## Site palette (revision 2026)

Cool chrome, accent on controls only (neutral masthead, hybrid body links). APCA-tuned OKLCH; `light-dark()` picks light vs dark.

### Light mode

- Background (outer field): `#f1f3f7` — `oklch(96.4% 0.0058 264.53deg)`
- Content background: `#fff`
- Text: `#2a2d32` — `oklch(29.6% 0.01 260.71deg)`
- Text light: `#5c6169` — `oklch(49.1% 0.0142 259.82deg)`
- Border: `#d8dce3` — `oklch(89.3% 0.0105 261.79deg)`
- Link: `#d63d36` — `oklch(58.6% 0.1911 27.41deg)` (APCA-tuned red)
- Link hover: `#b26205` — `oklch(57.7% 0.1348 59.17deg)`
- Link visited: `#4a4f57` — cool grey, `oklch(42.6% 0.0148 259.82deg)`
- Link active: `#0d703f` — `oklch(48.1% 0.1152 154.58deg)`
- End-of-post token (`--token-color`): neutral mix of text + content background (not accent)

### Dark mode

- Background (outer field): `oklch(10% 0.0058 264.53deg)`
- Content background: `oklch(22% 0 0deg)` (extra separation vs outer field)
- Text: `oklch(93% 0.01 260.71deg)`
- Text light: `oklch(78% 0.0142 259.82deg)`
- Border: `oklch(38% 0.0105 261.79deg)`
- Links: lightened accent pair; visited stays cool grey family

### Placement rules (summary)

- **Masthead** (`hgroup`): neutral text; hover → accent
- **Header nav + pagination**: accent at rest; hover → orange-brown
- **Article body links**: body text at rest; visited tint; hover/focus → accent
- **Remaindered links** (`.link-item`): muted row; title accent at rest

See `docs/color-theme-exploration.md` for gallery tooling and APCA workflow.

---

## Historical reference (pre–2026 site default)

The previous live palette was based on **DR10a** (warm green-grey chrome). Kept here for posterity and comparison in the gallery (**DR10a** preset).

### Rams palette swatches

Color ideas inspired by https://www.presentandcorrect.com/blogs/blog/rams-palette and found at https://mcochris.com:

- DR01: #aab7bf, #736356, #bfb1a8, #ad1d1d, #261201
- DR02: #84754a, #3a3124, #96937d, #b9ada4, #0d0000
- DR03: #bf7c2a, #c09c6f, #5f503e, #9c9c9c, #e1e4e1
- DR04: #84764b, #b7b183, #372e2d, #bcb3a6, #dbd7d3
- DR05: #af2e1b, #cc6324, #3b4b59, #bfa07a, #d9c3b0
- DR06: #ed8008, #ed3f1c, #bf1b1b, #736b1e, #d9d2c6
- DR07: #ae2f25, #e15e3e, #315b7b, #292a2e, #50474c
- DR08: #a43f14, #bd7033, #d8a367, #bebab0, #9a9a9a
- DR09: #c5441f, #f07032, #40341f, #8b8178, #d9cab8
- DR10: #0d703f, #f1b73a, #e6423a, #5b4a3b, #d3d8d2

Adjusted for contrast (WCAG AA):

- DR06a: #ed8008, #ed3f1c, #bf1b1b, #736b1e, #dadccf
- DR10a: #0d703f, #d97706, #e6423a, #5b4a3b, #d3d8d2, text: #2a2a2a

### Legacy light mode (DR10a-based)

- Background: #d3d8d2 (DR10 light gray)
- Content background: #fff
- Text: #2a2a2a
- Text light: #5a5a5a
- Border: #d0d0d0
- Link: #d63d36
- Link hover: #b26205
- Link visited: #5b4a3b (DR10 dark brown)
- Link active: #0d703f (DR10 green)

### Legacy dark mode (DR10a-based)

- Background: #1a1a1a
- Content background: #2d2d2d
- Text: #e0e0e0
- Text light: #b0b0b0
- Border: #4a4a4a
- Link: #ff6b6b
- Link hover: #f1b73a
- Link visited: #a89585
- Link active: #2db366
