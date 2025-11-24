# Test Groups Analysis

## Overview

This document analyzes what test groups are likely needed before implementing a test grouping system.

## Current State

**Current `test all` includes:**
- `html`
- `internal-links`
- `content`
- `markdown` (just added)
- `performance`
- `seo`
- `accessibility`
- `rss`

**Not in `test all`:**
- `links` (slow - external link checking)
- `links-yaml` (fast, but redundant with `content` check)
- `deploy` (deployment-specific)

## Use Cases to Support

### 1. Quick Validation (While Editing)
**Need:** Fast feedback on markdown/content changes
**Tests needed:** `markdown`, `links-yaml`, `content`
**Time:** < 5 seconds
**Frequency:** Multiple times per session

### 2. Pre-Commit Validation
**Need:** Ensure code quality before committing
**Tests needed:** Pre-build tests only (fast, no build required)
**Time:** < 10 seconds
**Frequency:** Every commit

### 3. Pre-Deploy Validation
**Need:** Ensure site is valid before going live
**Tests needed:** All post-build tests (requires build)
**Time:** 1-5 minutes (depending on site size)
**Frequency:** Before each deploy

### 4. Full Site Validation
**Need:** Comprehensive check including slow tests
**Tests needed:** Everything including `links`, `accessibility`
**Time:** 5-15+ minutes (slow tests)
**Frequency:** Weekly/monthly or before major releases

### 5. Deployment Checks
**Need:** Verify deployment environment
**Tests needed:** `deploy` test only
**Time:** < 1 minute
**Frequency:** Before deploy

## Proposed Test Groups

### Group 1: `test quick` (Pre-Build)
**Tests:** `markdown`, `links-yaml`, `content`
**Purpose:** Fast validation while editing
**Time:** < 5 seconds
**When:** During development, before commit

### Group 2: `test build` (Post-Build Essentials)
**Tests:** `html`, `internal-links`, `seo`, `rss`, `markdown`, `content`
**Purpose:** Validate built site without slow tests
**Time:** 1-3 minutes
**When:** Before deploy, after build

### Group 3: `test all` (Current Default)
**Tests:** Current `allTests` array (medium-speed tests)
**Purpose:** Standard validation suite
**Time:** 2-5 minutes
**When:** Before deploy, regular validation

### Group 4: `test full` (Everything)
**Tests:** All tests including `links`, `accessibility`, `performance`
**Purpose:** Comprehensive validation
**Time:** 5-15+ minutes
**When:** Weekly/monthly, before major releases

### Group 5: `test deploy` (Deployment)
**Tests:** `deploy` test
**Purpose:** Verify deployment environment
**Time:** < 1 minute
**When:** Before deploy

## Analysis: Are Groups Needed?

### Arguments FOR Test Groups
1. **Different use cases** - Quick validation vs full validation
2. **Time savings** - Don't run slow tests when fast ones suffice
3. **Workflow clarity** - Clear commands for different scenarios
4. **Flexibility** - User can choose appropriate level

### Arguments AGAINST Test Groups
1. **Complexity** - More commands to remember
2. **Current system works** - `test all` + individual tests may be sufficient
3. **Maintenance** - More code to maintain
4. **Decision fatigue** - User has to choose which group

## Alternative: Keep Current + Add One Group

**Option A: Minimal Change**
- Keep `test all` as is (medium-speed tests)
- Add `test quick` for fast pre-build tests
- Keep individual test commands
- Slow tests (`links`, `accessibility`) run separately on-demand

**Option B: Two-Tier System**
- `test quick` - Fast pre-build tests
- `test all` - Current default (medium-speed)
- Individual commands for slow tests

## Questions to Answer

1. **How often do you run tests?** (Determines if groups are worth it)
2. **Do you want a "quick" command?** (Fast feedback while editing)
3. **Should `test all` include slow tests?** (Currently doesn't)
4. **Do you want separate deploy test group?** (Or just run `test deploy` individually)
5. **Is current system sufficient?** (Maybe no groups needed)

## Recommendation

**Start simple:**
1. Keep current `test all` as default
2. Add `test quick` for fast pre-build validation
3. Keep individual test commands for flexibility
4. Document when to use each in commands.md

**If needed later:**
- Add `test full` for comprehensive validation
- Add `test build` if pre-deploy validation becomes common
- Re-evaluate based on actual usage patterns

## Implementation Considerations

### If Implementing Groups
1. Update `test-runner.js` to support group names
2. Define group arrays (similar to `allTests`)
3. Update `commands.md` with group descriptions
4. Consider aliases (e.g., `test q` for `test quick`)

### If NOT Implementing Groups
1. Document current usage patterns in commands.md
2. Clarify when to run `test all` vs individual tests
3. Add examples of common workflows

## Next Steps

1. Decide if groups are needed based on actual usage
2. If yes: implement minimal groups (`quick` + keep `all`)
3. If no: document current system better
4. Re-evaluate after using for a while

