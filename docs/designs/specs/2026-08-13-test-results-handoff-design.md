# Test result handoff

Filed in `docs/ideas.md` on 2026-08-13 as "Simplify and harden test result parsing and output," and moved here on 2026-11-08. One piece is left: handing results to the parent through a temp file.

## How it works now

`scripts/utils/test-results.js` holds the result builder, `formatVerbose` and `formatBuild`, and the stdout marker protocol (`__TEST_JSON_START__` … `__TEST_JSON_END__`) that `scripts/test-runner.js` parses back out of each child's output.

`writeSyncAll()` stays whatever happens next. A single `fs.writeSync` to a non-blocking pipe returns after about 64KB and drops the rest; `internal-links` hit that and aborted a deploy. `pnpm run test test-json-pipe` guards it.

## What's left

Hand results to the parent through a temp file instead of stdout markers. That retires the truncation failure class instead of defending against it. Jon thinks it's worth doing (2026-11-08): cleaner designs are almost always worth it, as long as the result stays easy for a person to follow.

## Done so far

- 2026-08-13: removed the dead `printSummary` and `exitWithResults`.
- 2026-11-08 (9d0e20d9): the runner's `buildSummaryString` and this file's `buildSummaryLine` share one `formatSummaryParts`. It leaves zero counts out (single runs had printed "✅ 0 passing" beside warnings) and keeps the security test's skipped-file count.
- 2026-11-08 (3845694a): `test/color-contrast.js` and `test/accessibility.js` call `outputAndExit`, so running them by hand prints the formatted report instead of raw markers. The unused `options` parameter on `formatVerbose` and the unused `groupIssuesByType` export are gone.

## Not doing

- Replacing the runner with `node --test`, or deleting the aggregate JSON and formatting layer wholesale. That puts about 30 test scripts and the deploy gate in the blast radius for no gain a person would see, and the IPC's complexity has a documented, test-guarded cause.
- New features for test output (streaming progress, JUnit output, `--filter`), dropped on 2026-11-07. This work is about robustness only.
