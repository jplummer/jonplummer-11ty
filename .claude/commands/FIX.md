# /FIX v1.0.0

Systematic debugging workflow. Do not shotgun-debug.

## Steps

1. **Reproduce**: Confirm the bug exists. Run the failing test, trigger the error, or verify the reported behavior. If you can't reproduce it, say so and stop.
2. **Hypothesize**: Form 2-3 hypotheses about the root cause before touching code. State them.
3. **Isolate**: Narrow down which hypothesis is correct using targeted logging, reading code, or minimal test cases. Do not change application code yet.
4. **Fix**: Make the smallest change that addresses the root cause. Prefer fixing the cause over patching the symptom.
5. **Verify**: Run the original failing case to confirm the fix. Run related tests to check for regressions.
6. **Summarize**: State what the bug was, what caused it, and what you changed.
