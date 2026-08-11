# Home Tagline Deploy Salt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Salt only the home (`/`) lockup tagline with `git rev-parse HEAD`, and append two new lines to the shared `site.taglines` pool.

**Architecture:** Keep one pool and the existing 32-bit URL hash. For `/` only, hash `` `${salt}:${url}` `` when salt is non-empty; all other URLs ignore salt. Resolve salt once when registering `taglineForPage`. Pool growth intentionally reshuffles all lockups once — no split-pool or sticky front matter.

**Tech Stack:** CommonJS Eleventy filters; `child_process.execSync` for git (same pattern as `scripts/utils/indexnow.js`); `pnpm run test site-branding`.

## Global Constraints

- Canonical `site.tagline` stays `Making ideas tangible`; do not change `<title>` / OG / feeds.
- Salt applies **only** to `/` (empty/null URL normalizes to `/`).
- Same `HEAD` → same home tagline; missing git → empty salt (URL-only home).
- New pool lines (exact strings): `Care shows up in the product`, `Evidence over ego`.
- Templates stay `{{ page.url | taglineForPage }}` — no template API change.
- Do not refactor IndexNow’s `getCurrentCommitHash` unless a shared helper is the smallest clear win; duplicating a 5-line try/catch is fine.

## File map

| File | Role |
|------|------|
| `eleventy/utils/tagline-for-url.js` | `pickTaglineForUrl(taglines, url, salt?)`; optional `getGitHeadSha()` |
| `eleventy/config/filters.js` | Pass build-time salt into `taglineForPage` |
| `src/_data/site.js` | Append two taglines |
| `scripts/test/site-branding.js` | Salt + pool assertions |
| `docs/ideas.md` | Note home deploy-salt behavior |
| `.cursor/rules/memory.mdc` | Short gotcha: salt only `/`; pool length change = one-time full reshuffle |

**Spec:** `docs/superpowers/specs/2026-08-11-home-tagline-deploy-salt-design.md`

---

### Task 1: Salt-aware `pickTaglineForUrl` (TDD)

**Files:**
- Modify: `eleventy/utils/tagline-for-url.js`
- Modify: `scripts/test/site-branding.js`
- Test: `pnpm run test site-branding`

**Interfaces:**
- Consumes: existing `pickTaglineForUrl(taglines, url)`
- Produces: `pickTaglineForUrl(taglines, url, salt?)` — third arg optional string; non-home ignores salt; home uses `` `${salt}:/` `` when salt is non-empty

- [ ] **Step 1: Add failing salt assertions to `site-branding.js`**

In the existing `taglineForPage is stable per URL` check (or a new adjacent `check`), require:

```js
check(siteFile, 'salt affects home only', () => {
  const { pickTaglineForUrl } = require('../../eleventy/utils/tagline-for-url');
  const pool = [
    'Making ideas tangible',
    'Understand, then build',
    'Study people, ship software',
    'Listen before making',
    'Build from understanding',
    'Learn to build, build to learn',
    'Care shows up in the product',
    'Evidence over ego',
  ];
  const aboutA = pickTaglineForUrl(pool, '/about/', 'aaa');
  const aboutB = pickTaglineForUrl(pool, '/about/', 'bbb');
  assert.strictEqual(aboutA, aboutB, 'non-home must ignore salt');

  const homeSame = pickTaglineForUrl(pool, '/', 'salt-one');
  assert.strictEqual(
    homeSame,
    pickTaglineForUrl(pool, '/', 'salt-one'),
    'same home salt must be stable'
  );

  const salts = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'];
  const homePicks = new Set(salts.map((s) => pickTaglineForUrl(pool, '/', s)));
  assert.ok(
    homePicks.size > 1,
    'different home salts should yield more than one tagline across a small sample'
  );

  assert.strictEqual(
    pickTaglineForUrl(pool, null, 'x'),
    pickTaglineForUrl(pool, '/', 'x'),
    'null URL normalizes to / and uses salt'
  );
});

check(siteFile, 'pool includes new lockup lines', () => {
  const site = require(SITE_JS)();
  assert.ok(site.taglines.includes('Care shows up in the product'));
  assert.ok(site.taglines.includes('Evidence over ego'));
});
```

Leave the existing stability check in place (it may call `pickTaglineForUrl` with two args — that must keep working).

- [ ] **Step 2: Run test — expect salt / pool failures**

Run: `pnpm run test site-branding`

Expected: FAIL on `salt affects home only` and/or `pool includes new lockup lines` (third arg ignored or pool missing strings).

- [ ] **Step 3: Implement salt keying in `tagline-for-url.js`**

Replace the module with:

```js
/**
 * Deterministic tagline pick from a URL (browse variety, no client JS).
 * Same URL + same pool (+ same salt for home) → same line across rebuilds.
 *
 * Home (`/`): when salt is a non-empty string, hash key is `${salt}:${url}`.
 * All other URLs ignore salt.
 *
 * @param {string[]} taglines
 * @param {string} [url]
 * @param {string} [salt]
 * @returns {string}
 */
function pickTaglineForUrl(taglines, url, salt) {
  if (!Array.isArray(taglines) || taglines.length === 0) {
    return '';
  }
  const path = url == null || url === '' ? '/' : String(url);
  const useSalt = path === '/' && typeof salt === 'string' && salt.length > 0;
  const key = useSalt ? `${salt}:${path}` : path;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0; // 32-bit
  }
  const idx = Math.abs(hash) % taglines.length;
  return taglines[idx];
}

module.exports = { pickTaglineForUrl };
```

- [ ] **Step 4: Append the two taglines in `src/_data/site.js`**

Keep order of the existing six; append:

```js
  const taglines = [
    'Making ideas tangible',
    'Understand, then build',
    'Study people, ship software',
    'Listen before making',
    'Build from understanding',
    'Learn to build, build to learn',
    'Care shows up in the product',
    'Evidence over ego',
  ];
```

- [ ] **Step 5: Re-run `pnpm run test site-branding`**

Expected: PASS for the new checks (filter still unsalted until Task 2 — unit tests call `pickTaglineForUrl` directly).

- [ ] **Step 6: Commit**

```bash
git add eleventy/utils/tagline-for-url.js src/_data/site.js scripts/test/site-branding.js
git commit -m "$(cat <<'EOF'
Add home-only tagline salt support and expand pool.

EOF
)"
```

---

### Task 2: Wire git `HEAD` into `taglineForPage`

**Files:**
- Modify: `eleventy/utils/tagline-for-url.js` (export `getGitHeadSha`)
- Modify: `eleventy/config/filters.js`
- Test: `pnpm run test site-branding`

**Interfaces:**
- Consumes: `pickTaglineForUrl(taglines, url, salt?)`
- Produces: `getGitHeadSha(): string` — trimmed SHA or `''` on failure; `taglineForPage` closes over one salt from filter setup

- [ ] **Step 1: Add `getGitHeadSha` next to the pick helper**

```js
const { execSync } = require('child_process');

/**
 * @returns {string} Current HEAD SHA, or '' if git is unavailable.
 */
function getGitHeadSha() {
  try {
    return execSync('git rev-parse HEAD', {
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch (err) {
    return '';
  }
}

module.exports = { pickTaglineForUrl, getGitHeadSha };
```

(Keep `pickTaglineForUrl` as implemented in Task 1.)

- [ ] **Step 2: Pass salt from `filters.js`**

Replace the `taglineForPage` registration with:

```js
  const { pickTaglineForUrl, getGitHeadSha } = require("../utils/tagline-for-url");
  // ... existing requires stay; remove duplicate pick-only require at top if consolidating

  const taglineSalt = getGitHeadSha();
  eleventyConfig.addFilter("taglineForPage", (pageUrl) =>
    pickTaglineForUrl(siteData.taglines, pageUrl, taglineSalt)
  );
```

Adjust the top-of-file require so `getGitHeadSha` is imported once (do not leave a stale `pickTaglineForUrl`-only import).

- [ ] **Step 3: Optional assertion that live filter path resolves a salt in-repo**

Add to `site-branding.js`:

```js
check(siteFile, 'getGitHeadSha returns a sha in this repo', () => {
  const { getGitHeadSha } = require('../../eleventy/utils/tagline-for-url');
  const sha = getGitHeadSha();
  assert.ok(/^[0-9a-f]{40}$/i.test(sha), `expected full sha, got ${JSON.stringify(sha)}`);
});
```

- [ ] **Step 4: Run `pnpm run test site-branding`**

Expected: PASS.

- [ ] **Step 5: Smoke-check home vs about picks (optional node one-liner)**

```bash
node -e "
const { pickTaglineForUrl, getGitHeadSha } = require('./eleventy/utils/tagline-for-url');
const site = require('./src/_data/site.js')();
const salt = getGitHeadSha();
console.log('salt', salt.slice(0,7));
console.log('home', pickTaglineForUrl(site.taglines, '/', salt));
console.log('about', pickTaglineForUrl(site.taglines, '/about/', salt));
"
```

Expected: prints an 8-line pool home/about pair; about ignores salt (same with a fake second salt).

- [ ] **Step 6: Commit**

```bash
git add eleventy/utils/tagline-for-url.js eleventy/config/filters.js scripts/test/site-branding.js
git commit -m "$(cat <<'EOF'
Wire git HEAD salt into taglineForPage for home only.

EOF
)"
```

---

### Task 3: Docs + memory

**Files:**
- Modify: `docs/ideas.md` (Done bullet for per-page tagline rotation)
- Modify: `.cursor/rules/memory.mdc` (branding / tagline gotcha)
- Test: none beyond re-read; optionally `pnpm run test site-branding` once more

- [ ] **Step 1: Update the Done note in `docs/ideas.md`**

Find the “Per-page lockup tagline rotation” bullet and extend it to mention home-only `HEAD` salt and that changing pool length reshuffles all lockups once.

- [ ] **Step 2: Add a short memory gotcha**

Under project structure or gotchas in `.cursor/rules/memory.mdc`: home lockup uses `git HEAD` salt via `taglineForPage`; other URLs are URL-only; expanding/reordering `site.taglines` causes a one-time sitewide lockup reshuffle (accepted).

- [ ] **Step 3: Commit**

```bash
git add docs/ideas.md .cursor/rules/memory.mdc
git commit -m "$(cat <<'EOF'
Document home tagline deploy salt behavior.

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Home salt with git HEAD | Task 2 |
| Non-home ignores salt | Task 1 |
| Empty/null URL → `/` + salt | Task 1 |
| Missing git → `''` | Task 2 (`getGitHeadSha`) |
| Append two taglines; canonical unchanged | Task 1 |
| One pool; pool growth = one-time full reshuffle (documented) | Spec + Task 3 |
| `taglineForPage` API unchanged | Task 2 |
| site-branding tests | Tasks 1–2 |
| No OG/title/feed change | (no file touches) |
