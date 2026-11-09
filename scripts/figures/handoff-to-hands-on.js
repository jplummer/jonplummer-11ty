/**
 * Handoff to hands-on, for "This is what we were waiting for" (2026-06-15).
 * A Sankey of what a team learns from customers, Then and Now, drawn from one row template so the same
 * things have the same shapes in both rows; only band widths and color differ. Bands keep a flat top
 * edge, drains peel off the bottom, and everything flows right except UX's two loops in Now. Red is
 * UX's own work: in Then it stops at the spec; in Now it runs into the prototype, takes a third of the
 * building, and closes backlog items directly in the product.
 *
 * Then: negotiation parks some in the backlog; the spec is handed to engineering, where drift (misreading
 * and debt) loses some and bugs take more: a few are fixed into the product, the rest join the backlog.
 * Now: some ideas park in the backlog, which feeds the next prototype and lets UX fix the product
 * directly; a little drift and a few bugs remain.
 */

const path = require('path');
const { readSiteTokens, outlineText } = require('./figure-utils');

const W = 1200;
const H = 600;
const output = path.join(__dirname, '..', '..', 'src', 'assets', 'images', '2026', '06', 'handoff-to-hands-on.svg');

const LABEL_SIZE = 56; // near 12px at phone width; the spec's floor
const CAP = 22.5; // half the label font's cap height at LABEL_SIZE, to center a label on a row

// Columns. Boxes leave about 13 units either side of their label.
const CUST = [10, 272];
const SPEC = [335, 465];
const MID = [510, 795]; // Engineering in Then, Prototype in Now
const PROD = [985, 1180];
const BACK = [880, 1075];
const BOX_H = 72;
const HALF = BOX_H / 2;

// Below each row's center line
const RUN = 55; // the bug strand's run
const BACK_Y = 115; // the backlog's center

const n = (v) => Math.round(v * 10) / 10;

function band(width, d, cls) {
  return `<path class="${cls}" stroke-width="${width}" d="${d}"/>`;
}

function box([x0, x1], y, cls = 'box') {
  return `<rect class="${cls}" x="${x0}" y="${n(y - HALF)}" width="${x1 - x0}" height="${BOX_H}" rx="10"/>`;
}

function label(text, x, y, cls = 'label', anchor = 'middle') {
  return `<path class="${cls}" d="${outlineText(text, x, y, LABEL_SIZE, anchor)}"/>`;
}

function boxLabel(text, [x0, x1], y) {
  return label(text, (x0 + x1) / 2, y + CAP);
}

// A pointed tip where a UX loop arrives from below, so its direction can't be misread
function tip(x, y) {
  return `<path class="tip" d="M${x - 13} ${y + 16}L${x} ${y}L${x + 13} ${y + 16}Z"/>`;
}

/**
 * One row. `o.ux` names the segments that are UX's own work (drawn red); everything else is grey.
 * Widths: 40 leaves customers; `park` peels off to the backlog; the rest reaches the middle box;
 * `out` leaves it; `bugs` peel off, of which `fixed` rise into the product and the rest join the backlog.
 */
function row(yc, o) {
  const cls = (key) => (o.ux.includes(key) ? 'band-ux' : 'band');
  const top = yc - 20;
  const parts = [];

  // Out of customers, then what's left after the parked strand peels off
  const kept = 40 - o.park;
  parts.push(band(40, `M${CUST[1]} ${yc}H${CUST[1] + 31}`, cls('in')));
  parts.push(band(kept, `M${CUST[1] + 30} ${top + kept / 2}H${o.inTo + 1}`, cls('in')));
  if (o.inTo < MID[0]) parts.push(band(kept, `M${o.inTo} ${top + kept / 2}H${MID[0] + 1}`, cls('handoff')));

  // Parked: down after customers, along the bottom, into the backlog's left side
  const px = CUST[1] + 30;
  const pc = top + 40 - o.park / 2;
  const py = yc + BACK_Y + 22;
  parts.push(band(o.park, `M${CUST[1] + 10} ${pc}C${px} ${pc} ${px} ${pc} ${px} ${pc + 30}V${py - 15}Q${px} ${py} ${px + 15} ${py}H${BACK[0]}`, cls('park')));

  // Drift: out of the middle box's bottom into a small dead-end pool
  const dx = MID[0] + 15;
  parts.push(band(o.drift, `M${dx} ${yc + HALF}V${yc + 52}Q${dx} ${yc + 67} ${dx + 15} ${yc + 67}`, cls('drift')));
  parts.push(`<rect class="pool" x="${dx + 15}" y="${yc + 55}" width="70" height="24" rx="6"/>`);
  parts.push(label('Drift', dx + 97, yc + 82, 'label-quiet', 'start'));

  // Out of the middle box; the bugs peel off its bottom
  const after = o.out - o.bugs;
  parts.push(band(o.out, `M${MID[1]} ${top + o.out / 2}H${MID[1] + 6}`, cls('out')));
  parts.push(band(after, `M${MID[1] + 5} ${top + after / 2}H${PROD[0]}`, cls('out')));
  // UX's share of building: a red strip along the top of that band
  if (o.uxShare) parts.push(band(o.uxShare, `M${MID[1]} ${top + o.uxShare / 2}H${PROD[0]}`, 'band-ux'));

  // Bugs travel as one strand, labeled, then split: fixes rise into the product, the rest drop into the backlog
  const run = yc + RUN;
  const bc = top + o.out - o.bugs / 2;
  const splitX = 930;
  parts.push(band(o.bugs, `M${MID[1] - 5} ${bc}C${MID[1] + 20} ${bc} ${MID[1] + 15} ${run} ${MID[1] + 35} ${run}H${splitX + 1}`, cls('bugs')));
  const rest = o.bugs - o.fixed;
  const fixC = run - o.bugs / 2 + o.fixed / 2;
  const restC = run + o.bugs / 2 - rest / 2;
  parts.push(band(o.fixed, `M${splitX} ${fixC}H1015Q1030 ${fixC} 1030 ${fixC - 15}V${yc + HALF}`, cls('bugs')));
  parts.push(band(rest, `M${splitX} ${restC}Q945 ${restC} 945 ${restC + 15}V${yc + BACK_Y - HALF}`, cls('bugs')));
  parts.push(label('Bugs', MID[1] + 45, yc + 48, 'label-quiet', 'start'));

  if (o.extra) parts.push(o.extra(yc));

  parts.push(box(CUST, yc), boxLabel('Customers', CUST, yc));
  for (const [range, text] of o.boxes) parts.push(box(range, yc), boxLabel(text, range, yc));
  parts.push(box(PROD, yc), boxLabel('Product', PROD, yc));
  parts.push(box(BACK, yc + BACK_Y), boxLabel('Backlog', BACK, yc + BACK_Y));
  parts.push(label(o.title, CUST[0], yc - 50, 'label', 'start'));
  return parts.join('\n');
}

function render() {
  const site = readSiteTokens();
  const then = row(100, {
    title: 'Then', ux: ['in'], inTo: SPEC[1], park: 8, drift: 8, out: 24, bugs: 10, fixed: 4,
    boxes: [[SPEC, 'Spec'], [MID, 'Engineering']],
  });
  // Now: customers 40 → 26 after parking 14; the prototype gets 26 + 8 from the backlog = 34, → 30 after
  // drift, → 24 after bugs. The backlog gets 14 + 2 unfixed bugs = 16, and sends 8 into the prototype
  // and 8 straight to the product.
  const now = row(400, {
    title: 'Now', ux: ['in'], inTo: MID[0], park: 14, drift: 4, out: 30, bugs: 6, fixed: 4, uxShare: 10,
    boxes: [[MID, 'Prototype']],
    extra: (yc) => [
      // The backlog feeds the next prototype: the one loop back to the left
      band(8, `M${BACK[0]} ${yc + 120}H${MID[1] - 20}Q${MID[1] - 40} ${yc + 120} ${MID[1] - 40} ${yc + 100}V${yc + HALF + 15}`, 'band-ux'),
      tip(MID[1] - 40, yc + HALF),
      // UX closes backlog items directly in the product
      band(8, `M${BACK[1]} ${yc + BACK_Y}H1135Q1150 ${yc + BACK_Y} 1150 ${yc + BACK_Y - 15}V${yc + HALF + 15}`, 'band-ux'),
      tip(1150, yc + HALF),
    ].join('\n'),
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<!-- Generated by scripts/figures/handoff-to-hands-on.js (pnpm run generate-figures). Don't edit by hand. -->
<style>
:root {
  color-scheme: light dark;
  /* Copied from jonplummer.css :root; pnpm run test figure-tokens fails if these drift */
  --text-color: ${site['text-color']};
  --text-color-light: ${site['text-color-light']};
  --content-background-color: ${site['content-background-color']};
  --link-color: ${site['link-color']};
}
.band { fill: none; stroke: color-mix(in oklch, var(--text-color) 70%, var(--content-background-color)); }
.band-ux { fill: none; stroke: var(--link-color); }
.tip { fill: var(--link-color); }
.box, .pool { fill: color-mix(in oklch, var(--text-color) 30%, var(--content-background-color)); }
.label { fill: var(--text-color); }
.label-quiet { fill: var(--text-color-light); }
</style>
${then}
${now}
</svg>
`;
}

module.exports = { output, render };
