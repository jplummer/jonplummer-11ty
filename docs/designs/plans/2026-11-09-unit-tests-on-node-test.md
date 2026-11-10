# Unit Tests on node:test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every unit test runs on Node's built-in test runner and reports how many tests it ran, so a result line can no longer hide what was checked.

**Architecture:** A custom `node:test` reporter prints the runner's existing one-line format with real counts. `pnpm run test unit` becomes one `node --test` call over the unit files. The eighteen test files are converted in three groups: one canary, eleven by the same recipe, and six by hand with one agent per file. Two throwaway scripts gate every conversion and are deleted at the end.

**Tech Stack:** Node 26 `node:test` and `node:assert` (both built in), the existing `scripts/test-manifest.js` and `scripts/test-runner.js`. No new dependency.

**Spec:** none. This replaces Tasks 6 and 7 of [the low-impact cleanup plan](2026-11-09-low-impact-cleanup.md), with the decisions from the conversation on 2026-11-09: the reporter with real counts comes first, the hand conversions run in parallel, and the mutation check is temporary.

## Why

A unit test hands the runner one made-up "file", so `404-suggest` runs 26 checks and prints `📄 1 file checked, ✅ 1 passing`. Delete 25 of them and the line reads the same. The results model was built for checks that walk hundreds of site files, and the unit tests were bent to fit it.

## Global Constraints

- The built site does not change. `diff -rq -x img .cache/unit-migration/site _site` prints nothing at the end of every task (no commit touches `CHANGELOG.md`, and the tagline salt changes `index.html` only; that one file may differ).
- Tests run one file at a time: `--test-concurrency=1`. Several write temp files and one launches a browser.
- Don't edit code under test to make a conversion pass. The only edits outside `scripts/test/`, `scripts/utils/unit-reporter.js`, `scripts/test-runner.js`, `scripts/test-manifest.js`, and docs are the mutation harness's, and it puts every byte back.
- Don't touch `scripts/deploy/deploy.js`, `scripts/content/generate-og-images.js`, `scripts/utils/og-*.js`, `eleventy/utils/css-utils.js`, or anything under `src/`.
- Every assertion that exists today exists afterward, with its message text.
- Commits: stop after each task, show Jon the title and body, and wait. Never push without asking.
- The throwaway scripts live in `.cache/unit-migration/`, which is gitignored. Nothing from there is committed.

## What Node's runner does (probed on Node 26.4.0, 2026-11-09)

These facts decide the reporter's design. Each was observed, not assumed.

- With `node --test a.js b.js`, each file runs in its own process, and every event carries `data.file`.
- When a file finishes, the reporter gets `test:summary` with that `file` and `counts: { tests, passed, failed, cancelled, skipped, todo }`. A last `test:summary` with no `file` carries the totals.
- A file that crashes on load gets no per-file summary. It gets one `test:fail` whose `name` is the file's basename, and its stack trace arrives as `test:stderr` events.
- A file with no tests gets one `test:pass` whose `name` is the file's basename, and no per-file summary. Left alone, that would print as a pass.
- A `before` hook that throws fails every test in the file, each with the hook's error. The per-file summary reports them as failed.
- `test.skip` and `{ todo: true }` arrive as `test:pass` events. Only the summary's `skipped` and `todo` counts tell them apart from a real pass.
- A `node --test` started from inside a test inherits `NODE_TEST_CONTEXT` and prints nothing. Delete that variable from the child's environment.

## Review Focus

1. **A unit test file that crashes on load.** It must print ❌ with the stack trace and exit 1. The old runner printed ✅ here until `a3fca4d6`.
2. **A file in which no test ran,** because a conversion dropped them all or a typo left the file empty. It must fail, since Node calls it a pass.
3. **A skipped or todo test.** It must show in the line and turn the icon to ⚠️, so `test.skip` can't quietly remove a check.
4. **A `before` hook that fails,** such as the browser in `og-card.js` not starting. The line must show the failures, never `0 tests`.
5. **A conversion that keeps the test names and loses assertions inside them.** The message inventory and the mutation check exist for this; the reviewer should still read the six hand conversions line by line.

Each has a test in Task 1 (1 to 4) or a gate in Task 2 (5).

---

### Task 0: Baseline

No files change.

- [ ] **Step 1:** Confirm no dev server is running (`pgrep -fl eleventy`), then `pnpm run build && mkdir -p .cache/unit-migration && rm -rf .cache/unit-migration/site && cp -R _site .cache/unit-migration/site`.
- [ ] **Step 2:** `pnpm run test unit > .cache/unit-migration/unit-before.txt 2>&1; echo $?`
  Expected: `0`, 18 passed.

---

### Task 1: The reporter, and the first test written for it

**Files:**
- Create: `scripts/utils/unit-reporter.js`
- Create: `scripts/test/unit-reporter.js` (the first `node:test` file in the repo)
- Create: `scripts/test/fixtures/unit-reporter/{pass,fail,crash,empty,skip,hook-fail}.js`
- Modify: `scripts/test-manifest.js`, `scripts/test-runner.js`

**Interfaces:**
- Manifest: optional `nodeTest: true` on an entry. New export `getNodeTestIds(): string[]`. New export `getTestIdByScriptPath(absPath): string | null`.
- `scripts/utils/unit-reporter.js` default export: an async generator `(source) => AsyncGenerator<string>`, the shape `--test-reporter` takes. Named exports for the unit test:
  - `fileOutcome({ counts, crashed, ranNothing }) → { icon, summary, passed, warnings }`
  - `counts` is Node's per-file counts object, or `null` when the file crashed or ran nothing.
- Runner: `runNodeTests(ids: string[], { verbose: boolean }): Promise<number>` spawns `process.execPath` with `['--test', '--test-concurrency=1', '--test-reporter=' + reporterPath, '--test-reporter-destination=stdout', ...scriptPaths]`, `stdio: 'inherit'`, env `UNIT_REPORT_VERBOSE=1` when `verbose`, and resolves the exit code.
- `pnpm run test <id>` for a `nodeTest` id calls `runNodeTests([id], { verbose: true })`. `pnpm run test unit` calls `runNodeTests(nodeTestIds, { verbose: false })`, then runs the remaining unit ids through the existing loop, and exits 1 if either failed. The second half goes away in Task 5.

**What the reporter prints.** Emoji and name come from the manifest, found by `data.file`.

| Case | Line |
|---|---|
| All pass | `✅ 🤷 404 suggestions: 🧪 26 tests, ✅ 26 passing` |
| A failure | `❌ 🤷 404 suggestions: 🧪 26 tests, ✅ 25 passing, ❌ 1 failing` |
| Skipped or todo | `⚠️  🤷 404 suggestions: 🧪 26 tests, ✅ 25 passing, ⏭️  1 skipped` |
| Crashed on load | `❌ 🤷 404 suggestions: stopped before reporting results` then its stderr |
| No test ran | `❌ 🤷 404 suggestions: no tests ran` |

Under a failing file, one indented line per failed test: `    - <test name>: <first line of the error message>`. With `UNIT_REPORT_VERBOSE=1`, every test is listed (`    ✅ name` or `    ❌ name`) and a failure shows its whole message. With more than one file, the reporter ends by calling `printOverallSummary` from `test-results.js` with `{ testType, passed, warnings }` per file, so the closing block matches every other group run. `skipped + todo` is the warning count. A test's own `console.log` output (`test:stdout`) is shown only for a file that failed.

- [ ] **Step 1: Write the fixtures and the failing test**

Fixtures, each a few lines: `pass.js` (two passing tests), `fail.js` (one pass, one `assert.strictEqual(1, 2, 'one is not two')`), `crash.js` (`require('./does-not-exist')`), `empty.js` (a comment only), `skip.js` (one pass, one `test.skip`), `hook-fail.js` (a `before` that throws `new Error('browser did not start')`, two tests).

`scripts/test/unit-reporter.js` uses `node:test` itself. A helper `run(fixtureNames, env)` spawns `node --test --test-concurrency=1 --test-reporter=<reporter> --test-reporter-destination=stdout <fixtures>` with `NODE_TEST_CONTEXT` deleted from the environment and returns `{ status, stdout }`. Fixture files aren't in the manifest, so the reporter falls back to the file's basename as the name and `🧪` as the emoji; the tests assert on that. The tests:

```js
test('a passing file reports its test count', () => {
  const { status, stdout } = run(['pass.js']);
  assert.strictEqual(status, 0);
  assert.match(stdout, /✅ .*pass\.js: 🧪 2 tests, ✅ 2 passing/);
});
test('a failing file is marked, counted, and names the failed test', () => {
  const { status, stdout } = run(['fail.js']);
  assert.strictEqual(status, 1);
  assert.match(stdout, /❌ .*fail\.js: 🧪 2 tests, ✅ 1 passing, ❌ 1 failing/);
  assert.match(stdout, /one is not two/);
});
test('a file that crashes on load fails and shows its stack trace', () => {
  const { status, stdout } = run(['crash.js']);
  assert.strictEqual(status, 1);
  assert.match(stdout, /❌ .*crash\.js: stopped before reporting results/);
  assert.match(stdout, /Cannot find module/);
});
test('a file in which no test ran fails', () => {
  const { status, stdout } = run(['empty.js']);
  assert.strictEqual(status, 1);
  assert.match(stdout, /❌ .*empty\.js: no tests ran/);
});
test('a skipped test shows in the line and warns', () => {
  const { status, stdout } = run(['skip.js']);
  assert.strictEqual(status, 0);
  assert.match(stdout, /⚠️ .*skip\.js: 🧪 2 tests, ✅ 1 passing, ⏭️ +1 skipped/);
});
test('a failing before hook fails every test, never "0 tests"', () => {
  const { status, stdout } = run(['hook-fail.js']);
  assert.strictEqual(status, 1);
  assert.match(stdout, /❌ .*hook-fail\.js: 🧪 2 tests, ❌ 2 failing/);
  assert.match(stdout, /browser did not start/);
});
test('several files end with the overall summary; one file does not', () => {
  assert.match(run(['pass.js', 'fail.js']).stdout, /Overall Test Summary/);
  assert.doesNotMatch(run(['pass.js']).stdout, /Overall Test Summary/);
});
test('verbose lists every test by name', () => {
  const { stdout } = run(['pass.js'], { UNIT_REPORT_VERBOSE: '1' });
  assert.strictEqual((stdout.match(/^ {4}✅ /gm) || []).length, 2);
});
test('fileOutcome treats missing counts as a failure', () => {
  assert.strictEqual(fileOutcome({ counts: null, crashed: true }).passed, false);
  assert.strictEqual(fileOutcome({ counts: null, ranNothing: true }).passed, false);
});
```

`empty.js` exits 0 under Node's own rules. The reporter can't change the exit code of `node --test`, so `runNodeTests` is not what makes it 1: the reporter sets `process.exitCode = 1` when any file ran nothing. If that turns out not to carry (the reporter runs in the parent process, so it should), the fallback is for `runNodeTests` to read a line the reporter prints. Decide by running the test, and record the ruling.

Register it: `{ id: 'unit-reporter', script: 'unit-reporter.js', groups: ['unit'], nodeTest: true, name: 'Unit test reporter', description: 'Result lines, counts, and failures for node:test unit tests', emoji: '📣' }`. 📣 is taken by `indexnow`; use `📋` if Jon prefers no repeats.

- [ ] **Step 2: Add the manifest checks, and see them fail**

In `validateManifest()`: a `nodeTest` entry must be in the `unit` group, its source must contain `require('node:test')`, and its source must not contain `test-runner-helper`.

Run: `node --test --test-concurrency=1 scripts/test/unit-reporter.js`
Expected: fails with `Cannot find module '../utils/unit-reporter'`.

- [ ] **Step 3: Implement the reporter, `getNodeTestIds`, `getTestIdByScriptPath`, and `runNodeTests`**

Per the Interfaces block and the table.

- [ ] **Step 4: Run it**

Run: `pnpm run test unit-reporter`
Expected: `✅ 📣 Unit test reporter: 🧪 9 tests, ✅ 9 passing`, each test listed by name, exit 0.

Run: `pnpm run test unit; echo "exit $?"`
Expected: the reporter's line for `unit-reporter`, then the other eighteen through the old loop, `exit 0`. Two closing summaries appear until Task 5; that is accepted for the length of this plan.

- [ ] **Step 5: Commit**

Proposed title: `Report unit tests with real counts through a node:test reporter`

---

### Task 2: The two gates (throwaway)

**Files:** `.cache/unit-migration/inventory.js`, `.cache/unit-migration/mutate.js`, `.cache/unit-migration/mutations.json`. None is committed.

**Interfaces:**
- `node .cache/unit-migration/inventory.js snapshot` writes `inventory-before.json`: for each of the eighteen files, `names` (the first argument of every `check(` call) and `messages` (the source text of every string or template literal passed as `message:` to `addIssue`, or as the message argument of the file's own `fail` / `assertEqual` / `assertNotesEqual` / `assertUrlsEqual` helpers).
- `node .cache/unit-migration/inventory.js verify <id> [--allow <file>]` exits 1 unless every `name` is now a `test('…')` name in that file and every `message` still appears in the file's source. `--allow` names a JSON list of messages an agent reworded, each with its replacement and a reason; those are printed for a person to read, never passed silently.
- `node .cache/unit-migration/mutate.js <id>|all` reads `mutations.json` (`{ id, file, find, replace }`). For each: read the file's bytes, require `find` to occur exactly once, write the mutated file, run `pnpm run -s test <id>`, restore the original bytes in a `finally`, then run the test again clean. Exit 1 unless the mutated run failed and the clean run passed. It refuses to start if the target file has uncommitted changes.

One mutation per test, each a one-line break in the code that test covers:

| id | file | break |
|---|---|---|
| `date-utils` | `eleventy/utils/date-utils.js` | `formatPostDate` returns `''` |
| `404-suggest` | the matcher the test requires | the scoring function returns `0` |
| `site-branding`, `preview-site-lockup`, `og-image-filename`, `og-card`, `og-shared-fingerprint`, `og-card-digest`, `changelog-format`, `figure-lightbox`, `live-smoke`, `test-json-pipe`, `unit-reporter` | the module each requires | the first exported function the test calls returns a wrong constant |
| `portfolio-notes` | `scripts/utils/portfolio-notes.js` | `parseNotesContent` returns `[]` |
| `source-file-utils` | `scripts/utils/source-file-utils.js` | `findSourceFile` returns `null` |
| `indexnow` | `scripts/utils/indexnow.js` | `isIndexableHtmlPath` returns `true` |
| `manifest-cursors` | `scripts/utils/cloudflare-purge.js` | `saveContentManifest` writes nothing |
| `deploy-guards` | `scripts/utils/clean-site.js` | `cleanSiteExceptImages` deletes nothing |
| `cloudflare-purge` | `scripts/utils/cloudflare-purge.js` | `diffContentManifests` returns three empty lists |

The mutation edits three files this plan otherwise may not touch (`og-*.js`, `css-utils.js` are among the modules under test). That is allowed for the harness alone, because it restores every byte and checks that it did.

- [ ] **Step 1:** Write the three files. Fill each `find` and `replace` by reading the module.
- [ ] **Step 2:** `node .cache/unit-migration/inventory.js snapshot`
  Expected: 12 files with names (counts match `check(` call counts: `date-utils` 4, `404-suggest` 25, `live-smoke` 8, and so on), 6 files with messages, 57 `addIssue` call sites across them.
- [ ] **Step 3:** `node .cache/unit-migration/mutate.js all > .cache/unit-migration/mutations-before.txt; echo $?`
  Expected: `0`. Every unconverted test goes red on its mutation and green without it. A test that stays green under its mutation is a finding about today's tests: pick a different break once, and if it still stays green, stop and show Jon, because that test has no teeth and converting it won't give it any.
- [ ] **Step 4:** `git status --short` prints nothing.

No commit.

---

### Task 3: Canary, then the files that share a recipe

**Files:** `scripts/test/date-utils.js` first; then `figure-lightbox.js`, `404-suggest.js`, `site-branding.js`, `preview-site-lockup.js`, `og-image-filename.js`, `og-card.js`, `og-shared-fingerprint.js`, `og-card-digest.js`, `changelog-format.js`, `live-smoke.js`, `test-json-pipe.js`; and `scripts/test-manifest.js` (the `nodeTest` flags).

**The recipe.** `const { test } = require('node:test');`. Each `check('name', fn)` becomes `test('name', fn)` with the name and body unchanged. Delete the `runUnitAssertions` wrapper, the local `check` function, the `test-results` and `test-runner-helper` imports, and the `runTest({...})` call. Keep the header comment and every assertion. Setup and teardown around the checks (the Puppeteer browser in `og-card.js`, temp directories in `og-shared-fingerprint.js` and `og-card-digest.js`) move into `before` and `after`. `figure-lightbox.js` has three `addIssue` calls outside `check()`: each becomes an `assert` inside the nearest test, message kept. `test-json-pipe.js` becomes two tests, `large JSON survives a piped stdout` and `result icon follows the exit code`, and keeps importing `resultIcon` from `test-results.js`.

- [ ] **Step 1:** Convert `date-utils.js` and flag it `nodeTest: true`.
- [ ] **Step 2:** `pnpm run test date-utils`
  Expected: `✅ 📅 Date Utils: 🧪 4 tests, ✅ 4 passing`, four names listed.
- [ ] **Step 3:** `node .cache/unit-migration/inventory.js verify date-utils && node .cache/unit-migration/mutate.js date-utils`
  Expected: both exit 0. The mutated run prints a ❌ line naming the failed tests.
- [ ] **Step 4:** Convert the other eleven and flag them.
- [ ] **Step 5:** For each of the twelve ids: `inventory.js verify <id>` and `mutate.js <id>`.
  Expected: all exit 0, and each file's test count in its result line equals its `names` count in `inventory-before.json` (`test-json-pipe`: 2).
- [ ] **Step 6:** `pnpm run test unit; echo "exit $?"` then `pnpm run build && diff -rq -x img .cache/unit-migration/site _site`
  Expected: `exit 0`; thirteen files through the reporter, six through the old loop; the diff prints at most `index.html`.
- [ ] **Step 7: Commit.** Proposed title: `Run assert-style unit tests with node:test`

---

### Task 4: The six hand conversions, one agent per file

**Files:** `scripts/test/portfolio-notes.js`, `source-file-utils.js`, `indexnow.js`, `manifest-cursors.js`, `deploy-guards.js`, `cloudflare-purge.js`; then `scripts/test-manifest.js`.

These test with `if (wrong) addIssue({ message })`, 57 call sites, so each needs reading. They share no code, so six agents work at once in the same working tree. What keeps them apart:

- An agent edits exactly one file, its own test. It does not touch the manifest, the runner, or the module under test.
- An agent may run only `node --test --test-concurrency=1 scripts/test/<its file>`. It does not run the mutation harness: two mutations target `scripts/utils/cloudflare-purge.js`, and two agents writing it at once would corrupt both runs.
- An agent does not commit.

**The brief each agent gets** (with its file name filled in):

> Convert `scripts/test/<file>` from the project's results model to `node:test`. Read `scripts/test/date-utils.js` for the target shape and `docs/designs/plans/2026-11-09-unit-tests-on-node-test.md` Task 4 for the rules.
> - Each `if (wrong) addIssue({ … message … })` becomes `assert.ok(!wrong, message)`, or `assert.strictEqual` / `assert.deepStrictEqual` where the code compares two values. Keep every message's text exactly, template literals included.
> - Group the assertions into `test('…', …)` blocks along the file's existing comment sections, one block per behavior, each named for the behavior.
> - The file's own helpers (`assertEqual`, `assertNotesEqual`, `assertUrlsEqual`, `fail`) become thin wrappers over `assert` or go away.
> - Setup and teardown (temp directories, a stubbed `fetch`) move into `before` / `after` or stay inside the test that needs them. Whatever restored global state before must still restore it when an assertion fails: use `try { … } finally { … }` or `after`.
> - Remove the `test-results` and `test-runner-helper` imports and the `runTest({...})` call. Keep the header comment.
> - One behavior changes and is accepted: a failed assertion now ends its own `test` block, where every condition used to be evaluated.
> - Don't weaken, merge, or drop a condition. If a message has to change, list it in your report with the old text, the new text, and why.
> - Finish by running `node --test --test-concurrency=1 scripts/test/<file>`. Report: the number of tests, the pass count, and the list of changed messages (or "none").

`portfolio-notes.js` loses its `--changed` support (`shouldSkipFn`, `checkChangedFlag`). The test runs in well under a second, so the skip buys nothing. Its agent is told so, and the manifest comment above its entry is updated in Step 2.

- [ ] **Step 1:** Dispatch the six agents in one message.
- [ ] **Step 2:** When all six report, flag the six entries `nodeTest: true`.
- [ ] **Step 3:** For each id, in turn: `inventory.js verify <id> [--allow …]` and `mutate.js <id>`.
  Expected: all exit 0. Read every reworded message an agent listed. An agent whose file fails a gate gets its file back with the gate's output; it doesn't get a second file.
- [ ] **Step 4:** `pnpm run test unit; echo "exit $?"`
  Expected: `exit 0`, nineteen files, all through the reporter.
- [ ] **Step 5: Commit.** Proposed title: `Move the remaining unit tests to node:test`

---

### Task 5: One path for unit tests

**Files:** `scripts/test-runner.js`, `scripts/test-manifest.js`, `scripts/utils/test-runner-helper.js` (only if `checkChangedFlag` or `shouldSkipFn` now has no caller), `docs/tests.md`, `docs/commands.md`, `docs/agent-memory.md`, `docs/ideas.md`, `.agents/rules/testing.mdc` (only if it describes how unit tests are written).

- [ ] **Step 1: Write the failing manifest check.** In `validateManifest()`: every `unit` entry must be `nodeTest`. Remove the flag from one entry and run `pnpm run test`.
  Expected: throws `[test-manifest] unit test '<id>' must be a node:test file`. Put the flag back.
- [ ] **Step 2:** In `test-runner.js`, the `unit` branch becomes the single `runNodeTests` call. The reporter's closing summary is now the only one.
- [ ] **Step 3:** `pnpm run test unit && pnpm run test fast && pnpm run test changed`
  Expected: all pass. `test fast` matches `.cache/cleanup-baseline/test-fast-t4b.txt` line for line.
- [ ] **Step 4:** `node .cache/unit-migration/mutate.js all; echo $?`
  Expected: `0`, nineteen red-then-green pairs. This is the last run of the harness.
- [ ] **Step 5:** `pnpm run build && diff -rq -x img .cache/unit-migration/site _site`
  Expected: at most `index.html`.
- [ ] **Step 6: Docs.**
  - `docs/tests.md`: the Unit Tests intro and Test Architecture now describe two kinds of test: site checks on the JSON results model, and unit tests on `node:test` with the reporter. Say how to add a unit test. Drop the `--changed` sentence from the `portfolio-notes.js` entry. Add a `unit-reporter.js` entry, and `unit-reporter` to the Unit list.
  - `docs/commands.md`: the `test unit` line.
  - `docs/agent-memory.md`: one entry saying how unit tests are written now, that `--test-concurrency=1` is deliberate, and that a nested `node --test` needs `NODE_TEST_CONTEXT` deleted.
  - `docs/ideas.md`: the "Hand test results to the runner through a temp file" item now covers the site checks only; say so.
- [ ] **Step 7:** `pnpm run test docs-links && pnpm run test markdown`
- [ ] **Step 8: Commit.** Proposed title: `Require node:test for every unit test`

---

### Task 6: Review and clean up

- [ ] **Step 1:** One fresh reviewer, on the most capable model, reads the whole diff from the commit before Task 1 to `HEAD`, with this plan and its Review Focus. It gets the code, not a summary of what was intended.
- [ ] **Step 2:** Fix what it finds that would change what a person sees, each with a test that failed first. List the rest for Jon.
- [ ] **Step 3:** Delete `.cache/unit-migration/` and `.cache/cleanup-baseline/`. `git status --short` prints nothing.

No deploy is needed. `_site/` is unchanged, so the next ordinary deploy carries nothing from this plan.

## What this plan leaves alone

- **The site checks** (`html`, `seo`, `frontmatter`, and the rest of `fast`). Their results model fits them: many files, issues per file. Their output is already uniform.
- **`deploy` and `security`,** the two tests that print for themselves. Bringing them into a common format is worth doing and is a separate piece of work.
- **Coverage.** Twenty-eight of 65 tooling modules are loaded by no test. Most are Eleventy config that every build exercises. The ones worth a look first change content or the server with no test at all: `scripts/content/import-noteplan-links.js`, `scripts/content/shortlink.js`, and `eleventy/utils/merge-posts-links.js`. A later plan.
- **The mutation check as a permanent tool.** Each entry is a string match against source, so it stops applying the first time that line is edited, and keeping the table current is work with no reader. It proves the conversion and then goes.
