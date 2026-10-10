# Findability implementation plan

> Steps use checkbox (`- [ ]`) syntax for tracking. Decisions answered 2026-10-09; see Status for what's built and what's left.

**Goal:** Make jonplummer.com back up LinkedIn for recruiters and hiring managers. LinkedIn is where they find Jon. The site is where they check him out, usually after a name search or a click from his profile. So the site should describe him in the same words LinkedIn uses, say plainly that he's available and for what, hand over a resume, and tie its identity to the LinkedIn profile.

**Why now:** Heather Joy asked (2026-10-06) whether the two properties could support each other better. The review that day found LinkedIn doing its part and the site lagging.

**What this doesn't touch:** LinkedIn itself. The headline test is still running (NotePlan `Notes/EVA/LinkedIn headline test.md`), and LinkedIn edits wait for its reading. Nothing on the site feeds LinkedIn's search, so this work won't skew the test.

## Status

- 2026-10-09: Tasks 1–7 built and tested. They went into commit 589ac52e along with the dark OG cards, so that commit's message covers more than OG.
- 2026-10-09 evening: Jon refreshed the resumes on misc. Decision 6 settled: the four Tablet Stage awards are stated as a group, "Belkin Tablet Stage, 2013 and 2014," matching the resume. About, the Person schema, `awards-canonical`, and `check_facts.py` were updated to match, and the build and tests pass.
- **Left:** push, deploy, then Task 8's live checks. After deploy, `check_facts.py` should come back clean. Until then it flags the four per-award years still on the live About page.

### What changed from the plan as written

- About links straight to `https://misc.jonplummer.com/Jon-Plummer-resume.pdf`, not to `/resume/`. The `/resume/` redirect exists only in `.htaccess`, so `internal-links` reports it as broken. Teaching the test to accept redirect paths is a test-code change the repo's CLAUDE.md says to ask about first. The redirect is still there for print and email, and the About link never needs to change, since the PDF is overwritten in place.
- A second redirect handles `/resume` without the slash. It has to stay after `/resume/`, because mod_alias takes the first match and would turn `/resume/` into the PDF URL plus a slash.
- `robots.txt` also keeps `AnthropicAI`, the name the old file actually used, alongside `anthropic-ai`.
- The About page's `date` moved to 2026-10-09, so the page shows "updated Oct 9, 2026." The build regenerated the About OG image to match.
- `docs/agent-memory.md`, under "Person JSON-LD," now carries the jobTitle and the reminder to remove the whole availability paragraph when Jon takes a job.

## Decisions for Jon

Each has a recommendation. Answer inline.

1. **About page meta description: say "looking" or not?** Search snippets show this text.
   - A (recommended): `Jon Plummer is a product design and UX leader looking for a Director or VP role. He has led design teams at Invoca, Cayuse, and Belkin.` (135 characters). It's the one place a Google snippet can say he's available. It has to change the day he takes a job, and that's added to the step list in Task 4.
   - B: `Jon Plummer is a product design and UX leader in enterprise SaaS, AI, IoT, and medical devices. He has led design teams at Invoca, Cayuse, and Belkin.` (150 characters). Doesn't go stale, but doesn't say he's available.
   - Answer: B

2. **Where the availability line goes on About.**
   - A (recommended): directly under the `(updated …)` line, before "Most companies say…". A recruiter sees it without scrolling.
   - B: where the sentence sits now, in paragraph five, with the new line added after it. The opener stays first, but the line is below the fold on a phone.
   - Answer: What if it went between "Most companies" and "I speak"?

3. **Wording of the availability line.** Draft:
   > I'm looking for my next role – design leadership where the work is deciding what to build, and making sure the reasoning survives all the way to what ships. Director, Senior Director, or VP of product design or UX – or an innovation lead at that level – remote from Eugene, Oregon. [My resume](/resume/) has the details.

   The first sentence must stay exactly as it is now. `pnpm run test seo` matches it to decide whether the Person schema may name a current employer. Does the second sentence say what you want? Should the innovation clause stay public?
   - Answer: Innovation clause is fine, but I think we need to get a little hands-on-prototyping in there.

4. **Where the public resume lives, and its URL.** The base resume changed 2026-10-02 (`~/Documents/EVA/resume/2026-10/`). The public copy on misc.jonplummer.com was refreshed 9/24 from the 2026-09 base, so it's behind. Options:
   - A (recommended): refresh the misc copy from the 2026-10 base under a filename that never changes, then add `/resume/` to `src/_data/redirects.yaml` pointing at it. That gives one short URL for the page, email signatures, and print, and each refresh is an overwrite with no site deploy.
   - B: link the misc file directly from About. One less moving part, but the URL is long and changes whenever the filename does.
   - Needed either way: the misc URL (not recorded anywhere in the project folder) and the refresh.
   - Answer: A

5. **robots.txt: let AI assistants read pages when a person asks?** Right now `ChatGPT-User` is blocked. That's the agent OpenAI uses when someone in ChatGPT asks it to read a page, so a recruiter who pastes your URL into ChatGPT gets nothing back. `AnthropicAI` and `Claude-Web` are older names Anthropic no longer lists, so the file probably doesn't block Claude's training crawler (now `ClaudeBot`).
   - A (recommended): keep blocking training crawlers (GPTBot, ClaudeBot, Google-Extended, CCBot, plus the old Anthropic names, which cost nothing to keep). Let user-triggered fetches and AI search indexing through (ChatGPT-User, OAI-SearchBot, Claude-User, Claude-SearchBot) by falling through to `User-agent: *`.
   - B: block everything AI, training and lookups both. Add ClaudeBot, Claude-User, Claude-SearchBot, and OAI-SearchBot to the block list.
   - C: leave the file as is.
   - Google-Extended controls Gemini training only. It doesn't affect Google Search or AI Overviews in any option.
   - Answer: A

6. **Award years conflict.** The About page and the Person schema list TechAwards Circle Gold, EdTech Digest Cool Tool Finalist, and TCEA 20 Hottest as "2013 and 2014." The canonical file (`awards-canonical-2026-08-26.md` in the project folder) has TechAwards 2013, TCEA 2013, and EdTech Digest 2014. One side is wrong. Which? Per the facts rule, the owner file gets fixed first, then `tooling/check_facts.py` runs. If the canonical file is right, Task 3 corrects the schema and Task 4 corrects the About list.
   - Answer: We've been through the awards cleanup in chats about resume, so the superset resume should be considered authoritative. Do whatever it says, unless that raises questions, in which case let's talk about it. the most recent resumes should already match.

7. **Optional schema extras.** Each is true and public already. Say no to any you'd rather leave off.
   - `image`: the Rob Ullman sketch (`/assets/images/jon-sketch-by-rob-ullman-light.png`), already on /colophon. Some search features show a person's image. A real photo would do more if you have one you like.
   - `homeLocation`: Eugene, Oregon (LinkedIn shows this already).
   - `alumniOf`: University of Washington and University of Michigan.
   - Answer: yes to all

## Tasks

Global constraints, from the repo's own rules:

- Run `pnpm run build` before any test that reads `_site/` (`seo`, `html`, `internal-links`).
- Spell-check runs on markdown. New proper nouns go in `cspell-custom-words.txt`.
- Files written from Cowork land mode 600 and 403 on Dreamhost (`docs/agent-memory.md`). Run `chmod 644` on any new asset before deploying. Template and data edits don't create new served files, so this only matters if Task 6 adds one.
- Make all the edits in one batch, then build and test once (the repo's CLAUDE.md, "Batch similar changes"), then preview for Jon via `pnpm run dev`.

### Task 1: Homepage description in LinkedIn's vocabulary

**Files:** `src/index.njk` (front matter), `src/_includes/schema/website.njk`, `src/_includes/base.njk` (pagination description)

- [x] `src/index.njk` `description:`
  - Before: `UX design leader sharing insights on design, leadership, and product development. Experience at Invoca, Cayuse, Belkin, and Medtronic.`
  - After: `Product design and UX leader Jon Plummer on design leadership, AI-era product work, and coordinated experience. Formerly Invoca, Cayuse, Belkin, Medtronic.` (155 characters, at the point where Google usually cuts snippets)
- [x] `website.njk` hard-codes a third, different description that leaves out Cayuse. Render it from the page instead so the two can't drift: `"description": {{ computedDescriptionValue | dump | safe }},`
- [x] `base.njk` line 21, pages 2 and up of the blog: change "UX leadership blog" to "product design and UX leadership blog." Leave the rest.

**Why:** the homepage is what a name search usually lands on. "Sharing insights" says nothing a recruiter can match to a req.

### Task 2: About page description

**Files:** `src/about.md` (front matter)

- [x] Replace `description:` with the text chosen in Decision 1.
- OG images don't render the description (checked in `scripts/content/generate-og-images.js`), so no OG regeneration is needed. The `og:image:alt` text picks up the new description by itself.

### Task 3: Person schema on /about/

**Files:** `src/_includes/schema/person.njk`

- [x] `jobTitle`: `UX design leader` → `Product design and UX leader`
- [x] `description`: → `Product design and UX leader. Enterprise SaaS, AI, IoT, and connected and medical devices, at Invoca, Cayuse, Belkin, and Medtronic.` This mirrors the LinkedIn headline. It's in the schema, not the visible page, so the length doesn't matter.
- [x] `knowsAbout`: replace the five generic entries with the headline's and Top skills' terms:
  ```
  "Product design", "User experience design", "Design leadership",
  "Design strategy", "Design systems", "Manager development",
  "Prototyping", "AI product design", "Customer discovery",
  "Enterprise SaaS", "IoT and connected devices", "Medical device software"
  ```
- [x] `award`: correct the three years per Decision 6. Also merge the two separate "CES Innovation Award" lines into one entry, `CES Innovation Award (2018, 2019, 2019)`, or keep them separate with products named, matching the About list. Today they read like a duplicate.
- [x] Add whichever of `image`, `homeLocation`, `alumniOf` Decision 7 keeps.
- [x] Do **not** add `worksFor`. The seo test fails it while About says he's looking, and that's correct.

### Task 4: Availability line and resume link on About

**Files:** `src/about.md`, and `src/_data/redirects.yaml` if Decision 4 is A

- [x] Put the Decision 3 text where Decision 2 says. If it moves to the top, delete the old copy of the first sentence from paragraph five. Don't leave it in twice.
- [x] If Decision 4 is A, add to `redirects.yaml`:
  ```yaml
  - from: /resume/
    to: https://misc.jonplummer.com/<stable filename>
  ```
  `seo.js` skips redirect pages. `internal-links` should accept `/resume/` once the redirect exists, and Task 7's build confirms it.
- [x] Normalize the About page's LinkedIn link from `https://linkedin.com/in/jplummer` to `https://www.linkedin.com/in/jplummer/`, the form the schema and the recommendations link use.
- [x] Add to `docs/agent-memory.md` (or wherever the repo keeps standing reminders): "When Jon takes a job: remove the availability line and the meta description's 'looking for' wording from about.md in the same change that adds `worksFor` to person.njk."

### Task 5: rel="me" for LinkedIn

**Files:** `src/_includes/head/links.njk`

- [x] Add `<link rel="me" href="https://www.linkedin.com/in/jplummer/">` after the Bluesky line.
- The payoff is small. LinkedIn doesn't link back with rel="me," so nothing gets verified. It does tell search engines the site and the profile are the same person, which is all a name search needs. It costs one line.

### Task 6: robots.txt

**Files:** `src/robots.njk`

- [x] Rewrite per Decision 5. For option A:
  ```
  # Block AI training crawlers
  User-agent: GPTBot
  User-agent: ClaudeBot
  User-agent: anthropic-ai
  User-agent: Claude-Web
  User-agent: Google-Extended
  User-agent: CCBot
  Disallow: /

  # Everyone else, including search engines and AI assistants
  # fetching a page because a person asked (ChatGPT-User,
  # OAI-SearchBot, Claude-User, Claude-SearchBot)
  User-agent: *
  Allow: /

  Sitemap: {{ site.url }}/sitemap.xml
  ```
  Grouped user-agent lines sharing one rule set is standard robots.txt syntax.

### Task 7: Test coverage, then build and test

**Files:** `scripts/test/seo-meta.js`, `docs/tests.md`

- [x] Nothing checks today that the JSON-LD blocks parse. Task 3 hand-edits JSON inside a template, where one trailing comma breaks it silently. Add a check to the `seo` test: for every built HTML page, every `<script type="application/ld+json">` body must `JSON.parse`. Report the file and the parse error on failure. Document it in the `seo` section of `docs/tests.md`.
- [x] No test covers robots.txt. Verify by reading `_site/robots.txt` after the build. Adding a test for a file this small isn't worth it unless you want one.
- [x] `pnpm run build`
- [x] `pnpm run test fast`. Expect `seo`, `html`, `internal-links`, `spell`, `frontmatter`, and `markdown` to pass, with the new JSON-LD check passing on every page.
- [x] Spot-check `_site/index.html` and `_site/about/index.html`: meta description, `og:description`, both JSON-LD blocks, and the rel="me" links.

### Task 8: Deploy and check the live site

- [x] Refresh `Jon-Plummer-resume.pdf` on misc.jonplummer.com from the 2026-10 base (the live copy is from 9/24). `JonPlummer.pdf` there is an identical duplicate; refresh it too or retire it.
- [ ] Deploy the usual way.
- [ ] Paste https://jonplummer.com/about/ into Google's Rich Results Test or validator.schema.org. Expect one Person with no errors.
- [ ] Open https://jonplummer.com/resume/ and confirm it lands on the current resume.
- [ ] Fetch https://jonplummer.com/robots.txt and confirm it matches.

### Task 9: Measure it

The site's part can only be measured through name searches, since recruiters don't find people on Google.

- [x] **Before deploying**, record a baseline from Google Search Console (Performance, last 28 days, query contains "plummer"): impressions, clicks, average position, and the top pages for those queries. Put it in the NotePlan headline-test note or a sibling note, dated.
  - Recorded 2026-10-09 from the URL-prefix property `https://jonplummer.com/` (the domain property isn't shared with this account). Last 28 days, ending 10/6, queries containing "plummer": one query, "jon plummer", with 40 impressions, 2 clicks, 5% CTR, and an average position of 2.4. So the site already ranks near the top for his name. The 10/6 note that a name search didn't turn up the site came from a non-Google engine and doesn't hold for Google. What's left to win is the snippet text (Tasks 1 and 2) and searches with a role word attached.
- [ ] Four weeks after deploy, pull the same numbers. Also check whether /about/ or the homepage now shows for "jon plummer design" and "jon plummer ux."
- [ ] Watch site analytics for referrals from linkedin.com to /about/ and /resume/. Those are people checking him out.

## Later: LinkedIn, after the headline test reading

Not part of this plan's work. Listed so nothing gets lost.

- [ ] **Open to Work job titles** (up to five). Recruiters filter on these more than anything else. Proposed: Director of Product Design, Senior Director of Product Design, Head of Design, Director of User Experience, VP of User Experience. Check what's set now first.
- [ ] **Skills.** Make sure the full list carries the terms recruiters filter on (Design Leadership, Product Design, User Experience (UX), Design Strategy, Design Systems, Design Management, Prototyping, User Research, AI product design), not just the top five.
- [ ] **Top-card link** to jonplummer.com, or /resume/, if LinkedIn offers the intro's custom-link field on this account.
- [ ] **Case-study links on Experience entries.** Invoca: Call Review Console, IA vision, Enhanced Data Dictionary. Belkin: Wemo, Velop, the Linksys page. Cayuse and Concentric Sky: whichever portfolio pieces apply. Featured holds five. Experience is where recruiters read the detail.

## Background

- Review of 2026-10-06 (Command Center status log, that date): LinkedIn had 80 search appearances that week, Open to Work set to recruiters only, five site links in Featured, the site in contact info, and weekly posts linking to the site. The site's homepage and About descriptions, the Person schema, and the WebSite schema all said "UX design leader" with generic topics. The About page said he was looking only in paragraph five, with no resume link. The site had rel="me" for Mastodon and Bluesky but not LinkedIn.
- A name search ("Jon Plummer design leader") on a non-Google engine returned LinkedIn and RemoteOK but not the site. That's why Task 9 sets a Search Console baseline before deploying.
