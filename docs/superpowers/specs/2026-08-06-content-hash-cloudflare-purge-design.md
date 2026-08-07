# Content-hash Cloudflare purge — design

Date: 2026-08-06  
Status: approved

## Goal

Purge Cloudflare **only for URLs whose built `_site` content actually changed**, so free-tier cache-purge usage stays light. Do not rely on agents, editors, or humans to log what changed.

## Non-goals

- Changing rsync transfer behavior (keep `-az`; mtime-bumped identical HTML may still upload).
- Remote/server-side checksums (`rsync --checksum`).
- Git-diff → URL mapping (misses or over-purges when layouts/globals change).
- Limiting rsync payload in this iteration (**follow-up**: reuse this same local content-hash manifest later to shrink rsync transfers if volume still hurts — see implementation plan “Later” and `docs/ideas.md`).

## Problem

Eleventy rewrites most HTML each build (new mtimes). rsync `-az` then reports hundreds of file transfers. Deploy currently purges **every path rsync itemizes**, so a no-op content deploy can still hit Cloudflare with ~287 URL purges. Long-cache assets (CSS/JS/images, ~1 month via `.htaccess`) are what actually need reliable purge; bulk HTML purge is noisy and spends free-tier quota.

## Approach

**Local content-hash manifest** as the purge source of truth. Rsync stays as today.

### Flow

1. Build → `_site/` (unchanged).
2. Rsync to origin (unchanged flags, including `--itemize-changes` for human/deploy logs if useful).
3. **Compute purge set from local hashes** (not from rsync itemize):
   - Load previous manifest from `.cache/deploy-content-manifest.json` (already covered by `.gitignore` `.cache/`).
   - Walk `_site`, SHA-256 each file (local only; full tree measured ~2.5s / ~566 MB on this machine).
   - Changed = hash differs; added = new path; deleted = in old manifest, missing from `_site`.
   - **Purge set (normal mode):** `changed` ∪ `deleted` only. Skip **`added`** — a brand-new URL was never at the edge (content-addressed `_site/img/…`, new posts). Same-path regenerations (e.g. OG PNGs) are `changed` and still purge. Force mode still includes all current keys (+ deleted).
   - Map purge paths → public URLs via existing `deployPathToUrl` (apex `SITE_DOMAIN` / `jonplummer.com`).
   - Skip non-public deploy artifacts that should not be purge URLs (at least `.htaccess`).
4. Call existing batched Cloudflare `purge_cache` API (unless skipped — see failure table).
5. Write the new manifest only when appropriate:
   - After a **successful** purge, or
   - After **no-baseline** skip (establish baseline without purging), or
   - When the content diff is empty (nothing to purge; still refresh baseline metadata).
   - **Do not** write if purge was attempted and failed, or if purge is disabled / not configured (preserve pending diffs for the next run).

Dry-run: compute and print the would-purge list; do not call the API; do not write the manifest.

### Manifest shape

```json
{
  "version": 1,
  "generatedAt": "ISO-8601",
  "files": {
    "index.html": "<sha256 hex>",
    "assets/css/jonplummer.css": "<sha256 hex>"
  }
}
```

Relative paths use `_site/`-relative POSIX paths (same style as rsync itemize paths today).

### No baseline

If the manifest file is missing (first run after this lands, or `.cache/` cleared):

1. **Do not** purge the entire site from hashes (would be worse for free tier).
2. Skip Cloudflare purge; print a loud note: no baseline; establishing manifest; nothing purged this run.
3. **Write the manifest** after rsync succeeds so the *next* deploy can diff. Operators who need an immediate edge refresh use a manual CF purge or the optional force flag once.

Optional escape hatch: `CLOUDFLARE_PURGE_FORCE_CONTENT=1` — treat all current `_site` files as changed for this run (full content purge). Default off. Document in `docs/commands.md`.

### Interaction with existing config

- Still require `CLOUDFLARE_ZONE_ID` + `CLOUDFLARE_API_TOKEN` in `.env` (gitignored).
- `CLOUDFLARE_PURGE=0` / `false` still disables purge entirely and must **not** update the manifest (so enabling later still sees a real pending diff).
- Stop using rsync itemize output as the purge URL list. Itemize may remain for rsync logging only.

### Failure modes

| Case | Behavior |
|------|----------|
| Purge API error | Log warning; deploy still succeeded; **do not** write manifest |
| Purge disabled / not configured | Skip; **do not** write manifest |
| No baseline | Skip purge; **write** manifest after successful rsync |
| Empty content diff | Nothing to purge; **write** manifest (refresh baseline) |
| Dry-run | List would-purge URLs; no API; no manifest write |

## Implementation sketch

- Extend or companion `scripts/utils/cloudflare-purge.js`: build/load/save manifest; `diffDeployContent(siteRoot, previousManifest)` → paths; filter skip list; wire `purgeChangedDeployFiles` (or replace callers) to use hash diff instead of `parseRsyncItemizedChanges` for the purge list.
- `scripts/deploy/deploy.js`: after rsync, call hash-based purge; pass dry-run; update logging (“N URL(s) from content hash”).
- Tests: `scripts/test/cloudflare-purge.js` — diff added/changed/deleted; no-baseline; URL skip for `.htaccess`; keep existing `deployPathToUrl` checks.
- Docs: `docs/commands.md` Cloudflare section; brief memory note if useful.

## Success criteria

- A deploy that only rewrites HTML mtimes / identical bytes purges **0** (or near-zero) Cloudflare URLs once a baseline exists.
- A real CSS (or other content) change purges that asset URL (and any other changed outputs).
- No remote checksums; no dependence on chat/agent change logs.
- Free-tier purge volume drops from “~all HTML every deploy” to “content diffs only.”
