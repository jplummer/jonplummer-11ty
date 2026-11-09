# Ideas

**Next** is what to work on now; **Later** is grouped by area. **Decided** records ideas dropped or kept as they are, with the reason, so they don't come back around. **Done** is one line each, and commit messages and the linked docs hold the detail. An entry that outgrows a short paragraph moves to its own doc under `docs/designs/`, linked from here.

## ☑️ Next

The site now leads with Jon's position: leadership, discovery, design, and prototyping where hardware and software meet (2026-11-08). What that implies for each page: [position doc](designs/specs/2026-11-08-hardware-software-position-design.md).

1. **Two-portfolio structure.** `/portfolio/` becomes the hardware-and-software portfolio. A second one for general UX Director roles is available but kept out of the nav. Write a short spec first covering front matter for which portfolio a piece belongs to, the two index pages and their hand-picked order, previous/next on pieces that are in both, the second portfolio's URL and shortlink, and `noindex` for it (undecided).
2. **Curate the hardware-and-software portfolio and write its intro.** Candidates and the framing MiniMed needs (important, but about 2013) are in the [position doc](designs/specs/2026-11-08-hardware-software-position-design.md#portfolio-and-the-second-portfolio).
3. **Bring the hardware side projects forward.**
   - Photos and write-ups that show the physical build for Usage-Chan and Parker, and a decision on whether they appear in the portfolio itself.
   - A hero image on project pages (2026-08-21). `side_detail.njk` has no image slot; `coverImage` only renders on the `/sides/` list card (`side_list_item.njk`). Adding one is layout work worth a short design pass: placement, crop behavior, and whether it borrows portfolio's subgrid (`article.portfolio-detail section { grid-template-columns: subgrid }`) or does something simpler, since `.side-detail` opted out of the generic article grid.
   - The platform badge and icons (2026-08-21). A `platform` front matter field ("iOS app," "macOS app," "Hardware") shown as a small badge next to `status` on the card and detail page, with small per-platform icons beside or in place of the text. Ship the field with the icons rather than doing the text version first and redoing it. The icons need assets or a mask treatment like the disclosure caret (`--icon-disclosure-caret-mask`), so they're a visual decision too.
   - `/sides` in the header nav. Today it's only in the footer.
4. **A patents piece** for the hardware-and-software portfolio: 18 families across IoT, networking, and medical devices, now only a link on `/about/`.
5. **Page copy for the position.** `/about/` first, with the reading-column change below, then `/now/`, the meta descriptions, and the person schema. Notes for each page are in the [position doc](designs/specs/2026-11-08-hardware-software-position-design.md).
   - Reading column for full-width pages (decided 2026-11-08). `/about/`, `/now/`, and the other `tags: page` pages get the indented, blog-post-style column; `/color/` and `/type/` stay full-width because they don't work in it. Jon especially wants this if it simplifies the site code, so look for layout rules that exist only to keep `tags: page` pages full-width and remove them instead of adding overrides. The footer half was settled 2026-08-21 by making the footer full-bleed everywhere ([nav restructure spec](designs/specs/2026-08-21-nav-restructure-design.md), Styling section).
6. **AI skills and routines as a `/sides/` category** (2026-08-21), for AI fluency that isn't app-shaped. These aren't apps: the legal page's per-project privacy framing (App Store data-practice disclosures) and the detail page's info block (App Store link, GitHub issues) assume shippable software. Brainstorm it briefly before the first entry goes up; it likely wants a lighter info block (source link, maybe a license) and no privacy subsection unless the skill handles data. Which skills can be shared is part of that, since the dotagents repo is private.
7. **Belkin talks and small artifacts.** These are hardware-and-software work, so they feed the main portfolio. The Belkin talks were partly swept, with work remaining (status per Jon, 2026-09-11).
8. **The general UX Director portfolio.** It's mostly today's set, plus the Invoca workflow builder and SDLC reinvention if Jon can show them. Concentric Sky talks belong here too: the portfolio has nothing from 2019–21, but Jon kept few files and the company no longer exists, so finding anything usable may take digging.
9. **Lead figures.** Essays Jon sends people and posts about hardware and software together go first.
   - **Keep backfilling essays with figures that carry the argument.** Seven essays have a `leadFigure` as of 2026-11-07. After those come the rest of this year's long posts (16 ran over 700 words) and popular long posts of any age. Style and rules: [lead figure spec](designs/specs/2026-10-29-lead-figure-style-design.md).
   - **Lead figure style improvements** largely via manual edits
   - **Whether and how OG cards use the lead figure** (low priority). One candidate keeps the dark card's title-first layout and lays the figure's silhouette along the bottom in low contrast. A mock on 2026-10-29 read fine at LinkedIn's ~128×72, but a landscape is the easy case; check it against diagrams that aren't.
   - **Lead figure for [Quality moves from specification to iteration](../src/_posts/2026/2026-06-19-quality-moves.md)** (parked 2026-11-08). Six rounds of drafts (B–F) haven't produced a direction Jon likes, so it's set aside while other essays get figures. Pick it back up with a fresh approach rather than another variation on F1–F4. Jon's requirements, the history of each round, and where the drafts page lives are in the [lead figures plan](designs/plans/2026-10-29-lead-figures.md).

## 🔮 Later

- **Homepage excerpts** (low priority). Revisit excerpts, or fewer posts per page, now that essays carry figures.

### Labs (`/color/`, `/type/`, `/ogimages/`)

- **One style-exploration tool** (2026-08-13). Replace the separate color and type labs with one tool whose selectors for type, spacing, and color scheme feed one realistic preview of the site. `/color/` and `/type/` keep working until it replaces them, and `generate-gallery.js` shouldn't be restructured before then. What exists, the constraints, and the open questions: [style-exploration doc](designs/specs/2026-08-13-style-exploration-design.md).
- **Custom color pickers in the gallery.** Bring back the former `/color/` custom hex controls (apply and reset) inside the generated gallery, so ad-hoc experiments don't need another page.

### Look and feel

- **Alternate color schemes**, and how to trigger them:
  - by build or deploy day
  - by the day of viewing, regardless of when the site was built
  - a random pick from a handful, per 24-hour session
  - a random pick from a handful, cookied, changing on reload
  - an animated color cycle over a long time scale
  - an animated color cycle triggered by `window.blur()`
- **An outlandish alternate stylesheet?**
- **Subtle texture in the overflow background (light mode)?**

### Layout and CSS

- **Modern CSS techniques to try**
  - Fluid typography with `clamp()`, so type scales smoothly across breakpoints ([modern-css.com](https://modern-css.com/fluid-typography-without-media-queries/))
  - Fluid spacing with `clamp()` for the gutter and spacing tokens
  - Container queries for the portfolio grid, so it responds to its container instead of the viewport
  - `color-mix()` to derive hover and active colors from the three base colors. `jonplummer.css` has none yet; the lab stylesheets use it for panel and border tints. Leaning no for now (2026-11-08): it's mainly a design question, whether links should show shades beyond the three lived colors, and the link buckets already state each hover color once. It would pay off with alternate color schemes, where a theme could set base colors and get the shades free; `test color-contrast` and the `/color/` exports would then need to evaluate `color-mix()`.

The November 2026 CSS audit is worked through; findings and decisions are in the [CSS audit doc](designs/specs/2026-11-03-css-audit-design.md).

### Tooling

- **Hand test results to the runner through a temp file** instead of stdout markers, which retires the truncation failure class. Worth doing (Jon, 2026-11-08) as long as the result stays easy to follow. What's done, what stays, and what's off the table: [test result handoff](designs/specs/2026-08-13-test-results-handoff-design.md).
- **Look at Bing Webmaster Tools' IndexNow report once.** It's the only place that shows whether submissions are acted on.

### Side projects (`/sides/`)

- **Covers for Menu Bar Death Clock and Plain English Service.** Both have no `coverImage` and no image in the body. Every other `/sides/` page has a cover, and the write-ups were thickened 2026-09-17. Both are paused, software-only Mac utilities, so they do little for the position.
- **Build-time changelog fetch** (2026-08-21). Each `/sides/<slug>/` page links out to the project's GitHub `CHANGELOG.md` or Releases. Once a project moves fast enough that visitors would want recent changes without leaving the site, pull its changelog at build time and render it on the page. Revisit when Pointer-AR or another project's pace makes the link-out feel thin.

### Portfolio

- **Link the capabilities deck from the site** once it exists: host the PDF with a two-character shortlink, and link it from `/about/`. Its cases should match portfolio pieces (problem, what Jon did, what changed).
- **Cloud fetch for presentation-to-portfolio** (deprioritized 2026-08-24). The local PDF + `.pptx` path works. Cloud fetch can wait: Google OAuth with PDF and PPTX export, Microsoft Graph download with Office PDF export, an optional batch input file, and an end-to-end run on real decks. Docs: [commands.md](commands.md#-pdf-page-conversion).

### Error pages

- **Use real logs to inform 404 handling** (deferred 2026-09-04). Volume is too low to be worth wiring up; revisit if misses grow enough to cluster. Ahrefs' site audit reports 404s. Check `src/_data/redirects.yaml` first, since a redirect solves a repeated real miss better than a guess.

### Reach and features

- **Preview external links**, as a progressive enhancement
- **POSSE**: more tags for different kinds of entries? [standard.site](https://standard.site)? Bluesky/AT bridging?

---

## Decided

### Keeping as is

- **IndexNow** (2026-11-08). Bing's index feeds DuckDuckGo, Yahoo, ChatGPT search, and Copilot, and it costs one request per deploy. The alternative, a sitemap ping, is gone: Bing switched anonymous pings off in December 2022, and Google's endpoint stopped working by January 2024.
- **OG card regeneration on save in dev** (2026-11-08). With the card digest, a save only re-renders a card whose title or label changed. Replacing Puppeteer with static SVG is out of scope, too large a loss of fidelity.
- **No `test og-images` check that each card is current** (2026-11-08). The build runs the generator before any output test, and the generator exits 1 on any failure, so a stale card can't reach a deploy.
- **The `/color/` gallery build stays in `eleventy.before`** (2026-11-08). It takes about 0.13s, the `--watch` loop it once caused is already prevented (`writeTextFileIfChanged`, the stable wild-theme RNG), and running it in the build keeps `/color/` in step with the live tokens. Revisit as part of the [style-exploration tool](designs/specs/2026-08-13-style-exploration-design.md).
- **The test runner's JSON and formatting layer** (2026-11-07). No move to `node --test`, no wholesale deletion, and no new output features (streaming progress, JUnit, `--filter`). Reasons in [test result handoff](designs/specs/2026-08-13-test-results-handoff-design.md#not-doing).
- **No `@layer`; the `body >` shell selectors stay** (2026-11-08). Unlayered CSS beats every layer, so layering `jonplummer.css` would let page stylesheets, the first-paint shell, and the `/color/` inline themes outrank it. Details in the [CSS audit doc](designs/specs/2026-11-03-css-audit-design.md#cascade-architecture--done-2026-11-08-without-layer).
- **Header lockup px tokens instead of `text-box`** (2026-11-07). `text-box` was exact in every case measured, but Firefox lacks it, so it would add about 15 lines behind `@supports` on top of the tokens instead of replacing them. Measurements in the [CSS audit doc](designs/specs/2026-11-03-css-audit-design.md#text-box-for-the-header-lockup--tried-2026-11-07-not-adopted).
- **No `font-synthesis: none`** (2026-11-07). The site loads only upright Libre Franklin, so italics are synthesized, and this rule would turn them upright.
- **CSS audit leftovers** (2026-11-07). The browser-support gaps (view transitions in Firefox, `::selection` on iOS, `orphans` in Firefox) need no action, and the remaining hard-coded colors are deliberate. Both are listed in the [CSS audit doc](designs/specs/2026-11-03-css-audit-design.md).

### Not doing

- **Limiting rsync uploads with the content-hash manifest** (2026-11-08). Transfer volume doesn't bother Jon; a full deploy runs about 32s end to end. Spec, if it comes back: [content-hash purge](designs/specs/2026-08-06-content-hash-cloudflare-purge-design.md).
- **A `/sides/` page for dotagents** (2026-11-08). The repo is private and holds career context, so there's nothing public to link.
- **Joining [aboutideasnow.com](https://aboutideasnow.com/)** (2026-11-08). Not much value for this site.
- **Colophon accessibility stats** (2026-08-24). `test color-contrast` and `test a11y` already cover the colophon.
- **Performance monitoring** (Lighthouse CLI, Ahrefs automation, DebugBear, Screpy, Auditzy, WebPageTest, Core Web Vitals, PageSpeed Insights). The site is static and text-first, so a monitoring and regression stack isn't worth it for now.
- **[llms.txt](https://llmstxt.org/)**. Low payoff for a text-first blog, since the spec targets doc-heavy sites. Skip `/llms.txt` and parallel `.md` URLs unless a concrete need appears.
- **[md-fixup](https://github.com/ttscoff/md-fixup)**. Good authoring tests should be enough.
- **Marking external links**. Nearly every link is external, and the text already treats them that way.
- **View transitions across layout breakpoints**. They'd likely be awkward and late when a resize crosses a breakpoint.
- **GitHub Actions** for building, validating, and uploading on push to main. That isn't how Jon uses GitHub yet.
- **Build and deploy monitoring**: notifications, success and failure tracking, rollback procedures, and regular backups of the generated site.

---

## Done

- Front matter read with gray-matter everywhere (2026-11-08) – one parser, the one Eleventy uses, for the OG generator, the gallery sort, and the tests. All 293 files parsed the same, and OG write-backs no longer drop blank lines after the front matter.
- Homepage feed merged once (2026-11-08) – `index.11tydata.js` merges each page's posts and links for both the list and the `/page/N/` title. The old code had hidden 41 of 204 links from every page; all now show.
- `markdownInline` merged into `smartquotes` (2026-11-08) – built output byte-identical.
- One deploy spinner (2026-11-08) – `runWithSpinner` in `spinner-utils.js` runs the changelog step and rsync, and `deploy.js` lost about 150 lines.
- `/ogimages/` examples from one list (2026-11-08) – six copies became one `asyncEach` loop.
- OG cards re-render only when what they show changes (2026-11-08) – each PNG carries a digest of its title, label, and the shared fingerprint, and `--stamp` records digests without rendering.
- IndexNow bounded by the sitemap (2026-11-08) – noindex pages like `/changelog/` stop going out, and deleted or renamed pages are submitted.
- Link colors as buckets (2026-11-08) – link-state selectors went from 25 to six, with no visible change. [Plan](designs/plans/2026-11-08-link-buckets-specificity.md), [CSS audit doc](designs/specs/2026-11-03-css-audit-design.md).
- Print stylesheet tidied (2026-11-07, leftovers 2026-11-08) – 14 `!important`s, down from 22, and six print bugs fixed, from forced A4 paper to URLs printed after self-links. [CSS audit doc](designs/specs/2026-11-03-css-audit-design.md).
- Test summary lines share one builder (2026-11-08) – no more "0 passing" beside warnings, and hand-run tests print a report instead of raw JSON. [Test result handoff](designs/specs/2026-08-13-test-results-handoff-design.md).
- Body text follows the reader's default text size (2026-11-07) – `body` used a 16px alias, so paragraphs ignored a raised browser default while headings grew. Pages are byte-identical at the default size.
- CSS audit cleanup (2026-11-07) – prefixes, `break-*`, `dvh`/`svh`, `:is()`, logical properties, `clip-path` hiding, spacing tokens, and three typography refinements. Stylelint now fails on vendor prefixes and deprecated properties. [CSS audit doc](designs/specs/2026-11-03-css-audit-design.md).
- Duplicate sitemap entries and noindex for tool pages (2026-10-16) – the sitemap writes tagged pages from one loop, and `noindex: true` keeps `/ogimages/`, `/readme/`, and `/changelog/` out of search and the sitemap. `test seo` fails on either regression.
- Permanent short links for QR and print (2026-10-02) – two-character slugs in `src/_data/shortlinks.yaml` become `.htaccess` 302s, with a CLI, a build test, and a live check on deploy. [Plan](designs/plans/2026-10-02-shortlinks.md).
- Cayuse Connect 2022 talks as portfolio items (2026-09-24) – both talks moved to the portfolio layout with covers, new intros, and slides captioned from the speaker notes.
- Thicker `/sides/` write-ups (2026-09-17 to 2026-09-22) – why and status copy for the death clock, Plain English, Lister, and prvt; Pointer-AR and Usage-Chan expanded.
- Discovery interview training portfolio piece (2026-09-11) – the two May 2022 Cayuse training decks as one piece of 43 captioned slides. Site only, not cross-posted.
- Book Map side project page (2026-09-10) – `/sides/book-map/` with the live map embedded. Tile licensing was rechecked, and it added the `Ready to deploy` status.
- Ideas list at the bottom of `/sides/` (2026-09-09) – unstarted ideas as markdown in `src/sides/index.njk`; `now.md` points there instead of keeping its own list.
- "Did you mean" suggester on `/404` (2026-09-07) – [spec](designs/specs/2026-09-04-404-suggester-design.md).
- `/sides/` pages for this site and Usage-Chan (2026-09-07) – the site's page covers the practical side of the build and leaves the why to `/colophon/`. Every project on `/now/` links to its `/sides/` page.
- Split repo license (2026-09-07) – MIT for code and CC BY-NC 4.0 for content. Robert Ullman's colophon portrait is licensed under neither, and the fonts keep their OFL terms.
- Colophon accuracy pass (2026-09-07) – three claims corrected against the CSS: where Big Shoulders is used, which color pairs APCA checks, and a "modular scale" that didn't exist.
- Wemo portfolio piece (2026-09-02) – rewritten around setup, rules people could say out loud, and the partnership, with visuals and a cover.
- Datto Secure Edge portfolio piece (2026-08-31) – rewritten, illustrated, and published.
- `/sides/` covers (2026-08-31) – Lister PHP, Parker, Pointer-AR, and PRVT, alongside Monotasker.
- Focus and keyboard audit (2026-08-15 to 2026-08-24) – `pnpm run focus-audit`. The first run made the lab previews `inert`, made the lightbox arrows `aria-disabled`, and gave controls a shared focus ring. [Spec](designs/specs/2026-08-13-focus-keyboard-audit-design.md).
- `/friends` page (2026-08-22) – a blogroll at `/friends/`, crediting slashfriends.org and Nick Gray.
- Portfolio grid thumbs (2026-08-13) – optional `coverPosition` and `coverZoom` front matter tune each card's crop. [Plan](designs/plans/2026-08-13-portfolio-cover-crop.md).
- Test runner presentation trimmed (2026-08-13) – `fast`, `all`, and `unit` run through one loop, and the test list comes from the manifest.
- Presentation to portfolio from a local PDF and `.pptx` – `pnpm run convert-presentation` captions slides from the deck's speaker notes.
- OG one-sheet cards and PNG basenames (2026-08-11) – cards matched the live page's field and type scale, and post card filenames come from the source filename instead of a UTC-shifted date.
- Three-color links and dark accent (2026-08-11) – links use only ink, quiet, and accent, and the dark accent became a cooler, denser red (`#ff888e`).
- Per-page lockup tagline (2026-08-10, home salt 2026-08-11) – each URL gets a tagline from `site.taglines` by hash, and the home page's changes with each deploy commit. [Spec](designs/specs/2026-08-11-home-tagline-deploy-salt-design.md).
- Libre Franklin body (2026-08-10) – replaced Public Sans, which had an en-dash kerning bug.
- Ink ladder quiet merge (2026-08-10) – one quiet ink for dim chrome, license, colophon, and visited links. [Plan](designs/plans/2026-08-10-ink-ladder-quiet-merge.md).
- Lean type ladder (2026-08-10) – six size tokens (quiet, base, lg, xl, 2xl, logotype) and three weights (light, semibold, bold).
- One-sheet layout and spacing ladder (2026-08-10) – no outer mat, and spacing tokens from `--spacing-xs` to `--spacing-4xl`, with `--gutter` for inline framing only.
- Colophon sketch credit as a quiet image credit (2026-08-10).
- No italics on the tagline and footer license (2026-08-10) – captions and blockquotes stay italic.
- Lockup tagline baseline nudge (2026-08-10) – `--site-lockup-tagline-baseline-nudge` lines the tagline up with the bottom of the mark.
- Icon system (2026-08-10) – one solid, sharp, right-angle vocabulary across the mark, the end-of-file square, the carets, the new-tab icon, and the lightbox close. [Spec](designs/specs/2026-08-10-lightbox-icon-system-design.md).
- Dropped the `/masthead/` lab, with no redirect (2026-08-10).
- MPA view transitions (2026-08) – `@view-transition { navigation: auto }`, off under reduced motion and when leaving the heavy `/color/` page.
- Content-hash Cloudflare purge (2026-08-07) – deploy purges only URLs whose built content changed or was deleted. [Spec](designs/specs/2026-08-06-content-hash-cloudflare-purge-design.md).
- JP mark header and OG lockup (2026-08-06) – [header lockup spec](designs/specs/2026-08-06-header-lockup-design.md), [OG lockup spec](designs/specs/2026-08-06-og-lockup-design.md).
- Safari-safe mark, root-absolute 404 assets, and colophon sketch theming (2026-08-06) – the header mark is inline SVG with `currentColor`, error pages use root-absolute asset URLs, and the colophon portrait has light and dark PNGs. [Spec](designs/specs/2026-08-06-mark-404-colophon-polish-design.md); its CSS invert approach was superseded.
- Reinvestigate color scheme (2026-03-28)
  - Live theme tokens use OKLCH in `src/assets/css/jonplummer.css` (`light-dark(oklch(...), ...)`). Gallery pipeline, `/color/`, `suggest-colors.js`, and contrast checking are documented in [color-theme-exploration.md](designs/color-theme-exploration.md) and the Maintenance bullets in [commands.md](commands.md).
  - Canceled or deferred: accessibility-test-script upgrades per [accessibility-test-limitations](archive/accessibility-test-limitations.md).
- Collected Wisdom: `wisdom-entries.yaml`, `/wisdom/`, per-tag pages, `/wisdom-feed.xml`, `test wisdom`, nav + sitemap; one-shot YAML generator removed in favor of editing YAML only (2026-03-25)
- Security, needlessly custom code, unused code, and bloat audit (2026-02-21)
  - Deduped extractCssCustomProperties, simplified dotenv loading, trimmed unused exports, added nunjucks as explicit dep
- REMINDER (2026-02-19): Is the stronger memory.mdc language working? – Yes, confirmed unprompted updates in recent sessions
- "content warning" way to hide text of out-of-norm posts (2026-02-11)
  - Implemented `contentWarning` frontmatter field with expandable `<details>` wrapper
- Verify `.cursor/rules/eleventy-debugging.mdc` is being used by Cursor (2026-02-10)
  - Rule has `alwaysApply: true` and is confirmed loaded in every conversation
  - Observed influencing agent behavior (assuming Eleventy works correctly, checking native capabilities first)
- Look for and quash needlessly custom code in favor of native eleventy capabilities or more direct custom code (2026-02-10)
  - Replaced ~180-line cheerio figure transform with ~80-line markdown-it plugin
  - Replaced redirect generation script + build event with a Nunjucks template using the data cascade
  - Fixed pre-existing image aspect ratio distortion (CSS `height: auto`)
  - Evaluated date handling, decided it's load-bearing and should not be simplified
- Make capturing links during the workday (from another machine) easier somehow (2026-01-21)
  - Implemented NotePlan import workflow with `pnpm run import-links`
  - Removed GitHub-based form approach
  - Automatic YAML formatting and duplicate detection
  - See docs/noteplan-import.md
- Reorganize legacy .cursorrules into Cursor's preferred user rules and Project-specific rules structure, commit to GitHub, and cache outside of project (2026-01-11)
- Explore codebase for deadwood (2026-01-11)
- Implement IndexNow support (2026-01-11)
- Refactor markdown renderer configuration - replaced HTML blocks with `{% portraitGrid %}` paired shortcode, eliminating need for preprocessor entirely (2026-01-11)
- Fix spellcheck and SEO test filtering - improved `--changed` flag behavior for spell and seo-meta tests (2026-01-11)
- Implement quick authoring-related tests just for new changes (2026-01-10)
- Fix spell checking, since it totally doesn't catch anything (2026-01-10)
- Fix spelling across site (2026-01-10)
- Address Dependabot and `pnpm audit` warnings (2026-01-06)
- Setup SSH access to GitHub from personal laptop (2026-01-06)
- pnpm vs npm (2026-01-05)
- Make color playground page with style switcher (2025-12-24)
- Watch for ahrefs improvement in image size complaints this weekend (it worked! ahrefs health score now 100 and steady) (2025-12-24)
- Address `test seo-meta` warnings (2025-12-24)
  - Catalog allowable exceptions and make the test be fine with those
- I make a lot of dumb spelling errors. Implement spell checking somehow (2025-12-23)
- Handle drafts (2025-12-22)
- gzip css (2025-12-22)
- handle "image too large" ahrefs feedback (2025-12-22)
  - Automate image optimization (see [https://www.aleksandrhovhannisyan.com/blog/eleventy-the-good-the-bad-and-the-possum/#5-it-has-an-excellent-image-plugin](https://www.aleksandrhovhannisyan.com/blog/eleventy-the-good-the-bad-and-the-possum/#5-it-has-an-excellent-image-plugin) and [https://bholmes.dev/blog/picture-perfect-image-optimization/](https://bholmes.dev/blog/picture-perfect-image-optimization/) )
- Watch ahrefs this weekend for "URL changed" errors; site health should be at or near 100 (2025-12-22)
- Fix timezone issues (reflect real authoring date as experienced; do not break incoming links by changing URLs for existing content) (2025-12-11; follow-up 2025-12-22)
- Typography improvements: modular scale, baseline grid, and print styles (2025-12-08)
- Add spinners to deploy script for lengthy operations (2025-12-08)
- Optimize deploy output and eliminate redundant builds (2025-12-07)
- Extract spinner frames to shared utility for easier experimentation (2025-12-07)
- Convert links-yaml test to unified format and clean up old format code (2025-12-07)
- Establish method for PDF-based portfolio post offering, to enable… (2025-12-07)
- Improve generated ogImage styling (2025-12-07)
- Improve ogImage index.png, which currently has redundant stuff in it (2025-12-07)
- Refactor redirects to use data-driven Apache 301 redirects (2025-12-06)
- Improve test output formatting and UX (2025-12-06)
- Fix npm audit vulnerabilities (2025-12-06)
- Refactor HEAD includes to eliminate redundancy and fix index page issues (2025-12-04)
- Update favicon setup to modern minimal standard (2025-12-04)
- Curly quotes (2025-12-04)
- Switch drafts from folder-based to frontmatter-based (2025-12-03)
- Modularize .eleventy.js configuration (2025-12-03)
- Add date range titles to paginated pages (2025-12-03)
- Fix horizontal scrollbar on narrow viewports for articles with code blocks (2025-12-03)
- Unify exit handling and summary printing across all scripts (2025-12-03)
- Expand Cayuse accomplishments portfolio piece
- Expand product trio portfolio piece
- Add Invoca interview presentation as portfolio piece
- Put descriptions on the main portfolio page (from item frontmatter)
- Make portfolio layout not depend on embedded HTML
  - markdown-it-attrs and markdown-it-container?
  - Custom shortcodes
- Portfolio image widths: full, 2/3, 1/3, smaller for mobile images
- Make sure margins etc are good in portfolio items, using blog posts as the example
- Fix sitemap pagination to only include existing pages (2025-11-30)
- Fix sitemap pagination, improve titles, and fix unescaped quotes (2025-11-30)
- Improve SEO validation for redirect pages and unescaped quotes (2025-11-30)
- Add SITE_DOMAIN environment variable for centralized domain configuration (2025-11-26)
- Security audit improvements and deployment fixes (2025-11-26)
- Enable smart quotes in markdown and titles (2025-11-26)
- Address `npm test rss-feed` issues (2025-11-26)
- Image optimization (2025-11-26)
- Refactor test suite and fix nested anchor issue (2025-11-26)
- Consolidate templates and utilities, fix test issues (2025-11-26)
- Security improvements: passwordless SSH, CSP hardening, dependency fixes (2025-11-25)
- Improve OG image styling and fix color issues (2025-11-24)
- Fix portfolio figure caption styling and update alt texts (2025-11-24)
- Convert post titles from Title Case to sentence case (2025-11-24)
- Implement comprehensive SEO and OG image generation (2025-11-23)
- Fix meta description validation and add missing descriptions (2025-11-22)
- Move h1 elements from content to template (2025-11-22)
- Convert error pages to Markdown and unify link underlining (2025-11-22)
- Add pre-deploy validation to prevent authoring mistakes (2025-11-22)
- Add portrait-grid utility for multi-column image layouts in portfolio details (2025-11-20)
- Implement dedicated portfolio detail layout with full-width images and siloed nav (2025-11-19)
- Implement image captions for portfolio items (2025-11-19)
- Implement responsive portfolio grid layout (2025-11-19)
- Standardize all portfolio images to use HTML figure syntax (2025-11-19)
- Add humans.txt and AI-blocking robots.txt (2025-11-19)
- Add AI agent instructions to README (2025-11-19)
- Reorganize project structure and improve documentation (2025-11-19)
- Move _misc to structured docs/ folder (2025-11-19)
- Move .htaccess to src/ so it gets copied to build (2025-11-19)
- Add schema.org structured data for SEO (Person, WebSite, BlogPosting) (2025-11-15)
- Add SEO meta descriptions to all posts (2025-11-15)
- Add links.yaml validation script (2025-11-15)
- Add post template for new blog posts (2025-11-15)
- Update color scheme to DR10 (2025-11-15)
- Add documentation maintenance scripts and reorganize project docs (2025-11-15)
- Add security headers to .htaccess (2025-11-01)
- Add 404 and 500 error pages with permalinks (2025-11-01)
- Add YAML validation to tests (2025-11-01)
- Fix YAML formatting in links.yaml (2025-11-01)
- Fix nested paragraphs in link descriptions (2025-11-01)
- Update link rendering to show newest links on page 1 (2025-11-01)
- Refactor HTML validation and test organization (2025-11-01)
- Clean up defunct capabilities and improve naming consistency (2025-11-01)
- Add _site to .gitignore and remove from git tracking (2025-11-01)
- Simplify link checking scripts and update notes formatting (2025-11-01)
- Add sitemap generation (2025-10-05)
- Fix feed issues (2025-10-05)
- Implement remaindered links feature (2025-10-05)
- Fixed post dates on individual post pages (2025-10-05)
- Vertical rhythm (2025-10-05)
- Refine test scripts (2025-10-05)
- Add active page highlighting to navigation (2025-10-04)
- Improve typographic hierarchy with letterspacing (2025-10-04)
- Meta descriptions and validation (2025-09-27)
- Added cursor rules file (2025-09-27)
- Redirect /feed/ (2025-09-20)
- Scripts; validation and deployment (2025-09-14)
- Tests (2025-09-14)
- Improved link checking (2025-09-14)
- SFTP → rsync migration (2025-09-14)
- Documentation cleanup (2025-09-14)
- Paging fixes (2025-09-14)
- Dark mode (2025-09-14)
- Site nav fixes (2025-09-13)
- Added aria-label (2025-09-13)
- Added sitemap (2025-09-13)
- Basic validation issues (2025-09-13)
- Pagination and single posts (2025-09-07)
- Index pagination (2025-09-06)
- Fixed some basic rendering issues that had lingered for too long (2025-09-01)
- Portfolio index loads items now (2025-09-01)
- Got rid of frontmatter rendering problems for main pages (2025-09-01)
- Basic typography and spacing for blog posts (2025-09-01)
- Building up templates and includes (2025-08-30)
- Added post and portfolio tags to posts (2025-08-30)
- Copied in images from wp.local project (2025-08-30)
- Reworked Posts structure (2025-08-30)
