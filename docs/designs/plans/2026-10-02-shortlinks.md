# Permanent short links Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship permanent two-character short links at `HTTPS://JONPLUMMER.COM/XX` via generated Apache `RewriteRule` 302s, with YAML source of truth, CLI lookup/add/QR, build validation, Cloudflare purge of short URLs when rules change, and a post-deploy live smoke check.

**Architecture:** `src/_data/shortlinks.yaml` feeds `src/.htaccess.njk` (RewriteRules at the top of the existing `mod_rewrite` block). Shared logic in `scripts/utils/shortlinks.js`. Build-time test validates data + emitted rules. Deploy purge detects `.htaccess` content-hash change and adds shortlink apex URLs to the Cloudflare purge batch. Deploy then smoke-checks live 302s.

**Tech Stack:** Eleventy/Nunjucks, Apache mod_rewrite, js-yaml, Cloudflare Cache Purge API, `qrcode` (SVG/PNG, alphanumeric when payload is uppercase).

## Global Constraints

- Slug: exactly 2 chars from `A–Z` / `2–9` minus `O` / `I` (alphabet `[A-HJ-NP-Z2-9]`); schema allows longer later
- Redirects: `R=302`, optional trailing slash (`^SLUG/?$`), `[NC,L]`
- Destinations: absolute `https://` only; retired → site home; never reuse/delete slugs
- Unlisted: no public index page, not in sitemap
- QR payload: full uppercase URL (`HTTPS://JONPLUMMER.COM/XX`)
- Live network checks: deploy only (not `test fast`)

## Decisions locked

1. Trailing slash: match `^SLUG/?$` (same destination)
2. CF purge: when `.htaccess` hash changes, purge all shortlink URL variants (upper/lower, with/without slash)
3. RewriteRule only (not mod_alias `Redirect`); first in rewrite block
4. Offline test = YAML + `_site/.htaccess` rules; live smoke = post-deploy after purge
5. Length-flexible schema; validate length 2 for now
6. QR = full uppercase HTTPS URL

## File map

| File | Role |
|------|------|
| `src/_data/shortlinks.yaml` | Source of truth (+ canary `JP` → home) |
| `scripts/utils/shortlinks.js` | Load, validate, lookup, htaccess lines, purge URLs |
| `scripts/test/shortlinks.js` | Fast/pre (+ post asserts built `.htaccess`) |
| `src/.htaccess.njk` | Emit shortlink RewriteRules before wisdom |
| `scripts/content/shortlink.js` | CLI: add / get / find / qr |
| `scripts/utils/cloudflare-purge.js` | Merge shortlink URLs when `.htaccess` changed |
| `scripts/deploy/deploy.js` | Live smoke after purge |
| `package.json` | `shortlink` script + `qrcode` dep |
| `docs/authoring.md`, `docs/commands.md`, `docs/tests.md`, `docs/ideas.md` | Docs |

---

### Task 1: Data + util + offline test

**Files:** create `src/_data/shortlinks.yaml`, `scripts/utils/shortlinks.js`, `scripts/test/shortlinks.js`; modify `scripts/test-manifest.js`

- [x] Canary entry `JP` → `https://jonplummer.com/`, note "Deploy smoke canary", created today
- [x] Util: `SLUG_PATTERN`, `loadShortlinks`, `validateShortlinks` (fail: bad slug, dup, non-https, retired≠home, permalink collision with `/XX`; warn: duplicate destinations), `lookupBySlug`, `lookupByDestination`, `htaccessRewriteLines`, `shortlinkPurgeUrls`
- [x] Test in `fast` + `pre` (+ `post` check of `_site/.htaccess` when present)
- [x] Verify: `pnpm run test shortlinks`

### Task 2: `.htaccess` generation

**Files:** modify `src/.htaccess.njk`

- [x] Before wisdom rules, loop shortlinks → `RewriteRule ^{{ slug }}/?$ {{ to }} [R=302,NC,L]`
- [x] Rebuild; confirm canary rule in `_site/.htaccess` before wisdom block
- [x] Verify: `pnpm run build` + `pnpm run test shortlinks`

### Task 3: CLI + QR

**Files:** create `scripts/content/shortlink.js`; modify `package.json`

- [x] `pnpm add -D qrcode`
- [x] Commands: `get <slug>`, `find <url>`, `add <url> [--slug XX] [--note …]` (reverse-check first; auto-pick unused slug), `qr <slug> [--out dir]` → SVG + PNG, alphanumeric uppercase payload
- [x] Verify: add/get/find against canary; `qr JP`

### Task 4: Cloudflare shortlink purge

**Files:** modify `scripts/utils/cloudflare-purge.js`, `scripts/test/cloudflare-purge.js`

- [x] If `.htaccess` in manifest `changed`/`added` (or force), append `shortlinkPurgeUrls(siteDomain)`
- [x] Unit test: `.htaccess` hash change → purge URLs include `https://jonplummer.com/JP` (and case/slash variants); content-only change without htaccess → no shortlink URLs
- [x] Verify: `pnpm run test cloudflare-purge`

### Task 5: Post-deploy live smoke

**Files:** modify `scripts/deploy/deploy.js`

- [x] After CF purge (and on dry-run as would-check print), GET each active shortlink (no follow): expect 302 + Location matching `to` (normalize trailing slash)
- [x] One lowercase probe on canary
- [x] Failure fails deploy
- [x] Dry-run prints would-check; real deploy requires network

### Task 6: Docs + ideas

- [x] `docs/authoring.md` — Short links section
- [x] `docs/commands.md` — `pnpm run shortlink`; note CF shortlink purge
- [x] `docs/tests.md` — shortlinks test
- [x] `docs/ideas.md` — move Selected bullet toward Done when shipped
- [x] `docs/agent-memory.md` — shortlinks gotcha (htaccess change → purge short URLs; live smoke in deploy only)

### Done when

- [x] `pnpm run test shortlinks` + `pnpm run test cloudflare-purge` pass (plus related guards)
- [x] Built `.htaccess` has shortlink block before wisdom
- [x] CLI get/qr works locally
- [x] Deploy path documented; live smoke wired
