# Nav Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split site navigation into a lean 4-item header and a grouped, complete footer nav, and replace the dev-jargon `/index` home label with `/home` (backed by a real redirect) everywhere it appears.

**Architecture:** Pure Eleventy/Nunjucks template and CSS work — no JavaScript, no new data files. `nav.njk` (header) drops to 4 destinations. A new `footer_nav.njk` include renders 4 hardcoded, labeled link groups directly in the template (same pattern `nav.njk` already uses — no data file indirection). `license.njk` sheds its now-redundant inline link. One redirect entry makes `/home/` a real reachable URL. CSS reuses existing design tokens (`--font-size-quiet`, `--text-color-light`, `--spacing-*`) and extends one existing selector rather than inventing new alignment logic.

**Tech Stack:** Eleventy 3.x, Nunjucks templates, plain CSS with custom properties (no preprocessor), the project's own `pnpm run test <id>` validation suite (no separate unit-test framework for templates — see `docs/tests.md`).

**Spec:** `docs/designs/specs/2026-08-21-nav-restructure-design.md`

## Global Constraints

- Every nav label must read as a real, typeable URL matching the site's plain-word slug convention (`/about`, `/now`, `/wisdom`...) — never developer jargon like `/index`.
- `/home/` needs a working `Redirect 301` (via `src/_data/redirects.yaml`), but nav links themselves point straight to `/`, never through `/home/` — `seo.js` skips redirect pages entirely, so a redirect is never the correct link target.
- `/sides` and `/friends` are **not** added to any nav yet — both are unbuilt; linking an unbuilt page fails `internal-links` and `seo` tests.
- `/color`, `/type`, `/colophon`, `/changelog`, `/technologies` all already exist and build successfully — do not modify those pages themselves.
- No data file for the footer nav — hardcode links directly in `footer_nav.njk`, matching `nav.njk`'s existing convention.
- No JS-driven menu, no mobile collapse — footer nav is always fully visible, same posture as `license.njk` today.
- Do not touch `components/utility_sibling_nav.njk`, `src/_data/utilityPages.js`, or `src/style-exercise.njk` — out of scope (see spec).
- Reuse existing CSS custom properties (`--font-size-quiet`, `--text-color-light`, `--font-weight-semibold`, `--spacing-sm/md/lg`, `--gutter`) — do not introduce new tokens for this work.
- After every task that touches a template or CSS, run `pnpm run build` before running tests — the fast test suite's HTML/output checks (`html`, `internal-links`, `seo`, `og-images`, `color-contrast`, `rss`, `deploy-assets`, `portfolio-cover-crop`) read from `_site/`, not from source.

---

## File Structure

- **Modify** `src/_includes/components/nav.njk` — trim header to 4 destinations, relabel conditional home link.
- **Modify** `src/_includes/components/license.njk` — drop the inline `/colophon` link.
- **Create** `src/_includes/components/footer_nav.njk` — new grouped footer nav, hardcoded links.
- **Modify** `src/_includes/base.njk` — include `footer_nav.njk` before `license.njk` inside `<footer>`.
- **Modify** `src/_data/redirects.yaml` — add `/home/ → /`.
- **Modify** `src/assets/css/jonplummer.css` — new `.footer-nav` rules; broaden the existing `.license` indent selector to also cover `.footer-nav`.

## Task 1: `/home/` redirect

**Files:**
- Modify: `src/_data/redirects.yaml`

**Interfaces:**
- Produces: a working `/home/` URL that 301s to `/`, verified in `_site/.htaccess` after build. No code interface — this is data-only.

- [ ] **Step 1: Add the redirect entry**

Open `src/_data/redirects.yaml`. It currently reads:

```yaml
redirects:
  # Utility page URL updates
  - from: /style-exercise/
    to: /color/

  - from: /color-test/
    to: /color/

  - from: /og-image-preview/
    to: /ogimages/

  - from: /type/gallery/
    to: /type/

  - from: /uses/
    to: /technologies/

  # Date corrections and URL changes
  - from: /2022/04/17/empathy-for-the-leader-whose-company-is-being-acquired/
    to: /2022/04/16/empathy-for-the-leader-whose-company-is-being-acquired/
```

Insert a new group right after the `/uses/` entry and before the `# Date corrections` comment:

```yaml
  - from: /uses/
    to: /technologies/

  # Canonical URL aliases
  - from: /home/
    to: /

  # Date corrections and URL changes
```

- [ ] **Step 2: Build and verify the redirect is generated**

Run: `pnpm run build`
Then: `grep -n "home" _site/.htaccess`
Expected: a line reading `Redirect 301 /home/ /`

- [ ] **Step 3: Run the fast test suite**

Run: `pnpm run test fast`
Expected: all pass. (Redirect pages are skipped by `seo.js` and excluded from `internal-links` checks — this entry should not trip either.)

- [ ] **Step 4: Commit**

```bash
git add src/_data/redirects.yaml
git commit -m "$(cat <<'EOF'
feat: add /home/ redirect to /

Backs the upcoming /home nav label with a genuinely reachable URL,
matching every other nav label's plain-slug convention.
EOF
)"
```

## Task 2: Trim and relabel the header nav

**Files:**
- Modify: `src/_includes/components/nav.njk`

**Interfaces:**
- Consumes: nothing new.
- Produces: header `<nav>` with 4 destinations (`/home` conditional, `/about`, `/now`, `/portfolio`) — `/wisdom` removed. This is the reference implementation Task 4 mirrors for the footer's "Start here" group (same labels, same hrefs).

- [ ] **Step 1: Edit the template**

Current content of `src/_includes/components/nav.njk`:

```html
{# purpose: site navigation #}
<nav aria-label="Site navigation">
    <ul>
        {% if page.url != "/" %}
        <li><a href="/">/index</a></li>
        {% endif %}
        <li><a href="/about/"{% if page.url == "/about/" %} aria-current="page"{% endif %}>/about</a></li>
        <li><a href="/now/"{% if page.url == "/now/" %} aria-current="page"{% endif %}>/now</a></li>
        <li><a href="/portfolio/"{% if page.url == "/portfolio/" %} aria-current="page"{% endif %}>/portfolio</a></li>
        <li><a href="/wisdom/"{% if page.url.indexOf('/wisdom') === 0 %} aria-current="page"{% endif %}>/wisdom</a></li>
    </ul>
</nav>
```

Replace it with:

```html
{# purpose: site navigation #}
<nav aria-label="Site navigation">
    <ul>
        {% if page.url != "/" %}
        <li><a href="/">/home</a></li>
        {% endif %}
        <li><a href="/about/"{% if page.url == "/about/" %} aria-current="page"{% endif %}>/about</a></li>
        <li><a href="/now/"{% if page.url == "/now/" %} aria-current="page"{% endif %}>/now</a></li>
        <li><a href="/portfolio/"{% if page.url == "/portfolio/" %} aria-current="page"{% endif %}>/portfolio</a></li>
    </ul>
</nav>
```

- [ ] **Step 2: Build and spot-check**

Run: `pnpm run build`
Then: `grep -n "/home\|/wisdom" _site/about/index.html`
Expected: the header nav shows `>/home<` and no `/wisdom` link. (`/wisdom/index.html` itself still exists — only the header link is gone.)

- [ ] **Step 3: Run the fast test suite**

Run: `pnpm run test fast`
Expected: all pass — `internal-links` confirms `/home` label's `href="/"` still resolves; `html` confirms valid markup; `seo` confirms no broken nav links.

- [ ] **Step 4: Commit**

```bash
git add src/_includes/components/nav.njk
git commit -m "$(cat <<'EOF'
refactor: trim header nav to 4 destinations, relabel /index to /home

/wisdom moves to the footer's "Also read" group (not updated
regularly, not a header-worthy destination). /index was dev jargon
that never matched a real route; /home does, backed by the redirect
added in the previous commit.
EOF
)"
```

## Task 3: Simplify `license.njk`

**Files:**
- Modify: `src/_includes/components/license.njk`

**Interfaces:**
- Consumes: nothing.
- Produces: `<p class="license">` with plain copyright text, no inline link. Task 5's CSS still needs `.license` to exist as a class — this task doesn't remove the class, only the `<a>` inside it.

- [ ] **Step 1: Edit the template**

Current content of `src/_includes/components/license.njk`:

```html
{# purpose: license (copyright) statement #}
<p class="license">Copyright {% year %} {{ site.author }} – <a href="/colophon/">/colophon</a></p>
```

Replace it with:

```html
{# purpose: license (copyright) statement #}
<p class="license">Copyright {% year %} {{ site.author }}</p>
```

- [ ] **Step 2: Build and spot-check**

Run: `pnpm run build`
Then: `grep -n "license" _site/about/index.html`
Expected: `<p class="license">Copyright 2026 Jon Plummer</p>` (or current year), no `<a>` tag inside it.

- [ ] **Step 3: Run the fast test suite**

Run: `pnpm run test fast`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/_includes/components/license.njk
git commit -m "$(cat <<'EOF'
refactor: drop redundant /colophon link from license.njk

/colophon will appear in the new footer nav's "How this site works"
group, right above the copyright line — keeping it here too was
duplicate, not intentional redundancy.
EOF
)"
```

## Task 4: Create and wire in the footer nav

**Files:**
- Create: `src/_includes/components/footer_nav.njk`
- Modify: `src/_includes/base.njk:74-76` (the `<footer>` block)

**Interfaces:**
- Consumes: the exact labels/hrefs from Task 2's `nav.njk` for the "Start here" group (`/`→`/home`, `/about/`, `/now/`, `/portfolio/`).
- Produces: `<nav class="footer-nav" aria-label="More on this site">` containing four `<div class="footer-nav-group">` blocks, each with an `<h2>` and a `<ul>` of `<li><a>`. Task 5's CSS targets exactly these class names: `.footer-nav`, `.footer-nav-group`, `.footer-nav-group h2`.

- [ ] **Step 1: Create the footer nav include**

Create `src/_includes/components/footer_nav.njk`:

```html
{# purpose: footer sitemap navigation, grouped #}
<nav class="footer-nav" aria-label="More on this site">
    <div class="footer-nav-group">
        <h2>Start here</h2>
        <ul>
            <li><a href="/"{% if page.url == "/" %} aria-current="page"{% endif %}>/home</a></li>
            <li><a href="/about/"{% if page.url == "/about/" %} aria-current="page"{% endif %}>/about</a></li>
            <li><a href="/now/"{% if page.url == "/now/" %} aria-current="page"{% endif %}>/now</a></li>
            <li><a href="/portfolio/"{% if page.url == "/portfolio/" %} aria-current="page"{% endif %}>/portfolio</a></li>
        </ul>
    </div>
    <div class="footer-nav-group">
        <h2>Also read</h2>
        <ul>
            <li><a href="/wisdom/"{% if page.url.indexOf('/wisdom') === 0 %} aria-current="page"{% endif %}>/wisdom</a></li>
        </ul>
    </div>
    <div class="footer-nav-group">
        <h2>How this site works</h2>
        <ul>
            <li><a href="/colophon/"{% if page.url == "/colophon/" %} aria-current="page"{% endif %}>/colophon</a></li>
            <li><a href="/changelog/"{% if page.url == "/changelog/" %} aria-current="page"{% endif %}>/changelog</a></li>
            <li><a href="/technologies/"{% if page.url == "/technologies/" %} aria-current="page"{% endif %}>/technologies</a></li>
        </ul>
    </div>
    <div class="footer-nav-group">
        <h2>Labs</h2>
        <ul>
            <li><a href="/color/"{% if page.url == "/color/" %} aria-current="page"{% endif %}>/color</a></li>
            <li><a href="/type/"{% if page.url == "/type/" %} aria-current="page"{% endif %}>/type</a></li>
        </ul>
    </div>
</nav>
```

Note the `/home` `<li>` is **not** wrapped in a `{% if page.url != "/" %}` conditional — unlike the header, the footer's "Start here" group always shows all four links (the footer is a complete map regardless of the current page); only the `aria-current` attribute is conditional.

- [ ] **Step 2: Wire the include into `base.njk`**

Current `<footer>` block in `src/_includes/base.njk`:

```html
<footer aria-label="Site footer">
    {% include "components/license.njk" %}
</footer>
```

Replace it with:

```html
<footer aria-label="Site footer">
    {% include "components/footer_nav.njk" %}
    {% include "components/license.njk" %}
</footer>
```

- [ ] **Step 3: Build and spot-check**

Run: `pnpm run build`
Then: `grep -n "footer-nav\|Start here\|Also read\|How this site works\|Labs" _site/about/index.html`
Expected: all four group headings present, followed later by the `<p class="license">` line.

- [ ] **Step 4: Run the fast test suite**

Run: `pnpm run test fast`
Expected: all pass — `internal-links` confirms every new footer link resolves (`/wisdom/`, `/colophon/`, `/changelog/`, `/technologies/`, `/color/`, `/type/` all already exist); `html` confirms valid nested `<nav>`/`<div>`/`<ul>` markup; `seo` confirms no new broken/orphaned links.

- [ ] **Step 5: Run the slow accessibility suite** (optional but recommended — new landmark/heading structure)

Run: `pnpm run test a11y`
Expected: no new violations. If this surfaces something, note it — do not silently patch around it before Task 5's CSS ships; a heading-order or landmark issue may need the CSS in place first to judge correctly.

- [ ] **Step 6: Commit**

```bash
git add src/_includes/components/footer_nav.njk src/_includes/base.njk
git commit -m "$(cat <<'EOF'
feat: add grouped footer nav

Four labeled groups: "Start here" mirrors the header exactly so the
footer serves as a complete site map regardless of current page;
"Also read" (wisdom, later friends/sides); "How this site works"
(colophon, changelog, technologies); "Labs" (color, type). Hardcoded
directly in the template, same convention as nav.njk — no data file.
EOF
)"
```

## Task 5: Style the footer nav

**Files:**
- Modify: `src/assets/css/jonplummer.css`

**Interfaces:**
- Consumes: `.footer-nav`, `.footer-nav-group`, `.footer-nav-group h2` from Task 4's markup; existing tokens `--font-size-quiet`, `--line-height-quiet`, `--font-weight-semibold`, `--text-color-light`, `--text-color`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--gutter`.
- Produces: visually distinct, responsive footer nav (row of columns wide, stacked narrow), and a broadened version of the existing `.license` indent selector.

- [ ] **Step 1: Add footer nav layout and link styling**

Find this block in `src/assets/css/jonplummer.css` (around line 780-800):

```css
/* Quiet chrome — license, credits (not post code/pre) */
.license,
footer p,
.colophon-signature figcaption {
  font-size: var(--font-size-quiet);
  line-height: var(--line-height-quiet);
  font-weight: var(--font-weight-light);
  color: var(--text-color-light);
}

/* Quiet links (colophon): quiet → ink; no visited treatment */
.license a:any-link,
footer p a:any-link {
  color: var(--text-color-light);
  text-decoration: underline;
}

.license a:any-link:is(:hover, :focus-visible),
footer p a:any-link:is(:hover, :focus-visible) {
  color: var(--text-color);
}

.license {
  text-align: left;
  margin: 0;
}

/*
  Trial (easy revert): align license with article `section` column on grids that use
  1fr | gutter | 2fr. Full-width `tags: page` mains keep flush-left (same as prose).
  Index has no data-tags; posts/portfolio/wisdom omit `page` → indent.
*/
main:not([data-tags*="page"]) ~ footer .license {
  margin-inline-start: calc((100% - var(--gutter)) / 3 + var(--gutter));
}

@media (width <= 54rem) {
  main:not([data-tags*="page"]) ~ footer .license {
    margin-inline-start: 0;
  }
}
```

Replace it with (adds `.footer-nav` to the two shared selectors, adds the new group/heading/link rules, broadens the indent selector):

```css
/* Quiet chrome — license, credits (not post code/pre) */
.license,
footer p,
.colophon-signature figcaption {
  font-size: var(--font-size-quiet);
  line-height: var(--line-height-quiet);
  font-weight: var(--font-weight-light);
  color: var(--text-color-light);
}

/* Quiet links (colophon, footer nav): quiet → ink; no visited treatment */
.license a:any-link,
footer p a:any-link,
.footer-nav a:any-link {
  color: var(--text-color-light);
  text-decoration: underline;
}

.license a:any-link:is(:hover, :focus-visible),
footer p a:any-link:is(:hover, :focus-visible),
.footer-nav a:any-link:is(:hover, :focus-visible) {
  color: var(--text-color);
}

.license {
  text-align: left;
  margin: 0;
}

/* Footer nav — grouped links above the copyright line */
.footer-nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg) var(--gutter);
  margin: 0 0 var(--spacing-md);
}

.footer-nav-group {
  flex: 1 1 10rem;
  min-width: 10rem;
}

.footer-nav-group h2 {
  font-size: var(--font-size-quiet);
  line-height: var(--line-height-quiet);
  font-weight: var(--font-weight-semibold);
  color: var(--text-color-light);
  margin: 0 0 var(--spacing-sm);
}

.footer-nav-group ul {
  display: block;
  margin: 0;
  padding: 0;
  list-style: none;
}

.footer-nav-group li {
  margin: 0 0 0.25rem;
}

.footer-nav a[aria-current="page"] {
  color: var(--text-color-light);
  text-decoration: none;
}

@media (width <= 54rem) {
  .footer-nav {
    flex-direction: column;
    gap: var(--spacing-md);
  }
}

/*
  Trial (easy revert): align footer (nav + license) with article `section` column on
  grids that use 1fr | gutter | 2fr. Full-width `tags: page` mains keep flush-left
  (same as prose). Index has no data-tags; posts/portfolio/wisdom omit `page` → indent.
*/
main:not([data-tags*="page"]) ~ footer .license,
main:not([data-tags*="page"]) ~ footer .footer-nav {
  margin-inline-start: calc((100% - var(--gutter)) / 3 + var(--gutter));
}

@media (width <= 54rem) {
  main:not([data-tags*="page"]) ~ footer .license,
  main:not([data-tags*="page"]) ~ footer .footer-nav {
    margin-inline-start: 0;
  }
}
```

- [ ] **Step 2: Build and lint**

Run: `pnpm run build`
Run: `pnpm run lint:css`
Expected: no Stylelint errors.

- [ ] **Step 3: Run CSS and contrast tests**

Run: `pnpm run test css`
Run: `pnpm run test color-contrast`
Expected: both pass. The footer nav reuses `--text-color-light` / `--text-color`, the same pair already vetted for `.license a:any-link` — no new color pairs are introduced, so no new contrast failures are expected.

- [ ] **Step 4: Visual check in the dev server**

Run: `pnpm run dev`
Visit `http://127.0.0.1:8080/about/` (a `tags: page` page — footer should be flush-left) and `http://127.0.0.1:8080/` (the index — footer should be indented to match the 2fr article column). Confirm:
- Four footer groups appear as columns on a wide window, stacking to one column under ~54rem width.
- The footer nav and the copyright line beneath it share the same left edge on both page types.
- Hovering/focusing a footer link underlines and darkens to ink color, matching the colophon link's existing behavior.

- [ ] **Step 5: Run the full fast test suite**

Run: `pnpm run test fast`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/assets/css/jonplummer.css
git commit -m "$(cat <<'EOF'
style: add footer nav layout, extend footer alignment rule

Four-column (stacking to one on narrow viewports) footer nav, reusing
existing quiet-chrome tokens rather than introducing new ones. The
existing indent-on-blog-layouts / flush-on-full-width alignment rule
for .license is broadened to cover .footer-nav too, so both pieces of
the footer align as one block — same rule, same trigger, applied to
new markup.
EOF
)"
```

## Task 6: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full clean build**

Run: `pnpm run clean`
Run: `pnpm run build`
Expected: build succeeds with no errors.

- [ ] **Step 2: Full fast suite**

Run: `pnpm run test fast`
Expected: all pass (`html`, `links`, `wisdom`, `internal-links`, `frontmatter`, `markdown`, `spell`, `seo`, `og-images`, `color-contrast`, `css`, `rss`, `deploy-assets`, `cloudflare-purge`, `portfolio-cover-crop`).

- [ ] **Step 3: Accessibility suite**

Run: `pnpm run test a11y`
Expected: no new violations introduced by the header/footer changes.

- [ ] **Step 4: Manual redirect check**

Run: `grep -n "Redirect 301 /home/" _site/.htaccess`
Expected: one match. (Live-site confirmation that `jonplummer.com/home/` actually redirects happens post-deploy, per the spec's testing note — not available pre-deploy.)

- [ ] **Step 5: Cross-page spot check**

Run: `grep -rl "footer-nav" _site/**/index.html | head -5`
Then open two or three of those files' relevant `<footer>` sections (or revisit the dev server) and confirm the four groups and the `/home`-labeled link render identically across a post, a portfolio item, and a `tags: page` page like `/now/`.

No commit needed for this task — it's verification of work already committed in Tasks 1-5.
