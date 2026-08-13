# Content-hash Cloudflare purge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Purge Cloudflare only for `_site` paths whose content hash changed since the last successful deploy baseline, without changing rsync behavior.

**Architecture:** Keep rsync `-az --itemize-changes` for uploads/logging. After rsync, walk `_site` locally, SHA-256 files, diff against `.cache/deploy-content-manifest.json`, map changed/added/deleted paths to apex URLs, call existing `purgeCloudflareUrls`. Update the manifest per the failure table in the design spec. Do not use rsync itemize as the purge URL source.

**Tech Stack:** Node.js CommonJS (`fs`, `path`, `crypto`), existing `scripts/utils/cloudflare-purge.js` + `scripts/deploy/deploy.js`, `pnpm run test cloudflare-purge`.

**Spec:** `docs/designs/specs/2026-08-06-content-hash-cloudflare-purge-design.md`

## Global Constraints

- Purge-only this iteration — do **not** change rsync flags to `--checksum` or filter rsync file lists.
- Manifest path: `.cache/deploy-content-manifest.json` (`.cache/` already gitignored).
- Apex URLs via `SITE_DOMAIN` / default `jonplummer.com` (never `www` as purge host).
- Skip purging `.htaccess` (and any other non-public deploy artifact we already know about).
- No baseline → skip purge, write manifest after successful rsync; `CLOUDFLARE_PURGE_FORCE_CONTENT=1` forces full content purge.
- `CLOUDFLARE_PURGE=0` / not configured → skip purge, **do not** write manifest.
- Purge API failure → deploy still succeeds; **do not** write manifest.
- Dry-run → list URLs only; no API; no manifest write.

## Later (not this plan)

- Revisit **rsync transfer volume** using this same local content-hash manifest (skip uploading byte-identical files despite new mtimes). Tracked in `docs/ideas.md` → Future → Deploy / Cloudflare. Do not implement here.

## File map

| File | Role |
|------|------|
| `scripts/utils/cloudflare-purge.js` | Hash walk, load/save manifest, content diff, purge orchestration (replace rsync-itemize purge source) |
| `scripts/deploy/deploy.js` | Call content-hash purge after rsync; update log copy; pass `siteRoot` / dry-run / env |
| `scripts/test/cloudflare-purge.js` | Unit tests for hash diff, skip list, URL mapping, baseline rules |
| `docs/commands.md` | Document manifest + force flag |
| `docs/ideas.md` | Future rsync note (already added) |
| `.cursor/rules/memory.mdc` | One-line deploy gotcha if useful |

Keep `parseRsyncItemizedChanges` exported for now (tests / possible logging); stop calling it from the purge path.

---

### Task 1: Content-hash helpers + unit tests

**Files:**
- Modify: `scripts/utils/cloudflare-purge.js`
- Modify: `scripts/test/cloudflare-purge.js`

**Interfaces:**
- Produces:
  - `MANIFEST_PATH` or `defaultManifestPath()` → `.cache/deploy-content-manifest.json` relative to cwd
  - `hashFile(absPath) → string` (sha256 hex)
  - `buildContentManifest(siteRoot) → { version: 1, generatedAt: string, files: Record<string, string> }`
  - `loadContentManifest(manifestPath) → manifest | null`
  - `saveContentManifest(manifestPath, manifest) → void` (mkdir `.cache` as needed)
  - `diffContentManifests(previous, current) → { changed: string[], added: string[], deleted: string[] }` (paths relative to `_site`)
  - `shouldPurgeDeployPath(relativePath) → boolean` (false for `.htaccess`)
  - `pathsToPurgeUrls(paths, siteDomain) → string[]` (filter + `deployPathToUrl`)

- [ ] **Step 1: Extend the unit test** with failing expectations for helpers that do not exist yet

In `scripts/test/cloudflare-purge.js`, keep existing `deployPathToUrl` / parse checks. Add (using `fs` + `os` + `path` + a temp dir):

```javascript
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  // existing exports…
  buildContentManifest,
  diffContentManifests,
  shouldPurgeDeployPath,
  pathsToPurgeUrls,
} = require('../utils/cloudflare-purge');

// inside validateFn, after existing checks:
if (shouldPurgeDeployPath('.htaccess') !== false) {
  addIssue(fileObj, {
    severity: 'error',
    type: 'cloudflare-purge-skip',
    message: 'expected shouldPurgeDeployPath(".htaccess") === false',
  });
}
if (shouldPurgeDeployPath('assets/css/jonplummer.css') !== true) {
  addIssue(fileObj, {
    severity: 'error',
    type: 'cloudflare-purge-skip',
    message: 'expected CSS path to be purgeable',
  });
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-purge-'));
const siteA = path.join(tmp, 'site');
fs.mkdirSync(path.join(siteA, 'assets/css'), { recursive: true });
fs.writeFileSync(path.join(siteA, 'index.html'), '<html>a</html>\n');
fs.writeFileSync(path.join(siteA, 'assets/css/jonplummer.css'), 'body{a:1}\n');
fs.writeFileSync(path.join(siteA, '.htaccess'), 'Deny\n');

const manA = buildContentManifest(siteA);
if (!manA.files['index.html'] || !manA.files['assets/css/jonplummer.css']) {
  addIssue(fileObj, {
    severity: 'error',
    type: 'cloudflare-purge-manifest',
    message: `manifest missing expected keys: ${Object.keys(manA.files).join(', ')}`,
  });
}

fs.writeFileSync(path.join(siteA, 'index.html'), '<html>b</html>\n');
fs.writeFileSync(path.join(siteA, 'about/index.html'), 'about\n'); // need mkdir
// create about after mkdir:
fs.mkdirSync(path.join(siteA, 'about'), { recursive: true });
fs.writeFileSync(path.join(siteA, 'about/index.html'), 'about\n');
fs.unlinkSync(path.join(siteA, 'assets/css/jonplummer.css'));

const manB = buildContentManifest(siteA);
const diff = diffContentManifests(manA, manB);
const changedOk = diff.changed.includes('index.html');
const addedOk = diff.added.includes('about/index.html');
const deletedOk = diff.deleted.includes('assets/css/jonplummer.css');
if (!changedOk || !addedOk || !deletedOk) {
  addIssue(fileObj, {
    severity: 'error',
    type: 'cloudflare-purge-diff',
    message: `unexpected diff: ${JSON.stringify(diff)}`,
  });
}

const urls = pathsToPurgeUrls(
  ['.htaccess', 'assets/css/jonplummer.css', 'about/index.html'],
  'jonplummer.com'
);
if (urls.some((u) => u.includes('.htaccess'))) {
  addIssue(fileObj, {
    severity: 'error',
    type: 'cloudflare-purge-url-filter',
    message: `htaccess must not appear in purge URLs: ${urls.join(', ')}`,
  });
}
if (!urls.includes('https://jonplummer.com/about/')) {
  addIssue(fileObj, {
    severity: 'error',
    type: 'cloudflare-purge-url-filter',
    message: `missing about URL in ${urls.join(', ')}`,
  });
}

// cleanup
fs.rmSync(tmp, { recursive: true, force: true });
```

Fix the test snippet when implementing so `about/` is created before write (order as shown in the mkdir block).

- [ ] **Step 2: Run test — expect fail**

Run: `pnpm run test cloudflare-purge`  
Expected: FAIL (missing exports / undefined functions)

- [ ] **Step 3: Implement helpers in `scripts/utils/cloudflare-purge.js`**

Use `crypto.createHash('sha256')`, recursive `fs.readdirSync` with `{ withFileTypes: true }`, POSIX relative paths (`path.relative` + `.replace(/\\/g, '/')`). Include every regular file under `siteRoot` in the manifest (including `.htaccess`); filtering happens only at purge-URL time via `shouldPurgeDeployPath`.

```javascript
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DEFAULT_MANIFEST_REL = path.join('.cache', 'deploy-content-manifest.json');

function defaultManifestPath(cwd = process.cwd()) {
  return path.join(cwd, DEFAULT_MANIFEST_REL);
}

function hashFile(absPath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(absPath));
  return hash.digest('hex');
}

function walkFiles(dir, root, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(abs, root, out);
    else if (ent.isFile()) {
      const rel = path.relative(root, abs).replace(/\\/g, '/');
      out[rel] = hashFile(abs);
    }
  }
}

function buildContentManifest(siteRoot) {
  const files = {};
  walkFiles(siteRoot, siteRoot, files);
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    files,
  };
}

function loadContentManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function saveContentManifest(manifestPath, manifest) {
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function diffContentManifests(previous, current) {
  const prev = (previous && previous.files) || {};
  const curr = (current && current.files) || {};
  const changed = [];
  const added = [];
  const deleted = [];
  for (const p of Object.keys(curr)) {
    if (!(p in prev)) added.push(p);
    else if (prev[p] !== curr[p]) changed.push(p);
  }
  for (const p of Object.keys(prev)) {
    if (!(p in curr)) deleted.push(p);
  }
  return { changed, added, deleted };
}

function shouldPurgeDeployPath(relativePath) {
  const clean = relativePath.replace(/\\/g, '/').replace(/^\.\//, '');
  if (clean === '.htaccess' || clean.endsWith('/.htaccess')) return false;
  return true;
}

function pathsToPurgeUrls(paths, siteDomain) {
  return paths.filter(shouldPurgeDeployPath).map((p) => deployPathToUrl(p, siteDomain));
}
```

Export the new functions from `module.exports`.

- [ ] **Step 4: Run test — expect pass**

Run: `pnpm run test cloudflare-purge`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/utils/cloudflare-purge.js scripts/test/cloudflare-purge.js
git commit -m "$(cat <<'EOF'
feat: local content-hash helpers for Cloudflare purge diffs

EOF
)"
```

---

### Task 2: Orchestrate purge from content hash (replace rsync itemize source)

**Files:**
- Modify: `scripts/utils/cloudflare-purge.js`
- Modify: `scripts/test/cloudflare-purge.js`
- Modify: `scripts/deploy/deploy.js`

**Interfaces:**
- Consumes: helpers from Task 1
- Produces: `purgeChangedDeployContent(siteRoot, siteDomain, options) → Promise<result>`
  - `options`: `{ dryRun?, zoneId?, apiToken?, manifestPath?, env?, forceContent? }`
  - Result shapes (extend as needed for logging):
    - `{ skipped: true, reason: 'not-configured' | 'no-baseline' | 'no-changes', …, writeManifest: boolean, currentManifest? }`
    - `{ dryRun: true, paths, urls, writeManifest: false, currentManifest }`
    - `{ purged, batches, paths, urls, writeManifest: true, currentManifest }` on success
    - On API throw: let caller catch (deploy already wraps); do not write manifest inside catch

Semantics from spec:

| Case | Purge API | `writeManifest` |
|------|-----------|-----------------|
| not configured / `CLOUDFLARE_PURGE=0` | no | false |
| no baseline (`load` null) and not force | no | **true** (after rsync success — caller writes) |
| force / normal diff empty | no API calls needed for empty; write true | true |
| force with all paths / normal non-empty | yes | true only if API ok |
| dry-run | no | false |

Prefer returning `writeManifest` + `currentManifest` and letting `deploy.js` call `saveContentManifest` after rsync success so “write after successful rsync” is explicit for no-baseline.

- [ ] **Step 1: Add unit tests for orchestration decisions** (pure where possible)

Test `collectPurgePaths(previous, current, { forceContent })`:
- no previous + !force → `{ mode: 'no-baseline', paths: [] }`
- no previous + force → all current keys
- previous + force → all current keys (and include deleted from previous for purge)
- previous + diff → changed∪added∪deleted

Implement `collectPurgePaths` as a named export so tests do not need the network.

- [ ] **Step 2: Run test — expect fail, then implement `collectPurgePaths` + `purgeChangedDeployContent`**

`purgeChangedDeployContent` outline:

```javascript
async function purgeChangedDeployContent(siteRoot, siteDomain, options = {}) {
  const env = options.env || process.env;
  const manifestPath = options.manifestPath || defaultManifestPath();
  const dryRun = Boolean(options.dryRun);
  const forceContent =
    Boolean(options.forceContent) ||
    env.CLOUDFLARE_PURGE_FORCE_CONTENT === '1' ||
    env.CLOUDFLARE_PURGE_FORCE_CONTENT === 'true';

  const currentManifest = buildContentManifest(siteRoot);
  const previous = loadContentManifest(manifestPath);

  if (!dryRun && !isCloudflarePurgeConfigured(env)) {
    return {
      skipped: true,
      reason: 'not-configured',
      paths: [],
      urls: [],
      purged: 0,
      batches: 0,
      writeManifest: false,
      currentManifest,
    };
  }

  const { mode, paths } = collectPurgePaths(previous, currentManifest, { forceContent });
  const urls = pathsToPurgeUrls(paths, siteDomain);

  if (mode === 'no-baseline') {
    return {
      skipped: true,
      reason: 'no-baseline',
      paths: [],
      urls: [],
      purged: 0,
      batches: 0,
      writeManifest: !dryRun,
      currentManifest,
    };
  }

  if (urls.length === 0) {
    return {
      skipped: true,
      reason: 'no-changes',
      paths: [],
      urls: [],
      purged: 0,
      batches: 0,
      writeManifest: !dryRun,
      currentManifest,
    };
  }

  if (dryRun) {
    return { dryRun: true, paths, urls, purged: 0, batches: 0, writeManifest: false, currentManifest };
  }

  const zoneId = options.zoneId || env.CLOUDFLARE_ZONE_ID;
  const apiToken = options.apiToken || env.CLOUDFLARE_API_TOKEN;
  const result = await purgeCloudflareUrls(urls, { zoneId, apiToken });
  return { ...result, paths, urls, writeManifest: true, currentManifest };
}
```

For `collectPurgePaths`: when `forceContent` and `previous` is null, paths = `Object.keys(current.files)`. When force and previous exists, paths = union of all current keys + deleted. When normal and previous null, mode `no-baseline`. Else paths = changed∪added∪deleted.

- [ ] **Step 3: Wire `deploy.js`**

Replace `purgeCloudflareAfterDeploy` body to:

```javascript
async function purgeCloudflareAfterDeploy(siteDomain, dryRun) {
  const {
    purgeChangedDeployContent,
    saveContentManifest,
    defaultManifestPath,
    isCloudflarePurgeConfigured,
  } = require('../utils/cloudflare-purge');

  // dry-run still computes would-purge even without creds (same as today’s list behavior)
  if (!dryRun && !isCloudflarePurgeConfigured()) {
    logCloudflarePurgeResult({ skipped: true, reason: 'not-configured' }, { dryRun: false });
    return;
  }

  try {
    const purgeResult = await purgeChangedDeployContent('./_site', siteDomain, { dryRun });
    logCloudflarePurgeResult(purgeResult, { dryRun });
    if (purgeResult.writeManifest && purgeResult.currentManifest) {
      saveContentManifest(defaultManifestPath(), purgeResult.currentManifest);
    }
  } catch (error) {
    console.log('⚠️  ☁️  Cloudflare purge: failed (deployment succeeded)');
    console.warn(`   ${error.message}\n`);
    // do not write manifest
  }
}
```

Update `logCloudflarePurgeResult`:
- `no-baseline` → loud info that baseline is being established and nothing was purged
- `no-changes` message → “nothing to purge (content unchanged)” (not “rsync transferred no files”)
- Success / dry-run prefix can say “from content hash” once

Update the call site that currently passes `rsyncOutput` to stop passing it.

- [ ] **Step 4: Run tests**

Run: `pnpm run test cloudflare-purge`  
Run: `pnpm run test deploy-guards`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/utils/cloudflare-purge.js scripts/test/cloudflare-purge.js scripts/deploy/deploy.js
git commit -m "$(cat <<'EOF'
feat: purge Cloudflare from local _site content hashes

EOF
)"
```

---

### Task 3: Docs + memory

**Files:**
- Modify: `docs/commands.md` (Cloudflare cache purge section)
- Modify: `docs/designs/specs/2026-08-06-content-hash-cloudflare-purge-design.md` (status already approved)
- Modify: `.cursor/rules/memory.mdc` (short deploy note)
- Verify: `docs/ideas.md` Future deploy bullet present

- [ ] **Step 1: Update `docs/commands.md`**

Replace the “changed URLs from rsync itemize” wording with content-hash manifest behavior: path `.cache/deploy-content-manifest.json`, no-baseline establish, `CLOUDFLARE_PURGE_FORCE_CONTENT=1`, note that rsync transfer list is independent. Keep existing env var docs for zone/token/`CLOUDFLARE_PURGE=0`.

- [ ] **Step 2: Memory one-liner** under deploy/CF: content-hash purge; apex host; first deploy after feature writes baseline without purging.

- [ ] **Step 3: Commit**

```bash
git add docs/commands.md docs/ideas.md docs/designs/specs/2026-08-06-content-hash-cloudflare-purge-design.md .cursor/rules/memory.mdc docs/designs/plans/2026-08-06-content-hash-cloudflare-purge.md
git commit -m "$(cat <<'EOF'
docs: content-hash Cloudflare purge behavior and later rsync note

EOF
)"
```

---

## Spec coverage checklist

- [x] Local manifest + SHA-256 walk — Task 1
- [x] Diff changed/added/deleted — Task 1
- [x] Skip `.htaccess` — Task 1
- [x] Replace rsync itemize as purge source — Task 2
- [x] No-baseline / force / disabled / dry-run / writeManifest rules — Task 2
- [x] deploy.js wiring + log copy — Task 2
- [x] Docs — Task 3
- [x] Later rsync reuse noted — plan “Later” + `docs/ideas.md`
