# Test Timing Strategy

## Overview

This document analyzes WHEN automated tests should run, which affects WHAT tests to run and what events should trigger them.

## Test Categories by Speed & Requirements

### Pre-Build Tests (Fast, No Build Required)
- `markdown` - Validates markdown syntax in source files
- `links-yaml` - Validates links.yaml structure
- `content` - Validates post structure and front matter

**Characteristics:**
- Very fast (seconds)
- Can run on every file save
- No dependencies
- Catches errors early in development

### Post-Build Tests (Require `_site/` Directory)

**Fast Post-Build:**
- `html` - HTML validity (validates structure)
- `internal-links` - Internal link checking (no network calls)
- `seo` - Meta tags and SEO elements (reads HTML)
- `rss` - RSS feed validation (reads XML)

**Slow Post-Build:**
- `links` - All links including external (network calls, can be minutes)
- `accessibility` - Browser-based with axe-core (launches browser, can be minutes)
- `performance` - Performance analysis (file size checks, can be slow on large sites)

## Potential Trigger Events

### 1. File Save (Editor/IDE)
**When:** Every time a markdown file is saved
**What to run:** `markdown`, `links-yaml` (if links.yaml changed), `content` (if post structure changed)
**Pros:** Immediate feedback, catch errors before commit
**Cons:** Could be annoying if tests are noisy
**Implementation:** Editor extension, file watcher, pre-save hook

### 2. Pre-Commit Hook (Git)
**When:** Before `git commit` executes
**What to run:** Pre-build tests (`markdown`, `links-yaml`, `content`)
**Pros:** Prevents committing broken code, standard practice
**Cons:** Can slow down commits if tests are slow
**Implementation:** Git hooks (`.git/hooks/pre-commit`)

### 3. Pre-Push Hook (Git)
**When:** Before `git push` executes
**What to run:** Pre-build + fast post-build tests (requires build step)
**Pros:** Catches issues before they reach remote
**Cons:** Requires build, can be slow
**Implementation:** Git hooks (`.git/hooks/pre-push`)

### 4. Before Deploy (Manual)
**When:** User runs `npm run deploy` or similar
**What to run:** Full test suite (`test all` or `test build`)
**Pros:** Ensures site is valid before going live
**Cons:** Manual step, could be forgotten
**Implementation:** Part of deploy script

### 5. CI/CD Pipeline (GitHub Actions, etc.)
**When:** On push to main, pull requests, etc.
**What to run:** Configurable - could be full suite or subset
**Pros:** Automated, runs in clean environment
**Cons:** Requires CI/CD setup, may not be needed for personal site
**Implementation:** GitHub Actions workflow

### 6. Scheduled/Periodic
**When:** Weekly, monthly, or on-demand
**What to run:** Slow tests (`links`, `accessibility`, `performance`)
**Pros:** Catches issues that develop over time (broken external links, etc.)
**Cons:** Not immediate feedback
**Implementation:** Cron job, manual command, or CI/CD scheduled runs

## Recommended Strategy

### Development Workflow
1. **While editing:** No automated tests (manual `npm run test markdown` if needed)
2. **Before commit:** Pre-commit hook runs fast pre-build tests
3. **Before deploy:** Manual `npm run test all` or `npm run test build`
4. **Periodically:** Manual `npm run test links` and `npm run test accessibility` (weekly/monthly)

### Considerations
- Pre-commit hooks should be fast (< 5 seconds) to not slow down workflow
- Post-build tests require build step, so not ideal for pre-commit
- Slow tests should be incremental (see plan.md) or run separately
- User may want to disable hooks temporarily for emergency commits
- **Test output during dev:** If `npm run dev` is running, tests need separate terminal or file-based output (see incremental-build-testing.md)

## Questions to Answer

1. **Do you want pre-commit hooks?** (Pros: catch errors early, Cons: can slow commits)
2. **Should pre-commit run build?** (Pros: more thorough, Cons: slow)
3. **How often should slow tests run?** (Weekly? Monthly? On-demand only?)
4. **Should deploy script run tests automatically?** (Pros: safety, Cons: might fail deploy if tests are too strict)
5. **Do you want CI/CD?** (For personal site, may be overkill)

## Implementation Options

### Option 1: Minimal (Current)
- Manual testing when needed
- No automation
- User runs tests before deploy

### Option 2: Pre-Commit Hook
- Fast pre-build tests on commit
- Manual post-build tests before deploy
- Slow tests on-demand

### Option 3: Pre-Commit + Pre-Push
- Fast tests on commit
- Build + fast post-build tests on push
- Slow tests on-demand

### Option 4: Full CI/CD
- Tests on every push/PR
- Automated deployment on success
- Scheduled slow tests

## Next Steps

1. Decide on automation level (minimal vs hooks vs CI/CD)
2. If hooks: implement pre-commit hook for fast tests
3. If CI/CD: set up GitHub Actions workflow
4. Document chosen approach in commands.md

