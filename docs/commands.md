# 🎪 PNPM Commands

## Quick Reference

### 🧭 Deployment Workflow

Recommended process for deploying changes with an up-to-date changelog:

1. Make changes (write posts, update content, add links to NotePlan, etc.)
2. `pnpm run import-links` - Import any pending links from NotePlan (if applicable)
3. `pnpm run build` - Verify local build works
4. `pnpm run test fast` - Run validation checks
5. Fix any issues found, then repeat steps 3-4 until all tests pass
6. `git commit` - Commit changes (required: changelog generation reads from git history)
7. `pnpm run deploy` - Deploy to live site (regenerates changelog, runs validation, and pushes to remote when done)
8. Verify the live site works as expected

**Why this order?** Importing links before building lets you review and test them locally. The deploy script regenerates the changelog from git commit history, so commits must exist before deployment. After a successful deploy it always pushes to remote — committing the changelog first if it changed — so your work never sits unpushed. See [Deployment Process](#deployment-process) for details.

### 🪴 Daily Development

- `pnpm run dev` - Start development server with auto-rebuild on file changes (`--serve --watch --quiet`)
  - Auto-runs: `generate-og-images` incrementally on file save (via `eleventy.beforeWatch`)
  - After the first build, opens `http://127.0.0.1:<port>/` in your browser once (`--port` respected; disable with `ELEVENTY_OPEN_BROWSER=0`; if Eleventy uses another port because the default is busy, set `ELEVENTY_DEV_SERVER_URL` to the URL from the terminal)
- `pnpm run dev:verbose` - Start development server with verbose output (`--serve --watch`)
- `pnpm run build` - Build production site (`--quiet`) (auto: `deploy`)
- `pnpm run build:verbose` - Build production site with verbose output
- `pnpm run clean` - Clean build directory

### 🪲 Testing

- `pnpm run test` - List available test types
- `pnpm run validate` - Quick HTML validity check (shortcut for `pnpm run test html`)
- `pnpm run test fast` - Run fast tests (excludes slow tests like a11y)
  - Runs: `html` → `links` → `wisdom` → `internal-links` → `frontmatter` → `markdown` → `spell` → `seo` → `og-images` → `color-contrast` → `css` → `rss` → `portfolio-notes` → `deploy-assets` → `cloudflare-purge` → `portfolio-cover-crop`
- `pnpm run test all` - Run all tests in sequence (includes slow tests)
  - Runs: everything in `test fast` → `a11y`
- `pnpm run test [type]` - Run a specific test type
- `pnpm run lint:css` - Lint `src/**/*.css` with [Stylelint](https://stylelint.io) (same rules as `pnpm run test css`)
- `pnpm run fix:markdown` - Auto-fix whitespace/formatting issues in markdown files (trailing spaces, missing newlines, blank lines around headings, etc.) — run this before `pnpm run test markdown` to clear nuisance failures
- `pnpm run test [type] -- --format [format]` - Specify output format: `verbose` (default) or `build`

### 🪂 Deployment

- `pnpm run deploy` - Deploy site to host via rsync
  - Runs: `changelog` → `build` (source checks + OG images + Eleventy + output checks) → rsync → Cloudflare purge (content-hash diff) → IndexNow
- `pnpm run deploy --dry-run` - Test deployment without actually deploying (runs all checks and shows what would be synced)
- `pnpm run deploy --verbose` - Same deploy, plus rsync's per-file listing and transfer statistics. Off by default: every build rewrites `_site/`, so rsync re-uploads nearly every file and the listing runs to thousands of lines. Failures and rsync warnings print without the flag.

### 🪶 Content Authoring

- `pnpm run import-links` - Import links from NotePlan to links.yaml (auto: `deploy`)
- `pnpm run import-links --clear` - Import and clear NotePlan note
- `pnpm run import-links --date=2025-12-25` - Import with specific date

See [noteplan-import.md](noteplan-import.md) for complete workflow documentation.

### 🧹 Maintenance

- `pnpm run changelog` - Generate CHANGELOG.md from git history (auto: `deploy`)
- `pnpm run convert-pdf` - Convert PDF pages to images for portfolio items
- `pnpm run setup-deck-python` - One-time venv for `convert-presentation` (`python-pptx`; Homebrew-safe)
- `pnpm run convert-presentation` - PDF + matching `.pptx` → images and markdown with speaker notes (see [PDF page conversion](#-pdf-page-conversion))
- `pnpm run convert-pdf-with-notes` - PDF + hand-authored notes file → same output as above (notes not read from pptx)
- `pnpm run generate-og-images` - Generate Open Graph images for posts and pages (auto: `deploy`, `dev`)
- `pnpm run security-audit` - Run security audit and maintenance checks
- `pnpm run focus-audit` - Audit focus visibility and keyboard navigation against a running site (see [Focus and keyboard audit](#-focus-and-keyboard-audit)). Not part of `pnpm run test` — it needs a served site and takes about ten minutes
- `pnpm run indexnow-catch-up` - One-off: submit every current indexable page to IndexNow, ignoring the local content-hash manifest (`.cache/indexnow-content-manifest.json`). Use after a gap in normal notifications (e.g. clearing a backlog); a regular `pnpm run deploy` only submits pages that changed since the last deploy. Add `-- --dry-run` to preview the URL list without submitting. To rotate the IndexNow key: generate a new 8–128 char alphanumeric string, write it to `src/<thatstring>.txt` (delete the old key file), and update `INDEXNOW_API_KEY` in `.env` to match — `keyLocation` is derived from the env var at request time, so no code change is needed.
- `pnpm run color-gallery` - Generate APCA-aware theme gallery (HTML + JSON) under `scripts/color-explore/output/` **and** refresh the `/color/` embed files in `src/` (same defaults as Eleventy). Use this for **CLI flags** (`--hue-sweep`, `--random`, etc.); **`pnpm run build`** / **`dev`** already run the embed step via `eleventy.before` — see [color-theme-exploration.md](designs/color-theme-exploration.md)
- Color theme **tooling** (gallery output, `/color/` page, `node scripts/utils/suggest-colors.js`, `pnpm run test color-contrast`) — summarized in [color-theme-exploration.md § Companion tooling](designs/color-theme-exploration.md#companion-tooling)
- `pnpm run font-gallery` - Generate single-card font lab (headings vs body stacks, live site scale/colors) under `scripts/font-explore/output/` — see [font-stack-exploration.md](designs/font-stack-exploration.md)
- `pnpm run colophon-sketch` - Colophon portrait remap lab (light vs dark side-by-side) under `scripts/colophon-sketch/output/`; add `-- --export` to write site `-light.png` / `-dark.png` from the current export recipe
- `pnpm run generate-favicon-rasters` - Rebuild `favicon.ico` and `apple-touch-icon.png` from `icon-raster.svg` (light content field for third-party `<img>` scrapers; does not change tab `icon.svg`)
- Font stack **tooling** (gallery output, generator paths, CSS lint after shipping) — [font-stack-exploration.md § Companion tooling](designs/font-stack-exploration.md#companion-tooling)

---

## Detailed Explanations

See [tests.md](tests.md) for detailed test documentation.

### 🪂 Deployment

- `pnpm run deploy` - Deploy site via rsync (simplified script)
- `pnpm run deploy --dry-run` - Test deployment without actually deploying. Runs all checks and shows what would be synced via rsync's dry-run mode.
- `pnpm run deploy --verbose` - Adds rsync's per-file listing and transfer statistics to a real deploy (see [Deployment](#-deployment) above for why that's opt-in).

Prior complex deployment scripts were moved to `scripts/deploy/backup/`. rsync arguments are built in `scripts/utils/deploy-rsync.js` so `pnpm run test deploy-guards` can assert them; errors are handled simply and rsync's own messages pass through.

#### Build first, or just deploy?

Run one or the other, never `pnpm run build && pnpm run deploy`. Deploy runs the same `scripts/build/build.js` and aborts before rsync if it fails, so building first adds no safety — only a second full build.

- **Ready to ship** - `pnpm run deploy` on its own.
- **Not sure yet** - `pnpm run build` on its own. Same checks, nothing leaves the machine.
- **Want the full rehearsal** - `pnpm run deploy --dry-run`. Adds the real rsync comparison and the exact Cloudflare purge and IndexNow URL lists, without deploying, committing, or pushing.

Deploy has no `--skip-build` flag, and shouldn't get one: its inputs include the git HEAD SHA (the home-page tagline is salted with it) and `CHANGELOG.md`, which deploy regenerates as its own first step. A stale-output check that misses an input would ship the wrong bytes silently, and skipping the build would also skip the pre- and post-build tests that gate the deploy.

#### Deployment Process

The deploy script performs these steps in order:

1. **Regenerates changelog** from git history
2. **Builds the site** via `pnpm run build` — runs all source checks, generates OG images, runs Eleventy, then runs all output checks
3. **Deploys via rsync** - uses `--dry-run` flag when `--dry-run` option is used. Normal runs print only the result line; `--verbose` (or `--dry-run`) adds `--itemize-changes` and `--stats`, and a non-zero exit prints the full output regardless
4. **Purges Cloudflare cache** for content-changed URLs only (SHA-256 diff vs local manifest; skipped if credentials unset; previewed on dry-run)
5. **Submits IndexNow** notification for search engine indexing (content-hash diff vs local manifest; missing API key or nothing changed both print a message rather than staying silent) - computes and prints the URL list on `--dry-run` but does not submit or write state
6. **Commits changelog** if it was updated, then **always pushes to remote** - skipped with `--dry-run`
7. **Prints a closing timestamp** - `🕒 Deploy finished Thu, Aug 13, 9:33 PM (1m 47s)`, so a scrolled-back terminal still says when the site went out; failures print `Deploy failed` with the same clock and elapsed. `pnpm run build` prints its own line the same way, which appears mid-deploy as a sub-total. Formatting lives in `scripts/utils/run-timing.js`.

**Note:** Links from NotePlan should be imported *before* committing (`pnpm run import-links`), not during deployment. This lets you review and test links locally before they go live.

#### Testing Deployment

Use `--dry-run` to test the full deployment process without actually deploying:

```bash
pnpm run deploy --dry-run
```

This will:
- Run all validation checks
- Generate any missing OG images
- Show what files would be synced (via rsync's dry-run)
- Not actually deploy anything

This is useful for:
- Verifying the deployment process works end-to-end
- Checking what files would be changed on the server
- Testing configuration changes

#### Cloudflare cache purge (optional)

After rsync, deploy purges **only URLs whose built content changed** from Cloudflare edge cache. The purge list comes from a **local content-hash manifest**, not from rsync's transfer list — rsync may still upload files with new mtimes even when bytes are unchanged.

Deploy walks `_site/`, SHA-256-hashes each file, and diffs against `.cache/deploy-content-manifest.json` (gitignored). **Changed** and **deleted** paths map to apex URLs on `SITE_DOMAIN` (default `jonplummer.com`). **Added** paths are not purged (nothing was cached under a new URL yet); they still enter the manifest for later diffs. Regenerated assets that keep the same path (e.g. OG PNGs) count as changed and are purged. Non-public artifacts such as `.htaccess` are skipped.

Set in `.env`:

```
CLOUDFLARE_ZONE_ID=your-zone-id
CLOUDFLARE_API_TOKEN=your-api-token
```

Create an API token with **Zone → Cache Purge → Purge** permission for the site zone. If unset, deploy skips purge and prints a note. Set `CLOUDFLARE_PURGE=0` to disable when credentials are present.

**First deploy after this feature** (or after clearing `.cache/`): no baseline manifest exists yet — deploy establishes the manifest but **does not purge** that run. The next deploy diffs against it. For an immediate full edge refresh, use the Cloudflare dashboard or set `CLOUDFLARE_PURGE_FORCE_CONTENT=1` for one run (treats all current `_site` files as changed).

`pnpm run deploy --dry-run` lists URLs that would be purged without calling the API and does not write the manifest.


### 🗃️ Changelog Generation

- `pnpm run changelog` - Generate CHANGELOG.md from git commit history

The changelog is automatically generated from the git commit history, organized by date (newest first). It includes all commits from the beginning of the project and follows the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

The changelog is automatically regenerated before each deployment. When it changes, the deploy script commits it; either way, deploy always pushes to remote afterward so the repo stays in sync and nothing you committed locally is left unpushed. You can also run this command manually whenever you want to update it.

### 📑 PDF Page Conversion

**For authoring usage** (how to use PDFs in portfolio items), see [authoring.md](authoring.md#pdf-pages).

#### `convert-pdf` — PDF only (placeholder captions)

- `pnpm run convert-pdf <pdf-file> [year/month]` — Converts each page of a PDF to a PNG for portfolio display.

```bash
pnpm run convert-pdf "Product Trio.pdf" 2022/12
```

The `year/month` parameter is optional. If omitted, it defaults to the current year/month.

**What it does**

1. Converts each PDF page to a PNG image (300 DPI via Poppler `pdftocairo`)
2. Saves images to `src/assets/images/[year]/[month]/` with naming pattern `[slug]-page-[number].png`
3. Copies the PDF to `src/assets/pdfs/[year]/[month]/`
4. Prints a markdown template with placeholder text in each `<figcaption>`

#### `convert-pdf-with-notes` — PDF + notes file you write

- `pnpm run convert-pdf-with-notes <pdf-file> <notes-file> [year/month]` — Same images and layout as `convert-pdf`, but captions come from a plain-text notes file.

Notes file formats are documented in the script header in `scripts/content/convert-pdf-pages-with-notes.js`. Parsing is shared with the pptx path via `scripts/utils/portfolio-notes.js` (numbered lines `1: …` / `Slide 1: …`, including empty notes, or blank-line–separated blocks).

#### `convert-presentation` — PDF + matching `.pptx` (speaker notes from the deck)

- `pnpm run convert-presentation <pdf-file> <pptx-file> [year/month]` — Extracts speaker notes from the PowerPoint file with Python (`python-pptx`), then runs the same PDF → PNG + markdown flow as `convert-pdf-with-notes`.

**One-time setup (in addition to Poppler):**

```bash
pnpm run setup-deck-python
```

Creates `scripts/content/.venv/` with `python-pptx` (avoids Homebrew PEP 668 “externally-managed-environment” errors from bare `pip install`). Requires `python3` on your `PATH` for the initial venv bootstrap.

Requires the `extract-pptx-notes.py` helper (committed in `scripts/content/`). `convert-presentation` uses the venv Python automatically when present.

**Usage**

```bash
pnpm run convert-presentation "My Talk.pdf" "My Talk.pptx" 2026/03
```

Export the PDF and `.pptx` from the same source (e.g. Google Slides → download both, or PowerPoint → Save as PDF + save `.pptx`) so slide order and page count stay aligned. If the slide count from the `.pptx` does not match the PDF page count, the script warns and still uses the PDF for images.

**What it does**

1. Runs `scripts/content/extract-pptx-notes.py` to build a numbered notes file (temporary)
2. Invokes `convert-pdf-pages-with-notes.js` with that file
3. You copy the printed markdown into your portfolio post as usual

Planned later (not in this command yet): fetching files from Google Drive / Microsoft Graph; until then, download the pair locally and run the command above.

#### Output (all three flows)

The scripts print a markdown template to stdout. Copy it into your portfolio item. Templates include `<figure>` / `<img>` / `<figcaption>` per page and a link to the full PDF under `/assets/pdfs/`.

### 🪞 Open Graph Image Generation

- `pnpm run generate-og-images` - Generate Open Graph images for posts and pages

**For authoring usage** (how to use `ogImage` in front matter, auto vs manual), see [authoring.md](authoring.md#open-graph-images).

This script automatically generates OG images (1200×630px) for all posts and pages using Puppeteer to render HTML templates with your site's styling. The images are saved to `src/assets/images/og/` and the `ogImage` field is automatically added to each file's frontmatter.

#### How It Works

1. **Scans** all posts in `src/_posts/`, Markdown pages anywhere under `src/`, and all `src/**/*.njk` outside `_posts`, `_includes`, `_data`, and `assets` (excluding portfolio items and pagination templates)
2. **Renders** each page's title, description, and date (if a post) using the `og-image.njk` template
3. **Generates** PNG images using Puppeteer (headless browser)
4. **Updates** frontmatter with the `ogImage` path
5. **Skips** regeneration if the image already exists and source data hasn't changed (incremental generation)

#### Image Template

The OG images use the `src/_includes/og-image.njk` template which includes:
- "Jon Plummer" branding
- Page title
- Description (if available)
- Date (for blog posts)
- Light mode styling using your site's CSS custom properties

#### Usage

**Automatic Generation**: OG images are now automatically generated:
- **During development**: When you save a post or page file, the image is automatically generated (via `eleventy.beforeWatch`)
- **Before deployment**: The deploy script automatically checks and generates any missing/outdated images

**Manual Generation**: You can also run the script manually:

```bash
pnpm run generate-og-images
```

The script will:
- Generate images for posts and pages that don't have them
- Regenerate images if the source file (title, description, date) has changed
- Regenerate images if `ogImage` is set in frontmatter but the image file doesn't exist
- Skip images that are up to date (incremental generation - typically <1 second if all up-to-date)
- Skip portfolio items (individual portfolio pieces don't need OG images)
- Skip files with manually set `ogImage` values only if the image file exists

**Force Regeneration**: To regenerate all images (useful after changing OG image styling):

```bash
pnpm run generate-og-images -- --force
```

The `--force` flag will:
- Regenerate all images, even if they exist and are up to date
- Override the skip logic for manually set `ogImage` values
- Useful when you've updated the `og-image.njk` template or CSS styling

#### Previewing Images

**Preview the template at: `http://localhost:8080/ogimages/`** — or open `_site/ogimages/index.html` from disk after a build; the main stylesheet and favicons use **relative** URLs so `file://` works at any output depth.

This preview page shows:
- Live examples of the OG image template with sample data
- A gallery of all generated OG images
- Links to the **color** and **font** static preview HTML under `scripts/` (relative links work when you open `_site/ogimages/index.html` from disk after `pnpm run build`; with dev-only browsing, open those files from the repo instead)

You can also preview generated images in other ways:

1. **Finder**: Browse `src/assets/images/og/` directly
2. **Dev Server**: Run `pnpm run dev` and visit individual images: `http://localhost:8080/assets/images/og/[filename].png`
3. **Build Output**: Images are copied to `_site/assets/images/og/` during build

**Note**: The preview page is excluded from deployment (it's for authoring only).

#### Customization

To customize the OG image design, edit `src/_includes/og-image.njk`. The template uses your site's CSS custom properties, so changes to colors, typography, and spacing will automatically be reflected in the generated images.

### ♿ Focus and Keyboard Audit

- `pnpm run focus-audit -- --base-url http://localhost:8080` - Sweep the keyboard focus order and run scripted component scenarios

This mechanizes the laborious parts of a manual accessibility audit: tabbing through
every page twice, screenshotting each stop, and comparing what changed. It is not a
test in `pnpm run test` — it needs a served site, takes about ten minutes, and its
output needs human judgment rather than a pass/fail exit code.

#### Prerequisites

A running site. Either `pnpm run dev` (port 8080) or any static server over `_site/`.
`file://` will not work — the scenarios exercise JavaScript that CSP and module
loading only permit over HTTP.

#### What it does

For each sampled page it Tabs forward to the end and backward to the start, and at
every stop records the accessible name and role, the element rectangle, whether the
element is clipped or off-screen, its position in document order, and the computed
focus styles. It then screenshots the page unfocused and focused, and compares the
two in HSL, per [ACT rule `oj04fd`](https://www.w3.org/WAI/standards-guidelines/act/rules/oj04fd/),
to establish that focusing the element visibly changed something.

Beyond the sweep, `scripts/focus-audit/jonplummer.config.js` defines scenarios that
drive individual components — the skip link, the figure lightbox, the content-warning
disclosure — and assert where focus lands after each keystroke.

#### Page selection

Sampling follows [WCAG-EM 2.0](https://www.w3.org/TR/WCAG-EM/) Step 3: a structured
sample of one page per distinct template, plus a random 10% drawn from `sitemap.xml`.
Pass `--seed <n>` to reproduce a previous run's random sample; the seed is recorded in
the output. Two pages are marked `sanityOnly` in the config — `/color/` and `/type/`
have so many controls that measuring visibility at each one would dominate the run, so
they get the sweep without the screenshots.

#### Output

Two files in `docs/designs/scratch/` (gitignored), dated by run:

- `YYYY-MM-DD-focus-keyboard-audit.json` — [EARL 1.0](https://www.w3.org/WAI/standards-guidelines/act/report/earl/)
  serialized as JSON-LD. The standard format, so other accessibility tooling can read
  it, and so runs diff against each other.
- `YYYY-MM-DD-focus-keyboard-audit.md` — the same evidence grouped by WCAG success
  criterion, for reading.

Outcomes use EARL's vocabulary. `earl:cantTell` means the tool could not decide and a
person or agent needs to rule on the evidence — divergence between focus order and
visual order, for instance, is often correct.

**A passing outcome is not a conformance claim.** ACT rules are informative, and ACT's
own mapping says all-passed means "needs further testing", never "supports". The
report deliberately emits no VPAT conformance levels; those are attestations for a
person to make.

#### Portability

Everything except `jonplummer.config.js` is site-agnostic. To audit a different site,
write a new config with its own structured sample and scenarios and pass its base URL.

### 🛡️ Security Audit

- `pnpm run security-audit` - Run security audit and maintenance checks

The security audit script performs periodic security and maintenance checks for the site. It automates checks where possible and provides a checklist of manual tasks.

#### Configuration

The script requires a `SITE_DOMAIN` environment variable for live site security checks (security headers, TLS certificate, DNS records). Add to your `.env` file:

```
SITE_DOMAIN=jonplummer.com
```

**Note**: `SITE_DOMAIN` is the public-facing domain name, not the SSH hostname. `DEPLOY_HOST` is used for deployment (SSH access), while `SITE_DOMAIN` is used for checking the live website. If `SITE_DOMAIN` is not set, the script defaults to `jonplummer.com`.

#### Automated Checks

The script automatically checks:
- **pnpm audit**: Scans for known vulnerabilities in dependencies
- **pnpm outdated**: Identifies packages that need updates
- **Node.js version**: Verifies you're using an LTS version (even-numbered versions: 18, 20, 22, etc.). This repo also declares **`engines.node` >= 22.18** (required by `cspell` 10.x); use that or newer for installs and `pnpm test spell`.
- **Deprecated packages**: Checks for deprecated pnpm packages
- **Environment variables**: Ensures `.env` is properly ignored by git
- **Package.json**: Validates configuration
- **Build output**: Scans `_site/` for sensitive files that shouldn't be deployed
- **File permissions**: Checks that sensitive files have appropriate permissions
- **Git history**: Verifies `.env` was never committed
- **Content Security Policy**: Validates CSP headers in `.htaccess`
- **Redirect security**: Reports redirect count (informational)
- **Third-party resources**: Identifies external scripts and stylesheets (informational)
- **Security headers**: Checks live site for required security headers (requires `SITE_DOMAIN`)
- **TLS certificate**: Verifies certificate expiration (requires `SITE_DOMAIN`)
- **DNS records**: Validates DNS A records (requires `SITE_DOMAIN`)

#### Manual Tasks Checklist

The script also provides a focused checklist of manual security tasks relevant to static sites:
- Updating dependencies (requires testing after updates)
- SSH key rotation
- Backup restore testing
- Hosting provider security notices review
- Full test suite execution

#### Usage

Run the audit periodically (e.g., monthly or before major deployments):

```bash
pnpm run security-audit
```

The script exits with:
- **Code 0**: All automated checks passed (warnings may still be present)
- **Code 1**: Failures found that need attention

See `scripts/security/security-audit.js` header comments for the complete list of security and maintenance tasks.

---

## ♻️ Periodic Maintenance

These tasks should be performed regularly, not as one-time work items.

### Focus and Keyboard Audit

- **Frequency**: After changes to navigation, interactive components, or focus styling; otherwise a few times a year
- **Command**: `pnpm run focus-audit -- --base-url http://localhost:8080` (with `pnpm run dev` running)
- **Tasks**:
  - Read the markdown report's Failures section first, then Needs judgment
  - Rule on each `earl:cantTell` using the recorded evidence
  - Move confirmed defects into [ideas.md](ideas.md)

### Security Audit

- **Frequency**: Monthly or before major deployments
- **Command**: `pnpm run security-audit`
- **Tasks**:
  - Run the security audit script
  - Review and address automated check results
  - Complete manual tasks checklist (dependency updates, SSH key rotation, backup restore testing, etc.)

See [Security Audit](#-security-audit) section above for detailed information about what the audit checks.
