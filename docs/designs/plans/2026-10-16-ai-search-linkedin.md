# AI search lessons for the LinkedIn profile

Same source as the [site review](2026-10-16-ai-search-site.md): Google's [Optimizing for generative AI features in Google Search](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide). This covers only changes Jon can make on the profile.

The 2026-10-09 profile diagnosis (`linkedin/profile-diagnosis-2026-10-09.md` in the Online presence improvement project folder) covers recruiter search inside LinkedIn: Open to Work locations and titles, scope lines, skills. This doc doesn't repeat it. It looks at what Google and AI answer engines can read, which is LinkedIn's logged-out public profile. Fetched without signing in on 2026-10-16, that page shows:

- Page title: "Jon Plummer - University of Washington - Eugene, Oregon, United States | LinkedIn"
- Meta description, which Google's snippet and most AI summaries draw on: "I speak the languages of design, engineering, and business. It means I can argue a design… · Experience: Invoca · Education: University of Washington · Location: Eugene"
- In the Person schema LinkedIn embeds: `jobTitle` is empty, `worksFor` is empty, and every past employer except Invoca has its name and description replaced with asterisks.
- Shown in full: Websites, the About opener (cut at about 90 characters), Honors & Awards with descriptions, Patents, Licenses, Volunteer work, recommendations, and recent posts.

The page never says "design leader," "product design," or "UX" in the title, the description, or the schema. A crawler learns Jon went to UW, lives in Eugene, and worked at Invoca. The guide's main point applies here: AI answers retrieve whatever ranks and can be shown as a snippet. For a name search, that's the LinkedIn title and description, next to the site.

## Recommendations, by priority

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 1 | Make the About's first 90 characters say what Jon does | High: it's the snippet Google and AI answers show | Low, but it's a voice decision |
| 2 | Fix the public awards to match the canonical list | Medium: public, and it contradicts the site and resume | Low. Decided 2026-10-16: follow the canonical list |
| 3 | Add a current position, if there's a true one | Medium | Waiting on Wrico |
| 4 | Add the trailing slash to the Portfolio link | Trivial | Done 2026-10-16 |

### 1. The About opener is the snippet

LinkedIn builds the public meta description from the first 90 or so characters of About. Today that's "I speak the languages of design, engineering, and business. It means I can argue a design…". It's a good opening for a person reading the whole section. As a snippet it names no role, no field, and no level.

The fix is to name the role in the first sentence and keep the trilingual line second. For example:

> I lead product design and UX teams, most recently at Invoca on AI-powered SaaS. I speak the languages of design, engineering, and business…

The first 90 characters of that read "I lead product design and UX teams, most recently at Invoca on AI-powered SaaS. I speak th…". That draft is a starting point for Jon to rewrite. The About structure in `linkedin-about-2026-08-27-FINAL.md` puts the trilingual claim first on purpose, so this trades some of that opening's force for a snippet that names the role.

Fix in the same edit: the live About, checked signed in on 2026-10-16, says "I've authored 20+ patents in IoT and medical software." `about-me.md` retired "20+" in favor of 18 patent families, and the site and resume already say 18. A version in the About's own voice: "I'm an inventor on 18 patent families in IoT, networking, and medical devices." `tooling/check_facts.py` now lists "20+ patents" as retired. Its first run found three more uses in the NotePlan note `EVA/Positioning reference.md`, in the third-person bio, the speaker intro, and the first-person bio.

### 2. The public awards don't match the canonical list

Honors & Awards is fully visible logged out, and LinkedIn copies the titles into the page's schema, so AI answers can quote it. Checked against `awards-canonical-2026-08-26.md`:

- The 2012 (LiveAction Camera Grip) and 2015 (Wemo Insight Switch) entries are titled "International Design Excellence Awards, finalist." The canonical list says IDSA IDEA Bronze for both. Jon, 2026-10-16: an IDEA finalist placing is the Bronze, so neither title is false, but LinkedIn follows the canonical list because that list also feeds the resumes and applications. Retitle both "IDSA IDEA Bronze."
- Both of those entries name the issuer "Industrial Designers Association of America." The organization is the Industrial Designers Society of America, which the third IDEA entry gets right.
- A third entry, "IDEA 2013 Finalist for WeMo iOS app" (August 2013), isn't on the canonical list. `tooling/check_facts.py` already lists that line as retired ("unsupported award line; not in awards-canonical"). Delete it from LinkedIn.
- The Tablet Stage entry gives each award its own year: "TCEA 20 Hottest EdTech Products (2013)," "(2013–14)," and "(2014)." Per-award years were retired on 2026-10-09 because the award sites contradict each other. Use the group form instead: "Belkin Tablet Stage, 2013 and 2014."
- The two CES Innovation Award entries have identical titles. Their descriptions tell them apart, but the schema lists "CES Innovation Award" twice with nothing else. Putting the product in the title fixes that, as in "CES Innovation Award – Wemo 3-Way Light Switch."

The guide doesn't address conflicting facts directly. The reasoning is mine: when an AI answer pulls from both the site and LinkedIn, two different award levels for one product is the kind of conflict it either repeats or resolves wrongly. `tooling/check_facts.py` can't read LinkedIn, so this check stays manual.

### 3. A current position, if there's a true one

On hold, 2026-10-16. There's no current position today. If the Wrico contract signs, Jon becomes a sole proprietor, and that's a true current entry to discuss then.

The page title falls back to education because no experience entry is current. With a current entry, LinkedIn would most likely put that title and company in the page title and in `jobTitle`. That's inferred from how other public profiles render, not documented by LinkedIn. The 10/09 diagnosis already recommends a current position for recruiter search (item 4) and sets the same condition: only something real, such as contract work, advising, or mentoring at Designed.org or tupu.io. This adds a second reason. The entry's title would become the first words of every Google result for Jon's name.

### 4. Portfolio link – done 2026-10-16

The Websites section linked `https://jonplummer.com/portfolio`, which 301s to `/portfolio/`. Jon added the slash.

## Not changeable, but worth knowing

LinkedIn masks every past employer except the most recent for logged-out visitors. So Google and AI answers can't read Belkin, Medtronic, Cayuse, or Concentric Sky from LinkedIn. They have to get them from the site. That's why the site's About, Person schema, and portfolio pages carry so much of the load, and why item 5 of the site doc (an agentic-products case study) would show up in name searches where LinkedIn can't.
