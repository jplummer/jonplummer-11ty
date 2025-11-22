# Plan: Prevent Authoring Mistakes from Going Live

## The Problem

Common authoring mistakes that slip through:
1. **Malformed YAML** in `links.yaml`
2. **Malformed markdown** (unclosed links, syntax errors, etc.)
3. **Markdown hierarchy problems** (h2 → h4 skipping h3, h1 in markdown instread of in frontmatter, etc.)
4. **Misspellings**
5. **Sentence fragments** (forgotten edits, incomplete sentences)

## Current State

**Already have tests for:**
- ✅ Malformed YAML: `npm run test content` (validates YAML syntax for all files in `src/_data/`, including `links.yaml`)
- ✅ Malformed markdown: `npm run test markdown`
- ✅ Markdown hierarchy: `npm run test markdown` (MD001 rule)
- ✅ Post structure: `npm run test content` (validates front matter, file naming, etc.)

**Note:** `links-yaml` test does additional structure validation beyond YAML syntax (date format, required fields, URL format), but `content` already catches basic YAML syntax errors.

**Missing:**
- ❌ Spell checking
- ❌ Grammar/content checking (sentence fragments)

## Simplest Solution: Pre-Deploy Validation

### Option 1: Add Fast Checks to Deploy Script (Recommended)

**What:** Run fast validation tests before deploy, fail if errors found.

**Implementation:**
1. Add validation step to `scripts/deploy/deploy.js` before rsync
2. Run fast pre-build tests:
   - `markdown` (validates markdown syntax and hierarchy)
3. Run fast post-build tests (if `_site/` exists):
   - `content` (validates YAML syntax for all data files + post structure)
4. If any test fails, stop deployment with clear error message
5. User can run `npm run deploy --skip-checks` to bypass (for emergencies)

**Note:** `content` test already validates YAML syntax for all files in `src/_data/` (including `links.yaml`), so we don't need to run `links-yaml` separately. The `links-yaml` test does additional structure validation, but basic YAML syntax is covered by `content`.

**Pros:**
- Automatic - can't forget
- Catches issues before they go live
- Fast (only runs quick tests)
- Simple to implement

**Cons:**
- Requires `_site/` to exist (need to build first)
- Adds a few seconds to deploy

### Option 2: Pre-Commit Hook

**What:** Run fast checks before git commit.

**Implementation:**
1. Install `husky` or use git hooks directly
2. Create `.git/hooks/pre-commit` that runs:
   - `markdown` test (pre-build, fast)
   - Note: `content` test requires `_site/` so not ideal for pre-commit
3. Block commit if tests fail

**Pros:**
- Catches issues before they're committed
- Works with any deployment method

**Cons:**
- Can slow down commits
- Might be annoying during active development
- Doesn't catch issues if you skip hooks

### Option 3: Manual Check Before Deploy

**What:** Document a checklist, run manually before deploy.

**Implementation:**
1. Add to `commands.md`: "Before deploying, run: `npm run test markdown content`"
2. User responsibility to remember

**Pros:**
- Simplest
- No automation needed

**Cons:**
- Easy to forget
- Not automatic

## Adding Spell Checking

### Option A: cspell (Recommended)

**Package:** `cspell` (Code Spell Checker)

**Implementation:**
1. Install: `npm install --save-dev cspell`
2. Create `cspell.json` config:
   - Dictionary for technical terms, names, etc.
   - Ignore code blocks, URLs
   - Check markdown files in `src/_posts/`
3. Add test script: `scripts/test/spellcheck.js`
4. Add to test runner: `'spellcheck': 'spellcheck.js'`
5. Run before deploy (or in pre-commit hook)

**Pros:**
- Good spell checker
- Configurable dictionaries
- Can ignore code/URLs

**Cons:**
- Need to maintain dictionary
- May flag false positives

### Option B: Editor Integration

**What:** Use editor's built-in spell checker (VS Code, etc.)

**Pros:**
- Already available
- Real-time feedback
- No setup needed

**Cons:**
- Not automated
- Easy to miss
- Depends on editor

## Adding Grammar/Content Checking

### Option A: write-good

**Package:** `write-good` (checks for common writing issues)

**Implementation:**
1. Install: `npm install --save-dev write-good`
2. Create test script that checks markdown content
3. Flags: passive voice, weasel words, sentence length, etc.
4. May help catch sentence fragments

**Pros:**
- Catches some writing issues
- Configurable

**Cons:**
- May flag false positives
- Not specifically designed for fragments
- Can be noisy

### Option B: Manual Review

**What:** Read through content before publishing

**Pros:**
- Human judgment
- Catches context-specific issues

**Cons:**
- Not automated
- Easy to skip
- Time-consuming

### Option C: Skip for Now

**What:** Focus on syntax/spelling first, add grammar later if needed

**Pros:**
- Simplest
- Addresses most critical issues first

**Cons:**
- Doesn't catch sentence fragments

## Recommended Approach

### Phase 1: Pre-Deploy Validation ✅ COMPLETED

1. **Added fast checks to deploy script:**
   - ✅ Run `markdown` test (pre-build, validates markdown syntax and hierarchy)
   - ✅ Run `content` test (requires `_site/`, validates YAML syntax + post structure)
   - ✅ Fail deploy if any test fails
   - ✅ Add `--skip-checks` flag for emergencies

**Note:** `content` already validates YAML syntax for all files in `src/_data/`, so no need to run `links-yaml` separately.

2. **Benefits:**
   - ✅ Automatic - can't forget
   - ✅ Catches YAML, markdown, hierarchy issues
   - ✅ Fast (only quick tests)
   - ✅ Simple implementation

**Implementation:** Added to `scripts/deploy/deploy.js` - runs after build, before rsync. Tested and working.

### Phase 2: Add Spell Checking (Next)

1. **Install cspell:**
   - `npm install --save-dev cspell`
   - Create `cspell.json` config
   - Create `scripts/test/spellcheck.js`
   - Add to test runner

2. **Add to deploy script:**
   - Run spellcheck before deploy
   - Fail if errors found

3. **Benefits:**
   - Catches misspellings
   - Configurable dictionary

### Phase 3: Grammar Checking (Later, If Needed)

1. **Evaluate write-good or similar**
2. **Or:** Accept that sentence fragments need manual review
3. **Or:** Add to editor workflow (not automated)

## Implementation Steps

### Step 1: Update Deploy Script ✅ COMPLETED

**Implementation:** Added to `scripts/deploy/deploy.js` after build step, before rsync.

**Code location:** Lines 63-87 in `scripts/deploy/deploy.js`

**Features:**
- ✅ Runs `markdown` test (validates markdown syntax and hierarchy)
- ✅ Runs `content` test (validates YAML syntax + post structure)
- ✅ Fails deploy if any test fails
- ✅ Supports `--skip-checks` flag to bypass validation
- ✅ Tested and working correctly

**Test results:** Validation runs successfully, catches errors, and blocks deployment when tests fail.

### Step 2: Add Spell Checking (Later)

1. Install cspell
2. Create config file
3. Create test script
4. Add to deploy script

## Questions to Answer

1. **Should deploy script run tests automatically?** (Recommended: Yes)
2. **Should we allow skipping checks?** (Recommended: Yes, with `--skip-checks` flag)
3. **Which tests to run before deploy?** (Recommended: `markdown`, `content` - `content` already validates YAML syntax)
4. **Add spell checking now or later?** (Recommendation: Start with syntax checks, add spelling later)
5. **How to handle grammar/sentence fragments?** (Recommendation: Manual review for now, or editor integration)

## Summary

**Simplest approach:**
1. Add fast validation tests to deploy script (prevents YAML, markdown, hierarchy issues)
2. Add spell checking later (prevents misspellings)
3. Manual review for grammar/sentence fragments (or skip for now)

**This catches 4 out of 5 issues automatically, with minimal complexity.**

