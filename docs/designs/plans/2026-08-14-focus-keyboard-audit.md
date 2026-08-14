# Focus and Keyboard Audit Tooling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a portable headless-browser tool that mechanizes focus and keyboard evaluation, emitting EARL JSON-LD evidence plus a markdown report.

**Architecture:** Three layers. A site-agnostic collector drives Puppeteer and records tab stops, focus-visibility evidence, and scenario trails. A project config supplies paths and scenarios. An evaluator turns evidence into EARL assertions tagged with WCAG criteria and ACT rule identifiers, and a reporter renders markdown. Nothing in the collector, evaluator, rules, or reporter may import from this project.

**Tech Stack:** Node CommonJS, Puppeteer 24 (already a dependency), no new packages.

**Spec:** `docs/designs/specs/2026-08-13-focus-keyboard-audit-design.md`. Read it before starting.

## Global Constraints

- **CommonJS** (`require`/`module.exports`), 2-space indent, `const`/`let`, single quotes, arrow functions for callbacks. Shebang `#!/usr/bin/env node` on the CLI only.
- **No new dependencies.** Puppeteer is already in `package.json` at `^24.43.1`. Image comparison happens inside the browser via canvas rather than adding a PNG decoder.
- **Portability boundary is absolute.** `collect.js`, `evaluate.js`, `rules.js`, `earl.js`, `report.js` must not require anything outside `scripts/focus-audit/`. Only `cli.js` and `jonplummer.config.js` may know about this site.
- **No test-manifest entry.** This is not a suite member. Do not add it to `scripts/test-manifest.js`.
- **No committed unit tests.** The spec rejects them deliberately (see its Tests section). Each task instead ends with a runnable verification command and a stated expected observation.
- **Output goes to `docs/designs/scratch/`**, which is gitignored. Never commit audit output.
- **Base URL is required**, with no default, so targeting production is deliberate.
- **EARL outcome vocabulary**, exactly: `earl:passed`, `earl:failed`, `earl:inapplicable`, `earl:cantTell`, `earl:untested`. Mode is `earl:semiAuto`.
- **Never emit VPAT conformance levels.** No "Supports" / "Partially Supports" / "Does Not Support" anywhere in output.

## Environment note

Puppeteer may fail to find Chrome if `PUPPETEER_CACHE_DIR` is set to a sandbox path. If launch fails, prefix commands with `env -u PUPPETEER_CACHE_DIR`. This is a known issue in this repo, documented in `.cursor/rules/memory.mdc`.

All verification steps assume a dev server is running in another terminal:

```bash
pnpm run dev
```

That serves on `http://localhost:8080` by default. Confirm the port from its output before using it.

---

### Task 1: CLI, config, and page selection

**Files:**

- Create: `scripts/focus-audit/cli.js`
- Create: `scripts/focus-audit/jonplummer.config.js`
- Modify: `package.json` (scripts section)

**Interfaces:**

- Consumes: nothing.
- Produces: `jonplummer.config.js` exports `{ structuredSample, scenarios, randomSampleRatio, sitemapPath }` where `structuredSample` is an array of `{ path, why }`, `scenarios` is an array of scenario objects (defined in Task 5; export an empty array for now), `randomSampleRatio` is `0.1`, and `sitemapPath` is `'/sitemap.xml'`. `cli.js` exports `{ selectPages }` with signature `selectPages(config, allPaths, rng) -> { structured: string[], random: string[] }`.

- [ ] **Step 1: Create the project config**

Create `scripts/focus-audit/jonplummer.config.js`:

```js
'use strict';

/**
 * Project-specific input for the focus audit. The collector, evaluator and
 * reporter are site-agnostic; everything this site knows about itself lives
 * here. Porting the tool to another site means replacing this file only.
 */

// Structured sample per WCAG-EM 2.0 Step 3.1: one page per distinct template,
// covering the variety of views, functionality and technologies on the site.
const structuredSample = [
  { path: '/', why: 'index.njk, home lockup and post list' },
  { path: '/page/2/', why: 'paginated index, pagination nav' },
  { path: '/2026/04/04/sometimes-you-take-over/', why: 'single_post.njk with figures, lightbox triggers' },
  { path: '/2026/02/11/a-conversation-about-religion/', why: 'the only post with a content-warning details' },
  { path: '/portfolio/', why: 'portfolio.njk, card grid, whole-card links' },
  { path: '/2026/02/20/call-review-console/', why: 'portfolio_detail.njk' },
  { path: '/wisdom/', why: 'wisdom list and tag links' },
  { path: '/colophon/', why: 'page layout, sketch, footer' },
  { path: '/about/', why: 'page layout, prose links' },
  { path: '/404.html', why: 'error document, root-absolute assets' },
  { path: '/color/', why: 'sanity pass only' },
  { path: '/type/', why: 'sanity pass only' },
];

module.exports = {
  structuredSample,
  scenarios: [],
  randomSampleRatio: 0.1,
  sitemapPath: '/sitemap.xml',
};
```

- [ ] **Step 2: Create the CLI**

Create `scripts/focus-audit/cli.js`:

```js
#!/usr/bin/env node
'use strict';

const path = require('path');

/**
 * Draw the WCAG-EM 2.0 Step 3.2 random sample. Its purpose is to test whether
 * the structured sample is complete, not to cover more of the site, so it is
 * drawn from pages the structured sample does not already include.
 */
const selectPages = (config, allPaths, rng) => {
  const structured = config.structuredSample.map((entry) => entry.path);
  const structuredSet = new Set(structured);
  const candidates = allPaths.filter((p) => !structuredSet.has(p));
  const drawCount = Math.max(1, Math.round(structured.length * config.randomSampleRatio));
  const random = [];

  const pool = candidates.slice();
  while (random.length < drawCount && pool.length > 0) {
    const index = Math.floor(rng() * pool.length);
    random.push(pool.splice(index, 1)[0]);
  }

  return { structured, random };
};

const parseArgs = (argv) => {
  const args = { baseUrl: null, seed: null, verbose: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--base-url') {
      args.baseUrl = argv[i + 1];
      i += 1;
    } else if (arg === '--seed') {
      args.seed = Number(argv[i + 1]);
      i += 1;
    } else if (arg === '--verbose') {
      args.verbose = true;
    }
  }

  return args;
};

/**
 * Deterministic RNG so a run can be reproduced from its recorded seed.
 * mulberry32 — small, no dependency, adequate for sample selection.
 */
const createRng = (seed) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const fetchSitemapPaths = async (baseUrl, sitemapPath) => {
  const response = await fetch(new URL(sitemapPath, baseUrl).href);
  if (!response.ok) {
    throw new Error(`Sitemap fetch failed: ${response.status} ${response.statusText}`);
  }
  const xml = await response.text();
  const matches = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
  return matches.map((entry) => {
    const url = entry.replace(/<\/?loc>/g, '').trim();
    return new URL(url).pathname;
  });
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));

  if (!args.baseUrl) {
    console.error('Error: --base-url is required (no default, so targeting production is deliberate).');
    console.error('Example: pnpm run focus-audit -- --base-url http://localhost:8080');
    process.exit(1);
  }

  const config = require(path.join(__dirname, 'jonplummer.config.js'));
  const seed = Number.isFinite(args.seed) ? args.seed : Date.now();
  const rng = createRng(seed);

  let allPaths = [];
  try {
    allPaths = await fetchSitemapPaths(args.baseUrl, config.sitemapPath);
  } catch (error) {
    console.error(`Error: could not reach ${args.baseUrl} — ${error.message}`);
    console.error('Is the dev server running? Try: pnpm run dev');
    process.exit(1);
  }

  const pages = selectPages(config, allPaths, rng);

  console.log(`Base URL: ${args.baseUrl}`);
  console.log(`Seed: ${seed}`);
  console.log(`Sitemap paths discovered: ${allPaths.length}`);
  console.log(`\nStructured sample (${pages.structured.length}):`);
  config.structuredSample.forEach((entry) => {
    console.log(`  ${entry.path}  — ${entry.why}`);
  });
  console.log(`\nRandom sample (${pages.random.length}):`);
  pages.random.forEach((p) => console.log(`  ${p}`));
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { selectPages, parseArgs, createRng };
```

- [ ] **Step 3: Add the package.json script**

In `package.json`, in the `scripts` object, add alongside the other maintenance entries:

```json
"focus-audit": "node scripts/focus-audit/cli.js",
```

- [ ] **Step 4: Verify the missing-base-URL error**

Run: `pnpm run focus-audit`

Expected: exits non-zero, prints `Error: --base-url is required` and the example line. No stack trace.

- [ ] **Step 5: Verify the unreachable-server error**

Run: `pnpm run focus-audit -- --base-url http://localhost:9999`

Expected: exits non-zero, prints `could not reach http://localhost:9999` and the `pnpm run dev` hint. No stack trace.

- [ ] **Step 6: Verify page selection against the dev server**

Run: `pnpm run focus-audit -- --base-url http://localhost:8080 --seed 1`

Expected: prints the base URL, `Seed: 1`, a sitemap count in the low hundreds, all 12 structured paths with their reasons, and either 1 or 2 random paths that are not among the 12. Re-running with `--seed 1` must print the identical random draw.

- [ ] **Step 7: Commit**

```bash
git add scripts/focus-audit/cli.js scripts/focus-audit/jonplummer.config.js package.json
git commit -m "Add focus-audit CLI with WCAG-EM structured and random sampling"
```

---

### Task 2: Tab sweep collector

**Files:**

- Create: `scripts/focus-audit/collect.js`
- Modify: `scripts/focus-audit/cli.js`

**Interfaces:**

- Consumes: nothing from Task 1 except that `cli.js` will call into this.
- Produces: `collect.js` exports `{ sweepPage }` with signature `async sweepPage(page, { maxStops = 200 }) -> { forward: Stop[], reverse: Stop[] }`. A `Stop` is `{ ordinal, selector, tagName, role, name, disabled, href, inputType, domIndex, rect: { x, y, width, height }, visible, clipped, landmark }`. `domIndex` is the element's position in document order, used later to compare tab order against DOM order. `rect` is in page coordinates. `selector` is a CSS path unique within the document.

- [ ] **Step 1: Create the collector with in-page descriptor extraction**

Create `scripts/focus-audit/collect.js`:

```js
'use strict';

/**
 * Site-agnostic focus and keyboard evidence collector.
 *
 * Must not require anything outside this directory — the whole point is that
 * this file lifts into another project unchanged.
 */

/**
 * Runs in the browser. Describes document.activeElement well enough to
 * identify it later, including whether it is genuinely visible: zero-sized
 * and overflow-clipped elements are focusable but effectively hidden, which
 * is how focusable things disappear in practice.
 */
const describeActiveElement = () => {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) {
    return null;
  }

  const cssPath = (node) => {
    const parts = [];
    let current = node;
    while (current && current.nodeType === 1 && current !== document.documentElement) {
      let part = current.tagName.toLowerCase();
      if (current.id) {
        part += `#${CSS.escape(current.id)}`;
        parts.unshift(part);
        break;
      }
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((c) => c.tagName === current.tagName);
        if (siblings.length > 1) {
          part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
        }
      }
      parts.unshift(part);
      current = current.parentElement;
    }
    return parts.join(' > ');
  };

  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);

  // Clipped: any ancestor with hidden overflow whose box excludes this one.
  let clipped = false;
  let ancestor = el.parentElement;
  while (ancestor && !clipped) {
    const aStyle = window.getComputedStyle(ancestor);
    if (aStyle.overflow !== 'visible' && aStyle.overflow !== '') {
      const aRect = ancestor.getBoundingClientRect();
      if (rect.right <= aRect.left || rect.left >= aRect.right
        || rect.bottom <= aRect.top || rect.top >= aRect.bottom) {
        clipped = true;
      }
    }
    ancestor = ancestor.parentElement;
  }

  const landmarkEl = el.closest('main, nav, header, footer, aside, section[aria-label], [role]');

  return {
    selector: cssPath(el),
    tagName: el.tagName.toLowerCase(),
    domIndex: Array.prototype.indexOf.call(document.querySelectorAll('*'), el),
    disabled: Boolean(el.disabled),
    href: el.getAttribute('href') || null,
    inputType: el.getAttribute('type') || null,
    rect: {
      x: rect.x + window.scrollX,
      y: rect.y + window.scrollY,
      width: rect.width,
      height: rect.height,
    },
    visible: style.display !== 'none'
      && style.visibility !== 'hidden'
      && Number(style.opacity) !== 0
      && rect.width > 0
      && rect.height > 0,
    clipped,
    landmark: landmarkEl ? (landmarkEl.tagName.toLowerCase() + (landmarkEl.getAttribute('role') ? `[role=${landmarkEl.getAttribute('role')}]` : '')) : null,
  };
};

/**
 * Accessible name and role come from the browser's accessibility tree rather
 * than a local reimplementation of accname — getting that wrong is a classic
 * source of misleading audit output.
 */
const readAccessibleInfo = async (page) => {
  const handle = await page.evaluateHandle(() => document.activeElement);
  const element = handle.asElement();
  if (!element) {
    await handle.dispose();
    return { name: null, role: null };
  }
  let snapshot = null;
  try {
    snapshot = await page.accessibility.snapshot({ root: element, interestingOnly: false });
  } catch (error) {
    snapshot = null;
  }
  await handle.dispose();
  return { name: snapshot ? snapshot.name || null : null, role: snapshot ? snapshot.role || null : null };
};

const sweepDirection = async (page, key, maxStops) => {
  const stops = [];
  const seen = new Set();

  await page.evaluate(() => {
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    window.scrollTo(0, 0);
  });

  for (let i = 0; i < maxStops; i += 1) {
    await page.keyboard.press(key);
    const descriptor = await page.evaluate(describeActiveElement);
    if (!descriptor) {
      break; // Focus left the document.
    }
    const identity = descriptor.selector;
    if (seen.has(identity)) {
      break; // Cycled back around.
    }
    seen.add(identity);
    const accessible = await readAccessibleInfo(page);
    stops.push({ ordinal: stops.length + 1, ...descriptor, ...accessible });
  }

  return stops;
};

const sweepPage = async (page, options = {}) => {
  const maxStops = options.maxStops || 200;
  const forward = await sweepDirection(page, 'Tab', maxStops);
  const reverse = await sweepDirection(page, 'Shift+Tab', maxStops);
  return { forward, reverse };
};

module.exports = { sweepPage, describeActiveElement };
```

- [ ] **Step 2: Wire the sweep into the CLI**

In `scripts/focus-audit/cli.js`, add `const puppeteer = require('puppeteer');` and `const { sweepPage } = require('./collect');` at the top with the other requires. Then replace the final `console.log` block of `main` (the `Random sample` listing) with the following, keeping the listing lines above it:

```js
  const browser = await puppeteer.launch({ headless: true });
  const allSelected = [...pages.structured, ...pages.random];
  const results = [];

  for (const pagePath of allSelected) {
    const tab = await browser.newPage();
    await tab.setViewport({ width: 1280, height: 900 });
    await tab.goto(new URL(pagePath, args.baseUrl).href, { waitUntil: 'domcontentloaded' });
    const sweep = await sweepPage(tab);
    results.push({ path: pagePath, sweep });
    console.log(`${pagePath}: ${sweep.forward.length} forward stops, ${sweep.reverse.length} reverse`);
    await tab.close();
  }

  await browser.close();
```

- [ ] **Step 3: Verify the sweep on the home page**

Run: `pnpm run focus-audit -- --base-url http://localhost:8080 --seed 1`

Expected: a line per page with a plausible forward stop count (home should be roughly 15–40) and a reverse count within one of it. No page reports 0 stops. No page hits the 200 cap.

- [ ] **Step 4: Verify the first stop is the skip link**

Add a temporary debug line after the `results.push` call:

```js
    if (pagePath === '/') console.log(JSON.stringify(sweep.forward.slice(0, 3), null, 2));
```

Run the same command.

Expected: the first stop has `tagName: "a"`, `href: "#main"`, and a name of `"Skip to content"`. If the name is `null`, the accessibility snapshot wiring is wrong — fix before continuing. Remove the debug line afterward.

- [ ] **Step 5: Commit**

```bash
git add scripts/focus-audit/collect.js scripts/focus-audit/cli.js
git commit -m "Collect forward and reverse tab stops with accessible names"
```

---

### Task 3: Focus visibility evidence per ACT rule oj04fd

**Files:**

- Modify: `scripts/focus-audit/collect.js`

**Interfaces:**

- Consumes: `sweepPage` from Task 2.
- Produces: `collect.js` additionally exports `{ measureFocusVisibility }` with signature `async measureFocusVisibility(page) -> { differingPixels, totalPixels, changeRegion, styles }`. It reads `document.activeElement` itself rather than taking a stop, so the caller does not have to re-resolve a handle. `changeRegion` is `{ minX, minY, maxX, maxY }` in viewport coordinates, or `null` when nothing differed. `styles` is `{ focused: {...}, unfocused: {...} }` with keys `outline`, `boxShadow`, `textDecorationLine`, `color`, `backgroundColor`, `border`. `sweepPage` gains an option `{ measureVisibility: boolean }`; when true each forward stop gains a `focusVisibility` property holding that object.

**Method (from the spec, which follows ACT rule `oj04fd`):** the comparison is over the whole viewport scrolling area, not the element's box, because indicators can be drawn elsewhere. Pixels are compared by HSL value. Focus must dwell one second before sampling, because the rule excludes elements that lose focus within a second.

- [ ] **Step 1: Add the in-browser image differ**

Add to `scripts/focus-audit/collect.js`, above `sweepPage`:

```js
/**
 * Compares two base64 PNGs inside the browser using canvas. Done in-page
 * rather than in Node so the tool needs no PNG-decoding dependency.
 *
 * ACT rule oj04fd expects "at least one device pixel inside the scrolling
 * area of the viewport whose HSL color value is different when the element
 * is focused from when it is not", so comparison is on HSL, and any
 * difference counts.
 */
const diffScreenshotsInPage = async (page, focusedB64, unfocusedB64) => page.evaluate(
  async (focusedData, unfocusedData) => {
    const load = async (data) => {
      const response = await fetch(`data:image/png;base64,${data}`);
      const blob = await response.blob();
      return createImageBitmap(blob);
    };

    const [a, b] = await Promise.all([load(focusedData), load(unfocusedData)]);
    const width = Math.min(a.width, b.width);
    const height = Math.min(a.height, b.height);

    const draw = (bitmap) => {
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      return ctx.getImageData(0, 0, width, height).data;
    };

    const dataA = draw(a);
    const dataB = draw(b);

    const toHsl = (r, g, bl) => {
      const rn = r / 255;
      const gn = g / 255;
      const bn = bl / 255;
      const max = Math.max(rn, gn, bn);
      const min = Math.min(rn, gn, bn);
      const l = (max + min) / 2;
      if (max === min) return [0, 0, l];
      const d = max - min;
      const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      let h;
      if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
      else if (max === gn) h = ((bn - rn) / d + 2) / 6;
      else h = ((rn - gn) / d + 4) / 6;
      return [h, s, l];
    };

    let differingPixels = 0;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < dataA.length; i += 4) {
      const hslA = toHsl(dataA[i], dataA[i + 1], dataA[i + 2]);
      const hslB = toHsl(dataB[i], dataB[i + 1], dataB[i + 2]);
      if (hslA[0] !== hslB[0] || hslA[1] !== hslB[1] || hslA[2] !== hslB[2]) {
        differingPixels += 1;
        const pixelIndex = i / 4;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }

    return {
      differingPixels,
      totalPixels: width * height,
      changeRegion: differingPixels > 0 ? { minX, minY, maxX, maxY } : null,
    };
  },
  focusedB64,
  unfocusedB64,
);
```

- [ ] **Step 2: Add the measurement routine**

Add to `scripts/focus-audit/collect.js`, below the differ:

```js
const FOCUS_DWELL_MS = 1000;

const readFocusStyles = async (page) => page.evaluate(() => {
  const el = document.activeElement;
  if (!el) return null;
  const s = window.getComputedStyle(el);
  return {
    outline: `${s.outlineWidth} ${s.outlineStyle} ${s.outlineColor}`,
    boxShadow: s.boxShadow,
    textDecorationLine: s.textDecorationLine,
    color: s.color,
    backgroundColor: s.backgroundColor,
    border: `${s.borderWidth} ${s.borderStyle} ${s.borderColor}`,
  };
});

/**
 * Captures focused and unfocused viewport states at an identical scroll
 * position. Blurring does not scroll, so the pair is directly comparable.
 * The element is re-focused afterwards so the sweep can continue from here.
 */
const measureFocusVisibility = async (page) => {
  await new Promise((resolve) => setTimeout(resolve, FOCUS_DWELL_MS));

  const focusedStyles = await readFocusStyles(page);
  const focusedShot = await page.screenshot({ encoding: 'base64' });

  const handle = await page.evaluateHandle(() => {
    const el = document.activeElement;
    if (el && el.blur) el.blur();
    return el;
  });

  const unfocusedStyles = await readFocusStyles(page);
  const unfocusedShot = await page.screenshot({ encoding: 'base64' });

  const element = handle.asElement();
  if (element) {
    await element.focus();
  }
  await handle.dispose();

  const diff = await diffScreenshotsInPage(page, focusedShot, unfocusedShot);

  return {
    ...diff,
    styles: { focused: focusedStyles, unfocused: unfocusedStyles },
  };
};
```

- [ ] **Step 3: Call it from the forward sweep**

In `sweepDirection`, change the signature to `async (page, key, maxStops, measureVisibility)` and, immediately after the `stops.push(...)` line, add:

```js
    if (measureVisibility) {
      stops[stops.length - 1].focusVisibility = await measureFocusVisibility(page);
    }
```

Then update `sweepPage`:

```js
const sweepPage = async (page, options = {}) => {
  const maxStops = options.maxStops || 200;
  const forward = await sweepDirection(page, 'Tab', maxStops, Boolean(options.measureVisibility));
  const reverse = await sweepDirection(page, 'Shift+Tab', maxStops, false);
  return { forward, reverse };
};
```

Add `measureFocusVisibility` to `module.exports`.

- [ ] **Step 4: Enable measurement in the CLI**

In `scripts/focus-audit/cli.js`, change the sweep call to:

```js
    const sweep = await sweepPage(tab, { measureVisibility: true });
```

- [ ] **Step 5: Verify on a single page**

Temporarily narrow the run by changing `const allSelected = [...pages.structured, ...pages.random];` to `const allSelected = ['/'];`, then add a debug line after `results.push`:

```js
    console.log(JSON.stringify(sweep.forward.map((s) => ({
      ordinal: s.ordinal, name: s.name, px: s.focusVisibility.differingPixels,
    })), null, 2));
```

Run: `pnpm run focus-audit -- --base-url http://localhost:8080 --seed 1`

Expected: every stop reports `px` greater than 0. This site never sets `outline: none`, so the UA focus ring should satisfy `oj04fd` everywhere — a `px` of 0 means either a genuine finding or, more likely at this stage, a bug in the capture pair. Investigate any zero before continuing. Runtime will be roughly one second per stop; a 30-stop page takes about a minute.

- [ ] **Step 6: Restore the full page list**

Revert the two temporary edits from Step 5 (`allSelected` and the debug line).

- [ ] **Step 7: Commit**

```bash
git add scripts/focus-audit/collect.js scripts/focus-audit/cli.js
git commit -m "Measure focus visibility by HSL viewport diff per ACT oj04fd"
```

---

### Task 4: Scenario engine

**Files:**

- Create: `scripts/focus-audit/scenarios.js`
- Modify: `scripts/focus-audit/jonplummer.config.js`
- Modify: `scripts/focus-audit/cli.js`

**Interfaces:**

- Consumes: `describeActiveElement` from `collect.js`.
- Produces: `scenarios.js` exports `{ runScenario }` with signature `async runScenario(page, scenario, baseUrl) -> { id, steps: StepResult[] }`. A `scenario` is `{ id, title, path, steps: Step[] }`. A `Step` is one of `{ action: 'click', selector }`, `{ action: 'press', key }`, `{ action: 'tab', times }`, or `{ action: 'expectFocus', selector, description }`. A `StepResult` is `{ step, ok, activeElement, note }` where `activeElement` is a descriptor from `describeActiveElement` or `null`.

- [ ] **Step 1: Create the scenario runner**

Create `scripts/focus-audit/scenarios.js`:

```js
'use strict';

const { describeActiveElement } = require('./collect');

/**
 * Declarative scenario steps, so a different site supplies data rather than
 * code. Every step records where focus ended up, which is what makes a failed
 * expectation diagnosable rather than just red.
 */
const runStep = async (page, step) => {
  let note = null;
  let ok = true;

  if (step.action === 'click') {
    try {
      await page.click(step.selector);
    } catch (error) {
      ok = false;
      note = `click failed: ${error.message}`;
    }
  } else if (step.action === 'press') {
    await page.keyboard.press(step.key);
  } else if (step.action === 'tab') {
    for (let i = 0; i < step.times; i += 1) {
      await page.keyboard.press('Tab');
    }
  } else if (step.action === 'expectFocus') {
    const matches = await page.evaluate((selector) => {
      const target = document.querySelector(selector);
      return Boolean(target) && document.activeElement === target;
    }, step.selector);
    ok = matches;
    if (!ok) note = `expected focus on ${step.selector}`;
  } else {
    ok = false;
    note = `unknown action: ${step.action}`;
  }

  const activeElement = await page.evaluate(describeActiveElement);
  return { step, ok, activeElement, note };
};

const runScenario = async (page, scenario, baseUrl) => {
  await page.goto(new URL(scenario.path, baseUrl).href, { waitUntil: 'domcontentloaded' });
  const steps = [];
  for (const step of scenario.steps) {
    steps.push(await runStep(page, step));
  }
  return { id: scenario.id, title: scenario.title, path: scenario.path, steps };
};

module.exports = { runScenario };
```

- [ ] **Step 2: Define this site's scenarios**

In `scripts/focus-audit/jonplummer.config.js`, replace `scenarios: []` with the array below, and define it above `module.exports`:

```js
const scenarios = [
  {
    id: 'skip-link',
    title: 'Skip link moves focus to main content',
    path: '/',
    steps: [
      { action: 'tab', times: 1 },
      { action: 'expectFocus', selector: 'header a.skip', description: 'skip link is the first tab stop' },
      { action: 'press', key: 'Enter' },
      { action: 'expectFocus', selector: '#main', description: 'focus lands on main after activating the skip link' },
    ],
  },
  {
    id: 'lightbox',
    title: 'Figure lightbox opens, navigates, and restores focus',
    path: '/2026/04/04/sometimes-you-take-over/',
    steps: [
      { action: 'click', selector: 'main figure a.figure-lightbox-trigger' },
      { action: 'expectFocus', selector: '#figure-lightbox-close', description: 'focus enters the dialog' },
      { action: 'press', key: 'ArrowRight' },
      { action: 'press', key: 'ArrowRight' },
      { action: 'press', key: 'ArrowRight' },
      { action: 'press', key: 'Escape' },
      { action: 'expectFocus', selector: 'main figure a.figure-lightbox-trigger', description: 'focus returns to the trigger' },
    ],
  },
  {
    id: 'content-warning',
    title: 'Content-warning disclosure is keyboard operable',
    path: '/2026/02/11/a-conversation-about-religion/',
    steps: [
      { action: 'click', selector: 'article details summary' },
      { action: 'expectFocus', selector: 'article details summary', description: 'summary holds focus after toggling' },
      { action: 'press', key: 'Space' },
      { action: 'expectFocus', selector: 'article details summary', description: 'summary still holds focus after Space' },
    ],
  },
];
```

- [ ] **Step 3: Run scenarios from the CLI**

In `scripts/focus-audit/cli.js`, add `const { runScenario } = require('./scenarios');` with the other requires, and insert before `await browser.close();`:

```js
  const scenarioResults = [];
  for (const scenario of config.scenarios) {
    const tab = await browser.newPage();
    await tab.setViewport({ width: 1280, height: 900 });
    scenarioResults.push(await runScenario(tab, scenario, args.baseUrl));
    await tab.close();
  }

  scenarioResults.forEach((result) => {
    const failures = result.steps.filter((s) => !s.ok);
    console.log(`${result.id}: ${failures.length === 0 ? 'all steps ok' : `${failures.length} failed`}`);
    failures.forEach((f) => console.log(`  ${f.note} — focus was on ${f.activeElement ? f.activeElement.selector : 'nothing'}`));
  });
```

- [ ] **Step 4: Verify the scenarios run and report legibly**

Run: `pnpm run focus-audit -- --base-url http://localhost:8080 --seed 1`

Expected: three scenario lines. `skip-link` should report all steps ok. `lightbox` and `content-warning` may legitimately fail — that is the point of the audit — but every failure must name both the expectation and where focus actually was. A failure reporting `focus was on nothing` on the lightbox arrow steps is the predicted `disabled`-button defect from the spec; record it, do not fix it here.

- [ ] **Step 5: Commit**

```bash
git add scripts/focus-audit/scenarios.js scripts/focus-audit/jonplummer.config.js scripts/focus-audit/cli.js
git commit -m "Add declarative scenario engine for skip link, lightbox, disclosure"
```

---

### Task 5: Rules and EARL JSON-LD output

**Files:**

- Create: `scripts/focus-audit/rules.js`
- Create: `scripts/focus-audit/earl.js`
- Create: `scripts/focus-audit/evaluate.js`
- Modify: `scripts/focus-audit/cli.js`

**Interfaces:**

- Consumes: sweep results from Task 2/3 and scenario results from Task 4.
- Produces: `rules.js` exports `{ RULES }`, an array of `{ id, title, actRuleId, criteria: string[], severity: 'failure'|'warning' }` where `criteria` entries are `WCAG2:` identifiers. `earl.js` exports `{ buildReport, EARL_CONTEXT }` with signature `buildReport(subjects, meta) -> object`, where a `subject` is `{ source, assertions }`, an assertion is `{ ruleId, outcome, pointer, evidence }`, and `meta` is the run metadata block written to `runMetadata`. `evaluate.js` exports `{ evaluatePage, evaluateScenario }` returning arrays of those assertion objects.

- [ ] **Step 1: Define the rules with their criteria and ACT identifiers**

Create `scripts/focus-audit/rules.js`:

```js
'use strict';

/**
 * Rule definitions. Each carries the WCAG success criteria it produces
 * evidence for, and the ACT rule identifier where a published one exists.
 *
 * A criterion tag means "this evidence bears on that criterion", never "this
 * criterion is satisfied". ACT's own outcome mapping for oj04fd is explicit:
 * any failure means the criterion is not satisfied, but all passes mean only
 * that it needs further testing.
 *
 * WCAG is not site-specific, so this file stays in the portable layer.
 */
const RULES = [
  {
    id: 'focus-visible',
    title: 'Element in sequential focus order has visible focus',
    actRuleId: 'oj04fd',
    criteria: ['WCAG2:focus-visible'],
    severity: 'failure',
  },
  {
    id: 'focus-not-obscured',
    title: 'Focused element is not hidden or clipped',
    actRuleId: null,
    criteria: ['WCAG2:focus-not-obscured-minimum'],
    severity: 'failure',
  },
  {
    id: 'focus-order-symmetric',
    title: 'Forward and reverse focus order agree',
    actRuleId: null,
    criteria: ['WCAG2:focus-order'],
    severity: 'failure',
  },
  {
    id: 'focus-order-geometric',
    title: 'Focus order follows visual reading order',
    actRuleId: null,
    criteria: ['WCAG2:focus-order'],
    severity: 'warning',
  },
  {
    id: 'focus-order-dom',
    title: 'Focus order follows document order',
    actRuleId: null,
    criteria: ['WCAG2:focus-order'],
    severity: 'warning',
  },
  {
    id: 'focus-indicator-perimeter',
    title: 'Focus indicator includes a perimeter change, not only an interior color shift',
    actRuleId: null,
    criteria: ['WCAG2:focus-appearance'],
    severity: 'warning',
  },
  {
    id: 'scenario-expectation',
    title: 'Interactive component behaves as expected under keyboard operation',
    actRuleId: null,
    criteria: ['WCAG2:keyboard', 'WCAG2:focus-order', 'WCAG2:no-keyboard-trap'],
    severity: 'failure',
  },
  {
    id: 'bypass-blocks',
    title: 'A mechanism exists to bypass repeated blocks',
    actRuleId: null,
    criteria: ['WCAG2:bypass-blocks'],
    severity: 'failure',
  },
];

const ruleById = (id) => RULES.find((rule) => rule.id === id);

module.exports = { RULES, ruleById };
```

- [ ] **Step 2: Build the EARL JSON-LD serializer**

Create `scripts/focus-audit/earl.js`:

```js
'use strict';

const { ruleById } = require('./rules');

/**
 * EARL 1.0 serialized as JSON-LD, per the WAI reporting format at
 * https://www.w3.org/WAI/standards-guidelines/act/report/earl/
 *
 * Using the standard format rather than an invented one means the output is
 * ingestible by other accessibility tooling. Per-observation evidence rides
 * along as an extension property; standard consumers ignore it.
 *
 * Confirm the context URL against the WAI page above before the first real
 * run — it is the ACT community context and has moved before.
 */
const EARL_CONTEXT = 'https://act-rules.github.io/earl-context.json';

const buildAssertion = (assertion) => {
  const rule = ruleById(assertion.ruleId);
  return {
    '@type': 'Assertion',
    mode: 'earl:semiAuto',
    test: {
      '@type': 'TestCase',
      title: rule.title,
      ...(rule.actRuleId ? { '@id': `https://www.w3.org/WAI/standards-guidelines/act/rules/${rule.actRuleId}/` } : {}),
      isPartOf: rule.criteria,
    },
    result: {
      '@type': 'TestResult',
      outcome: assertion.outcome,
      ...(assertion.pointer ? { pointer: assertion.pointer } : {}),
    },
    evidence: assertion.evidence || null,
  };
};

const buildReport = (subjects, meta) => ({
  '@context': EARL_CONTEXT,
  '@graph': subjects.map((subject) => ({
    '@type': 'TestSubject',
    source: subject.source,
    assertions: subject.assertions.map(buildAssertion),
  })),
  runMetadata: meta,
});

module.exports = { buildReport, EARL_CONTEXT };
```

- [ ] **Step 3: Write the evaluator**

Create `scripts/focus-audit/evaluate.js`:

```js
'use strict';

/**
 * Turns collected evidence into EARL assertions. Deterministic conclusions
 * become passed/failed; anything needing human judgment becomes cantTell,
 * which is EARL's own name for "the tool could not be sure".
 */

const ROW_TOLERANCE_PX = 12;

const evaluatePage = (pageResult) => {
  const assertions = [];
  const { forward, reverse } = pageResult.sweep;

  forward.forEach((stop) => {
    const pointer = stop.selector;

    if (stop.focusVisibility) {
      assertions.push({
        ruleId: 'focus-visible',
        outcome: stop.focusVisibility.differingPixels > 0 ? 'earl:passed' : 'earl:failed',
        pointer,
        evidence: {
          differingPixels: stop.focusVisibility.differingPixels,
          changeRegion: stop.focusVisibility.changeRegion,
          styles: stop.focusVisibility.styles,
          accessibleName: stop.name,
        },
      });

      // Whether an indicator is legible is judgment; whether it touches the
      // element perimeter is measurable and correlates with legibility.
      const region = stop.focusVisibility.changeRegion;
      const perimeterInvolved = region
        && (region.maxX - region.minX >= stop.rect.width - 2
          || region.maxY - region.minY >= stop.rect.height - 2);
      assertions.push({
        ruleId: 'focus-indicator-perimeter',
        outcome: perimeterInvolved ? 'earl:passed' : 'earl:cantTell',
        pointer,
        evidence: { changeRegion: region, elementRect: stop.rect },
      });
    }

    assertions.push({
      ruleId: 'focus-not-obscured',
      outcome: stop.visible && !stop.clipped ? 'earl:passed' : 'earl:failed',
      pointer,
      evidence: { visible: stop.visible, clipped: stop.clipped, rect: stop.rect },
    });
  });

  // Reverse order should be the mirror of forward order.
  const forwardSelectors = forward.map((s) => s.selector);
  const reverseSelectors = reverse.map((s) => s.selector).reverse();
  const symmetric = forwardSelectors.length === reverseSelectors.length
    && forwardSelectors.every((sel, i) => sel === reverseSelectors[i]);
  assertions.push({
    ruleId: 'focus-order-symmetric',
    outcome: symmetric ? 'earl:passed' : 'earl:failed',
    pointer: null,
    evidence: { forward: forwardSelectors, reverse: reverseSelectors },
  });

  // Geometric order: each stop should be at or below the previous one, and to
  // its right when on the same visual row. Divergence is sometimes correct,
  // so this is cantTell rather than failed.
  const outOfOrder = [];
  for (let i = 1; i < forward.length; i += 1) {
    const prev = forward[i - 1].rect;
    const curr = forward[i].rect;
    const sameRow = Math.abs(curr.y - prev.y) <= ROW_TOLERANCE_PX;
    if (curr.y < prev.y - ROW_TOLERANCE_PX || (sameRow && curr.x < prev.x)) {
      outOfOrder.push({ from: forward[i - 1].selector, to: forward[i].selector });
    }
  }
  assertions.push({
    ruleId: 'focus-order-geometric',
    outcome: outOfOrder.length === 0 ? 'earl:passed' : 'earl:cantTell',
    pointer: null,
    evidence: { outOfOrder },
  });

  // Document order: tab order should advance monotonically through the DOM.
  // Departures are legal (positive tabindex, reordered flex/grid) but are
  // worth a person's attention, so cantTell rather than failed.
  const domRegressions = [];
  for (let i = 1; i < forward.length; i += 1) {
    if (forward[i].domIndex < forward[i - 1].domIndex) {
      domRegressions.push({ from: forward[i - 1].selector, to: forward[i].selector });
    }
  }
  assertions.push({
    ruleId: 'focus-order-dom',
    outcome: domRegressions.length === 0 ? 'earl:passed' : 'earl:cantTell',
    pointer: null,
    evidence: { domRegressions },
  });

  // Bypass blocks: a skip mechanism should be reachable early.
  const skipIndex = forward.findIndex((s) => s.href && s.href.startsWith('#'));
  assertions.push({
    ruleId: 'bypass-blocks',
    outcome: skipIndex === 0 ? 'earl:passed' : 'earl:cantTell',
    pointer: skipIndex >= 0 ? forward[skipIndex].selector : null,
    evidence: { firstInPageAnchorAt: skipIndex >= 0 ? skipIndex + 1 : null, totalStops: forward.length },
  });

  return assertions;
};

const evaluateScenario = (scenarioResult) => scenarioResult.steps
  .filter((step) => step.step.action === 'expectFocus')
  .map((step) => ({
    ruleId: 'scenario-expectation',
    outcome: step.ok ? 'earl:passed' : 'earl:failed',
    pointer: step.step.selector,
    evidence: {
      scenario: scenarioResult.id,
      description: step.step.description,
      actualFocus: step.activeElement ? step.activeElement.selector : null,
      note: step.note,
    },
  }));

module.exports = { evaluatePage, evaluateScenario };
```

- [ ] **Step 4: Emit the EARL file from the CLI**

In `scripts/focus-audit/cli.js`, add these requires:

```js
const fs = require('fs');
const { evaluatePage, evaluateScenario } = require('./evaluate');
const { buildReport } = require('./earl');
```

Then, after the scenario loop and before `await browser.close();`, add:

```js
  const subjects = results.map((result) => ({
    source: new URL(result.path, args.baseUrl).href,
    assertions: evaluatePage(result),
  }));

  scenarioResults.forEach((result) => {
    subjects.push({
      source: new URL(result.path, args.baseUrl).href,
      assertions: evaluateScenario(result),
    });
  });

  const runDate = new Date().toISOString().slice(0, 10);
  const outputDir = path.join(__dirname, '..', '..', 'docs', 'designs', 'scratch');
  fs.mkdirSync(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, `${runDate}-focus-keyboard-audit.json`);

  const earl = buildReport(subjects, {
    baseUrl: args.baseUrl,
    seed,
    structuredSample: pages.structured,
    randomSample: pages.random,
    completeProcesses: 'none — this site has no multi-step flow',
    generatedAt: new Date().toISOString(),
  });

  fs.writeFileSync(jsonPath, `${JSON.stringify(earl, null, 2)}\n`);
  console.log(`\nEvidence written to ${jsonPath}`);
```

- [ ] **Step 5: Verify the EARL output shape**

Run: `pnpm run focus-audit -- --base-url http://localhost:8080 --seed 1`

Then inspect: `node -e "const r=require('./docs/designs/scratch/'+new Date().toISOString().slice(0,10)+'-focus-keyboard-audit.json'); console.log(r['@context']); console.log(r['@graph'].length); console.log(JSON.stringify(r['@graph'][0].assertions[0],null,2));"`

Expected: the context URL prints, the graph has at least 15 subjects, and the first assertion has `@type: "Assertion"`, a `test` object with `isPartOf: ["WCAG2:focus-visible"]` and an `@id` pointing at the `oj04fd` rule page, `mode: "earl:semiAuto"`, and a `result.outcome` beginning `earl:`.

- [ ] **Step 6: Confirm the context URL resolves**

Run: `curl -sS -o /dev/null -w '%{http_code}\n' https://act-rules.github.io/earl-context.json`

Expected: `200`. If not, find the current context URL from <https://www.w3.org/WAI/standards-guidelines/act/report/earl/> and update `EARL_CONTEXT` in `earl.js`.

- [ ] **Step 7: Commit**

```bash
git add scripts/focus-audit/rules.js scripts/focus-audit/earl.js scripts/focus-audit/evaluate.js scripts/focus-audit/cli.js
git commit -m "Emit EARL JSON-LD assertions tagged with WCAG criteria and ACT rule ids"
```

---

### Task 6: Markdown reporter

**Files:**

- Create: `scripts/focus-audit/report.js`
- Modify: `scripts/focus-audit/cli.js`

**Interfaces:**

- Consumes: the EARL object from `buildReport`.
- Produces: `report.js` exports `{ renderMarkdown }` with signature `renderMarkdown(earl) -> string`.

- [ ] **Step 1: Write the reporter**

Create `scripts/focus-audit/report.js`:

```js
'use strict';

const { RULES } = require('./rules');

/**
 * Renders EARL evidence as markdown, grouped by success criterion rather than
 * by page, because that is how a conformance report is organized and it is
 * the view that answers "what is broken about focus visibility" directly.
 *
 * Deliberately does not emit conformance levels. Those are attestations for a
 * person to make.
 */
const OUTCOME_LABEL = {
  'earl:passed': 'passed',
  'earl:failed': 'FAILED',
  'earl:cantTell': 'needs judgment',
  'earl:inapplicable': 'inapplicable',
  'earl:untested': 'untested',
};

const renderMarkdown = (earl) => {
  const meta = earl.runMetadata;
  const lines = [];

  lines.push('# Focus and keyboard audit');
  lines.push('');
  lines.push(`**Base URL:** ${meta.baseUrl}`);
  lines.push(`**Run:** ${meta.generatedAt}  |  **Seed:** ${meta.seed}`);
  lines.push('');
  lines.push('Sampling follows WCAG-EM 2.0 Step 3. Outcomes use the EARL vocabulary. A passing');
  lines.push('outcome means the check found no defect, not that the success criterion is');
  lines.push('satisfied — ACT maps all-passed to "needs further testing".');
  lines.push('');
  lines.push(`**Structured sample:** ${meta.structuredSample.length} pages`);
  lines.push(`**Random sample:** ${meta.randomSample.join(', ') || 'none'}`);
  lines.push(`**Complete processes:** ${meta.completeProcesses}`);
  lines.push('');

  // Collect every assertion with its subject.
  const flat = [];
  earl['@graph'].forEach((subject) => {
    subject.assertions.forEach((assertion) => {
      flat.push({ source: subject.source, assertion });
    });
  });

  const criteria = new Set();
  flat.forEach(({ assertion }) => assertion.test.isPartOf.forEach((c) => criteria.add(c)));

  lines.push('## Summary');
  lines.push('');
  lines.push('| Criterion | Failed | Needs judgment | Passed |');
  lines.push('| --- | --- | --- | --- |');
  Array.from(criteria).sort().forEach((criterion) => {
    const relevant = flat.filter(({ assertion }) => assertion.test.isPartOf.includes(criterion));
    const count = (outcome) => relevant.filter(({ assertion }) => assertion.result.outcome === outcome).length;
    lines.push(`| ${criterion} | ${count('earl:failed')} | ${count('earl:cantTell')} | ${count('earl:passed')} |`);
  });
  lines.push('');

  ['earl:failed', 'earl:cantTell'].forEach((outcome) => {
    const group = flat.filter(({ assertion }) => assertion.result.outcome === outcome);
    if (group.length === 0) return;

    lines.push(`## ${outcome === 'earl:failed' ? 'Failures' : 'Needs judgment'}`);
    lines.push('');
    if (outcome === 'earl:cantTell') {
      lines.push('The tool could not determine pass or fail for these. Each needs a person or');
      lines.push('an agent to rule on it using the evidence shown.');
      lines.push('');
    }

    RULES.forEach((rule) => {
      const forRule = group.filter(({ assertion }) => assertion.test.title === rule.title);
      if (forRule.length === 0) return;

      lines.push(`### ${rule.title}`);
      lines.push('');
      lines.push(`Criteria: ${rule.criteria.join(', ')}${rule.actRuleId ? `  |  ACT rule: \`${rule.actRuleId}\`` : ''}`);
      lines.push('');
      forRule.forEach(({ source, assertion }) => {
        lines.push(`- \`${new URL(source).pathname}\` → \`${assertion.result.pointer || 'page'}\``);
        if (assertion.evidence) {
          lines.push(`  - ${JSON.stringify(assertion.evidence)}`);
        }
      });
      lines.push('');
    });
  });

  lines.push('## Inventory');
  lines.push('');
  lines.push('| Page | Assertions | Failed | Needs judgment |');
  lines.push('| --- | --- | --- | --- |');
  earl['@graph'].forEach((subject) => {
    const failed = subject.assertions.filter((a) => a.result.outcome === 'earl:failed').length;
    const cantTell = subject.assertions.filter((a) => a.result.outcome === 'earl:cantTell').length;
    lines.push(`| ${new URL(subject.source).pathname} | ${subject.assertions.length} | ${failed} | ${cantTell} |`);
  });
  lines.push('');

  return lines.join('\n');
};

module.exports = { renderMarkdown };
```

- [ ] **Step 2: Write the markdown from the CLI**

In `scripts/focus-audit/cli.js`, add `const { renderMarkdown } = require('./report');` with the other requires, and after the `fs.writeFileSync(jsonPath, ...)` line add:

```js
  const mdPath = path.join(outputDir, `${runDate}-focus-keyboard-audit.md`);
  fs.writeFileSync(mdPath, renderMarkdown(earl));
  console.log(`Report written to ${mdPath}`);
```

- [ ] **Step 3: Verify the report reads well**

Run: `pnpm run focus-audit -- --base-url http://localhost:8080 --seed 1`

Then read the generated markdown file.

Expected: a summary table keyed by `WCAG2:` criteria, a Failures section if any, a Needs judgment section, and an inventory table listing every sampled page. The two known CSS gaps from the spec should be visible somewhere — the content-warning summary and the gallery controls should appear under "needs judgment" for the perimeter rule, since neither has author focus styling. If they do not appear at all, the tool is not doing its job; investigate before proceeding.

- [ ] **Step 4: Confirm no conformance vocabulary leaked in**

Run: `grep -iE 'partially supports|does not support|\bsupports\b' docs/designs/scratch/*-focus-keyboard-audit.md`

Expected: no matches. The tool must never emit VPAT conformance levels.

- [ ] **Step 5: Commit**

```bash
git add scripts/focus-audit/report.js scripts/focus-audit/cli.js
git commit -m "Render audit evidence as markdown grouped by success criterion"
```

---

### Task 7: Documentation and first real audit

**Files:**

- Modify: `docs/commands.md`
- Modify: `docs/ideas.md`
- Modify: `.cursor/rules/memory.mdc`

**Interfaces:**

- Consumes: the working tool from Tasks 1–6.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Document the command**

In `docs/commands.md`, under the Maintenance section, add an entry matching the surrounding style:

```markdown
### `pnpm run focus-audit -- --base-url <url>`

Audits focus behavior and keyboard navigation across a WCAG-EM sample of pages.
Requires a base URL; there is no default, so targeting production is deliberate.
`pnpm run dev` provides `http://localhost:8080`. Production is the more faithful
target because the dev server omits the CSP headers `.htaccess` sets, and CSP has
disabled shipped JavaScript before.

Writes EARL JSON-LD evidence and a markdown report to `docs/designs/scratch/`,
which is gitignored. Pass `--seed <n>` to reproduce a previous run's random
sample. Not part of the test suite; see
`docs/designs/specs/2026-08-13-focus-keyboard-audit-design.md` for why.
```

- [ ] **Step 2: Run the audit against the dev server**

Run: `pnpm run focus-audit -- --base-url http://localhost:8080`

Expected: completes without error and writes both files. Expect this to take several minutes — roughly one second per tab stop across a dozen pages.

- [ ] **Step 3: Run the audit against production**

Run: `pnpm run focus-audit -- --base-url https://jonplummer.com`

Expected: completes. Compare its failures against the dev-server run. Any check that fails only in production points at CSP blocking a script, which is a genuine finding and the reason to run both.

- [ ] **Step 4: Triage findings into the tracker**

Read the markdown report. For each failure and each item needing judgment, decide whether it is a real defect. Add the real ones to `docs/ideas.md` under Selected, as plain bullets matching the surrounding style. At minimum expect entries for:

- The article content-warning `<details>` summary having no `:focus-visible` styling.
- The `/color/` and `/type/` form controls having no author focus styling.
- Whatever the lightbox scenario revealed about focus when prev/next become `disabled`.

Do not fix any of them in this task. The spec puts remediation out of scope.

- [ ] **Step 5: Update the memory rule**

In `.cursor/rules/memory.mdc`, amend the focus/keyboard bullet under Gotchas: change "Dedicated tooling is specced (not built)" to record that it is now built, note the command, and note that output lands in gitignored scratch.

- [ ] **Step 6: Verify docs still pass their checks**

Run: `pnpm run test markdown && pnpm run test spell && pnpm run test design-docs-location`

Expected: all three pass with no issues.

- [ ] **Step 7: Commit**

```bash
git add docs/commands.md docs/ideas.md .cursor/rules/memory.mdc
git commit -m "Document focus-audit command and triage first audit findings"
```

---

## Notes for the implementer

**What "done" looks like.** The tool runs against a URL, samples pages the way WCAG-EM prescribes, produces EARL JSON-LD plus a readable report, and the report names defects we already know exist. A tool that reports everything clean is broken, not reassuring.

**A prediction, not a fact.** Because this site never sets `outline: none`, the UA focus ring will probably satisfy `oj04fd` on nearly every stop, so hard focus-visibility failures should be rare. The value should show up in the "needs judgment" tier and in the lightbox scenario. If you see a wave of focus-visibility failures, suspect the screenshot pair before believing the site regressed.

**Where the portability line is.** If you find yourself importing something from `eleventy/` or `scripts/utils/` into any file other than `cli.js`, stop — that file belongs to the portable layer and the dependency needs to move into the config instead.
