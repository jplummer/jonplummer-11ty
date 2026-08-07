#!/usr/bin/env node
/**
 * Colophon sketch dark-mode remap lab.
 *
 * Segments scripts/colophon-sketch/source-original.png:
 *   - outside (flood-fill near-white from edges) → transparent
 *   - remaining pixels remapped by luma: dark → ink, light → fill
 *
 * Light preview is fixed (dark ink + white fill). Dark preview varies by recipe.
 * Output: scripts/colophon-sketch/output/index.html (gitignored).
 *
 * Usage:
 *   pnpm run colophon-sketch
 *   pnpm run colophon-sketch -- --export   # also write site light/dark PNGs
 */

const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const requireFromEleventyImg = createRequire(require.resolve('@11ty/eleventy-img'));
const sharp = requireFromEleventyImg('sharp');

const ROOT = path.join(__dirname);
const SOURCE = path.join(ROOT, 'source-original.png');
const OUT_DIR = path.join(ROOT, 'output');
const OUT_HTML = path.join(OUT_DIR, 'index.html');
const SITE_IMAGES = path.join(__dirname, '..', '..', 'src', 'assets', 'images');

/** Recipe id baked to site assets with --export (revisit via lab later). */
const EXPORT_DARK_ID = 'soft-white-fill-dimmer';

/** Near-white threshold for "outside" flood-fill (0–255 luma). */
const OUTSIDE_LUMA = 245;

/** Site dark chrome (approx jonplummer.css dark halves). */
const PAGE_DARK = { r: 22, g: 23, b: 26 }; // ~oklch(10% …)
const PAGE_LIGHT = { r: 244, g: 245, b: 247 }; // ~oklch(96.4% …)

const LIGHT_RECIPE = {
  id: 'light-canonical',
  label: 'Light (canonical)',
  ink: { r: 26, g: 26, b: 26 },
  fill: { r: 255, g: 255, b: 255 },
};

/**
 * Dark recipes: ink darker than fill; both lighter than typical page black.
 * Includes sensible, soft, token-ish, backward, and outlandish options.
 */
const DARK_RECIPES = [
  {
    id: 'lifted-paper',
    tag: 'sensible',
    label: 'Lifted paper',
    note: 'Ink above page black; soft gray fill (not white).',
    ink: { r: 48, g: 50, b: 56 },
    fill: { r: 58, g: 60, b: 68 },
  },
  {
    id: 'content-token',
    tag: 'token-ish',
    label: 'Content surface',
    note: 'Fill ≈ dark --content-background; ink a step darker.',
    ink: { r: 36, g: 36, b: 38 },
    fill: { r: 52, g: 52, b: 54 }, // ~oklch(22%)
  },
  {
    id: 'text-on-paper',
    tag: 'token-ish',
    label: 'Dark text on content paper',
    note: 'Ink near dark --text-color; fill ≈ dark content surface.',
    ink: { r: 48, g: 50, b: 58 },
    fill: { r: 56, g: 56, b: 58 },
  },
  {
    id: 'classic-dark-ink',
    tag: 'sensible',
    label: 'Classic dark ink on slate',
    note: 'Near-black ink (still > page); slate fill.',
    ink: { r: 40, g: 42, b: 48 },
    fill: { r: 72, g: 74, b: 82 },
  },
  {
    id: 'wide-gap',
    tag: 'sensible',
    label: 'Wide gap',
    note: 'Stronger ink/fill separation.',
    ink: { r: 38, g: 40, b: 46 },
    fill: { r: 110, g: 112, b: 120 },
  },
  {
    id: 'soft-white-fill',
    tag: 'sensible',
    label: 'Soft white fill',
    note: 'Between wide-gap and white-fill-kept: dark ink, fill toned off pure white.',
    ink: { r: 32, g: 32, b: 34 },
    fill: { r: 236, g: 236, b: 238 },
  },
  {
    id: 'soft-white-fill-warmer',
    tag: 'soft',
    label: 'Soft white fill (warmer)',
    note: 'Same idea with a slightly paper-warm fill.',
    ink: { r: 32, g: 32, b: 34 },
    fill: { r: 240, g: 236, b: 228 },
  },
  {
    id: 'soft-white-fill-dimmer',
    tag: 'sensible',
    label: 'Soft white fill (dimmer)',
    note: 'A bit further from white than soft-white-fill.',
    ink: { r: 32, g: 32, b: 34 },
    fill: { r: 220, g: 220, b: 224 },
  },
  {
    id: 'narrow-gap',
    tag: 'soft',
    label: 'Narrow gap',
    note: 'Subtle contrast; may feel muddy.',
    ink: { r: 55, g: 57, b: 64 },
    fill: { r: 70, g: 72, b: 80 },
  },
  {
    id: 'warm-paper',
    tag: 'soft',
    label: 'Warm paper',
    note: 'Slightly warm fill; cool-dark ink.',
    ink: { r: 44, g: 42, b: 40 },
    fill: { r: 78, g: 70, b: 62 },
  },
  {
    id: 'cool-paper',
    tag: 'soft',
    label: 'Cool paper',
    note: 'Blue-gray fill.',
    ink: { r: 36, g: 42, b: 52 },
    fill: { r: 64, g: 72, b: 88 },
  },
  {
    id: 'backward-light-ink',
    tag: 'backward',
    label: 'Backward: light ink on dark fill',
    note: 'Inverts the ink/fill relationship.',
    ink: { r: 210, g: 212, b: 218 },
    fill: { r: 40, g: 42, b: 48 },
  },
  {
    id: 'backward-white-fill',
    tag: 'backward',
    label: 'Backward: white fill kept',
    note: 'Dark ink + pure white plate on dark chrome.',
    ink: { r: 32, g: 32, b: 34 },
    fill: { r: 255, g: 255, b: 255 },
  },
  {
    id: 'backward-crush',
    tag: 'backward',
    label: 'Backward: crushed black ink',
    note: 'Ink ≈ page; silhouette may vanish at edges.',
    ink: { r: 18, g: 19, b: 22 },
    fill: { r: 55, g: 56, b: 62 },
  },
  {
    id: 'outlandish-coral-ink',
    tag: 'outlandish',
    label: 'Outlandish: coral ink',
    note: 'Brand-adjacent accent as ink.',
    ink: { r: 220, g: 100, b: 90 },
    fill: { r: 48, g: 42, b: 44 },
  },
  {
    id: 'outlandish-mint-fill',
    tag: 'outlandish',
    label: 'Outlandish: mint fill',
    note: 'Dark ink on greenish paper.',
    ink: { r: 30, g: 40, b: 36 },
    fill: { r: 70, g: 110, b: 95 },
  },
  {
    id: 'outlandish-gold',
    tag: 'outlandish',
    label: 'Outlandish: gold on plum',
    note: 'Decorative, not production.',
    ink: { r: 230, g: 190, b: 90 },
    fill: { r: 55, g: 35, b: 60 },
  },
  {
    id: 'outlandish-neon',
    tag: 'outlandish',
    label: 'Outlandish: neon on void',
    note: 'Max chroma ink.',
    ink: { r: 80, g: 255, b: 180 },
    fill: { r: 28, g: 28, b: 40 },
  },
  {
    id: 'sepia-night',
    tag: 'soft',
    label: 'Sepia night',
    note: 'Brown ink on dusky fill.',
    ink: { r: 58, g: 42, b: 32 },
    fill: { r: 88, g: 72, b: 58 },
  },
  {
    id: 'newsprint-dark',
    tag: 'sensible',
    label: 'Newsprint dark',
    note: 'Slightly dirty fill; soft black ink.',
    ink: { r: 42, g: 40, b: 38 },
    fill: { r: 92, g: 88, b: 80 },
  },
  {
    id: 'high-key-dark',
    tag: 'sensible',
    label: 'High-key dark',
    note: 'Both values lifted; fill still not white.',
    ink: { r: 70, g: 72, b: 80 },
    fill: { r: 140, g: 142, b: 150 },
  },
];

function luma(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function mix(a, b, t) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

function hex(c) {
  return (
    '#' +
    [c.r, c.g, c.b]
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Mark outside pixels via BFS flood-fill from image edges through near-white.
 * @returns {Uint8Array} 1 = outside, 0 = interior (ink or fill)
 */
function markOutside(data, width, height, channels) {
  const outside = new Uint8Array(width * height);
  const queue = [];

  function tryEnqueue(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = y * width + x;
    if (outside[i]) return;
    const o = i * channels;
    const L = luma(data[o], data[o + 1], data[o + 2]);
    if (L < OUTSIDE_LUMA) return;
    outside[i] = 1;
    queue.push(i);
  }

  for (let x = 0; x < width; x++) {
    tryEnqueue(x, 0);
    tryEnqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryEnqueue(0, y);
    tryEnqueue(width - 1, y);
  }

  let head = 0;
  while (head < queue.length) {
    const i = queue[head++];
    const x = i % width;
    const y = (i / width) | 0;
    tryEnqueue(x + 1, y);
    tryEnqueue(x - 1, y);
    tryEnqueue(x, y + 1);
    tryEnqueue(x, y - 1);
  }

  return outside;
}

/**
 * Remap interior: luma 0 → ink, luma 255 → fill (preserves AA). Outside → alpha 0.
 */
function remapBuffer(data, width, height, channels, outside, ink, fill) {
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    if (outside[i]) {
      out[o] = 0;
      out[o + 1] = 0;
      out[o + 2] = 0;
      out[o + 3] = 0;
      continue;
    }
    const s = i * channels;
    const L = luma(data[s], data[s + 1], data[s + 2]);
    const t = Math.min(1, Math.max(0, L / 255));
    const c = mix(ink, fill, t);
    out[o] = c.r;
    out[o + 1] = c.g;
    out[o + 2] = c.b;
    out[o + 3] = 255;
  }
  return out;
}

async function pngDataUri(rgba, width, height) {
  const buf = await sharp(rgba, {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function writePng(rgba, width, height, dest) {
  await sharp(rgba, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(dest);
  console.log(`Wrote ${dest}`);
}

async function main() {
  const doExport = process.argv.includes('--export');

  if (!fs.existsSync(SOURCE)) {
    console.error(`Missing source: ${SOURCE}`);
    process.exit(1);
  }

  const { data, info } = await sharp(SOURCE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const outside = markOutside(data, width, height, channels);
  let outsideCount = 0;
  for (let i = 0; i < outside.length; i++) outsideCount += outside[i];
  console.log(
    `Segmented ${width}×${height}: outside ${(
      (100 * outsideCount) /
      (width * height)
    ).toFixed(1)}% (flood-fill luma≥${OUTSIDE_LUMA})`
  );

  const lightRgba = remapBuffer(
    data,
    width,
    height,
    channels,
    outside,
    LIGHT_RECIPE.ink,
    LIGHT_RECIPE.fill
  );
  const lightUri = await pngDataUri(lightRgba, width, height);

  const cards = [];
  let exportDarkRecipe = null;
  for (const recipe of DARK_RECIPES) {
    const darkRgba = remapBuffer(
      data,
      width,
      height,
      channels,
      outside,
      recipe.ink,
      recipe.fill
    );
    const darkUri = await pngDataUri(darkRgba, width, height);
    cards.push({ recipe, darkUri, darkRgba });
    if (recipe.id === EXPORT_DARK_ID) {
      exportDarkRecipe = { recipe, darkRgba };
    }
  }

  if (doExport) {
    if (!exportDarkRecipe) {
      console.error(`Export recipe not found: ${EXPORT_DARK_ID}`);
      process.exit(1);
    }
    await writePng(
      lightRgba,
      width,
      height,
      path.join(SITE_IMAGES, 'jon-sketch-by-rob-ullman-light.png')
    );
    await writePng(
      exportDarkRecipe.darkRgba,
      width,
      height,
      path.join(SITE_IMAGES, 'jon-sketch-by-rob-ullman-dark.png')
    );
    console.log(`Exported dark recipe: ${exportDarkRecipe.recipe.id}`);
  }

  const cardHtml = cards
    .map(({ recipe, darkUri }) => {
      return `<section class="card" data-tag="${escapeHtml(recipe.tag)}">
  <header>
    <h2>${escapeHtml(recipe.label)}</h2>
    <p class="meta"><code>${escapeHtml(recipe.id)}</code> · ${escapeHtml(recipe.tag)}</p>
    <p class="note">${escapeHtml(recipe.note)}</p>
    <p class="swatches">
      ink <span class="swatch" style="background:${hex(recipe.ink)}" title="${hex(recipe.ink)}"></span>
      <code>${hex(recipe.ink)}</code>
      fill <span class="swatch" style="background:${hex(recipe.fill)}" title="${hex(recipe.fill)}"></span>
      <code>${hex(recipe.fill)}</code>
    </p>
  </header>
  <div class="pair">
    <figure class="pane pane-light">
      <figcaption>Light</figcaption>
      <img src="${lightUri}" alt="" width="240" height="240">
    </figure>
    <figure class="pane pane-dark">
      <figcaption>Dark</figcaption>
      <img src="${darkUri}" alt="" width="240" height="240">
    </figure>
  </div>
</section>`;
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Colophon sketch remap lab</title>
  <style>
    :root {
      --page-light: rgb(${PAGE_LIGHT.r} ${PAGE_LIGHT.g} ${PAGE_LIGHT.b});
      --page-dark: rgb(${PAGE_DARK.r} ${PAGE_DARK.g} ${PAGE_DARK.b});
      --text: #1a1a1a;
      --muted: #555;
      --border: #ccc;
      font-family: system-ui, sans-serif;
    }
    body { margin: 0; padding: 1.5rem; color: var(--text); background: #e8e8e8; }
    h1 { font-size: 1.35rem; margin: 0 0 0.35rem; }
    .lede { max-width: 42rem; color: var(--muted); margin: 0 0 1.25rem; line-height: 1.45; }
    .filters { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.25rem; }
    .filters button {
      border: 1px solid var(--border); background: #fff; padding: 0.35rem 0.7rem;
      border-radius: 4px; cursor: pointer; font: inherit;
    }
    .filters button[aria-pressed="true"] { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
    .grid { display: grid; gap: 1.25rem; }
    .card {
      background: #fff; border: 1px solid var(--border); border-radius: 8px;
      padding: 1rem; display: grid; gap: 0.75rem;
    }
    .card h2 { font-size: 1.05rem; margin: 0; }
    .meta, .note, .swatches { margin: 0.25rem 0 0; font-size: 0.85rem; color: var(--muted); }
    .swatch {
      display: inline-block; width: 0.9rem; height: 0.9rem; border-radius: 2px;
      border: 1px solid #999; vertical-align: -0.1rem; margin: 0 0.2rem;
    }
    .pair {
      display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;
    }
    .pane {
      margin: 0; border-radius: 6px; overflow: hidden;
      display: grid; justify-items: center; padding: 1.25rem 0.75rem 1rem;
    }
    .pane-light { background: var(--page-light); }
    .pane-dark { background: var(--page-dark); }
    .pane figcaption {
      font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em;
      margin-bottom: 0.5rem; color: var(--muted);
    }
    .pane-dark figcaption { color: #9a9a9a; }
    .pane img { display: block; width: min(240px, 100%); height: auto; }
    code { font-size: 0.8em; }
    @media (max-width: 640px) {
      .pair { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <h1>Colophon sketch remap lab</h1>
  <p class="lede">
    Outside is transparent (edge flood-fill). Light column is fixed: dark ink + white fill.
    Dark column varies by recipe — sensible, soft, token-ish, backward, outlandish.
    Pick a dark <code>id</code> to bake into the site later.
  </p>
  <div class="filters" role="group" aria-label="Filter by tag">
    <button type="button" data-filter="all" aria-pressed="true">All</button>
    <button type="button" data-filter="sensible" aria-pressed="false">Sensible</button>
    <button type="button" data-filter="soft" aria-pressed="false">Soft</button>
    <button type="button" data-filter="token-ish" aria-pressed="false">Token-ish</button>
    <button type="button" data-filter="backward" aria-pressed="false">Backward</button>
    <button type="button" data-filter="outlandish" aria-pressed="false">Outlandish</button>
  </div>
  <div class="grid">
${cardHtml}
  </div>
  <script>
    const buttons = document.querySelectorAll('.filters button');
    const cards = document.querySelectorAll('.card');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const f = btn.getAttribute('data-filter');
        buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        cards.forEach((card) => {
          const show = f === 'all' || card.getAttribute('data-tag') === f;
          card.hidden = !show;
        });
      });
    });
  </script>
</body>
</html>
`;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_HTML, html, 'utf8');
  console.log(`Wrote ${OUT_HTML}`);
  console.log(`Open: file://${OUT_HTML}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
