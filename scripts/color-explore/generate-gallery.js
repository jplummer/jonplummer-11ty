#!/usr/bin/env node
/**
 * OKLCH-based theme candidates + APCA nudging → static HTML gallery + themes.json
 *
 * Usage:
 *   node scripts/color-explore/generate-gallery.js
 *   node scripts/color-explore/generate-gallery.js --step 45
 *   node scripts/color-explore/generate-gallery.js --random 24
 *   node scripts/color-explore/generate-gallery.js --monochrome
 *   node scripts/color-explore/generate-gallery.js --include-failed
 *
 * See docs/color-theme-exploration.md
 */

const fs = require('fs');
const path = require('path');
const { calcAPCA } = require('apca-w3');
const { formatHex, parse, converter } = require('culori');

const toOklch = converter('oklch');

const MIN_LC = 60;
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

function lc(fg, bg) {
  return Math.abs(calcAPCA(fg, bg));
}

function nudgeFgTowardContrast(fgHex, bgHex) {
  const bgParsed = parse(bgHex);
  const bgOk = bgParsed ? toOklch(bgParsed) : { l: 0.5, c: 0, h: 0 };
  const bgL = typeof bgOk.l === 'number' ? bgOk.l : 0.5;
  const goDarker = bgL > 0.55;

  let c = toOklch(parse(fgHex));
  if (!c || typeof c.l !== 'number') {
    return fgHex;
  }

  let bestHex = formatHex(c);
  let bestLc = lc(bestHex, bgHex);
  if (bestLc >= MIN_LC) return bestHex;

  for (let i = 0; i < 100; i++) {
    c.l = goDarker
      ? Math.max(0.02, c.l - 0.012)
      : Math.min(0.98, c.l + 0.012);
    const hex = formatHex(c);
    const v = lc(hex, bgHex);
    if (v > bestLc) {
      bestLc = v;
      bestHex = hex;
    }
    if (v >= MIN_LC) return hex;
  }
  return bestHex;
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
      if (next !== fg) {
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
  const color = { mode: 'oklch', l, c: chroma, h };
  return formatHex(color);
}

function buildRawThemes(hues, mono) {
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
      dark: { ...dark }
    });
  }
  return themes;
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
    .map(([k, v]) => `--${k}: ${v}`)
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

function renderCard(t, failed) {
  const sl = varsToInlineStyle(t.light);
  const sd = varsToInlineStyle(t.dark);
  const status = failed
    ? '<span class="badge fail">below Lc ' + MIN_LC + '</span>'
    : '<span class="badge ok">APCA ≥ ' + MIN_LC + '</span>';

  return `
<article class="card" data-theme-id="${escapeHtml(t.id)}">
  <header class="card-h">
    <h2>${escapeHtml(t.label)}</h2>
    ${status}
  </header>
  <div class="row">
    ${renderHomePreview(sl, 'Light')}
    ${renderHomePreview(sd, 'Dark')}
  </div>
  <details class="tokens">
    <summary>Copy tokens (light / dark)</summary>
    <pre class="code">${escapeHtml(JSON.stringify({ light: t.light, dark: t.dark }, null, 2))}</pre>
  </details>
</article>`;
}

function renderHtml(themes, meta) {
  const cards = themes.map((t) => renderCard(t, t._failed)).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Color theme gallery</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- Same stylesheet as the site; color tokens overridden per .theme-root -->
  <link rel="stylesheet" href="../../../src/assets/css/jonplummer.css">
  <style>
    /* Gallery chrome (don’t fight jonplummer body/:root for the page shell) */
    body.gallery-ui {
      margin: 0;
      padding: 1.5rem;
      background: #1a1a1a !important;
      color: #eee !important;
      font-family: system-ui, sans-serif;
    }
    .gallery-ui h1.page-title { margin-top: 0; font-size: 1.25rem; font-weight: 600; }
    .gallery-ui .meta { color: #aaa; font-size: 0.9rem; margin-bottom: 1.5rem; max-width: 52rem; line-height: 1.45; }
    .gallery-ui .grid { display: grid; gap: 1.75rem; max-width: 72rem; }
    .gallery-ui .card { border: 1px solid #333; border-radius: 8px; padding: 1rem; background: #222; }
    .gallery-ui .card-h { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
    .gallery-ui .card-h h2 { margin: 0; font-size: 1rem; color: #eee; }
    .gallery-ui .badge { font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px; }
    .gallery-ui .badge.ok { background: #1b4332; color: #b7e4c7; }
    .gallery-ui .badge.fail { background: #5c1010; color: #ffc9c9; }
    .gallery-ui .row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; align-items: start; }
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
    .gallery-ui .tokens summary { cursor: pointer; font-size: 0.85rem; color: #ccc; }
    .gallery-ui .code { font-size: 0.65rem; overflow: auto; max-height: 12rem; background: #111; padding: 0.5rem; border-radius: 4px; color: #ddd; border: 1px solid #333; }

    /*
      Mimic body > header, main, footer bands (jonplummer uses body>header selector;
      previews live under .jp-page so we repeat the band rules here).
    */
    .theme-root.home-preview {
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
      --max-width: 24rem;
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
      width: 0.7rem;
      height: 0.7rem;
      border-radius: 2px;
      border: 1px solid color-mix(in srgb, var(--border-color) 85%, transparent);
      flex-shrink: 0;
      display: inline-block;
      vertical-align: middle;
    }
    .theme-root.home-preview .jp-page > header,
    .theme-root.home-preview .jp-page > main,
    .theme-root.home-preview .jp-page > footer {
      margin: 0 auto;
      padding: var(--gutter);
      max-width: var(--max-width);
      background-color: var(--content-background-color);
    }
    /* Simulated visited (file:// previews rarely have :visited match) */
    .theme-root.home-preview a.sim-visited {
      color: var(--link-visited-color);
    }
  </style>
</head>
<body class="gallery-ui">
  <h1 class="page-title">Color theme gallery</h1>
  <p class="meta">${escapeHtml(meta)}</p>
  <p class="meta" style="margin-top:-0.75rem">Previews load <code>src/assets/css/jonplummer.css</code> via a relative URL — open this file from the repo (<code>scripts/color-explore/output/index.html</code>) so styles resolve.</p>
  <div class="grid">
${cards}
  </div>
</body>
</html>`;
}

function main() {
  const step = argvNum('--step', 30);
  const randomN = argvNum('--random', 0);
  const mono = argvFlag('--monochrome');
  const includeFailed = argvFlag('--include-failed');

  let hues;
  if (randomN > 0) {
    hues = [];
    for (let i = 0; i < randomN; i++) {
      hues.push(Math.random() * 360);
    }
  } else {
    hues = [];
    for (let h = 0; h < 360; h += step) {
      hues.push(h);
    }
  }

  const raw = buildRawThemes(hues, mono);
  const processed = raw.map((t) => {
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
      _failed: !passes
    };
  });

  const visible = includeFailed ? processed : processed.filter((t) => !t._failed);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const exportThemes = visible.map(({ id, label, hue, light, dark, _failed }) => ({
    id,
    label,
    hue,
    light,
    dark,
    passesApcaMin: !_failed
  }));

  fs.writeFileSync(
    path.join(OUT_DIR, 'themes.json'),
    JSON.stringify({ generated: new Date().toISOString(), minLc: MIN_LC, themes: exportThemes }, null, 2),
    'utf8'
  );

  const meta = [
    `Generated ${new Date().toISOString()}`,
    `Min APCA Lc: ${MIN_LC} (matches color-contrast test minimum)`,
    mono ? 'Mode: monochrome' : 'Mode: OKLCH hue sweep',
    `${visible.length} theme(s) shown (${processed.length} generated, ${processed.length - visible.length} hidden as failing — use --include-failed to show)`,
    'Open this file in a browser. Refine winners in /color-test/ then promote to jonplummer.css.'
  ].join(' · ');

  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), renderHtml(visible, meta), 'utf8');

  console.log(`Wrote ${path.join(OUT_DIR, 'index.html')}`);
  console.log(`Wrote ${path.join(OUT_DIR, 'themes.json')}`);
  console.log(`Themes shown: ${visible.length} / ${processed.length} generated`);
}

main();
