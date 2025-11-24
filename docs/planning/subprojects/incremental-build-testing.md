# Incremental Build and Testing Strategy

## Overview

This document explores approaches for tracking what has changed since the last build, enabling incremental testing that only runs tests relevant to the changes made.

## The Problem

- Running full test suite on every change is slow
- Some tests are expensive (external links, accessibility with browser)
- We want to test only what's relevant to what changed
- Need reliable way to track what changed

## Important Clarification: Reference Point

**The reference point is NOT "last git commit"** - that would only test committed changes and miss uncommitted work.

**The reference point SHOULD BE "last successful build/test run"** - stored in a cache file. This allows:
- Testing uncommitted changes in working directory
- Testing untracked files
- Testing changes since last build (regardless of git status)

The cache stores either:
- **Git-based:** Last build commit hash + current file hashes (for comparison)
- **Hash-based:** File hashes of all source files at last build (recommended)

This way, you can test your work before committing, and the system tracks what's actually changed since the last successful build/test run.

## Interaction with `npm run dev` (Watch Mode)

**The Challenge:**
- `npm run dev` runs `eleventy --serve --watch` which automatically rebuilds on every file change
- If cache updates on every rebuild, incremental testing becomes less useful (everything is always "just built")
- But we still want to test incrementally during development

**Solutions:**

### Option A: Separate Cache for Dev vs Production Builds
- **Dev cache:** Updated only when explicitly running tests (not on every watch rebuild)
- **Build cache:** Updated only on `npm run build` (production builds)
- Incremental tests compare against last test run, not last rebuild

### Option B: Manual Cache Updates
- Cache only updates when you explicitly run `npm run test --incremental`
- `npm run dev` doesn't update cache automatically
- You control when cache updates (after you're satisfied with changes)

### Option C: Test-Aware Watch Mode
- Add test hooks to watch mode: `npm run dev --test-on-change`
- On file change: rebuild → run incremental tests → update cache
- More complex but provides continuous feedback

### Option D: Two-Tier System (Recommended)
- **During dev (`npm run dev`):** Don't update cache, just rebuild
- **When testing:** Compare against last explicit test run (stored separately)
- **On production build (`npm run build`):** Update build cache
- **On test run (`npm run test --incremental`):** Update test cache

**Recommendation:** Option D - Keep dev builds separate from test cache updates. This way:
- Dev server rebuilds quickly without cache overhead
- Tests compare against last test run (not every rebuild)
- You control when to update test cache (when running tests)
- Production builds update build cache separately

## Test Output During Development

**The Challenge:**
- `npm run dev` outputs build messages to stdout
- Tests also output to stdout (console.log)
- If both run in same terminal, output gets mixed/confusing
- Need a way to see test results while dev server is running

**Solutions:**

### Option A: Separate Terminal (Current/Simplest)
- Run `npm run dev` in one terminal
- Run `npm run test --incremental` in another terminal
- **Pros:** Simple, clear separation, no conflicts
- **Cons:** Need to switch terminals, manual

### Option B: Test Results File
- Tests write results to `.test-results.json` or `.test-results.txt`
- Dev server watches this file and displays in browser or terminal
- **Pros:** Can view results without switching terminals
- **Cons:** Need to implement file watching, browser display

### Option C: JSON Output + Pretty Printer
- Tests support `--json` flag for machine-readable output
- Separate command to pretty-print: `npm run test:show-results`
- Results stored in `.test-results.json`
- **Pros:** Can query results programmatically, view when convenient
- **Cons:** Two-step process (run test, then view)

### Option D: Integrated Test Output in Dev Server
- Eleventy dev server could display test results in browser overlay
- Or use Eleventy's `onRequest` hook to serve test results page
- **Pros:** Integrated experience
- **Cons:** Complex, requires Eleventy plugin/configuration

### Option E: Test Summary Only (Recommended for Dev)
- During dev, tests output minimal summary to stdout
- Full details written to `.test-results.txt`
- Quick glance shows pass/fail, details in file
- **Pros:** Doesn't clutter terminal, full details available
- **Cons:** Need to check file for details

**Recommendation:** Start with Option A (separate terminal) - it's simplest and works well. If needed later, add Option C (JSON output + file) for programmatic access and viewing results without interrupting dev server.

## What Needs to Be Tracked

### Source Files (Primary - What We Track)
- Markdown posts (`src/_posts/**/*.md`)
- Templates (`src/_includes/**/*.njk`)
- Data files (`src/_data/**/*.yaml`)
- Configuration (`.eleventy.js`, `package.json`)
- CSS (`src/assets/css/**/*.css`)

**Why source files:** We track source file changes (via git/hashes) to determine what to test, not what Eleventy rebuilt. This is more reliable and works regardless of build mode.

### Test Results (Secondary - For Caching)
- Which tests were run and when
- What files were tested
- Test results/cache (to skip tests on unchanged files)

## Approaches to Track Changes

### Option 1: Git-Based Tracking (Recommended)

**How it works:**
- Use `git diff` to see what files changed since last commit/branch
- Use `git ls-files` to track untracked files
- Compare against a reference point (last build, last test run, specific commit)

**Pros:**
- Reliable (git is the source of truth)
- No additional files to maintain
- Works with any git workflow
- Can track across commits
- Handles file renames, deletions

**Cons:**
- Requires git repository
- Need to define "reference point" (what changed since when?)
- Doesn't track files outside git

**Implementation:**
```javascript
// Get files changed since last build
const lastBuildCommit = readLastBuildCommit(); // from cache file
const changedFiles = execSync(`git diff --name-only ${lastBuildCommit} HEAD`).toString();
```

### Option 2: File Hash-Based Tracking

**How it works:**
- Store SHA-256 hashes of source files in a cache file
- Compare current file hashes against cached hashes
- Track which files changed based on hash differences

**Pros:**
- Works without git
- Detects content changes (not just mtime)
- Reliable (content-based, not time-based)
- Can track any file

**Cons:**
- Need to maintain cache file
- Cache file can get out of sync
- Need to handle cache invalidation
- More complex implementation

**Implementation:**
```javascript
// Store file hashes
const fileHashes = {
  'src/_posts/2025/post.md': 'abc123...',
  // ...
};
// Compare against current hashes
const changedFiles = Object.keys(fileHashes).filter(file => {
  const currentHash = hashFile(file);
  return currentHash !== fileHashes[file];
});
```

### Option 3: Build Manifest (Eleventy Output) - Not Recommended

**How it works:**
- Eleventy tracks what it builds (could use `--incremental` flag)
- Store manifest of what was built: `{ sourceFile: outputFile, timestamp }`
- Compare current build output against manifest

**Pros:**
- Tracks actual build output (what matters for testing)
- Works with Eleventy's incremental mode
- Can track dependencies (template → output files)

**Cons:**
- Need to generate/maintain manifest
- Eleventy doesn't provide this natively
- Need to track template dependencies
- **Not reliable:** `npm run dev` rebuilds everything by default (unless `--incremental` is used)
- **Less flexible:** Depends on Eleventy's rebuild logic, not source file changes

**Note:** We're using source file tracking instead (Option 1 or 2) because it's more reliable and independent of Eleventy's build behavior.

**Implementation:**
```javascript
// After build, generate manifest
const manifest = {
  builds: [
    { source: 'src/_posts/2025/post.md', output: '_site/2025/post/index.html', timestamp: Date.now() }
  ],
  lastBuild: Date.now()
};
```

### Option 4: File Modification Times (Not Recommended)

**How it works:**
- Store last modification time of files
- Compare against current mtime

**Pros:**
- Simple
- Built into filesystem

**Cons:**
- Unreliable (can be reset, copied, etc.)
- Doesn't detect content changes
- Timezone issues
- What you're skeptical about - and rightfully so

### Option 5: Hybrid Approach (Git + Hash for Untracked)

**How it works:**
- Use git for tracked files
- Use file hashes for untracked files
- Combine results

**Pros:**
- Best of both worlds
- Handles all cases

**Cons:**
- More complex
- Two systems to maintain

## Recommended Approach: Source File Tracking (Git/Hash-Based)

### Strategy

**Important:** We track **source file changes** (via git/hashes), NOT what Eleventy actually rebuilt. This approach:
- Works regardless of whether `--incremental` flag is used
- More reliable than tracking build output (which depends on Eleventy's rebuild logic)
- Allows us to determine what to test based on what changed in source files
- Note: `npm run dev` rebuilds everything by default (unless `--incremental` is added), but we still track source changes for testing

1. **Track last test run reference point:**
   - Store last successful test run commit hash in `.test-cache.json`
   - Store last file hashes of all source files at last test run
   - Or use git tag: `git tag test-last-success`

2. **Determine what changed in source files:**
   - **For committed changes:** `git diff --name-only <last-test-commit> HEAD` (changes since last test)
   - **For uncommitted changes:** Compare current file hashes against cached hashes (works for both committed and uncommitted)
   - **For untracked files:** `git ls-files --others --exclude-standard` (new files) + hash comparison
   - **Primary method:** Compare current file hashes against cached hashes (most reliable, works for all cases)

**Key Point:** The reference point should be "last successful test run" (stored in cache), NOT "last git commit" or "what Eleventy rebuilt". This allows testing uncommitted changes and is independent of Eleventy's build behavior.

3. **Map changes to tests:**
   - Markdown file changed → run `markdown` on that file, `content` check
   - Template changed → run `html`, `seo`, `accessibility` on affected pages
   - `links.yaml` changed → run `links-yaml`, `links` tests
   - Config changed → run all tests (could affect everything)

4. **Track test results:**
   - Store test results in `.test-cache.json`
   - Track which files were tested and when
   - Skip tests if file hasn't changed and test passed before

### Change-to-Test Mapping

| Change Type | Tests to Run |
|------------|--------------|
| `src/_posts/**/*.md` | `markdown` (that file), `content` (that file) |
| `src/_includes/**/*.njk` | `html` (all pages), `seo` (all pages), `accessibility` (all pages) |
| `src/_data/links.yaml` | `links-yaml`, `links` (full site) |
| `src/_data/**/*.yaml` | `content` (if affects posts) |
| `.eleventy.js` | All tests (config change affects everything) |
| `src/assets/css/**/*.css` | `html` (validation), `accessibility` (styling) |
| `package.json` | All tests (dependency change) |
| Any template | `html`, `seo`, `rss` (if feed template), `accessibility` |

### Implementation Plan

1. **Create build cache system:**
   - `.build-cache.json` stores: `{ lastBuildCommit, lastBuildTime, builtFiles: [] }`
   - Update after successful build
   - Store in `.gitignore` (build artifact)

2. **Create test cache system:**
   - `.test-cache.json` stores: `{ testResults: { [testName]: { files: [], lastRun, passed } } }`
   - Track which files were tested for each test type
   - Update after test runs

3. **Create change detection script:**
   - `scripts/utils/detect-changes.js`
   - Returns: `{ changedFiles: [], changeTypes: {} }`
   - Uses git diff + untracked files

4. **Create incremental test runner:**
   - `scripts/test-incremental.js`
   - Detects changes
   - Maps to relevant tests
   - Runs only needed tests
   - Updates cache

5. **Integrate with build:**
   - `npm run build` updates build cache (production builds)
   - `npm run dev` does NOT update cache (dev rebuilds are separate)
   - `npm run test --incremental` uses incremental mode, updates test cache
   - `npm run test` (default) runs full suite, updates test cache
   - Test cache is separate from build cache (allows testing during dev)

## Questions to Answer

1. **What is the "reference point"?**
   - **NOT** last git commit (that would miss uncommitted changes)
   - **YES** last successful build/test run (stored in cache)
   - This allows testing uncommitted changes in working directory
   - Cache stores: commit hash + file hashes of all source files at last build

2. **How to handle first run?**
   - No cache exists → run all tests
   - Create cache after first run

3. **How to handle cache invalidation?**
   - Force flag: `npm run test --force` (ignore cache)
   - Cache expiry: invalidate after X days?
   - Manual: delete cache file

4. **What about untracked files?**
   - Use `git ls-files --others` to find
   - Or use file hash comparison for untracked files

5. **How to track template dependencies?**
   - Template change affects all pages using it
   - Could track: `base.njk` → all pages
   - Or just test all pages when template changes (safer)

6. **Should we use Eleventy's `--incremental` flag?**
   - Eleventy has built-in incremental build support
   - Could leverage this for faster builds
   - But need to track what Eleventy actually rebuilt

## Alternative: Simple Hash-Based Approach (Better for Uncommitted Changes)

**Simpler version that handles uncommitted changes:**

1. Store file hashes from last test run: `.test-cache.json` → `{ fileHashes: { 'src/post.md': 'abc123...' }, lastRun: timestamp }`
2. On test run:
   - Calculate current file hashes for all source files
   - Compare against cached hashes
   - Get changed files (hash mismatch)
   - Map to tests (simple rules)
   - Run relevant tests
   - Update cache with current hashes

3. Force full test: `npm run test` (no `--incremental` flag)
4. Incremental test: `npm run test --incremental`

**Pros:**
- Works with uncommitted changes (doesn't require git commit)
- Works with untracked files
- Content-based (reliable)
- Simple to understand

**Cons:**
- Need to maintain cache file
- Cache can get out of sync (but can be regenerated)
- Slightly more complex than pure git-based

## Next Steps

1. **Decide on approach:**
   - Git-based (recommended) vs Hash-based vs Hybrid
   - Simple vs Comprehensive

2. **Implement change detection:**
   - Create `scripts/utils/detect-changes.js`
   - Test with various change scenarios

3. **Implement incremental test runner:**
   - Create `scripts/test-incremental.js`
   - Map changes to tests
   - Integrate with existing test runner

4. **Add cache management:**
   - Create cache files (`.build-cache.json`, `.test-cache.json`)
   - Add to `.gitignore`
   - Implement cache update logic

5. **Document usage:**
   - Update `commands.md` with incremental testing
   - Explain when to use incremental vs full tests

## Considerations

- **Cache location:** `.build-cache.json`, `.test-cache.json` in project root (gitignored)
- **Cache format:** JSON for easy reading/debugging
- **Cache invalidation:** Manual (delete file) or force flag
- **First run:** No cache → run all tests, create cache
- **Error handling:** If cache is corrupted, fall back to full test

