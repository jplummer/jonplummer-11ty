# Font stack exploration

## Goal

Try [Modern Font Stacks](https://modernfontstacks.com) against the **real** site type scale and colors (`jonplummer.css`, system light/dark). The live blog uses **System UI** via `--font-family`. This tool is one index-shaped preview with two menus (headings vs everything else) and an optional lock so both stay identical.

## Command

  ```bash
  pnpm run font-gallery
  ```

Open `scripts/font-explore/output/index.html` from the repo so `jonplummer.css` resolves. Output is gitignored; regenerate after editing the generator or `modern-font-stacks.js`.

## What you get

- **One card** — home-page slice (header, post, link row, pagination, footer) at **full** `:root` typography (no shrunken preview tokens). Colors are unchanged from production tokens (`light-dark()` follows your OS).
- **Headings** selector — applies to `h1`–`h4` in the preview (site title + article title today).
- **Everything else** — `font-family` on `.jp-page` so nav, paragraphs, footer, `pre`/`code`, etc. use the body stack.
- **Checkbox** — when checked, changing either menu keeps the other in sync; when unchecked, they move independently.
- **Example CSS** — updates with the menus; embedded JSON keeps the page working on `file://`.

Initial values come from `DEFAULT_HEADING_STACK_ID`, `DEFAULT_BODY_STACK_ID`, and `DEFAULT_SYNC_STACKS` in `scripts/font-explore/generate-font-gallery.js`.

## Outputs

- `scripts/font-explore/output/index.html` — the lab page.
- `scripts/font-explore/output/stacks.json` — stack list, `siteDefaultStackId`, and `defaults` (`headingStackId`, `bodyStackId`, `syncStacks`).

## Shipping a pair

Add something like `--font-family-headings` and set heading elements to use it while `body` keeps `--font-family`. Keep fallbacks aligned with [Modern Font Stacks](https://modernfontstacks.com).

## Source of truth

Stack strings are copied from the [modern-font-stacks](https://github.com/system-fonts/modern-font-stacks) project (CC0). If upstream changes, update `scripts/font-explore/modern-font-stacks.js` and regenerate.
