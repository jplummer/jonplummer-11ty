# Build & Deploy Test Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `pnpm run build` a complete three-phase test pipeline (source checks → build → output checks), and strip the now-redundant test calls and `--skip-checks` escape hatch from `deploy.js`.

**Architecture:** A new `scripts/build/build.js` orchestration script runs all fast tests around the Eleventy build. `deploy.js` delegates the entire build + test phase to `pnpm run build`, then handles only deploy-specific concerns (changelog, rsync, IndexNow). No shared utilities need extracting — `build.js` uses synchronous `execSync` and needs no spinner infrastructure.

**Tech Stack:** Node.js, `execSync`, existing `scripts/test-runner.js`, existing `scripts/content/generate-og-images.js`, Eleventy CLI.

## Global Constraints

- All tests invoked as `node scripts/test-runner.js <type> --format build` (compact output, non-zero exit on failure)
- No new dependencies
- `pnpm run dev` must remain unchanged (no tests, fast watch rebuilds)
- `pnpm run test <type>` standalone commands must continue to work as before

---

### Task 1: Create `scripts/build/build.js` and update `package.json`

**Files:**
- Create: `scripts/build/build.js`
- Modify: `package.json` line 11

**Interfaces:**
- Produces: `pnpm run build` that exits 0 on full success, 1 on any failure
- Consumed by: `deploy.js` (Task 2) which calls `pnpm run build` and relies on non-zero exit to abort

- [ ] **Step 1: Create `scripts/build/build.js`**

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');

const PRE_BUILD_TESTS = [
  'markdown', 'frontmatter', 'spell', 'css',
  'links', 'wisdom', 'portfolio-notes', 'color-contrast',
];

const POST_BUILD_TESTS = [
  'html', 'internal-links', 'og-images', 'seo', 'rss', 'indexnow',
];

function run(command, errorLabel) {
  try {
    execSync(command, { stdio: 'inherit', shell: true });
  } catch {
    if (errorLabel) console.error(`\n❌ ${errorLabel}\n`);
    process.exit(1);
  }
}

// Phase 1: Pre-build — source quality
for (const test of PRE_BUILD_TESTS) {
  run(`node scripts/test-runner.js ${test} --format build`);
}

// Phase 2: Build
run('node scripts/content/generate-og-images.js --quiet');
run('eleventy --quiet', '🏗️  Build failed');
console.log('✅ 🏗️  Build: completed\n');

// Phase 3: Post-build — output quality
for (const test of POST_BUILD_TESTS) {
  run(`node scripts/test-runner.js ${test} --format build`);
}
```

- [ ] **Step 2: Update `package.json` `build` script**

Change line 11 from:
```json
"build": "node scripts/test-runner.js markdown --format build && node scripts/test-runner.js frontmatter --format build && node scripts/content/generate-og-images.js --quiet && eleventy --quiet",
```
To:
```json
"build": "node scripts/build/build.js",
```

- [ ] **Step 3: Verify the build runs all three phases**

Run: `pnpm run build`

Expected output (abbreviated):
```
✅ ✍️  Markdown: PASSED …
✅ 🗂️  Frontmatter: PASSED …
✅ 🔤 Spell: PASSED …
… (remaining pre-build tests) …
✅ 🏗️  Build: completed

✅ 🌐 HTML: PASSED …
✅ 🔗 Internal Links: PASSED …
… (remaining post-build tests) …
```
Expected exit code: 0.

- [ ] **Step 4: Verify pre-build failure aborts immediately**

Temporarily insert a bad link into any post — add `[broken](` at the end of a line in any `src/_posts/**/*.md` file. Then run:

```bash
pnpm run build
```

Expected: fails after the `markdown` check, before `eleventy` runs (no "Build: completed" line, no `_site/` rebuild). Exit code: 1.

Revert the bad link before continuing.

- [ ] **Step 5: Commit**

```bash
git add scripts/build/build.js package.json
git commit -m "feat: orchestrate build with pre/post test pipeline"
```

---

### Task 2: Simplify `deploy.js`

Remove all test calls and `--skip-checks` logic. Deploy delegates build + tests to `pnpm run build` and handles only deploy-specific steps.

**Files:**
- Modify: `scripts/deploy/deploy.js`
- Modify: `docs/commands.md` (remove `--skip-checks` references)

**Interfaces:**
- Consumes: `pnpm run build` (Task 1) — must pass before rsync proceeds
- Preserves: `--dry-run` flag, changelog logic, rsync, IndexNow, changelog commit/push

- [ ] **Step 1: Remove `skipChecks` variable and its debug log**

Remove line 267:
```javascript
const skipChecks = process.argv.includes('--skip-checks');
```

Inside the `if (process.env.DEBUG_DEPLOY)` block (lines 271–276), remove only the `skipChecks` line — keep the block and the `process.argv` / `dryRun` lines:
```javascript
// Remove this line only:
    console.log('Debug: skipChecks =', skipChecks);
```

- [ ] **Step 2: Remove the `_site` existence check**

Remove lines 299–302:
```javascript
  // Check if _site directory exists
  if (!fs.existsSync('./_site')) {
    console.error('❌ _site directory not found. Please run "pnpm run build" first.');
    process.exit(1);
  }
```
`pnpm run build` creates `_site/`; this guard is now irrelevant.

- [ ] **Step 3: Remove the OG images generation block**

Remove lines 338–406 — the entire block starting with:
```javascript
  // Generate OG images before deploy (incremental - only generates what's needed)
  let ogResult = null;
  if (!skipChecks) {
```
through the closing `}` of that block.

- [ ] **Step 4: Remove the pre-deploy validation block**

Remove lines 408–419:
```javascript
  // Pre-deploy validation checks on source files (before build to catch errors early)
  if (!skipChecks) {
    try {
      // Source file validations (don't need _site/)
      await runWithSpinner('pnpm run test markdown --silent', 'Running pre-deploy validation (markdown)...', { showOutput: true, shell: true });
      await runWithSpinner('pnpm run test frontmatter --silent', 'Running pre-deploy validation (frontmatter)...', { showOutput: true, shell: true });
    } catch (error) {
      console.log('❌ 🔍 Validation: failed');
      console.error('   To skip checks (not recommended): pnpm run deploy --skip-checks\n');
      process.exit(1);
    }
  }
```

- [ ] **Step 5: Simplify the build call**

Replace lines 421–449 (the `rebuildReason` logic + `runWithSpinner` build call + error retry block) with:

```javascript
  // Build site (includes source checks, OG image generation, Eleventy, and output checks)
  try {
    execSync('pnpm run build', { stdio: 'inherit', shell: true });
  } catch {
    console.error('\n❌ 🏗️  Build failed. Aborting deployment.\n');
    process.exit(1);
  }
```

Note: `execSync` is already imported at line 19. The `{ execSync, spawn }` destructure stays — `spawn` is still used by `runWithSpinner` and the rsync call.

- [ ] **Step 6: Remove the post-build validation block and its `else` branch**

Remove lines 451–465:
```javascript
  // Post-build validation checks (need _site/)
  if (!skipChecks) {
    try {
      // OG images validation (needs _site/ to check built pages)
      await runWithSpinner('pnpm run test og-images --silent', 'Running post-build validation (og-images)...', { showOutput: true, shell: true });
      
      console.log('✅ 🔍 Validation: all checks passed\n');
    } catch (error) {
      console.log('❌ 🔍 Validation: failed');
      console.error('   To skip checks (not recommended): pnpm run deploy --skip-checks\n');
      process.exit(1);
    }
  } else {
    console.log('⚠️  🔍 Validation: skipped (--skip-checks flag used)\n');
  }
```

- [ ] **Step 7: Update `docs/commands.md` to remove `--skip-checks`**

Find all references to `--skip-checks` in `docs/commands.md` and remove them. Specifically:

- Remove the bullet: `- \`pnpm run deploy --skip-checks\` - Deploy without running validation checks (not recommended)`
- In the "Deployment Process" section, remove the `- skipped with \`--skip-checks\`` annotations from each step description
- In the "Testing Deployment" section, keep `--dry-run` docs, remove any `--skip-checks` mention

- [ ] **Step 8: Update the deploy script comment block at the top of `deploy.js`**

Remove `--skip-checks` from the JSDoc comment at lines 14–17:
```javascript
 * Options:
 * - --skip-checks: Skip validation checks (not recommended)
 * - --dry-run: Run all checks and show what would be deployed, but don't actually deploy
```

Becomes:
```javascript
 * Options:
 * - --dry-run: Run all checks and show what would be deployed, but don't actually deploy
```

- [ ] **Step 9: Verify `pnpm run deploy --dry-run` runs build tests exactly once**

Run: `pnpm run deploy --dry-run`

Expected: build test output appears once (from `pnpm run build`), then rsync dry-run output. No duplicate test runs. Exit code: 0.

- [ ] **Step 10: Commit**

```bash
git add scripts/deploy/deploy.js docs/commands.md
git commit -m "refactor: delegate build tests to build.js, remove --skip-checks"
```
