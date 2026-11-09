/**
 * Designer range, for "Designers who ship" (2026-06-03).
 * A range map, the way a field guide shows where a species lives. Design sits in the middle as a
 * pentagon, its five neighbors around it: Customers, Metrics, Data, Code, and Strategy. The dashed
 * edge is a designer's range before: a little over the borders into Strategy, Customers, and Metrics,
 * none into Data or Code. The red range is now: a smooth step out from the dashed edge all the way
 * round, a moderate push into Customers, and the real story, a strong push across Metrics, Data, and
 * Code, reaching furthest into Code. Arrows mark those three pushes.
 *
 * The map is stretched sideways (SX) to fill the 2:1 frame, so every reach is divided by stretch(a),
 * the on-page length of one radial unit at angle a, to make equal reaches look equal.
 */

const path = require('path');
const { readSiteTokens, outlineText } = require('./figure-utils');

const W = 1200;
const H = 600;
const output = path.join(__dirname, '..', '..', 'src', 'assets', 'images', '2026', '06', 'designer-range.svg');

const LABEL_SIZE = 56; // near 12px at phone width; the spec's floor
const CAP = 22.5; // half the label font's cap height at LABEL_SIZE, to center a label on a point

const CX = 600;
const CY = 300;
const SX = 1.9; // sideways stretch
const K = 0.82; // overall scale, so the pushes fit the frame
const DESIGN_R = 150; // the pentagon
const LABEL_R = 300;
const DATA_LABEL_R = 326; // Data sits lower, to clear the red

// Each neighbor by the angle through the middle of its border with Design (0° is right, 90° is down)
const MID = { Customers: -54, Metrics: 18, Data: 90, Code: 162, Strategy: 234 };
const CORNERS = [0, 1, 2, 3, 4].map((k) => -90 + 72 * k);
const ARROWS = [14, 90, 150]; // into Metrics, Data, and Code

// From just past the Customers/Metrics junction round into Strategy, the red edge never bends inward
const CONVEX_SPAN = [-6, 204];

const n = (v) => Math.round(v * 10) / 10;
const rad = (d) => (d * Math.PI) / 180;
const wrap = (d) => ((d % 360) + 540) % 360 - 180;
const pt = (r, a) => [CX + r * K * SX * Math.cos(rad(a)), CY + r * K * Math.sin(rad(a))];
const stretch = (a) => Math.hypot(SX * Math.cos(rad(a)), Math.sin(rad(a)));
const bump = (a, mid, spread) => Math.exp(-((wrap(a - mid) / spread) ** 2));

// Then: a little into Strategy, Customers, and Metrics, and across the Customers/Metrics border between them
function then(a) {
  return 100 + 78 * bump(a, MID.Customers, 28) + 52 * bump(a, MID.Metrics, 28) + 50 * bump(a, MID.Strategy, 28) + 28 * bump(a, -18, 22);
}

// A smooth window over Metrics, Data, and Code: full from 15° to 155°, easing out over 50°
function lower(a) {
  const d = Math.abs(wrap(a - 85));
  if (d <= 70) return 1;
  if (d >= 120) return 0;
  return Math.cos((((d - 70) / 50) * Math.PI) / 2) ** 2;
}

// Now: an even step of 45 out from then, 25 more into Customers, 100 across the lower three, and 45 more into Code
function now(a) {
  return then(a) + (45 + 25 * bump(a, MID.Customers, 30) + 100 * lower(a) + 45 * bump(a, 150, 40)) / stretch(a);
}

const cross = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);

/**
 * The red edge's points. Across CONVEX_SPAN, now() inherits then's lobes and dips, so that stretch is
 * replaced by its outer convex hull, resampled and smoothed with its ends pinned. Averaging a convex
 * chain keeps it convex, so the bridges' corners round off without bending inward.
 */
function nowPoints() {
  const pts = [];
  for (let a = -150; a < 210; a += 1) pts.push({ a, p: pt(now(a), a) });
  const span = pts.filter((q) => q.a >= CONVEX_SPAN[0] && q.a <= CONVEX_SPAN[1]).map((q) => q.p);
  const hull = [];
  for (const q of span) {
    while (hull.length > 1 && cross(hull[hull.length - 2], hull[hull.length - 1], q) <= 0) hull.pop();
    hull.push(q);
  }
  let dense = [];
  for (let i = 0; i < hull.length - 1; i++) {
    const [p, q] = [hull[i], hull[i + 1]];
    const steps = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 6));
    for (let j = 0; j < steps; j++) dense.push([p[0] + ((q[0] - p[0]) * j) / steps, p[1] + ((q[1] - p[1]) * j) / steps]);
  }
  dense.push(hull[hull.length - 1]);
  for (let pass = 0; pass < 40; pass++) {
    dense = dense.map((p, i) => (i === 0 || i === dense.length - 1)
      ? p
      : [(dense[i - 1][0] + 2 * p[0] + dense[i + 1][0]) / 4, (dense[i - 1][1] + 2 * p[1] + dense[i + 1][1]) / 4]);
  }
  const after = pts.filter((q) => q.a > CONVEX_SPAN[1]).map((q) => q.p);
  const before = pts.filter((q) => q.a < CONVEX_SPAN[0]).map((q) => q.p);
  return [...dense, ...after, ...before];
}

const polygon = (pts) => `M${pts.map(([x, y]) => `${n(x)} ${n(y)}`).join('L')}Z`;

// Where the ray at angle a meets the drawn red edge, as a radius
function edgeR(pts, a) {
  const [ux, uy] = [K * SX * Math.cos(rad(a)), K * Math.sin(rad(a))];
  const want = Math.atan2(uy, ux);
  let best = pts[0];
  let bestD = Infinity;
  for (const q of pts) {
    const d = Math.abs(wrap(((Math.atan2(q[1] - CY, q[0] - CX) - want) * 180) / Math.PI));
    if (d < bestD) { bestD = d; best = q; }
  }
  return Math.hypot(best[0] - CX, best[1] - CY) / Math.hypot(ux, uy);
}

// A border ray from the pentagon's corner out to the frame's edge
function ray(a) {
  const [x0, y0] = pt(DESIGN_R, a);
  const [dx, dy] = [Math.cos(rad(a)) * SX, Math.sin(rad(a))];
  const ts = [];
  if (dx > 0) ts.push((W - x0) / dx); else if (dx < 0) ts.push(-x0 / dx);
  if (dy > 0) ts.push((H - y0) / dy); else if (dy < 0) ts.push(-y0 / dy);
  const t = Math.min(...ts);
  return `M${n(x0)} ${n(y0)}L${n(x0 + dx * t)} ${n(y0 + dy * t)}`;
}

function arrow(a, r0, r1) {
  const [x0, y0] = pt(r0, a);
  const [x1, y1] = pt(r1, a);
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const len = 26;
  const half = 15;
  const bx = x1 - len * Math.cos(ang);
  const by = y1 - len * Math.sin(ang);
  const px = -Math.sin(ang) * half;
  const py = Math.cos(ang) * half;
  return `<path class="grow" d="M${n(x0)} ${n(y0)}L${n(bx)} ${n(by)}"/>\n`
    + `<path class="tip" d="M${n(x1)} ${n(y1)}L${n(bx + px)} ${n(by + py)}L${n(bx - px)} ${n(by - py)}Z"/>`;
}

const label = (text, x, y, cls) => `<path class="${cls}" d="${outlineText(text, n(x), n(y) + CAP, LABEL_SIZE, 'middle')}"/>`;

function render() {
  const site = readSiteTokens();
  const red = nowPoints();
  const thenPts = [];
  for (let a = 0; a < 360; a += 3) thenPts.push(pt(then(a), a));
  const parts = [
    `<path class="range-now" d="${polygon(red)}"/>`,
    `<path class="region" d="${polygon(CORNERS.map((a) => pt(DESIGN_R, a)))}"/>`,
    ...CORNERS.map((a) => `<path class="region" d="${ray(a)}"/>`),
    `<path class="range-then" d="${polygon(thenPts)}"/>`,
    ...Object.entries(MID).map(([word, a]) => label(word, ...pt(word === 'Data' ? DATA_LABEL_R : LABEL_R, a), 'label-quiet')),
    label('Design', CX, CY, 'label'),
    // Each arrow runs from just outside the dashed edge to the inside of the red edge's stroke
    ...ARROWS.map((a) => arrow(a, then(a) + 10, edgeR(red, a) - 3 / (K * stretch(a)))),
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<!-- Generated by scripts/figures/designer-range.js (pnpm run generate-figures). Don't edit by hand. -->
<style>
:root {
  color-scheme: light dark;
  /* Copied from jonplummer.css :root; pnpm run test figure-tokens fails if these drift */
  --text-color: ${site['text-color']};
  --text-color-light: ${site['text-color-light']};
  --content-background-color: ${site['content-background-color']};
  --link-color: ${site['link-color']};
}
.range-now { fill: color-mix(in oklch, var(--link-color) 30%, transparent); stroke: var(--link-color); stroke-width: 6; }
.range-then { fill: none; stroke: color-mix(in oklch, var(--text-color) 70%, var(--content-background-color)); stroke-width: 5; stroke-dasharray: 14 10; }
.region { fill: none; stroke: color-mix(in oklch, var(--text-color) 45%, var(--content-background-color)); stroke-width: 4; }
.grow { fill: none; stroke: var(--link-color); stroke-width: 9; }
.tip { fill: var(--link-color); }
.label { fill: var(--text-color); }
.label-quiet { fill: var(--text-color-light); }
</style>
${parts.join('\n')}
</svg>
`;
}

module.exports = { output, render };
