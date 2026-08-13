# Portfolio Cover Crop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author portfolio-grid thumbnail crop (focal point + optional zoom) in post front matter, migrate Monotasker’s CSS override, and leave the 16:9 card size unchanged.

**Architecture:** Optional `coverPosition` / `coverZoom` on the post. `portfolio_list_item.njk` sets `--cover-object-position` and `--cover-zoom` on the card `<article>`. CSS uses those on `object-position`, `transform-origin`, and `scale`, with `overflow: hidden` on the bordered `<picture>`. Detail-page figures are untouched.

**Tech Stack:** Nunjucks, `jonplummer.css`, CommonJS validation in `scripts/utils/validation-utils.js`, `pnpm run test frontmatter` + new `pnpm run test portfolio-cover-crop`.

**Spec:** `docs/superpowers/specs/2026-08-13-portfolio-cover-position-design.md`

## Global Constraints

- Grid-only: do not change portfolio detail figures.
- Card stays 16:9 `object-fit: cover`; no per-item aspect-ratio or `object-fit`.
- Do not use `object-view-box` (Safari/Firefox unsupported).
- Use the CSS `scale` property, not `transform: scale()`, so other transforms are not clobbered.
- `coverPosition` allowlist: one or two tokens from `center` / `top` / `bottom` / `left` / `right` and percentages (`20%`, `50.5%`).
- `coverZoom` range: **1 to 3** inclusive (YAML number or numeric string). Below 1 or above 3 is an error.
- First content move: Monotasker `coverPosition: center 20%` only — no zoom, no other posts.
- Site CSP already allows `style-src 'unsafe-inline'`; do not change `.htaccess`.
- Do not commit unless the user asks (this repo’s commit rule). Skip every Commit step until then.

## File map

| File | Role |
|------|------|
| `scripts/utils/validation-utils.js` | `validateCoverPosition`, `validateCoverZoom` |
| `scripts/test/frontmatter.js` | Call validators when those fields are present on posts and top-level `src/*.md` |
| `scripts/test/portfolio-cover-crop.js` | Validator unit cases + CSS/njk source guards + optional `_site/portfolio` HTML |
| `scripts/test-runner.js` | Register test; include in `fastTests` and `allTests` |
| `scripts/utils/test-results.js` | Emoji, display name, description |
| `scripts/build/build.js` | Run the new test in `POST_BUILD_TESTS` (HTML smoke needs a current `_site`) |
| `src/assets/css/jonplummer.css` | Custom properties, clip, delete `#monotasker` rule |
| `src/_includes/components/portfolio_list_item.njk` | Inline custom properties on `<article>` |
| `src/_posts/2026/2026-06-05-monotasker.md` | `coverPosition: center 20%` |
| `docs/authoring.md` | Document `coverImage`, `coverPosition`, `coverZoom` |
| `docs/tests.md` | Document `portfolio-cover-crop` |
| `docs/commands.md` | Add the test to the `test fast` list |
| `.cursor/rules/memory.mdc` | Portfolio-grid crop now comes from front matter |
| `docs/ideas.md` | Note that the crop *mechanism* shipped; per-item audit remains |

---

### Task 1: Cover-crop validators (TDD)

**Files:**
- Modify: `scripts/utils/validation-utils.js`
- Create: `scripts/test/portfolio-cover-crop.js`
- Modify: `scripts/test-runner.js`
- Modify: `scripts/utils/test-results.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `validateCoverPosition(value) → { valid: boolean, error?: string }`
  - `validateCoverZoom(value) → { valid: boolean, error?: string }`
  - Callers only invoke these when the field is **present** (`!== undefined`). Do not treat omitted fields as invalid inside the helpers.

- [ ] **Step 1: Write the failing test file**

Create `scripts/test/portfolio-cover-crop.js` with validator assertions first. CSS/HTML guards come in later tasks — in this task, only the validator block (plus `runTest` wiring). Copy this file in full; later tasks append to `validate()`, they do not replace it.

```js
#!/usr/bin/env node

/**
 * Portfolio grid cover crop: front-matter allowlists, CSS custom properties,
 * template wiring, and (when built) Monotasker HTML.
 */

const fs = require('fs');
const path = require('path');
const { validateCoverPosition, validateCoverZoom } = require('../utils/validation-utils');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const ROOT = path.join(__dirname, '..', '..');

function check(fileObj, label, fn) {
  try {
    fn();
  } catch (err) {
    addIssue(fileObj, {
      type: 'portfolio-cover-crop',
      message: `${label}: ${err.message}`,
      ruleId: 'portfolio-cover-crop',
    });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateValidators(result) {
  const fileObj = addFile(result, 'scripts/utils/validation-utils.js', 'cover crop validators');

  const goodPositions = ['center', 'center 20%', 'top left', '50% 20%', 'center 50.5%'];
  for (const value of goodPositions) {
    check(fileObj, `position ok: ${value}`, () => {
      const r = validateCoverPosition(value);
      assert(r.valid, r.error || 'expected valid');
    });
  }

  const badPositions = ['', 'center center center', 'zoom', '20', 'center 20', 'url(x)', 'center; color: red'];
  for (const value of badPositions) {
    check(fileObj, `position reject: ${JSON.stringify(value)}`, () => {
      const r = validateCoverPosition(value);
      assert(!r.valid, `expected invalid, got valid for ${JSON.stringify(value)}`);
    });
  }

  check(fileObj, 'position rejects non-string', () => {
    assert(!validateCoverPosition(20).valid, 'number should fail');
    assert(!validateCoverPosition(null).valid, 'null should fail');
  });

  for (const value of [1, 1.25, 3, '1', '2.5']) {
    check(fileObj, `zoom ok: ${value}`, () => {
      const r = validateCoverZoom(value);
      assert(r.valid, r.error || 'expected valid');
    });
  }

  for (const value of [0.9, 3.1, 125, 0, -1, 'nope', '', NaN, Infinity]) {
    check(fileObj, `zoom reject: ${value}`, () => {
      const r = validateCoverZoom(value);
      assert(!r.valid, `expected invalid for ${value}`);
    });
  }
}

function validate(result) {
  validateValidators(result);
}

runTest({
  testType: 'portfolio-cover-crop',
  testName: 'Portfolio cover crop',
  requiresSite: false,
  validateFn: validate,
});
```

Register it:

In `scripts/test-runner.js` `testTypes`, add `'portfolio-cover-crop': 'portfolio-cover-crop.js'`.

In `fastTests` and `allTests`, add `'portfolio-cover-crop'` next to `'trailing-slash-links'`.

In `primaryNames`, add `'portfolio-cover-crop'`.

In `scripts/utils/test-results.js`:

- `TEST_EMOJIS`: `'portfolio-cover-crop': '🖼️'` (or `'✂️'` if 🖼️ is already used for preview lockup — use `'📐'`).
- `getTestDisplayName`: `'portfolio-cover-crop': 'Portfolio cover crop'`
- `getTestDescription`: `'portfolio-cover-crop': 'Grid coverPosition/coverZoom allowlist, CSS vars, Monotasker HTML'`

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm run test portfolio-cover-crop`

Expected: FAIL (`validateCoverPosition` / `validateCoverZoom` are not functions / not exported).

- [ ] **Step 3: Implement validators**

In `scripts/utils/validation-utils.js`, add and export:

```js
const COVER_POSITION_TOKEN = '(?:center|top|bottom|left|right|\\d+(?:\\.\\d+)?%)';
const COVER_POSITION_RE = new RegExp(
  `^${COVER_POSITION_TOKEN}(?:\\s+${COVER_POSITION_TOKEN})?$`
);

/**
 * CSS object-position for portfolio grid covers. Call only when the field is present.
 * @param {unknown} value
 * @returns {{ valid: boolean, error?: string }}
 */
function validateCoverPosition(value) {
  if (typeof value !== 'string') {
    return { valid: false, error: 'coverPosition must be a string' };
  }
  const trimmed = value.trim();
  if (!COVER_POSITION_RE.test(trimmed)) {
    return {
      valid: false,
      error: 'coverPosition must be CSS object-position (keywords center/top/bottom/left/right and/or percentages, one or two tokens)'
    };
  }
  return { valid: true };
}

/**
 * Unitless zoom 1–3 for portfolio grid covers. Call only when the field is present.
 * @param {unknown} value
 * @returns {{ valid: boolean, error?: string }}
 */
function validateCoverZoom(value) {
  let n;
  if (typeof value === 'number') {
    n = value;
  } else if (typeof value === 'string' && value.trim() !== '') {
    n = Number(value);
  } else {
    return { valid: false, error: 'coverZoom must be a number from 1 to 3' };
  }
  if (!Number.isFinite(n) || n < 1 || n > 3) {
    return { valid: false, error: 'coverZoom must be a number from 1 to 3' };
  }
  return { valid: true };
}
```

Add both to `module.exports`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm run test portfolio-cover-crop`

Expected: PASS (validator cases only).

- [ ] **Step 5: Commit** (skip unless the user asked to commit)

```bash
git add scripts/utils/validation-utils.js scripts/test/portfolio-cover-crop.js scripts/test-runner.js scripts/utils/test-results.js
git commit -m "$(cat <<'EOF'
Add coverPosition/coverZoom validators for portfolio grid crops.

EOF
)"
```

---

### Task 2: Front matter scan uses the validators

**Files:**
- Modify: `scripts/test/frontmatter.js`

**Interfaces:**
- Consumes: `validateCoverPosition`, `validateCoverZoom` from `scripts/utils/validation-utils.js`
- Produces: issues on any scanned markdown that has a present-but-invalid field. Omitted fields stay silent.

- [ ] **Step 1: Add a helper and call it from both post and root-src validators**

At the top of `scripts/test/frontmatter.js`, extend the existing require:

```js
const { validateDate, validateSlug, validateCoverPosition, validateCoverZoom } = require('../utils/validation-utils');
```

Add:

```js
function validateCoverCropFields(frontMatter) {
  const issues = [];
  if (frontMatter.coverPosition !== undefined) {
    const check = validateCoverPosition(frontMatter.coverPosition);
    if (!check.valid) {
      issues.push(`coverPosition: ${check.error}`);
    }
  }
  if (frontMatter.coverZoom !== undefined) {
    const check = validateCoverZoom(frontMatter.coverZoom);
    if (!check.valid) {
      issues.push(`coverZoom: ${check.error}`);
    }
  }
  return issues;
}
```

In `validateRequiredFields`, after slug validation (before `return { issues, warnings }`), push:

```js
issues.push(...validateCoverCropFields(frontMatter));
```

In `validateRootSrcMarkdownFields`, do the same before its return.

- [ ] **Step 2: Run frontmatter test**

Run: `pnpm run test frontmatter`

Expected: PASS (no posts have these fields yet).

- [ ] **Step 3: Commit** (skip unless the user asked to commit)

```bash
git add scripts/test/frontmatter.js
git commit -m "$(cat <<'EOF'
Validate optional coverPosition and coverZoom in front matter.

EOF
)"
```

---

### Task 3: CSS crop properties + source guards

**Files:**
- Modify: `src/assets/css/jonplummer.css` (portfolio item img rules, ~1203–1220)
- Modify: `scripts/test/portfolio-cover-crop.js`
- Modify: `scripts/build/build.js` (later task can do runner lists; CSS guards run via `pnpm run test portfolio-cover-crop` already)

**Interfaces:**
- Consumes: `--cover-object-position`, `--cover-zoom` set on `article.portfolio-item`
- Produces: clipped 16:9 cover; default position `center`; default zoom `1`; no `#monotasker` rule

- [ ] **Step 1: Extend the test with CSS source assertions (they should fail)**

Append to `validate()` in `scripts/test/portfolio-cover-crop.js` (keep `validateValidators`):

```js
function validateCssSource(result) {
  const cssPath = path.join(ROOT, 'src/assets/css/jonplummer.css');
  const css = fs.readFileSync(cssPath, 'utf8');
  const fileObj = addFile(result, cssPath, 'jonplummer.css');

  const required = [
    'object-position: var(--cover-object-position, center)',
    'transform-origin: var(--cover-object-position, center)',
    'scale: var(--cover-zoom, 1)',
  ];
  for (const snippet of required) {
    if (!css.includes(snippet)) {
      addIssue(fileObj, {
        type: 'portfolio-cover-crop',
        message: `Missing CSS: ${snippet}`,
        ruleId: 'portfolio-cover-crop',
      });
    }
  }

  if (!/article\.portfolio-item a > picture[\s\S]*overflow:\s*hidden/.test(css)) {
    addIssue(fileObj, {
      type: 'portfolio-cover-crop',
      message: 'picture/img cover wrapper must set overflow: hidden',
      ruleId: 'portfolio-cover-crop',
    });
  }

  if (/article\.portfolio-item#[\w-]+\s+img[\s\S]*object-position/.test(css)) {
    addIssue(fileObj, {
      type: 'portfolio-cover-crop',
      message: 'Do not use per-slug object-position rules; use coverPosition front matter',
      ruleId: 'portfolio-cover-crop',
    });
  }
}
```

Call `validateCssSource(result)` from `validate()`.

Run: `pnpm run test portfolio-cover-crop`

Expected: FAIL (missing CSS snippets; `#monotasker` rule still present).

- [ ] **Step 2: Update CSS**

Replace the bordered picture/img rule and the img + `#monotasker` rules with:

```css
article.portfolio-item a > picture,
article.portfolio-item a > img {
  border: 1px solid var(--border-color);
  box-sizing: border-box;
  overflow: hidden;
}

article.portfolio-item img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16/9; /* Optional: Keeps images uniform */
  object-fit: cover;
  object-position: var(--cover-object-position, center);
  transform-origin: var(--cover-object-position, center);
  scale: var(--cover-zoom, 1);
}
```

Delete the entire `#monotasker` rule and its comment.

- [ ] **Step 3: Re-run tests**

Run: `pnpm run test portfolio-cover-crop`

Expected: PASS.

Run: `pnpm run test css`

Expected: PASS (if Stylelint flags `scale`, fix with the project’s existing ignore pattern only if a real rule fails — do not pre-emptively disable rules).

- [ ] **Step 4: Commit** (skip unless the user asked to commit)

```bash
git add src/assets/css/jonplummer.css scripts/test/portfolio-cover-crop.js
git commit -m "$(cat <<'EOF'
Drive portfolio thumbnail crop from CSS variables instead of per-slug rules.

EOF
)"
```

---

### Task 4: Template, Monotasker, HTML smoke

**Files:**
- Modify: `src/_includes/components/portfolio_list_item.njk`
- Modify: `src/_posts/2026/2026-06-05-monotasker.md`
- Modify: `scripts/test/portfolio-cover-crop.js`
- Modify: `scripts/build/build.js`

**Interfaces:**
- Consumes: `post.data.coverPosition`, `post.data.coverZoom`
- Produces: `<article class="portfolio-item" id="…" style="--cover-object-position: …; --cover-zoom: …">` when either field is set. Semicolons between declarations. No `style` attribute when both are omitted.

- [ ] **Step 1: Add failing template + post + HTML assertions**

In `scripts/test/portfolio-cover-crop.js`, append:

```js
function validateTemplateAndPost(result) {
  const njkPath = path.join(ROOT, 'src/_includes/components/portfolio_list_item.njk');
  const njk = fs.readFileSync(njkPath, 'utf8');
  const njkObj = addFile(result, njkPath, 'portfolio_list_item.njk');
  if (!njk.includes('--cover-object-position') || !njk.includes('--cover-zoom')) {
    addIssue(njkObj, {
      type: 'portfolio-cover-crop',
      message: 'portfolio_list_item.njk must set --cover-object-position and --cover-zoom from front matter',
      ruleId: 'portfolio-cover-crop',
    });
  }

  const postPath = path.join(ROOT, 'src/_posts/2026/2026-06-05-monotasker.md');
  const post = fs.readFileSync(postPath, 'utf8');
  const postObj = addFile(result, postPath, 'monotasker.md');
  if (!/^coverPosition:\s*center 20%\s*$/m.test(post)) {
    addIssue(postObj, {
      type: 'portfolio-cover-crop',
      message: 'Monotasker must set coverPosition: center 20%',
      ruleId: 'portfolio-cover-crop',
    });
  }
}

function validateBuiltHtml(result) {
  const htmlPath = path.join(ROOT, '_site/portfolio/index.html');
  if (!fs.existsSync(htmlPath)) {
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const fileObj = addFile(result, htmlPath, 'portfolio/index.html');
  const articleMatch = html.match(/<article class="portfolio-item" id="monotasker"[^>]*>/);
  if (!articleMatch) {
    addIssue(fileObj, {
      type: 'portfolio-cover-crop',
      message: 'Built portfolio HTML missing article#monotasker',
      ruleId: 'portfolio-cover-crop',
    });
    return;
  }
  if (!articleMatch[0].includes('--cover-object-position: center 20%')) {
    addIssue(fileObj, {
      type: 'portfolio-cover-crop',
      message: 'Monotasker card must include style --cover-object-position: center 20%',
      ruleId: 'portfolio-cover-crop',
    });
  }
}
```

Call both from `validate()`.

Run: `pnpm run test portfolio-cover-crop`

Expected: FAIL (template/post missing).

- [ ] **Step 2: Update the list item template**

Replace the opening `<article>` line in `src/_includes/components/portfolio_list_item.njk` with:

```njk
<article class="portfolio-item" id="{{ post.fileSlug }}"{% if post.data.coverPosition or post.data.coverZoom %} style="{% if post.data.coverPosition %}--cover-object-position: {{ post.data.coverPosition }};{% endif %}{% if post.data.coverPosition and post.data.coverZoom %} {% endif %}{% if post.data.coverZoom %}--cover-zoom: {{ post.data.coverZoom }};{% endif %}"{% endif %}>
```

Keep the rest of the file unchanged.

- [ ] **Step 3: Add Monotasker front matter**

In `src/_posts/2026/2026-06-05-monotasker.md`, immediately after `coverImage: 2026/06/onboarding.png`:

```yaml
coverPosition: center 20%
```

Do not add `coverZoom`.

- [ ] **Step 4: Wire the test into the build’s post-build phase**

In `scripts/build/build.js` `POST_BUILD_TESTS`, add `'portfolio-cover-crop'` after `'deploy-assets'` (or next to `'html'`). Source checks still run here; HTML smoke sees the `_site` this build just wrote.

- [ ] **Step 5: Run tests**

Run: `pnpm run test frontmatter`

Expected: PASS.

Run: `pnpm run test portfolio-cover-crop`

Expected: PASS on source checks. If `_site/portfolio/index.html` exists from an old build, HTML may still fail until rebuild — that is OK.

Run: `pnpm run build`

Expected: PASS, including `portfolio-cover-crop` HTML smoke on the fresh `_site`.

- [ ] **Step 6: Commit** (skip unless the user asked to commit)

```bash
git add src/_includes/components/portfolio_list_item.njk src/_posts/2026/2026-06-05-monotasker.md scripts/test/portfolio-cover-crop.js scripts/build/build.js
git commit -m "$(cat <<'EOF'
Apply portfolio cover crop from post front matter.

EOF
)"
```

---

### Task 5: Docs and memory

**Files:**
- Modify: `docs/authoring.md` (Optional front matter list)
- Modify: `docs/tests.md` (Fast Tests list + a short section)
- Modify: `docs/commands.md` (`test fast` run list)
- Modify: `.cursor/rules/memory.mdc` (Portfolio grid links bullet)
- Modify: `docs/ideas.md` (Selected → Craft thumbnail crop line)

**Interfaces:** none

- [ ] **Step 1: Authoring**

In `docs/authoring.md` under **Optional**, add (after `ogImage` is fine; keep the list as bullets):

```markdown
- **`coverImage`** - Portfolio grid thumbnail path relative to `src/assets/images/` (e.g. `2026/06/onboarding.png`). Used only by `portfolio_list_item.njk`.
- **`coverPosition`** - Portfolio grid crop focal point. CSS `object-position` syntax: one or two tokens from `center` / `top` / `bottom` / `left` / `right` and percentages (e.g. `center 20%`). Omit for center. Does not affect the detail-page figure.
- **`coverZoom`** - Portfolio grid crop zoom. Unitless number from 1 to 3 (`1` = default cover scale, `1.25` = tighter crop). Omit for 1. Same 16:9 card size; detail page unchanged.
```

- [ ] **Step 2: Tests + commands**

In `docs/tests.md` **Fast Tests** line, add `portfolio-cover-crop`.

Add a subsection after the `css.js` (or `frontmatter.js`) section:

```markdown
### portfolio-cover-crop.js

Guards portfolio grid thumbnail crop authoring: `validateCoverPosition` / `validateCoverZoom` allowlists, `jonplummer.css` custom properties (no per-slug `object-position` rules), `portfolio_list_item.njk` wiring, Monotasker `coverPosition: center 20%`, and — when `_site/portfolio/index.html` exists — that card’s inline `--cover-object-position`. Included in `test fast` and in `scripts/build/build.js` post-build.
```

In `docs/commands.md` under `pnpm run test fast`, add `portfolio-cover-crop` to the listed sequence (the list there is documentation; `scripts/test-runner.js` is the source of truth).

If `pnpm run test spell` fails on `coverPosition` / `coverZoom` in authoring.md, add those exact tokens to `cspell-custom-words.txt`.

- [ ] **Step 3: Memory + ideas**

In `.cursor/rules/memory.mdc`, replace the Monotasker CSS sentence in the **Portfolio grid links** bullet with: covers use **`aspect-ratio: 16/9; object-fit: cover`**; optional **`coverPosition`** / **`coverZoom`** on the post set `--cover-object-position` / `--cover-zoom` on the card (no `#slug` `object-position` rules). Spec: `2026-08-13-portfolio-cover-position-design.md`. Guard: **`pnpm run test portfolio-cover-crop`**.

In `docs/ideas.md` Selected → Craft, keep “Address crops and appropriateness of thumbnails in portfolio” as the per-item audit. Add a sub-bullet: **Shipped (2026-08-13):** `coverPosition` / `coverZoom` front matter for grid crop; Monotasker migrated off `#monotasker` CSS.

- [ ] **Step 4: Verify**

Run: `pnpm run test frontmatter`

Run: `pnpm run test portfolio-cover-crop`

Run: `pnpm run test css`

Run: `pnpm run test spell` (if authoring.md is in scope)

Expected: PASS.

- [ ] **Step 5: Commit** (skip unless the user asked to commit)

```bash
git add docs/authoring.md docs/tests.md docs/commands.md docs/ideas.md .cursor/rules/memory.mdc
git commit -m "$(cat <<'EOF'
Document portfolio coverPosition and coverZoom.

EOF
)"
```

---

## Spec coverage

| Spec requirement | Task |
|------------------|------|
| `coverPosition` front matter + allowlist | 1, 2, 4 |
| `coverZoom` 1–3 multiplier | 1, 2, 4 |
| CSS variables + `scale` + matching `transform-origin` | 3 |
| `overflow: hidden` on picture/img wrapper | 3 |
| Delete `#monotasker` CSS; Monotasker `center 20%` only | 3, 4 |
| Grid-only / no other posts | 4 (constraint) |
| Authoring + memory | 5 |
| `test frontmatter` | 2 |
| CSS source guard + built HTML smoke | 3, 4 |
| No `object-view-box` | 3 (constraint) |
