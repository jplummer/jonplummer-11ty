# AI search lessons for jonplummer.com

Source: Google's [Optimizing for generative AI features in Google Search](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) (updated 2026-07-10), plus the web.dev article it links, [agent-friendly website best practices](https://web.dev/articles/ai-agent-site-ux) (updated 2026-04-01). Reviewed against the repo and the live site on 2026-10-16.

This follows the [findability plan](2026-10-09-findability.md), which already did most of what the guide asks of a personal site: descriptions in LinkedIn's vocabulary, the Person schema, rel="me", and a robots.txt that lets search and user-triggered AI fetches through.

## What the guide says

AI Overviews and AI Mode don't have their own index. They retrieve pages through Google's ordinary ranking systems (the guide calls it grounding), and they "fan out" a question into several related searches and pull results for each. A page that ranks and can be shown as a snippet is eligible. The guide asks for three things:

1. Content a reader can't get elsewhere: first-hand experience and expertise beyond common knowledge, organized with headings, with images or video where they help.
2. Technical basics: crawlable, indexable, snippet-eligible, semantic HTML, works on phones, and little duplicate content.
3. Merchant Center and Business Profile listings for businesses. Neither applies here.

It also lists things that don't help, and says Google Search doesn't use them:

- llms.txt, AI text files, special markup, or Markdown copies of pages
- splitting pages into "chunks"
- rewriting for every keyword variant
- chasing mentions on other sites that aren't earned
- more structured data than rich results need

Measurement goes through Search Console's Generative AI performance report, and the guide warns off third-party tools that claim to see Google's internal numbers.

## Where the site stands

The site already does nearly everything on the list. Every page has a self-referencing canonical and `max-image-preview:large`, with no `nosnippet`. Posts carry `<article>`, `<time>`, one BlogPosting block, and headings. Posts and pages render their text without JavaScript; only the /color/ and /type/ controls need it. `robots.txt` lets Googlebot in. It blocks `Google-Extended`, which governs Gemini's use of the content and, per Google, doesn't affect Search or AI Overviews. The focus audit and the `a11y` test already cover what the web.dev article asks for: real buttons and links, labeled inputs, a stable layout.

The content side is in good shape too. Posts lead with things only Jon can say (the Insulin On Board display at MiniMed, the Wemo and Linksys work, arguing with an agent), and there are portfolio pages for most eras. The guide's term for that is "non-commodity content."

So nothing on the guide's do-list is missing, and there's no llms.txt or schema work to do. What's left is small cleanup, one measurement step, and one content opportunity.

## Recommendations, by priority

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 1 | Read the Generative AI performance report at the 11/06 check | Tells us whether any of the rest is worth doing | Minutes |
| 2 | Add press and talks to About, if there's outside coverage to link | Medium if there is, none if not | Low, once Jon has the links |
| 3 | Mark build-tool pages `noindex` (they stay linked) | Low to medium | Done 2026-10-16 |
| 4 | Remove the four duplicate sitemap entries | Low | Done 2026-10-16 |
| 5 | A portfolio piece on the two agentic products | Medium to high, for the searches Jon most wants to win | High |

### 1. Read the Generative AI performance report

Task 9 of the findability plan pulls name-search numbers from Search Console around 2026-11-06. Add this report to that pull. It shows whether pages show up in AI Overviews or AI Mode, and for what. The plan notes the baseline came from the URL-prefix property `https://jonplummer.com/`, because the domain property isn't shared with this account. Check whether the report exists for that property type. If it doesn't, the domain property's owner needs to share it.

If the report shows /about/ or the portfolio turning up in AI answers for name and role searches, items 2 and 5 are worth more. If it shows nothing, they're still worth doing for people, but there's no AI-search payoff to point to yet.

### 2. Add press and talks to About

The guide's line on mentions is that pursuing fake ones doesn't work. Earned ones are what's left, and the site doesn't list any. A short "Press and talks" list on About, linked to the source, gives Google and AI answers something outside the site that confirms what the site says. The conference talks already in the portfolio (Cayuse Connect 2022, the concept sprint readout, the problem statements field guide) belong in the same list. Talks alone only add internal links, though. The value comes from coverage on other sites, such as interviews, podcasts, panels, or articles that quote Jon.

Needed from Jon: whether any outside coverage exists, with links. If none does, skip this item.

Testing: `pnpm run test fast` covers links, spelling, and markup.

### 3. Keep build-tool pages out of the index – done 2026-10-16

`/ogimages/` (the OG card preview), `/readme/`, and `/changelog/` now carry `noindex: true` in front matter. `/color/` and `/type/`, the color and font labs, are Jon's call and are still indexed. Each takes one line of front matter to change.

All of these pages are linked on purpose: from the footer on every page, from colophon, and from the "hidden pages" posts (2025-11-20 and 2026-04-14). The links and the pages stay. Only the instruction to search engines changes.

Taking a page out of the sitemap isn't enough. The sitemap only tells Google where to look, and Google finds these pages through the footer anyway. The `noindex` robots meta is the part that keeps a page out of results. Google crawls the page, reads the tag, and drops or never lists it, however many links point there. So don't also block these pages in `robots.txt`: a blocked page can't be crawled, Google never reads the `noindex`, and it can still list the bare URL from the links it sees.

What changed:

- `head/meta_basic.njk` renders `<meta name="robots" content="noindex">` when the flag is set, in place of the usual `max-image-preview:large`.
- `src/sitemap.njk` skips pages carrying the flag. One flag drives both.
- `pnpm run test seo` fails if a page whose HTML carries `noindex` appears in `sitemap.xml` (`checkNoindexNotInSitemap` in `scripts/test/seo-meta.js`). It failed on all three pages before the sitemap skip and passes after. The sitemap went from 303 entries to 300.
- `docs/authoring.md` documents the flag. `docs/commands.md` said the preview page was "excluded from deployment." It was deployed and linked from the footer, so that line now describes what it does.

Not changed: deploy still submits these pages to IndexNow when their content changes, because `isIndexableHtmlPath` in `scripts/utils/indexnow.js` judges by path, not by the tag. That's harmless, since engines read the `noindex` when they fetch. It's worth fixing only if the IndexNow lists get noisy.

The guide's reason is duplicate and thin pages. Whether three thin pages hurt a site of about 300 is my guess, not something Google documents. The case for doing it is that it's cheap and the pages were never meant for search.

### 4. Remove duplicate sitemap entries – done 2026-10-16

`_site/sitemap.xml` listed `/wisdom/`, `/wisdom/tags/clarity/`, `/portfolio/`, and `/sides/` twice. Those templates carry `tags: page`, so they're in `collections.page`, and `src/sitemap.njk` also wrote them out by hand. The tag can't come off, because OG card generation also keys on `page`. `/wisdom/tags/clarity/` came from a paginated template, which puts only its first page in the collection.

What changed:

- The `collections.page` loop is now the only place those pages are written. It skips paginated templates.
- The wisdom tag pages keep their own loop, since the collection doesn't include them.
- The hand-written `/portfolio/`, `/sides/`, and `/wisdom/` blocks are gone. Their `lastmod` and `priority` values live in a `pageOverrides` map keyed by URL, which the loop reads.
- `pnpm run test seo` now fails if any `<loc>` appears twice (`checkSitemapDuplicates` in `scripts/test/seo-meta.js`). It failed on the four duplicates before the template change and passes after. The sitemap went from 307 entries to 303. The entries that stayed are identical to before.

### 5. A portfolio piece on the agentic products

Fan-out means a question like "is Jon Plummer a fit for a head of design role in AI" becomes several searches: his name with AI, with agents, with Invoca, and so on. The site answers most of these. The weakest is the claim Jon leads with on LinkedIn: running the concept sprints for Invoca's Conversational AI SMS Agent and Voice Agent and seeing both ship. The SMS concept video and the concept sprint readout touch it, but no page tells that story end to end. A case study in the style of the Call Review Console piece would cover it.

This is the most effort on the list and depends on what Jon can show from Invoca work. It's also the one change here that adds content, which is the main thing the guide asks for.

## Not recommended

- An `llms.txt`, Markdown mirrors of posts, or AI-specific pages. Google says Search doesn't use them.
- More schema types. BlogPosting, Person, and WebSite cover the rich results this site can get.
- Rewriting posts into short Q&A chunks or for keyword variants.
- Unblocking `Google-Extended`. It doesn't affect Google Search or AI Overviews, so there's no search reason to change the 10/09 decision.
