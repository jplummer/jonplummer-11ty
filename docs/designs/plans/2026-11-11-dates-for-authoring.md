# Dates that are easy to author and hard to get wrong

**Goal:** A post's URL never changes once it is out, and dating a post takes no thought: one command writes the date everywhere it goes, and the build refuses anything that disagrees.

**Status:** Plan, awaiting Jon's review. Nothing is implemented.

## What Jon decided (2026-11-11)

1. Post URLs stay put. Order on index pages and in feeds may drift once.
2. Authoring dates should be easy for a forgetful human, for today or a future day.
3. The year folders under `src/posts/` are a filing convenience. Nothing treats them as data, and nothing will check them.
4. A future-dated post is held out of the live site until its day, and shows on the dev server.
5. A command starts a new post, and every new post starts as `draft: true`.
6. A title given at the start is temporary. The title, the slug, and the day can all change while a post is a draft.
7. The hold is for posts only. `draft: true` works for posts, side projects, portfolio pieces, and wisdom entries.
8. Links are dated by the import and wisdom dates are never shown, so neither gets a future-date check.

## A post's name and date are settled when it is published

Decision 6 moves the moment that matters. While a post is a draft it has no URL in the world, so its filename, slug, and date are working values. They become the record at the moment `draft: true` comes off. The date that needs to be right is the publishing day, and that is the one a forgetful human gets wrong: a post started on the 3rd and finished on the 20th still says the 3rd in two places.

Jon ruled out a second command for publishing (2026-11-11): leaving the editor to build a careful command line is harder than editing two things by hand. So publishing stays a hand edit, made hard to get wrong in two ways. The new post carries a short comment beside `draft: true` that lists the steps, and the build fails with the exact rename to make when the filename and the front matter day differ.

## Constraints

- `src/posts/posts.11tydata.js` and `eleventy/config/date-parsing.js` are not edited. They build the URLs.
- After every task: build, then compare the sorted list of every path in `_site/` with the list saved before the task. Post paths must be identical. Any other difference is named in the commit message.
- Each task is its own commit, shown to Jon for approval first. No push or deploy without asking.
- Each new test is proved by breaking the code on purpose, then restoring it.
- Tests never write to real content. Commands under test run in a scratch folder.

## The date stays in both the filename and the front matter

The filename date gives sorting in the folder and names the OG card. The front matter date is what Eleventy and the URL code read. Dropping either means editing the URL code or renaming 194 files, and both put live URLs at risk for a small gain.

The drift Jon worries about is closed another way. `new-post` writes both, so they start equal. `test frontmatter` already fails the build when a post's two dates differ, and task 3 makes that comparison exact and its message say what to rename.

## Tasks

### 1. A test that pins post URLs to filenames

New unit test `post-urls` (`scripts/test/post-urls.js`), in the manifest and the Unit list in `docs/tests.md`.

- For every file under `src/posts/`, run its front matter date through the real date parser and the real permalink function, and require `/YYYY/MM/DD/slug/` to equal the date and slug in the filename.
- Run the same check in child processes with `TZ=UTC`, `TZ=Asia/Tokyo`, and `TZ=Pacific/Honolulu`, so the answer cannot depend on the machine.
- Fixtures: a date-only string, a Pacific time with offset, and the hour either side of both daylight-saving changes.

The filename is the record of where a post lives, so this fails if any later date change would move a URL. It reads the two protected files and changes neither.

Proof it can fail: point the test at a copy of the permalink function that reads UTC, and expect failures.

### 2. `pnpm run new-post "Working title"`

New script `scripts/content/new-post.js`, with `main()` behind `require.main === module`. Unit test `new-post`.

- The title is a working title, and may be left out (`untitled`). The date is today's Pacific day from `todayIsoDate()`. Neither is a commitment.
- Slug comes from the title: lowercase, accents removed, anything else to hyphens, and it must pass `validateSlug`.
- Writes `src/posts/<year>/<date>-<slug>.md`, making the year folder if needed. Refuses to overwrite a file. Prints the path.
- `ogImage` is left for the generator, which skips drafts, so a draft has no card to rename later.

The file it writes:

```yaml
---
title: "Working title"
layout: layouts/single_post.njk
date: "2026-11-11"
tags: post
description: ""
# To publish: set date to the publishing day, rename this file to
# YYYY-MM-DD-slug.md to match the date and the final title, write the
# description, then delete these lines. A future date is held until that day.
draft: true
---
```

Tests, in a scratch folder: the file lands at the right path for a fixed `now` either side of Pacific midnight; it parses and passes the `frontmatter` field checks as a draft; a title with quotes, a colon, and accents survives being read back; an existing file is refused with nothing written. Docs: `commands.md` (deployment workflow and content authoring), `authoring.md` (a "Starting and publishing a post" section with the same steps).

### 3. Checks that compare what the URL will use

In `scripts/test/frontmatter.js`:

- Compare the filename day with the Pacific day of the front matter date, which is the day in the URL. Today the check compares text before the `T`, which can pass a date whose URL differs.
- The failure message gives the exact fix: `rename to 2026-11-20-my-post.md, or set date to "2026-11-03"`. If the post's URL is already live, change the date and leave the filename.
- Drafts skip this comparison, as they skip the whole check today, so a draft's dates can go stale without noise. The check applies the moment `draft: true` comes off.
- A post that is not a draft and has an empty `description` fails.
- No year folder check, and no future-date check on links or wisdom entries.

### 4. Hold future-dated posts, and let a wisdom entry be a draft

- `draft: true` already works for posts, side projects, and portfolio pieces, because the draft rule applies to every template. Wisdom entries are rows in a YAML file, and `test wisdom` rejects a `draft` field today. `eleventy/utils/wisdom-build.js` will leave out an entry with `draft: true` in a production build and keep it on the dev server, and `test wisdom` will allow the field when it is `true` or `false`. Tests in `wisdom-yaml.js` for both modes.
- New `eleventy/utils/publish-state.js`: `publishState(frontMatter, now)` returns `'draft'`, `'held'`, or `'live'`. Held means the post's Pacific day is after today's Pacific day. One function, used by the build and by every check, so they cannot disagree.
- `eleventy/config/preprocessors.js`: the existing draft rule calls it, and skips held posts in a production build too. The dev server shows both, as it shows drafts now.
- `scripts/build/build.js` prints one line per item left out: `Held until 2026-11-20: <title>` or `Draft: <title>`, covering posts, side projects, portfolio pieces, and wisdom entries.
- The site checks that skip drafts (`frontmatter.js`, `markdown.js`, `og-images.js`) call `publishState`. A held post still gets its front matter and markdown checked, since it is about to ship; it is skipped only where a check needs the built page.
- A held post goes out on the first build on or after its day. Nothing publishes without a deploy.

Tests: `publishState` at fixed instants either side of Pacific midnight on the post's day; a production build of a scratch site leaves a held post out and a dev-mode build includes it. Docs: `authoring.md` (`date`, `draft`), `date-timezone-handling.md`.

Applies to posts only. Portfolio pieces, side projects, and pages are not held, because their dates set nothing a reader sees.

### 5. The four display faults from the survey

One commit each.

- **Link dates read as Pacific midnight** in `eleventy/utils/merge-posts-links.js`, for both the `YYYY-MM-DD` form and the long form Eleventy hands over. Fixes the links feed showing each link a day early and `/page/N/` titles a day early. The unit tests that state midnight UTC change to midnight Pacific. Proof: every page's list of items before and after.
- **`formatDateRange` shows both years when they differ** (`Nov 19, 2025–Feb 11, 2026`). Tests in `date-utils`.
- **The changelog's "Last deployed on" uses `todayIsoDate()`** in `scripts/content/generate-changelog.js`.
- **Feed dates in RFC 822 form**, using `dateToRfc822` from the RSS plugin already installed, in the three feed templates. `scripts/test/rss-feed.js` gains a check for the form.

## What the tests don't cover

- A published post renamed by hand. The filename is the record, so a rename moves the URL and the test agrees with it. The redirect is still a hand edit in `redirects.yaml`.
- A post published with a stale date in both places, such as the day it was started. The two agree, so no check can tell. The comment in the file is the only prompt.
- A draft that was deployed, taken back to draft, and published again under a new name. The first URL was live for a while and gets no redirect.
- A held post whose day arrives with no deploy. It waits.
- A build machine with a wrong clock. Held posts would publish early or late by the clock's error.
- Portfolio and side project dates, which are in no URL and are checked for format only.

## Left for later

- A committed list of every published post URL, checked against the build, would also catch a rename. It needs updating after each new post, which is one more thing to remember, so it is not in this plan.
- `redirects.yaml` has not been checked for Apache escaping faults.
