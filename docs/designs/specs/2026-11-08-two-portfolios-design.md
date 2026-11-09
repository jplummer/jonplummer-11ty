# Two portfolios

Status: proposed 2026-11-08, not built. Background: [the site for the hardware-and-software position](2026-11-08-hardware-software-position-design.md).

## Goal

The site gets two portfolios built from one pool of pieces:

- **The main portfolio** at `/portfolio/`, in the nav. It leads with the position: leadership, discovery, design, and prototyping where hardware and software meet.
- **The UX leadership portfolio**, for general UX Director applications. It's linked from `/about/`, the resume, and a print shortlink, but not from the nav.

Each shows a hand-picked order instead of date order. A piece can be in one portfolio, both, or neither, and side projects can appear in either.

## How it works today

- Pieces are posts under `src/_posts/` tagged `portfolio`, with date-based permalinks (`/2016/03/21/belkin-router-out-of-box/`).
- `src/portfolio.njk` loops over `collections.portfolio | reverse`, so the grid is newest first, and renders each card with `components/portfolio_list_item.njk` (cover, title, description).
- `layouts/portfolio_detail.njk` sets `collection = collections.portfolio`, and `components/collection_navigation.njk` draws previous/next links with Eleventy's `getPreviousCollectionItem` / `getNextCollectionItem`. Those links run in date order.
- Other consumers of `collections.portfolio`: `src/sitemap.njk` (the `/portfolio/` lastmod override and the loop over pieces), `src/404-index.njk` (the suggester's destination list), and the OG generator, which labels any `portfolio`-tagged page "Portfolio."
- `pnpm run test portfolio-cover-crop` reads `_site/portfolio/index.html` and expects the Monotasker card there.
- There are no custom collections; `.eleventy.js` only wires config modules from `eleventy/config/`.

## Design

### One data file holds both lists

`src/_data/portfolios.yaml` lists each portfolio's pieces in display order, by URL:

```yaml
main:
  - /2016/03/21/belkin-router-out-of-box/
  - /2018/12/10/wemo-smart-home-accessories-and-app/
  - /sides/usage-chan/
  # …
leadership:
  - /2026/02/20/call-review-console/
  - /2026/03/06/invoca-ia-vision/
  # …
```

Why a data file instead of front matter on each piece:

- The order is the curation. Reordering is moving a line in one file, not renumbering fields across 35 posts.
- Side projects can join a portfolio without changing their own front matter or tags.
- Membership and order are reviewable in one diff.

Why URLs instead of file slugs: URLs are what Jon sees in the browser and on the page, and permalinks don't change without a redirect. File slugs also collide: `monotasker` is both `src/_posts/2026/2026-06-05-monotasker.md` and `src/sides/monotasker.md`.

The `portfolio` tag stays as it is. It still means "this post uses the portfolio layout and gets a Portfolio OG card"; the data file decides where it's listed.

### Two custom collections

A new `eleventy/config/collections.js` adds `portfolioMain` and `portfolioLeadership`. Each reads its list from `portfolios.yaml` and maps every URL to the matching item from `collectionApi.getAll()`, keeping the file's order. A URL that matches nothing throws, so a typo fails the build instead of dropping a card silently.

Because these are ordinary Eleventy collections, the existing `getPreviousCollectionItem`, `getNextCollectionItem`, and `getCollectionItemIndex` filters work on them unchanged.

### Index pages

- `src/portfolio.njk` loops over `collections.portfolioMain` instead of `collections.portfolio | reverse`. It gets a short intro above the grid that says what the position is, plus a new title and description. Jon writes the copy.
- A new page for the UX leadership portfolio loops over `collections.portfolioLeadership`, with its own intro, title, and description. It's tagged `page`, so it gets an OG card labeled with its path, like every other page.
- Both use `portfolio_list_item.njk` as is. Side project items already carry `coverImage`, `coverPosition`, `title`, and `description`, so their cards render the same and link to `/sides/<slug>/`. A small "Side project" label on those cards is optional; leave it out of the first pass.
- Each page links to the other in one line under the intro, so a visitor who wants the wider set can find it.

### Previous and next on piece pages

A static page can't know which portfolio the visitor came from, so each piece navigates within exactly one list:

1. If the piece is in `portfolioMain`, previous/next follow the main order.
2. Otherwise, if it's in `portfolioLeadership`, they follow that order.
3. Otherwise, there are no previous/next links, only a link back to `/portfolio/`.

`portfolio_detail.njk` picks the collection with `getCollectionItemIndex` (it returns -1 when the page isn't in the list) and hands it to `collection_navigation.njk` as today.

So a visitor who opens a shared piece from the leadership page and clicks "Next" moves through the main portfolio. That's acceptable, since the main portfolio is the public face. The alternatives were worse:

- A query string plus JavaScript to rewrite the links is custom JS for a small gain (CLAUDE.md asks to check before adding any).
- A second copy of each shared piece under the leadership URL means duplicate content and canonical tags.
- Dropping previous/next everywhere loses the browsing Jon has now.

Side project pages keep their own layout and get no portfolio navigation.

### URL, nav, and shortlink

- Proposed URL: `/portfolio/leadership/`. Nesting it under `/portfolio/` says the two are related. The header and footer nav highlight `/portfolio` only on an exact match, so the nav stays unchanged and unhighlighted on the leadership page.
- Add a two-character shortlink with `pnpm run shortlink add https://jonplummer.com/portfolio/leadership/ --note "leadership portfolio"` after the first deploy, for the resume and print.
- Add the page to the sitemap's lastmod overrides beside `/portfolio/`, using its own collection's newest item.

### `noindex` on the leadership page (undecided)

`noindex` would apply only to the index page. Every piece on it stays indexed at its own URL, as all pieces are today, so `noindex` hides the list, not the work.

- **Indexed:** the page can show up when someone searches for Jon and UX leadership, next to `/portfolio/`. The two pages then compete in those results.
- **`noindex`:** only people with the link see the page, which keeps search results on the position. The pieces are still findable one by one.

The front matter flag already exists (`noindex: true` keeps the page out of the sitemap and adds the robots meta tag), so either answer is a one-line change and can flip later.

### Pieces in neither portfolio

Some pieces may drop out of both lists (the 2001 identity work, for example). They keep their URLs, stay in the sitemap and the 404 suggester, and lose previous/next as described above. Nothing redirects, since nothing moved.

## Tests

- **New: `portfolios`** (fast group, pre-build, reads source only). It fails when:
  - an entry doesn't resolve to a portfolio piece or side project page
  - a URL appears twice in one list
  - an unknown top-level key appears in `portfolios.yaml`

  It also warns, without failing, for each `portfolio`-tagged piece that's in neither list, so dropping one is a visible choice. One manifest entry in `scripts/test-manifest.js` wires it in.
- **Update: `portfolio-cover-crop`** looks for the Monotasker card in whichever built portfolio page lists it, and fails if no page lists it while the test still expects it.
- `internal-links`, `seo`, `og-images`, and `html` cover the new page without changes. `seo` checks the sitemap for duplicates and for `noindex` pages.

## Docs

- `docs/authoring.md` gets a short "Portfolios" section: how to add a piece, move it, or drop it, and that the order in `portfolios.yaml` is the display order.
- `docs/tests.md` gets the `portfolios` test.

## Rollout

1. Build the mechanism with `main` listing every current piece in today's order (newest first) and `leadership` empty. The built `/portfolio/` should then match today's exactly. Check that before going further.
2. Fill in both lists and write both intros. This is Jon's curation and copy, guided by the [position doc](2026-11-08-hardware-software-position-design.md#portfolio-and-the-second-portfolio).
3. Deploy, then add the shortlink.

## Open questions

- The leadership portfolio's name and URL. "Leadership" is a placeholder.
- `noindex` on the leadership page (above).
- Whether side project cards in a portfolio get a "Side project" label.
- Whether `/about/` links both portfolios or only the main one, with the leadership portfolio left to the resume and direct links.
