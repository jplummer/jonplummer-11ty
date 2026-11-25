# The site for the hardware-and-software position

On 2026-11-08 Jon settled on a position: leadership, discovery, design, and prototyping where hardware and software meet. The site leads with it. General UX Director roles stay open through a second portfolio that's available but not the main one, and both portfolios show AI fluency. Side projects carry most of the recent evidence for both hardware-plus-software and AI work, since the Invoca years were pure SaaS.

This doc notes what the position implies for each key page. Most of it is copy Jon writes; the build work is in [ideas.md](../../ideas.md) under Next. Nothing here is decided beyond the position and the two portfolios unless it says so.

## Site-wide

- **Header nav** (updated 2026-11-24; the 11/8 version is out of date) is `/home`, `/about`, `/portfolio`, `/hire` since 2026-11-19. `/now` moved to the footer's Also read group that day, and `/sides/` is only in the footer. Side projects that support the position appear as cards in the portfolio, which makes the portfolio their front door, and `/sides/` keeps the practical details (where to get each one, status, privacy and terms) for all of them.
- **Person schema** (`src/_includes/schema/person.njk`) has `jobTitle` "Product design and UX leader" and a description that leads with enterprise SaaS. Both should lead with the position, and `knowsAbout` could name hardware-and-software product design outright instead of leaving it to "IoT and connected devices."
- **Meta descriptions** on the home page, `/about/`, and `/portfolio/` all open with "product design and UX leader" and SaaS. Rewrite them with the page copy. OG cards show only title and label, so description changes don't re-render them.
- **Tagline** "Making ideas tangible" already fits. The rotation pool in `src/_data/site.js` could take a line or two about hardware and software together.

## Home (`/`)

The home page is the blog feed, and the only statement of who Jon is sits in the header lockup's rotating tagline. Visitors from a shared post usually land on the post, not here, so this may be fine. It's worth checking Ahrefs' entry pages before deciding. If the home page needs to orient people, one line above the feed pointing at `/about/` and `/portfolio/` would do it. The deferred "homepage excerpts" idea in ideas.md belongs to the same decision.

## `/about/`

- The "I'm looking for my next role" paragraph names Director, Senior Director, or VP of product design or UX, or an innovation lead. The position should lead, with full-time roles, defined projects, and partnering with engineering and industrial design firms as the ways to work together. The page doesn't mention freelance or partner work today.
- The hardware story is there (Belkin, Wemo, the patents, the awards) but sits under the Invoca AI paragraph. Reorder so hardware and software comes first and the AI work shows as fluency on top of it. MiniMed isn't named in the body at all.
- Link the main portfolio. `/portfolio/saas/` gets no internal links for now; it goes into applications and tailored resumes (Jon, 2026-11-24).
- All three testimonials are from Invoca colleagues and speak to AI and SaaS work. A quote from the Belkin years would back the position.
- Do the reading-column layout change at the same time ([ideas.md](../../ideas.md)).

## `/now/`

`/about/` and `/hire/` now carry the job search and the ways to work with Jon (Jon, 2026-11-24), so `/now/` no longer has to. Its "Looking for work" section can shrink to a pointer or go, and the page can go back to what Jon is up to. "What I'm making" already leads with 3D printing and AI-assisted development and fits as is.

## `/portfolio/` and the second portfolio

- `/portfolio/` becomes the hardware-and-software portfolio: a hand-picked order instead of date order, a short intro saying what the position is, and a new title and description (today: "UX design and leadership work and projects").
- Candidate pieces: Belkin router setup, Wemo, Velop, the Linksys app, Belkin hardware behavior specs, the EDIT framework, Datto Secure Edge, the MiniMed pump interface and watch concepts, CareLink Pro, the virtual patient software, the discovery and concept-sprint talks, and the coordinated-experience and data-dictionary prototypes for prototyping and AI. A patents piece would be new.
- MiniMed stays and gets framing (Jon, 2026-11-08). The work dates from 2004–2008, with contract work there before that (corrected 2026-11-20; the portfolio dates are ordering, not real dates), so the intro or a sentence on each piece should say what it shows now: hardware and software designed together for a regulated, safety-critical device. That way it reads as evidence rather than as the portfolio's age.
- Recent hardware evidence comes from side projects: Usage-Chan (software for the face of an existing Stack-Chan desk robot, showing live Claude usage; Jon didn't build the robot, and it has no motion routines yet – Jon, 2026-11-24), Parker (a garage parking sensor), and Pointer-AR. Decided (Jon, 2026-11-25): they go on `/portfolio/` as cards at the end of the list, labeled as in development, so the [card labels](2026-11-08-two-portfolios-design.md#card-labels-not-built) come first. Usage-Chan goes on now; Parker after a fuller write-up and photos of the build; Pointer-AR once it becomes a desk robot, even in prototype form. The intro makes the point they support: it's easier than ever to prototype hardware and its behavior together, and these pieces show Jon doing it, so his prototyping doesn't read as software-only.
- The second portfolio, for general UX Director roles, is mostly today's set plus Invoca work not shown yet, such as the workflow builder and the SDLC reinvention; all of it can be shown (Jon, 2026-11-24). It gets its own URL that applications and tailored resumes link to, and no internal page links it for now (Jon, 2026-11-24). No shortlink: the resume prints the full URL (Jon, 2026-11-24).
- Decided (Jon, 2026-11-24): the second portfolio carries `noindex` and stays at `/portfolio/saas/`. The 11/8 reasoning: Indexed, it shows up when someone searches for Jon and UX leadership, and it competes with the main portfolio in those results. With `noindex`, only people with the link find it, which keeps search results on the position.
- Pieces used as cases in the capabilities deck should follow the deck's case shape (problem, what Jon did, what changed), so the deck can link to them and a reader finds the same story.

## Portfolio detail pages

Each piece gets front matter naming its portfolio or portfolios. Detail pages have previous/next links within the portfolio, so a piece in both portfolios needs a rule: follow the portfolio the visitor came from, follow the piece's main portfolio, or replace previous/next with a link back to the portfolio. That question goes in the two-portfolio spec.

## `/sides/` and project pages

- The intro already says "apps and gadgets" and names AI-assisted development. The grid is in date order, so hardware projects could move up or be grouped.
- Parker needs photos of the physical build. Usage-Chan runs on a stock Stack-Chan, so there's no build of Jon's to show (Jon, 2026-11-24). Project pages have no image slot today (the hero image item in ideas.md), so that work moves up.
- The platform badge ("Hardware," "iOS app") shows the range at a glance.
- AI skills and routines as a category adds AI fluency that isn't app-shaped.
- The "Still just ideas" list is already a list of small single-purpose devices, which suits the position.

## Posts

Lead figures go first to the essays Jon sends people and to posts about hardware and software together. The position would also benefit from a few recent posts on that theme, since most of the recent writing is about AI and SaaS.

## Unchanged

`/wisdom/`, `/friends/`, `/colophon/`, `/technologies/`, the labs (`/color/`, `/type/`, `/ogimages/`), and the error pages. `/sides/jonplummer-11ty/` and `/colophon/` already tell the story of directing agents to build the site.
