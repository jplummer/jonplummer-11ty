# Ideas

## ☑️ Selected

- Side project pages — two things that clear the `sides/` bar and have no page there (2026-09-04)
  - **This site** — running, public, [source on GitHub](https://github.com/jplummer/jonplummer-11ty), and the most elaborate thing on the `now/` list: test suite, link posts, collected wisdom, OG pipeline, color and font labs. It is also the one project a visitor is already standing inside. Needs `src/sides/jonplummer-11ty.md` with `status`, `githubUrl`, a `coverImage`, and terms, same shape as the others. **Divide the labor with [`/colophon/`](../src/colophon.md)** so the two pages aren't about the same thing twice: the `sides/` page carries the practical stuff its siblings carry – what it does, status, source, terms – and links to `/colophon/` for the why, which is where the type, color, grid, and small-decisions material already lives and where the planned series about building the site is meant to be indexed. Then `src/now.md`'s "this site" bullet can follow the same pattern as Lister and prvt: name on the `sides/` page, GitHub as "(source)". Its "other features" link already points at `/colophon/`.
  - **Book map tool** — built for my wife to edit and export for her personal website; **not actually in use**, so say so in `status` rather than implying it is. The one project here that can be *previewed on its own page* — an embedded live sample or exported map beats a screenshot. Confirm with her before publishing anything of hers.
  - Both are already referenced in [`src/now.md`](../src/now.md); link them from there once the pages exist.

- Ideas list at the bottom of `sides/` — a durable home for unstarted ideas (2026-09-04)
  - **Why**: the unstarted ideas are signal about appetite, not inventory — the shape of problem that reliably catches me (physical objects that display one fact; small devices that do one thing at a time). `now/` throws that away every time it's rewritten, and a stub page in `sides/` for something with nothing to show would devalue the entries that are real. A short list under the built things reads as appetite rather than as a to-do list I'm failing.
  - **Where**: bottom of `src/sides/index.njk`, below the `.sides-grid`. Prose or a plain list, no per-project pages, no `sideproject` tag (it must not enter `collections.sideproject` or the grid).
  - **What moves there** from `src/now.md`'s "Still just ideas" paragraph: tee shirt design showcase site; eInk display that fetches the newspaper front page each morning; thermal-printer device that prints the morning's calendar and tasks. The physical ISS pointer stays with [Pointer-AR](../src/sides/pointer-ar.md) — it's the same project, not an idle idea.
  - **Two conditions, or it goes bad**: date each entry, so the list ages visibly and a shipped idea can say how long it waited; prune anything sitting a year without moving — delete, don't archive. The list's value is being short enough to read.
  - **Done already (2026-09-04)**: `now/`'s four status buckets are gone, and the unstarted ideas are one short "Still just ideas" paragraph rather than bullets carrying the same visual weight as Monotasker. Moving them off `now/` entirely is what's left.

- Craft/polish (demonstrate craft)
  - **Goal**: Make spareness read as intentional craft, not default blankness. Color is already pared-down; skip ornament (texture / alternate stylesheets stay in Future → Craft atmosphere). Vertical alignment is already in good shape — don’t chase “stronger grid” as a separate track unless something new looks off.
  - **Optional later:** widen L/R via gutter / max-width.
  - **Out of scope for this track**: overflow texture, outlandish alternate stylesheet (Future → Craft atmosphere).

- Portfolio
  - **Side projects** — The remaining portfolio gap. Covers exist for Lister PHP, Monotasker, Parker, Pointer-AR, and PRVT; **Menu Bar Death Clock** and **Plain English Service** still have no `coverImage` and no image in the body. Write-ups stay thin — roughly 230–310 words each apart from Parker — so the work is a stronger piece per project, not just one more image.
  - Look through /talks (current and old) for more talks, and evaluate for inclusion
    - Talks from Belkin
    - Small artifacts from Belkin
    - Talks from Invoca
    - Talks from CSky
    - Talks from Cayuse

## 🔮 Future Consideration

### Portfolio (deferred)

- **Presentation-to-portfolio automation (deprioritized 2026-08-24)** — Local PDF + `.pptx` path is DONE. Cloud fetch (Google OAuth + export PDF/PPTX, Microsoft Graph download + Office PDF export, optional batch input file) and e2e on real decks can wait. Docs: [commands.md](commands.md#-pdf-page-conversion).

### Deploy / Cloudflare

- **Rsync transfer volume via content-hash manifest** — Reuse `.cache/deploy-content-manifest.json` to limit rsync uploads (skip byte-identical HTML despite new mtimes) if transfer size/time still hurts. Spec: `docs/designs/specs/2026-08-06-content-hash-cloudflare-purge-design.md`.

### Utility / lab pages (color, type, OG) — “hidden in public”

- **One style-exploration capability** (2026-08-13) — Draw the separate labs into a single tool: **selectors + generators** for **type**, **spacing**, and **color scheme** (and whatever else earns a slot), feeding **one realistic preview** of the actual site rather than per-lab facsimiles. Today these are three unrelated pipelines: **`scripts/color-explore/generate-gallery.js`** (hue reference, DR presets, harmony lab with APCA nudge, B&W / wild / terminal combo cards) writing the **`/color/`** embed; **`scripts/font-explore/generate-font-gallery.js`** + **`/assets/js/font-lab-card.js`** behind **`/type/`**; and **`scripts/utils/preview-site-lockup.js`**, the shared build-time lockup facsimile both mini-previews use. **Spacing has no selector or generator at all yet** — that is new work, not consolidation. The "realistic preview" is the old full-page rehearsal idea: **`src/style-exercise.njk`** is the ancestor (still in **`.eleventyignore`**, **301** to **`/color/`**) and shows the shape — scoped tokens applied to a real page. **Hard constraint**: **`/color/`** and **`/type/`** must keep working in their current public form throughout; this is additive until the day it replaces them. **Sequencing consequence**: do **not** restructure **`generate-gallery.js`** (extracting its ~470-line runtime string literal, splitting modules) before this lands — that reorganizes something slated for redesign and pays twice. Fix the build/runtime **harmony recipe table** duplication (**`buildHarmonySchemes`** / **`pair()`** vs runtime **`linkDeltas`**) only if the drift actually bites first. **Kept on purpose (2026-09-04)**: **`src/style-exercise.njk`**, **`src/assets/css/style-exercise.css`**, and **`src/assets/js/color-lab.js`** are cruft today (the page is ignored, nothing else loads them, and the sibling nav they used is gone) but they are the closest thing to the realistic full-page preview this entry wants — reuse or delete them when the consolidation lands, not before. Open design questions: canonical **scheme IDs** shared across generators, exports, and preview URLs; whether selections are author-only or visitor-editable (see deferred bullet below). Background: **`docs/designs/scratch/complexity-grok4.6.md`** (item 1), **`complexity-opus5.md`** (Tier 3), **`complexity-composer2.5.md`** (item 1).
- **Shared UX pattern**: Color explorer and type explorer both target the **same full-page, full-size preview popout** idea (a dedicated **exercise page** that stresses site tokens and typography—not one “real” post that tries to cover everything). **`/color/`** already has **smaller in-page previews** in the gallery; **`/type/`** already embeds **`fontLabCard`** on the canonical page. Remaining gap vs color: optional **full-page type rehearsal** / popout parity (see **`/style-exercise/`** → **`/color/`** below).
- **`/type/`** — Font stack explorer at **`/type/`** (`/type/gallery/` redirects). **Still open**: pipe **`pnpm run font-gallery`** into embeddable markup or a build-time merge.
- **Thumbnails / browse grid**: Prefer **text + swatches** first; then try **live mini-previews** if performance and complexity stay acceptable.
- **URLs**: No **`/labs/`** prefix for now; keep **simple top-level paths** alongside other lightly public utilities (`/color/`, `/ogimages/`, etc.).
- **Color direction** (broader): **`/color/`** embed is **regenerated on each `pnpm run build` / `dev`** (`eleventy.before`); use **`pnpm run color-gallery`** for CLI flags / gitignored **`output/`**. DR presets live in the gallery as a **combo card** beside generated families. Generators follow the site **three-color** model (accent only; hover/active/visited paste as `var()` aliases). **Still open:** apply three-color **preview placement** rules to every gallery card (not only Default site); **canonical scheme IDs** across gallery export and preview URLs. **`/style-exercise/`** is **not built** for now (source kept as `src/style-exercise.njk`, listed in **`.eleventyignore`**); it **301 redirects to `/color/`**. **Full-page rehearsal** can return as a popout or by dropping the ignore entry later.
- **Quality bar for these pages**: Relaxed **SEO** expectations; **thumbnail accessibility** not a priority early on. **Production must not 404** for intentional visitors (build/CI should ensure artifacts exist or the page degrades gracefully with clear copy).
- **Deferred — authoring vs visitors “creating” schemes** (was interview Q5): Whether scheme tweaks are **author-only** (edit data, redeploy) vs **visitor-editable with persistence** is **out of scope until** this area stabilizes; revisit when the browse + popout story exists.
- **Color gallery — custom pickers**: Bring back the former `/color/` **custom hex color controls** (apply / reset) **inside** the generated color gallery UI so ad-hoc experiments do not require leaving the one canonical `/color/` page.

### Tooling simplification (complexity, not size)

Prioritized by **side-effect surface** — complexity that can produce a silently wrong result, not merely large files. Source audits: **`docs/designs/scratch/complexity-opus5.md`**, **`complexity-grok4.6.md`**, **`complexity-composer2.5.md`** (all 2026-08-13; all three flagged both items below).

- **Consolidate front-matter parsing on gray-matter** — **`scripts/utils/frontmatter-utils.js`** holds **two** parsers: **`parseMarkdownFrontMatter()`** (gray-matter, matches what Eleventy actually does) and **`parseFrontMatter()`** (regex split + js-yaml). Only **`test frontmatter`** uses the accurate one; roughly seven other call sites use the regex one — OG generation (**`generate-og-images.js`**), **`indexnow.js`**, **`test/spell.js`**, **`test/markdown.js`**, **`test/og-images.js`**, **`og-image-gallery-sort.js`**. **Why it matters**: two different truths about the same file. A post can satisfy the lenient regex parser — so tooling reports green — and still break the Eleventy build, which is the same failure class as the `seo --changed` gap fixed 2026-08-13. **Plan**: standardize on gray-matter everywhere scripts read posts/pages; keep **`reconstructFile()`** for OG writing `ogImage` back into front matter. **Expect fallout**: gray-matter throws where the regex parser shrugged, so budget time for genuinely malformed files surfacing. Verify with `pnpm run test fast` plus `pnpm run generate-og-images -- --force` (use `env -u PUPPETEER_CACHE_DIR` if Puppeteer can't find Chrome).
- **Simplify and harden test result parsing + output** — **`scripts/utils/test-results.js`** carries the result builder, **`formatVerbose`** / **`formatBuild`**, and the stdout marker protocol (**`__TEST_JSON_START__`** … **`__TEST_JSON_END__`**) that **`scripts/test-runner.js`** parses back. **Keep `writeSyncAll()`** — it fixes a real bug (a single `fs.writeSync` to a non-blocking pipe returns after ~64KB and drops the rest; internal-links hit it and aborted a deploy) and is guarded by `pnpm run test test-json-pipe`. **Candidates**: hand results to the parent via a **temp file** instead of stdout markers, which retires the truncation failure class rather than defending against it; collapse the duplicate summary formatting (**`buildSummaryString`** in the runner vs **`buildSummaryLine`** here); make direct runs consistent — **`test/color-contrast.js`** and **`test/accessibility.js`** call `outputResult` + `process.exit` directly instead of **`outputAndExit`**, so running them by hand dumps raw `__TEST_JSON_*` markers; drop **`formatVerbose`**'s unused `options` parameter and the externally-unused **`groupIssuesByType`** export. Dead **`printSummary`** / **`exitWithResults`** were removed separately (2026-08-13). **Explicit non-goal — do not re-propose**: replacing the runner with `node --test`, or deleting the aggregate JSON/formatting layer wholesale. That puts ~30 test scripts plus the deploy gate in the blast radius for no user-visible gain, and the IPC's complexity has a documented, test-guarded cause. Feature ideas for this area (streaming progress, JUnit output, `--filter`) live under **🖍 Also… → Test suite enhancements**; this entry is about robustness only.
- **Trim test runner presentation** — Collapse **`runFastTests` / `runAllTests` / `runUnitTests`** into one **`runTestGroup(label, ids)`** loop; derive **`all`** as **`fast` + a11y**; derive **`listTests()`** from the manifest. Verify: **`pnpm run test fast`**, **`pnpm run test unit`**, **`pnpm run test`**.
- **Homepage feed merge once** — **`src/index.njk`** and **`src/index.11tydata.js`** both hard-code page size **`5`** and both compute **`nextPageOldestDate`** (Nunjucks lines 12–21 vs JS lines 18–27) before calling **`mergePostsAndLinks`**. The list uses the filter in the template; **`computedTitle`** re-merges in **`eleventyComputed`** for paginated `<title>` date ranges. **Plan**: one **`eleventyComputed.mergedPageItems`** (or similar) that runs merge once per page; template iterates that; derive page size from **`pagination.size`** in front matter — never duplicate the literal **`5`**. **`mergePostsAndLinks`** itself stays — the interleaving is real domain logic. Verify: home + **`/page/N/`** titles still show correct date ranges; link clusters after newest post still appear on page 1 only (**`pageNumber === 0`** behavior in **`merge-posts-links.js`**).
- **Merge `smartquotes` / `markdownInline` filters** — **`eleventy/config/filters.js:69–85`**: both call **`md.renderInline()`**; **`smartquotes`** adds null guard + **`String()`** cast. Nine templates use **`smartquotes`**, three use **`markdownInline`** (link descriptions in **`links-feed.njk`**, **`link_item.njk`**). **Plan**: keep one name (probably **`smartquotes`**) with the guard; grep-replace the three **`markdownInline`** call sites; remove the duplicate registration. Verify: **`pnpm run test rss`**, spot-check link descriptions + titles on home and feed.
- **Deploy spinner dedupe** — **`scripts/deploy/deploy.js`**: **`runWithSpinner()`** (lines ~37–125) used only for changelog; rsync block (~169–256) reimplements spawn + spinner + stdout/stderr buffering. **Plan**: extend **`runWithSpinner`** (or shared helper in **`spinner-utils.js`**) to cover rsync's needs; delete the inline duplicate (~90 lines). Verify: **`pnpm run deploy --dry-run`** still shows spinners and rsync itemize output.
- **Template micro-dedupes** — Low-risk Nunjucks/CSS hygiene from complexity-opus5 Tier 2. (1) **`src/ogimages.njk:19–69`**: four nearly identical **`renderFile`** wrappers for OG examples — refactor to a **`for`** loop over example objects (PNG grid lower in the same file already loops correctly). (2) **`assetPrefix`** guard duplicated verbatim in **`src/_includes/head/meta_basic.njk:13`** and **`favicons.njk:3`** — extract **`_includes/head/asset_prefix.njk`** macro or include; **`test error-document-assets`** must still pass. (The unused **`.utility-page`** CSS went 2026-09-04 with the sibling nav.)
- **Decouple color gallery from `eleventy.before`** — **`eleventy/config/events.js:116–123`** runs full **`runColorGalleryBuild({ stableWildThemes: true })`** before every Eleventy invocation; defensive code (**`writeTextFileIfChanged`**, **`createStableRng`**, stable wild pack) exists because random wild themes + rewrite looped **`--watch`**. **Plan**: remove hook; run **`pnpm run color-gallery`** explicitly when **`jonplummer.css`**, gallery scripts, or embed partials change; commit regenerated **`color-gallery-embed-*`** artifacts (or document regen step in **`docs/commands.md`**). **Do not** split **`generate-gallery.js`** first — Future → utility/lab pages entry says that pays twice before the unified style-exploration redesign. Verify: **`pnpm run dev --watch`** stable on unrelated edits; **`/color/`** still builds in CI/deploy. **`eleventy/config/shortcodes.js`** error message references this hook — update if removed.
- **OG pipeline cleanup** — **`scripts/content/generate-og-images.js`** (~450 lines) runs outside Eleventy with its own Nunjucks env + duplicated **`postDate`** filter (lines 15–26); also triggered from **`eleventy.beforeWatch`** in **`events.js`**. **Plan (incremental)**: share filter source with Eleventy (RenderPlugin or require from **`eleventy/config/filters.js`** date helpers); consider dropping dev-watch regen for every save (mtime/`--force` only). **Out of scope for this entry**: replacing Puppeteer with static SVG — large fidelity tradeoff. Verify: **`pnpm run generate-og-images`**, **`pnpm run test og-images`**, deploy OG step unchanged.
- **OG freshness by content hash, not mtime** (2026-09-04) — **`needsRegeneration()`** decides staleness by comparing `fs.stat` mtimes: source file vs PNG, and each of **`OG_SHARED_DEPS`** vs PNG. Git does not record mtimes, so on a fresh clone every source file and shared dep gets checkout time and **every** OG image looks stale; conversely a PNG touched after a real content edit looks fresh and never refreshes. The shared-dep half is also all-or-nothing — one touch of **`jonplummer.css`** marks all ~207 images stale at once (observed 2026-09-04: 204 rendered, 18 actually differed, so the cost is wasted Puppeteer time rather than a bad deploy, since byte-identical output means git and rsync see nothing). **Plan**: hash the inputs that actually affect the render — `title`, `description`, `date`, plus the contents of the shared deps — and store the digest beside the image or in `.cache/`; regenerate when the digest changes. **`generateDataHash()`** was an earlier attempt at this and is already gone from the file. **Related**: `test og-images` checks that an `og:image` exists, not that it is current, so nothing catches staleness — worth deciding whether a freshness assertion belongs there or whether the hash makes it unnecessary. Background: the early-return bug fixed 2026-09-04, where a written-back `ogImage` path made every page look like a manual override and skipped the freshness check entirely.
- **IndexNow — simplify or remove (don't fix in place)** — Rewritten since this entry was filed: the git-diff filters, `.indexnow-state.json`, hand-rolled permalink mapping, and static-page allowlist are gone, replaced by the shared content-hash manifest (`scripts/utils/indexnow.js` + `scripts/test/indexnow.js`, now ~460 lines total; see `test manifest-cursors`). **What remains open** is the same question, minus the mess: it still runs on every deploy and in `test fast`, and it is still marginal on a personal blog that already ships **`sitemap.xml`** and RSS. Either **(A) replace** with one post-deploy sitemap submit, or **(B) remove** from deploy, tests, and docs.

### Nav / footer

- **Full-width `page` layouts vs. blog-post column alignment** (2026-08-21, footer portion resolved 2026-08-21) — Noticed while building the footer nav: `jonplummer.css`'s `.license` alignment rule (marked "Trial (easy revert)") indented the footer to match the article's 2fr column on blog index/post/portfolio pages, but stayed flush-left on full-width `tags: page` pages — always seemed a little odd. **Resolved for the footer**: rather than extending the indent to match, the footer is now always full-bleed and flush regardless of page type, and the old indent rule was deleted outright (see `docs/designs/specs/2026-08-21-nav-restructure-design.md`, Styling section). **Still open** for everything else: whether `main` content itself on full-width pages (`/about/`, `/now/`, `/color/`, `/type/`, etc.) should adopt the indented, blog-post-style column, except `/color/` and `/type/` which don't work well outside full-width. Undecided.

### Error pages (`/404`, `/500`)

- **"Did you mean" suggester on `/404`** (2026-09-04) — Nearly every 404 is a near-miss: a truncated URL, an old date-slug, a path typed from memory. Apache serves the ErrorDocument at whatever URL failed, so `location.pathname` holds the failed path in the browser. Build a small JSON index of every page's URL and title (roughly 295 pages, ~20KB raw), fuzzy-match the failed path against it from a same-origin script, and show the two or three closest hits above the recent-posts list. Degrades to the current page with JavaScript off. CSP already permits this (`script-src 'self'`, `connect-src 'self'` in `src/.htaccess.njk`); follow the same-origin script pattern in `src/assets/js/font-lab-card.js`, which exists because inline `<script>` is blocked. Interim substitute now shipping: the page asks the visitor to report the broken link by email.
- **Inform 404 handling with real logs (deferred 2026-09-04)** — Volume is too low to be worth wiring up. Revisit if misses grow enough to cluster. Ahrefs is connected and its site audit reports 404s; check `src/_data/redirects.yaml` first, since a repeated real miss is better solved by a redirect than by a guess.

### Side projects (`/sides/`)

- **Build-time changelog fetch** (2026-08-21) — `/sides/<slug>/` links out to each project's GitHub `CHANGELOG.md`/Releases for now (zero build machinery). Once a project is in active-enough development that visitors would benefit from seeing recent changes without leaving the site, pull the repo's changelog at build time and render it on the page instead of just linking. Revisit when Pointer-AR or another project's pace makes the link-out feel thin.
- **Platform/type badge** (2026-08-21) — A `platform` frontmatter field ("iOS app," "macOS app," "Hardware," etc.) shown as a small text badge next to `status` on the card and detail page. Cheap on its own (one field, one template line) — deliberately held so it lands together with the icon idea below rather than shipping the text version first and redoing it.
- **Platform icon set** (2026-08-21) — Small icons per platform (iOS, macOS, hardware, web) next to or replacing the text badge above. Needs actual icon assets or a mask-icon treatment like the existing disclosure-caret icon (`--icon-disclosure-caret-mask`) — a visual decision, not just data. Do this together with the platform badge field, not before it.
- **Hero/key image on individual project pages** (2026-08-21) — `side_detail.njk` has no image slot today; `coverImage` only renders on the `/sides/` list card (`side_list_item.njk`). Adding one to the detail page is real layout work — placement, crop behavior, whether it borrows portfolio's subgrid trick (`article.portfolio-detail section { grid-template-columns: subgrid }`) or does something simpler given `.side-detail` opted out of the generic article grid. Worth a short design pass, not a quick add.
- **AI skills/routines as a `/sides/` category** (2026-08-21) — Jon wants to eventually share personal AI skills and routines through the same `/sides/` scheme. These aren't apps: the legal page's per-project privacy framing (App Store data-practice disclosures) and the detail-page info block (App Store link, GitHub issues) are built around shippable software and probably don't fit skills/routines as-is. Needs its own short brainstorm before the first entry goes up — likely a lighter info block (source link, maybe a license) and no privacy-practice subsection unless the skill itself handles data.
- **Link `/now/` to `/sides/` once shipped** (2026-08-21) — `now.md`'s project bullets (Monotasker, Pointer-AR, the garage sensor, the menu bar clock) currently link straight to the App Store/GitHub or nowhere. Once `/sides/` is live, point each one at its `/sides/<slug>/` page instead, matching the cross-link already added from Monotasker's portfolio post.

### Craft atmosphere (deferred)

- Outlandish alternative stylesheet?
- Subtle texture in overflow background (light mode)?
- **Header lockup optical tokens → rem** (low priority, 2026-08-11) — Left as eye-tuned `px`; browser zoom is fine. Revisit rem conversion only if root-font-size / text-only zoom alignment becomes worth re-tuning. Notes in `jonplummer.css` + `2026-08-06-header-lockup-design.md`.

### 🖍 Also…

- Consider whether to participate in [https://aboutideasnow.com/](https://aboutideasnow.com/) (2026-08-21).
- [https://kagi.com/search?q=contemporary+blog+styling+2026](https://kagi.com/search?q=contemporary+blog+styling+2026) ?
- [https://github.com/steipete/agent-rules](https://github.com/steipete/agent-rules) ?
- [https://github.com/Invoca/prompt-library](https://github.com/Invoca/prompt-library) ?
- **Modern CSS techniques to consider**
  - Fluid typography with clamp() for smooth scaling across breakpoints (see [https://modern-css.com/fluid-typography-without-media-queries/](https://modern-css.com/fluid-typography-without-media-queries/))
  - Fluid spacing with clamp() for gutter/spacing tokens
  - Container queries for portfolio grid (respond to container width instead of viewport)
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
- **POSSE** (more tags for different types of entries? [https://standard.site](https://standard.site)? BSky/AT bridging?)
- **Test suite enhancements**
  - Enhanced progress indicators - Streaming JSON, real-time updates
  - formatTable() - Tabular format (maybe later)
  - formatJson() - Pretty-printed JSON (might be free since tests output JSON, but not needed initially)
  - Additional formats - HTML reports, etc.
  - Filtering and sorting - `--filter`, `--sort` flags
  - CI/CD integration - JUnit XML, GitHub Actions annotations, etc.

---

## MAYBE LET'S DON'T DO THESE

- **Colophon accessibility stats** — Site contrast (`test color-contrast`) and axe markup pass (`test a11y`) already cover the colophon; a separate colophon-specific accessibility page or stats block isn't worth building (canceled 2026-08-24).
- Performance/regressions — static text-first site; not worth a dedicated monitoring/regression stack for now
  - Lighthouse CLI ?
  - Automate/integrate ahrefs somehow ?
  - DebugBear
  - Screpy
  - Auditzy
  - webpagetest.org
  - Core Web Vitals
  - PageSpeed Insights
- [https://llmstxt.org/](https://llmstxt.org/) ? – low payoff for a text-first blog (spec targets doc-heavy sites); skip `/llms.txt` and parallel `.md` URLs unless a concrete need appears
- look into [https://github.com/ttscoff/md-fixup](https://github.com/ttscoff/md-fixup) ? – not needed, good authoring-oriented tests should be enough for now
- Signal external links (maybe not, the assumption is that 99.9% of links are external, and already written about as such)
- View transitions for smooth crossing of layout breakpoints (likely to be awkward and late when resize causes a breakpoint transition)
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
- Make `scripts/test/deploy.js` SSH commands use `spawn()` with array arguments instead of string concatenation — matches the pattern already used in `scripts/deploy/deploy.js` and is easier to read

---

## DONE

- **Wemo portfolio piece** (2026-09-02) — Rewritten around setup, rules people could say out loud, and the partnership story, with visuals throughout and a `coverImage` (`2022/12/wemo-nest-device-list.png`, `coverPosition: center top`). Closes the "add visuals" item.
- **Datto Secure Edge portfolio piece** (2026-08-31) — Rewritten, illustrated, and published; `draft: true` is gone and the piece carries a cover plus six figures. The unused LED responsibility figure was dropped rather than captioned.
- **`/sides/` covers** (2026-08-31) — Cover images added for Lister PHP, Parker, Pointer-AR, and PRVT alongside Monotasker's. Menu Bar Death Clock and Plain English Service are still uncovered — tracked under Selected → Portfolio → Side projects.
- **`/friends` page** (2026-08-22) — Blogroll-style page at `/friends/` (`src/friends.md`), shipped after the nav restructure reserved its footer slot; intro and list have since been tightened and the meta description and OG image regenerated. Credits slashfriends.org and Nick Gray.
- **Focus and keyboard navigation audit** (2026-08-15 through 2026-08-24) — Portable Puppeteer audit: `pnpm run focus-audit`; spec `docs/designs/specs/2026-08-13-focus-keyboard-audit-design.md`, plan `docs/designs/plans/2026-08-14-focus-keyboard-audit.md`, usage in [commands.md](commands.md#-focus-and-keyboard-audit). First run (seed 1): 1422 assertions over 13 pages. Shipped fixes: `/type/` and `/color/` preview facsimiles `inert`; lightbox arrows `aria-disabled` instead of `disabled`; shared control focus ring (`--focus-ring-*` on button/select/input/textarea/summary + skip link). Accepted gaps: `/color/` and `/type/` stay `sanityOnly` (control count); hover-vs-focus affordance rule deferred. Deliberate audit tooling — not in `test fast`.
- **Portfolio grid thumbs** (2026-08-13) — Optional `coverPosition` / `coverZoom` front matter; tuned on most existing posts (images unchanged except Goal Manager re-export to 16:9). More air above title (`--spacing-sm` thumb→title gap). One thumb+title link, hover underline, thumb stroke. Spec: `docs/designs/plans/2026-08-13-portfolio-cover-crop.md`. Guard: `pnpm run test portfolio-cover-crop`.
- **Presentation-to-portfolio (local PDF + PPTX)** — `pnpm run convert-presentation`; python-pptx notes via `extract-pptx-notes.py`; parser in `portfolio-notes.js`. Cloud fetch deferred (Future → Portfolio).
- **OG one-sheet cards + PNG basename rules** (2026-08-11) — OG HTML/PNGs match live one-sheet field and type scale (`--og-type-scale` from logotype/title/body tokens); soft content field; post PNG basenames from source `YYYY-MM-DD-*` filenames (not UTC-shifted front-matter dates). Light-theme extract accepts `var()` aliases. Guard: `pnpm run test og-image-filename`.
- **Libre Franklin body** (2026-08-10) — Replaced Public Sans (en-dash/space kerning bug). `@font-face` in `jonplummer.css`; `fonts.css` kept for OG extract. Spec notes in `docs/designs/font-stack-exploration.md`.
- **Three-color links + dark accent** (2026-08-11) — Lived ink / quiet / accent only: nav accent→ink; reading ink→accent + visited quiet; controls ink→accent; quiet chrome quiet→ink; logotype ink→accent; EOF square quiet. Dark accent `oklch(75.9% 0.1444 18deg)` (`#ff888e`) — cooler denser red vs pale brass; soft APCA ~Lc 56 (contrast test craft floor min 55 for that pair). `/color/` generate/APCA/paste aliases aligned; site default dark accent synced in gallery.
- **Ink ladder quiet-merge** (2026-08-10) — One quiet ink (`--text-color-light`) for dim chrome + license/colophon; `--link-visited-color: var(--text-color-light)`; `hr`/OG borders use `--border-color`; `strong`/`b` semibold. Contrast parser resolves simple `var(--token)` aliases. Link buckets finished under three-color pass. Plan: `2026-08-10-ink-ladder-quiet-merge.md`.
- **Lean type ladder** (2026-08-10) — Reading tokens: `--font-size-quiet` (light — license, credits, lab disclosures), `--font-size-base` (body + post `code`/`pre`), `--font-size-lg/xl/2xl` (h3/h2/h1), `--font-size-logotype`. Weights: light / semibold / bold only. Dropped h4–h6 rules and unused `xs`/`sm`/`md`/`2xs`/`3xl` / thin / black tokens. About recommender names plain `###`. Demo pop-out left-aligned.
- **One-sheet layout + spacing ladder + license align** (2026-08-10) — Dropped outer mat (`html`/`body` `--content-background-color`; header/main/footer transparent). Light field `oklch(98% 0 0deg)` (`#f8f8f8`). Spacing `--xs`…`--4xl`; `--gutter` = `--spacing-lg` for **inline only**; shell `padding-block` uses `--spacing-lg`. Below-only craft: header `--4xl`, posts `--3xl`, link-cluster seam `--2xl`. License left-aligns to article `section` column except on `tags: page` (incl. `/portfolio/` index). Optional later: widen measure via gutter/max-width. Semantic spacing aliases deferred.
- **MPA view transitions** (2026-08) — `@view-transition { navigation: auto }` in `jonplummer.css`; `navigation: none` under `prefers-reduced-motion` and on heavy `/color/` embed leave.
- Per-page lockup tagline rotation (2026-08-10; home salt 2026-08-11) — Pool in `site.taglines`; header uses `page.url | taglineForPage` (deterministic hash). Home (`/`) only is salted with `git rev-parse HEAD` so the lockup can change per deploy commit; other URLs stay URL-only. Expanding or reordering the pool reshuffles lockups sitewide once (accepted). Canonical `site.tagline` / `site.title` unchanged for `<title>`, OG, feeds. Spec: `docs/designs/specs/2026-08-11-home-tagline-deploy-salt-design.md`.
- Colophon sketch credit as quiet image credit (2026-08-10) — Under sketch; roman; `--font-size-quiet` / license-quiet color; not a peer label beside the portrait.
- Drop needless chrome italics on tagline + footer license (2026-08-10) — Captions, blockquotes keep italic.
- ~~Logo / logotype / tagline lockup~~ (2026-08-10) — Tagline baseline nudge vs mark bottom (`--site-lockup-tagline-baseline-nudge`).
- **Icon system** (2026-08-10) — Solid/sharp/right-angle vocabulary across JP mark, EOF square, filled disclosure caret (disclose-in-place + Show/Hide + `.site-disclosure`), open nav caret (exact 90° tip; pagination/post-nav/lightbox), new-tab, lightbox close × (square caps). Color/type preview facsimiles drop unicode arrows so CSS carets aren’t doubled. Spec: `2026-08-10-lightbox-icon-system-design.md`.
- Drop `/masthead/` Phase 3 lab with no redirect unless a 404 is needed later (2026-08-10)
- **Content-hash Cloudflare purge** (2026-08-07) — Local `_site` SHA-256 vs `.cache/deploy-content-manifest.json`; purge **changed ∪ deleted** only (skip **added** — new URLs never cached; same-path OG regen still purges). Credentials in `.env`; apex host. Spec/plan under `docs/designs/`. Later: rsync volume via same manifest (Future → Deploy).
- **JP mark header + OG lockup** (2026-08-06) — Mark + Semibold logotype; valid `.site-lockup` / `hgroup`; OG mark+wordmark (data-URI for Puppeteer). Favicons already use mark geometry. Specs: header-lockup + og-lockup.
- **Safari-safe mark, 404 root-absolute assets, colophon sketch theming** (2026-08-06; sketch path revised) — Inline SVG `currentColor` for header mark; ErrorDocument-safe absolute asset hrefs. Colophon portrait: light/dark PNGs via `<picture>` (no CSS invert; dark from lab `soft-white-fill-dimmer`). Spec: `2026-08-06-mark-404-colophon-polish-design.md` (invert was the original 3A sketch; live approach supersedes that part).
- Reinvestigate color scheme (2026-03-28)
  - Live theme tokens use **OKLCH** in `src/assets/css/jonplummer.css` (`light-dark(oklch(...), ...)`). Gallery pipeline, `/color/`, `suggest-colors.js`, and contrast checking are documented in [color-theme-exploration.md](designs/color-theme-exploration.md) and the Maintenance bullets in [commands.md](commands.md).
  - Archived intent: extra color inspiration (gallery, terminals, wild presets); OKLCH as the authoring space ([vivid colors / gamut](https://modern-css.com/vivid-colors-beyond-srgb/) as reference). **Canceled / deferred:** accessibility-test-script upgrades per [accessibility-test-limitations](archive/accessibility-test-limitations.md).
- Collected Wisdom: `wisdom-entries.yaml`, `/wisdom/`, per-tag pages, `/wisdom-feed.xml`, `test wisdom`, nav + sitemap; one-shot YAML generator removed in favor of editing YAML only (2026-03-25)
- Security, needlessly custom code, unused code, and bloat audit (2026-02-21)
  - Deduped extractCssCustomProperties, simplified dotenv loading, trimmed unused exports, added nunjucks as explicit dep
- **REMINDER (2026-02-19)**: Is the stronger memory.mdc language working? — Yes, confirmed unprompted updates in recent sessions
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
- Explore codebase for deadwood  (2026-01-11) 
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
- Typography improvements: modular scale, baseline grid, and print styles (2025-12-08)
- Add spinners to deploy script for lengthy operations (2025-12-08)
- Refactor redirects to use data-driven Apache 301 redirects (2025-12-06)
- Improve test output formatting and UX (2025-12-06)
- Fix npm audit vulnerabilities (2025-12-06)
- Handle drafts (2025-12-22)
- gzip css (2025-12-22)
- handle "image too large" ahrefs feedback (2025-12-22)
  - Automate image optimization (see [https://www.aleksandrhovhannisyan.com/blog/eleventy-the-good-the-bad-and-the-possum/#5-it-has-an-excellent-image-plugin](https://www.aleksandrhovhannisyan.com/blog/eleventy-the-good-the-bad-and-the-possum/#5-it-has-an-excellent-image-plugin) and [https://bholmes.dev/blog/picture-perfect-image-optimization/](https://bholmes.dev/blog/picture-perfect-image-optimization/) )
- Make portfolio layout not depend on embedded HTML
  - markdown-it-attrs and markdown-it-container?
  - Custom shortcodes
- Portfolio image widths: full, 2/3, 1/3, smaller for mobile images
- Make sure margins etc are good in portfolio items, using blog posts as the example
- Fix timezone issues (reflect real authoring date as experienced; do not break incoming links by changing URLs for existing content) (2025-12-11; follow-up 2025-12-22)
- Watch ahrefs this weekend for "URL changed" errors; site health should be at or near 100 (2025-12-22)
- Optimize deploy output and eliminate redundant builds (2025-12-07)
- Extract spinner frames to shared utility for easier experimentation (2025-12-07)
- Convert links-yaml test to unified format and clean up old format code (2025-12-07)
- Establish method for PDF-based portfolio post offering, to enable… (2025-12-07)
- Expand Cayuse accomplishments portfolio piece
- Expand product trio portfolio piece
- Add Invoca interview presentation as portfolio piece
- Put descriptions on the main portfolio page (from item frontmatter)
- Improve generated ogImage styling (2025-12-07)
- Improve ogImage index.png, which currently has redundant stuff in it (2025-12-07)
- Refactor HEAD includes to eliminate redundancy and fix index page issues (2025-12-04)
- Update favicon setup to modern minimal standard (2025-12-04)
- Curly quotes (2025-12-04)
- Switch drafts from folder-based to frontmatter-based (2025-12-03)
- Modularize .eleventy.js configuration (2025-12-03)
- Add date range titles to paginated pages (2025-12-03)
- Fix horizontal scrollbar on narrow viewports for articles with code blocks (2025-12-03)
- Unify exit handling and summary printing across all scripts (2025-12-03)
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
