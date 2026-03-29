# Ideas

## ☑️ Selected

- [ ] Portfolio
  - [ ] Presentation-to-portfolio automation (in progress — see notes below)
    - **Status**: Script drafted, not yet tested with real data
    - **What exists**: `scripts/content/convert-pdf-pages-with-notes.js` — accepts a PDF (visuals) and a text file (notes), generates markdown with figures and pre-populated figcaptions. Run via `npm run convert-pdf-with-notes`.
    - **Also done**: Bumped `convert-pdf` to 300 DPI for better image quality on retina screens.
    - **What we learned about notes export**:
      - Neither PowerPoint nor Google Slides has a clean "export notes only" feature
      - PPT "Outline/Plain Text" exports slide content, not notes
      - Google Slides plain text export includes all slide text, not just notes
      - Best options: (a) copy/paste notes into a text file with blank lines between slides, or (b) use a Google Apps Script to extract notes from Google Slides into a Google Doc
    - **Notes parser handles**: blank-line-separated notes, numbered format (`1: note text`), and sequential one-per-line
    - **Open questions**:
      - [ ] Test with a real presentation to see if the effort is low enough to actually use
      - [ ] Is copy/pasting notes into a text file tolerable, or does it need to be more automated?
      - [ ] Would a Google Apps Script for extracting notes be worth setting up?
  - [ ] Look through /talks (current and old) for more talks, and evaluate for inclusion
    - [ ] Talks from Belkin
    - [ ] Small artifacts from Belkin
    - [ ] Talks from Invoca
    - [ ] Talks from CSky
    - [ ] Talks from Cayuse

## 🔮 Future Consideration

### 🖍 Also…  

- https://kagi.com/search?q=contemporary+blog+styling+2026 ?

- https://github.com/steipete/agent-rules ?

- https://github.com/Invoca/prompt-library ?

- **Modern CSS techniques to consider**
  - Fluid typography with clamp() for smooth scaling across breakpoints (see https://modern-css.com/fluid-typography-without-media-queries/)
  - Fluid spacing with clamp() for gutter/spacing tokens
  - Container queries for portfolio grid (respond to container width instead of viewport)
  - View transitions for smooth page-to-page navigation
  - View transitions for smooth crossing of layout breakpoints
  - color-mix() to derive hover/active colors from base colors (pairs with oklch)

- **Alternate color schemes** and how to trigger them
  - According to build/deploy day?
  - Day of view regardless of when built?
  - Random selection from a handful of options, per 24h session?
  - Random selection from a handful of options, cookied, change on reload?
  - Animated color cycle over a long time scale?
  - Animated color cycle triggered by window.blur()?

- **Progressive enhancements**
  - Preview external links
  - ?

- **POSSE** (more tags for different types of entries? https://standard.site? BSky/AT bridging?)

- **Test suite enhancements**
  - Enhanced progress indicators - Streaming JSON, real-time updates
  - formatTable() - Tabular format (maybe later)
  - formatJson() - Pretty-printed JSON (might be free since tests output JSON, but not needed initially)
  - Additional formats - HTML reports, etc.
  - Filtering and sorting - `--filter`, `--sort` flags
  - CI/CD integration - JUnit XML, GitHub Actions annotations, etc.

- Make `scripts/test/deploy.js` SSH commands use `spawn()` with array arguments instead of string concatenation — matches the pattern already used in `scripts/deploy/deploy.js` and is easier to read

---

## MAYBE LET'S DON'T DO THESE

- Performance/regressions — static text-first site; not worth a dedicated monitoring/regression stack for now
  - Lighthouse CLI ?
  - Automate/integrate ahrefs somehow ?
  - DebugBear
  - Screpy
  - Auditzy
  - webpagetest.org
  - Core Web Vitals
  - PageSpeed Insights
- https://llmstxt.org/ ? – low payoff for a text-first blog (spec targets doc-heavy sites); skip `/llms.txt` and parallel `.md` URLs unless a concrete need appears
- look into https://github.com/ttscoff/md-fixup ? – not needed, good authoring-oriented tests should be enough for now
- Signal external links (maybe not, the assumption is that 99.9% of links are external, and already written about as such)
- **GitHub Actions** (This is not how I'm using GitHub just yet)
  - Automatic builds on push to main branch
  - Run 11ty build process
  - Validate generated HTML (using custom validation scripts)
  - Upload to hosting provider
- **Monitoring & Maintenance**
  - Set up build notifications
  - Monitor deployment success/failure
  - Implement rollback procedures
  - Regular backup of generated site

---

## DONE

- [x] Reinvestigate color scheme (2026-03-28)
  - Live theme tokens use **OKLCH** in `src/assets/css/jonplummer.css` (`light-dark(oklch(...), ...)`). Gallery pipeline, `/color-test/`, `suggest-colors.js`, and contrast checking are documented in [color-theme-exploration.md](color-theme-exploration.md) and the Maintenance bullets in [commands.md](commands.md).
  - Archived intent: extra color inspiration (gallery, terminals, wild presets); OKLCH as the authoring space ([vivid colors / gamut](https://modern-css.com/vivid-colors-beyond-srgb/) as reference). **Canceled / deferred:** accessibility-test-script upgrades per [accessibility-test-limitations](archive/accessibility-test-limitations.md).
- [x] Collected Wisdom: `wisdom-entries.yaml`, `/wisdom/`, per-tag pages, `/wisdom-feed.xml`, `test wisdom`, nav + sitemap; one-shot YAML generator removed in favor of editing YAML only (2026-03-25)
- [x] Security, needlessly custom code, unused code, and bloat audit (2026-02-21)
  - Deduped extractCssCustomProperties, simplified dotenv loading, trimmed unused exports, added nunjucks as explicit dep
- [x] **REMINDER (2026-02-19)**: Is the stronger memory.mdc language working? — Yes, confirmed unprompted updates in recent sessions
- [x] "content warning" way to hide text of out-of-norm posts (2026-02-11)
  - Implemented `contentWarning` frontmatter field with expandable `<details>` wrapper
- [x] Verify `.cursor/rules/eleventy-debugging.mdc` is being used by Cursor (2026-02-10)
  - Rule has `alwaysApply: true` and is confirmed loaded in every conversation
  - Observed influencing agent behavior (assuming Eleventy works correctly, checking native capabilities first)
- [x] Look for and quash needlessly custom code in favor of native eleventy capabilities or more direct custom code (2026-02-10)
  - Replaced ~180-line cheerio figure transform with ~80-line markdown-it plugin
  - Replaced redirect generation script + build event with a Nunjucks template using the data cascade
  - Fixed pre-existing image aspect ratio distortion (CSS `height: auto`)
  - Evaluated date handling, decided it's load-bearing and should not be simplified
- [x] Make capturing links during the workday (from another machine) easier somehow (2026-01-21)
  - Implemented NotePlan import workflow with `pnpm run import-links`
  - Removed GitHub-based form approach
  - Automatic YAML formatting and duplicate detection
  - See docs/noteplan-import.md
- [x] Reorganize legacy .cursorrules into Cursor's preferred user rules and Project-specific rules structure, commit to GitHub, and cache outside of project (2026-01-11)
- [x] Explore codebase for deadwood  (2026-01-11) 
- [x] Implement IndexNow support (2026-01-11)
- [x] Refactor markdown renderer configuration - replaced HTML blocks with `{% portraitGrid %}` paired shortcode, eliminating need for preprocessor entirely (2026-01-11)
- [x] Fix spellcheck and SEO test filtering - improved `--changed` flag behavior for spell and seo-meta tests (2026-01-11)
- [x] Implement quick authoring-related tests just for new changes (2026-01-10)
- [x] Fix spell checking, since it totally doesn't catch anything (2026-01-10)
- [x] Fix spelling across site (2026-01-10)
- [x] Address Dependabot and `pnpm audit` warnings (2026-01-06)
- [x] Setup SSH access to GitHub from personal laptop (2026-01-06)
- [x] pnpm vs npm (2026-01-05)
- [x] Make color playground page with style switcher (2025-12-24)
- [x] Watch for ahrefs improvement in image size complaints this weekend (it worked! ahrefs health score now 100 and steady) (2025-12-24)
- [x] Address `test seo-meta` warnings (2025-12-24)
  - [x] Catalog allowable exceptions and make the test be fine with those
- [x] I make a lot of dumb spelling errors. Implement spell checking somehow (2025-12-23)
- [x] Typography improvements: modular scale, baseline grid, and print styles (2025-12-08)
- [x] Add spinners to deploy script for lengthy operations (2025-12-08)
- [x] Refactor redirects to use data-driven Apache 301 redirects (2025-12-06)
- [x] Improve test output formatting and UX (2025-12-06)
- [x] Fix npm audit vulnerabilities (2025-12-06)
- [x] Handle drafts (2025-12-22)
- [x] gzip css (2025-12-22)
- [x] handle "image too large" ahrefs feedback (2025-12-22)
  - [x] Automate image optimization (see https://www.aleksandrhovhannisyan.com/blog/eleventy-the-good-the-bad-and-the-possum/#5-it-has-an-excellent-image-plugin and https://bholmes.dev/blog/picture-perfect-image-optimization/ )
- [x] Make portfolio layout not depend on embedded HTML
  - [x] markdown-it-attrs and markdown-it-container?
  - [x] Custom shortcodes
- [x] Portfolio image widths: full, 2/3, 1/3, smaller for mobile images
- [x] Make sure margins etc are good in portfolio items, using blog posts as the example
- [x] Fix timezone issues (going forward reflect real authoring date as I experienced it, but don't break incoming links by changing URLs to existing content) (2025-12-22)
- [x] Watch ahrefs this weekend for "URL changed" errors; site health should be at or near 100 (2025-12-22)
- [x] Optimize deploy output and eliminate redundant builds (2025-12-07)
- [x] Extract spinner frames to shared utility for easier experimentation (2025-12-07)
- [x] Convert links-yaml test to unified format and clean up old format code (2025-12-07)
- [x] Establish method for PDF-based portfolio post offering, to enable… (2025-12-07)
- [x] Expand Cayuse accomplishments portfolio piece
- [x] Expand product trio portfolio piece
- [x] Add Invoca interview presentation as portfolio piece
- [x] Put descriptions on the main portfolio page (from item frontmatter)
- [x] Improve generated ogImage styling (2025-12-07)
- [x] Improve ogImage index.png, which currently has redundant stuff in it (2025-12-07)
- [x] Refactor HEAD includes to eliminate redundancy and fix index page issues (2025-12-04)
- [x] Update favicon setup to modern minimal standard (2025-12-04)
- [x] Curly quotes (2025-12-04)
- [x] Switch drafts from folder-based to frontmatter-based (2025-12-03)
- [x] Modularize .eleventy.js configuration (2025-12-03)
- [x] Add date range titles to paginated pages (2025-12-03)
- [x] Fix horizontal scrollbar on narrow viewports for articles with code blocks (2025-12-03)
- [x] Unify exit handling and summary printing across all scripts (2025-12-03)
- [x] Fix sitemap pagination to only include existing pages (2025-11-30)
- [x] Fix sitemap pagination, improve titles, and fix unescaped quotes (2025-11-30)
- [x] Improve SEO validation for redirect pages and unescaped quotes (2025-11-30)
- [x] Fix timezone issues (relect real authoring date as I experienced it, but don't break incoming links by changing URLs to existing content) (2025-12-11)
- [x] Add SITE_DOMAIN environment variable for centralized domain configuration (2025-11-26)
- [x] Security audit improvements and deployment fixes (2025-11-26)
- [x] Enable smart quotes in markdown and titles (2025-11-26)
- [x] Address `npm test rss-feed` issues (2025-11-26)
- [x] Image optimization (2025-11-26)
- [x] Refactor test suite and fix nested anchor issue (2025-11-26)
- [x] Consolidate templates and utilities, fix test issues (2025-11-26)
- [x] Security improvements: passwordless SSH, CSP hardening, dependency fixes (2025-11-25)
- [x] Improve OG image styling and fix color issues (2025-11-24)
- [x] Fix portfolio figure caption styling and update alt texts (2025-11-24)
- [x] Convert post titles from Title Case to sentence case (2025-11-24)
- [x] Implement comprehensive SEO and OG image generation (2025-11-23)
- [x] Fix meta description validation and add missing descriptions (2025-11-22)
- [x] Move h1 elements from content to template (2025-11-22)
- [x] Convert error pages to Markdown and unify link underlining (2025-11-22)
- [x] Add pre-deploy validation to prevent authoring mistakes (2025-11-22)
- [x] Add portrait-grid utility for multi-column image layouts in portfolio details (2025-11-20)
- [x] Implement dedicated portfolio detail layout with full-width images and siloed nav (2025-11-19)
- [x] Implement image captions for portfolio items (2025-11-19)
- [x] Implement responsive portfolio grid layout (2025-11-19)
- [x] Standardize all portfolio images to use HTML figure syntax (2025-11-19)
- [x] Add humans.txt and AI-blocking robots.txt (2025-11-19)
- [x] Add AI agent instructions to README (2025-11-19)
- [x] Reorganize project structure and improve documentation (2025-11-19)
- [x] Move _misc to structured docs/ folder (2025-11-19)
- [x] Move .htaccess to src/ so it gets copied to build (2025-11-19)
- [x] Add schema.org structured data for SEO (Person, WebSite, BlogPosting) (2025-11-15)
- [x] Add SEO meta descriptions to all posts (2025-11-15)
- [x] Add links.yaml validation script (2025-11-15)
- [x] Add post template for new blog posts (2025-11-15)
- [x] Update color scheme to DR10 (2025-11-15)
- [x] Add documentation maintenance scripts and reorganize project docs (2025-11-15)
- [x] Add security headers to .htaccess (2025-11-01)
- [x] Add 404 and 500 error pages with permalinks (2025-11-01)
- [x] Add YAML validation to tests (2025-11-01)
- [x] Fix YAML formatting in links.yaml (2025-11-01)
- [x] Fix nested paragraphs in link descriptions (2025-11-01)
- [x] Update link rendering to show newest links on page 1 (2025-11-01)
- [x] Refactor HTML validation and test organization (2025-11-01)
- [x] Clean up defunct capabilities and improve naming consistency (2025-11-01)
- [x] Add _site to .gitignore and remove from git tracking (2025-11-01)
- [x] Simplify link checking scripts and update notes formatting (2025-11-01)
- [x] Add sitemap generation (2025-10-05)
- [x] Fix feed issues (2025-10-05)
- [x] Implement remaindered links feature (2025-10-05)
- [x] Fixed post dates on individual post pages (2025-10-05)
- [x] Vertical rhythm (2025-10-05)
- [x] Refine test scripts (2025-10-05)
- [x] Add active page highlighting to navigation (2025-10-04)
- [x] Improve typographic hierarchy with letterspacing (2025-10-04)
- [x] Meta descriptions and validation (2025-09-27)
- [x] Added cursor rules file (2025-09-27)
- [x] Redirect /feed/ (2025-09-20)
- [x] Scripts; validation and deployment (2025-09-14)
- [x] Tests (2025-09-14)
- [x] Improved link checking (2025-09-14)
- [x] SFTP → rsync migration (2025-09-14)
- [x] Documentation cleanup (2025-09-14)
- [x] Paging fixes (2025-09-14)
- [x] Dark mode (2025-09-14)
- [x] Site nav fixes (2025-09-13)
- [x] Added aria-label (2025-09-13)
- [x] Added sitemap (2025-09-13)
- [x] Basic validation issues (2025-09-13)
- [x] Pagination and single posts (2025-09-07)
- [x] Index pagination (2025-09-06)
- [x] Fixed some basic rendering issues that had lingered for too long (2025-09-01)
- [x] Portfolio index loads items now (2025-09-01)
- [x] Got rid of frontmatter rendering problems for main pages (2025-09-01)
- [x] Basic typography and spacing for blog posts (2025-09-01)
- [x] Building up templates and includes (2025-08-30)
- [x] Added post and portfolio tags to posts (2025-08-30)
- [x] Copied in images from wp.local project (2025-08-30)
- [x] Reworked Posts structure (2025-08-30)
