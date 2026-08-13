# Preview Lockup Facsimile + `/masthead/` Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/color/` and `/type/` mini-page facsimiles use a scaled mark + logotype lockup (no tagline by default), and remove the obsolete `/masthead/` Phase 3 lab with no redirect.

**Architecture:** Shared build-time CommonJS helper `scripts/utils/preview-site-lockup.js` emits production-shaped `.site-lockup` HTML (SVG paths synced with `site-mark.njk`). Color and font gallery generators call it. Preview CSS under `.theme-root.home-preview` scales the lockup. Delete masthead page/assets and clean related test special-cases.

**Tech Stack:** Node CommonJS, existing gallery generators, `jonplummer.css` tokens, `scripts/test/*` harness (`runTest` / `outputAndExit`).

**Spec:** `docs/designs/specs/2026-08-10-preview-lockup-masthead-retirement-design.md`

## Global Constraints

- No client-side JavaScript for this feature.
- No proactive `/masthead/` redirect (add later only if a 404 appears).
- Do not change live header markup in `base.njk` beyond what already ships.
- Facsimile omits tagline by default; optional `includeTagline` for future use.
- Prefer production class names (`.site-lockup`, `.site-mark`, `.site-mark-link`) so live CSS applies; override only under `.home-preview`.
- Author/tagline strings come from `site.js` at generate time — do not hardcode the tagline literal in generators (site-branding test).
- Pre-existing unstaged work in the repo must not be swept into these commits unless it is required for this feature.

---

## File map

| Path | Role |
|---|---|
| `scripts/utils/preview-site-lockup.js` | **Create** — `renderPreviewSiteLockup(opts)` HTML string |
| `scripts/test/preview-site-lockup.js` | **Create** — unit test for helper |
| `scripts/test-runner.js` | **Modify** — register unit test |
| `scripts/utils/test-results.js` | **Modify** — emoji / display name / description |
| `docs/tests.md` | **Modify** — document new unit test |
| `scripts/color-explore/generate-gallery.js` | **Modify** — use helper; add preview lockup CSS |
| `scripts/font-explore/generate-font-gallery.js` | **Modify** — use helper |
| `src/assets/css/font-lab-scoped.css` | **Modify** — preview lockup scale overrides |
| `src/_includes/partials/color-gallery-embed-inner.html` | **Regen** via color gallery / build |
| `src/assets/css/color-gallery-embed.css` | **Regen** via color gallery / build |
| `src/_includes/partials/font-lab-card.fragment.html` | **Regen** via `pnpm run font-gallery` |
| `src/masthead.njk` + masthead assets/partials | **Delete** |
| `eleventy/utils/figure-lightbox-transform.js` | **Modify** — drop masthead-strip skip |
| `scripts/test/figure-lightbox.js` | **Modify** — drop related unit check |
| `scripts/test/seo-meta.js` | **Modify** — drop `/masthead` short-title exemption |
| `docs/ideas.md` | **Modify** — move drop-masthead to Done |

---

### Task 1: Preview lockup helper + unit test (TDD)

**Files:**
- Create: `scripts/utils/preview-site-lockup.js`
- Create: `scripts/test/preview-site-lockup.js`
- Modify: `scripts/test-runner.js`
- Modify: `scripts/utils/test-results.js`
- Modify: `docs/tests.md`

**Interfaces:**
- Produces: `renderPreviewSiteLockup({ author, tagline?, includeTagline?, homeHref? }) → string`
  - Defaults: `includeTagline: false`, `homeHref: '#'`, `tagline: ''`
  - Escapes `author` / `tagline` for HTML text nodes and attribute context in `aria-label`

- [ ] **Step 1: Write the failing unit test**

Create `scripts/test/preview-site-lockup.js`:

```js
#!/usr/bin/env node

const assert = require('assert');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const HELPER = require('../utils/preview-site-lockup');

function runUnitAssertions(result) {
  const file = addFile(result, 'scripts/utils/preview-site-lockup.js', 'preview-site-lockup');

  function check(name, fn) {
    try {
      fn();
    } catch (err) {
      addIssue(file, {
        type: 'preview-site-lockup',
        message: `${name}: ${err.message}`,
        ruleId: 'preview-site-lockup',
      });
    }
  }

  check('exports renderPreviewSiteLockup', () => {
    assert.strictEqual(typeof HELPER.renderPreviewSiteLockup, 'function');
  });

  check('default: mark + author, no tagline', () => {
    const html = HELPER.renderPreviewSiteLockup({ author: 'Jon Plummer' });
    assert.match(html, /class="site-lockup"/);
    assert.match(html, /class="site-mark-link"/);
    assert.match(html, /class="site-mark"/);
    assert.match(html, /<h1><a href="#" rel="home">Jon Plummer<\/a><\/h1>/);
    assert.doesNotMatch(html, /<hgroup>\s*<h1>[\s\S]*?<\/h1>\s*<p>/);
    assert.match(html, /viewBox="50 50 500 500"/);
    assert.match(html, /fill="currentColor"/);
  });

  check('includeTagline adds tagline paragraph', () => {
    const html = HELPER.renderPreviewSiteLockup({
      author: 'Jon Plummer',
      tagline: 'Making ideas tangible',
      includeTagline: true,
    });
    assert.match(html, /<p>Making ideas tangible<\/p>/);
  });

  check('escapes author HTML', () => {
    const html = HELPER.renderPreviewSiteLockup({ author: 'A <B> & C' });
    assert.match(html, /A &lt;B&gt; &amp; C/);
    assert.doesNotMatch(html, /A <B> & C/);
  });
}

runTest({
  testType: 'preview-site-lockup',
  testName: 'Preview Site Lockup',
  requiresSite: false,
  validateFn: async (result) => {
    runUnitAssertions(result);
  },
});
```

- [ ] **Step 2: Register the test (so the runner can find it)**

In `scripts/test-runner.js`:
- Add `'preview-site-lockup': 'preview-site-lockup.js'` to `testTypes`
- Add `'preview-site-lockup'` to `unitTests`
- Add `'preview-site-lockup'` to `primaryNames` in `listTests()`

In `scripts/utils/test-results.js`:
- Add emoji (e.g. `'preview-site-lockup': '🖼️'`)
- Add display name `'Preview Site Lockup'`
- Add description: `build-time facsimile .site-lockup HTML for color/type previews`

In `docs/tests.md` under Unit Tests, add a short subsection for `preview-site-lockup.js`.

Also update the Unit Tests bullet list near the top of `docs/tests.md` to include `preview-site-lockup`.

- [ ] **Step 3: Run test — expect fail (module missing)**

Run: `pnpm run test preview-site-lockup`

Expected: FAIL (cannot find module / `renderPreviewSiteLockup` not a function)

- [ ] **Step 4: Implement the helper**

Create `scripts/utils/preview-site-lockup.js`:

```js
/**
 * Build-time HTML for mini-page facsimile lockups (/color/, /type/).
 * SVG geometry must stay in sync with src/_includes/components/site-mark.njk
 */

'use strict';

const SITE_MARK_SVG = `<svg class="site-mark" viewBox="50 50 500 500" width="52" height="52" aria-hidden="true" focusable="false">
  <rect x="50" y="450" width="100" height="100" fill="currentColor"/>
  <rect x="183" y="50" width="100" height="500" fill="currentColor"/>
  <rect x="317" y="50" width="100" height="500" fill="currentColor"/>
  <rect x="450" y="50" width="100" height="400" fill="currentColor"/>
</svg>`;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {{ author: string, tagline?: string, includeTagline?: boolean, homeHref?: string }} opts
 * @returns {string}
 */
function renderPreviewSiteLockup(opts) {
  const author = opts && opts.author != null ? String(opts.author) : '';
  if (!author) {
    throw new Error('renderPreviewSiteLockup: author is required');
  }
  const includeTagline = Boolean(opts.includeTagline);
  const tagline = opts.tagline != null ? String(opts.tagline) : '';
  const homeHref = opts.homeHref != null ? String(opts.homeHref) : '#';

  const safeAuthor = escapeHtml(author);
  const safeHref = escapeHtml(homeHref);
  const aria = escapeHtml(`${author} home`);

  const taglineHtml =
    includeTagline && tagline
      ? `\n            <p>${escapeHtml(tagline)}</p>`
      : '';

  return `<div class="site-lockup">
        <a href="${safeHref}" rel="home" class="site-mark-link" aria-label="${aria}">
          ${SITE_MARK_SVG}
        </a>
        <hgroup>
          <h1><a href="${safeHref}" rel="home">${safeAuthor}</a></h1>${taglineHtml}
        </hgroup>
      </div>`;
}

module.exports = {
  renderPreviewSiteLockup,
  SITE_MARK_SVG,
};
```

- [ ] **Step 5: Run unit test — expect pass**

Run: `pnpm run test preview-site-lockup`

Expected: PASS (0 issues)

- [ ] **Step 6: Commit**

```bash
git add scripts/utils/preview-site-lockup.js scripts/test/preview-site-lockup.js \
  scripts/test-runner.js scripts/utils/test-results.js docs/tests.md \
  docs/designs/plans/2026-08-10-preview-lockup-masthead-retirement.md
git commit -m "$(cat <<'EOF'
feat: add build-time preview site-lockup helper

Shared facsimile markup for color/type mini-pages; unit-tested.
EOF
)"
```

(Only include the plan file in this commit if it is not already committed.)

---

### Task 2: Wire helper into color + font generators + preview CSS

**Files:**
- Modify: `scripts/color-explore/generate-gallery.js` (`renderHomePreview` + embed CSS block)
- Modify: `scripts/font-explore/generate-font-gallery.js` (`siteHomePreviewFragment`)
- Modify: `src/assets/css/font-lab-scoped.css`

**Interfaces:**
- Consumes: `renderPreviewSiteLockup` from `scripts/utils/preview-site-lockup.js`
- Both generators already `require` `src/_data/site.js` — pass `site.author` (and `site.tagline` only if `includeTagline: true`)

- [ ] **Step 1: Replace hand-rolled hgroup in color gallery**

Near top of `generate-gallery.js`, add:

```js
const { renderPreviewSiteLockup } = require('../utils/preview-site-lockup');
```

(Adjust relative path if this file’s requires use `../../` — match neighboring `require` style; from `scripts/color-explore/` the path is `../utils/preview-site-lockup`.)

In `renderHomePreview`, replace the bare:

```html
<hgroup>
  <h1><a href="#" rel="home">…</a></h1>
  <p>…</p>
</hgroup>
```

with:

```js
${renderPreviewSiteLockup({ author: site.author })}
```

Keep the surrounding `<header>…</header>` and nav unchanged.

- [ ] **Step 2: Add preview lockup scale CSS in the color gallery generator**

In the CSS string that becomes `color-gallery-embed.css` (same block as `.theme-root.home-preview`), add after the existing `.theme-root.home-preview` / `.jp-page` rules:

```css
/* Facsimile lockup: production classes, card-scaled; no tagline in default markup */
.theme-root.home-preview {
  --font-size-logotype: 1.125rem;
  --site-lockup-cap-nudge: 0px;
  --site-lockup-inline-nudge: 0px;
  --site-lockup-stack-gap: 0px;
  --site-lockup-tagline-baseline-nudge: 0px;
}
.theme-root.home-preview .site-lockup {
  margin-inline-start: 0;
  gap: 0.35rem;
  flex-wrap: nowrap;
}
.theme-root.home-preview .site-mark {
  margin-top: 0;
  /* Without tagline, match logotype cap height instead of full stack math */
  height: var(--font-size-logotype);
}
.theme-root.home-preview .site-lockup hgroup h1 {
  font-size: var(--font-size-logotype);
  line-height: 1;
}
```

Tune sizes only if a visual pass shows the lockup dominating the card; keep overrides under `.theme-root.home-preview`.

- [ ] **Step 3: Replace hand-rolled hgroup in font gallery**

In `generate-font-gallery.js`, require the helper the same way.

In `siteHomePreviewFragment`, replace the `hgroup` block with:

```js
${renderPreviewSiteLockup({ author: site.author })}
```

Preserve the skip link and nav. If `headingStyle` was applied to `header hgroup h1` for font experiments, apply it by wrapping or by targeting `.site-lockup hgroup h1` in the font-lab card JS the same way it already queries `header hgroup h1` (that selector still matches).

- [ ] **Step 4: Mirror scale CSS in `font-lab-scoped.css`**

Add the same `.theme-root.home-preview` lockup overrides from Step 2 into `src/assets/css/font-lab-scoped.css` (font lab loads this, not the color embed CSS).

- [ ] **Step 5: Regenerate committed embeds**

```bash
pnpm run color-gallery
pnpm run font-gallery
```

(Or rely on `pnpm run build` for color embed via `eleventy.before`; still run `font-gallery` because the font fragment is not always rewritten by a normal build — verify `font-lab-card.fragment.html` updates.)

Confirm `color-gallery-embed-inner.html` and `font-lab-card.fragment.html` contain `class="site-lockup"` and `class="site-mark"`, and do **not** contain a tagline `<p>Making ideas tangible</p>` inside the preview `hgroup`.

- [ ] **Step 6: Smoke unit + branding**

```bash
pnpm run test preview-site-lockup
pnpm run test site-branding
```

Expected: PASS. If site-branding fails on a hardcoded tagline in a generator, remove the literal and use `site.tagline` only behind `includeTagline`.

- [ ] **Step 7: Commit**

```bash
git add scripts/color-explore/generate-gallery.js \
  scripts/font-explore/generate-font-gallery.js \
  src/assets/css/font-lab-scoped.css \
  src/assets/css/color-gallery-embed.css \
  src/_includes/partials/color-gallery-embed-inner.html \
  src/_includes/partials/font-lab-card.fragment.html
git commit -m "$(cat <<'EOF'
feat: use scaled site-lockup in color and type previews

EOF
)"
```

(Include other generated font assets only if `font-gallery` changed them, e.g. `font-lab-card.js`.)

---

### Task 3: Retire `/masthead/`

**Files:**
- Delete: `src/masthead.njk`
- Delete: `src/assets/css/masthead-preview.css`
- Delete: `src/assets/js/masthead-preview.js`
- Delete: `src/_includes/partials/masthead-preview-strip.njk`
- Delete: `src/_includes/partials/masthead-preview-feed.njk`
- Delete: `src/assets/images/og/masthead.png`
- Modify: `eleventy/utils/figure-lightbox-transform.js` (remove masthead-strip skip)
- Modify: `scripts/test/figure-lightbox.js` (remove `skips masthead-preview-strip` check)
- Modify: `scripts/test/seo-meta.js` (remove `'/masthead'` from `EXCLUDED_SHORT_TITLES`)
- Modify: `docs/ideas.md` (Selected “Also later: drop `/masthead/`” and Future “Drop `/masthead/`…” → Done)

**Do not** add a redirect in `redirects.yaml`.

- [ ] **Step 1: Delete masthead sources and assets**

```bash
git rm src/masthead.njk \
  src/assets/css/masthead-preview.css \
  src/assets/js/masthead-preview.js \
  src/_includes/partials/masthead-preview-strip.njk \
  src/_includes/partials/masthead-preview-feed.njk \
  src/assets/images/og/masthead.png
```

- [ ] **Step 2: Remove lightbox special-case**

In `eleventy/utils/figure-lightbox-transform.js`, delete:

```js
if ($figure.hasClass('masthead-preview-strip')) return;
```

In `scripts/test/figure-lightbox.js`, delete the entire `skips masthead-preview-strip` check block.

- [ ] **Step 3: Remove SEO short-title exemption**

In `scripts/test/seo-meta.js`, remove `'/masthead'` from `EXCLUDED_SHORT_TITLES`.

- [ ] **Step 4: Update ideas.md**

- Remove “Also later: drop `/masthead/`” under Selected → Craft / polish → Icons…
- Remove “Drop `/masthead/` when convenient…” under Future → Brand / chrome
- Add under Done something like: `Drop /masthead/ Phase 3 lab (no redirect unless 404 later)` with date

- [ ] **Step 5: Wipe stale build output for masthead**

```bash
rm -rf _site/masthead
```

- [ ] **Step 6: Run lightbox unit test**

```bash
pnpm run test figure-lightbox
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add -u eleventy/utils/figure-lightbox-transform.js scripts/test/figure-lightbox.js \
  scripts/test/seo-meta.js docs/ideas.md
# masthead deletions already staged via git rm
git commit -m "$(cat <<'EOF'
chore: retire /masthead/ Phase 3 lab

EOF
)"
```

---

### Task 4: Build, verify, memory

**Files:**
- Modify: `.cursor/rules/memory.mdc` (mark preview-lockup work shipped; drop “until implemented” wording)

- [ ] **Step 1: Build**

```bash
pnpm run build
```

Expected: success. Confirm `_site/masthead` does not exist. Spot-check `_site/color/index.html` and `_site/type/index.html` for `site-lockup` / `site-mark` inside `.home-preview`.

- [ ] **Step 2: Fast tests**

```bash
pnpm run test fast
```

Expected: PASS (or only pre-existing unrelated failures — stop and report if new failures appear).

- [ ] **Step 3: Manual visual check**

Open `/color/` and `/type/` in light and dark. Facsimile headers should read as mark + name at card scale, not the old wordmark+tagline stack, and should not dominate the preview.

- [ ] **Step 4: Update agent memory**

In `.cursor/rules/memory.mdc`, replace the “until implemented” preview-lockup note with a short shipped note (shared helper path, no tagline default, `/masthead/` removed, no redirect).

- [ ] **Step 5: Commit verify/docs if needed**

```bash
git add .cursor/rules/memory.mdc
git commit -m "$(cat <<'EOF'
docs: note preview lockup facsimile and masthead retirement

EOF
)"
```

Only if memory (or other verify-only files) changed.

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|---|---|
| Shared build-time helper | Task 1 |
| Mark + logotype, no tagline default | Tasks 1–2 |
| Wire color + font generators | Task 2 |
| Preview CSS scale under `.home-preview` | Task 2 |
| Drop `/masthead/`, no redirect | Task 3 |
| Clean SEO exemption, lightbox skip, ideas | Task 3 |
| Unit + html/seo/css / test fast | Tasks 1, 3, 4 |
| No live header / OG / client JS changes | Global constraints |

No TBD placeholders. Helper signature is stable across tasks (`renderPreviewSiteLockup`).
