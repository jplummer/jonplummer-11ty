# /FIX v1.1.0

Systematic debugging workflow. Do not shotgun-debug.

## Before You Start

If the bug involves Eleventy behavior (collections, data cascade, dates, pagination, templates), check `.cursor/rules/eleventy-debugging.mdc` first. Assume Eleventy is working correctly until proven otherwise.

## Steps

1. **Reproduce**: Confirm the bug exists. Run the failing test (`pnpm run test [type]`), trigger the error, or verify the reported behavior. Use `pnpm run test changed` to quickly check recently modified files. If you can't reproduce it, say so and stop.
2. **Hypothesize**: Form 2-3 hypotheses about the root cause before touching code. State them.
3. **Isolate**: Narrow down which hypothesis is correct using targeted logging, reading code, or minimal test cases. For Eleventy issues, use `DEBUG=Eleventy* pnpm run build` to see what Eleventy is doing. Do not change application code yet.
4. **Fix**: Make the smallest change that addresses the root cause. Prefer fixing the cause over patching the symptom.
5. **Verify**: Run the original failing case to confirm the fix. Then run `pnpm run test fast` to check for regressions.
6. **Summarize**: State what the bug was, what caused it, and what you changed.
