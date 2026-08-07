# Header Lockup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the JP mark beside a Semibold logotype in the site header per `docs/superpowers/specs/2026-08-06-header-lockup-design.md`.

**Architecture:** Copy the approved SVG into `src/assets/images/`, update `base.njk` masthead markup (two home links: mark + title), and adjust `jonplummer.css` layout/typography tokens. Leave OG and favicons unchanged.

**Tech Stack:** Eleventy + Nunjucks, vanilla CSS custom properties, static SVG asset.

## Global Constraints

- Use Approach A: shared `hgroup` / `hgroup h1` selectors (not scoped to `body > header`).
- Mark `alt=""`; tagline stays outside both home links.
- Do not change OG `.og-hgroup`, favicons, or `critical.njk`.
- Source SVG: `/Users/jonplummer/Documents/Claude/Projects/Online presence improvement project/jp-mark.svg` (copy as-is).
- Do not commit unless the user asks.

---

### Task 1: Add mark asset

**Files:**
- Create: `src/assets/images/jp-mark.svg`
- Test: `test -f src/assets/images/jp-mark.svg`

**Interfaces:**
- Consumes: approved source SVG path above
- Produces: `/assets/images/jp-mark.svg` for `<img src>`

- [x] **Step 1: Copy the SVG**

```bash
cp "/Users/jonplummer/Documents/Claude/Projects/Online presence improvement project/jp-mark.svg" \
  src/assets/images/jp-mark.svg
```

- [x] **Step 2: Verify file exists and has dark-mode style**

```bash
test -f src/assets/images/jp-mark.svg
rg -n "prefers-color-scheme: dark" src/assets/images/jp-mark.svg
```

Expected: file exists; one match for dark fill rule.

---

### Task 2: Header markup

**Files:**
- Modify: `src/_includes/base.njk` (header / hgroup block)

**Interfaces:**
- Consumes: `/assets/images/jp-mark.svg`
- Produces: `.site-mark-link`, `.site-mark`, `.site-title-stack` in rendered HTML

- [x] **Step 1: Replace the header block**

Replace:

```html
<header>
    <a class="skip" href="#main">Skip to content</a>
    <hgroup>
        <h1><a href="/" rel="home">{{ site.author }}</a></h1>
        <p>{{ site.tagline }}</p>
    </hgroup>
    {% include "components/nav.njk" %}
</header>
```

With:

```html
<header>
    <a class="skip" href="#main">Skip to content</a>
    <hgroup>
        <a href="/" rel="home" class="site-mark-link">
            <img class="site-mark" src="/assets/images/jp-mark.svg" alt="" width="64" height="64">
        </a>
        <div class="site-title-stack">
            <h1><a href="/" rel="home">{{ site.author }}</a></h1>
            <p>{{ site.tagline }}</p>
        </div>
    </hgroup>
    {% include "components/nav.njk" %}
</header>
```

- [x] **Step 2: Confirm with ripgrep**

```bash
rg -n "site-mark|site-title-stack" src/_includes/base.njk
```

Expected: mark link, img, and title stack present.

---

### Task 3: CSS layout + logotype

**Files:**
- Modify: `src/assets/css/jonplummer.css`

**Interfaces:**
- Consumes: markup classes from Task 2
- Produces: `--font-size-logotype`; updated `header` / `hgroup` / `.site-*` / logotype rules

- [x] **Step 1: Add token near other `--font-size-*`**

After `--font-size-3xl` line, add:

```css
  --font-size-logotype: 2.25rem; /* 36px — one-off for the header lockup, deliberately off the modular scale */
```

- [x] **Step 2: Replace combined header/hgroup layout**

Replace:

```css
header,
hgroup {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

header {
  justify-content: space-between;
}
```

With:

```css
header {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  justify-content: space-between;
}

hgroup {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.site-mark-link {
  display: block;
  flex-shrink: 0;
}

.site-mark {
  display: block;
}
```

- [x] **Step 3: Replace hgroup typography**

Replace:

```css
hgroup h1 {
  font-family: var(--font-family-display);
  font-size: var(--font-size-3xl);
  line-height: var(--line-height-3xl);
  font-weight: var(--font-weight-thin);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-display-tight);
  margin: 0;
}

hgroup p {
  margin: 0;
  font-size: var(--font-size-xs);
  line-height: var(--line-height-xs);
  font-style: italic;
  color: var(--text-color-light);
}

header h1 + p {
  margin-top: 0rem;
}
```

With:

```css
hgroup h1 {
  font-family: var(--font-family-display);
  font-size: var(--font-size-logotype);
  line-height: 1;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-normal);
  margin: 0;
}

hgroup p {
  margin: 0;
  font-size: var(--font-size-xs);
  line-height: var(--line-height-xs);
  font-style: italic;
  color: var(--text-color-light);
}

.site-title-stack p {
  margin-top: 0.2rem;
}
```

Leave `hgroup h1 a:any-link` / `:is(:hover, :focus-visible)` rules unchanged.

- [x] **Step 4: Run CSS test**

```bash
pnpm run test css
```

Expected: exit 0.

---

### Task 4: Verify

**Files:** none (read-only checks)

- [x] **Step 1: frontmatter test**

```bash
pnpm run test frontmatter
```

Expected: exit 0.

- [ ] **Step 2: Visual check via running `pnpm run dev`**

Confirm in browser: 64px mark left of Semibold uppercase name + italic tagline; mark and title both go to `/`; light and dark fills on the mark.

- [ ] **Step 3: Optional a11y**

```bash
pnpm run test a11y
```

Expected: exit 0 (or report failures to user — do not “fix” unrelated issues).

- [ ] **Step 4: Ask user about commit**

Do not commit unless requested. Suggest message:

```
Add JP mark and Semibold logotype to site header
```
