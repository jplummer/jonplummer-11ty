#!/usr/bin/env node
/**
 * OKLCH-based theme candidates + APCA nudging → static HTML gallery + themes.json
 * (Dual APCA: min Lc after sRGB gamut vs Display P3 gamut — see scripts/utils/apca-dual.js.)
 *
 * Usage:
 *   node scripts/color-explore/generate-gallery.js
 *   node scripts/color-explore/generate-gallery.js --hue-sweep --step 30   (multi-card wheel; default is one reference card + in-page hue slider)
 *   node scripts/color-explore/generate-gallery.js --base-hue 120
 *   node scripts/color-explore/generate-gallery.js --random 24
 *   node scripts/color-explore/generate-gallery.js --monochrome
 *   node scripts/color-explore/generate-gallery.js --include-failed
 *   node scripts/color-explore/generate-gallery.js --no-extras   (hue sweep / random / mono only)
 *   node scripts/color-explore/generate-gallery.js --wild 12   (wild pack: one card + scheme select; 10 recipe families)
 *   node scripts/color-explore/generate-gallery.js --analogous-spread 36 --split-spread 32 --harmony-skew 8
 *   (Harmony: one “Harmony lab” card in HTML; themes.json still has one entry per recipe.)
 *
 * See docs/color-theme-exploration.md
 *
 * Live `/color/` embed (`src/_includes/partials/color-gallery-embed-inner.html` +
 * `src/assets/css/color-gallery-embed.css`) is refreshed at each Eleventy build via
 * `runColorGalleryBuild()` from `eleventy/config/events.js` (default options = this CLI with no flags).
 * Keep `pnpm run color-gallery` for CLI flags and gitignored `scripts/color-explore/output/`.
 */

const fs = require('fs');
const path = require('path');
const { buildTerminalPresetThemes } = require('./terminal-presets.js');
const { absApcaLcSrgb, absApcaLcP3 } = require('../utils/apca-dual');
const { parse, converter } = require('culori');

const toOklch = converter('oklch');

/** Scoped CSS for `/color/` gallery embed (committed). */
const SITE_COLOR_EMBED_CSS = path.join(
  process.cwd(),
  'src',
  'assets',
  'css',
  'color-gallery-embed.css'
);

/** Inner HTML + scripts for `/color/` (read via Eleventy shortcode, not parsed as Nunjucks). */
const SITE_COLOR_EMBED_INNER = path.join(
  process.cwd(),
  'src',
  '_includes',
  'partials',
  'color-gallery-embed-inner.html'
);

function loadColorLabPresets() {
  const p = path.join(process.cwd(), 'src', '_data', 'colorLabSchemes.js');
  return require(p)().presets;
}

function presetHexCssToOklchTheme(preset) {
  const theme = {};
  for (const [cssVar, hexVal] of Object.entries(preset)) {
    const name = String(cssVar).replace(/^--/, '');
    const col = parse(String(hexVal));
    if (!col) {
      continue;
    }
    theme[name] = toOklch(col);
  }
  return theme;
}

/** Paired “dark” column for DR rows (historic presets are light-first hex). Heuristic + APCA nudge. */
function synthesizeDarkCompanionForDr(light) {
  const dark = {};
  for (const [k, v] of Object.entries(light)) {
    if (!v || v.mode !== 'oklch') {
      continue;
    }
    if (k === 'content-background-color') {
      dark[k] = { ...v, l: 0.2 };
    } else if (k === 'background-color') {
      dark[k] = { ...v, l: 0.12 };
    } else if (k === 'text-color') {
      dark[k] = { ...v, l: 0.93 };
    } else if (k === 'text-color-light') {
      dark[k] = { ...v, l: 0.78 };
    } else if (k.includes('link')) {
      dark[k] = { ...v, l: Math.min(0.88, Math.max(0.55, v.l + 0.28)) };
    } else if (k === 'border-color') {
      dark[k] = { ...v, l: 0.38 };
    } else {
      dark[k] = { ...v, l: Math.min(0.98, Math.max(0.04, 1 - v.l)) };
    }
  }
  return dark;
}

const DR_PRESET_ORDER = [
  'default',
  'DR01',
  'DR02',
  'DR03',
  'DR04',
  'DR05',
  'DR06',
  'DR06a',
  'DR07',
  'DR08',
  'DR09',
  'DR10',
  'DR10a'
];

function buildDrComboRaw() {
  const presets = loadColorLabPresets();
  const variants = [];
  for (const key of DR_PRESET_ORDER) {
    if (!presets[key]) {
      continue;
    }
    const light = presetHexCssToOklchTheme(presets[key]);
    const dark = synthesizeDarkCompanionForDr(light);
    variants.push({
      id: `dr-${key}`,
      label: key,
      radioLabel: key === 'default' ? 'Default' : key,
      light,
      dark
    });
  }
  return {
    id: 'dr-combo',
    _kind: 'dr-combo',
    label: 'Dieter Rams-inspired',
    hue: null,
    _variants: variants
  };
}

const MIN_LC = 60;

/** CSS `oklch(L C H)` — L 0–1, C chroma, H degrees (CSS Color 4). */
function oklchToCss(color) {
  if (!color || color.mode !== 'oklch' || typeof color.l !== 'number') {
    return 'oklch(0.5 0 0)';
  }
  const l = Math.min(1, Math.max(0, color.l));
  const c = Math.max(0, color.c ?? 0);
  let h = color.h;
  if (typeof h !== 'number' || Number.isNaN(h)) {
    h = 0;
  }
  const lr = Math.round(l * 1000) / 1000;
  const cr = Math.round(c * 10000) / 10000;
  const hr = Math.round(h * 10) / 10;
  return `oklch(${lr} ${cr} ${hr})`;
}

function oklchEqual(a, b) {
  if (!a || !b) return a === b;
  if (a.mode !== 'oklch' || b.mode !== 'oklch') return false;
  return a.l === b.l && a.c === b.c && a.h === b.h;
}

function tokensToCssRecord(tokens) {
  return Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [key, oklchToCss(value)])
  );
}

/** Same token order as `src/assets/css/jonplummer.css` :root color block (paste-friendly). */
const JONPLUMMER_PASTE_KEYS = [
  'text-color',
  'text-color-light',
  'border-color',
  'background-color',
  'content-background-color',
  'link-color',
  'link-hover-color',
  'link-visited-color',
  'link-active-color'
];

/** Opening lines of the paste snippet (mirrors `jonplummer.css` :root color block). */
const JONPLUMMER_PASTE_HEADER_LINES = [
  '  /* Colors - based on DR10 palette, adjusted for WCAG AA contrast (OKLCH, sRGB gamut).',
  "     light-dark(light, dark) picks the value matching the user's color scheme */",
  '  color-scheme: light dark;'
];

/** `oklch(28.5% 0 0deg)`-style strings to match hand-authored `jonplummer.css`. */
function oklchToJonplummerCss(color) {
  if (!color || color.mode !== 'oklch' || typeof color.l !== 'number') {
    return 'oklch(0% 0 0deg)';
  }
  const l = Math.min(1, Math.max(0, color.l));
  const c = Math.max(0, color.c ?? 0);
  let h = color.h;
  if (typeof h !== 'number' || Number.isNaN(h)) {
    h = 0;
  }
  const lp = Math.round(l * 100 * 10) / 10;
  const cr = Math.round(c * 10000) / 10000;
  const hr = Math.round((((h % 360) + 360) % 360) * 100) / 100;
  return `oklch(${lp}% ${cr} ${hr}deg)`;
}

/** Multi-line snippet for :root — same shape as the color section in `jonplummer.css`. */
function tokensToJonplummerPasteBlock(lightObj, darkObj) {
  const lines = [...JONPLUMMER_PASTE_HEADER_LINES];
  for (const key of JONPLUMMER_PASTE_KEYS) {
    const a = lightObj[key];
    const b = darkObj[key];
    if (!a || !b) continue;
    lines.push(`  --${key}: light-dark(${oklchToJonplummerCss(a)}, ${oklchToJonplummerCss(b)});`);
  }
  return lines.join('\n');
}

function o(l, c, h) {
  let hn = h;
  if (typeof hn !== 'number' || Number.isNaN(hn)) hn = 0;
  else hn = ((hn % 360) + 360) % 360;
  return { mode: 'oklch', l, c, h: hn };
}

const OUT_DIR = path.join(__dirname, 'output');

/** Appended only to `color-gallery-embed.css` (live `/color/`); standalone HTML stays unchanged. */
const SITE_EMBED_EXTRA_CSS = `
/* Live /color/ embed — flat flow, post-scale titles, minimal chrome */
.color-gallery-embed.color-gallery-embed--site {
  padding: var(--spacing-sm) 0 var(--spacing-xl);
  background: transparent;
}
.color-gallery-embed--site .gallery-section-cards {
  display: grid;
  gap: var(--spacing-xl);
}
.color-gallery-embed--site .gallery-card {
  border: none;
  border-radius: 0;
  background: transparent;
  padding: 0;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
}

/*
  Loaded after jonplummer.css on /color/ only. MPA view transitions (navigation: auto
  globally) plus this heavy embed have been unreliable in Chrome when following utility
  links (e.g. to /type/). Prefer an ordinary full navigation for this route.
*/
@view-transition {
  navigation: none;
}
`.trim();

/** Same pairs as scripts/test/color-contrast.js (min Lc 60). */
const PAIRS = [
  { mode: 'light', fg: 'text-color', bg: 'content-background-color' },
  { mode: 'light', fg: 'text-color', bg: 'background-color' },
  { mode: 'light', fg: 'text-color-light', bg: 'content-background-color' },
  { mode: 'light', fg: 'link-color', bg: 'content-background-color' },
  { mode: 'light', fg: 'link-hover-color', bg: 'content-background-color' },
  { mode: 'light', fg: 'link-visited-color', bg: 'content-background-color' },
  { mode: 'light', fg: 'link-active-color', bg: 'content-background-color' },
  { mode: 'dark', fg: 'text-color', bg: 'content-background-color' },
  { mode: 'dark', fg: 'text-color', bg: 'background-color' },
  { mode: 'dark', fg: 'text-color-light', bg: 'content-background-color' },
  { mode: 'dark', fg: 'link-color', bg: 'content-background-color' },
  { mode: 'dark', fg: 'link-hover-color', bg: 'content-background-color' },
  { mode: 'dark', fg: 'link-visited-color', bg: 'content-background-color' },
  { mode: 'dark', fg: 'link-active-color', bg: 'content-background-color' }
];

function argvFlag(name) {
  return process.argv.includes(name);
}

function argvNum(flag, defaultValue) {
  const i = process.argv.indexOf(flag);
  if (i === -1 || !process.argv[i + 1]) return defaultValue;
  return Number(process.argv[i + 1]);
}

/** Defaults match `node scripts/color-explore/generate-gallery.js` with no flags. */
function defaultGalleryBuildOptions() {
  return {
    step: 30,
    baseHue: 0,
    randomN: 0,
    monochrome: false,
    hueSweep: false,
    includeFailed: false,
    noExtras: false,
    wildCount: 8,
    harmonyAnalogousSpread: 28,
    harmonySplitSpread: 28,
    harmonySkew: 12,
    quiet: false,
    /** When true, wild-pack RNG is deterministic so site embed files do not churn under Eleventy watch. */
    stableWildThemes: false
  };
}

function galleryBuildOptionsFromProcessArgv() {
  const noExtras = argvFlag('--no-extras');
  return {
    step: argvNum('--step', 30),
    baseHue: argvNum('--base-hue', 0),
    randomN: argvNum('--random', 0),
    monochrome: argvFlag('--monochrome'),
    hueSweep: argvFlag('--hue-sweep'),
    includeFailed: argvFlag('--include-failed'),
    noExtras,
    wildCount: noExtras ? 0 : argvNum('--wild', 8),
    harmonyAnalogousSpread: argvNum('--analogous-spread', 28),
    harmonySplitSpread: argvNum('--split-spread', 28),
    harmonySkew: argvNum('--harmony-skew', 12),
    quiet: false
  };
}

function clampHarmonyDeg(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Min APCA Lc after culori → sRGB gamut (APCA-W3 sRGBtoY). Used for nudging and pass/fail. */
function lc(fg, bg) {
  return absApcaLcSrgb(fg, bg) ?? 0;
}

function lcP3(fg, bg) {
  return absApcaLcP3(fg, bg) ?? 0;
}

function worstLcP3(theme, mode) {
  let w = Infinity;
  for (const p of PAIRS) {
    if (p.mode !== mode) continue;
    const fg = theme[p.fg];
    const bg = theme[p.bg];
    if (!fg || !bg) continue;
    w = Math.min(w, lcP3(fg, bg));
  }
  return w === Infinity ? 0 : w;
}

function themeWorstLcDual(themeLight, themeDark) {
  const srgb = Math.min(worstLc(themeLight, 'light'), worstLc(themeDark, 'dark'));
  const p3 = Math.min(worstLcP3(themeLight, 'light'), worstLcP3(themeDark, 'dark'));
  return { srgb, p3 };
}

function nudgeFgTowardContrast(fg, bg) {
  const bgOk =
    bg && typeof bg === 'object' && bg.mode === 'oklch'
      ? bg
      : toOklch(parse(bg));
  const bgL = bgOk && typeof bgOk.l === 'number' ? bgOk.l : 0.5;
  const goDarker = bgL > 0.55;

  let c =
    fg && typeof fg === 'object' && fg.mode === 'oklch' ? fg : toOklch(parse(fg));
  if (!c || typeof c.l !== 'number') {
    return fg;
  }

  let working = {
    mode: 'oklch',
    l: c.l,
    c: c.c ?? 0,
    h: typeof c.h === 'number' && !Number.isNaN(c.h) ? c.h : 0
  };
  let best = { ...working };
  let bestLc = lc(best, bg);
  if (bestLc >= MIN_LC) return best;

  for (let i = 0; i < 100; i++) {
    working = {
      ...working,
      l: goDarker
        ? Math.max(0.02, working.l - 0.012)
        : Math.min(0.98, working.l + 0.012)
    };
    const v = lc(working, bg);
    if (v > bestLc) {
      bestLc = v;
      best = { ...working };
    }
    if (v >= MIN_LC) return { ...working };
  }
  return best;
}

function nudgeThemeMode(theme, mode) {
  for (let round = 0; round < 30; round++) {
    let changed = false;
    for (const p of PAIRS) {
      if (p.mode !== mode) continue;
      const fg = theme[p.fg];
      const bg = theme[p.bg];
      if (!fg || !bg) continue;
      if (lc(fg, bg) >= MIN_LC) continue;
      const next = nudgeFgTowardContrast(fg, bg);
      if (!oklchEqual(next, fg)) {
        theme[p.fg] = next;
        changed = true;
      }
    }
    if (!changed) break;
  }
}

function worstLc(theme, mode) {
  let w = Infinity;
  for (const p of PAIRS) {
    if (p.mode !== mode) continue;
    const fg = theme[p.fg];
    const bg = theme[p.bg];
    if (!fg || !bg) continue;
    w = Math.min(w, lc(fg, bg));
  }
  return w === Infinity ? 0 : w;
}

function themePasses(themeLight, themeDark) {
  return worstLc(themeLight, 'light') >= MIN_LC && worstLc(themeDark, 'dark') >= MIN_LC;
}

function ok(l, c, h, mono) {
  // Monochrome: tiny chroma + real hue → warm/cool neutrals (not identical tiles).
  const chroma = mono ? Math.min(c, 0.03) : c;
  return o(l, chroma, h);
}

function gray(l) {
  return o(l, 0, 0);
}

/** Achromatic ramps only (chroma 0). APCA nudging may pull links slightly off-gray. */
function buildBlackWhiteThemes() {
  return [
    {
      id: 'bw-strict',
      label: 'Black & white · strict',
      hue: null,
      light: {
        'content-background-color': gray(1),
        'background-color': gray(0.93),
        'text-color': gray(0.06),
        'text-color-light': gray(0.4),
        'border-color': gray(0.82),
        'link-color': gray(0.1),
        'link-hover-color': gray(0.02),
        'link-visited-color': gray(0.32),
        'link-active-color': gray(0.16)
      },
      dark: {
        'content-background-color': gray(0.2),
        'background-color': gray(0.04),
        'text-color': gray(0.96),
        'text-color-light': gray(0.7),
        'border-color': gray(0.38),
        'link-color': gray(0.9),
        'link-hover-color': gray(0.98),
        'link-visited-color': gray(0.74),
        'link-active-color': gray(0.84)
      }
    },
    {
      id: 'bw-paper',
      label: 'Black & white · newsprint',
      hue: null,
      light: {
        'content-background-color': gray(0.97),
        'background-color': gray(0.88),
        'text-color': gray(0.12),
        'text-color-light': gray(0.42),
        'border-color': gray(0.72),
        'link-color': gray(0.08),
        'link-hover-color': gray(0.02),
        'link-visited-color': gray(0.35),
        'link-active-color': gray(0.2)
      },
      dark: {
        'content-background-color': gray(0.24),
        'background-color': gray(0.1),
        'text-color': gray(0.93),
        'text-color-light': gray(0.68),
        'border-color': gray(0.42),
        'link-color': gray(0.86),
        'link-hover-color': gray(0.96),
        'link-visited-color': gray(0.72),
        'link-active-color': gray(0.8)
      }
    },
    {
      id: 'bw-contrast',
      label: 'Black & white · high contrast',
      hue: null,
      light: {
        'content-background-color': gray(1),
        'background-color': gray(0.85),
        'text-color': gray(0.02),
        'text-color-light': gray(0.35),
        'border-color': gray(0.55),
        'link-color': gray(0.05),
        'link-hover-color': gray(0),
        'link-visited-color': gray(0.25),
        'link-active-color': gray(0.12)
      },
      dark: {
        'content-background-color': gray(0.14),
        'background-color': gray(0),
        'text-color': gray(1),
        'text-color-light': gray(0.78),
        'border-color': gray(0.32),
        'link-color': gray(0.94),
        'link-hover-color': gray(1),
        'link-visited-color': gray(0.7),
        'link-active-color': gray(0.88)
      }
    }
  ];
}

const BW_VARIANT_RADIO = {
  'bw-strict': 'Strict',
  'bw-paper': 'Newsprint',
  'bw-contrast': 'High contrast'
};

/** Single gallery card with three B&W presets (strict / newsprint / high contrast). */
function buildBlackWhiteComboRaw() {
  return {
    id: 'bw-combo',
    _kind: 'bw-combo',
    label: 'Black & white',
    hue: null,
    _variants: buildBlackWhiteThemes().map((v) => ({
      id: v.id,
      label: v.label,
      radioLabel: BW_VARIANT_RADIO[v.id] || v.id,
      light: v.light,
      dark: v.dark
    }))
  };
}

/** One gallery card: all wild recipes behind one scheme select (was one card per recipe). */
function buildWildComboRaw(count, rng = mathRnd) {
  const items = buildWildThemes(count, rng);
  return {
    id: 'wild-combo',
    _kind: 'wild-combo',
    label: 'Wild',
    hue: null,
    _variants: items.map((v) => ({
      id: v.id,
      label: v.label,
      radioLabel: v.label,
      light: v.light,
      dark: v.dark
    }))
  };
}

/** One gallery card: terminal-inspired palettes behind one scheme select. */
function buildTerminalComboRaw() {
  const items = buildTerminalPresetThemes();
  return {
    id: 'terminal-combo',
    _kind: 'terminal-combo',
    label: 'Terminal-inspired',
    hue: null,
    _variants: items.map((v) => ({
      id: v.id,
      label: v.label,
      radioLabel: v.label,
      light: v.light,
      dark: v.dark
    }))
  };
}

function mathRnd(a, b) {
  return a + Math.random() * (b - a);
}

/**
 * Deterministic uniform draws in [a, b] for stable gallery output.
 * Wild pack themes used `mathRnd` (Math.random); that made `color-gallery-embed-inner.html`
 * differ on every `eleventy.before`, retriggering `--watch` in a tight loop.
 */
function createStableRng(seed) {
  let s = Math.floor(Number(seed)) % 2147483646;
  if (s <= 0) s += 2147483646;
  return (a, b) => {
    s = (s * 16807) % 2147483647;
    const u = (s - 1) / 2147483646;
    return a + u * (b - a);
  };
}

/**
 * Higher-chroma experimental recipes (not a hue sweep). Ten families (`i % 10`).
 * All tokens stay OKLCH objects for APCA nudge + `oklch()` export. CSS gradients are
 * not used here: band fills on the real site use `background-color: var(--token)`, and
 * gradients want `background` / `background-image` instead — a gallery-only layer could
 * be added later if we want visible mesh gradients in previews only.
 */
function buildWildThemes(count, rng = mathRnd) {
  const themes = [];
  for (let i = 0; i < count; i++) {
    const h = rng(0, 360);
    const kind = i % 10;
    let label;
    let light;
    let dark;

    if (kind === 0) {
      const hOpp = (h + 180) % 360;
      label = `Wild · complementary (${Math.round(h)}°)`;
      const cBg = rng(0.03, 0.1);
      const cHot = rng(0.18, 0.32);
      light = {
        'content-background-color': o(rng(0.97, 0.995), cBg * 0.5, h),
        'background-color': o(rng(0.86, 0.93), cBg, h),
        'text-color': o(rng(0.15, 0.26), rng(0.02, 0.06), h),
        'text-color-light': o(rng(0.38, 0.48), rng(0.02, 0.05), h),
        'border-color': o(0.78, cBg * 0.6, h),
        'link-color': o(0.45, cHot, hOpp),
        'link-hover-color': o(0.38, cHot * 1.05, (hOpp + 25) % 360),
        'link-visited-color': o(0.4, cHot * 0.55, (h + 90) % 360),
        'link-active-color': o(0.48, cHot * 0.85, (h + 55) % 360)
      };
      dark = {
        'content-background-color': o(rng(0.22, 0.3), cBg * 1.4, h),
        'background-color': o(rng(0.1, 0.16), cBg * 1.2, h),
        'text-color': o(rng(0.9, 0.96), rng(0.02, 0.05), h),
        'text-color-light': o(rng(0.72, 0.82), rng(0.03, 0.07), h),
        'border-color': o(0.4, cBg, h),
        'link-color': o(0.72, cHot * 0.85, hOpp),
        'link-hover-color': o(0.8, cHot * 0.75, (hOpp + 30) % 360),
        'link-visited-color': o(0.68, cHot * 0.45, (h + 95) % 360),
        'link-active-color': o(0.76, cHot * 0.65, (h + 60) % 360)
      };
    } else if (kind === 1) {
      label = `Wild · neon dark (${Math.round(h)}°)`;
      const cAcc = rng(0.2, 0.34);
      light = {
        'content-background-color': o(0.99, 0.02, h),
        'background-color': o(0.9, 0.04, h),
        'text-color': o(0.2, 0.04, h),
        'text-color-light': o(0.42, 0.04, h),
        'border-color': o(0.82, 0.05, h),
        'link-color': o(0.48, cAcc, h),
        'link-hover-color': o(0.42, cAcc, (h + 40) % 360),
        'link-visited-color': o(0.38, cAcc * 0.5, (h + 180) % 360),
        'link-active-color': o(0.45, cAcc * 0.9, (h + 140) % 360)
      };
      dark = {
        'content-background-color': o(0.16, 0.04, h),
        'background-color': o(0.06, 0.06, h),
        'text-color': o(0.94, 0.03, h),
        'text-color-light': o(0.76, 0.05, h),
        'border-color': o(0.32, 0.08, h),
        'link-color': o(0.78, cAcc, h),
        'link-hover-color': o(0.85, cAcc * 0.9, (h + 50) % 360),
        'link-visited-color': o(0.7, cAcc * 0.55, (h + 200) % 360),
        'link-active-color': o(0.82, cAcc * 0.85, (h + 120) % 360)
      };
    } else if (kind === 2) {
      const h2 = (h + 120) % 360;
      const h3 = (h + 240) % 360;
      label = `Wild · triadic links (${Math.round(h)}°)`;
      const cT = rng(0.16, 0.28);
      light = {
        'content-background-color': o(0.985, rng(0.02, 0.06), h),
        'background-color': o(0.9, rng(0.04, 0.09), h),
        'text-color': o(0.22, 0.04, h),
        'text-color-light': o(0.44, 0.04, h),
        'border-color': o(0.8, 0.05, h),
        'link-color': o(0.48, cT, h),
        'link-hover-color': o(0.44, cT, h2),
        'link-visited-color': o(0.4, cT * 0.65, h3),
        'link-active-color': o(0.46, cT * 0.85, h2)
      };
      dark = {
        'content-background-color': o(0.26, 0.06, h),
        'background-color': o(0.14, 0.07, h),
        'text-color': o(0.93, 0.04, h),
        'text-color-light': o(0.74, 0.06, h),
        'border-color': o(0.38, 0.08, h),
        'link-color': o(0.74, cT * 0.9, h),
        'link-hover-color': o(0.8, cT * 0.85, h2),
        'link-visited-color': o(0.68, cT * 0.55, h3),
        'link-active-color': o(0.78, cT * 0.75, h2)
      };
    } else if (kind === 3) {
      label = `Wild · candy wash (${Math.round(h)}°)`;
      const cWash = rng(0.08, 0.18);
      const cPop = rng(0.22, 0.35);
      light = {
        'content-background-color': o(rng(0.94, 0.99), cWash, h),
        'background-color': o(rng(0.82, 0.9), cWash * 1.1, (h + 40) % 360),
        'text-color': o(0.18, rng(0.05, 0.12), (h + 180) % 360),
        'text-color-light': o(0.4, rng(0.04, 0.1), h),
        'border-color': o(0.75, cWash * 0.7, h),
        'link-color': o(0.46, cPop, (h + 160) % 360),
        'link-hover-color': o(0.4, cPop, (h + 200) % 360),
        'link-visited-color': o(0.38, cPop * 0.5, (h + 280) % 360),
        'link-active-color': o(0.44, cPop * 0.9, (h + 130) % 360)
      };
      dark = {
        'content-background-color': o(rng(0.24, 0.32), cWash * 1.2, h),
        'background-color': o(rng(0.12, 0.18), cWash, (h + 35) % 360),
        'text-color': o(0.92, 0.05, h),
        'text-color-light': o(0.72, 0.07, h),
        'border-color': o(0.4, cWash, h),
        'link-color': o(0.72, cPop * 0.85, (h + 165) % 360),
        'link-hover-color': o(0.8, cPop * 0.8, (h + 210) % 360),
        'link-visited-color': o(0.66, cPop * 0.5, (h + 285) % 360),
        'link-active-color': o(0.76, cPop * 0.75, (h + 125) % 360)
      };
    } else if (kind === 4) {
      label = `Wild · clash (${Math.round(h)}°)`;
      const c1 = rng(0.12, 0.26);
      const c2 = rng(0.15, 0.3);
      light = {
        'content-background-color': o(rng(0.96, 0.995), c1, h),
        'background-color': o(rng(0.78, 0.88), c2, (h + 85) % 360),
        'text-color': o(0.2, rng(0.06, 0.14), (h + 200) % 360),
        'text-color-light': o(0.42, rng(0.05, 0.12), (h + 220) % 360),
        'border-color': o(0.72, rng(0.08, 0.16), (h + 40) % 360),
        'link-color': o(0.5, c2, (h + 150) % 360),
        'link-hover-color': o(0.44, c1 * 1.2, (h + 270) % 360),
        'link-visited-color': o(0.36, c2 * 0.6, (h + 310) % 360),
        'link-active-color': o(0.48, c1, (h + 60) % 360)
      };
      dark = {
        'content-background-color': o(rng(0.22, 0.3), c1 * 1.1, (h + 15) % 360),
        'background-color': o(rng(0.08, 0.14), c2 * 0.9, (h + 95) % 360),
        'text-color': o(0.93, 0.06, (h + 25) % 360),
        'text-color-light': o(0.74, 0.08, (h + 35) % 360),
        'border-color': o(0.38, c1, (h + 50) % 360),
        'link-color': o(0.76, c2 * 0.9, (h + 155) % 360),
        'link-hover-color': o(0.84, c1 * 0.95, (h + 275) % 360),
        'link-visited-color': o(0.68, c2 * 0.55, (h + 305) % 360),
        'link-active-color': o(0.8, c1 * 0.85, (h + 70) % 360)
      };
    } else if (kind === 5) {
      const hInk = (h + 268 + rng(0, 24)) % 360;
      const hNeon = (h + rng(95, 125)) % 360;
      label = `Wild · voltage (${Math.round(h)}°)`;
      const cEdge = rng(0.12, 0.22);
      light = {
        'content-background-color': o(rng(0.93, 0.99), rng(0.05, 0.12), hInk),
        'background-color': o(rng(0.76, 0.86), rng(0.09, 0.18), (hInk + 22) % 360),
        'text-color': o(0.12, rng(0.06, 0.12), (hInk + 178) % 360),
        'text-color-light': o(0.34, rng(0.07, 0.14), (hInk + 188) % 360),
        'border-color': o(0.66, cEdge, hInk),
        'link-color': o(0.5, rng(0.22, 0.34), hNeon),
        'link-hover-color': o(0.44, rng(0.2, 0.32), (hNeon + 38) % 360),
        'link-visited-color': o(0.4, rng(0.14, 0.22), (hNeon + 175) % 360),
        'link-active-color': o(0.48, rng(0.2, 0.3), (hNeon + 72) % 360)
      };
      dark = {
        'content-background-color': o(rng(0.1, 0.16), rng(0.12, 0.2), hInk),
        'background-color': o(rng(0.03, 0.08), rng(0.14, 0.22), (hInk + 18) % 360),
        'text-color': o(0.94, rng(0.04, 0.09), (hInk + 48) % 360),
        'text-color-light': o(0.72, rng(0.07, 0.12), hInk),
        'border-color': o(0.3, cEdge * 1.1, (hInk + 35) % 360),
        'link-color': o(0.84, rng(0.22, 0.34), hNeon),
        'link-hover-color': o(0.9, rng(0.2, 0.3), (hNeon + 42) % 360),
        'link-visited-color': o(0.72, rng(0.14, 0.22), (hNeon + 178) % 360),
        'link-active-color': o(0.88, rng(0.2, 0.28), (hNeon + 68) % 360)
      };
    } else if (kind === 6) {
      const hScream = (h + rng(150, 210)) % 360;
      const cScream = rng(0.14, 0.26);
      label = `Wild · spectral rim (${Math.round(h)}°)`;
      light = {
        'content-background-color': o(rng(0.96, 0.995), rng(0.02, 0.06), h),
        'background-color': o(rng(0.88, 0.94), rng(0.04, 0.1), (h + rng(8, 28)) % 360),
        'text-color': o(rng(0.14, 0.22), cScream, hScream),
        'text-color-light': o(rng(0.32, 0.42), rng(0.08, 0.16), (hScream + 35) % 360),
        'border-color': o(0.76, rng(0.06, 0.14), (h + 55) % 360),
        'link-color': o(0.48, rng(0.18, 0.3), (h + 108) % 360),
        'link-hover-color': o(0.42, rng(0.18, 0.28), (h + 200) % 360),
        'link-visited-color': o(0.38, rng(0.12, 0.2), (h + 252) % 360),
        'link-active-color': o(0.46, rng(0.16, 0.26), (h + 145) % 360)
      };
      dark = {
        'content-background-color': o(rng(0.18, 0.26), rng(0.06, 0.12), (h + 12) % 360),
        'background-color': o(rng(0.08, 0.14), rng(0.08, 0.14), h),
        'text-color': o(rng(0.88, 0.96), rng(0.05, 0.1), hScream),
        'text-color-light': o(rng(0.68, 0.8), rng(0.08, 0.14), (hScream + 30) % 360),
        'border-color': o(0.36, rng(0.1, 0.18), (h + 60) % 360),
        'link-color': o(0.78, rng(0.18, 0.3), (h + 112) % 360),
        'link-hover-color': o(0.86, rng(0.16, 0.28), (h + 205) % 360),
        'link-visited-color': o(0.7, rng(0.12, 0.2), (h + 255) % 360),
        'link-active-color': o(0.82, rng(0.16, 0.26), (h + 150) % 360)
      };
    } else if (kind === 7) {
      const hMint = (h + rng(130, 170)) % 360;
      label = `Wild · saltwater taffy (${Math.round(h)}°)`;
      const cPastel = rng(0.07, 0.16);
      const cPop = rng(0.2, 0.32);
      light = {
        'content-background-color': o(rng(0.95, 0.99), cPastel, h),
        'background-color': o(rng(0.86, 0.93), cPastel * 1.05, hMint),
        'text-color': o(0.2, rng(0.06, 0.12), (h + 195) % 360),
        'text-color-light': o(0.42, rng(0.05, 0.11), (h + 210) % 360),
        'border-color': o(0.78, rng(0.06, 0.12), (hMint + 40) % 360),
        'link-color': o(0.46, cPop, (h + rng(70, 110)) % 360),
        'link-hover-color': o(0.4, cPop, (h + rng(200, 250)) % 360),
        'link-visited-color': o(0.38, cPop * 0.55, (h + 285) % 360),
        'link-active-color': o(0.44, cPop * 0.92, (h + 140) % 360)
      };
      dark = {
        'content-background-color': o(rng(0.22, 0.3), cPastel * 1.15, h),
        'background-color': o(rng(0.14, 0.2), cPastel, hMint),
        'text-color': o(0.92, rng(0.05, 0.1), (h + 200) % 360),
        'text-color-light': o(0.72, rng(0.06, 0.12), (h + 215) % 360),
        'border-color': o(0.4, rng(0.08, 0.14), (hMint + 35) % 360),
        'link-color': o(0.74, cPop * 0.9, (h + rng(75, 115)) % 360),
        'link-hover-color': o(0.82, cPop * 0.85, (h + rng(205, 255)) % 360),
        'link-visited-color': o(0.66, cPop * 0.52, (h + 288) % 360),
        'link-active-color': o(0.78, cPop * 0.8, (h + 135) % 360)
      };
    } else if (kind === 8) {
      const hMud = (h + rng(240, 300)) % 360;
      label = `Wild · bruise (${Math.round(h)}°)`;
      const cMud = rng(0.1, 0.2);
      light = {
        'content-background-color': o(rng(0.38, 0.48), cMud, hMud),
        'background-color': o(rng(0.28, 0.38), cMud * 1.05, (hMud + 18) % 360),
        'text-color': o(rng(0.88, 0.96), rng(0.04, 0.09), (hMud + 140) % 360),
        'text-color-light': o(rng(0.72, 0.82), rng(0.06, 0.11), (hMud + 155) % 360),
        'border-color': o(0.52, rng(0.08, 0.14), (hMud + 50) % 360),
        'link-color': o(0.55, rng(0.16, 0.26), (hMud + 200) % 360),
        'link-hover-color': o(0.5, rng(0.14, 0.24), (hMud + 230) % 360),
        'link-visited-color': o(0.46, rng(0.12, 0.2), (hMud + 85) % 360),
        'link-active-color': o(0.52, rng(0.14, 0.22), (hMud + 115) % 360)
      };
      dark = {
        'content-background-color': o(rng(0.14, 0.22), cMud * 1.1, hMud),
        'background-color': o(rng(0.06, 0.12), cMud * 1.15, (hMud + 15) % 360),
        'text-color': o(0.9, rng(0.05, 0.1), (hMud + 130) % 360),
        'text-color-light': o(0.7, rng(0.07, 0.12), (hMud + 145) % 360),
        'border-color': o(0.32, rng(0.1, 0.16), (hMud + 45) % 360),
        'link-color': o(0.78, rng(0.16, 0.26), (hMud + 205) % 360),
        'link-hover-color': o(0.86, rng(0.14, 0.24), (hMud + 235) % 360),
        'link-visited-color': o(0.7, rng(0.12, 0.2), (hMud + 88) % 360),
        'link-active-color': o(0.82, rng(0.14, 0.22), (hMud + 118) % 360)
      };
    } else {
      const hC = (h + rng(170, 200)) % 360;
      const hM = (hC + 180) % 360;
      label = `Wild · lasergrid (${Math.round(h)}°)`;
      const cLine = rng(0.14, 0.24);
      light = {
        'content-background-color': o(rng(0.97, 0.995), rng(0.01, 0.04), (h + 210) % 360),
        'background-color': o(rng(0.88, 0.94), rng(0.03, 0.08), (h + 225) % 360),
        'text-color': o(0.16, rng(0.05, 0.1), (h + 240) % 360),
        'text-color-light': o(0.38, rng(0.04, 0.09), (h + 250) % 360),
        'border-color': o(0.62, cLine, hC),
        'link-color': o(0.48, rng(0.2, 0.3), hC),
        'link-hover-color': o(0.42, rng(0.2, 0.3), hM),
        'link-visited-color': o(0.38, rng(0.14, 0.22), (hC + 90) % 360),
        'link-active-color': o(0.46, rng(0.18, 0.28), hM)
      };
      dark = {
        'content-background-color': o(rng(0.12, 0.18), rng(0.06, 0.12), (h + 215) % 360),
        'background-color': o(rng(0.06, 0.1), rng(0.08, 0.14), (h + 230) % 360),
        'text-color': o(0.94, rng(0.04, 0.08), (h + 235) % 360),
        'text-color-light': o(0.74, rng(0.06, 0.1), (h + 245) % 360),
        'border-color': o(0.34, cLine * 1.05, hC),
        'link-color': o(0.82, rng(0.2, 0.3), hC),
        'link-hover-color': o(0.88, rng(0.18, 0.28), hM),
        'link-visited-color': o(0.72, rng(0.14, 0.22), (hC + 95) % 360),
        'link-active-color': o(0.86, rng(0.18, 0.28), hM)
      };
    }

    themes.push({
      id: `wild-${i}-${kind}`,
      label,
      hue: Math.round(h),
      light,
      dark
    });
  }
  return themes;
}

function buildRawThemes(hues, mono, options = {}) {
  const { enableHueSlider } = options;
  const themes = [];
  for (const h of hues) {
    const cBg = mono ? 0.02 : 0.055;
    const cText = mono ? 0.02 : 0.04;
    const cAcc = mono ? 0.03 : 0.19;

    const light = {
      'content-background-color': ok(0.994, cBg * 0.4, h, mono),
      'background-color': ok(0.91, cBg * 1.1, h, mono),
      'text-color': ok(0.22, cText, h, mono),
      'text-color-light': ok(0.42, cText, h, mono),
      'border-color': ok(0.8, cBg * 0.6, h, mono),
      'link-color': ok(0.5, cAcc, h, mono),
      'link-hover-color': ok(0.44, cAcc, (h + 38) % 360, mono),
      'link-visited-color': ok(0.38, cAcc * 0.55, (h - 42 + 360) % 360, mono),
      'link-active-color': ok(0.48, cAcc * 0.9, (h + 145) % 360, mono)
    };

    const dark = {
      'content-background-color': ok(0.27, cBg * 1.8, h, mono),
      'background-color': ok(0.15, cBg * 1.5, h, mono),
      'text-color': ok(0.93, cText * 0.5, h, mono),
      'text-color-light': ok(0.78, cText * 0.7, h, mono),
      'border-color': ok(0.4, cBg * 1.2, h, mono),
      'link-color': ok(0.76, cAcc * 0.75, h, mono),
      'link-hover-color': ok(0.82, cAcc * 0.65, (h + 38) % 360, mono),
      'link-visited-color': ok(0.72, cAcc * 0.45, (h - 42 + 360) % 360, mono),
      'link-active-color': ok(0.78, cAcc * 0.7, (h + 145) % 360, mono)
    };

    themes.push({
      id: mono ? `mono-${Math.round(h)}` : `hue-${Math.round(h)}`,
      label: mono ? `Neutral (${Math.round(h)}°)` : `Hue ${Math.round(h)}°`,
      hue: h,
      light: { ...light },
      dark: { ...dark },
      _hueSlider: Boolean(enableHueSlider && hues.length === 1)
    });
  }
  return themes;
}

function H(h, delta) {
  return (h + delta + 360) % 360;
}

/**
 * Classic harmony families at base hue h (browser slider rotates all oklch hues later).
 * Neutrals sit on h; link states use recipe-specific hue offsets.
 *
 * @param {object} [opts]
 * @param {number} [opts.analogousSpread] — ±degrees for adjacent (analogous) flank (default 28, clamped 6–55).
 * @param {number} [opts.splitSpread] — degrees from complement for split arms (default 28, clamped 12–48).
 * @param {number} [opts.harmonySkew] — pull “skewed” triadic/tetradic/split off perfect angles (default 12, clamped 0–40).
 */
function buildHarmonySchemes(hBase, opts = {}) {
  const h = ((hBase % 360) + 360) % 360;
  const A = clampHarmonyDeg(opts.analogousSpread, 6, 55, 28);
  const S = clampHarmonyDeg(opts.splitSpread, 12, 48, 28);
  const K = clampHarmonyDeg(opts.harmonySkew, 0, 40, 12);
  const hk = Math.round(K / 2);

  const cBg = 0.055;
  const cText = 0.04;
  const cAcc = 0.19;
  const d = (deg) => H(h, deg);

  function pair(linkD, hoverD, visitedD, activeD) {
    const light = {
      'content-background-color': ok(0.994, cBg * 0.4, d(0), false),
      'background-color': ok(0.91, cBg * 1.1, d(0), false),
      'text-color': ok(0.22, cText, d(0), false),
      'text-color-light': ok(0.42, cText, d(0), false),
      'border-color': ok(0.8, cBg * 0.6, d(0), false),
      'link-color': ok(0.5, cAcc, d(linkD), false),
      'link-hover-color': ok(0.44, cAcc * 0.95, d(hoverD), false),
      'link-visited-color': ok(0.38, cAcc * 0.55, d(visitedD), false),
      'link-active-color': ok(0.48, cAcc * 0.88, d(activeD), false)
    };
    const dark = {
      'content-background-color': ok(0.27, cBg * 1.8, d(0), false),
      'background-color': ok(0.15, cBg * 1.5, d(0), false),
      'text-color': ok(0.93, cText * 0.5, d(0), false),
      'text-color-light': ok(0.78, cText * 0.7, d(0), false),
      'border-color': ok(0.4, cBg * 1.2, d(0), false),
      'link-color': ok(0.76, cAcc * 0.75, d(linkD), false),
      'link-hover-color': ok(0.82, cAcc * 0.7, d(hoverD), false),
      'link-visited-color': ok(0.72, cAcc * 0.45, d(visitedD), false),
      'link-active-color': ok(0.78, cAcc * 0.75, d(activeD), false)
    };
    return { light, dark };
  }

  const recipes = [
    {
      id: 'harmony-monochromatic',
      label: 'Monochromatic',
      build: () => pair(0, 0, 0, 0)
    },
    {
      id: 'harmony-analogous',
      label: 'Adjacent (analogous)',
      build: () => {
        const flank = Math.round(0.857 * A);
        return pair(A, A + flank, -flank, Math.round(1.429 * A));
      }
    },
    {
      id: 'harmony-triadic',
      label: 'Triadic',
      build: () => pair(120, 240, 120, 240)
    },
    {
      id: 'harmony-tetradic',
      label: 'Tetradic (square)',
      build: () => pair(90, 180, 270, 135)
    },
    {
      id: 'harmony-skewed-triadic',
      label: 'Skewed triadic',
      build: () => {
        const a1 = 120 - K;
        const a2 = 240 - K;
        return pair(a1, a2, a1, a2);
      }
    },
    {
      id: 'harmony-skewed-tetradic',
      label: 'Skewed tetradic',
      build: () => pair(90 - K, 180 - K, 270 - K, 135 - K)
    },
    {
      id: 'harmony-complementary',
      label: 'Complementary',
      build: () => pair(180, 204, 156, 192)
    },
    {
      id: 'harmony-split-complementary',
      label: 'Split complementary',
      build: () =>
        pair(180 - S, 180 + S, 180 - S - 4, 180 + S - 12)
    },
    {
      id: 'harmony-skewed-split-complementary',
      label: 'Skewed split complementary',
      build: () =>
        pair(
          180 - S + hk,
          180 + S - hk,
          180 - S + hk - 4,
          180 + S - hk - 4
        )
    }
  ];

  const themes = recipes.map((r) => {
    const { light, dark } = r.build();
    return {
      id: r.id,
      label: r.label,
      hue: h,
      light: { ...light },
      dark: { ...dark }
    };
  });

  return {
    themes,
    tuning: {
      analogousSpread: A,
      splitSpread: S,
      harmonySkew: K
    }
  };
}

const HARMONY_LAB_KEYS = [
  'content-background-color',
  'background-color',
  'text-color',
  'text-color-light',
  'border-color',
  'link-color',
  'link-hover-color',
  'link-visited-color',
  'link-active-color'
];

function stripHarmonyLcSide(side) {
  const o = {};
  for (const k of HARMONY_LAB_KEYS) {
    const v = side[k];
    o[k] = [v.l, Math.max(0, v.c ?? 0)];
  }
  return o;
}

function buildHarmonyLabPayload(processedHarmonyList, tuning, baseHue) {
  return {
    baseHue: ((baseHue % 360) + 360) % 360,
    tuningDefaults: { ...tuning },
    recipes: processedHarmonyList.map((th) => ({
      id: th.id,
      label: th.label,
      passesApcaMin: !th._failed,
      light: stripHarmonyLcSide(th.light),
      dark: stripHarmonyLcSide(th.dark)
    }))
  };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** OKLCH hue disk + `.color-wheel-dots` markers (filled by inline gallery script). */
function colorWheelHtml(extraClass = '') {
  const cls = ['color-wheel', extraClass].filter(Boolean).join(' ');
  return `<div class="${cls}" aria-hidden="true">
    <div class="color-wheel-disk"></div>
    <div class="color-wheel-dots"></div>
  </div>`;
}

/** Full-spectrum conic (explicit stops). OKLCH 0→360 alone can interpolate the short hue path and look flat. */
function colorWheelDiskBackground() {
  const n = 24;
  const stops = [];
  for (let i = 0; i <= n; i++) {
    const h = Math.round((i * 360) / n);
    stops.push(`hsl(${h} 100% 50%)`);
  }
  return `conic-gradient(from -90deg, ${stops.join(', ')})`;
}

/** Safe fragment for HTML id (home preview blocks repeat many times per page). */
function previewDomId(raw) {
  return String(raw).replace(/[^a-zA-Z0-9_-]/g, '-');
}

function varsToInlineStyle(tokens) {
  return Object.entries(tokens)
    .map(([k, v]) => `--${k}: ${oklchToCss(v)}`)
    .join('; ');
}

/** Slice of index layout: base.njk header + post + link-item + pagination (see src/index.njk). */
function renderHomePreview(cssVarsInline, schemeLabel, previewUid) {
  const uid = escapeHtml(previewDomId(previewUid));
  const lab = escapeHtml(schemeLabel);
  return `
    <div class="preview-column">
      <span class="col-label">${lab}</span>
      <div class="theme-root home-preview" style="${escapeHtml(cssVarsInline)}">
        <div class="jp-page">
          <header aria-label="Preview ${lab} · ${uid} · site header">
            <hgroup>
              <h1><a href="#" rel="home">Jon Plummer</a></h1>
              <p>Today I Learned</p>
            </hgroup>
            <nav aria-label="Preview ${lab} · ${uid} · primary navigation">
              <ul>
                <li><a href="#">/about</a></li>
                <li><a href="#">/now</a></li>
                <li><a href="#">/portfolio</a></li>
                <li><a href="#" class="sim-visited">/wisdom</a></li>
              </ul>
            </nav>
          </header>
          <section id="gallery-preview-main-${uid}" class="gallery-preview-main" aria-labelledby="gallery-preview-main-h-${uid}">
            <h2 class="sr-only" id="gallery-preview-main-h-${uid}">Preview main column (${lab}, ${uid})</h2>
            <article aria-label="Preview ${lab} · ${uid} · article">
              <header aria-label="Preview ${lab} · ${uid} · article title">
                <h1><a href="#" rel="bookmark">What we owe junior designers in review</a></h1>
              </header>
              <section>
                <p>Feedback works when it is <a href="#">specific</a> and <a href="#" class="sim-visited">grounded in examples</a>. <strong>Kind</strong> delivery helps the second sentence read like a real lede.</p>
                <pre><code>const tone = 'curious';</code></pre>
              </section>
              <footer aria-label="Preview ${lab} · ${uid} · article footer">
                <p class="posted-on"><time datetime="2026-03-15">March 15, 2026</time></p>
              </footer>
            </article>
            <article class="link-item">
              <section>
                <p>
                  <a href="#">How product trios survive reorgs</a><span class="link-description"> — remaindered link blurb.</span>
                </p>
              </section>
            </article>
            <nav class="pagination" aria-label="Preview ${lab} · ${uid} · pagination">
              <a class="prev" href="#">← Older posts</a>
              <a class="next" href="#">Newer posts →</a>
            </nav>
          </section>
          <footer aria-label="Preview ${lab} · ${uid} · site footer">
            <p class="license">Copyright 2026 Jon Plummer</p>
          </footer>
        </div>
        <div class="swatch-legend" aria-hidden="true">
          <span class="chip"><span class="chip-swatch" style="background-color: var(--background-color)"></span> Page <code>--background-color</code></span>
          <span class="chip"><span class="chip-swatch" style="background-color: var(--content-background-color)"></span> Content <code>--content-background-color</code></span>
        </div>
      </div>
    </div>`;
}

function processGalleryItem(t) {
  if (t._kind === 'harmony-lab') {
    return { ...t, _failed: false };
  }
  if (
    t._kind === 'bw-combo' ||
    t._kind === 'dr-combo' ||
    t._kind === 'wild-combo' ||
    t._kind === 'terminal-combo'
  ) {
    const processedVariants = t._variants.map((v) => {
      const light = { ...v.light };
      const dark = { ...v.dark };
      nudgeThemeMode(light, 'light');
      nudgeThemeMode(dark, 'dark');
      const passes = themePasses(light, dark);
      return {
        id: v.id,
        label: v.label,
        radioLabel: v.radioLabel,
        light,
        dark,
        _failed: !passes
      };
    });
    const anyFailed = processedVariants.some((x) => x._failed);
    return {
      ...t,
      _processedVariants: processedVariants,
      _failed: anyFailed
    };
  }
  const light = { ...t.light };
  const dark = { ...t.dark };
  nudgeThemeMode(light, 'light');
  nudgeThemeMode(dark, 'dark');
  const passes = themePasses(light, dark);
  return {
    id: t.id,
    label: t.label,
    hue: t.hue,
    light,
    dark,
    _failed: !passes,
    _hueSlider: t._hueSlider
  };
}

function themeVisibleInGallery(t, includeFailed) {
  if (t._kind === 'harmony-lab') return true;
  if (includeFailed) return true;
  if (
    t._kind === 'bw-combo' ||
    t._kind === 'dr-combo' ||
    t._kind === 'wild-combo' ||
    t._kind === 'terminal-combo'
  ) {
    return t._processedVariants.some((v) => !v._failed);
  }
  return !t._failed;
}

function flattenThemesForExport(visibleSections, harmonyExportThemes) {
  const out = [];
  for (const sec of visibleSections) {
    const themes =
      sec.slug === 'harmony-schemes' && harmonyExportThemes != null
        ? harmonyExportThemes
        : sec.themes;

    for (const t of themes) {
      if (
        t._kind === 'bw-combo' ||
        t._kind === 'dr-combo' ||
        t._kind === 'wild-combo' ||
        t._kind === 'terminal-combo'
      ) {
        for (const v of t._processedVariants) {
          const dual = themeWorstLcDual(v.light, v.dark);
          out.push({
            id: v.id,
            label: v.label,
            hue: null,
            light: tokensToCssRecord(v.light),
            dark: tokensToCssRecord(v.dark),
            worstLcSrgb: Math.round(dual.srgb * 10) / 10,
            worstLcP3: Math.round(dual.p3 * 10) / 10,
            passesApcaMin: !v._failed
          });
        }
      } else if (t._kind !== 'harmony-lab') {
        const dual = themeWorstLcDual(t.light, t.dark);
        out.push({
          id: t.id,
          label: t.label,
          hue: t.hue,
          light: tokensToCssRecord(t.light),
          dark: tokensToCssRecord(t.dark),
          worstLcSrgb: Math.round(dual.srgb * 10) / 10,
          worstLcP3: Math.round(dual.p3 * 10) / 10,
          passesApcaMin: !t._failed
        });
      }
    }
  }
  return out;
}

function huePackSectionTitle(mono, randomN, hueSweep) {
  if (mono) return 'Monochrome reference';
  if (randomN > 0) return 'Random hues';
  if (hueSweep) return 'Hue sweep';
  return 'Hue reference';
}

/** Visible <h1> on live /color/ embed: one title per block (no duplicate section + card labels). */
function siteEmbedVisibleHeading(t, sec) {
  if (!sec) return t.label;
  if (sec.slug === 'hue-pack' && sec.themes.length === 1 && t._hueSlider) {
    return sec.title;
  }
  return t.label;
}

/** UI + wiring for B&W, DR, wild, and terminal variant combo cards. */
const VARIANT_COMBO_CFG = {
  'bw-combo': {
    dataAttr: 'data-bw-combo',
    cardMod: 'bw-combo',
    jsonClass: 'bw-variants-json',
    preClass: 'bw-tokens-pre',
    selectAttr: 'data-bw-variant-select',
    selIdPrefix: 'bw-variant-preset',
    pickLabel: 'Black and white preset',
    failHint: '(one or more presets)'
  },
  'dr-combo': {
    dataAttr: 'data-dr-combo',
    cardMod: 'dr-combo',
    jsonClass: 'dr-variants-json',
    preClass: 'dr-tokens-pre',
    selectAttr: 'data-dr-variant-select',
    selIdPrefix: 'dr-site-preset',
    pickLabel: 'DR site preset',
    failHint: '(one or more presets)'
  },
  'wild-combo': {
    dataAttr: 'data-wild-combo',
    cardMod: 'wild-combo',
    jsonClass: 'wild-variants-json',
    preClass: 'wild-tokens-pre',
    selectAttr: 'data-wild-variant-select',
    selIdPrefix: 'wild-scheme-preset',
    pickLabel: 'Wild scheme',
    failHint: '(one or more schemes)'
  },
  'terminal-combo': {
    dataAttr: 'data-terminal-combo',
    cardMod: 'terminal-combo',
    jsonClass: 'terminal-variants-json',
    preClass: 'terminal-tokens-pre',
    selectAttr: 'data-terminal-variant-select',
    selIdPrefix: 'terminal-scheme-preset',
    pickLabel: 'Terminal-inspired scheme',
    failHint: '(one or more schemes)'
  }
};

function renderVariantComboCard(t, siteEmbed = false, sec = null) {
  const cfg = VARIANT_COMBO_CFG[t._kind];
  if (!cfg) {
    throw new Error('renderVariantComboCard: unknown _kind ' + String(t._kind));
  }
  const anyFailed = t._failed;
  const v0 = t._processedVariants[0];
  const d0 = themeWorstLcDual(v0.light, v0.dark);
  const dualHint =
    ' · min Lc sRGB ' +
    d0.srgb.toFixed(0) +
    ' · P3 ' +
    d0.p3.toFixed(0);
  const status = anyFailed
    ? '<span class="badge fail">below Lc ' + MIN_LC + dualHint + ' ' + cfg.failHint + '</span>'
    : '<span class="badge ok">APCA ≥ ' + MIN_LC + dualHint + '</span>';

  const variantsPayload = t._processedVariants.map((v) => ({
    lightStyle: varsToInlineStyle(v.light),
    darkStyle: varsToInlineStyle(v.dark),
    tokensText: tokensToJonplummerPasteBlock(v.light, v.dark)
  }));
  const safeJson = JSON.stringify(variantsPayload).replace(/</g, '\\u003c');

  const selId = `${cfg.selIdPrefix}-${escapeHtml(t.id)}`;
  const options = t._processedVariants
    .map((v, i) => `<option value="${i}">${escapeHtml(v.radioLabel)}</option>`)
    .join('');

  const sl0 = varsToInlineStyle(v0.light);
  const sd0 = varsToInlineStyle(v0.dark);

  const ariaPick = escapeHtml(cfg.pickLabel);
  const jsonClass = cfg.jsonClass;
  const preClass = cfg.preClass;
  const dataAttr = cfg.dataAttr;
  const cardMod = cfg.cardMod;
  const selectAttr = cfg.selectAttr;

  if (siteEmbed) {
    const h1 = escapeHtml(siteEmbedVisibleHeading(t, sec));
    return `
<section class="gallery-card gallery-card--${cardMod}" ${dataAttr} data-theme-id="${escapeHtml(t.id)}">
  <script type="application/json" class="${jsonClass}">${safeJson}</script>
  <header class="gallery-card-head">
    <h1 class="gallery-card-title">${h1}</h1>
    ${status}
  </header>
  <div class="bw-variant-pick">
    <select id="${selId}" class="bw-variant-select" ${selectAttr} aria-label="${ariaPick}">
      ${options}
    </select>
  </div>
  <div class="row">
    ${renderHomePreview(sl0, 'Light', `${t.id}-L`)}
    ${renderHomePreview(sd0, 'Dark', `${t.id}-D`)}
  </div>
  <details class="tokens">
    <summary>Copy tokens (jonplummer.css :root shape)</summary>
    <pre class="code ${preClass}">${escapeHtml(tokensToJonplummerPasteBlock(v0.light, v0.dark))}</pre>
  </details>
</section>`;
  }

  return `
<section class="card card--${cardMod}" ${dataAttr} data-theme-id="${escapeHtml(t.id)}">
  <script type="application/json" class="${jsonClass}">${safeJson}</script>
  <header class="card-h">
    <h2>${escapeHtml(t.label)}</h2>
    ${status}
  </header>
  <div class="bw-variant-pick">
    <select id="${selId}" class="bw-variant-select" ${selectAttr} aria-label="${ariaPick}">
      ${options}
    </select>
  </div>
  <div class="row">
    ${renderHomePreview(sl0, 'Light', `${t.id}-L`)}
    ${renderHomePreview(sd0, 'Dark', `${t.id}-D`)}
  </div>
  <details class="tokens">
    <summary>Copy tokens (jonplummer.css :root shape)</summary>
    <pre class="code ${preClass}">${escapeHtml(tokensToJonplummerPasteBlock(v0.light, v0.dark))}</pre>
  </details>
</section>`;
}

function renderHarmonyLabCard(t, siteEmbed = false, sec = null) {
  const p = t._payload;
  const td = p.tuningDefaults;
  const recipeOptions = p.recipes
    .map(
      (r) =>
        `<option value="${escapeHtml(r.id)}">${escapeHtml(r.label)}${r.passesApcaMin ? '' : ' (below Lc at build)'}</option>`
    )
    .join('');
  const safePayload = JSON.stringify(p).replace(/</g, '\\u003c');

  const r0 = p.recipes[0];
  const sl0 = varsToInlineStyle(
    Object.fromEntries(
      HARMONY_LAB_KEYS.map((k) => {
        const [l, c] = r0.light[k];
        const col = { mode: 'oklch', l, c, h: p.baseHue };
        return [k, col];
      })
    )
  );
  const sd0 = varsToInlineStyle(
    Object.fromEntries(
      HARMONY_LAB_KEYS.map((k) => {
        const [l, c] = r0.dark[k];
        const col = { mode: 'oklch', l, c, h: p.baseHue };
        return [k, col];
      })
    )
  );

  const initialLight = Object.fromEntries(
    HARMONY_LAB_KEYS.map((k) => {
      const [l, c] = r0.light[k];
      return [k, o(l, c, p.baseHue)];
    })
  );
  const initialDark = Object.fromEntries(
    HARMONY_LAB_KEYS.map((k) => {
      const [l, c] = r0.dark[k];
      return [k, o(l, c, p.baseHue)];
    })
  );
  const initialTokensPre = escapeHtml(tokensToJonplummerPasteBlock(initialLight, initialDark));

  const ledeHtml = siteEmbed
    ? 'Recipe, hue, and angle sliders (L/C from the nudged export). <code>themes.json</code> matches this selector after hide-failed.'
    : 'Pick a recipe, rotate hue, and tune only the angles that recipe uses (L/C stay from the APCA-nudged export). <code>themes.json</code> lists the same harmony recipes as this selector (after hide-failed), with <code>worstLcSrgb</code> and <code>worstLcP3</code> per entry.';
  const harmonyBody = `
  <p class="harmony-lab-lede">${ledeHtml}</p>
  <div class="harmony-lab-controls" role="group" aria-label="Harmony lab">
    <div class="harmony-lab-top">
      ${colorWheelHtml('harmony-color-wheel')}
      <div class="harmony-lab-stack">
        <select id="harmony-lab-recipe" class="harmony-recipe-select" aria-label="Harmony recipe">${recipeOptions}</select>
      </div>
      <div class="harmony-lab-stack harmony-lab-stack--hue">
        <label class="harmony-lab-label" for="harmony-lab-hue">Hue rotation</label>
        <div class="harmony-lab-inline">
          <input type="range" id="harmony-lab-hue" class="harmony-inp-hue" min="0" max="360" step="1" value="0" aria-valuemin="0" aria-valuemax="360" />
          <span class="harmony-lab-val harmony-val-hue">0°</span>
        </div>
      </div>
    </div>
    <div class="harmony-lab-tuning">
      <div class="harmony-lab-tuning-row" data-harmony-tuning="analogous" hidden="hidden">
        <label class="harmony-lab-label" for="harmony-lab-analogous">Analogous spread</label>
        <div class="harmony-lab-inline">
          <input type="range" id="harmony-lab-analogous" class="harmony-inp-a" min="6" max="55" step="1" value="${td.analogousSpread}" aria-valuemin="6" aria-valuemax="55" />
          <span class="harmony-lab-val harmony-val-a">${td.analogousSpread}°</span>
        </div>
      </div>
      <div class="harmony-lab-tuning-row" data-harmony-tuning="split" hidden="hidden">
        <label class="harmony-lab-label" for="harmony-lab-split">Split spread</label>
        <div class="harmony-lab-inline">
          <input type="range" id="harmony-lab-split" class="harmony-inp-s" min="12" max="48" step="1" value="${td.splitSpread}" aria-valuemin="12" aria-valuemax="48" />
          <span class="harmony-lab-val harmony-val-s">${td.splitSpread}°</span>
        </div>
      </div>
      <div class="harmony-lab-tuning-row" data-harmony-tuning="skew" hidden="hidden">
        <label class="harmony-lab-label" for="harmony-lab-skew">Harmony skew</label>
        <div class="harmony-lab-inline">
          <input type="range" id="harmony-lab-skew" class="harmony-inp-k" min="0" max="40" step="1" value="${td.harmonySkew}" aria-valuemin="0" aria-valuemax="40" />
          <span class="harmony-lab-val harmony-val-k">${td.harmonySkew}°</span>
        </div>
      </div>
    </div>
  </div>
  <div class="row">
    ${renderHomePreview(sl0, 'Light', 'harmony-lab-L')}
    ${renderHomePreview(sd0, 'Dark', 'harmony-lab-D')}
  </div>
  <details class="tokens">
    <summary>Copy tokens (jonplummer.css :root shape) — live preview</summary>
    <pre class="code harmony-lab-tokens-pre">${initialTokensPre}</pre>
  </details>`;

  if (siteEmbed) {
    const h1 = escapeHtml(siteEmbedVisibleHeading(t, sec));
    return `
<section class="gallery-card gallery-card--harmony-lab" data-harmony-lab data-theme-id="${escapeHtml(t.id)}">
  <script type="application/json" class="harmony-lab-json">${safePayload}</script>
  <header class="gallery-card-head">
    <h1 class="gallery-card-title">${h1}</h1>
    <span class="badge ok">${p.recipes.length} recipe${p.recipes.length === 1 ? '' : 's'} · L/C from nudged build</span>
  </header>${harmonyBody}
</section>`;
  }

  return `
<section class="card card--harmony-lab" data-harmony-lab data-theme-id="${escapeHtml(t.id)}">
  <script type="application/json" class="harmony-lab-json">${safePayload}</script>
  <header class="card-h">
    <h2>${escapeHtml(t.label)}</h2>
    <span class="badge ok">${p.recipes.length} recipe${p.recipes.length === 1 ? '' : 's'} · L/C from nudged build</span>
  </header>${harmonyBody}
</section>`;
}

function renderCard(t, failed, siteEmbed = false, sec = null) {
  const sl = varsToInlineStyle(t.light);
  const sd = varsToInlineStyle(t.dark);
  const dual = themeWorstLcDual(t.light, t.dark);
  const dualHint =
    ' · min Lc sRGB ' + dual.srgb.toFixed(0) + ' · P3 ' + dual.p3.toFixed(0);
  const status = failed
    ? '<span class="badge fail">below Lc ' + MIN_LC + dualHint + '</span>'
    : '<span class="badge ok">APCA ≥ ' + MIN_LC + dualHint + '</span>';

  const hueNote = siteEmbed
    ? 'Shifts each <code>oklch()</code> hue; <strong>Copy tokens</strong> stays the build snapshot.'
    : 'Adds degrees to each <code>oklch()</code> hue (L and C unchanged). Copy tokens is still the nudged base from the build.';
  const hueInputId = `hue-rotate-${escapeHtml(t.id)}`;
  const hueBar = t._hueSlider
    ? `<div class="hue-rotate-bar" role="group" aria-label="Preview hue rotation">
    <div class="hue-rotate-bar-grid">
      ${colorWheelHtml()}
      <div class="hue-rotate-stack">
        <label class="hue-rotate-label" for="${hueInputId}">Preview hue rotation</label>
        <div class="hue-rotate-inline">
          <input type="range" id="${hueInputId}" class="hue-rotate-input" min="0" max="360" value="0" step="1" aria-valuemin="0" aria-valuemax="360" aria-valuenow="0" />
          <span class="hue-rotate-value" aria-hidden="true">0°</span>
        </div>
      </div>
    </div>
    <p class="hue-rotate-note">${hueNote}</p>
  </div>`
    : '';

  const hueSliderAttr = t._hueSlider ? ' data-hue-slider' : '';
  const heading = escapeHtml(siteEmbedVisibleHeading(t, sec));

  if (siteEmbed) {
    return `
<section class="gallery-card" data-theme-id="${escapeHtml(t.id)}"${hueSliderAttr}>
  <header class="gallery-card-head">
    <h1 class="gallery-card-title">${heading}</h1>
    ${status}
  </header>
  ${hueBar}
  <div class="row">
    ${renderHomePreview(sl, 'Light', `${t.id}-L`)}
    ${renderHomePreview(sd, 'Dark', `${t.id}-D`)}
  </div>
  <details class="tokens">
    <summary>Copy tokens (jonplummer.css :root shape)</summary>
    <pre class="code">${escapeHtml(tokensToJonplummerPasteBlock(t.light, t.dark))}</pre>
  </details>
</section>`;
  }

  return `
<section class="card" data-theme-id="${escapeHtml(t.id)}"${hueSliderAttr}>
  <header class="card-h">
    <h2>${escapeHtml(t.label)}</h2>
    ${status}
  </header>
  ${hueBar}
  <div class="row">
    ${renderHomePreview(sl, 'Light', `${t.id}-L`)}
    ${renderHomePreview(sd, 'Dark', `${t.id}-D`)}
  </div>
  <details class="tokens">
    <summary>Copy tokens (jonplummer.css :root shape)</summary>
    <pre class="code">${escapeHtml(tokensToJonplummerPasteBlock(t.light, t.dark))}</pre>
  </details>
</section>`;
}

function renderGallerySections(sectionList, options = {}) {
  const siteEmbed = options.siteEmbed === true;
  if (siteEmbed) {
    const blocks = [];
    for (const sec of sectionList) {
      if (sec.themes.length === 0) continue;
      for (const t of sec.themes) {
        if (
          t._kind === 'bw-combo' ||
          t._kind === 'dr-combo' ||
          t._kind === 'wild-combo' ||
          t._kind === 'terminal-combo'
        ) {
          blocks.push(renderVariantComboCard(t, true, sec));
        } else if (t._kind === 'harmony-lab') blocks.push(renderHarmonyLabCard(t, true, sec));
        else blocks.push(renderCard(t, t._failed, true, sec));
      }
    }
    return `<div class="gallery-section-cards">\n${blocks.join('\n')}\n</div>`;
  }
  return sectionList
    .map((sec) => {
      if (sec.themes.length === 0) return '';
      const headingId = 'gallery-section-' + sec.slug;
      const cards = sec.themes
        .map((t) => {
          if (
            t._kind === 'bw-combo' ||
            t._kind === 'dr-combo' ||
            t._kind === 'wild-combo' ||
            t._kind === 'terminal-combo'
          ) {
            return renderVariantComboCard(t, false);
          }
          if (t._kind === 'harmony-lab') return renderHarmonyLabCard(t, false);
          return renderCard(t, t._failed, false);
        })
        .join('\n');
      return `<details class="gallery-section-details" open aria-labelledby="${headingId}">
  <summary class="gallery-section-summary">
    <h2 class="gallery-section-h" id="${headingId}">${escapeHtml(sec.title)}</h2>
  </summary>
  <div class="gallery-section-inner">
    <div class="gallery-section-cards">
${cards}
    </div>
  </div>
</details>`;
    })
    .join('\n');
}

function renderHtml(visibleSections, meta, options = {}) {
  const siteEmbed = options.siteEmbed === true;
  const bodyContent = renderGallerySections(visibleSections, { siteEmbed });
  const embedHeaderHtml = siteEmbed
    ? ''
    : `  <!-- Regenerate: pnpm run color-gallery -->
  <h2 class="page-title">Color theme gallery</h2>
  <p class="meta">${escapeHtml(meta)}</p>
  <p class="meta" style="margin-top:-0.75rem">Previews load <code>src/assets/css/jonplummer.css</code> via a relative URL — open this file from the repo (<code>scripts/color-explore/output/index.html</code>) so styles resolve. Each block heading toggles expand/collapse. Live gallery: <a href="https://jonplummer.com/color/">/color</a>. Other tools: <a href="../../font-explore/output/index.html">Font stack output</a> · <a href="https://jonplummer.com/type/">/type</a> · <a href="https://jonplummer.com/ogimages/">/ogimages</a>.</p>
`;
  return `<!DOCTYPE html>
<html lang="en" class="gallery-ui">
<head>
  <meta charset="utf-8">
  <title>Color theme gallery</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- Same stylesheet as the site; color tokens overridden per .theme-root -->
  <link rel="stylesheet" href="../../../src/assets/css/jonplummer.css">
  <style>
    /* Gallery chrome: match live site tokens from jonplummer.css (:root + color-scheme). */
    html.gallery-ui {
      width: 100%;
      overflow-x: hidden;
    }
    body.gallery-ui {
      margin: 0;
      padding: 1.25rem clamp(1rem, 3vw, 2rem);
      background: var(--background-color);
      color: var(--text-color);
      font-family: var(--font-family);
      max-width: none;
      width: 100%;
      box-sizing: border-box;
    }
    .gallery-ui {
      --gallery-panel-bg: color-mix(in oklch, var(--content-background-color) 88%, var(--text-color) 12%);
      --gallery-code-bg: color-mix(in oklch, var(--content-background-color) 78%, var(--text-color) 22%);
    }
    .gallery-ui h2.page-title { margin-top: 0; font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); }
    .gallery-ui .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    .gallery-ui .meta { color: var(--text-color-light); font-size: 0.9rem; margin-bottom: 1.5rem; max-width: 62rem; line-height: 1.45; }
    .gallery-ui .meta a { color: var(--link-color); }
    .gallery-ui .meta a:hover { color: var(--link-hover-color); text-decoration: underline; }
    .gallery-ui .gallery-section-details {
      margin-bottom: 1.75rem;
      width: 100%;
      box-sizing: border-box;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--content-background-color);
      overflow: hidden;
    }
    .gallery-ui .gallery-section-summary {
      list-style: none;
      cursor: pointer;
      padding: 0.65rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      user-select: none;
    }
    .gallery-ui .gallery-section-summary::-webkit-details-marker,
    .gallery-ui .tokens summary::-webkit-details-marker {
      display: none;
    }
    /* Isosceles right triangle: 90° at tip; closed → tip right, open → rotate 90° → tip down */
    .gallery-ui .gallery-section-summary::before,
    .gallery-ui .tokens summary::before {
      content: '';
      flex-shrink: 0;
      width: 0.45rem;
      height: 0.9rem;
      display: block;
      background-color: color-mix(in oklch, var(--text-color-light) 85%, var(--content-background-color));
      clip-path: polygon(100% 50%, 0 0, 0 100%);
      transition: transform 0.18s ease;
      /* Centroid of the triangle (~33% 50%): rotates without drifting up like tip-pivot (100% 50%) */
      transform-origin: 33.333% 50%;
    }
    .gallery-ui .gallery-section-details[open] > .gallery-section-summary::before,
    .gallery-ui .tokens[open] > summary::before {
      transform: rotate(90deg);
    }
    .gallery-ui .gallery-section-h {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text-color);
      margin: 0;
      padding: 0;
      border: none;
      letter-spacing: 0.02em;
      flex: 1;
    }
    .gallery-ui .gallery-section-inner {
      padding: 0 1rem 1rem;
      box-sizing: border-box;
    }
    .gallery-ui .gallery-section-cards {
      display: grid;
      gap: 1.75rem;
      width: 100%;
      max-width: none;
      margin-inline: 0;
      box-sizing: border-box;
    }
    .gallery-ui .card,
    .gallery-ui .gallery-card { border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; background: var(--gallery-panel-bg); width: 100%; box-sizing: border-box; }
    .gallery-ui .card-h,
    .gallery-ui .gallery-card-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
    .gallery-ui .card-h h1,
    .gallery-ui .card-h h2 { margin: 0; font-size: 1rem; color: var(--text-color); }
    .gallery-ui .gallery-card-title {
      margin: 0;
      color: var(--text-color);
      font-size: var(--font-size-2xl);
      line-height: var(--line-height-2xl);
      font-weight: var(--font-weight-semibold);
      letter-spacing: var(--letter-spacing-tight);
    }
    .gallery-ui .hue-rotate-bar {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      align-items: stretch;
      margin-bottom: 0.75rem;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 0;
    }
    .gallery-ui .hue-rotate-stack {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      min-width: 0;
    }
    .gallery-ui .hue-rotate-label {
      font-size: 0.78rem;
      color: var(--text-color-light);
      margin: 0;
    }
    .gallery-ui .hue-rotate-inline {
      display: grid;
      grid-template-columns: 1fr auto;
      column-gap: 0.65rem;
      align-items: center;
      width: 100%;
      max-width: min(22rem, 100%);
    }
    .gallery-ui .hue-rotate-inline .hue-rotate-input {
      width: 100%;
      min-width: 0;
      vertical-align: middle;
    }
    .gallery-ui .hue-rotate-value {
      font-size: 0.8rem;
      color: var(--text-color-light);
      font-variant-numeric: tabular-nums;
      min-width: 2.5rem;
      text-align: end;
    }
    .gallery-ui .hue-rotate-note {
      margin: 0;
      font-size: 0.72rem;
      line-height: 1.4;
      color: var(--text-color-light);
    }
    .gallery-ui .hue-rotate-note code { font-size: 0.68rem; }
    .gallery-ui .hue-rotate-bar-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.65rem 1rem;
      align-items: center;
    }
    @media (max-width: 30rem) {
      .gallery-ui .hue-rotate-bar-grid {
        grid-template-columns: 1fr;
      }
      .gallery-ui .hue-rotate-bar-grid > .color-wheel {
        justify-self: center;
      }
    }
    /* Avoid min(..., 100%) width: in a grid auto track the percentage base is cyclic and
       intrinsic min-content can resolve to 0, collapsing the wheel (Chrome/Safari). */
    .gallery-ui .color-wheel {
      --color-wheel-size: clamp(4rem, 28vw, 5.75rem);
      position: relative;
      width: var(--color-wheel-size);
      aspect-ratio: 1;
      flex-shrink: 0;
      --color-wheel-ring-r: calc(var(--color-wheel-size) * 0.34);
    }
    .gallery-ui .color-wheel-disk {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 1px solid color-mix(in oklch, var(--border-color) 88%, transparent);
      box-sizing: border-box;
      background: ${colorWheelDiskBackground()};
    }
    .gallery-ui .color-wheel-dots {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .gallery-ui .color-wheel-dot {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 0.65rem;
      height: 0.65rem;
      margin: -0.325rem 0 0 -0.325rem;
      border: 2px solid #fff;
      border-radius: 50%;
      box-sizing: border-box;
      background: #fff;
      box-shadow:
        0 0 0 1px color-mix(in oklch, var(--text-color) 55%, transparent),
        0 0.06rem 0.12rem color-mix(in oklch, var(--text-color) 35%, transparent);
      transform: rotate(calc((var(--dot-h) - 90) * 1deg)) translateY(calc(-1 * var(--color-wheel-ring-r)));
      transform-origin: center center;
    }
    .gallery-ui .color-wheel-dot--primary {
      width: 0.8rem;
      height: 0.8rem;
      margin: -0.4rem 0 0 -0.4rem;
      border-width: 2.5px;
    }
    .gallery-ui .harmony-color-wheel .color-wheel-dot--multi {
      width: 0.5rem;
      height: 0.5rem;
      margin: -0.25rem 0 0 -0.25rem;
      border-width: 2px;
    }
    .gallery-ui .bw-variant-pick {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem 1rem;
      margin-bottom: 0.75rem;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 0;
    }
    .gallery-ui .harmony-lab-lede {
      margin: 0 0 0.65rem;
      font-size: 0.8rem;
      line-height: 1.45;
      color: var(--text-color-light);
    }
    .gallery-ui .harmony-lab-lede code { font-size: 0.72rem; }
    .gallery-ui .harmony-lab-controls {
      margin-bottom: 0.75rem;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 0;
    }
    .gallery-ui .harmony-lab-top {
      display: grid;
      grid-template-columns: auto minmax(0, min(22rem, 100%)) minmax(12rem, 1fr);
      gap: 0.75rem 1.5rem;
      align-items: end;
      margin-bottom: 0.75rem;
    }
    @media (max-width: 42rem) {
      .gallery-ui .harmony-lab-top {
        grid-template-columns: 1fr;
        justify-items: stretch;
      }
      .gallery-ui .harmony-lab-top > .harmony-color-wheel {
        justify-self: center;
      }
    }
    .gallery-ui .harmony-lab-stack {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      min-width: 0;
    }
    .gallery-ui .harmony-lab-label {
      font-size: 0.78rem;
      color: var(--text-color-light);
      margin: 0;
    }
    .gallery-ui .harmony-lab-stack .harmony-recipe-select {
      width: 100%;
      max-width: 22rem;
    }
    /* [hidden] on rows is defeated if we set display:flex without this (HTML5 hidden + author CSS). */
    .gallery-ui .harmony-lab-tuning-row[hidden] {
      display: none !important;
    }
    .gallery-ui .harmony-lab-inline {
      display: grid;
      grid-template-columns: 1fr auto;
      column-gap: 0.65rem;
      align-items: center;
      width: 100%;
      max-width: min(22rem, 100%);
      min-width: 0;
    }
    .gallery-ui .harmony-lab-inline input[type="range"] {
      width: 100%;
      min-width: 0;
      margin: 0;
    }
    .gallery-ui .harmony-lab-inline .harmony-lab-val {
      justify-self: end;
      text-align: end;
    }
    .gallery-ui .harmony-lab-tuning {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: stretch;
    }
    .gallery-ui .harmony-lab-tuning-row {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      min-width: 0;
      width: 100%;
    }
    .gallery-ui .harmony-recipe-select,
    .gallery-ui .bw-variant-select {
      width: 100%;
      max-width: 22rem;
      font-size: 0.8rem;
      padding: 0.25rem 0.35rem;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      background: var(--gallery-panel-bg);
      color: var(--text-color);
    }
    .gallery-ui .harmony-lab-val {
      font-size: 0.72rem;
      color: var(--text-color-light);
      font-variant-numeric: tabular-nums;
    }
    .gallery-ui .badge { font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px; }
    .gallery-ui .badge.ok { background: #1b4332; color: #b7e4c7; }
    .gallery-ui .badge.fail { background: #5c1010; color: #ffc9c9; }
    .gallery-ui .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem 1.25rem;
      align-items: start;
    }
    .gallery-ui .preview-column {
      min-width: 0;
      width: 100%;
    }
    @media (max-width: 52rem) { .gallery-ui .row { grid-template-columns: 1fr; } }
    .gallery-ui .col-label {
      display: block;
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-color-light);
      margin-bottom: 0.35rem;
    }
    .gallery-ui .tokens { margin-top: 0.75rem; }
    .gallery-ui .tokens summary {
      cursor: pointer;
      font-size: 0.85rem;
      color: var(--text-color-light);
      list-style: none;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      user-select: none;
    }
    /* Site summary::after (Show text / Hide text) — gallery uses triangle carets only */
    .gallery-ui .tokens summary::after,
    .gallery-ui .tokens details[open] > summary::after,
    .gallery-ui .gallery-section-summary::after,
    .gallery-ui .gallery-section-details[open] > .gallery-section-summary::after {
      content: none !important;
    }
    .gallery-ui .code { font-size: 0.65rem; overflow: auto; max-height: 12rem; background: var(--gallery-code-bg); padding: 0.5rem; border-radius: 4px; color: var(--text-color); border: 1px solid var(--border-color); }

    /*
      Mimic body > header, main, footer bands (jonplummer uses body>header selector;
      previews live under .jp-page so we repeat the band rules here).
    */
    .theme-root.home-preview {
      width: 100%;
      /* Bands use full jp-page width (avoid var(--max-width) from site :root / 66rem). */
      --max-width: none;
      --font-size-3xl: 1.35rem;
      --line-height-3xl: 1.15;
      --font-size-2xl: 1.125rem;
      --line-height-2xl: 1.22;
      --font-size-xl: 1.05rem;
      --line-height-xl: 1.2;
      --font-size-lg: 1rem;
      --line-height-lg: 1.25;
      --font-size-md: 0.9375rem;
      --line-height-md: 1.3;
      --font-size-xs: 0.7rem;
      --line-height-xs: 1.35;
      --gutter: 0.65rem;
      --spacing-xs: 0.35rem;
      --spacing-sm: 0.5rem;
      --spacing-md: 0.65rem;
      --spacing-lg: 0.75rem;
      --spacing-xl: 0.85rem;
      --spacing-ex: 3ex;
      --paragraph-spacing: 0.55em;
      --text-size: 13px;
      --line-height: 1.45;
    }
    /*
      On the live site, body uses --background-color; header/main/footer bands use
      --content-background-color. Side gutters only appear when the viewport is wider
      than --max-width — padding here forces the same frame in narrow preview columns.
    */
    .theme-root.home-preview .jp-page {
      margin: 0;
      background-color: var(--background-color);
      color: var(--text-color);
      overflow: hidden;
      border-radius: 6px;
      border: 1px solid color-mix(in srgb, var(--border-color) 70%, transparent);
      box-shadow: 0 1px 8px rgba(0,0,0,0.12);
      padding: 0.55rem 1.1rem 0.65rem;
    }
    .theme-root.home-preview .swatch-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem 0.75rem;
      margin-top: 0.4rem;
      font-size: 0.62rem;
      line-height: 1.3;
      color: var(--text-color-light);
    }
    .theme-root.home-preview .swatch-legend .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }
    .theme-root.home-preview .swatch-legend code {
      font-size: 0.58rem;
      opacity: 0.92;
    }
    .theme-root.home-preview .chip-swatch {
      width: 1.1rem;
      height: 1.1rem;
      border-radius: 2px;
      border: 1px solid color-mix(in srgb, var(--border-color) 85%, transparent);
      flex-shrink: 0;
      display: inline-block;
      vertical-align: middle;
    }
    .theme-root.home-preview .jp-page > header,
    .theme-root.home-preview .jp-page > .gallery-preview-main,
    .theme-root.home-preview .jp-page > footer {
      margin: 0;
      padding: var(--gutter);
      max-width: none !important;
      width: 100% !important;
      box-sizing: border-box;
      background-color: var(--content-background-color);
    }
    /*
      Site article grid is 1fr + 2fr (date | body), so prose only used ~⅔ of the band.
      Stack like the narrow breakpoint so previews use the full content width.
    */
    .theme-root.home-preview article:not(.link-item) {
      grid-template-columns: 1fr !important;
      grid-template-areas:
        "a"
        "b"
        "c" !important;
    }
    .theme-root.home-preview article.link-item {
      grid-template-columns: 1fr !important;
      grid-template-areas: "c" !important;
    }
    /*
      Default pre is block-level + max-width 100%, so a one-line snippet still reads as a
      full-width slab (--background-color). Shrink-wrap so prose vs code balance matches
      how you scan real posts.
    */
    .theme-root.home-preview article section pre {
      width: fit-content;
      max-width: 100%;
      box-sizing: border-box;
    }
    /* Simulated visited (file:// previews rarely have :visited match) */
    .theme-root.home-preview a.sim-visited {
      color: var(--link-visited-color);
    }
  </style>
</head>
<body class="gallery-ui">
${embedHeaderHtml}${bodyContent}
  <script>
(function () {
  var JONPLUMMER_PASTE_KEYS = ${JSON.stringify(JONPLUMMER_PASTE_KEYS)};
  var JONPLUMMER_PASTE_HEADER_LINES = ${JSON.stringify(JONPLUMMER_PASTE_HEADER_LINES)};
  function rotateOklchInStyle(styleStr, deltaDeg) {
    var d = Number(deltaDeg) || 0;
    return styleStr.replace(/oklch\\(\\s*([\\d.]+)\\s+([\\d.]+)\\s+([-+]?[\\d.]+)\\s*\\)/gi, function (_, l, c, h) {
      var nh = (parseFloat(h) + d + 360) % 360;
      var hr = Math.round(nh * 10) / 10;
      return 'oklch(' + l + ' ' + c + ' ' + hr + ')';
    });
  }
  document.querySelectorAll('[data-hue-slider]').forEach(function (section) {
    var previews = section.querySelectorAll('.theme-root.home-preview');
    previews.forEach(function (el) {
      el.dataset.originalStyle = el.getAttribute('style') || '';
    });
    var input = section.querySelector('.hue-rotate-input');
    var valueOut = section.querySelector('.hue-rotate-value');
    var wheelDots = section.querySelector('.color-wheel-dots');
    if (!input) return;
    function normHuePreview(h) {
      return ((h % 360) + 360) % 360;
    }
    function syncHueWheel() {
      if (!wheelDots) return;
      var nh = normHuePreview(Number(input.value) || 0);
      wheelDots.innerHTML =
        '<span class="color-wheel-dot color-wheel-dot--primary" style="--dot-h:' +
        nh +
        '"></span>';
    }
    function apply() {
      var shift = Number(input.value) || 0;
      input.setAttribute('aria-valuenow', String(Math.round(shift)));
      if (valueOut) valueOut.textContent = Math.round(shift) + '°';
      previews.forEach(function (el) {
        var base = el.dataset.originalStyle || '';
        el.setAttribute('style', rotateOklchInStyle(base, shift));
      });
      syncHueWheel();
    }
    input.addEventListener('input', apply);
    syncHueWheel();
  });

  document.querySelectorAll('[data-bw-combo]').forEach(function (section) {
    var jsonEl = section.querySelector('.bw-variants-json');
    if (!jsonEl) return;
    var variants;
    try {
      variants = JSON.parse(jsonEl.textContent);
    } catch (e) {
      return;
    }
    var previews = section.querySelectorAll('.theme-root.home-preview');
    var lightEl = previews[0];
    var darkEl = previews[1];
    var pre = section.querySelector('.bw-tokens-pre');
    if (!lightEl || !darkEl) return;
    function applyIdx(i) {
      var v = variants[i];
      if (!v) return;
      lightEl.setAttribute('style', v.lightStyle);
      darkEl.setAttribute('style', v.darkStyle);
      lightEl.dataset.originalStyle = v.lightStyle;
      darkEl.dataset.originalStyle = v.darkStyle;
      if (pre) pre.textContent = v.tokensText;
    }
    var bwSel = section.querySelector('[data-bw-variant-select]');
    if (bwSel) {
      bwSel.addEventListener('change', function () {
        applyIdx(Number(bwSel.value));
      });
    }
    applyIdx(0);
  });

  document.querySelectorAll('[data-dr-combo]').forEach(function (section) {
    var jsonEl = section.querySelector('.dr-variants-json');
    if (!jsonEl) return;
    var variants;
    try {
      variants = JSON.parse(jsonEl.textContent);
    } catch (e) {
      return;
    }
    var previews = section.querySelectorAll('.theme-root.home-preview');
    var lightEl = previews[0];
    var darkEl = previews[1];
    var pre = section.querySelector('.dr-tokens-pre');
    if (!lightEl || !darkEl) return;
    function applyIdxDr(i) {
      var v = variants[i];
      if (!v) return;
      lightEl.setAttribute('style', v.lightStyle);
      darkEl.setAttribute('style', v.darkStyle);
      lightEl.dataset.originalStyle = v.lightStyle;
      darkEl.dataset.originalStyle = v.darkStyle;
      if (pre) pre.textContent = v.tokensText;
    }
    var drSel = section.querySelector('[data-dr-variant-select]');
    if (drSel) {
      drSel.addEventListener('change', function () {
        applyIdxDr(Number(drSel.value));
      });
    }
    applyIdxDr(0);
  });

  document.querySelectorAll('[data-wild-combo]').forEach(function (section) {
    var jsonEl = section.querySelector('.wild-variants-json');
    if (!jsonEl) return;
    var variants;
    try {
      variants = JSON.parse(jsonEl.textContent);
    } catch (e) {
      return;
    }
    var previews = section.querySelectorAll('.theme-root.home-preview');
    var lightEl = previews[0];
    var darkEl = previews[1];
    var pre = section.querySelector('.wild-tokens-pre');
    if (!lightEl || !darkEl) return;
    function applyWild(i) {
      var v = variants[i];
      if (!v) return;
      lightEl.setAttribute('style', v.lightStyle);
      darkEl.setAttribute('style', v.darkStyle);
      lightEl.dataset.originalStyle = v.lightStyle;
      darkEl.dataset.originalStyle = v.darkStyle;
      if (pre) pre.textContent = v.tokensText;
    }
    var sel = section.querySelector('[data-wild-variant-select]');
    if (sel) {
      sel.addEventListener('change', function () {
        applyWild(Number(sel.value));
      });
    }
    applyWild(0);
  });

  document.querySelectorAll('[data-terminal-combo]').forEach(function (section) {
    var jsonEl = section.querySelector('.terminal-variants-json');
    if (!jsonEl) return;
    var variants;
    try {
      variants = JSON.parse(jsonEl.textContent);
    } catch (e) {
      return;
    }
    var previews = section.querySelectorAll('.theme-root.home-preview');
    var lightEl = previews[0];
    var darkEl = previews[1];
    var pre = section.querySelector('.terminal-tokens-pre');
    if (!lightEl || !darkEl) return;
    function applyTerm(i) {
      var v = variants[i];
      if (!v) return;
      lightEl.setAttribute('style', v.lightStyle);
      darkEl.setAttribute('style', v.darkStyle);
      lightEl.dataset.originalStyle = v.lightStyle;
      darkEl.dataset.originalStyle = v.darkStyle;
      if (pre) pre.textContent = v.tokensText;
    }
    var tsel = section.querySelector('[data-terminal-variant-select]');
    if (tsel) {
      tsel.addEventListener('change', function () {
        applyTerm(Number(tsel.value));
      });
    }
    applyTerm(0);
  });

  document.querySelectorAll('[data-harmony-lab]').forEach(function (section) {
    var jsonEl = section.querySelector('.harmony-lab-json');
    if (!jsonEl) return;
    var payload;
    try {
      payload = JSON.parse(jsonEl.textContent);
    } catch (e) {
      return;
    }
    var previews = section.querySelectorAll('.theme-root.home-preview');
    var lightEl = previews[0];
    var darkEl = previews[1];
    var pre = section.querySelector('.harmony-lab-tokens-pre');
    var sel = section.querySelector('.harmony-recipe-select');
    var inpA = section.querySelector('.harmony-inp-a');
    var inpS = section.querySelector('.harmony-inp-s');
    var inpK = section.querySelector('.harmony-inp-k');
    var inpHue = section.querySelector('.harmony-inp-hue');
    var valA = section.querySelector('.harmony-val-a');
    var valS = section.querySelector('.harmony-val-s');
    var valK = section.querySelector('.harmony-val-k');
    var valHue = section.querySelector('.harmony-val-hue');
    var wrapA = section.querySelector('[data-harmony-tuning="analogous"]');
    var wrapS = section.querySelector('[data-harmony-tuning="split"]');
    var wrapK = section.querySelector('[data-harmony-tuning="skew"]');
    var harmonyWheelDots = section.querySelector('.harmony-color-wheel .color-wheel-dots');

    var NEUTRAL_KEYS = [
      'content-background-color',
      'background-color',
      'text-color',
      'text-color-light',
      'border-color'
    ];
    var LINK_KEYS_ORDER = [
      ['link-color', 'link'],
      ['link-hover-color', 'hover'],
      ['link-visited-color', 'visited'],
      ['link-active-color', 'active']
    ];

    function clampDeg(value, min, max, fb) {
      var n = Number(value);
      if (!isFinite(n)) return fb;
      return Math.min(max, Math.max(min, n));
    }

    function normHue(h) {
      return ((h % 360) + 360) % 360;
    }

    function tuningSlidersForRecipe(recipeId) {
      return {
        a: recipeId === 'harmony-analogous',
        s:
          recipeId === 'harmony-split-complementary' ||
          recipeId === 'harmony-skewed-split-complementary',
        k:
          recipeId === 'harmony-skewed-triadic' ||
          recipeId === 'harmony-skewed-tetradic' ||
          recipeId === 'harmony-skewed-split-complementary'
      };
    }

    function setTuningVisibility(recipeId) {
      var vis = tuningSlidersForRecipe(recipeId);
      if (wrapA) wrapA.hidden = !vis.a;
      if (wrapS) wrapS.hidden = !vis.s;
      if (wrapK) wrapK.hidden = !vis.k;
    }

    function linkDeltas(recipeId, A, S, K) {
      var hk = Math.round(K / 2);
      var flank = Math.round(0.857 * A);
      switch (recipeId) {
        case 'harmony-monochromatic':
          return { link: 0, hover: 0, visited: 0, active: 0 };
        case 'harmony-analogous':
          return { link: A, hover: A + flank, visited: -flank, active: Math.round(1.429 * A) };
        case 'harmony-triadic':
          return { link: 120, hover: 240, visited: 120, active: 240 };
        case 'harmony-tetradic':
          return { link: 90, hover: 180, visited: 270, active: 135 };
        case 'harmony-skewed-triadic': {
          var a1 = 120 - K;
          var a2 = 240 - K;
          return { link: a1, hover: a2, visited: a1, active: a2 };
        }
        case 'harmony-skewed-tetradic':
          return { link: 90 - K, hover: 180 - K, visited: 270 - K, active: 135 - K };
        case 'harmony-complementary':
          return { link: 180, hover: 204, visited: 156, active: 192 };
        case 'harmony-split-complementary':
          return { link: 180 - S, hover: 180 + S, visited: 180 - S - 4, active: 180 + S - 12 };
        case 'harmony-skewed-split-complementary':
          return {
            link: 180 - S + hk,
            hover: 180 + S - hk,
            visited: 180 - S + hk - 4,
            active: 180 + S - hk - 4
          };
        default:
          return { link: 0, hover: 0, visited: 0, active: 0 };
      }
    }

    function markerHueDegrees(recipeId, baseHue, rot, A, S, K) {
      var hub = normHue(baseHue + rot);
      var d = linkDeltas(recipeId, A, S, K);
      var raw = [
        hub,
        normHue(hub + d.link),
        normHue(hub + d.hover),
        normHue(hub + d.visited),
        normHue(hub + d.active)
      ];
      var out = [];
      raw.forEach(function (x) {
        var k = Math.round(x * 10) / 10;
        var dup = false;
        for (var i = 0; i < out.length; i++) {
          if (Math.abs(out[i] - k) < 0.4) dup = true;
        }
        if (!dup) out.push(k);
      });
      return out;
    }

    function oklchCss(l, c, h) {
      var lr = Math.round(l * 1000) / 1000;
      var cr = Math.round(Math.max(0, c) * 10000) / 10000;
      var hr = Math.round(normHue(h) * 10) / 10;
      return 'oklch(' + lr + ' ' + cr + ' ' + hr + ')';
    }

    function buildSide(lcMap, baseH, rot, recipeId, A, S, K) {
      var hub = normHue(baseH + rot);
      var d = linkDeltas(recipeId, A, S, K);
      var parts = [];
      NEUTRAL_KEYS.forEach(function (k) {
        var pair = lcMap[k];
        if (!pair) return;
        parts.push('--' + k + ': ' + oklchCss(pair[0], pair[1], hub));
      });
      LINK_KEYS_ORDER.forEach(function (item) {
        var k = item[0];
        var dk = item[1];
        var pair = lcMap[k];
        if (!pair) return;
        parts.push('--' + k + ': ' + oklchCss(pair[0], pair[1], normHue(hub + d[dk])));
      });
      return parts.join('; ');
    }

    function oklchJonplummer(l, c, h) {
      var lp = Math.round(l * 100 * 10) / 10;
      var cr = Math.round(Math.max(0, c) * 10000) / 10000;
      var hr = Math.round(normHue(h) * 100) / 100;
      return 'oklch(' + lp + '% ' + cr + ' ' + hr + 'deg)';
    }

    function jonplummerPasteFromRecipe(recLight, recDark, baseH, rot, recipeId, A, S, K) {
      var hub = normHue(baseH + rot);
      var d = linkDeltas(recipeId, A, S, K);
      var lines = JONPLUMMER_PASTE_HEADER_LINES.slice();
      JONPLUMMER_PASTE_KEYS.forEach(function (k) {
        var lk = null;
        var dk = null;
        if (NEUTRAL_KEYS.indexOf(k) >= 0) {
          var pl = recLight[k];
          var pd = recDark[k];
          if (pl && pd) {
            lk = oklchJonplummer(pl[0], pl[1], hub);
            dk = oklchJonplummer(pd[0], pd[1], hub);
          }
        } else {
          var delta = 0;
          for (var li = 0; li < LINK_KEYS_ORDER.length; li++) {
            if (LINK_KEYS_ORDER[li][0] === k) {
              delta = d[LINK_KEYS_ORDER[li][1]];
              break;
            }
          }
          var pl2 = recLight[k];
          var pd2 = recDark[k];
          if (pl2 && pd2) {
            lk = oklchJonplummer(pl2[0], pl2[1], normHue(hub + delta));
            dk = oklchJonplummer(pd2[0], pd2[1], normHue(hub + delta));
          }
        }
        if (lk && dk) {
          lines.push('  --' + k + ': light-dark(' + lk + ', ' + dk + ');');
        }
      });
      return lines.join('\\n');
    }

    function apply() {
      if (!sel || !lightEl || !darkEl) return;
      var rid = sel.value;
      var rec = null;
      for (var i = 0; i < payload.recipes.length; i++) {
        if (payload.recipes[i].id === rid) {
          rec = payload.recipes[i];
          break;
        }
      }
      if (!rec) return;
      setTuningVisibility(rid);
      var A = clampDeg(inpA && inpA.value, 6, 55, 28);
      var S = clampDeg(inpS && inpS.value, 12, 48, 28);
      var K = clampDeg(inpK && inpK.value, 0, 40, 12);
      var rot = Number(inpHue && inpHue.value) || 0;
      if (valA) valA.textContent = Math.round(A) + '°';
      if (valS) valS.textContent = Math.round(S) + '°';
      if (valK) valK.textContent = Math.round(K) + '°';
      if (valHue) valHue.textContent = Math.round(normHue(rot)) + '°';
      if (inpHue) inpHue.setAttribute('aria-valuenow', String(Math.round(normHue(rot))));

      var sl = buildSide(rec.light, payload.baseHue, rot, rid, A, S, K);
      var sd = buildSide(rec.dark, payload.baseHue, rot, rid, A, S, K);
      lightEl.setAttribute('style', sl);
      darkEl.setAttribute('style', sd);
      if (pre) {
        pre.textContent = jonplummerPasteFromRecipe(
          rec.light,
          rec.dark,
          payload.baseHue,
          rot,
          rid,
          A,
          S,
          K
        );
      }

      if (harmonyWheelDots) {
        var hues = markerHueDegrees(rid, payload.baseHue, rot, A, S, K);
        var many = hues.length > 3;
        harmonyWheelDots.innerHTML = hues
          .map(function (h, i) {
            var cls = 'color-wheel-dot';
            if (many && i > 0) cls += ' color-wheel-dot--multi';
            else cls += ' color-wheel-dot--primary';
            return '<span class="' + cls + '" style="--dot-h:' + h + '"></span>';
          })
          .join('');
      }
    }

    [inpA, inpS, inpK, inpHue, sel].forEach(function (el) {
      if (el) el.addEventListener('input', apply);
    });
    if (sel) sel.addEventListener('change', apply);
    apply();
  });
})();
  </script>
</body>
</html>`;
}

function writeTextFileIfChanged(filePath, content) {
  try {
    if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8') === content) {
      return false;
    }
  } catch (_) {
    /* rewrite if unreadable */
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

/**
 * Writes `/color/` embed assets: scoped CSS (no `<style>` inside `<div>` for HTML validators) + inner markup read by `colorGalleryEmbed` shortcode.
 * Skips disk writes when content is unchanged (avoids Eleventy --watch loops from touching `src/`).
 */
function writeColorGalleryEmbedFiles(fullHtml) {
  const styleMatch = fullHtml.match(/<style>([\s\S]*?)<\/style>/);
  const bodyMatch = fullHtml.match(/<body class="gallery-ui">([\s\S]*?)<\/body>/i);
  if (!styleMatch || !bodyMatch) {
    return false;
  }
  let css = styleMatch[1];
  css = css
    .replace(/html\.gallery-ui/g, '.color-gallery-embed')
    .replace(/body\.gallery-ui/g, '.color-gallery-embed')
    .replace(/\.gallery-ui/g, '.color-gallery-embed');

  const inner = bodyMatch[1].trim();

  const scriptSplit = inner.split(/(?=<script>)/i);
  const bodyNoScripts = scriptSplit[0].trimEnd();
  const scripts = scriptSplit.slice(1).join('').trim();

  const innerHtml = `<div class="color-gallery-embed color-gallery-embed--site">\n${bodyNoScripts}\n${scripts}\n</div>\n`;

  const cssHeader =
    '/* Generated by scripts/color-explore/generate-gallery.js — not hand-edited. */\n/* stylelint-disable */\n';
  const cssChanged = writeTextFileIfChanged(
    SITE_COLOR_EMBED_CSS,
    `${cssHeader}${css.trim()}\n${SITE_EMBED_EXTRA_CSS}\n`
  );
  const innerChanged = writeTextFileIfChanged(SITE_COLOR_EMBED_INNER, innerHtml);
  return cssChanged || innerChanged;
}

/**
 * Build standalone + site embed gallery (defaults = CLI with no flags).
 * @param {Record<string, unknown>} [opts] — merged over {@link defaultGalleryBuildOptions}; set `quiet: true` to suppress logs.
 *   Set `stableWildThemes: true` when embedding from Eleventy so wild-pack `mathRnd` output is deterministic (avoids watch loops).
 */
function runColorGalleryBuild(opts = {}) {
  const o = { ...defaultGalleryBuildOptions(), ...opts };
  const step = o.step;
  const baseHue = o.baseHue;
  const randomN = o.randomN;
  const mono = o.monochrome;
  const hueSweep = o.hueSweep;
  const includeFailed = o.includeFailed;
  const noExtras = o.noExtras;
  const wildCount = o.wildCount;
  const quiet = o.quiet === true;
  const wildRng = o.stableWildThemes === true ? createStableRng(0x573111) : mathRnd;

  let hues;
  if (randomN > 0) {
    hues = [];
    for (let i = 0; i < randomN; i++) {
      hues.push(Math.random() * 360);
    }
  } else if (hueSweep) {
    hues = [];
    for (let h = 0; h < 360; h += step) {
      hues.push(h);
    }
  } else {
    const h0 = ((baseHue % 360) + 360) % 360;
    hues = [h0];
  }

  const enableHueSlider = randomN === 0 && !hueSweep && hues.length === 1;

  const harmonyBase = hues.length ? hues[0] : 0;

  const harmonyOpts = {
    analogousSpread: o.harmonyAnalogousSpread,
    splitSpread: o.harmonySplitSpread,
    harmonySkew: o.harmonySkew
  };

  /** @type {{ analogousSpread: number, splitSpread: number, harmonySkew: number } | null} */
  let harmonyTuningForJson = null;

  const rawSections = [
    {
      slug: 'hue-pack',
      title: huePackSectionTitle(mono, randomN, hueSweep),
      items: buildRawThemes(hues, mono, { enableHueSlider })
    }
  ];

  rawSections.splice(1, 0, {
    slug: 'dr-site',
    title: 'Dieter Rams-inspired',
    items: [buildDrComboRaw()]
  });

  if (!noExtras) {
    const harmonyBuilt = buildHarmonySchemes(harmonyBase, harmonyOpts);
    harmonyTuningForJson = harmonyBuilt.tuning;
    rawSections.push({
      slug: 'harmony-schemes',
      title: 'Harmony schemes',
      items: harmonyBuilt.themes
    });
    rawSections.push({
      slug: 'black-white',
      title: 'Black & white',
      items: [buildBlackWhiteComboRaw()]
    });
    if (wildCount > 0) {
      rawSections.push({
        slug: 'wild',
        title: 'Wild',
        items: [buildWildComboRaw(wildCount, wildRng)]
      });
    }
    rawSections.push({
      slug: 'terminal',
      title: 'Terminal-inspired',
      items: [buildTerminalComboRaw()]
    });
  }

  const processedSections = rawSections.map((sec) => ({
    slug: sec.slug,
    title: sec.title,
    themes: sec.items.map(processGalleryItem)
  }));

  const harmonyProcSec = processedSections.find((s) => s.slug === 'harmony-schemes');
  const harmonyExportThemes =
    harmonyProcSec != null
      ? harmonyProcSec.themes.filter((t) => themeVisibleInGallery(t, includeFailed))
      : [];
  const harmonySectionVisible =
    harmonyProcSec != null &&
    (includeFailed || harmonyExportThemes.length > 0);

  const visibleSections = processedSections
    .map((sec) => {
      if (sec.slug === 'harmony-schemes') {
        if (!harmonySectionVisible) {
          return { slug: sec.slug, title: sec.title, themes: [] };
        }
        return {
          slug: sec.slug,
          title: sec.title,
          themes: [
            {
              _kind: 'harmony-lab',
              id: 'harmony-lab',
              label: 'Harmony lab',
              _payload: buildHarmonyLabPayload(
                harmonyExportThemes,
                harmonyTuningForJson,
                harmonyBase
              )
            }
          ]
        };
      }
      return {
        slug: sec.slug,
        title: sec.title,
        themes: sec.themes.filter((t) => themeVisibleInGallery(t, includeFailed))
      };
    })
    .filter((sec) => sec.themes.length > 0);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const exportThemes = flattenThemesForExport(
    visibleSections,
    harmonyProcSec != null ? harmonyExportThemes : null
  );

  const themesJsonPayload = {
    generated: new Date().toISOString(),
    minLc: MIN_LC,
    tokenFormat: 'css-oklch',
    tokenSyntax:
      'Each color string is oklch(L C H): L 0–1, C chroma, H degrees (CSS Color 4 / baseline browsers). Use as --token: oklch(...) or inside light-dark().',
    apcaDual:
      'Each theme includes worstLcSrgb and worstLcP3 (minimum Lc across the same token pairs as pnpm run test color-contrast). sRGB path: culori toGamut("rgb") + apca-w3 sRGBtoY. P3 path: toGamut("p3") + displayP3toY. passesApcaMin uses the sRGB path only.',
    themes: exportThemes
  };
  if (harmonyTuningForJson) {
    themesJsonPayload.harmonyTuning = harmonyTuningForJson;
  }

  fs.writeFileSync(path.join(OUT_DIR, 'themes.json'), JSON.stringify(themesJsonPayload, null, 2), 'utf8');

  const extraBits = [];
  if (!noExtras) {
    extraBits.push(
      'harmony lab (9 JSON recipes) + 1× B&W (3 presets) + wild (scheme select) + terminal (scheme select)'
    );
    if (wildCount > 0) extraBits.push(`wild=${wildCount}`);
    if (
      harmonyTuningForJson &&
      (harmonyTuningForJson.analogousSpread !== 28 ||
        harmonyTuningForJson.splitSpread !== 28 ||
        harmonyTuningForJson.harmonySkew !== 12)
    ) {
      const ht = harmonyTuningForJson;
      extraBits.push(
        `harmony analogous=${ht.analogousSpread}° split=${ht.splitSpread}° skew=${ht.harmonySkew}°`
      );
    }
  } else {
    extraBits.push('extras off (--no-extras)');
  }
  const meta = [
    `Generated ${new Date().toISOString()}`,
    `Min APCA Lc: ${MIN_LC} (sRGB path; matches color-contrast test). Cards show min Lc sRGB vs P3.`,
    mono
      ? 'Mode: monochrome'
      : randomN > 0
        ? `Mode: random hue (${randomN})`
        : hueSweep
          ? `Mode: hue sweep step ${step}°`
          : `Mode: hue reference base ${Math.round(((baseHue % 360) + 360) % 360)}° + in-page rotation`,
    extraBits.join(', '),
    `${visibleSections.reduce((n, s) => n + s.themes.length, 0)} card(s) · ${exportThemes.length} JSON entries (${processedSections.reduce((n, s) => n + s.themes.length, 0)} generated before hide — use --include-failed to show failing)`,
    'Standalone file: open from repo for file:// CSS path. Live gallery: /color/. Promote winners to jonplummer.css.'
  ].join(' · ');

  const fullGalleryHtml = renderHtml(visibleSections, meta, { siteEmbed: false });
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), fullGalleryHtml, 'utf8');

  const siteEmbedGalleryHtml = renderHtml(visibleSections, meta, { siteEmbed: true });
  const embedTouched = writeColorGalleryEmbedFiles(siteEmbedGalleryHtml);
  if (!quiet && embedTouched) {
    console.log(`Wrote ${SITE_COLOR_EMBED_CSS}`);
    console.log(`Wrote ${SITE_COLOR_EMBED_INNER}`);
  }

  if (!quiet) {
    console.log(`Wrote ${path.join(OUT_DIR, 'index.html')}`);
    console.log(`Wrote ${path.join(OUT_DIR, 'themes.json')}`);
    console.log(
      `Gallery: ${visibleSections.reduce((n, s) => n + s.themes.length, 0)} card(s), themes.json: ${exportThemes.length} entries`
    );
  }
}

function main() {
  runColorGalleryBuild(galleryBuildOptionsFromProcessArgv());
}

if (require.main === module) {
  main();
}

module.exports = {
  runColorGalleryBuild,
  defaultGalleryBuildOptions,
  galleryBuildOptionsFromProcessArgv
};
