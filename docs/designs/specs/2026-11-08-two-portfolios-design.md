# Portfolios from one list file

Status: built 2026-11-09. `/portfolio/` renders from the `main` list and is byte-identical to before; curation is now an edit to the YAML. Background: [the site for the hardware-and-software position](2026-11-08-hardware-software-position-design.md). Earlier versions of this spec planned exactly two portfolios; see git history.

## Goal

The site builds any number of portfolios from one pool of pieces:

- **The main portfolio** at `/portfolio/`, in the nav, from the `main` list. It will lead with the position: leadership, discovery, design, and prototyping where hardware and software meet. Today it lists every piece, newest first, as before.
- **The SaaS portfolio** at `/portfolio/saas/`, for software design leadership roles. Linked from the resume and applications, not the nav. Draft for now.
- **Opportunity-specific portfolios** such as `/portfolio/microsoft/`, named for the company on purpose. Always hidden, and retired the day the company says no.

Each shows a hand-picked order instead of date order. A piece can be in any number of lists, and side projects can appear in any of them.

Jon's model is Ben Kowalski's site (https://www.benkowalski.design/advising): a curated portfolio and a confident position, where this site has a long chronological record.

## How it works

### One data file

`src/_data/portfolios.yaml` holds every list. Each key is a list, built at `/portfolio/<key>/`, except `main`, which is `/portfolio/`:

```yaml
saas:
  status: draft            # draft | live | retired
  indexed: true            # optional; leave out to keep the page hidden
  title: Portfolio – design leadership for SaaS
  description: One or two sentences for the meta description.
  intro: |
    Optional markdown above the grid.
  pieces:
    - /portfolio/call-review-console/
    - /sides/usage-chan/
```

- **The order is the curation.** Reordering is moving a line, and membership is reviewable in one diff. Side projects join without touching their own front matter.
- **URLs, not file slugs.** They're what Jon sees, and file slugs collide: `monotasker` is both a portfolio piece and a side project.
- **`status`** decides whether a list builds:
  - `draft` builds under `pnpm run dev` only.
  - `live` builds everywhere.
  - `retired` builds nothing, and its URL 302s to `/portfolio/` (both slashed and slashless, from `src/.htaccess.njk`). Retiring is a one-word edit, so the list stays on record and can come back. 302 rather than 301, because a browser caches a 301 for good.
- **Hidden by default.** A list gets `noindex` and stays out of the sitemap and the 404 suggester unless it says `indexed: true`. Opportunity lists never should.
- **Titles and descriptions** must meet the same lengths `test seo` enforces on built pages (10–200 and 20–300 characters). That way a draft list that never builds in production is still checked.

### One template

`components/portfolio_list.njk` renders a list's intro and cards, and every portfolio page uses it:

- **`/portfolio/`** is still `src/portfolio.njk`, now a thin shell that renders `portfolioLists.main` through the include. It keeps its own title and description because the OG generator reads them from front matter. It also stays an ordinary page, which the nav highlight, the sitemap's `/portfolio/` entry, and the 404 suggester all depend on. So `main` takes only `intro` and `pieces`, and the test rejects any other field there.
- **Every other list** comes from `src/portfolio-list.njk`, which paginates over `portfolioLists.lists` (`src/_data/portfolioLists.js`): the lists that build this run, worked out in `eleventy/utils/portfolios.js`.

- **Tagged `page`, excluded from collections.** It gets the `/portfolio/` layout and its `<h1>` from `base.njk`, and stays out of `collections.page`, which feeds the sitemap's page loop and the 404 suggester. Indexed lists get their own loop in `src/sitemap.njk`.
- **Cards** come from `collections.all | itemsByUrl(list.pieces)`. The `itemsByUrl` filter throws on a URL with no page, so a typo fails the build instead of dropping a card. Each card renders with `components/portfolio_list_item.njk`, the same component `/portfolio/` uses.
- **Computed fields.** `src/portfolio-list.11tydata.js` computes `title`, `description`, `noindex`, and `ogImage`. Computing `noindex` in JS keeps it a real boolean, where a Nunjucks string "false" would be truthy.
- **OG card.** Every list uses the `/portfolio/` card. A card per opportunity would be another file per application, for pages nobody shares.

### The hidden index

`/portfolio/all/` (`src/portfolio-all.njk`) lists every list, with its status and visibility, and every piece and side project with the lists it's in. It's for curating. It's `noindex`, linked from nowhere, excluded from collections, and borrows the `/portfolio/` card. It isn't tagged `page`, so it renders its own `<h1>` and the narrower reading layout suits its tables. (Until 2026-11-09 the OG generator ignored a borrowed card and made a page its own, which would have shown on the public `/ogimages/` gallery. That's fixed in `generate-og-images.js`.) `all` is a reserved list id.

### Collisions

A list id can't be a piece's slug, since both live under `/portfolio/`. The `portfolios` test catches a collision before the build. A live collision would also fail Eleventy's duplicate-permalink check, but a retired one would only add a redirect, which would capture the piece's URL.

## `/portfolio/` from the `main` list (done 2026-11-09)

`main` lists every piece, newest first, exactly as `/portfolio/` showed them, and the built page is byte-identical to the one before. Curating the public portfolio is now reordering or trimming `main`'s pieces, with no gate on finishing it first. Since `main` exists, the `portfolios` test warns about any piece that's in no list, so leaving one out everywhere is a visible choice.

### Previous and next on piece pages

A static page can't know which list the visitor came from, so each piece should navigate within one list: if it's in `main`, previous/next follow the main order; otherwise there's no previous/next, only a link back to `/portfolio/`. Not built yet. Piece pages still follow date order across every piece, which matches `main` while `main` is newest first; switch them over when the curated order first departs from date order.

So a visitor who opens a piece from `/portfolio/saas/` or an opportunity list and clicks "Next" moves through the main portfolio. That's acceptable, since the main portfolio is the public face. The alternatives were worse:
- **A query string plus JavaScript** to rewrite the links is custom JS for a small gain (CLAUDE.md asks to check before adding any).
- **Copies of pieces under each list's URL** mean duplicate content.
- **Dropping previous/next** loses the browsing that exists today.

Each list's intro should say where the rest of the work is, and the main intro can point software readers to `/portfolio/saas/`, so wandering between them feels intended.

## Card labels (not built)

Each card gets one quiet line naming what kind of piece it is, then where it happened: "Case study · Belkin," "Talk · Cayuse." Side project cards end with their status instead: "Side project · In development."

- **Kind:** one of `Case study`, `Talk`, `Prototype`, or `Side project`, set as `kind` in front matter. Side projects get it from their tag. With the label, titles can drop "(talk)" and "(conference talk)."
- **Where:** `org` in front matter (Belkin, Medtronic MiniMed, Cayuse, Invoca, and so on). Side projects have none.
- **Checked:** the allowed `kind` values live beside `SIDE_STATUSES` in `scripts/utils/validation-utils.js`, and `test frontmatter` checks them.
- **Left out on purpose:** domain labels ("Hardware") would read the same on almost every card in a portfolio built around one domain. Role labels ("Led the team") make claims that belong in the piece's text.

Cards show no year (decided 2026-11-08). Employment dates already have one owner, the job-search project's `employment-dates-canonical` file. A year on each card would add 35 more dates that must agree with it and with every resume, and many would be reconstructions. Where a piece needs a date, its text says so, and only where Jon is sure.

## Piece URLs (done 2026-11-08)

Pieces moved from `/YYYY/MM/DD/<slug>/` to `/portfolio/<slug>/`; see [move portfolio pieces](../plans/2026-11-08-move-portfolio-pieces.md). A piece's `date` now only records when it went up on the site.

## Tests

- **`portfolios`** (fast, pre-build, source only). A `main` list is required and takes only `intro` and `pieces`. Every other list's fields, status, and id are checked. Every piece URL must name a real piece or side project, appear once per list, and not collide with a list id; `all` is reserved. Warns about pieces in no list. Fixture checks guard the rules themselves, including that drafts build only outside `build` mode and that lists are hidden unless indexed.
- **Unchanged and covering the pages:** `internal-links`, `seo` (titles, descriptions, sitemap duplicates, `noindex` pages kept out of the sitemap), `og-images`, and `html`.
- **When labels land:** `frontmatter` checks `kind` and `org`.

## Rollout

1. Done (2026-11-08): move piece URLs, with redirects.
2. Done (2026-11-09): the list file, the shared include, `/portfolio/` from `main`, the hidden index at `/portfolio/all/`, and retired redirects. `saas` is a draft seeded from the software work. Production output is unchanged apart from `/portfolio/all/`.
3. Jon curates `main` and `saas` at his own pace, and sets `saas` live when its intro is written. Add a shortlink for the resume with `pnpm run shortlink add https://jonplummer.com/portfolio/saas/ --note "saas portfolio"`.
4. Switch piece previous/next to the `main` order once it departs from date order.
5. Add `kind` and `org` to every piece and turn on the label line.

## Open questions

- Whether `/portfolio/saas/` is `indexed`. Hidden keeps search results on the position, and its pieces stay findable one by one either way.
- The `kind` vocabulary. Four words are proposed; the talks and readouts may want finer distinctions.
- Whether `/about/` links both portfolios or only the main one.
