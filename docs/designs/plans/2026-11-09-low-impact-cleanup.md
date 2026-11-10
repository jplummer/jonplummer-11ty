# Low-impact cleanup implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove stale docs, dead Eleventy config, and duplicated test labels, move the unit tests onto Node's built-in test runner, and add a live smoke check, without changing one byte of the built site.

**Architecture:** Every task is checked against a saved copy of `_site/` taken before any edit; the expected diff is empty. Test labels move into `scripts/test-manifest.js`, which already owns test membership. Unit tests become `node:test` files run by `node --test`; the site checks keep the existing JSON runner. The live smoke check is a new read-only script that builds its expectations from the same data files `.htaccess` is generated from.

**Tech stack:** Node >= 22.18 (`node:test`, global `fetch`), Eleventy 3, js-yaml. No new dependencies.

**Spec:** None. This plan implements items 1–4 of the blast-radius list agreed in conversation on 2026-11-09, plus the smoke check Jon asked for. The decisions are recorded here.

## Global constraints

- The built site must not change. `diff -rq -x img .cache/cleanup-baseline/site _site` prints nothing after every task. One exception: if `HEAD` moved since the baseline, the tagline inside `<hgroup>` in `_site/index.html` may differ, because it is salted with the commit SHA.
- Compare before committing, so `HEAD` matches the baseline.
- Never commit, push, or deploy without Jon's approval. Each "Commit" step means: show Jon the proposed title and body, then commit when he approves.
- Rule 0: when anything fails or surprises, stop, explain, and wait.
- OG image generation, naming, and front matter write-back are out of scope. Don't edit `scripts/content/generate-og-images.js`, `scripts/utils/og-*.js`, or `eleventy/utils/css-utils.js`: the first and last are inputs to every card's digest, and an edit re-renders every card.
- Don't edit `scripts/deploy/deploy.js`. `pnpm run test deploy-guards` checks its source text.
- No file moves or renames.
- Batch similar edits, then verify once (project `CLAUDE.md`, Efficiency).
- Docs and comments follow `~/.agents/writing-rules.md`: en dashes with spaces, no em dashes, plain words.
- Append what was learned to `docs/agent-memory.md` at the end of each task that teaches something.

## Review focus

1. A test id with no label in the manifest: loading the manifest must throw, so a new test can't show up with a facepalm emoji. Pinned in Task 3, step 1.
2. A result whose `testType` is not a manifest id (`accessibility` and `pipe-fixture` exist today): the label getters must fall back to the raw string and the facepalm emoji, not throw. Pinned in Task 3, step 5.
3. Cloudflare answering from its edge cache while the origin is broken: the smoke check's `.htaccess` assertions must use URLs that can't be cached. Pinned in Task 4 by the random-path 404 check, which also carries the security-header assertions.
4. A redirect expectation that is wrong about the live site as it is today: the smoke check must run green against the live site before any deploy, or each failure must be explained. Pinned in Task 4, step 6.
5. `node --test` runs files in parallel by default, and the unit tests write temp files and launch a browser: pin `--test-concurrency=1`. Pinned in Task 6, step 3.

## What shipped differently (added 2026-11-09)

Tasks 0 to 5 shipped on 2026-11-09. The task text below is the plan as written; these are the places the result differs from it.

- **Task 1 kept the test lists.** The plan says to delete the Fast and Unit id lists from `docs/tests.md` and point at `pnpm run test`. Jon found that sent a reader off to run a command to learn what the docs should say. The lists stayed, corrected from the manifest (`shortlinks` and `404-suggest` added), `docs/commands.md` links to them, and a comment at the top of `scripts/test-manifest.js` says to update them by hand. Nothing checks them.
- **Task 3 chose different emoji** for five tests, on Jon's picks: 🤏 `shortlinks`, 🤷 `404-suggest`, 🫆 `og-shared-fingerprint`, 🪪 `og-card-digest`, 🪙 `figure-tokens`.
- **Task 4, step 7:** the `blocked` group passes against `https://example.com`, because it asks only that four paths not return 200. The run fails 114 of 118, not every group.
- **Task 4:** no list is retired today, so the `retired-lists` group has not run against the live site. Its unit test is its only cover.
- **Task 4:** `pnpm run smoke` takes its flags with or without `--`.
- **Not in the plan:** the runner showed a ✅ for a test file that crashed. Fixed in `a3fca4d6`.
- **Found along the way,** recorded in `docs/ideas.md`: six year directories the deploy can't delete from the server, and a dry run that keeps the next deploy from committing the changelog.

Tasks 6 and 7 have not started.

---

### Task 0: Capture the baseline

**Files:**
- Create (gitignored): `.cache/cleanup-baseline/`

**Interfaces:**
- Produces: `.cache/cleanup-baseline/site/` (copy of `_site/` without `img/`), `test-list.txt`, `test-unit.txt`, `test-fast.txt`. Every later task compares against these.

- [ ] **Step 1: Confirm a clean tree**

Run: `git status --short`
Expected: no output.

- [ ] **Step 2: Build and save the output**

```bash
pnpm run build
mkdir -p .cache/cleanup-baseline
rsync -a --delete --exclude img/ _site/ .cache/cleanup-baseline/site/
```

Expected: build ends with `🕒 Build finished`. `git status --short` still prints nothing (if the OG generator wrote front matter, stop and tell Jon).

- [ ] **Step 3: Measure the noise floor**

Run: `pnpm run build && diff -rq -x img .cache/cleanup-baseline/site _site`
Expected: no output. If any file differs between two builds of the same tree, list the files and stop: the comparison in later tasks needs an allowlist, and Jon should see it first.

- [ ] **Step 4: Save test output**

```bash
pnpm run test > .cache/cleanup-baseline/test-list.txt
pnpm run test unit > .cache/cleanup-baseline/test-unit.txt 2>&1
pnpm run test fast > .cache/cleanup-baseline/test-fast.txt 2>&1
grep -c "check(" scripts/test/*.js > .cache/cleanup-baseline/check-counts.txt
```

Expected: `test unit` and `test fast` both end in a passing summary. If either fails on the untouched tree, stop.

---

### Task 1: Stale docs and comments

**Files:**
- Modify: `docs/commands.md` (line 35 `Runs:` chain; line 91 backup sentence)
- Modify: `docs/tests.md` (lines 37 and 39, the Fast and Unit id lists)
- Modify: `src/404-index.njk` (header comment)
- Modify: `docs/agent-memory.md` (line 36, the `deploy` chain, only if stale)

- [ ] **Step 1: Make the edits**

  - `docs/commands.md:35`: replace the hand-written `Runs: html → … → portfolio-cover-crop` chain with: "Run `pnpm run test` to see the current list. It is read from `scripts/test-manifest.js`." The chain lists two unit tests (`portfolio-notes`, `cloudflare-purge`) and omits eight fast ones.
  - `docs/commands.md:91`: delete the sentence "Prior complex deployment scripts were moved to `scripts/deploy/backup/`." That directory does not exist. Keep the rest of the paragraph.
  - `docs/tests.md:37` and `:39`: delete the id lists after **Fast Tests:** and **Unit Tests:** and say where the list comes from (`pnpm run test`). Keep the Slow and Other lines, and keep the link to the Unit Tests section. The lists omit `shortlinks` and `404-suggest`.
  - `src/404-index.njk`: in the top comment, replace the paragraph that begins "Unlike sitemap.njk this does not hardcode" with: "/portfolio/, /wisdom/ and /sides/ aren't listed by hand: all three are templates tagged `page`, so collections.page already has them." The sitemap duplicates it describes were fixed on 2026-10-16. It is a Nunjucks comment, so output can't change.
  - `docs/agent-memory.md:36`: the entry opens "`deploy` runs: `changelog` → `generate-og-images` → `test markdown` → `test frontmatter` → `build` → `test og-images` → rsync". Read `scripts/deploy/deploy.js` and `scripts/build/build.js`. If deploy now runs `changelog` → `build` → rsync, with the tests inside build, rewrite only that opening chain to match. Leave the rest of the entry.

- [ ] **Step 2: Verify**

Run: `pnpm run test docs-links && pnpm run test markdown && pnpm run build && diff -rq -x img .cache/cleanup-baseline/site _site`
Expected: both tests pass; `diff` prints nothing.

- [ ] **Step 3: Commit**

Proposed title: `Fix stale test lists and comments in docs`

---

### Task 2: Dead Eleventy config

**Files:**
- Modify: `eleventy/config/passthrough.js`
- Modify: `eleventy/config/preprocessors.js`

- [ ] **Step 1: Confirm each line is dead**

```bash
ls src/.htaccess
git ls-files | grep -c '\.backup'
find src -name '*.backup*'
```

Expected: `No such file`, `0`, and no output. `.htaccess` is built by the template `src/.htaccess.njk`. If any of the three finds something, stop.

- [ ] **Step 2: Remove the lines**

  - `passthrough.js`: delete `eleventyConfig.addPassthroughCopy({ "src/.htaccess": ".htaccess" });` and its comment.
  - `preprocessors.js`: delete the `docs/` ignore (the input directory is `src`, so `docs/` is never read) and the two `*.backup` ignores, with their comments. Keep the drafts preprocessor and the `ogimages.njk` note. Update the file's header comment so it no longer promises ignores.

- [ ] **Step 3: Verify the build output is identical**

Run: `pnpm run build && diff -rq -x img .cache/cleanup-baseline/site _site && cmp .cache/cleanup-baseline/site/.htaccess _site/.htaccess`
Expected: no output from either command. An identical `.htaccess` is the proof that the server can't behave differently because of this task.

- [ ] **Step 4: Verify the dev server**

Run `pnpm run dev` with `ELEVENTY_OPEN_BROWSER=0`, wait for the first build, then:

```bash
for p in / /about/ /color/ /type/ /googleae69d4f1ebd96198.html /assets/css/jonplummer.css; do
  printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:8080$p")" "$p"
done
```

Expected: `200` on every line. Stop the dev server.

- [ ] **Step 5: Commit**

Proposed title: `Remove passthrough and ignore rules that match nothing`

---

### Task 3: Test labels move into the manifest

**Files:**
- Modify: `scripts/test-manifest.js`
- Modify: `scripts/utils/test-results.js` (delete `TEST_EMOJIS` and the tables inside `getTestDisplayName` and `getTestDescription`, lines 285–427)
- Modify: `docs/tests.md` (§ The test manifest), `docs/agent-memory.md` (Test manifest entry, line 40)

**Interfaces:**
- Produces: each `TESTS` entry gains `name: string`, `description: string`, `emoji: string`. New export `getTestLabel(id: string): { name, description, emoji } | null`.
- Unchanged signatures in `test-results.js`: `getTestEmoji(testType)`, `getTestDisplayName(testType)`, `getTestDescription(testType)`. `scripts/test-runner.js` needs no edit.

- [ ] **Step 1: Write the failing check**

Add to `validateManifest()` in `scripts/test-manifest.js`:

```js
for (const test of TESTS) {
  for (const field of ['name', 'description', 'emoji']) {
    assertManifest(
      typeof test[field] === 'string' && test[field].trim().length > 0,
      `test '${test.id}' needs a ${field}`
    );
  }
}
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm run test`
Expected: throws `[test-manifest] test 'html' needs a name`.

- [ ] **Step 3: Add the three fields to all 43 entries**

Copy each value character for character from the current tables in `test-results.js`, trailing spaces inside emoji strings included (`'🗂️ '`, `'✍️ '`): they work around a macOS Terminal width bug. Where `critical-css` has two descriptions, keep the second. Drop the `content` display name; no such test exists. Values the tables lack, or get wrong:

| id | name | description | emoji |
|---|---|---|---|
| `shortlinks` | Short links | Short link data and .htaccess rules | (existing) |
| `portfolios` | Portfolio lists | Portfolio lists in portfolios.yaml | (existing) |
| `404-suggest` | 404 suggestions | Matcher behind the 404 page suggestions | (existing) |
| `indexnow` | IndexNow | IndexNow URL selection from content-hash manifests | (existing) |
| `figure-lightbox` | Figure lightbox | Lightbox trigger links on figures | 🔍 |
| `og-shared-fingerprint` | OG shared fingerprint | OG shared fingerprint changes only when card inputs change | 🧬 |
| `og-card-digest` | OG card digest | OG card digest in the PNG and the render, keep, or stamp decision | 🔏 |
| `changelog-format` | Changelog format | Changelog wraps filenames as code | 🗒️ |
| `figure-tokens` | Figure tokens | Generated figure colors match jonplummer.css :root tokens | 🎯 |

Add `getTestLabel` and export it. Update the header comment's "Each entry" list.

- [ ] **Step 4: Point the getters at the manifest**

In `test-results.js`, delete the three tables and have the three getters call `getTestLabel`. Keep today's fallbacks: emoji `'🤦🏻‍♀️'`, name falls back to the `testType` string, description to `''`. Remove `TEST_EMOJIS` from `module.exports` (nothing else imports it; confirm with `grep -rn TEST_EMOJIS scripts`).

- [ ] **Step 5: Verify**

```bash
pnpm run test > .cache/cleanup-baseline/test-list-after.txt; diff .cache/cleanup-baseline/test-list.txt .cache/cleanup-baseline/test-list-after.txt
node -e "const r=require('./scripts/utils/test-results');console.log(r.getTestDisplayName('pipe-fixture'),r.getTestEmoji('nope'),JSON.stringify(r.getTestDescription('nope')))"
pnpm run test unit && pnpm run test fast
pnpm run build && diff -rq -x img .cache/cleanup-baseline/site _site
```

Expected: the list diff shows only the lines for `shortlinks`, `portfolios`, `404-suggest`, `indexnow`, `figure-lightbox`, `og-shared-fingerprint`, `og-card-digest`, `changelog-format`, and `figure-tokens`. The `node -e` line prints `pipe-fixture 🤦🏻‍♀️ ""`. Both groups pass, and in their output those nine tests now show a name where they showed a bare id. The site diff prints nothing.

- [ ] **Step 6: Update docs and commit**

`docs/tests.md` § The test manifest: the sentence "no other file needs editing" becomes true; say that `name`, `description`, and `emoji` are required and checked on load. Same for the agent-memory entry.

Proposed title: `Keep test names, descriptions, and emoji in the manifest`

---

### Task 4: Live smoke check

**Files:**
- Create: `scripts/utils/live-smoke.js` (pure: builds and evaluates checks)
- Create: `scripts/deploy/smoke-live.js` (CLI: reads data, fetches, prints)
- Create: `scripts/test/live-smoke.js` (unit test, existing `check()` style)
- Modify: `scripts/test-manifest.js` (new entry), `package.json` (`"smoke": "node scripts/deploy/smoke-live.js"`)
- Modify: `docs/commands.md` (Deployment section), `docs/tests.md` (Unit Tests section)

**Interfaces:**
- `buildSmokeChecks({ redirects, shortlinks, retiredListUrls, sitemapUrls, rootFiles, nonce }) → Check[]`
- `Check = { group: string, path: string, expect: { status?: number, notStatus?: number, location?: string, contentType?: string, includes?: string[], headers?: { [name]: string } } }`. A `headers` value must be contained in the response header, compared case-insensitively.
- `evaluateResponse(check, { status, headers, body }, baseUrl) → string[]` (failure messages; empty means pass).
- `sameLocation(actual, expected, baseUrl) → boolean`: resolves both against `baseUrl` and ignores one trailing slash on the path. `scripts/deploy/deploy.js` has a private `normalizeLocation` that does the same job; it can't be imported, because requiring that file starts a deploy.
- CLI: `pnpm run smoke [-- --base-url <url>] [--only <group>]`. Default base is `https://` + `getSiteDomain()` from `scripts/utils/network-utils.js`. Exit code 1 on any failure.

**Design decisions:**
- Read-only: GET requests with `redirect: 'manual'`, one at a time, about 120 in total. No request body, no credentials, nothing written.
- Manual command. It is not wired into `deploy`, which already smoke-checks short links and fails on them. Wiring it in is Jon's call after he has seen it run.
- Expectations come from source data, so the check follows the site as it changes: `src/_data/redirects.yaml`, `loadShortlinksFile()` from `scripts/utils/shortlinks.js`, `retiredUrls()` from `eleventy/utils/portfolios.js`, `readSitemapUrls()` from `scripts/utils/indexnow.js` over `_site/sitemap.xml`, and the `src/google*.html` and `src/*.txt` filenames. If `_site/sitemap.xml` is missing, print "run `pnpm run build` first" and exit 1.
- `nonce` is a random string made by the CLI, so the 404 path has never been requested and Cloudflare can't answer it from cache.

The groups `buildSmokeChecks` returns:

| group | paths | expect |
|---|---|---|
| `error-page` | `/smoke-<nonce>/` | 404; body includes `/assets/css/jonplummer.css` and `page not found`; headers `x-content-type-options: nosniff`, `x-frame-options: SAMEORIGIN`, `referrer-policy: strict-origin-when-cross-origin`, `strict-transport-security: max-age=31536000`, `content-security-policy: default-src 'self'` |
| `redirects` | every `from` in `redirects.yaml` | 301; `location` is its `to` |
| `retired-lists` | each retired list URL, with and without the trailing slash | 302; `location` `/portfolio/` |
| `shortlinks` | `/JP` and `/jp` | 302; `location` is that entry's `to` |
| `wisdom-rewrite` | `/wisdom/tags/smoke-<nonce>/` | 301; `location` `/wisdom/` |
| `blocked` | `/.htaccess`, `/.env`, `/package.json`, `/assets/css/` | `notStatus: 200` |
| `root-files` | each `rootFiles` name, `/favicon.ico`, `/robots.txt`, `/sitemap.xml`, `/feed.xml`, `/links-feed.xml`, `/wisdom-feed.xml` | 200; the three feeds and the sitemap include `<?xml` |
| `assets` | `/assets/css/jonplummer.css`, `/assets/js/figure-lightbox.js`, `/assets/fonts/lab/libre-franklin-latin-wght-normal.woff2`, `/assets/images/og/v2/index.png` | 200; the CSS has `contentType` `text/css`, the PNG `image/png` |
| `pages` | `/`, `/about/`, `/portfolio/`, `/sides/`, `/wisdom/`, `/color/`, `/type/`, `/ogimages/`, `/changelog/`, `/portfolio/all/`, plus the last sitemap URL matching each of `^/\d{4}/\d{2}/\d{2}/`, `^/portfolio/[^/]+/$`, `^/sides/[^/]+/$`, `^/wisdom/tags/`, `^/page/\d+/$` | 200; body includes `<main id="main"` and `</html>` |

- [ ] **Step 1: Write the failing test**

`scripts/test/live-smoke.js`, in the same shape as `scripts/test/date-utils.js` (`check(name, fn)` collecting into `addIssue`, then `runTest`). The checks:

```js
const fixture = {
  redirects: [{ from: '/old/', to: '/new/' }, { from: '/resume', to: 'https://misc.example.com/r.pdf' }],
  shortlinks: [{ slug: 'JP', to: 'https://example.com/' }],
  retiredListUrls: ['/portfolio/acme/'],
  sitemapUrls: ['https://example.com/', 'https://example.com/2026/10/28/a-post/', 'https://example.com/portfolio/a-piece/', 'https://example.com/page/2/'],
  rootFiles: ['google123.html', 'abc.txt'],
  nonce: 'n0nce',
};
const base = 'https://example.com';
const byGroup = (g) => buildSmokeChecks(fixture).filter((c) => c.group === g);

check('one redirect check per redirects.yaml entry', () => {
  assert.deepStrictEqual(byGroup('redirects').map((c) => c.path), ['/old/', '/resume']);
  assert.strictEqual(byGroup('redirects')[0].expect.status, 301);
});
check('retired lists are checked with and without the slash', () => {
  assert.deepStrictEqual(byGroup('retired-lists').map((c) => c.path), ['/portfolio/acme/', '/portfolio/acme']);
});
check('the 404 path carries the nonce, so no cache has seen it', () => {
  assert.strictEqual(byGroup('error-page')[0].path, '/smoke-n0nce/');
});
check('root files come from the list passed in', () => {
  const paths = byGroup('root-files').map((c) => c.path);
  assert.ok(paths.includes('/google123.html') && paths.includes('/abc.txt'));
});
check('page sample takes one URL per template pattern from the sitemap', () => {
  const paths = byGroup('pages').map((c) => c.path);
  assert.ok(paths.includes('/2026/10/28/a-post/') && paths.includes('/portfolio/a-piece/') && paths.includes('/page/2/'));
});
check('a relative Location target matches an absolute Location header', () => {
  assert.strictEqual(sameLocation('https://example.com/new/', '/new/', base), true);
  assert.strictEqual(sameLocation('https://example.com/new', '/new/', base), true);
  assert.strictEqual(sameLocation('https://other.example.com/new/', '/new/', base), false);
});
check('evaluateResponse reports status, location, header, and body failures', () => {
  const c = { group: 'x', path: '/a', expect: { status: 301, location: '/b/', headers: { 'x-frame-options': 'SAMEORIGIN' }, includes: ['needle'] } };
  assert.deepStrictEqual(evaluateResponse(c, { status: 301, headers: { location: 'https://example.com/b/', 'x-frame-options': 'sameorigin' }, body: 'a needle' }, base), []);
  assert.strictEqual(evaluateResponse(c, { status: 200, headers: {}, body: '' }, base).length, 4);
});
check('notStatus fails only on that status', () => {
  const c = { group: 'blocked', path: '/.env', expect: { notStatus: 200 } };
  assert.deepStrictEqual(evaluateResponse(c, { status: 403, headers: {}, body: '' }, base), []);
  assert.strictEqual(evaluateResponse(c, { status: 200, headers: {}, body: '' }, base).length, 1);
});
```

Register it: `{ id: 'live-smoke', script: 'live-smoke.js', groups: ['unit'], name: 'Live smoke checks', description: 'Live smoke check list and response evaluation', emoji: '🩺' }`.

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm run test live-smoke`
Expected: fails with `Cannot find module '../utils/live-smoke'`.

- [ ] **Step 3: Implement `scripts/utils/live-smoke.js`**

Three exports with the signatures above, following the group table. No I/O in this file.

- [ ] **Step 4: Run the test**

Run: `pnpm run test live-smoke`
Expected: passes, eight checks.

- [ ] **Step 5: Implement `scripts/deploy/smoke-live.js` and the `smoke` script**

Load `.env` the way `src/_data/site.js` does (`loadDotenvSilently`). Gather inputs, call `buildSmokeChecks`, fetch each check in order, pass the status, lower-cased headers, and body text to `evaluateResponse`. Print one line per group (`✅ redirects: 83/83`), every failure in full with its URL, and a closing tally of `cf-cache-status` values so a stale edge is visible. A network error is a failure for that check, not a crash.

- [ ] **Step 6: Run it against the live site, before anything is deployed**

Run: `pnpm run build && pnpm run smoke | tee .cache/cleanup-baseline/smoke-before.txt`
Expected: every group passes. The live site is the last deploy, untouched by this plan, so any failure here is either a problem that already exists or a wrong expectation in the script. Stop and go through each one with Jon; don't loosen a check to make it pass without his say.

- [ ] **Step 7: Prove it can fail**

Run: `pnpm run smoke -- --base-url https://example.com`
Expected: exit code 1, with failures in every group.

- [ ] **Step 8: Docs and commit**

`docs/commands.md`: add `pnpm run smoke` under Deployment, with what it checks, that it is read-only, and when to run it (after a deploy that touched `.htaccess`, redirects, passthrough rules, or the build). `docs/tests.md`: a `live-smoke.js` entry under Unit Tests.

Run: `pnpm run test unit && pnpm run test docs-links && pnpm run build && diff -rq -x img .cache/cleanup-baseline/site _site`
Expected: pass, pass, no diff.

Proposed title: `Add a read-only smoke check for the live site`

---

### Task 5: Checkpoint – full local test, deploy, live smoke

No files change. Tasks 1–4 are committed.

- [ ] **Step 1: Full local run**

Run: `pnpm run test unit && pnpm run test all`
Expected: both pass. `test all` includes `a11y` and takes several minutes.

- [ ] **Step 2: Rehearse the deploy**

Run: `pnpm run deploy --dry-run`
Expected: the Cloudflare purge preview is the list of built files whose content differs from the last deploy. It should hold at most `/` (tagline salt) and `/changelog/`. `.htaccess` must not appear, and no shortlink purge should be listed. Anything else in the list is a change this plan didn't intend: stop and show Jon.

- [ ] **Step 3: Deploy**

Ask Jon to run `pnpm run deploy`, or to approve running it. The deploy pushes to the remote.

- [ ] **Step 4: Live smoke**

Run: `pnpm run smoke | tee .cache/cleanup-baseline/smoke-after.txt && diff .cache/cleanup-baseline/smoke-before.txt .cache/cleanup-baseline/smoke-after.txt`
Expected: every group passes. The diff shows only the nonce and the cache tally.

- [ ] **Step 5: Look at it**

Open `/`, one post, `/portfolio/`, `/color/`, and a made-up URL in a browser. Jon confirms.

This is a good place to stop. Tasks 6 and 7 change only how unit tests run.

---

### Task 6: Unit tests on `node:test` – runner support and the `check()` files

**Files:**
- Modify: `scripts/test-manifest.js`, `scripts/test-runner.js`
- Modify (12 tests): `scripts/test/figure-lightbox.js`, `404-suggest.js`, `site-branding.js`, `preview-site-lockup.js`, `og-image-filename.js`, `og-card.js`, `date-utils.js`, `og-shared-fingerprint.js`, `og-card-digest.js`, `changelog-format.js`, `live-smoke.js`, `test-json-pipe.js`

**Interfaces:**
- Manifest: optional flag `nodeTest: true`. New export `getNodeTestIds(): string[]`.
- Runner: `runNodeTests(ids: string[]): Promise<number>` spawns `process.execPath` with `['--test', '--test-concurrency=1', '--test-reporter=spec', ...scriptPaths]`, `stdio: 'inherit'`, and resolves the exit code.
- `pnpm run test <id>` for a `nodeTest` id calls `runNodeTests([id])`. `pnpm run test unit` runs the `nodeTest` ids in one `node --test` call, then the remaining unit ids through the existing loop, and exits 1 if either failed.

- [ ] **Step 1: Write the failing manifest checks**

In `validateManifest()`: a `nodeTest` entry must be in the `unit` group; its source must contain `require('node:test')`; its source must not contain `test-runner-helper`. Then set `nodeTest: true` on `date-utils` only.

Run: `pnpm run test`
Expected: throws `[test-manifest] 'date-utils' is marked nodeTest but does not require node:test`.

- [ ] **Step 2: Convert `date-utils.js`**

`const { test } = require('node:test');`. Each `check('name', fn)` becomes `test('name', fn)`. Delete the `runUnitAssertions` wrapper, the `test-results` and `test-runner-helper` imports, and the `runTest({...})` call. Keep the file's header comment and every assertion as written.

- [ ] **Step 3: Add `runNodeTests` and the two call sites in `test-runner.js`**

Per the Interfaces block. `--test-concurrency=1` keeps today's one-file-at-a-time order.

- [ ] **Step 4: Verify the canary, including a failure**

Run: `pnpm run test date-utils`
Expected: spec output, `tests 4`, `fail 0`, exit 0.

Then make `formatPostDate` in `eleventy/utils/date-utils.js` return `''` on its first line and run `pnpm run test unit; echo "exit $?"`.
Expected: `date-utils` tests fail and the line reads `exit 1`. Undo the edit; `git diff --stat eleventy/` prints nothing.

- [ ] **Step 5: Convert the other eleven files and flag them**

Same recipe. Setup and teardown that sit around the checks (the Puppeteer browser in `og-card.js`, temp directories in `og-shared-fingerprint.js` and `og-card-digest.js`) move into `before` and `after` from `node:test`. `test-json-pipe.js` has no `check()` calls: its five assertions become one `test('large JSON survives a piped stdout', …)`.

- [ ] **Step 6: Verify nothing was lost**

Run: `pnpm run test unit`
Expected: `fail 0`, and for each converted file the number of tests equals its line in `.cache/cleanup-baseline/check-counts.txt` (`live-smoke`: 8, `test-json-pipe`: 1). The six unconverted unit tests still run and pass through the old loop.

Run: `pnpm run build && diff -rq -x img .cache/cleanup-baseline/site _site`
Expected: no output.

- [ ] **Step 7: Commit**

Proposed title: `Run assert-style unit tests with node:test`

---

### Task 7: Unit tests on `node:test` – the six hand conversions

**Files:**
- Modify: `scripts/test/portfolio-notes.js`, `source-file-utils.js`, `indexnow.js`, `manifest-cursors.js`, `deploy-guards.js`, `cloudflare-purge.js`
- Modify: `scripts/test-manifest.js`, `scripts/test-runner.js`
- Modify: `docs/tests.md`, `docs/commands.md`, `docs/agent-memory.md`, `.agents/rules/testing.mdc` (only if it describes how unit tests are written)

These files test with `if (wrong) addIssue({ message })`, 57 call sites in all, so each needs reading. Convert one file at a time, smallest first, in the order listed.

- [ ] **Step 1: Convert one file**

Each `if (wrong) addIssue({ … message … })` becomes `assert.ok(!wrong, message)`, or `assert.strictEqual` / `assert.deepStrictEqual` where the code compares two values. Keep the message text. Group the assertions into `test('…', …)` blocks along the file's existing comment sections, one block per behavior. The file's own helpers (`assertEqual`, `assertNotesEqual`, `assertUrlsEqual`, `fail`) become thin wrappers over `assert` or go away. Flag the file `nodeTest: true`.

One behavior changes and is accepted: today every condition in a file is evaluated even after one fails; under `node:test` a failed assertion ends its own `test` block, and the other blocks still run.

`portfolio-notes.js` loses its `--changed` support (the `shouldSkipFn` and `checkChangedFlag` use). The test takes well under a second, so the skip buys nothing. Update the manifest comment above its entry.

- [ ] **Step 2: Prove the converted file still catches a break**

Make the named function return early with the given value, run `pnpm run test <id>`, see at least one failure, undo the edit, and confirm `git diff --stat scripts/utils/` shows no source file.

| test | file | function | early return |
|---|---|---|---|
| `portfolio-notes` | `scripts/utils/portfolio-notes.js` | `parseNotesContent` | `[]` |
| `source-file-utils` | `scripts/utils/source-file-utils.js` | `findSourceFile` | `null` |
| `indexnow` | `scripts/utils/indexnow.js` | `isIndexableHtmlPath` | `true` |
| `manifest-cursors` | `scripts/utils/cloudflare-purge.js` | `saveContentManifest` | `undefined` (write nothing) |
| `deploy-guards` | `scripts/utils/clean-site.js` | `cleanSiteExceptImages` | `undefined` (delete nothing) |
| `cloudflare-purge` | `scripts/utils/cloudflare-purge.js` | `diffContentManifests` | `{ changed: [], added: [], deleted: [] }` |

- [ ] **Step 3: Repeat steps 1 and 2 for each remaining file**

- [ ] **Step 4: Remove the mixed mode**

Every unit test is now `nodeTest`. In `test-runner.js`, the `unit` branch becomes the single `runNodeTests` call. In `validateManifest()`, require `nodeTest` on every `unit` entry, so a new unit test can't be written the old way.

- [ ] **Step 5: Verify**

Run: `pnpm run test unit && pnpm run test fast && pnpm run test changed`
Expected: all pass. `test fast` and `test changed` look exactly as they did in `.cache/cleanup-baseline/test-fast.txt`, apart from the labels added in Task 3.

Run: `pnpm run build && diff -rq -x img .cache/cleanup-baseline/site _site`
Expected: no output.

- [ ] **Step 6: Docs and commit**

`docs/tests.md`: the Unit Tests intro and Test Architecture ("All tests (except `deploy.js`) use a unified JSON output format") now describe two kinds: site checks on the JSON runner, unit tests on `node:test`. Drop the `--changed` sentence from the `portfolio-notes.js` entry. `docs/commands.md`: the `test unit` line. `docs/agent-memory.md`: one entry under Gotchas saying how to add a unit test now and that `--test-concurrency=1` is deliberate.

Proposed title: `Move the remaining unit tests to node:test`

No deploy is needed for Tasks 6 and 7: `_site/` is identical, so the next ordinary deploy carries nothing from them.

---

## What this plan leaves alone

- Each site-check script still passes its own `testName` to `runTest`, a third copy of the display name. `formatVerbose` reads it for direct runs. Removing it touches every site-check script and is its own change.
- `test-runner.js` keeps its JSON marker handling and spinner for the site checks.
- Items 5–11 of the blast-radius list (date filter rename, permalink trim, color gallery, renames, feed dates, page map, pagination in collections).
