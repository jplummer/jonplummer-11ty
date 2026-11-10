#!/usr/bin/env node

/**
 * Single source of truth for which tests exist, which script runs them, and
 * which groups/phases they belong to. Everything else (scripts/test-runner.js,
 * scripts/build/build.js, scripts/test-changed.js) derives its lists from
 * TESTS below instead of keeping a separate copy.
 *
 * When you add, remove, or regroup a test, update the Fast and Unit lists in
 * docs/tests.md § Test Categories to match. Nothing checks them, and they
 * have gone stale before.
 *
 * Each entry:
 *   id      — CLI name (`pnpm run test <id>`)
 *   script  — 'file.js' (shorthand for { file, dir: 'test' }) or { file, dir }
 *   name, description, emoji — how the runner shows the test: name and emoji
 *             on its status line, description in the `pnpm run test` list.
 *             All three are required; validateManifest() fails without them.
 *             Some emoji carry a trailing space on purpose: it works around a
 *             width bug in the macOS Terminal.
 *   groups  — tags, not exclusive:
 *     'fast'    — content-authoring + build-output checks (`pnpm run test fast`)
 *     'pre'     — pre-build phase in scripts/build/build.js
 *     'post'    — post-build phase in scripts/build/build.js
 *     'unit'    — tooling unit tests (`pnpm run test unit`). Each is written
 *                 for node:test and run by `node --test` through
 *                 scripts/utils/unit-reporter.js; validateManifest() fails
 *                 a unit entry written any other way.
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
  { id: 'html', script: 'html.js', groups: ['fast', 'post'],
    name: 'HTML Validation', description: 'HTML validity', emoji: '🧩' },
  { id: 'links', script: 'links-yaml.js', groups: ['fast', 'pre', 'changed'],
    name: 'Links YAML', description: 'Links YAML structure', emoji: '📌' },
  { id: 'wisdom', script: 'wisdom-yaml.js', groups: ['fast', 'pre', 'changed'],
    name: 'Wisdom YAML', description: 'Collected wisdom YAML structure', emoji: '🦉' },
  { id: 'shortlinks', script: 'shortlinks.js', groups: ['fast', 'pre', 'post'],
    name: 'Short links', description: 'Short link data and .htaccess rules', emoji: '🤏' },
  { id: 'portfolios', script: 'portfolios.js', groups: ['fast', 'pre'],
    name: 'Portfolio lists', description: 'Portfolio lists in portfolios.yaml', emoji: '🗂️' },
  { id: 'internal-links', script: 'internal-links.js', groups: ['fast', 'post'],
    name: 'Internal Links', description: 'Internal link validity', emoji: '🔗' },
  { id: 'frontmatter', script: 'frontmatter.js', groups: ['fast', 'pre', 'changed'],
    name: 'Frontmatter', description: 'Frontmatter validation', emoji: '🗂️ ' },
  { id: 'markdown', script: 'markdown.js', groups: ['fast', 'pre', 'changed'],
    name: 'Markdown', description: 'Markdown syntax', emoji: '✍️ ' },
  { id: 'spell', script: 'spell.js', groups: ['fast', 'pre', 'changed'],
    name: 'Spell Check', description: 'Spell checking', emoji: '🧙' },
  { id: 'seo', script: 'seo-meta.js', groups: ['fast', 'post', 'changed'],
    name: 'SEO Meta', description: 'SEO and meta tags', emoji: '📈' },
  { id: 'og-images', script: 'og-images.js', groups: ['fast', 'post'],
    name: 'OG Images', description: 'Open Graph images', emoji: '📸' },
  { id: 'a11y', script: 'accessibility.js', groups: [], slow: true,
    name: 'Accessibility', description: 'Accessibility (WCAG compliance)', emoji: '🌈' },
  { id: 'color-contrast', script: 'color-contrast.js', groups: ['fast', 'pre'],
    name: 'Color Contrast', description: 'Color contrast (APCA)', emoji: '🎨' },
  { id: 'css', script: 'css.js', groups: ['fast', 'pre', 'changed'],
    name: 'CSS (Stylelint)', description: 'CSS lint (Stylelint)', emoji: '📐' },
  { id: 'rss', script: 'rss-feed.js', groups: ['fast', 'post'],
    name: 'RSS Feed', description: 'RSS feed validation', emoji: '📡' },
  { id: 'portfolio-notes', script: 'portfolio-notes.js', groups: ['unit'],
    name: 'Portfolio notes parsing', description: 'Portfolio speaker-notes text parsing', emoji: '📎' },
  { id: 'deploy-assets', script: 'deploy-assets.js', groups: ['fast', 'post'],
    name: 'Deploy Assets', description: 'Fonts and deploy-critical _site/ assets', emoji: '📦' },
  { id: 'cloudflare-purge', script: 'cloudflare-purge.js', groups: ['unit'],
    name: 'Cloudflare Purge', description: 'Content-hash manifest diff → Cloudflare purge URL mapping', emoji: '☁️' },
  { id: 'deploy-guards', script: 'deploy-guards.js', groups: ['unit'],
    name: 'Deploy Guards', description: 'deploy.js regression guards (rsync excludes, changelog, purge wiring, one shared hash walk)', emoji: '🛟' },
  { id: 'deploy', script: 'deploy.js', groups: [], nonJson: true,
    name: 'Deploy', description: 'Deployment connectivity', emoji: '🚀' },
  // Not a build-output check: indexnow.js is a pure unit test of selection
  // logic (fixture manifests), no _site/ dependency.
  { id: 'indexnow', script: 'indexnow.js', groups: ['unit'],
    name: 'IndexNow', description: 'IndexNow URL selection from content-hash manifests', emoji: '📣' },
  // Guards the two .cache cursors against being merged or cross-contaminated:
  // runs deploy.js's composition (one shared hash walk) with stubbed fetch.
  { id: 'manifest-cursors', script: 'manifest-cursors.js', groups: ['unit'],
    name: 'Deploy manifest cursors', description: 'Cloudflare and IndexNow state files stay independent cursors', emoji: '🔖' },
  { id: 'figure-lightbox', script: 'figure-lightbox.js', groups: ['unit'], listInHelp: false,
    name: 'Figure lightbox', description: 'Lightbox trigger links on figures', emoji: '🔍' },
  // Matcher behind the /404 "did you mean" list. Requires the browser file
  // directly, so there is no second copy of the scoring logic to drift.
  { id: '404-suggest', script: '404-suggest.js', groups: ['unit'],
    name: '404 suggestions', description: 'Matcher behind the 404 page suggestions', emoji: '🤷' },
  { id: 'site-branding', script: 'site-branding.js', groups: ['unit'],
    name: 'Site Branding', description: 'site.js author/tagline/title contract and no hardcoded tagline', emoji: '🏷️' },
  { id: 'preview-site-lockup', script: 'preview-site-lockup.js', groups: ['unit'],
    name: 'Preview Site Lockup', description: 'build-time facsimile .site-lockup HTML for color/type previews', emoji: '🖼️' },
  { id: 'og-image-filename', script: 'og-image-filename.js', groups: ['unit'],
    name: 'OG Image Filename', description: 'OG PNG basename from post date (date-only calendar-safe)', emoji: '🗂️' },
  // OG card labels, mark geometry, and a real render of the title fit.
  { id: 'og-card', script: 'og-card.js', groups: ['unit'],
    name: 'OG Card', description: 'OG card labels, mark geometry, and a real render of the title fit', emoji: '🃏' },
  { id: 'date-utils', script: 'date-utils.js', groups: ['unit'],
    name: 'Date Utils', description: 'postDate formats date-only strings in America/Los_Angeles', emoji: '📅' },
  { id: 'og-shared-fingerprint', script: 'og-shared-fingerprint.js', groups: ['unit'],
    name: 'OG shared fingerprint', description: 'OG shared fingerprint changes only when card inputs change', emoji: '🫆' },
  // OG card digest in the PNG, and the generator's render / keep / stamp decision.
  { id: 'og-card-digest', script: 'og-card-digest.js', groups: ['unit'],
    name: 'OG card digest', description: 'OG card digest in the PNG and the render, keep, or stamp decision', emoji: '🪪' },
  { id: 'changelog-format', script: 'changelog-format.js', groups: ['unit'],
    name: 'Changelog format', description: 'Changelog wraps filenames as code', emoji: '🗒️' },
  { id: 'source-file-utils', script: 'source-file-utils.js', groups: ['unit'],
    name: 'Source File Utils', description: 'Built HTML path -> source file resolution and redirect-page detection', emoji: '🧭' },
  // fast-only: not part of either build.js phase (build's own output isn't
  // what this checks — it guards the static 404.html asset hrefs).
  { id: 'error-document-assets', script: 'error-document-assets.js', groups: ['fast'],
    name: 'ErrorDocument asset paths', description: '404.html + 500.html root-absolute CSS/font/favicon hrefs', emoji: '📄' },
  // Plated favicon.ico / apple-touch-icon.png for third-party <img> scrapers;
  // icon.svg (tabs) must stay unplated. No _site needed.
  { id: 'favicon-rasters', script: 'favicon-rasters.js', groups: ['fast', 'pre'],
    name: 'Favicon scraper rasters', description: 'favicon.ico / apple-touch-icon.png use a light field; icon.svg stays themed', emoji: '🟦' },
  { id: 'trailing-slash-links', script: 'trailing-slash-links.js', groups: ['fast', 'pre'],
    name: 'Trailing-slash directory links', description: 'Internal directory links must include trailing slash (avoid 301 noise)', emoji: '↪️' },
  // The inline first-paint shell duplicates jonplummer.css tokens by necessity
  // (the stylesheet it covers for has not loaded). Drift shipped once, in Aug
  // 2026, and is invisible except on a cold first paint. No _site needed.
  { id: 'critical-css', script: 'critical-css.js', groups: ['fast', 'pre'],
    name: 'Critical CSS shell sync', description: 'Inline first-paint shell must match jonplummer.css :root tokens', emoji: '⚡' },
  // Generated post figures (scripts/figures/) are <img> SVGs that copy site color tokens
  // into their own <style>; each copy must match jonplummer.css :root. No _site needed.
  { id: 'figure-tokens', script: 'figure-tokens.js', groups: ['fast', 'pre'],
    name: 'Figure tokens', description: 'Generated figure colors match jonplummer.css :root tokens', emoji: '🪙' },
  // Guards the docs/designs/ structure against superpowers skills that still
  // hardcode docs/superpowers/ (their SKILL.md files live in a plugin cache we
  // can't durably edit — see docs/agent-memory.md).
  { id: 'design-docs-location', script: 'design-docs-location.js', groups: ['fast', 'pre'],
    name: 'Design docs location', description: 'Plans/specs stay in docs/designs/ (superpowers skills hardcode docs/superpowers/)', emoji: '🗃️' },
  // Relative links in docs/ must resolve. Dated plans/specs/archive are
  // skipped because they name files as they were. No _site needed.
  { id: 'docs-links', script: 'docs-links.js', groups: ['fast', 'pre'],
    name: 'Docs relative links', description: 'Relative links in docs/ point at files that exist', emoji: '🔗' },
  { id: 'portfolio-cover-crop', script: 'portfolio-cover-crop.js', groups: ['fast', 'post'],
    name: 'Portfolio cover crop', description: 'Grid coverPosition/coverZoom allowlist, CSS vars, Monotasker HTML', emoji: '📐' },
  { id: 'test-json-pipe', script: 'test-json-pipe.js', groups: ['unit'],
    name: 'Test JSON pipe', description: 'Large TEST_RUNNER JSON survives piped stdout (partial write + drain)', emoji: '🧪' },
  { id: 'live-smoke', script: 'live-smoke.js', groups: ['unit'],
    name: 'Live smoke checks', description: 'Live smoke check list and response evaluation', emoji: '🩺' },
  { id: 'merge-posts-links', script: 'merge-posts-links.js', groups: ['unit'],
    name: 'Posts and links merge', description: 'Where each link lands among the posts, page by page', emoji: '🧵' },
  { id: 'noteplan-import', script: 'noteplan-import.js', groups: ['unit'],
    name: 'NotePlan link import', description: 'Reading the NotePlan note and rewriting links.yaml without loss', emoji: '🔗' },
  { id: 'shortlink-command', script: 'shortlink-command.js', groups: ['unit'],
    name: 'Short link command', description: 'pnpm run shortlink, and the Apache rule each link gets', emoji: '🪝' },
  { id: 'unit-reporter', script: 'unit-reporter.js', groups: ['unit'],
    name: 'Unit test reporter', description: 'Result lines, counts, and failures for node:test unit tests', emoji: '📋' },
  { id: 'unit-wiring', script: 'unit-wiring.js', groups: ['unit'],
    name: 'Unit test wiring', description: 'The manifest rule that unit tests are node:test files, and --format for one', emoji: '🔌' },
  { id: 'security', script: { file: 'security-audit.js', dir: 'security' }, groups: [], nonJson: true,
    name: 'Security Audit', description: 'Security audit', emoji: '🛡️' },
];

function normalizeScript(script) {
  return typeof script === 'string' ? { file: script, dir: 'test' } : script;
}

function getTest(id) {
  return TESTS.find((t) => t.id === id) || null;
}

/** Labels for a test id, or null when the id isn't in the manifest. */
function getTestLabel(id) {
  const test = getTest(id);
  if (!test) return null;
  return { name: test.name, description: test.description, emoji: test.emoji };
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

/** The id whose script is this absolute path, or null. The unit reporter uses it to label a file. */
function getTestIdByScriptPath(absPath) {
  const test = TESTS.find((t) => getTestScriptPath(t.id) === absPath);
  return test ? test.id : null;
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
/**
 * True when a test file's source loads node:test in a statement of its own
 * and doesn't load test-runner-helper. A mention in a comment or a string
 * counts for neither. Tested by scripts/test/unit-wiring.js.
 */
function isNodeTestSource(source) {
  const loadsNodeTest = /^\s*(?:const|let|var)\s[^\n]*=\s*require\((['"])node:test\1\)/m.test(source);
  const loadsHelper = /^\s*(?:const|let|var)\s[^\n]*=\s*require\((['"])[^'"\n]*test-runner-helper(?:\.js)?\1\)/m.test(source);
  return loadsNodeTest && !loadsHelper;
}

function validateManifest() {
  const ids = TESTS.map((t) => t.id);
  assertManifest(new Set(ids).size === ids.length, 'duplicate test id in TESTS');

  // Every test carries its own labels, so a new one can't show up unnamed.
  for (const test of TESTS) {
    for (const field of ['name', 'description', 'emoji']) {
      assertManifest(
        typeof test[field] === 'string' && test[field].trim().length > 0,
        `test '${test.id}' needs a ${field}`
      );
    }
  }

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

  // Every unit test is a node:test file, so each one reports its own test
  // count and none can be written against the results model by habit.
  for (const test of getTestsByGroup('unit')) {
    const source = fs.readFileSync(getTestScriptPath(test.id), 'utf8');
    assertManifest(
      isNodeTestSource(source),
      `unit test '${test.id}' must be a node:test file (require('node:test'), no test-runner-helper)`
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
  getTestLabel,
  getTestScriptPath,
  getTestScriptBasename,
  getTestsByGroup,
  getAllTestIds,
  getNonJsonTestIds,
  getTestIdByScriptPath,
  getHelpListedTests,
  validateManifest,
  isNodeTestSource,
};
