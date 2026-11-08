# Ideas

## ☑️ Selected

- Side project pages — one thing left that clears the `sides/` bar and has no page there (2026-09-04; **this site** shipped 2026-09-07, **Book Map** 2026-09-10, see DONE)
  - **dotagents** — `github.com/jplummer/dotagents`, the agent protocol every project on this machine reads (`~/.agents/protocol.md`, `communication.md`, `writing-rules.md`, `code-style.md`); Claude Code loads it through `~/.claude/CLAUDE.md`, and Cursor through a User Rule pointer plus the generated `.agents/rules/voice.mdc`. Committed 2026-09-03, so it is live and current, unlike `~/Projects/project-template` (last commit 2026-06-18), whose own README says the global rules moved out to dotagents. **Give dotagents the page and mention the template inside it** as the scaffold that consumes it — a page for the staler half would document the wrong thing. Needs `src/sides/dotagents.md` with `status`, `githubUrl`, terms, and a `coverImage`.
    - **Check what dotagents actually publishes before linking it from [`src/about.md`](../src/about.md)** — the local tree includes `about-me.md` and `memory.md` alongside the protocol files. Career context and cross-tool notes are fine to keep private; confirm what the public repo contains before pointing recruiters at it from the professional page.
  - Once that page exists, `about.md` can carry one clause in the "I don't just have opinions about AI" paragraph — a design leader whose own agent configuration is public and current is a specific, checkable claim, and a better version of the "including a project template that packages agent configuration…" phrase that came out of the hobbies sentence.
  - Once the page exists, mention and link it from [`src/now.md`](../src/now.md) and [`src/about.md`](../src/about.md). Neither file has ever named dotagents (checked 2026-10-24), so these are new mentions, not links added to existing ones.

- Portfolio
  - **Side projects** — The remaining portfolio gap. Covers exist for Lister PHP, Monotasker, Parker, Pointer-AR, and PRVT; **Menu Bar Death Clock** and **Plain English Service** still have no `coverImage` and no image in the body. The write-ups were thickened 2026-09-17 and now run about 330–580 words, with Monotasker the short one at about 270 (it has its own blog post), so covers are what's left.
  - Look through /talks (current and old) for more talks, and evaluate for inclusion. Status per Jon, 2026-09-11:
    - **Cayuse – done.** The two "discovery interview training" decks published as one portfolio piece, and the two Cayuse Connect 2022 conference talks went up as portfolio items 2026-09-24 (see DONE).
    - **Invoca — swept.**
    - Talks from Belkin — partially swept, real work remains
    - Small artifacts from Belkin
    - **Talks from CSky (Concentric Sky) — worth a look.** Genuinely thin in the portfolio already, but Jon doesn't retain many files from there and the company no longer exists, so source material is scattered; may take real digging to find anything usable.

## 🔮 Future Consideration

### Portfolio (deferred)

- **Presentation-to-portfolio automation (deprioritized 2026-08-24)** — Local PDF + `.pptx` path is DONE. Cloud fetch (Google OAuth + export PDF/PPTX, Microsoft Graph download + Office PDF export, optional batch input file) and e2e on real decks can wait. Docs: [commands.md](commands.md#-pdf-page-conversion).

### Deploy / Cloudflare

- **Rsync transfer volume via content-hash manifest** — Reuse `.cache/deploy-content-manifest.json` to limit rsync uploads (skip byte-identical HTML despite new mtimes) if transfer size/time still hurts. Spec: `docs/designs/specs/2026-08-06-content-hash-cloudflare-purge-design.md`.

### Utility / lab pages (color, type, OG) — “hidden in public”

- **One style-exploration capability** (2026-08-13) — Draw the separate labs into a single tool: **selectors + generators** for **type**, **spacing**, and **color scheme** (and whatever else earns a slot), feeding **one realistic preview** of the actual site rather than per-lab facsimiles. Today these are three unrelated pipelines: **`scripts/color-explore/generate-gallery.js`** (hue reference, DR presets, harmony lab with APCA nudge, B&W / wild / terminal combo cards) writing the **`/color/`** embed; **`scripts/font-explore/generate-font-gallery.js`** + **`/assets/js/font-lab-card.js`** behind **`/type/`**; and **`scripts/utils/preview-site-lockup.js`**, the shared build-time lockup facsimile both mini-previews use. **Spacing has no selector or generator at all yet** — that is new work, not consolidation. The "realistic preview" is the old full-page rehearsal idea: **`src/style-exercise.njk`** is the ancestor (still in **`.eleventyignore`**, **301** to **`/color/`**) and shows the shape — scoped tokens applied to a real page. **Hard constraint**: **`/color/`** and **`/type/`** must keep working in their current public form throughout; this is additive until the day it replaces them. **Sequencing consequence**: do **not** restructure **`generate-gallery.js`** (extracting its ~470-line runtime string literal, splitting modules) before this lands — that reorganizes something slated for redesign and pays twice. Fix the build/runtime **harmony recipe table** duplication (**`buildHarmonySchemes`** / **`pair()`** vs runtime **`linkDeltas`**) only if the drift actually bites first. **Kept on purpose (2026-09-04)**: **`src/style-exercise.njk`**, **`src/assets/css/style-exercise.css`**, and **`src/assets/js/color-lab.js`** are cruft today (the page is ignored, nothing else loads them, and the sibling nav they used is gone) but they are the closest thing to the realistic full-page preview this entry wants — reuse or delete them when the consolidation lands, not before. Open design questions: canonical **scheme IDs** shared across generators, exports, and preview URLs; whether selections are author-only or visitor-editable (see deferred bullet below). **Settled along the way** (folded in from older bullets, 2026-11-07): the preview is a dedicated exercise page that stresses the site's tokens and type, not one real post stretched to cover everything; browse thumbnails start as text plus swatches, with live mini-previews only if they stay cheap; paths stay top-level (`/color/`, `/type/`, `/ogimages/`) with no `/labs/` prefix; SEO expectations are relaxed, but an intentional visitor must never hit a 404, so the build makes sure the artifacts exist or the page says plainly what's missing. **Still open on the color side**: apply the three-color preview placement rules to every gallery card, not only Default site. Background: **`docs/designs/scratch/complexity-grok4.6.md`** (item 1), **`complexity-opus5.md`** (Tier 3), **`complexity-composer2.5.md`** (item 1).
- **Deferred — authoring vs visitors “creating” schemes** (was interview Q5): Whether scheme tweaks are **author-only** (edit data, redeploy) vs **visitor-editable with persistence** is **out of scope until** this area stabilizes; revisit when the browse + popout story exists.
- **Color gallery — custom pickers**: Bring back the former `/color/` **custom hex color controls** (apply / reset) **inside** the generated color gallery UI so ad-hoc experiments do not require leaving the one canonical `/color/` page.

### Tooling simplification (complexity, not size)

Prioritized by **side-effect surface** — complexity that can produce a silently wrong result, not merely large files. Source audits: **`docs/designs/scratch/complexity-opus5.md`**, **`complexity-grok4.6.md`**, **`complexity-composer2.5.md`** (all 2026-08-13; all three flagged both items below).

- **Consolidate front-matter parsing on gray-matter** — **`scripts/utils/frontmatter-utils.js`** holds **two** parsers: **`parseMarkdownFrontMatter()`** (gray-matter, matches what Eleventy actually does) and **`parseFrontMatter()`** (regex split + js-yaml). Only **`test frontmatter`** uses the accurate one; six other files use the regex one (checked 2026-11-07): **`generate-og-images.js`**, **`og-image-gallery-sort.js`**, **`test/spell.js`**, **`test/markdown.js`**, **`test/og-images.js`**, and **`test/og-card.js`**. **Why it matters**: two different truths about the same file. A post can satisfy the lenient regex parser — so tooling reports green — and still break the Eleventy build, which is the same failure class as the `seo --changed` gap fixed 2026-08-13. **Plan**: standardize on gray-matter everywhere scripts read posts/pages; keep **`reconstructFile()`** for OG writing `ogImage` back into front matter. **Expect fallout**: gray-matter throws where the regex parser shrugged, so budget time for genuinely malformed files surfacing. Verify with `pnpm run test fast` plus `pnpm run generate-og-images -- --force` (use `env -u PUPPETEER_CACHE_DIR` if Puppeteer can't find Chrome).
- **Simplify and harden test result parsing + output** — **`scripts/utils/test-results.js`** carries the result builder, **`formatVerbose`** / **`formatBuild`**, and the stdout marker protocol (**`__TEST_JSON_START__`** … **`__TEST_JSON_END__`**) that **`scripts/test-runner.js`** parses back. **Keep `writeSyncAll()`** — it fixes a real bug (a single `fs.writeSync` to a non-blocking pipe returns after ~64KB and drops the rest; internal-links hit it and aborted a deploy) and is guarded by `pnpm run test test-json-pipe`. **Candidates**: hand results to the parent via a **temp file** instead of stdout markers, which retires the truncation failure class rather than defending against it; collapse the duplicate summary formatting (**`buildSummaryString`** in the runner vs **`buildSummaryLine`** here); and, done 2026-11-08, **`test/color-contrast.js`** and **`test/accessibility.js`** now call **`outputAndExit`**, so running them by hand prints the formatted report instead of raw `__TEST_JSON_*` markers, and **`formatVerbose`**'s unused `options` parameter and the unused **`groupIssuesByType`** export are gone. Dead **`printSummary`** / **`exitWithResults`** were removed separately (2026-08-13). **Explicit non-goal — do not re-propose**: replacing the runner with `node --test`, or deleting the aggregate JSON/formatting layer wholesale. That puts ~30 test scripts plus the deploy gate in the blast radius for no user-visible gain, and the IPC's complexity has a documented, test-guarded cause. Feature ideas for this area (streaming progress, JUnit output, `--filter`) were dropped 2026-11-07; this entry is about robustness only.
- ~~**Homepage feed merge once**~~ – done 2026-11-08. **`index.11tydata.js`** merges each page's posts and links once (**`eleventyComputed.pageItems`**); **`index.njk`** loops over it and **`computedTitle`** reads it. The page boundary comes from Eleventy's **`pagination.pages`**, so the literal **`5`** and the re-sorted collection are gone. That turned up a bug: both copies passed the current page's own last post as the boundary instead of the next page's first post, so every link dated between two pages showed on neither. 41 of 204 links were missing from the homepage and **`/page/N/`**; all 204 now show, each once and on the right page, and four **`/page/N/`** titles widened to include them. The refactor alone built identical pages apart from blank lines.
- ~~**Merge `smartquotes` / `markdownInline` filters**~~ – done 2026-11-08. The three `markdownInline` call sites (link descriptions in `links-feed.njk` and `link_item.njk`) use `smartquotes`, and the duplicate is gone. Its comment now says what it does: inline markdown with typographer rules, piped through `striptags` where a title needs plain text. Built output was byte-identical.
- ~~**Deploy spinner dedupe**~~ – done 2026-11-08. **`runWithSpinner`** moved to **`scripts/utils/spinner-utils.js`**, takes an argv array and the stream to draw on, and resolves the exit code with both buffered streams, so the caller decides what a failure prints. The changelog step and rsync both use it, and **`deploy.js`** lost about 150 lines. A dry-run deploy showed both spinners and the itemized listing; one pointed at a nonexistent host printed rsync's errors, the exit code, and **Deploy failed**, as before. **`test deploy-guards`** now runs the helper and fails if **`deploy.js`** spawns a process itself.
- ~~**Template micro-dedupe in `/ogimages/`**~~ – done 2026-11-08. The six examples are one list and one `asyncEach` loop (`renderFile` is async, so a plain `for` won't do). The page's markup was identical apart from blank lines. Editing the template re-rendered its own card through the per-page mtime check below, so the committed PNG was restored.
- **Decouple color gallery from `eleventy.before`** — **`eleventy/config/events.js:116–123`** runs full **`runColorGalleryBuild({ stableWildThemes: true })`** before every Eleventy invocation; defensive code (**`writeTextFileIfChanged`**, **`createStableRng`**, stable wild pack) exists because random wild themes + rewrite looped **`--watch`**. **Plan**: remove hook; run **`pnpm run color-gallery`** explicitly when **`jonplummer.css`**, gallery scripts, or embed partials change; commit regenerated **`color-gallery-embed-*`** artifacts (or document regen step in **`docs/commands.md`**). **Do not** split **`generate-gallery.js`** first — Future → utility/lab pages entry says that pays twice before the unified style-exploration redesign. Verify: **`pnpm run dev --watch`** stable on unrelated edits; **`/color/`** still builds in CI/deploy. **`eleventy/config/shortcodes.js`** error message references this hook — update if removed.
- ~~**OG regeneration on every save in dev**~~ – settled 2026-11-08: keep it. **`eleventy.beforeWatch`** in **`events.js`** still runs the generator for each saved post or page, but with the card digest (next entry) a save only re-renders a card whose title or label changed. The other half of this entry, the duplicated **`postDate`** filter, is fixed: the generator now uses the shared **`formatPostDate`**. **Out of scope**: replacing Puppeteer with static SVG, a large fidelity tradeoff. Verify: **`pnpm run generate-og-images`**, **`pnpm run test og-images`**, deploy OG step unchanged.
- ~~**OG freshness by content hash, not mtime**~~ – done 2026-11-08, without a stored digest file: each PNG carries the digest of what it was rendered from (title, label, whether the label is a path, and the shared fingerprint) in a PNG text chunk, written by **`scripts/utils/og-card-digest.js`**. The generator re-renders only when it no longer matches, so body edits, re-saves, and fresh clones never re-issue a card; **`.cache/og-shared-fingerprint.json`** is gone. **`--stamp`** records digests without rendering, for render-code edits that don't change how cards look; all 256 cards were stamped that way, after a forced re-render earlier the same day matched them within 1/255. Tested by **`pnpm run test og-card-digest`**. The original entry: The shared half shipped: **`og-shared-fingerprint.js`** hashes the tokens, fonts, templates, mark, site data, and render code, so a CSS edit outside `:root` no longer re-renders all ~207 cards. The per-page half is still mtime: **`needsRegeneration()`** compares the source file's `fs.stat` mtime against the PNG's. Git doesn't record mtimes, so on a fresh clone every card looks stale, and a PNG touched after a real content edit looks fresh and never refreshes. **Plan**: hash the per-page inputs that affect the render (`title`, `description`, `date`, label) and store the digest in `.cache/` beside the shared fingerprint; regenerate when it changes. **Related**: `test og-images` checks that an `og:image` exists, not that it is current. Once the hash exists, decide whether a freshness assertion belongs there.
- ~~**IndexNow — simplify or remove**~~ – kept 2026-11-08. Bing's index feeds DuckDuckGo, Yahoo, ChatGPT search, and Copilot, the running cost is one request per deploy, and the alternative this entry offered, a sitemap ping, no longer exists: Bing announced the end of anonymous sitemap pings in May 2022 and switched them off that December, and Google announced its retirement in June 2023 and its endpoint stopped working by January 2024. Fixed the same day: submissions are bounded by the built **`sitemap.xml`**, so noindex pages stop going out (every deploy had been submitting **`/changelog/`**), and pages that join or leave the sitemap are submitted, which covers deleted and renamed posts as the IndexNow spec asks. The state file records the sitemap it was submitted against. Worth a one-time look: Bing Webmaster Tools' IndexNow report, the only place that shows whether submissions are acted on.

### Nav / footer

- **Full-width `page` layouts vs. blog-post column alignment** (2026-08-21, footer portion resolved 2026-08-21) — Noticed while building the footer nav: `jonplummer.css`'s `.license` alignment rule (marked "Trial (easy revert)") indented the footer to match the article's 2fr column on blog index/post/portfolio pages, but stayed flush-left on full-width `tags: page` pages — always seemed a little odd. **Resolved for the footer**: rather than extending the indent to match, the footer is now always full-bleed and flush regardless of page type, and the old indent rule was deleted outright (see `docs/designs/specs/2026-08-21-nav-restructure-design.md`, Styling section). **Still open** for everything else: whether `main` content itself on full-width pages (`/about/`, `/now/`, `/color/`, `/type/`, etc.) should adopt the indented, blog-post-style column, except `/color/` and `/type/` which don't work well outside full-width. Undecided.

### Error pages (`/404`, `/500`)

- **Inform 404 handling with real logs (deferred 2026-09-04)** — Volume is too low to be worth wiring up. Revisit if misses grow enough to cluster. Ahrefs is connected and its site audit reports 404s; check `src/_data/redirects.yaml` first, since a repeated real miss is better solved by a redirect than by a guess.

### Side projects (`/sides/`)

- **Build-time changelog fetch** (2026-08-21) — `/sides/<slug>/` links out to each project's GitHub `CHANGELOG.md`/Releases for now (zero build machinery). Once a project is in active-enough development that visitors would benefit from seeing recent changes without leaving the site, pull the repo's changelog at build time and render it on the page instead of just linking. Revisit when Pointer-AR or another project's pace makes the link-out feel thin.
- **Platform/type badge** (2026-08-21) — A `platform` frontmatter field ("iOS app," "macOS app," "Hardware," etc.) shown as a small text badge next to `status` on the card and detail page. Cheap on its own (one field, one template line) — deliberately held so it lands together with the icon idea below rather than shipping the text version first and redoing it.
- **Platform icon set** (2026-08-21) — Small icons per platform (iOS, macOS, hardware, web) next to or replacing the text badge above. Needs actual icon assets or a mask-icon treatment like the existing disclosure-caret icon (`--icon-disclosure-caret-mask`) — a visual decision, not just data. Do this together with the platform badge field, not before it.
- **Hero/key image on individual project pages** (2026-08-21) — `side_detail.njk` has no image slot today; `coverImage` only renders on the `/sides/` list card (`side_list_item.njk`). Adding one to the detail page is real layout work — placement, crop behavior, whether it borrows portfolio's subgrid trick (`article.portfolio-detail section { grid-template-columns: subgrid }`) or does something simpler given `.side-detail` opted out of the generic article grid. Worth a short design pass, not a quick add.
- **AI skills/routines as a `/sides/` category** (2026-08-21) — Jon wants to eventually share personal AI skills and routines through the same `/sides/` scheme. These aren't apps: the legal page's per-project privacy framing (App Store data-practice disclosures) and the detail-page info block (App Store link, GitHub issues) are built around shippable software and probably don't fit skills/routines as-is. Needs its own short brainstorm before the first entry goes up — likely a lighter info block (source link, maybe a license) and no privacy-practice subsection unless the skill itself handles data.

### Lead figures (started 2026-10-29)

- **Keep backfilling essays with figures that carry the argument.** Seven essays have a `leadFigure` as of 2026-11-07. Next come the rest of this year's long posts (16 ran over 700 words) and popular long posts of any age, ranked by traffic. Style and rules: [lead figure spec](designs/specs/2026-10-29-lead-figure-style-design.md).
- **Decide whether and how OG cards use the lead figure** (low priority) — One candidate keeps the dark card's title-first layout and lays the figure's silhouette along the bottom in low contrast. A mock on 2026-10-29 read fine at LinkedIn's ~128×72, but a landscape is the easy case; check it against diagrams that aren't.
- **Homepage** (low priority) — Revisit excerpts or fewer posts per page now that essays carry figures.

### Craft atmosphere (deferred)

- Outlandish alternative stylesheet?
- Subtle texture in overflow background (light mode)?

### 🖍 Also…

- ~~**Body text ignores the reader's default text size**~~ – fixed 2026-11-07. `body` used `--text-size`, a "legacy alias" fixed at `16px`, so paragraphs and everything else that inherits from `body` stayed at 16px for a reader who raised the browser's default text size, while headings, nav, and the footer grew. `body` now uses `--font-size-base` (`1rem`) and `--text-size` is gone, including a dead `13px` override in the `/color/` gallery previews. At the default size, pages render byte-identical. Browser zoom was never affected.

- **Modern CSS techniques to consider**
  - Fluid typography with clamp() for smooth scaling across breakpoints (see [https://modern-css.com/fluid-typography-without-media-queries/](https://modern-css.com/fluid-typography-without-media-queries/))
  - Fluid spacing with clamp() for gutter/spacing tokens
  - Container queries for portfolio grid (respond to container width instead of viewport)
  - `color-mix()` to derive hover/active colors from the base colors. It's already used for three backgrounds; hover and active are still `var()` aliases of the three base colors rather than derived shades.
  - **CSS audit findings** (modern-css.com/tools/css-audit/, run 2026-11-03, source: `css-audit.json`) — **88% modern**; 8 findings across 102 hits, all in `jonplummer.css`; 6 of 8 checks ready for the declared target. Grouped by effort:
    - ~~**Quick/mechanical**~~ – done 2026-11-07. The 21 `-webkit-mask-*` lines are gone, the print rules use `break-after` / `break-inside`, and the unused `.page-break` class is deleted. The lightbox `max-height`s use `dvh`; body `min-height` uses `svh` so the sticky footer doesn't move while mobile browser toolbars show and hide. Stylelint's `property-no-vendor-prefix` and `property-no-deprecated` are back on, so `pnpm run test css` fails if either kind of property returns. Three prefixes are exempt because the site needs them: `-webkit-box-decoration-break` (Safari only reads the prefixed form), and `-webkit-` / `-moz-text-size-adjust` (iOS Safari, Firefox Android).
    - ~~**Targeted rewrites**~~ – done 2026-11-07. The figure subgrid's child list and the three print lists are `:is()`, and screen and print rules use logical properties (`inset-inline-*`, `padding-inline-start`, `border-inline-start`, `text-align: start`). `.sr-only` and the skip link now hide with `clip-path: inset(50%)` in place instead of `left: -10000rem`. A no-op `padding-left: 0` on portrait-grid captions is gone.
    - **Cascade architecture (`@layer` in target since Sept 2024 — tackle together):**
      - ~~`!important` in print~~ – tidied 2026-11-07 without `@layer`: nobody prints the site, so a whole-cascade restructure isn't worth the risk to screen pages. 14 remain, down from 22, each kept only after a print-mode computed-style diff showed it was needed and each under a comment saying what it beats: the `*` reset, the `article` reset, the code backgrounds, the decorative `::after`s, and four token overrides for the `/color/` previews' inline styles. The same pass fixed four print bugs: a second `@page` forced A4 on every printout (now the dialog's paper), the `*` rule forced quiet text black (print tokens now set black text and gray quiet text), closed content warnings printed blank (`::details-content` now opens them, with the warning sentence kept as plain text), and the print color tokens were mostly unused. The two leftovers were fixed 2026-11-08: links to the site or the page itself (the logo mark and site title, `rel="home"`, and post titles, `rel="bookmark"`) no longer print a root-relative path after them, which the logo mark did too, and the `/color/` lab's badges print as dark text in an outline instead of pale green on nothing.
      - High-specificity selectors (15 hits) — `a:any-link:is(:hover, :focus-visible)` with contextual prefixes like `body > header nav` and `.post-demo-popout` pushes specificity to (0,4,x). Wrapping context in `:where()` brings it down. Same `@layer` refactor makes this easier.
      - `body > header / main / footer` specificity ballast (13 hits) — used in screen and print rules to outweigh base styles. Addressed naturally by an `@layer` structure.
    - **Already clean — no findings:** floats, negative-margin gutters, translate centering, dark-mode duplicates (using `light-dark()` correctly), RTL overrides, ID selectors, z-index stacking, Sass remnants, JS-driven CSS hacks. Already using: custom properties (215), `:is()`/`:where()` (26), `focus-visible` (17), logical props (17 partial), `oklch` colors (19), `gap` (20), `text-wrap` (3), `:has()` (2), nesting (14), view transitions (2).
  - **CSS audit — browser support panel** (same run, 2026-11-03) — 214 CSS features found; 22 not yet Widely Available, all without a fallback. Most are intentional progressive enhancements or print-only. The ones worth a decision:
    - ~~`box-decoration-break: clone`~~ – no action needed (checked 2026-11-07). The audit says Safari never supports it, but Safari reads the prefixed form, and `:not(pre) > code` already sets `-webkit-box-decoration-break: clone` beside the unprefixed line.
    - `@view-transition` (2 uses, Firefox No, Safari 18.2 only) — already in and working as a progressive enhancement; Firefox just doesn't animate. No action needed, but good to know that ~30% of desktop browsers are skipping it.
    - `::selection` (1 use, not in iOS Safari) — cosmetic gap only; fine.
    - `orphans` (1 use, Firefox No) — print stylesheet; not critical.
    - ~~`page-break-*` properties~~ – renamed 2026-11-07 (see above).
  - **CSS audit — design tokens panel** (same run, 2026-11-03) — 58 custom properties; color tokenization is strong (87%), spacing is leakier (68%), font sizes in between (74%).
    - ~~Screen spacing~~ – done 2026-11-07. The audit matched values, not meanings: it suggested `--font-size-base` for `1rem` and `--font-size-lg` for `1.5rem`, but nearly every use is a margin or padding. On screen, the lightbox and lab code-panel `0.5rem`s are now `--spacing-xs`, the lightbox's `100vw/100dvh - 1rem` sizes use `--spacing-sm`, and the lab disclosure's off-grid `0.75rem` gap snapped up to `--spacing-sm`. No new token: the other screen `0.75rem` is the pop-out icon's size, not spacing.
    - **Left on purpose:** the two `light-dark()` color duplicates are the inline first-paint shell in `critical.njk`, which has to hard-code token values and is guarded by `test critical-css`. The lightbox backdrop and the OG preview's white field are fixed colors on purpose.
    - ~~Print~~ – done 2026-11-07. `0.5rem`, `1rem`, and `1.5rem` are `--spacing-xs/sm/md`; the off-scale `0.75rem`, `0.25rem`, and `code` padding stay literal. Colors come from print overrides of the color tokens, with `color-scheme: light` so `light-dark()` can't print dark-mode values.
  - **Typography from [Taming Typography: Building a Modern CSS Reset](https://css-tricks.com/taming-typography-modern-css-reset/)** (CSS-Tricks, read 2026-11-07). Checked against `jonplummer.css`.
    - ~~Three small ones~~ – done 2026-11-07: `text-wrap: pretty` on `li` and `blockquote`; `text-underline-offset: 0.15em` on links, which only shows on hover and focus since reading links have no underline at rest (`skip-ink` already kept underlines off descenders); and `hanging-punctuation: first last` on `p` and `blockquote`, which only Safari applies and which wasn't checked in Safari.
    - ~~`text-box` for the header lockup~~ – tried 2026-11-07, not adopted. Measured in headless Chrome: today's eye-tuned px tokens put the logotype's cap top and the tagline's baseline within 0.02px of the mark's edges at the default root size with the real fonts. They drift at a 20px root (top 0.8px) and with the `sans-serif` fallback a cold `font-display: optional` load can get (top 1.9–3.4px). `text-box: trim-both cap alphabetic` on the logotype and tagline, with the mark sized in `cap` units (the tagline's cap height carried over by a registered `@property`), was exact in all four cases. It wasn't worth it: Firefox has no `text-box`, so it would add about 15 lines behind `@supports` on top of the tokens rather than replace them, and `main` would start 2.2px higher. Converting the tokens to rem doesn't fix the drift either: at a 20px root the top improves to 0.25px but the bottom worsens to 0.7px. The tokens stay as they are.
    - Skip `font-synthesis: none`. The site loads only upright Libre Franklin, so italics in captions, blockquotes, and `em` are synthesized, and this rule would turn them upright.
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

---

## MAYBE LET'S DON'T DO THESE

- Joining [aboutideasnow.com](https://aboutideasnow.com/) – dropped 2026-11-08, not much value for this site.
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

---

## DONE

- **Trim test runner presentation** (2026-08-13, b234f198; recorded here 2026-11-07) – `scripts/test-runner.js` runs `fast`, `all`, and `unit` through one `runTestGroup(label, ids)` loop, and `listTests()` reads the test manifest. Landed with the move to a single test manifest.

- **Duplicate sitemap entries and noindex for tool pages** (2026-10-16) – `src/sitemap.njk` now writes tagged pages from one loop and skips paginated templates, with an override map keeping `lastmod` for `/wisdom/`, `/portfolio/`, and `/sides/`. `noindex: true` in front matter adds a robots noindex and drops the page from the sitemap; applied to `/ogimages/`, `/readme/`, and `/changelog/`. `test seo-meta` fails on duplicate sitemap URLs and on noindex pages in the sitemap. Closes the Future → Error pages entry filed 2026-09-07.

- **Permanent short links for QR / print** (2026-10-02) — `src/_data/shortlinks.yaml` → `.htaccess` `RewriteRule` 302s (`^XX/?$`, NC); CLI `pnpm run shortlink`; build test `shortlinks`; CF purge of short URLs when `.htaccess` changes; deploy live smoke. Canary `JP` → home. Plan: `docs/designs/plans/2026-10-02-shortlinks.md`.

- **Cayuse Connect 2022 talks as portfolio items** (2026-09-24) – `2022-11-01-conference-talk-prioritizing-accessibility.md` and `2022-11-01-conference-talk-ux-philosophy.md` moved to the portfolio detail layout, each with a cover, a new intro, and slide figures captioned from the speaker notes. That finishes the Cayuse part of the talks sweep.

- **Thicker `/sides/` write-ups** (2026-09-17 through 2026-09-22) – Why and status copy for the death clock, Plain English, Lister, and prvt pages; Pointer-AR expanded and named sources linked across the other sides; Usage-Chan expanded with UI screenshots and layout notes.

- **Discovery interview training portfolio piece** (2026-09-11) — `src/_posts/2022/2022-05-13-discovery-interview-training.md` combines the two May 2022 Cayuse product-team training decks (session one: why discovery, the research question, and the topic list; session two: scheduling, structure, and running the interview) into one piece: 43 captioned slides, a merged PDF, three-paragraph intro. Cover `2022/05/discovery-interview-training-page-26.png`. Deployed live at /2022/05/13/discovery-interview-training/ (date is an ordering device, not the real authoring date). Site-only, not cross-posted to LinkedIn. First entry closed on the Selected → Portfolio "Look through /talks" item.

- **Book Map side project page** (2026-09-10) — `src/sides/book-map.md` covers the map built for Erin's book reviews: YAML in, one HTML file out, geocoding through Nominatim with a cache, covers from Open Library falling back to Google Books, Leaflet drawing it. The page carries the real map as a live embed plus an open-in-new-tab link (`src/assets/demos/erindouglass-bookmap/`), which is what the idea asked for instead of a screenshot. Tile licensing was rechecked before publishing: Stadia domain authentication rather than a shipped API key, and CARTO's Positron and Voyager styles dropped because they now stamp "API KEY REQUIRED" across otherwise-fine tiles. `status: Ready to deploy` (a new allowed value, 6436b6f1) says plainly that it is not yet in use on her site. Cover `2026/09/book-map.jpg`.

- **Ideas list at the bottom of `/sides/`** (2026-09-09) — Eleven unstarted ideas now live under the `.sides-grid` in `src/sides/index.njk`, authored as markdown inside a `{% set %}` block and rendered through the existing `markdown` filter, so adding one is typing a `-`. No data file, no `sideproject` tag, nothing enters the grid. Dates were dropped by choice; the pruning condition survives as the closing line ("The ones that sit here too long get deleted") rather than as visible ages. `now.md`'s "Still just ideas" heading and paragraph are gone, replaced by one sentence pointing at the bottom of the same page. The ISS pointer stayed with `pointer-ar.md`.

- "Did you mean" suggester on /404 (2026-09-07) — trigram + edit-distance matcher over a generated destination index; spec in `docs/designs/specs/2026-09-04-404-suggester-design.md`

- **`/sides/` pages for this site and Usage-Chan** (2026-09-07) — `src/sides/jonplummer-11ty.md` covers the build as a side project: the tests that came from real failures (`color-contrast`'s dual-gamut split, `critical-css` shell drift, `error-document-assets`, `design-docs-location`), the two independent deploy cursors, the `/color/` and `/type/` labs, and rem breakpoints. Labor divided with [`/colophon/`](../src/colophon.md) as planned — practical material here, the why there. Cover is the "Care has to show up in the product" post at 1600px light with the same post on a phone in dark laid over it (`2026/09/jonplummer-11ty-cover.jpg`), shot with Puppeteer and composited with sharp. `src/sides/usage-chan.md` shipped alongside it. Cross-links from `now.md` landed the same day: every project bullet there now points at its `/sides/<slug>/` page.
- **Split repo license** (2026-09-07) — `LICENSE` covers code under MIT (scripts, `eleventy/`, templates, CSS) and content under CC BY-NC 4.0 (posts, portfolio, page copy, images, the mark). Robert Ullman's colophon portrait is carved out of both: commissioned and paid for, published here, not licensed onward. Fonts defer to their own OFL terms. GitHub won't auto-detect a split file; accepted.
- **Colophon accuracy pass** (2026-09-07) — Three claims corrected against the CSS. Big Shoulders is on `hgroup h1` / `article h1` / `main > h1` only, so "wordmark and headings" became "wordmark and the top-level titles," with h2-and-down named as Libre Franklin. APCA checking covers the eight text-on-background pairs the palette actually uses, not "every token" — `--border-color` and `--focus-ring-color` are never scored, and the hover/visited/active aliases collapse into the pairs they point at. The "modular scale from one base size and one ratio" claim was simply false (0.875/1/1.5/2/2.5rem gives ratios of 1.14, 1.5, 1.33, 1.25, plus an off-scale 2.25 logotype); replaced with a round-rem-sizes framing and a second bullet on the near-baseline grid — body at a 24px line box and h1 at 48px land on the eight-pixel grid, h2/h3 at 1.2 deliberately don't.

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
