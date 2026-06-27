# Cloudflare Pages Experiment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy this Eleventy site to Cloudflare Pages as a parallel experiment to compare it against the current Dreamhost rsync deployment — without disrupting the existing live site.

**Architecture:** Build the site locally with the existing `pnpm run build` command, then upload `_site/` to Cloudflare Pages via Wrangler CLI. Add CF-native equivalents of the Apache `.htaccess` features (security headers via `_headers`, redirects via `_redirects`) so the comparison is apples-to-apples. The Dreamhost deployment stays unchanged as the live site throughout.

**Tech Stack:** Wrangler CLI, Cloudflare Pages, Eleventy (existing), pnpm

---

## Context

The current site deploys via rsync to Dreamhost shared hosting. Apache `.htaccess` handles security headers, 301 redirects, compression, and caching. Cloudflare Pages is a CDN-native static host that handles compression and caching automatically — but uses its own `_headers` and `_redirects` files instead of `.htaccess`. This plan gets the site onto CF Pages so you can evaluate performance, DX, and feature parity before deciding whether to migrate.

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/_headers` | Security headers for Cloudflare Pages (replaces mod_headers in .htaccess) |
| Create | `src/_redirects.njk` | Eleventy template generating CF Pages redirects from `redirects.yaml` |
| Modify | `eleventy/config/passthrough.js` | Add passthrough for `src/_headers` |

`.htaccess.njk` is **unchanged** — the Dreamhost deployment keeps working as-is.

---

## Task 1: Install Wrangler

**Files:** none (dev dependency)

- [ ] **Step 1: Add Wrangler as a dev dependency**

```bash
pnpm add -D wrangler
```

- [ ] **Step 2: Verify install**

```bash
pnpm exec wrangler --version
```

Expected output: `⛅️ wrangler X.Y.Z` (3.x or higher)

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add wrangler for Cloudflare Pages experiment"
```

---

## Task 2: Authenticate with Cloudflare

**Files:** none (browser-based OAuth)

- [ ] **Step 1: Log in**

```bash
pnpm exec wrangler login
```

This opens a browser window. Approve the OAuth request. You'll need a Cloudflare account (free tier is fine).

- [ ] **Step 2: Verify authentication**

```bash
pnpm exec wrangler whoami
```

Expected: prints your Cloudflare account email and account ID.

---

## Task 3: Initial Deploy (No Headers/Redirects Yet)

This gets the site live on a `*.pages.dev` URL as fast as possible so you can poke at it.

**Files:** none

- [ ] **Step 1: Build the site**

```bash
pnpm run build
```

Expected: `_site/` is populated (384 MB).

- [ ] **Step 2: Create the Pages project**

```bash
pnpm exec wrangler pages project create jonplummer-test
```

Choose **"Direct Upload"** when prompted (not Git integration — we're deploying locally).

Expected: project created at `https://dash.cloudflare.com` and a `jonplummer-test.pages.dev` subdomain reserved.

- [ ] **Step 3: Deploy to Cloudflare Pages**

```bash
pnpm exec wrangler pages deploy _site --project-name=jonplummer-test
```

Expected output ends with a URL like `https://abc123.jonplummer-test.pages.dev`. Cloudflare also assigns a stable `https://jonplummer-test.pages.dev`.

- [ ] **Step 4: Spot-check the live URL**

Open `https://jonplummer-test.pages.dev` in a browser. Verify:
- Homepage loads with correct content and styling
- A blog post loads (e.g. navigate to any 2025/2026 post)
- Images render (OG images, portfolio images)
- No broken CSS (assets are in `_site/assets/`)

At this point the site works but has no security headers and broken redirects. That's expected — continue to Tasks 4 and 5.

---

## Task 4: Add Security Headers

Cloudflare Pages serves a `_headers` file from the build output root to set response headers. This replaces the `<IfModule mod_headers.c>` block in `.htaccess.njk`.

**Files:**
- Create: `src/_headers`
- Modify: `eleventy/config/passthrough.js`

- [ ] **Step 1: Create `src/_headers`**

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'self';
```

Note: HSTS applies to all requests here (CF Pages is HTTPS-only, so the Apache `env=HTTPS` guard isn't needed).

- [ ] **Step 2: Add `_headers` to passthrough copy**

Open `eleventy/config/passthrough.js`. Add this alongside the existing `.htaccess` passthrough:

```js
eleventyConfig.addPassthroughCopy({ "src/_headers": "_headers" });
```

- [ ] **Step 3: Build and redeploy**

```bash
pnpm run build
pnpm exec wrangler pages deploy _site --project-name=jonplummer-test
```

- [ ] **Step 4: Verify headers**

```bash
curl -I https://jonplummer-test.pages.dev
```

Expected: response includes `x-content-type-options: nosniff`, `x-frame-options: SAMEORIGIN`, `content-security-policy: ...`, etc.

- [ ] **Step 5: Commit**

```bash
git add src/_headers eleventy/config/passthrough.js
git commit -m "feat: add Cloudflare Pages _headers for security header parity"
```

---

## Task 5: Add Redirects

Cloudflare Pages uses a `_redirects` file in the build output root. Each line is: `/from /to statusCode`. This replaces the `{% for redirect %}` loop in `.htaccess.njk` and the mod_rewrite wisdom-tags rule.

**Files:**
- Create: `src/_redirects.njk`

- [ ] **Step 1: Create `src/_redirects.njk`**

```njk
---
permalink: /_redirects
eleventyExcludeFromCollections: true
---
{% for redirect in redirects.redirects %}
{{ redirect.from }} {{ redirect.to }} 301
{%- endfor %}
/wisdom/tags/* /wisdom/ 301
```

No passthrough change needed — Eleventy templates output to `_site/` automatically via `permalink`.

- [ ] **Step 2: Build and redeploy**

```bash
pnpm run build
pnpm exec wrangler pages deploy _site --project-name=jonplummer-test
```

- [ ] **Step 3: Verify redirects work**

Test a known redirect (pick one from `src/_data/redirects.yaml`):

```bash
curl -I "https://jonplummer-test.pages.dev/style-exercise/"
```

Expected: `HTTP/2 301` with `location: /color/`

Test the wisdom wildcard:

```bash
curl -I "https://jonplummer-test.pages.dev/wisdom/tags/some-retired-tag/"
```

Expected: `HTTP/2 301` with `location: /wisdom/`

- [ ] **Step 4: Commit**

```bash
git add src/_redirects.njk
git commit -m "feat: add Cloudflare Pages _redirects template for redirect parity"
```

---

## Task 6: Evaluate and Decide

This is a research task — no code changes. Work through the checklist and write down your findings.

- [ ] **Performance**
  - [ ] Run Lighthouse on `https://jonplummer-test.pages.dev` and `https://jonplummer.com` — compare scores
  - [ ] Check TTFB from a US location: `curl -o /dev/null -s -w "%{time_starttransfer}\n" https://jonplummer-test.pages.dev`
  - [ ] Compare the same curl against `https://jonplummer.com`

- [ ] **DX (deployment workflow)**
  - [ ] Note how long `wrangler pages deploy` takes vs rsync
  - [ ] Consider: would you replace `pnpm run deploy` with a wrangler step, or run both?
  - [ ] CF Pages has a web dashboard with deploy history, rollbacks, and preview URLs per branch — evaluate if useful

- [ ] **Feature parity gaps**
  - [ ] 404/500 pages: CF Pages serves `404.html` automatically — verify at `https://jonplummer-test.pages.dev/nonexistent-path`
  - [ ] IndexNow: still works independently (it's a POST to an external API) — no change needed
  - [ ] Compression: CF Pages does Brotli/gzip automatically — no `.htaccess` needed
  - [ ] Cache headers: CF Pages caches static assets by default with smart invalidation on deploy — confirm asset fingerprinting or note if manual cache-control headers are wanted in `_headers`

- [ ] **Cost**
  - [ ] Free tier: 500 deploys/month, unlimited bandwidth, unlimited requests — likely fine for a personal blog
  - [ ] Compare to Dreamhost shared hosting cost

- [ ] **Migration path (if you decide to proceed)**
  - [ ] Point `jonplummer.com` DNS to Cloudflare Pages (requires adding the domain in CF Pages settings)
  - [ ] Remove `.htaccess.njk` (no longer needed) or leave it for a dual-deploy period
  - [ ] Update `pnpm run deploy` to use `wrangler pages deploy` instead of rsync
  - [ ] Remove `DEPLOY_HOST`, `DEPLOY_USERNAME`, `DEPLOY_REMOTE_PATH` env vars

---

## Verification Summary

After Task 5, the experiment site should pass all of these:

```bash
# Headers present
curl -I https://jonplummer-test.pages.dev | grep -i "x-content-type\|x-frame\|content-security"

# Known redirect works
curl -IL https://jonplummer-test.pages.dev/style-exercise/ | grep -i "location\|HTTP"

# 404 page
curl -I https://jonplummer-test.pages.dev/definitely-does-not-exist

# Homepage loads
curl -s https://jonplummer-test.pages.dev | grep -i "<title>"
```

The Dreamhost deployment is untouched throughout — `pnpm run deploy` still works as before.
