#!/usr/bin/env node

/**
 * Single source of truth for which tests exist, which script runs them, and
 * which groups/phases they belong to. Everything else (scripts/test-runner.js,
 * scripts/build/build.js, scripts/test-changed.js) derives its lists from
 * TESTS below instead of keeping a separate copy.
 *
 * Each entry:
 *   id      — CLI name (`pnpm run test <id>`)
 *   script  — 'file.js' (shorthand for { file, dir: 'test' }) or { file, dir }
 *   groups  — tags, not exclusive:
 *     'fast'    — content-authoring + build-output checks (`pnpm run test fast`)
 *     'pre'     — pre-build phase in scripts/build/build.js
 *     'post'    — post-build phase in scripts/build/build.js
 *     'unit'    — tooling unit tests (`pnpm run test unit`)
 *     'changed' — content-authoring test with --changed support, run by
 *                 scripts/test-changed.js on files changed since last commit
 *
 * Optional flags:
 *   slow       — excluded from 'fast'; included in the derived 'all' group
 *                (`pnpm run test all` = 'fast' + slow-flagged tests)
 *   nonJson    — test uses inherited stdio instead of the JSON IPC markers
 *                (scripts/test-runner.js's nonJsonTests)
 *   listInHelp — false hides the test from the no-arg `pnpm run test` listing
 *                (default true). Still runnable directly and via its groups.
 */
const fs = require('fs');
const path = require('path');

const TESTS = [
  { id: 'html', script: 'html.js', groups: ['fast', 'post'] },
  { id: 'links', script: 'links-yaml.js', groups: ['fast', 'pre', 'changed'] },
  { id: 'wisdom', script: 'wisdom-yaml.js', groups: ['fast', 'pre', 'changed'] },
  { id: 'internal-links', script: 'internal-links.js', groups: ['fast', 'post'] },
  { id: 'frontmatter', script: 'frontmatter.js', groups: ['fast', 'pre', 'changed'] },
  { id: 'markdown', script: 'markdown.js', groups: ['fast', 'pre', 'changed'] },
  { id: 'spell', script: 'spell.js', groups: ['fast', 'pre', 'changed'] },
  { id: 'seo', script: 'seo-meta.js', groups: ['fast', 'post', 'changed'] },
  { id: 'og-images', script: 'og-images.js', groups: ['fast', 'post'] },
  { id: 'a11y', script: 'accessibility.js', groups: [], slow: true },
  { id: 'color-contrast', script: 'color-contrast.js', groups: ['fast', 'pre'] },
  { id: 'css', script: 'css.js', groups: ['fast', 'pre', 'changed'] },
  { id: 'rss', script: 'rss-feed.js', groups: ['fast', 'post'] },
  // Supports --changed itself (detects whether its own parser code changed,
  // not authored content), but is deliberately excluded from the 'changed'
  // group — that group is for content-authoring checks run by test-changed.js.
  { id: 'portfolio-notes', script: 'portfolio-notes.js', groups: ['unit'] },
  { id: 'deploy-assets', script: 'deploy-assets.js', groups: ['fast', 'post'] },
  { id: 'cloudflare-purge', script: 'cloudflare-purge.js', groups: ['unit'] },
  { id: 'deploy-guards', script: 'deploy-guards.js', groups: ['unit'] },
  { id: 'deploy', script: 'deploy.js', groups: [], nonJson: true },
  // Not a build-output check: indexnow.js is a pure unit test of selection
  // logic (fixture manifests), no _site/ dependency.
  { id: 'indexnow', script: 'indexnow.js', groups: ['unit'] },
  // Guards the two .cache cursors against being merged or cross-contaminated:
  // runs deploy.js's composition (one shared hash walk) with stubbed fetch.
  { id: 'manifest-cursors', script: 'manifest-cursors.js', groups: ['unit'] },
  { id: 'figure-lightbox', script: 'figure-lightbox.js', groups: ['unit'], listInHelp: false },
  { id: 'site-branding', script: 'site-branding.js', groups: ['unit'] },
  { id: 'preview-site-lockup', script: 'preview-site-lockup.js', groups: ['unit'] },
  { id: 'light-theme-colors', script: 'light-theme-colors.js', groups: ['unit'] },
  { id: 'og-image-filename', script: 'og-image-filename.js', groups: ['unit'] },
  { id: 'source-file-utils', script: 'source-file-utils.js', groups: ['unit'] },
  // fast-only: not part of either build.js phase (build's own output isn't
  // what this checks — it guards the static 404.html asset hrefs).
  { id: 'error-document-assets', script: 'error-document-assets.js', groups: ['fast'] },
  { id: 'trailing-slash-links', script: 'trailing-slash-links.js', groups: ['fast', 'pre'] },
  // Guards the docs/designs/ structure against superpowers skills that still
  // hardcode docs/superpowers/ (their SKILL.md files live in a plugin cache we
  // can't durably edit — see .cursor/rules/memory.mdc).
  { id: 'design-docs-location', script: 'design-docs-location.js', groups: ['fast', 'pre'] },
  { id: 'portfolio-cover-crop', script: 'portfolio-cover-crop.js', groups: ['fast', 'post'] },
  { id: 'test-json-pipe', script: 'test-json-pipe.js', groups: ['unit'] },
  { id: 'security', script: { file: 'security-audit.js', dir: 'security' }, groups: [], nonJson: true },
];

function normalizeScript(script) {
  return typeof script === 'string' ? { file: script, dir: 'test' } : script;
}

function getTest(id) {
  return TESTS.find((t) => t.id === id) || null;
}

function getTestScriptPath(id) {
  const test = getTest(id);
  if (!test) return null;
  const { file, dir } = normalizeScript(test.script);
  return path.join(__dirname, dir, file);
}

function getTestScriptBasename(id) {
  const test = getTest(id);
  if (!test) return null;
  const { file } = normalizeScript(test.script);
  return file.replace(/\.js$/, '');
}

/**
 * 'all' is derived, not stored, so it can't drift from 'fast':
 * fast-group tests, in order, followed by any slow-flagged tests not
 * already in 'fast' (currently just a11y).
 */
function getTestsByGroup(group) {
  if (group === 'all') {
    const fast = getTestsByGroup('fast');
    const fastIds = new Set(fast.map((t) => t.id));
    const slowExtra = TESTS.filter((t) => t.slow && !fastIds.has(t.id));
    return [...fast, ...slowExtra];
  }
  return TESTS.filter((t) => t.groups.includes(group));
}

function getAllTestIds() {
  return TESTS.map((t) => t.id);
}

function getNonJsonTestIds() {
  return TESTS.filter((t) => t.nonJson).map((t) => t.id);
}

function getHelpListedTests() {
  return TESTS.filter((t) => t.listInHelp !== false);
}

function assertManifest(condition, message) {
  if (!condition) {
    throw new Error(`[test-manifest] ${message}`);
  }
}

/**
 * Runs once when this module loads (every `pnpm run test*` / `pnpm run build`
 * invocation requires it), so roster drift fails loudly instead of silently.
 */
function validateManifest() {
  const ids = TESTS.map((t) => t.id);
  assertManifest(new Set(ids).size === ids.length, 'duplicate test id in TESTS');

  // Every manifest id has a resolvable script file on disk.
  for (const test of TESTS) {
    const scriptPath = getTestScriptPath(test.id);
    assertManifest(fs.existsSync(scriptPath), `script not found for '${test.id}': ${scriptPath}`);
  }

  // getTestsByGroup('all') === getTestsByGroup('fast') + slow-flagged tests.
  const fastIds = getTestsByGroup('fast').map((t) => t.id);
  const allIds = getTestsByGroup('all').map((t) => t.id);
  const slowOnlyIds = TESTS.filter((t) => t.slow && !fastIds.includes(t.id)).map((t) => t.id);
  assertManifest(
    JSON.stringify(allIds) === JSON.stringify([...fastIds, ...slowOnlyIds]),
    `'all' group must equal 'fast' + slow-flagged tests, got [${allIds.join(', ')}]`
  );
  assertManifest(
    !TESTS.some((t) => t.slow && fastIds.includes(t.id)),
    'a test cannot be both slow and in the fast group'
  );

  // No test id appears in both 'unit' and 'fast'.
  const unitIds = getTestsByGroup('unit').map((t) => t.id);
  const unitFastOverlap = unitIds.filter((id) => fastIds.includes(id));
  assertManifest(unitFastOverlap.length === 0, `tests in both 'unit' and 'fast': ${unitFastOverlap.join(', ')}`);

  // 'changed' ⊆ registered tests, and each 'changed' test actually implements --changed.
  for (const test of getTestsByGroup('changed')) {
    assertManifest(getTest(test.id), `'changed' test '${test.id}' is not a registered test`);
    const scriptPath = getTestScriptPath(test.id);
    const source = fs.readFileSync(scriptPath, 'utf8');
    assertManifest(
      source.includes('checkChangedFlag'),
      `'changed' test '${test.id}' does not appear to implement --changed (no checkChangedFlag reference in ${scriptPath})`
    );
  }

  // Pre + post build lists contain no duplicates and no unknown ids.
  for (const group of ['pre', 'post']) {
    const groupIds = getTestsByGroup(group).map((t) => t.id);
    assertManifest(new Set(groupIds).size === groupIds.length, `duplicate ids in '${group}' group`);
    for (const id of groupIds) {
      assertManifest(getTest(id), `'${group}' group references unknown id '${id}'`);
    }
  }
}

validateManifest();

module.exports = {
  TESTS,
  getTest,
  getTestScriptPath,
  getTestScriptBasename,
  getTestsByGroup,
  getAllTestIds,
  getNonJsonTestIds,
  getHelpListedTests,
  validateManifest,
};
