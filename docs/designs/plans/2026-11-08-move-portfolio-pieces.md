# Move portfolio pieces to `/portfolio/<slug>/`

Status: phase A done 2026-11-08, not yet deployed. Step 0 of the [two-portfolio spec](../specs/2026-11-08-two-portfolios-design.md). Deployed on its own, before any portfolio curation.

## Goal

Every portfolio piece moves from `/YYYY/MM/DD/<slug>/` to `/portfolio/<slug>/`, and its source file moves from `src/_posts/YYYY/` to `src/portfolio/`. Old URLs 301 to the new ones. Apart from the URLs, the built site is the same: same pages, same markup, same OG cards.

A second, optional phase renames `src/_posts/` to `src/posts/`, which changes no output at all.

## What stays the same, and why

- **Slugs.** Eleventy's `page.fileSlug` already drops the `YYYY-MM-DD-` prefix, and the current permalink uses it, so `/portfolio/<fileSlug>/` keeps every slug as it is.
- **File names.** The files move but keep their names. A piece's OG card filename comes from its source basename (`generateOgImageFilename` falls through to the basename for anything not tagged `post`), so all 35 cards keep their PNGs and URLs.
- **Front matter.** No piece changes its front matter. `tags: portfolio`, `layout`, and `date` stay. After the move, `date` no longer feeds the URL.
- **Images** stay under `/assets/images/YYYY/MM/`.

## Phase A: move the pieces

1. **Baseline.** `pnpm run build`, then copy `_site/` to the job's temp directory as `before/`.
2. **Move.** `git mv` each of the 35 `portfolio`-tagged files from `src/_posts/YYYY/` to `src/portfolio/`, flat, names unchanged. Check first that no piece is also tagged `post`.
3. **Permalink.** Add `src/portfolio/portfolio.11tydata.js` with `permalink: data => \`/portfolio/${data.page.fileSlug}/\``. The dated permalink in `src/_posts/_posts.11tydata.js` stops applying because the files are no longer in that directory.
4. **Redirects.** A one-off script appends 35 `from: /YYYY/MM/DD/<slug>/` → `to: /portfolio/<slug>/` entries to `src/_data/redirects.yaml` under a dated comment. The old URLs come from the `before/` build, not from recomputing dates, so they match what's live exactly. Existing entries whose `to` is an old piece URL get the new target, so nothing chains.
5. **Links.** The same script rewrites the 32 links to old piece URLs in 19 source files (`/about/`, `/now/`, about 15 posts, and pieces linking each other). It also updates `portfolioPost` in `src/sides/monotasker.md`, and the discovery-training shortlink in `src/_data/shortlinks.yaml`, which is a 302 and can be retargeted.
6. **Tooling that assumes pieces live in `_posts/`:**
   - `scripts/test/frontmatter.js` scans only `src/_posts/` for dated content. Add `src/portfolio/` with the portfolio rules: `YYYY-MM-DD-slug.md` names, a quoted `date`, and a date that's allowed to differ from the filename.
   - `scripts/utils/source-file-utils.js` (`findSourceFile`, used by `test og-images` and `test seo`) maps `portfolio/<slug>/index.html` to `src/portfolio/*-<slug>.md`. `scripts/test/source-file-utils.js` gets a case for it, so `seo --changed` can't silently skip pieces the way it once skipped posts.
   - `scripts/test/accessibility.js` maps source paths to output paths for `--changed`. Add the portfolio mapping.
   - `eleventy/config/events.js` treats a saved file as a post only under `_posts/`. Include `portfolio/` so watch mode still regenerates a piece's card.
   - `scripts/content/generate-og-images.js` and `scripts/utils/og-image-gallery-sort.js` already find files outside `_posts/` through their recursive scan of `src/`, so pieces stay covered. Check that no PNG changes; if the duplicated discovery code gets in the way, share one list of content directories between them.
   - `scripts/test/portfolio-cover-crop.js` reads Monotasker from its old path. Update it.
7. **Docs and rules.**
   - `docs/authoring.md` and `docs/tests.md`: say where pieces live.
   - `docs/commands.md`: the PDF conversion output goes into a piece under `src/portfolio/`.
   - `.agents/rules/blog-post-authoring.mdc` and `eleventy.mdc`: the path conventions.
   - `LICENSE`: the content license lists `src/_posts/`, so it also needs to name `src/portfolio/`, or the moved pieces fall outside it.
   - `src/sides/jonplummer-11ty.md`: the repo tree says portfolio items live under `_posts/`.
   - `docs/agent-memory.md`.
8. **Verify.**
   - Build, then compare `after/` with `before/` using a script.
   - Each piece's new page must be byte-identical to its old page once old piece URLs are replaced with new ones. That replacement covers the canonical tag, `og:url`, schema, and links.
   - Every other HTML and XML file must be identical after the same replacement.
   - The only paths added must be `portfolio/<slug>/`, and the only paths removed the old dated piece directories.
   - `.htaccess` must gain exactly the 35 rules.
   - `git status` must show no PNG changes.
   - Then `pnpm run test fast`, `pnpm run test unit`, and `pnpm run deploy --dry-run`. The dry run lists the Cloudflare purges and the IndexNow submissions, which should include the new piece URLs and the departed old ones.
9. **Commit.** Deploy only when Jon says so. rsync runs with `--delete`, so the old directories leave the server, and the `Redirect 301` rules answer their URLs.

### What phase A turned up

- **Slashless old URLs** are covered. `redirects.yaml` already used the `/uses/` pattern (slashed form first, then slashless), so each piece got both, 70 rules in all. One existing date-correction redirect for the Cayuse UX philosophy talk now points straight at the new URL.
- **WGU.** The file, its URL, and its OG card PNG went from `wga-` to `wgu-` in the same move, so the old dated URL redirects once, straight to the final one. The card kept its pixels and digest.
- **`_site/` isn't cleaned by the build.** The first rebuild still had every old dated page beside its new copy, and `test seo` failed on 35 duplicate titles. That failure would also have stopped a deploy before rsync. `pnpm run clean` fixed it, and the clean build dropped 5,375 stale files the old `_site/` had piled up, mostly images from earlier builds.
- **Comparison result.** Against the baseline, after swapping old piece URLs for new: 6,720 files identical. The 35 piece pages differ only in the header tagline, which is picked by hashing the page's URL. `/portfolio/` differs only in the WGU card's anchor id. `/sides/jonplummer-11ty/` differs in the repo-tree text, which changed on purpose. `.htaccess` gained the redirects. `feed.xml` differs where an excerpt cut at 297 characters lands; that's an old bug (below).
- **Spell check** flagged "minimed" and "carelink" in the new redirect paths. The `cspell.json` pattern that skips `key: /path` lines now also allows YAML's indentation and `- ` list marker.
- **Resumes** link four pieces by their old URLs. Those links keep working through the redirects; update them at the next resume edit.

## Phase B (optional): rename `src/_posts/` to `src/posts/`

Eleventy gives the underscore no meaning here: `_includes` and `_data` are set in config, and `_posts` is just a name. After phase A, the directory holds only posts, and `posts/` matches `portfolio/`, `sides/`, and `wisdom/`.

- `git mv src/_posts src/posts`, and rename the directory data file to `posts.11tydata.js`. Eleventy matches that file by directory name, so the old name would silently stop applying the dated permalinks.
- Update the code references in 11 files (`events.js`, `date-utils.js` comment, `generate-og-images.js`, `og-image-gallery-sort.js`, `source-file-utils.js`, and the `frontmatter`, `accessibility`, `og-card`, `og-image-filename`, `portfolio-cover-crop`, and `source-file-utils` tests), the agent rules, `LICENSE`, `src/sides/jonplummer-11ty.md`, `docs/authoring.md`, `docs/tests.md`, `docs/commands.md`, `docs/date-timezone-handling.md`, `docs/agent-memory.md`, and the relative links in `docs/ideas.md`. Dated plans and specs keep the old path, since they're records of their time.
- **Verify:** `_site/` must be byte-identical to phase A's build, and `pnpm run test fast` and `pnpm run test unit` must pass.
- Commit separately from phase A, so either can be reverted alone.
