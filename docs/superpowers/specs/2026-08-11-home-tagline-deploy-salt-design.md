# Home lockup tagline: deploy salt + pool expand

**Date:** 2026-08-11

## Problem

Lockup taglines are picked with a deterministic hash of `page.url`. That gives browse variety across URLs, but `/` always gets the same line for a given pool size. Returning visitors who mostly land on home never see rotation. With the current pool of six, `/` and `/about/` also land on the same index (modulo collision), which reinforces the static feel on the two most-visited entry points.

Salting every URL with a deploy/commit value would reshape the lockup on nearly every HTML page each ship, inflating content-hash Cloudflare purges for little benefit.

## Goals

- Home (`/`) lockup tagline can change when the deploy commit changes.
- Other URLs keep URL-only picks (no sitewide HTML churn from salt alone).
- Expand the rotation pool with two new lines that match existing voice.
- Keep canonical `site.tagline` / `site.title` for `<title>`, OG, feeds, schema.

## Non-goals

- Client-side or session-based rotation.
- Salting `/about/` or any path other than `/`.
- Changing OG / feed / document-title copy.
- Forcing rotation on redeploy of the same `HEAD` (same commit → same home line).
- Split browse/home pools or sticky front-matter taglines (rejected as needless complexity).

## Behavior

### Pool (`src/_data/site.js`)

Keep the existing six; append:

- `Care shows up in the product`
- `Evidence over ego`

Canonical `tagline` remains `Making ideas tangible` and must stay in the pool.

**One pool for all URLs.** Growing the pool changes `% length` for every page, so that deploy intentionally reshuffles lockups sitewide once. That is accepted: pool growth is rare; ongoing deploy-to-deploy churn stays home-only via salt. Do not add split-pool or “sticky at creation” machinery unless that one-time cost becomes a real problem.

### Pick rule (`eleventy/utils/tagline-for-url.js`)

Same 32-bit string hash as today (`hash * 31 + charCode`, then `Math.abs(hash) % pool.length`).

- Normalize empty/null URL to `/`.
- Hash key:
  - For `/` only: `` `${salt}:${url}` `` when `salt` is a non-empty string; otherwise `url` (today’s behavior).
  - For every other URL: `url` only — **ignore salt**.
- Optional `salt` argument so tests can pass an explicit value without calling git.

### Salt source

- At filter registration / build setup: resolve `git rev-parse HEAD` once (trimmed SHA).
- If git is unavailable or the command fails: treat salt as `''` (home falls back to URL-only).
- Wire into `taglineForPage` in `eleventy/config/filters.js` so templates stay `page.url | taglineForPage`.

## Consequences

- A new commit that ships can change **only** the home lockup line from salt (plus any pages whose content actually changed). Content-hash purge blast from salt alone stays ~one URL.
- Shipping a **longer or reordered pool** reshuffles lockups on (potentially) every page for that one deploy — expected and OK.
- Local `pnpm run build` / `--watch` on the same `HEAD` keep a stable home tagline.
- Expanding the pool past six usually splits `/` vs `/about/` even when home is unsalted; salted home further decouples them across deploys.

## Testing

Extend `pnpm run test site-branding` (or the unit covering `pickTaglineForUrl`):

- Same non-home URL + different salts → same tagline.
- Home `/` + different salts → may differ (assert at least one pair of salts yields different picks, or assert key construction / index math with a fixed pool).
- Same home URL + same salt → stable.
- Pool includes both new strings and the canonical tagline.
- Lockup in `base.njk` still uses `taglineForPage`, not `site.tagline`.

## Out of scope follow-ups

- More pool lines later (expect one-time full lockup reshuffle when length/order changes).
- Optional `TAGLINE_SALT` env override for forced reshuffle without a new commit.
- Split browse vs home pools / front-matter sticky taglines (only if purge cost from pool growth becomes painful).
