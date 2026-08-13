# Figure Lightbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a site-wide figure lightbox: click a content figure to view it at viewport-or-intrinsic size in a native `<dialog>`, with caption, non-wrapping prev/next, and a no-JS link fallback.

**Architecture:** An Eleventy HTML transform (Cheerio, after image optimization) wraps lightboxable figure media in `<a class="figure-lightbox-trigger">` pointing at the largest `srcset` URL. `base.njk` hosts one shared `<dialog>` and loads `/assets/js/figure-lightbox.js`. The script opens the dialog on trigger click, swaps image/caption from the active figure, and handles gallery keys/buttons. CSS in `jonplummer.css` sizes the dialog image and keeps portfolio figure grid layout working with the new anchor wrapper.

**Tech Stack:** Eleventy transforms, Cheerio (already a dependency), vanilla JS (IIFE like `masthead-preview.js`), CSS custom properties in `jonplummer.css`, existing `scripts/test` unit-test + html-validate pipeline.

## Global Constraints

- CSP: no inline script — only `/assets/js/figure-lightbox.js` via `<script src … defer>`
- Image display: smaller of viewport (≈0.5rem padding) vs intrinsic size; do not upscale
- Gallery: document order; no wrap at ends
- Caption: show `figcaption` text when present; hide slot when empty
- Scope: `main` figures with `img`/`picture`; skip video-only figures and utility chrome
- Prev/next controls may be subdued; close control remains usable
- No new npm dependencies
- Progressive enhancement: build-time `<a href>` required (JS-only wrap does not help no-JS users)

## File structure

| File | Responsibility |
| --- | --- |
| `eleventy/utils/largest-srcset-url.js` | Pure helpers: parse srcset, pick largest URL from an img/picture |
| `eleventy/utils/figure-lightbox-transform.js` | Cheerio transform: wrap lightboxable figures in trigger links |
| `eleventy/config/transforms.js` | Register the transform |
| `src/_includes/base.njk` | Dialog markup + script tag |
| `src/assets/js/figure-lightbox.js` | Open/close, populate, gallery, keyboard |
| `src/assets/css/jonplummer.css` | Dialog + trigger + portfolio grid fix for `figure > a` |
| `scripts/test/figure-lightbox.js` | Unit tests for URL helper + transform; smoke for script in built HTML |

---

### Task 1: Largest-srcset URL helper + unit tests

**Files:**
- Create: `eleventy/utils/largest-srcset-url.js`
- Create: `scripts/test/figure-lightbox.js` (URL cases only in this task; transform cases added in Task 2)
- Modify: `scripts/test-runner.js` — add `'figure-lightbox': 'figure-lightbox.js'` to `testTypes` and `'figure-lightbox'` to `unitTests`

**Interfaces:**
- Produces:
  - `largestUrlFromSrcset(srcset: string): string | null`
  - `largestUrlFromImgEl(img: { getAttribute(name: string): string | null, parent?: unknown }, getSources?: (img) => Array<{getAttribute}>): string | null` — keep the Node/Cheerio adapter simple: export `largestUrlFromSrcset` and `largestUrlFromAttributes({ src, srcset, sourceSrcsets: string[] })`
- Consumed by: Task 2 transform; Task 3 may duplicate a tiny browser-side read of `a.href` instead of re-parsing

- [ ] **Step 1: Write the failing unit test file**

Create `scripts/test/figure-lightbox.js`:

  ```javascript
  #!/usr/bin/env node

  const assert = require('assert');
  const {
    largestUrlFromSrcset,
    largestUrlFromAttributes,
  } = require('../../eleventy/utils/largest-srcset-url');
  const { addFile, addIssue } = require('../utils/test-results');
  const { runTest } = require('../utils/test-runner-helper');

  function runUnitAssertions(result) {
    const fileObj = addFile(result, 'eleventy/utils/largest-srcset-url.js', 'largest-srcset-url.js');

    function check(name, fn) {
      try {
        fn();
      } catch (err) {
        addIssue(fileObj, {
          type: 'figure-lightbox-unit',
          message: `${name}: ${err.message}`,
          ruleId: 'figure-lightbox-unit',
        });
      }
    }

    check('picks largest w descriptor', () => {
      assert.strictEqual(
        largestUrlFromSrcset('/a-400.webp 400w, /a-1600.webp 1600w, /a-800.webp 800w'),
        '/a-1600.webp'
      );
    });

    check('returns null for empty srcset', () => {
      assert.strictEqual(largestUrlFromSrcset(''), null);
      assert.strictEqual(largestUrlFromSrcset(null), null);
    });

    check('prefers widest source srcset over img src', () => {
      assert.strictEqual(
        largestUrlFromAttributes({
          src: '/fallback.jpeg',
          srcset: '/img-800.jpeg 800w',
          sourceSrcsets: ['/img-400.webp 400w, /img-1600.webp 1600w'],
        }),
        '/img-1600.webp'
      );
    });

    check('falls back to src when no srcset', () => {
      assert.strictEqual(
        largestUrlFromAttributes({ src: '/only.jpeg', srcset: '', sourceSrcsets: [] }),
        '/only.jpeg'
      );
    });
  }

  runTest({
    testType: 'figure-lightbox',
    testName: 'Figure lightbox',
    requiresSite: false,
    validateFn: async (result) => {
      runUnitAssertions(result);
    },
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
  ```

Wire into `scripts/test-runner.js`:

  ```javascript
  // in testTypes:
  'figure-lightbox': 'figure-lightbox.js',

  // in unitTests array:
  'figure-lightbox',
  ```

- [ ] **Step 2: Run test — expect fail**

Run: `pnpm run test figure-lightbox`

Expected: FAIL (module missing or functions undefined)

- [ ] **Step 3: Implement helper**

Create `eleventy/utils/largest-srcset-url.js`:

  ```javascript
  /**
   * Pick the URL with the largest width descriptor from a srcset string.
   * @param {string | null | undefined} srcset
   * @returns {string | null}
   */
  function largestUrlFromSrcset(srcset) {
    if (!srcset || !String(srcset).trim()) return null;
    let bestUrl = null;
    let bestW = -1;
    for (const chunk of String(srcset).split(',')) {
      const parts = chunk.trim().split(/\s+/);
      if (!parts[0]) continue;
      const url = parts[0];
      const desc = parts[1] || '';
      const w = desc.endsWith('w') ? parseInt(desc, 10) : 0;
      if (Number.isFinite(w) && w >= bestW) {
        bestW = w;
        bestUrl = url;
      }
    }
    return bestUrl;
  }

  /**
   * @param {{ src?: string | null, srcset?: string | null, sourceSrcsets?: string[] }} attrs
   * @returns {string | null}
   */
  function largestUrlFromAttributes(attrs) {
    const candidates = [];
    const fromImg = largestUrlFromSrcset(attrs.srcset);
    if (fromImg) candidates.push({ url: fromImg, w: widthFromSrcset(attrs.srcset, fromImg) });
    for (const ss of attrs.sourceSrcsets || []) {
      const url = largestUrlFromSrcset(ss);
      if (url) candidates.push({ url, w: widthFromSrcset(ss, url) });
    }
    if (candidates.length) {
      candidates.sort((a, b) => b.w - a.w);
      return candidates[0].url;
    }
    return attrs.src || null;
  }

  function widthFromSrcset(srcset, url) {
    if (!srcset) return 0;
    for (const chunk of String(srcset).split(',')) {
      const parts = chunk.trim().split(/\s+/);
      if (parts[0] === url && parts[1] && parts[1].endsWith('w')) {
        return parseInt(parts[1], 10) || 0;
      }
    }
    return 0;
  }

  module.exports = {
    largestUrlFromSrcset,
    largestUrlFromAttributes,
  };
  ```

- [ ] **Step 4: Run test — expect pass**

Run: `pnpm run test figure-lightbox`

Expected: PASS (0 issues)

- [ ] **Step 5: Commit**

  ```bash
  git add eleventy/utils/largest-srcset-url.js scripts/test/figure-lightbox.js scripts/test-runner.js
  git commit -m "$(cat <<'EOF'
  test: add largest-srcset helper for figure lightbox

  EOF
  )"
  ```

---

### Task 2: Build-time figure link transform

**Files:**
- Create: `eleventy/utils/figure-lightbox-transform.js`
- Modify: `eleventy/config/transforms.js`
- Modify: `scripts/test/figure-lightbox.js` — add Cheerio transform assertions

**Interfaces:**
- Consumes: `largestUrlFromAttributes` from Task 1
- Produces: `applyFigureLightboxLinks(html: string): string` — wraps media in lightboxable figures; leaves others unchanged
- Register: `eleventyConfig.addTransform('figure-lightbox-links', …)` only for HTML output paths

**Exclusion rules (encode in transform):**

- Only process elements matching `main figure` (if no `main`, skip page — or process `figure` only when `main` exists)
- Figure must contain `img` (inside optional `picture`)
- Skip if figure contains `video` and no `img`
- Skip if figure has class `masthead-preview-strip`
- Skip if figure is inside `.color-gallery-embed`, `.og-images-grid`, `[data-lightbox="off"]`
- Skip if media is already inside `a.figure-lightbox-trigger`

**Wrap shape:**

  ```html
  <figure>
    <a class="figure-lightbox-trigger" href="/img/…-1600.webp">
      <picture>…</picture>
    </a>
    <figcaption>…</figcaption>
  </figure>
  ```

- [ ] **Step 1: Extend unit tests for the transform**

Append to `runUnitAssertions` in `scripts/test/figure-lightbox.js`:

  ```javascript
  const { applyFigureLightboxLinks } = require('../../eleventy/utils/figure-lightbox-transform');

  check('wraps picture in main figure with largest href', () => {
    const input = `
      <main>
        <figure>
          <picture>
            <source srcset="/a-400.webp 400w, /a-1600.webp 1600w" type="image/webp">
            <img src="/a-800.jpeg" srcset="/a-800.jpeg 800w" alt="Diagram">
          </picture>
          <figcaption>A diagram</figcaption>
        </figure>
      </main>`;
    const out = applyFigureLightboxLinks(input);
    assert.match(out, /class="figure-lightbox-trigger"/);
    assert.match(out, /href="\/a-1600\.webp"/);
    assert.match(out, /<a class="figure-lightbox-trigger"[^>]*>\s*<picture>/);
  });

  check('skips masthead-preview-strip', () => {
    const input = `<main><figure class="masthead-preview-strip"><img src="/x.png" alt=""></figure></main>`;
    const out = applyFigureLightboxLinks(input);
    assert.doesNotMatch(out, /figure-lightbox-trigger/);
  });

  check('is idempotent', () => {
    const input = `
      <main><figure>
        <picture><img src="/a.jpeg" srcset="/a-1600.jpeg 1600w" alt=""></picture>
      </figure></main>`;
    const once = applyFigureLightboxLinks(input);
    const twice = applyFigureLightboxLinks(once);
    assert.strictEqual(once, twice);
  });
  ```

- [ ] **Step 2: Run test — expect fail**

Run: `pnpm run test figure-lightbox`

Expected: FAIL (transform module missing)

- [ ] **Step 3: Implement transform + register**

Create `eleventy/utils/figure-lightbox-transform.js`:

  ```javascript
  const cheerio = require('cheerio');
  const { largestUrlFromAttributes } = require('./largest-srcset-url');

  function applyFigureLightboxLinks(html) {
    if (!html || !html.includes('<figure')) return html;
    const $ = cheerio.load(html, { decodeEntities: false }, false);
    if (!$('main').length) return html;

    $('main figure').each((_, el) => {
      const $figure = $(el);
      if ($figure.hasClass('masthead-preview-strip')) return;
      if ($figure.closest('.color-gallery-embed, .og-images-grid, [data-lightbox="off"]').length) return;
      if ($figure.find('a.figure-lightbox-trigger').length) return;

      const $img = $figure.find('img').first();
      if (!$img.length) return;

      const sourceSrcsets = [];
      $img.closest('picture').find('source').each((__, source) => {
        const ss = $(source).attr('srcset');
        if (ss) sourceSrcsets.push(ss);
      });

      const href = largestUrlFromAttributes({
        src: $img.attr('src'),
        srcset: $img.attr('srcset'),
        sourceSrcsets,
      });
      if (!href) return;

      const $media = $img.parent('picture').length ? $img.parent('picture') : $img;
      $media.wrap(`<a class="figure-lightbox-trigger" href="${href}"></a>`);
    });

    return $.root().html() || html;
  }

  module.exports = { applyFigureLightboxLinks };
  ```

Update `eleventy/config/transforms.js` to register:

  ```javascript
  const { applyFigureLightboxLinks } = require('../utils/figure-lightbox-transform');

  function configureTransforms(eleventyConfig) {
    eleventyConfig.addTransform('figure-lightbox-links', function (content, outputPath) {
      if (!outputPath || !outputPath.endsWith('.html')) return content;
      return applyFigureLightboxLinks(content);
    });
  }

  module.exports = configureTransforms;
  ```

Update the file header comment: transforms are used again for lightbox PE links (after image optimization output is present — registration order in `.eleventy.js` is after `configurePlugins`, so this transform should see `<picture>`).

- [ ] **Step 4: Run unit tests — expect pass**

Run: `pnpm run test figure-lightbox`

Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add eleventy/utils/figure-lightbox-transform.js eleventy/config/transforms.js scripts/test/figure-lightbox.js
  git commit -m "$(cat <<'EOF'
  feat: wrap content figures in lightbox trigger links

  EOF
  )"
  ```

---

### Task 3: Dialog markup + lightbox script

**Files:**
- Modify: `src/_includes/base.njk`
- Create: `src/assets/js/figure-lightbox.js`

**Interfaces:**
- Consumes: `a.figure-lightbox-trigger` inside `main figure` (from Task 2)
- Produces: working open/close/gallery behavior when script loads
- Dialog id: `figure-lightbox`
- Elements: `#figure-lightbox-image`, `#figure-lightbox-caption`, `#figure-lightbox-prev`, `#figure-lightbox-next`, `#figure-lightbox-close`

- [ ] **Step 1: Add dialog + script to `base.njk`**

Before `</body>`:

  ```html
  <dialog id="figure-lightbox" class="figure-lightbox" aria-label="Enlarged image">
    <form method="dialog" class="figure-lightbox-chrome">
      <button type="submit" id="figure-lightbox-close" class="figure-lightbox-close" value="close" aria-label="Close">Close</button>
    </form>
    <button type="button" id="figure-lightbox-prev" class="figure-lightbox-prev" aria-label="Previous image">Previous</button>
    <button type="button" id="figure-lightbox-next" class="figure-lightbox-next" aria-label="Next image">Next</button>
    <img id="figure-lightbox-image" alt="">
    <p id="figure-lightbox-caption" class="figure-lightbox-caption" hidden></p>
  </dialog>
  <script src="/assets/js/figure-lightbox.js" defer></script>
  ```

Note: `method="dialog"` close button uses native dialog close (no extra JS required for that control). Prev/next stay `type="button"`.

- [ ] **Step 2: Implement `src/assets/js/figure-lightbox.js`**

  ```javascript
  (function () {
    var dialog = document.getElementById('figure-lightbox');
    if (!dialog) return;

    var imgEl = document.getElementById('figure-lightbox-image');
    var captionEl = document.getElementById('figure-lightbox-caption');
    var prevBtn = document.getElementById('figure-lightbox-prev');
    var nextBtn = document.getElementById('figure-lightbox-next');

    function triggers() {
      return Array.prototype.slice.call(
        document.querySelectorAll('main figure a.figure-lightbox-trigger')
      );
    }

    function figureFor(trigger) {
      return trigger.closest('figure');
    }

    function showFigureAt(index) {
      var list = triggers();
      if (index < 0 || index >= list.length) return;
      var trigger = list[index];
      var figure = figureFor(trigger);
      var pageImg = figure ? figure.querySelector('img') : null;
      imgEl.src = trigger.getAttribute('href');
      imgEl.alt = pageImg ? (pageImg.getAttribute('alt') || '') : '';

      var cap = figure && figure.querySelector('figcaption');
      var text = cap ? cap.textContent.trim() : '';
      if (text) {
        captionEl.textContent = text;
        captionEl.hidden = false;
      } else {
        captionEl.textContent = '';
        captionEl.hidden = true;
      }

      prevBtn.disabled = index <= 0;
      nextBtn.disabled = index >= list.length - 1;
      dialog.dataset.index = String(index);

      if (!dialog.open) dialog.showModal();
    }

    function currentIndex() {
      return parseInt(dialog.dataset.index || '-1', 10);
    }

    document.addEventListener('click', function (event) {
      var trigger = event.target.closest('main figure a.figure-lightbox-trigger');
      if (!trigger) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      var list = triggers();
      var index = list.indexOf(trigger);
      if (index === -1) return;
      showFigureAt(index);
    });

    prevBtn.addEventListener('click', function () {
      showFigureAt(currentIndex() - 1);
    });
    nextBtn.addEventListener('click', function () {
      showFigureAt(currentIndex() + 1);
    });

    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener('keydown', function (event) {
      if (!dialog.open) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showFigureAt(currentIndex() - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        showFigureAt(currentIndex() + 1);
      }
    });
  })();
  ```

- [ ] **Step 3: Sanity-check in browser (dev server)**

Run: `pnpm run dev` (or use an already-running server), open a portfolio page with multiple figures (e.g. `/2026/02/20/call-review-console/` or `/2026/03/06/invoca-ia-vision/`).

Verify:

- Click opens dialog; image large; caption if present
- Prev disabled on first; next on last; arrows match
- Esc / backdrop / Close dismiss
- Cmd/Ctrl-click still opens link in new tab (modifier early-return)

- [ ] **Step 4: Commit**

  ```bash
  git add src/_includes/base.njk src/assets/js/figure-lightbox.js
  git commit -m "$(cat <<'EOF'
  feat: add figure lightbox dialog and script

  EOF
  )"
  ```

---

### Task 4: Lightbox CSS + portfolio figure grid fix

**Files:**
- Modify: `src/assets/css/jonplummer.css`

**Requirements:**

- `.figure-lightbox` nearly viewport-sized, padding ≈ `0.5rem` (use `--spacing-xs` if it equals one baseline unit; otherwise `0.5rem` is acceptable per spec)
- Backdrop dimmed via `::backdrop` using existing tokens (e.g. semi-transparent based on `--text-color` / black — keep subtle)
- `#figure-lightbox-image`: `width: auto; height: auto; max-width: 100%; max-height: …` so intrinsic size is respected and viewport caps apply (do **not** set `width: 100%`)
- Caption uses figcaption-like tokens (`--font-size-xs`, `--text-color-light`, italic)
- Prev/next subdued (`--text-color-light` or lower emphasis); close remains clearly usable
- `a.figure-lightbox-trigger img { cursor: zoom-in; }`
- Fix portfolio detail grid: change `& > picture, & > img, & > video` under `article.portfolio-detail … figure` to also target `& > a.figure-lightbox-trigger` (grid-column 1 / -1; display block). Same idea under `.portrait-grid figure` if needed.
- No open/close animation required; if any is added, gate with `prefers-reduced-motion`

- [ ] **Step 1: Add lightbox CSS**

Append (or place near other component blocks) styles equivalent to:

  ```css
  .figure-lightbox {
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    background-color: var(--background-color);
    color: var(--text-color);
    max-width: calc(100vw - 1rem);
    max-height: calc(100vh - 1rem);
  }

  .figure-lightbox::backdrop {
    background-color: oklch(0% 0 0 / 0.72);
  }

  .figure-lightbox img {
    display: block;
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: calc(100vh - 4rem);
    margin-inline: auto;
  }

  .figure-lightbox-caption {
    margin: var(--spacing-xs) 0 0;
    font-size: var(--font-size-xs);
    line-height: var(--line-height-xs);
    color: var(--text-color-light);
    font-style: italic;
    max-width: 40rem;
  }

  .figure-lightbox-prev,
  .figure-lightbox-next {
    color: var(--text-color-light);
  }

  .figure-lightbox-close {
    color: var(--text-color);
  }

  a.figure-lightbox-trigger {
    color: inherit;
    text-decoration: none;
  }

  a.figure-lightbox-trigger img {
    cursor: zoom-in;
  }
  ```

Adjust layout of chrome/prev/next as needed so controls don’t steal image space (e.g. absolute corners inside the dialog). Keep padding minimal.

- [ ] **Step 2: Fix portfolio figure child selectors**

In `article.portfolio-detail` figure rules (~line 721), change:

  ```css
  & > picture, & > img, & > video {
    grid-column: 1 / -1;
  }
  ```

To:

  ```css
  & > a.figure-lightbox-trigger,
  & > picture,
  & > img,
  & > video {
    grid-column: 1 / -1;
  }

  & > a.figure-lightbox-trigger {
    display: block;
  }
  ```

- [ ] **Step 3: Visual check**

Reload a portfolio detail page: in-article figures still full-bleed in the grid; lightbox image does not upscale tiny images past natural size; large diagrams grow to near-viewport.

- [ ] **Step 4: Commit**

  ```bash
  git add src/assets/css/jonplummer.css
  git commit -m "$(cat <<'EOF'
  style: figure lightbox layout and portfolio trigger grid

  EOF
  )"
  ```

---

### Task 5: Built-HTML smoke checks + fast test pass

**Files:**
- Modify: `scripts/test/figure-lightbox.js` — when `_site` exists, smoke-check script tag + at least one trigger link on a known portfolio HTML file
- Optionally note in `docs/authoring.md` one line under images/figures: figures are clickable to enlarge (only if a natural place exists; skip if none)

**Interfaces:**
- Consumes: built `_site/**/*.html` from `base.njk`
- Extends `figure-lightbox` test: `requiresSite` stays false for units; smoke section skips soft if `_site` missing, or split: keep units always, add smoke that uses `requiresSite: true` only when running after build — simplest path: in the same test, if `_site` is absent skip smoke with no failure; if present, assert.

- [ ] **Step 1: Add smoke assertions**

In `scripts/test/figure-lightbox.js`:

  ```javascript
  const fs = require('fs');
  const path = require('path');

  // after unit assertions:
  const siteRoot = path.join(__dirname, '../../_site');
  if (fs.existsSync(siteRoot)) {
    const smokeFile = addFile(result, '_site', 'figure-lightbox-smoke');
    function walkFind(dir, predicate) {
      // small recursive search OR pick a known built path if stable
    }
    // Prefer a known portfolio output if present, else any html containing figure-lightbox-trigger
    const sampleCandidates = [
      '2026/03/06/invoca-ia-vision/index.html',
      '2026/02/20/call-review-console/index.html',
      '2025/08/07/field-guide-to-problem-statements/index.html',
    ];
    let html = null;
    let used = null;
    for (const rel of sampleCandidates) {
      const full = path.join(siteRoot, rel);
      if (fs.existsSync(full)) {
        html = fs.readFileSync(full, 'utf8');
        used = rel;
        break;
      }
    }
    if (html) {
      if (!html.includes('/assets/js/figure-lightbox.js')) {
        addIssue(smokeFile, {
          type: 'figure-lightbox-smoke',
          message: `${used}: missing figure-lightbox.js script tag`,
          ruleId: 'figure-lightbox-script',
        });
      }
      if (!html.includes('id="figure-lightbox"')) {
        addIssue(smokeFile, {
          type: 'figure-lightbox-smoke',
          message: `${used}: missing #figure-lightbox dialog`,
          ruleId: 'figure-lightbox-dialog',
        });
      }
      if (!html.includes('figure-lightbox-trigger')) {
        addIssue(smokeFile, {
          type: 'figure-lightbox-smoke',
          message: `${used}: expected at least one figure-lightbox-trigger`,
          ruleId: 'figure-lightbox-trigger',
        });
      }
    }
  }
  ```

Use a real sample path discovered during implementation (e.g. under `_site/2026/…` after a local build). Do not leave empty `sampleCandidates`.

- [ ] **Step 2: Build and run tests**

Run:

  ```bash
  pnpm run build
  pnpm run test figure-lightbox
  pnpm run test html
  pnpm run test css
  ```

Expected: all PASS. Fix html-validate issues if dialog/button markup trips rules (adjust markup/CSS, don’t disable broadly).

- [ ] **Step 3: Commit**

  ```bash
  git add scripts/test/figure-lightbox.js docs/authoring.md
  git commit -m "$(cat <<'EOF'
  test: smoke-check figure lightbox in built HTML

  EOF
  )"
  ```

(Omit `docs/authoring.md` from the commit if unchanged.)

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| Native `<dialog>` lightbox | 3 |
| Viewport or intrinsic size (no upscale) | 4 |
| Minimal padding | 4 |
| Caption when present | 3 |
| Prev/next + arrows, no wrap | 3 |
| Esc / backdrop / close | 3 |
| Site-wide content figures | 2 |
| Skip utility chrome | 2 |
| Progressive enhancement links | 2 |
| CSP same-origin script | 3 |
| Subdued prev/next | 4 |
| `zoom-in` cursor | 4 |
| Automated smoke | 5 |
| No videos / no library | honored (non-goals) |

## Self-review notes

- Smoke sample paths are concrete portfolio outputs (`invoca-ia-vision`, `call-review-console`, field-guide fallback).
- Transform runs after plugins in `.eleventy.js` registration order so `<picture>` exists.
- Modifier-click preserves PE new-tab behavior.
- Portfolio CSS grid fix is required or full-bleed figures break after wrapping.
