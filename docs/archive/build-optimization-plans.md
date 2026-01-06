# Build Process Optimization Plans

This document contains detailed plans for simplifying and optimizing the build process, addressing concerns about complexity and potential issues.

## 1. Event Listener Cleanup Simplification

### Current Situation
- Uses `prependListener` for `uncaughtException` and `unhandledRejection` to ensure cleanup runs first
- Has multiple exit handlers: `beforeExit`, `exit`, `SIGINT`, `SIGTERM`
- Comment says this is needed because `eleventy.after` doesn't fire on errors

### Investigation Steps
1. **Test current behavior:**
   - Run a build that intentionally fails (e.g., syntax error in template)
   - Observe if spinner continues running after error
   - Check if Eleventy's error handling still works correctly

2. **Test simpler approach:**
   - Remove `prependListener`, use regular `on()` listeners
   - Test if cleanup still works on errors
   - Verify Eleventy's error messages still display correctly

3. **Check Eleventy's error handling:**
   - Review Eleventy source/docs for how it handles uncaught exceptions
   - Determine if our listeners interfere with Eleventy's error reporting

### Proposed Simplification
**Option A: Remove prependListener, use regular listeners**
- Change `prependListener` to `on()` for both error types
- Let listeners run in registration order
- If cleanup doesn't work, we know we need prependListener

**Option B: Rely on exit handlers only**
- Remove `uncaughtException` and `unhandledRejection` listeners entirely
- Rely on `exit`, `beforeExit`, `SIGINT`, `SIGTERM` handlers
- These should fire even on errors (process exits)
- Test if this is sufficient

**Option C: Keep current approach but document why**
- If testing shows prependListener is necessary, keep it
- Add better documentation explaining why it's needed
- Document any known edge cases

### Success Criteria
- Spinner cleanup works on all exit scenarios (normal, error, interrupt)
- Eleventy's error messages still display correctly
- No interference with Eleventy's error handling
- Code is simpler or at least better documented

### Testing Plan
1. Normal build completion - spinner should clean up
2. Build with template syntax error - spinner should clean up, error should display
3. Build with JavaScript error in config - spinner should clean up, error should display
4. Interrupt build with Ctrl+C - spinner should clean up
5. Kill build process - spinner should clean up

---

## 2. Date Parsing Simplification

### Current Situation
- Returns Luxon `DateTime` objects from `addDateParsing`
- Comment says "Eleventy automatically converts to Date for templates"
- Multiple places in code handle both `Date` and `DateTime` objects
- This was an area that "caused a lot of errors"

### Investigation Steps
1. **Verify Eleventy's DateTime conversion:**
   - Check Eleventy documentation on `addDateParsing` return values
   - Test if returning `DateTime` actually works correctly
   - Check if templates receive `Date` or `DateTime` objects

2. **Test current behavior:**
   - Build site and check `page.date` type in templates
   - Verify permalink generation works correctly
   - Check RSS feed dates are formatted correctly
   - Verify all date filters work correctly

3. **Test simpler approach:**
   - Change date parsing to return `Date` objects directly (convert DateTime to Date)
   - Run full test suite
   - Compare output with current implementation

4. **Review error history:**
   - Check git history for date-related errors
   - Review `docs/date-timezone-handling.md` for known issues
   - Identify what problems the DateTime return was trying to solve

### Proposed Simplification
**Option A: Return Date objects directly**
- Convert `DateTime` to `Date` using `.toJSDate()` before returning
- Simplifies code - no need to handle DateTime in filters/utils
- Matches what templates expect
- **Risk:** May lose timezone information if conversion is wrong

**Option B: Keep DateTime but verify conversion**
- Keep current approach but add tests to verify Eleventy converts correctly
- Document the conversion behavior
- Add defensive code in filters to handle both types
- **Risk:** Complexity remains, but at least verified

**Option C: Hybrid approach**
- Return `Date` for simple cases (date-only strings)
- Return `DateTime` only when timezone preservation is critical
- Document when each is used
- **Risk:** More complex logic

### Key Questions to Answer
1. Does Eleventy actually convert `DateTime` to `Date` automatically?
2. What happens if templates receive `DateTime` objects?
3. What timezone information needs to be preserved?
4. Can we preserve timezone info while returning `Date` objects?

### Success Criteria
- All date handling works correctly
- Code is simpler and easier to understand
- No timezone-related bugs
- Permalinks remain consistent
- RSS feeds format dates correctly

### Testing Plan
1. Build site and verify all dates display correctly
2. Check permalink generation for all posts
3. Verify RSS feed dates are RFC3339 formatted
4. Test with dates in different timezones
5. Test with date-only strings (no time)
6. Test with dates that have timezone info
7. Run existing test scripts: `test-date-changes.js`, `test-permalink-compatibility.js`

---

## 3. dateToRfc3339 Filter Wrapper Investigation

**Status:** ✅ Tested - Plugin wrapper is necessary, but approach seems hinky. Needs deeper investigation later.

### Current Situation
- `dateToRfc3339` filter is wrapped in a plugin function
- Comment says: "Plugins run in a second stage, so we create our own plugin that runs after the RSS plugin"
- Goal is to override the RSS plugin's `dateToRfc3339` filter
- **Note:** This approach works but feels like a workaround. The plugin wrapper pattern seems unnecessarily complex for just overriding a filter. Should investigate if there's a cleaner way to handle DateTime objects or override plugin filters.

### Investigation Steps
1. **Test if plugin wrapper is needed:**
   - Try adding filter directly with `addNunjucksFilter` after RSS plugin
   - Test if it overrides the RSS plugin's filter
   - Check Eleventy documentation on filter override behavior

2. **Check RSS plugin registration:**
   - Review when RSS plugin registers its filters
   - Determine if filters can be overridden after plugin registration
   - Check if there's a simpler way to override

3. **Test current behavior:**
   - Verify our custom filter is actually being used
   - Check RSS feed output to confirm dates are formatted correctly
   - Test with DateTime objects to ensure conversion works

### Proposed Simplification
**Option A: Remove plugin wrapper, add filter directly**
- Add `dateToRfc3339` filter using `addNunjucksFilter` after RSS plugin registration
- Test if it overrides the RSS plugin's filter
- **Risk:** May not override if plugin filters are registered later

**Option B: Use getFilter to wrap RSS plugin's filter**
- Get the RSS plugin's filter using `getFilter('dateToRfc3339')`
- Wrap it with our custom logic
- Register as new filter or override
- **Risk:** More complex, but guaranteed to work

**Option C: Keep plugin wrapper but document why**
- If testing shows plugin wrapper is necessary, keep it
- Add clear documentation explaining why
- Consider if there's a better way to structure it

### Key Questions to Answer
1. Can filters be overridden after plugin registration?
2. Does the plugin wrapper actually ensure our filter runs?
3. Is there a simpler way to override the RSS plugin's filter?
4. What happens if we don't override it? Does the RSS plugin's filter work with DateTime objects?

### Success Criteria
- Our custom `dateToRfc3339` filter is used in templates
- RSS feeds format dates correctly
- Code is simpler or at least better documented
- No breaking changes to RSS feed output

### Testing Plan
1. Build site and check RSS feed dates
2. Verify dates are RFC3339 formatted correctly
3. Test with DateTime objects from date parsing
4. Test with Date objects
5. Compare output with/without override

---

## 4. Safety Timeout Investigation

### Current Situation
- 5-minute timeout that cleans up spinner if build doesn't complete
- Uses `unref()` so it doesn't keep process alive
- Comment says it's a "safety timeout for build completion"

### Investigation Steps
1. **Check if timeout is actually needed:**
   - Review why it was added (git history, comments)
   - Determine if there are cases where build hangs without exiting
   - Check if spinner cleanup is sufficient without timeout

2. **Test spinner cleanup:**
   - Verify `unref()` works correctly (spinner doesn't keep process alive)
   - Test if `eleventy.after` always fires on successful builds
   - Test if exit handlers fire on failed builds

3. **Consider edge cases:**
   - What if build hangs indefinitely? (spinner would keep running)
   - What if build takes >5 minutes legitimately? (timeout would fire incorrectly)
   - Is there a better way to detect hung builds?

### Proposed Simplification
**Option A: Remove timeout entirely**
- Rely on `eleventy.after` for normal completion
- Rely on exit handlers for errors/interrupts
- Spinner has `unref()` so it won't keep process alive
- **Risk:** If build hangs, spinner might continue (but process would still be alive anyway)

**Option B: Increase timeout significantly**
- If timeout is needed, make it much longer (e.g., 30 minutes)
- Document why it exists
- **Risk:** Still arbitrary, may fire on legitimate long builds

**Option C: Remove timeout, add better monitoring**
- Remove timeout
- Add logging to detect if builds are taking unusually long
- **Risk:** Doesn't solve the cleanup problem if build hangs

### Key Questions to Answer
1. Has the timeout ever actually fired in practice?
2. What happens if a build legitimately takes >5 minutes?
3. Is there a scenario where build hangs but process doesn't exit?
4. Does the spinner's `unref()` prevent it from keeping the process alive?

### Success Criteria
- Spinner cleanup works in all scenarios
- No unnecessary complexity
- Builds can take as long as needed
- Code is simpler

### Testing Plan
1. Normal build - verify cleanup works
2. Long build (>5 minutes if possible) - verify timeout doesn't interfere
3. Hung build simulation - verify cleanup still works
4. Error scenarios - verify cleanup works

---

## Implementation Order

1. **Start with #4 (Safety Timeout)** - Simplest, lowest risk
2. **Then #1 (Event Listeners)** - Medium complexity, test thoroughly
3. **Then #3 (Filter Wrapper)** - Medium complexity, test RSS feeds
4. **Finally #2 (Date Parsing)** - Most complex, highest risk, needs extensive testing

## General Principles

- **Test before changing:** Always test current behavior first
- **One change at a time:** Don't make multiple changes simultaneously
- **Verify output:** Compare build output before/after changes
- **Document decisions:** If we keep complex code, document why
- **Prefer simplicity:** If two approaches work, choose the simpler one

