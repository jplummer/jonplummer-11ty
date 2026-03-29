#!/usr/bin/env node
/**
 * OKLCH-based theme candidates + APCA nudging → static HTML gallery + themes.json
 *
 * Usage:
 *   node scripts/color-explore/generate-gallery.js
 *   node scripts/color-explore/generate-gallery.js --hue-sweep --step 30   (multi-card wheel; default is one reference card + in-page hue slider)
 *   node scripts/color-explore/generate-gallery.js --base-hue 120
 *   node scripts/color-explore/generate-gallery.js --random 24
 *   node scripts/color-explore/generate-gallery.js --monochrome
 *   node scripts/color-explore/generate-gallery.js --include-failed
 *   node scripts/color-explore/generate-gallery.js --no-extras   (hue sweep / random / mono only)
 *   node scripts/color-explore/generate-gallery.js --wild 12
 *   node scripts/color-explore/generate-gallery.js --analogous-spread 36 --split-spread 32 --harmony-skew 8
 *   (Harmony: one “Harmony lab” card in HTML; themes.json still has one entry per recipe.)
 *
 * See docs/color-theme-exploration.md
 */

const fs = require('fs');
const path = require('path');
const { buildTerminalPresetThemes } = require('./terminal-presets.js');
const { calcAPCA } = require('apca-w3');
const { formatHex, parse, converter, toGamut } = require('culori');

const toOklch = converter('oklch');
const mapToRgbGamut = toGamut('rgb');

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

/** apca-w3 expects sRGB hex; gamut-map so wide-OKLCH tokens still get a metric. */
function oklchToHexForApca(color) {
  if (!color || color.mode !== 'oklch') return '#808080';
  return formatHex(mapToRgbGamut(color));
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

function o(l, c, h) {
  let hn = h;
  if (typeof hn !== 'number' || Number.isNaN(hn)) hn = 0;
  else hn = ((hn % 360) + 360) % 360;
  return { mode: 'oklch', l, c, h: hn };
}

const OUT_DIR = path.join(__dirname, 'output');

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

function clampHarmonyDeg(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function lc(fg, bg) {
  return Math.abs(calcAPCA(oklchToHexForApca(fg), oklchToHexForApca(bg)));
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

function rnd(a, b) {
  return a + Math.random() * (b - a);
}

/**
 * Higher chroma, complementary / triadic / neon recipes (not a hue sweep).
 */
function buildWildThemes(count) {
  const themes = [];
  for (let i = 0; i < count; i++) {
    const h = rnd(0, 360);
    const kind = i % 5;
    let label;
    let light;
    let dark;

    if (kind === 0) {
      const hOpp = (h + 180) % 360;
      label = `Wild · complementary (${Math.round(h)}°)`;
      const cBg = rnd(0.03, 0.1);
      const cHot = rnd(0.18, 0.32);
      light = {
        'content-background-color': o(rnd(0.97, 0.995), cBg * 0.5, h),
        'background-color': o(rnd(0.86, 0.93), cBg, h),
        'text-color': o(rnd(0.15, 0.26), rnd(0.02, 0.06), h),
        'text-color-light': o(rnd(0.38, 0.48), rnd(0.02, 0.05), h),
        'border-color': o(0.78, cBg * 0.6, h),
        'link-color': o(0.45, cHot, hOpp),
        'link-hover-color': o(0.38, cHot * 1.05, (hOpp + 25) % 360),
        'link-visited-color': o(0.4, cHot * 0.55, (h + 90) % 360),
        'link-active-color': o(0.48, cHot * 0.85, (h + 55) % 360)
      };
      dark = {
        'content-background-color': o(rnd(0.22, 0.3), cBg * 1.4, h),
        'background-color': o(rnd(0.1, 0.16), cBg * 1.2, h),
        'text-color': o(rnd(0.9, 0.96), rnd(0.02, 0.05), h),
        'text-color-light': o(rnd(0.72, 0.82), rnd(0.03, 0.07), h),
        'border-color': o(0.4, cBg, h),
        'link-color': o(0.72, cHot * 0.85, hOpp),
        'link-hover-color': o(0.8, cHot * 0.75, (hOpp + 30) % 360),
        'link-visited-color': o(0.68, cHot * 0.45, (h + 95) % 360),
        'link-active-color': o(0.76, cHot * 0.65, (h + 60) % 360)
      };
    } else if (kind === 1) {
      label = `Wild · neon dark (${Math.round(h)}°)`;
      const cAcc = rnd(0.2, 0.34);
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
      const cT = rnd(0.16, 0.28);
      light = {
        'content-background-color': o(0.985, rnd(0.02, 0.06), h),
        'background-color': o(0.9, rnd(0.04, 0.09), h),
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
      const cWash = rnd(0.08, 0.18);
      const cPop = rnd(0.22, 0.35);
      light = {
        'content-background-color': o(rnd(0.94, 0.99), cWash, h),
        'background-color': o(rnd(0.82, 0.9), cWash * 1.1, (h + 40) % 360),
        'text-color': o(0.18, rnd(0.05, 0.12), (h + 180) % 360),
        'text-color-light': o(0.4, rnd(0.04, 0.1), h),
        'border-color': o(0.75, cWash * 0.7, h),
        'link-color': o(0.46, cPop, (h + 160) % 360),
        'link-hover-color': o(0.4, cPop, (h + 200) % 360),
        'link-visited-color': o(0.38, cPop * 0.5, (h + 280) % 360),
        'link-active-color': o(0.44, cPop * 0.9, (h + 130) % 360)
      };
      dark = {
        'content-background-color': o(rnd(0.24, 0.32), cWash * 1.2, h),
        'background-color': o(rnd(0.12, 0.18), cWash, (h + 35) % 360),
        'text-color': o(0.92, 0.05, h),
        'text-color-light': o(0.72, 0.07, h),
        'border-color': o(0.4, cWash, h),
        'link-color': o(0.72, cPop * 0.85, (h + 165) % 360),
        'link-hover-color': o(0.8, cPop * 0.8, (h + 210) % 360),
        'link-visited-color': o(0.66, cPop * 0.5, (h + 285) % 360),
        'link-active-color': o(0.76, cPop * 0.75, (h + 125) % 360)
      };
    } else {
      label = `Wild · clash (${Math.round(h)}°)`;
      const c1 = rnd(0.12, 0.26);
      const c2 = rnd(0.15, 0.3);
      light = {
        'content-background-color': o(rnd(0.96, 0.995), c1, h),
        'background-color': o(rnd(0.78, 0.88), c2, (h + 85) % 360),
        'text-color': o(0.2, rnd(0.06, 0.14), (h + 200) % 360),
        'text-color-light': o(0.42, rnd(0.05, 0.12), (h + 220) % 360),
        'border-color': o(0.72, rnd(0.08, 0.16), (h + 40) % 360),
        'link-color': o(0.5, c2, (h + 150) % 360),
        'link-hover-color': o(0.44, c1 * 1.2, (h + 270) % 360),
        'link-visited-color': o(0.36, c2 * 0.6, (h + 310) % 360),
        'link-active-color': o(0.48, c1, (h + 60) % 360)
      };
      dark = {
        'content-background-color': o(rnd(0.22, 0.3), c1 * 1.1, (h + 15) % 360),
        'background-color': o(rnd(0.08, 0.14), c2 * 0.9, (h + 95) % 360),
        'text-color': o(0.93, 0.06, (h + 25) % 360),
        'text-color-light': o(0.74, 0.08, (h + 35) % 360),
        'border-color': o(0.38, c1, (h + 50) % 360),
        'link-color': o(0.76, c2 * 0.9, (h + 155) % 360),
        'link-hover-color': o(0.84, c1 * 0.95, (h + 275) % 360),
        'link-visited-color': o(0.68, c2 * 0.55, (h + 305) % 360),
        'link-active-color': o(0.8, c1 * 0.85, (h + 70) % 360)
      };
    }

    themes.push({
      id: `wild-${i}-${kind}`,
      label,
      hue: Math.round(h),
      light,
      dark,
      _hueSlider: true
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

function varsToInlineStyle(tokens) {
  return Object.entries(tokens)
    .map(([k, v]) => `--${k}: ${oklchToCss(v)}`)
    .join('; ');
}

/** Slice of index layout: base.njk header + post + link-item + pagination (see src/index.njk). */
function renderHomePreview(cssVarsInline, schemeLabel) {
  return `
    <div class="preview-column">
      <span class="col-label">${escapeHtml(schemeLabel)}</span>
      <div class="theme-root home-preview" style="${escapeHtml(cssVarsInline)}">
        <div class="jp-page">
          <header>
            <hgroup>
              <h1><a href="#" rel="home">Jon Plummer</a></h1>
              <p>Today I Learned</p>
            </hgroup>
            <nav aria-label="Site navigation">
              <ul>
                <li><a href="#">/about</a></li>
                <li><a href="#">/now</a></li>
                <li><a href="#">/portfolio</a></li>
                <li><a href="#" class="sim-visited">/wisdom</a></li>
              </ul>
            </nav>
          </header>
          <main id="main" aria-label="Main content">
            <article>
              <header>
                <h1><a href="#" rel="bookmark">What we owe junior designers in review</a></h1>
              </header>
              <section>
                <p>Feedback works when it is <a href="#">specific</a> and <a href="#" class="sim-visited">grounded in examples</a>. <strong>Kind</strong> delivery helps the second sentence read like a real lede.</p>
                <pre><code>const tone = 'curious';</code></pre>
              </section>
              <footer>
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
            <nav class="pagination" aria-label="Post pagination">
              <a class="prev" href="#">← Older posts</a>
              <a class="next" href="#">Newer posts →</a>
            </nav>
          </main>
          <footer aria-label="Site footer">
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
  if (t._kind === 'bw-combo') {
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
  if (t._kind === 'bw-combo') {
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
      if (t._kind === 'bw-combo') {
        for (const v of t._processedVariants) {
          out.push({
            id: v.id,
            label: v.label,
            hue: null,
            light: tokensToCssRecord(v.light),
            dark: tokensToCssRecord(v.dark),
            passesApcaMin: !v._failed
          });
        }
      } else if (t._kind !== 'harmony-lab') {
        out.push({
          id: t.id,
          label: t.label,
          hue: t.hue,
          light: tokensToCssRecord(t.light),
          dark: tokensToCssRecord(t.dark),
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

function renderBWComboCard(t) {
  const anyFailed = t._failed;
  const status = anyFailed
    ? '<span class="badge fail">below Lc ' + MIN_LC + ' (one or more presets)</span>'
    : '<span class="badge ok">APCA ≥ ' + MIN_LC + '</span>';

  const variantsPayload = t._processedVariants.map((v) => ({
    lightStyle: varsToInlineStyle(v.light),
    darkStyle: varsToInlineStyle(v.dark),
    tokensText: JSON.stringify({ light: tokensToCssRecord(v.light), dark: tokensToCssRecord(v.dark) }, null, 2)
  }));
  const safeJson = JSON.stringify(variantsPayload).replace(/</g, '\\u003c');

  const radios = t._processedVariants
    .map(
      (v, i) =>
        `<label class="bw-variant-opt"><input type="radio" name="bw-variant-preset" value="${i}" ${i === 0 ? 'checked' : ''} /> ${escapeHtml(v.radioLabel)}</label>`
    )
    .join('');

  const v0 = t._processedVariants[0];
  const sl0 = varsToInlineStyle(v0.light);
  const sd0 = varsToInlineStyle(v0.dark);

  return `
<section class="card card--bw-combo" data-bw-combo data-theme-id="${escapeHtml(t.id)}">
  <script type="application/json" class="bw-variants-json">${safeJson}</script>
  <header class="card-h">
    <h2>${escapeHtml(t.label)}</h2>
    ${status}
  </header>
  <div class="bw-variant-pick" role="radiogroup" aria-label="Black and white preset">
    ${radios}
  </div>
  <div class="row">
    ${renderHomePreview(sl0, 'Light')}
    ${renderHomePreview(sd0, 'Dark')}
  </div>
  <details class="tokens">
    <summary>Copy tokens (light / dark, oklch)</summary>
    <pre class="code bw-tokens-pre">${escapeHtml(JSON.stringify({ light: tokensToCssRecord(v0.light), dark: tokensToCssRecord(v0.dark) }, null, 2))}</pre>
  </details>
</section>`;
}

function renderHarmonyLabCard(t) {
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
  const initialTokensPre = escapeHtml(
    JSON.stringify(
      { light: tokensToCssRecord(initialLight), dark: tokensToCssRecord(initialDark) },
      null,
      2
    )
  );

  return `
<section class="card card--harmony-lab" data-harmony-lab data-theme-id="${escapeHtml(t.id)}">
  <script type="application/json" class="harmony-lab-json">${safePayload}</script>
  <header class="card-h">
    <h2>${escapeHtml(t.label)}</h2>
    <span class="badge ok">${p.recipes.length} recipe${p.recipes.length === 1 ? '' : 's'} · L/C from nudged build</span>
  </header>
  <p class="harmony-lab-lede">Pick a recipe, rotate hue, and tune only the angles that recipe uses (L/C stay from the APCA-nudged export). <code>themes.json</code> lists the same harmony recipes as this selector (after hide-failed).</p>
  <div class="harmony-lab-controls" role="group" aria-label="Harmony lab">
    <div class="harmony-lab-grid">
      <label class="harmony-lab-field harmony-lab-field-span">Recipe
        <select class="harmony-recipe-select" aria-label="Harmony recipe">${recipeOptions}</select>
      </label>
      <label class="harmony-lab-field harmony-lab-field-span">Hue rotation
        <input type="range" class="harmony-inp-hue" min="0" max="360" step="1" value="0" aria-valuemin="0" aria-valuemax="360" />
        <span class="harmony-lab-val harmony-val-hue">0°</span>
      </label>
      <div class="harmony-lab-field-wrap" data-harmony-tuning="analogous" hidden>
        <label class="harmony-lab-field">Analogous spread
          <input type="range" class="harmony-inp-a" min="6" max="55" step="1" value="${td.analogousSpread}" aria-valuemin="6" aria-valuemax="55" />
          <span class="harmony-lab-val harmony-val-a">${td.analogousSpread}°</span>
        </label>
      </div>
      <div class="harmony-lab-field-wrap" data-harmony-tuning="split" hidden>
        <label class="harmony-lab-field">Split spread
          <input type="range" class="harmony-inp-s" min="12" max="48" step="1" value="${td.splitSpread}" aria-valuemin="12" aria-valuemax="48" />
          <span class="harmony-lab-val harmony-val-s">${td.splitSpread}°</span>
        </label>
      </div>
      <div class="harmony-lab-field-wrap" data-harmony-tuning="skew" hidden>
        <label class="harmony-lab-field">Harmony skew
          <input type="range" class="harmony-inp-k" min="0" max="40" step="1" value="${td.harmonySkew}" aria-valuemin="0" aria-valuemax="40" />
          <span class="harmony-lab-val harmony-val-k">${td.harmonySkew}°</span>
        </label>
      </div>
    </div>
  </div>
  <div class="row">
    ${renderHomePreview(sl0, 'Light')}
    ${renderHomePreview(sd0, 'Dark')}
  </div>
  <details class="tokens">
    <summary>Copy tokens (light / dark, oklch) — live preview</summary>
    <pre class="code harmony-lab-tokens-pre">${initialTokensPre}</pre>
  </details>
</section>`;
}

function renderCard(t, failed) {
  const sl = varsToInlineStyle(t.light);
  const sd = varsToInlineStyle(t.dark);
  const status = failed
    ? '<span class="badge fail">below Lc ' + MIN_LC + '</span>'
    : '<span class="badge ok">APCA ≥ ' + MIN_LC + '</span>';

  const hueBar = t._hueSlider
    ? `<div class="hue-rotate-bar" role="group" aria-label="Preview hue rotation">
    <label class="hue-rotate-label">Preview hue rotation <input type="range" class="hue-rotate-input" min="0" max="360" value="0" step="1" aria-valuemin="0" aria-valuemax="360" aria-valuenow="0" /></label>
    <span class="hue-rotate-value" aria-hidden="true">0°</span>
    <p class="hue-rotate-note">Adds degrees to each <code>oklch()</code> hue (L and C unchanged). Copy tokens is still the nudged base from the build.</p>
  </div>`
    : '';

  const hueSliderAttr = t._hueSlider ? ' data-hue-slider' : '';

  return `
<section class="card" data-theme-id="${escapeHtml(t.id)}"${hueSliderAttr}>
  <header class="card-h">
    <h2>${escapeHtml(t.label)}</h2>
    ${status}
  </header>
  ${hueBar}
  <div class="row">
    ${renderHomePreview(sl, 'Light')}
    ${renderHomePreview(sd, 'Dark')}
  </div>
  <details class="tokens">
    <summary>Copy tokens (light / dark, oklch)</summary>
    <pre class="code">${escapeHtml(JSON.stringify({ light: tokensToCssRecord(t.light), dark: tokensToCssRecord(t.dark) }, null, 2))}</pre>
  </details>
</section>`;
}

function renderGallerySections(sectionList) {
  return sectionList
    .map((sec) => {
      if (sec.themes.length === 0) return '';
      const headingId = 'gallery-section-' + sec.slug;
      const cards = sec.themes
        .map((t) => {
          if (t._kind === 'bw-combo') return renderBWComboCard(t);
          if (t._kind === 'harmony-lab') return renderHarmonyLabCard(t);
          return renderCard(t, t._failed);
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

function renderHtml(visibleSections, meta) {
  const bodyContent = renderGallerySections(visibleSections);
  return `<!DOCTYPE html>
<html lang="en" class="gallery-ui">
<head>
  <meta charset="utf-8">
  <title>Color theme gallery</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- Same stylesheet as the site; color tokens overridden per .theme-root -->
  <link rel="stylesheet" href="../../../src/assets/css/jonplummer.css">
  <style>
    /* Gallery chrome (don’t fight jonplummer body/:root for the page shell) */
    html.gallery-ui {
      width: 100%;
      overflow-x: hidden;
    }
    body.gallery-ui {
      margin: 0;
      padding: 1.25rem clamp(1rem, 3vw, 2rem);
      background: #1a1a1a !important;
      color: #eee !important;
      font-family: system-ui, sans-serif;
      max-width: none;
      width: 100%;
      box-sizing: border-box;
    }
    .gallery-ui h1.page-title { margin-top: 0; font-size: 1.25rem; font-weight: 600; }
    .gallery-ui .meta { color: #aaa; font-size: 0.9rem; margin-bottom: 1.5rem; max-width: 62rem; line-height: 1.45; }
    .gallery-ui .gallery-section-details {
      margin-bottom: 1.75rem;
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #333;
      border-radius: 8px;
      background: #1e1e1e;
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
    .gallery-ui .gallery-section-summary::-webkit-details-marker { display: none; }
    .gallery-ui .gallery-section-summary::before {
      content: '▸';
      flex-shrink: 0;
      font-size: 0.75rem;
      color: #888;
      transition: transform 0.15s ease;
    }
    .gallery-ui .gallery-section-details[open] > .gallery-section-summary::before {
      transform: rotate(90deg);
    }
    .gallery-ui .gallery-section-h {
      font-size: 1.05rem;
      font-weight: 600;
      color: #e8e8e8;
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
    .gallery-ui .card { border: 1px solid #333; border-radius: 8px; padding: 1rem; background: #222; width: 100%; box-sizing: border-box; }
    .gallery-ui .card-h { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
    .gallery-ui .card-h h2 { margin: 0; font-size: 1rem; color: #eee; }
    .gallery-ui .hue-rotate-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem 1rem;
      margin-bottom: 0.75rem;
      padding: 0.5rem 0.65rem;
      background: #1a1a1a;
      border-radius: 6px;
      border: 1px solid #333;
    }
    .gallery-ui .hue-rotate-label { font-size: 0.8rem; color: #ccc; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .gallery-ui .hue-rotate-input { width: min(14rem, 100%); vertical-align: middle; }
    .gallery-ui .hue-rotate-value { font-size: 0.8rem; color: #aaa; font-variant-numeric: tabular-nums; min-width: 2.5rem; }
    .gallery-ui .hue-rotate-note {
      flex: 1 1 100%;
      margin: 0;
      font-size: 0.72rem;
      line-height: 1.4;
      color: #888;
    }
    .gallery-ui .hue-rotate-note code { font-size: 0.68rem; }
    .gallery-ui .bw-variant-pick {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem 1.25rem;
      margin-bottom: 0.75rem;
      padding: 0.45rem 0.6rem;
      background: #1a1a1a;
      border-radius: 6px;
      border: 1px solid #333;
    }
    .gallery-ui .bw-variant-opt {
      font-size: 0.8rem;
      color: #ccc;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      cursor: pointer;
    }
    .gallery-ui .bw-variant-opt input { margin: 0; }
    .gallery-ui .harmony-lab-lede {
      margin: 0 0 0.65rem;
      font-size: 0.8rem;
      line-height: 1.45;
      color: #aaa;
    }
    .gallery-ui .harmony-lab-lede code { font-size: 0.72rem; }
    .gallery-ui .harmony-lab-controls {
      margin-bottom: 0.75rem;
      padding: 0.5rem 0.65rem;
      background: #1a1a1a;
      border-radius: 6px;
      border: 1px solid #333;
    }
    .gallery-ui .harmony-lab-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
      gap: 0.65rem 1rem;
      align-items: end;
    }
    .gallery-ui .harmony-lab-field-wrap { min-width: 0; }
    .gallery-ui .harmony-lab-field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.78rem;
      color: #ccc;
      margin: 0;
    }
    .gallery-ui .harmony-lab-field-span { grid-column: 1 / -1; }
    @media (min-width: 40rem) {
      .gallery-ui .harmony-lab-field-span { grid-column: span 2; }
    }
    .gallery-ui .harmony-lab-field input[type="range"] { width: 100%; margin: 0; }
    .gallery-ui .harmony-lab-field select {
      width: 100%;
      max-width: 22rem;
      font-size: 0.8rem;
      padding: 0.25rem 0.35rem;
      border-radius: 4px;
      border: 1px solid #444;
      background: #111;
      color: #e8e8e8;
    }
    .gallery-ui .harmony-lab-val {
      font-size: 0.72rem;
      color: #888;
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
      color: #888;
      margin-bottom: 0.35rem;
    }
    .gallery-ui .tokens { margin-top: 0.75rem; }
    .gallery-ui .tokens summary { cursor: pointer; font-size: 0.85rem; color: #ccc; list-style: revert; }
    /* Site content-warning styles append “Show text” to every summary — not wanted here */
    .gallery-ui .tokens summary::after { content: none !important; }
    .gallery-ui .tokens details[open] > summary::after { content: none !important; }
    .gallery-ui .code { font-size: 0.65rem; overflow: auto; max-height: 12rem; background: #111; padding: 0.5rem; border-radius: 4px; color: #ddd; border: 1px solid #333; }

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
    .theme-root.home-preview .jp-page > main,
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
  <!-- Regenerate: pnpm run color-gallery -->
  <h1 class="page-title">Color theme gallery</h1>
  <p class="meta">${escapeHtml(meta)}</p>
  <p class="meta" style="margin-top:-0.75rem">Previews load <code>src/assets/css/jonplummer.css</code> via a relative URL — open this file from the repo (<code>scripts/color-explore/output/index.html</code>) so styles resolve. Each block heading toggles expand/collapse.</p>
${bodyContent}
  <script>
(function () {
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
    if (!input) return;
    function apply() {
      var shift = Number(input.value) || 0;
      input.setAttribute('aria-valuenow', String(Math.round(shift)));
      if (valueOut) valueOut.textContent = Math.round(shift) + '°';
      previews.forEach(function (el) {
        var base = el.dataset.originalStyle || '';
        el.setAttribute('style', rotateOklchInStyle(base, shift));
      });
    }
    input.addEventListener('input', apply);
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
    section.querySelectorAll('input[name="bw-variant-preset"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (radio.checked) applyIdx(Number(radio.value));
      });
    });
    applyIdx(0);
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

    function tokensRecord(lcMap, baseH, rot, recipeId, A, S, K) {
      var hub = normHue(baseH + rot);
      var d = linkDeltas(recipeId, A, S, K);
      var o = {};
      NEUTRAL_KEYS.forEach(function (k) {
        var pair = lcMap[k];
        if (pair) o[k] = oklchCss(pair[0], pair[1], hub);
      });
      LINK_KEYS_ORDER.forEach(function (item) {
        var k = item[0];
        var dk = item[1];
        var pair = lcMap[k];
        if (pair) o[k] = oklchCss(pair[0], pair[1], normHue(hub + d[dk]));
      });
      return o;
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
        pre.textContent = JSON.stringify(
          {
            light: tokensRecord(rec.light, payload.baseHue, rot, rid, A, S, K),
            dark: tokensRecord(rec.dark, payload.baseHue, rot, rid, A, S, K)
          },
          null,
          2
        );
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

function main() {
  const step = argvNum('--step', 30);
  const baseHue = argvNum('--base-hue', 0);
  const randomN = argvNum('--random', 0);
  const mono = argvFlag('--monochrome');
  const hueSweep = argvFlag('--hue-sweep');
  const includeFailed = argvFlag('--include-failed');
  const noExtras = argvFlag('--no-extras');
  const wildCount = noExtras ? 0 : argvNum('--wild', 8);

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
    analogousSpread: argvNum('--analogous-spread', 28),
    splitSpread: argvNum('--split-spread', 28),
    harmonySkew: argvNum('--harmony-skew', 12)
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
        items: buildWildThemes(wildCount)
      });
    }
    rawSections.push({
      slug: 'terminal',
      title: 'Terminal-inspired',
      items: buildTerminalPresetThemes()
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
    themes: exportThemes
  };
  if (harmonyTuningForJson) {
    themesJsonPayload.harmonyTuning = harmonyTuningForJson;
  }

  fs.writeFileSync(path.join(OUT_DIR, 'themes.json'), JSON.stringify(themesJsonPayload, null, 2), 'utf8');

  const extraBits = [];
  if (!noExtras) {
    extraBits.push('harmony lab (9 JSON recipes) + 1× B&W (3 presets) + wild + 5 terminal-inspired');
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
    `Min APCA Lc: ${MIN_LC} (matches color-contrast test minimum)`,
    mono
      ? 'Mode: monochrome'
      : randomN > 0
        ? `Mode: random hue (${randomN})`
        : hueSweep
          ? `Mode: hue sweep step ${step}°`
          : `Mode: hue reference base ${Math.round(((baseHue % 360) + 360) % 360)}° + in-page rotation`,
    extraBits.join(', '),
    `${visibleSections.reduce((n, s) => n + s.themes.length, 0)} card(s) · ${exportThemes.length} JSON entries (${processedSections.reduce((n, s) => n + s.themes.length, 0)} generated before hide — use --include-failed to show failing)`,
    'Open this file in a browser. Refine winners in /color-test/ then promote to jonplummer.css.'
  ].join(' · ');

  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), renderHtml(visibleSections, meta), 'utf8');

  console.log(`Wrote ${path.join(OUT_DIR, 'index.html')}`);
  console.log(`Wrote ${path.join(OUT_DIR, 'themes.json')}`);
  console.log(
    `Gallery: ${visibleSections.reduce((n, s) => n + s.themes.length, 0)} card(s), themes.json: ${exportThemes.length} entries`
  );
}

main();
