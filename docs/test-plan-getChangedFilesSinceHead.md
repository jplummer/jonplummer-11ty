# Test plan: getChangedFilesSinceHead() consolidation

Use this to verify behavior is unchanged after moving "changed files since HEAD" into `scripts/utils/test-helpers.js` as `getChangedFilesSinceHead()`.

## Scope of change

- **New:** `getChangedFilesSinceHead()` in `scripts/utils/test-helpers.js` — runs `git diff --name-only --diff-filter=ACMR HEAD`, returns relative paths from repo root (no filtering).
- **Updated to use it:** `scripts/test/markdown.js`, `scripts/test/frontmatter.js`, `scripts/test/spell.js`, `scripts/test/accessibility.js`, `scripts/test/seo-meta.js`, `scripts/test/links-yaml.js`, `scripts/test-changed.js` (each keeps its own filtering).

## Prerequisites

- Clean working tree **or** at least one uncommitted change in `src/` (e.g. a markdown file) so you can test `--changed` with files.
- `pnpm run build` has been run successfully (required for html, internal-links, og-images, rss, seo when not using --changed).

## Baseline (before implementation)

Run once and note results (all should pass / exit 0):

1. `pnpm run test fast`
2. `pnpm run test changed` (with no uncommitted changes — expect "No markdown or YAML files changed", exit 0)
3. `node scripts/test/markdown.js --changed` (no changes — expect "No files changed since last commit", exit 0)
4. `node scripts/test/links-yaml.js` (no --changed; run full test — expect pass or fail based on current links.yaml state)

## After implementation

### 1. Full suite (no --changed)

- `pnpm run test fast`  
  **Expect:** Same outcome as baseline (all pass or same failures). No change in "run all files" behavior.

### 2. test changed (aggregate)

- With **no** uncommitted changes:  
  `pnpm run test changed`  
  **Expect:** "No markdown or YAML files changed since last commit", exit 0.

- With **some** uncommitted change in `src/` (e.g. add a space in a post and save):  
  `pnpm run test changed`  
  **Expect:** Runs spell, frontmatter, markdown, links, seo with --changed; each test runs only for the changed file(s) or skips appropriately. Exit 0 if no issues.

### 3. Individual tests with --changed

Run from repo root. Use a state where you have one or more uncommitted changes in `src/` (e.g. a post or `src/_data/links.yaml`).

- `node scripts/test/markdown.js --changed`  
  **Expect:** Runs markdownlint only on changed files (e.g. only changed .md in src/). Exit 0 if lint passes.

- `node scripts/test/frontmatter.js --changed`  
  **Expect:** Validates only changed markdown in src/_posts/. Exit 0 if frontmatter is valid.

- `node scripts/test/spell.js --changed`  
  **Expect:** Spell-checks only changed files. Exit 0 if no spelling issues (or same warning behavior as before).

- `node scripts/test/accessibility.js --changed`  
  **Expect:** If only non-HTML source changed, may exit 0 with "no files to check" or similar; if HTML-relevant files changed, runs a11y on the affected built pages. No new failures.

- `node scripts/test/seo-meta.js --changed`  
  **Expect:** If no markdown in src/ changed, skips (or runs and finds nothing). If markdown changed, runs SEO checks for the affected page(s). Exit 0 if metadata is valid.

- `node scripts/test/links-yaml.js`  
  **Expect:** When run **without** --changed: full links test (unchanged). When run **with** --changed (e.g. after touching only `src/_data/links.yaml`): runs and validates links.yaml. When run with --changed and only a post changed (links.yaml not in changed set): should skip or run without false positives. (Confirm expected behavior from current links-yaml.js --changed logic.)

### 4. Edge cases

- **No changes:**  
  `node scripts/test/markdown.js --changed`  
  **Expect:** "No files changed since last commit", exit 0 (no files passed to validateFn).

- **Only file outside src/ changed (e.g. README):**  
  `pnpm run test changed`  
  **Expect:** test-changed filters to src/ only, so "No markdown or YAML files changed", exit 0.

### 5. test-runner integration

- `node scripts/test-runner.js markdown`  
  **Expect:** Runs markdown test on all source files (no --changed). Same as baseline.

- `node scripts/test-runner.js frontmatter`  
  **Expect:** Same as baseline (all files).

## Sign-off

- [ ] `pnpm run test fast` matches baseline.
- [ ] `pnpm run test changed` with no changes exits 0 with "No markdown or YAML files changed".
- [ ] `pnpm run test changed` with uncommitted src changes runs the five authoring tests and results are correct.
- [ ] Each of markdown, frontmatter, spell, accessibility, seo-meta, links-yaml with --changed behaves as above.
- [ ] No new failures; indexnow and other non-test scripts unchanged.
