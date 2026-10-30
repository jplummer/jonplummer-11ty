/**
 * Shared helpers for generated post figures (docs/designs/specs/2026-10-29-lead-figure-style-design.md).
 *
 * Figures are standalone SVG files shown with <img>, so they can't see the page's CSS or fonts.
 * Each one carries a copy of the site tokens it needs (checked by `pnpm run test figure-tokens`)
 * and its labels are outlined here, at generation time, from a static Big Shoulders Bold.
 * Nothing here runs during the build. figure-tokens.js uses only SITE_TOKENS and readSiteTokens.
 */

const fs = require('fs');
const path = require('path');
const { extractCssCustomProperties } = require('../../eleventy/utils/css-utils');

// Site tokens a figure may copy. figure-tokens.js compares every copy against jonplummer.css.
const SITE_TOKENS = ['text-color', 'text-color-light', 'content-background-color', 'link-color'];

// The variable font the site serves can't be instanced by fontkit from WOFF2, so labels use
// fontsource's static 700 cut of the same family.
const LABEL_FONT = path.join(
  __dirname, '..', '..', 'node_modules', '@fontsource', 'big-shoulders', 'files', 'big-shoulders-latin-700-normal.woff2'
);

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function normalize(value) {
  return value.replace(/\s+/g, ' ').trim();
}

/** Reads the named custom properties from the stylesheet's :root, verbatim. */
function readSiteTokens(names = SITE_TOKENS) {
  const root = stripComments(extractCssCustomProperties());
  const tokens = {};
  for (const name of names) {
    const match = root.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`));
    if (!match) {
      throw new Error(`jonplummer.css :root has no --${name}`);
    }
    tokens[name] = normalize(match[1]);
  }
  return tokens;
}

/** Seeded PRNG (mulberry32) so a figure regenerates identically. */
function rng(seed) {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Midpoint displacement between control points, for craggy ridgelines.
 * `rough` scales vertical displacement as a share of segment length.
 */
function ridge(points, rough, depth, seed) {
  const random = rng(seed);
  let pts = points.map((p) => [...p]);
  for (let d = 0; d < depth; d++) {
    const next = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const len = Math.hypot(x1 - x0, y1 - y0);
      next.push(
        [(x0 + x1) / 2 + (random() - 0.5) * len * rough * 0.3, (y0 + y1) / 2 + (random() - 0.5) * len * rough],
        pts[i]
      );
    }
    pts = next;
  }
  return pts;
}

/** Closed ridge silhouette: the crest, then down to the bottom corners. */
function ridgePath(pts, width, height) {
  return 'M' + pts.map((p) => `${Math.round(p[0])} ${Math.round(p[1])}`).join('L') + `L${width} ${height}L0 ${height}Z`;
}

let labelFont;

/**
 * Outlines `text` on the baseline y, `size` in viewBox units. `anchor` works like SVG's
 * text-anchor: x is the left edge for 'start', the center for 'middle', the right edge for 'end'.
 */
function outlineText(text, x, y, size, anchor = 'start') {
  // Required here, not at the top, so figure-tokens.js can share this file without fontkit
  labelFont = labelFont || require('fontkit').openSync(LABEL_FONT);
  const scale = size / labelFont.unitsPerEm;
  const run = labelFont.layout(text);
  const width = run.positions.reduce((sum, pos) => sum + pos.xAdvance, 0) * scale;
  let penX = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  let d = '';
  run.glyphs.forEach((glyph, i) => {
    const pos = run.positions[i];
    const glyphPath = glyph.path
      .scale(scale, -scale)
      .translate(penX + pos.xOffset * scale, y - pos.yOffset * scale);
    d += glyphPath.toSVG();
    penX += pos.xAdvance * scale;
  });
  return d.replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n) * 10) / 10));
}

/**
 * Path through `pts` with each interior corner rounded to radius `r` (or less, on short legs).
 * Jon rounds the corners on flowchart arrows; it makes a line easier to follow through a turn.
 */
function roundedPolyline(pts, r) {
  const n = (v) => Math.round(v * 10) / 10;
  let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const inLen = Math.hypot(x1 - x0, y1 - y0);
    const outLen = Math.hypot(x2 - x1, y2 - y1);
    const a = Math.min(r, inLen / 2);
    const b = Math.min(r, outLen / 2);
    d += `L${n(x1 - (x1 - x0) / inLen * a)} ${n(y1 - (y1 - y0) / inLen * a)}`;
    d += `Q${n(x1)} ${n(y1)} ${n(x1 + (x2 - x1) / outLen * b)} ${n(y1 + (y2 - y1) / outLen * b)}`;
  }
  const last = pts[pts.length - 1];
  return d + `L${n(last[0])} ${n(last[1])}`;
}

function writeFigure(outputPath, svg) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, svg);
}

module.exports = {
  SITE_TOKENS,
  readSiteTokens,
  rng,
  ridge,
  ridgePath,
  outlineText,
  roundedPolyline,
  writeFigure,
};
