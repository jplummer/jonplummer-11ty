#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { addFile, addIssue, addWarning } = require('../utils/test-results');
const { runTest, checkChangedFlag } = require('../utils/test-runner-helper');
const { getChangedFilesSinceHead } = require('../utils/test-helpers');

const ROOT = path.join(__dirname, '..', '..');
const GLOB = 'src/**/*.css';

function resolveStylelintCli() {
  const candidates = [
    path.join(ROOT, 'node_modules', '.bin', 'stylelint'),
    path.join(ROOT, 'node_modules', 'stylelint', 'bin', 'stylelint.mjs')
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  throw new Error('stylelint not found under node_modules; run pnpm install');
}

function getChangedCssFiles() {
  return getChangedFilesSinceHead()
    .filter((f) => f.endsWith('.css') && f.startsWith('src/'))
    .filter((f) => fs.existsSync(f));
}

function runStylelint(args) {
  const cli = resolveStylelintCli();
  const opts = {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024
  };
  if (cli.endsWith('.mjs')) {
    return spawnSync(process.execPath, [cli, ...args], opts);
  }
  return spawnSync(cli, args, opts);
}

function populateFromStylelintOutput(result, stdout, stderr) {
  // Stylelint writes JSON formatter output to stderr (stdout is often empty).
  const raw = (stdout || '').trim() || (stderr || '').trim();
  let reports;
  try {
    if (raw === '') {
      reports = [];
    } else {
      reports = JSON.parse(raw);
    }
  } catch {
    const fileObj = addFile(result, GLOB);
    addIssue(fileObj, {
      severity: 'error',
      type: 'stylelint',
      message: raw || 'Invalid JSON from stylelint'
    });
    return;
  }

  if (!Array.isArray(reports) || reports.length === 0) {
    addFile(result, GLOB);
    return;
  }

  for (const entry of reports) {
    const rel =
      path.relative(ROOT, entry.source || '').replace(/\\/g, '/') ||
      entry.source ||
      GLOB;
    const warnings = entry.warnings || [];
    if (warnings.length === 0) {
      addFile(result, rel);
      continue;
    }
    const fileObj = addFile(result, rel);
    for (const w of warnings) {
      const isWarning = w.severity === 'warning';
      const payload = {
        severity: isWarning ? 'warning' : 'error',
        type: w.rule || 'stylelint',
        message: w.text || '(no message)',
        line: w.line,
        column: w.column,
        ruleId: w.rule,
        helpUrl: w.url || undefined
      };
      if (isWarning) {
        addWarning(fileObj, payload);
      } else {
        addIssue(fileObj, payload);
      }
    }
  }
}

const JONPLUMMER_CSS = path.join(ROOT, 'src', 'assets', 'css', 'jonplummer.css');

// Captioned post images become <figure>. UA stylesheets still apply
// margin-inline: 40px unless we zero it; the grouped reset only clears
// margin-block-end. A top-level `figure {` (not a nested `& figure`) is
// what blog posts get.
function assertFigureInlineMarginReset(result) {
  const css = fs.readFileSync(JONPLUMMER_CSS, 'utf8');
  const fileObj = addFile(result, JONPLUMMER_CSS, 'jonplummer.css');
  if (!/^\s*figure\s*\{[^}]*margin-inline:\s*0/m.test(css)) {
    addIssue(fileObj, {
      type: 'figure-margin-inline',
      message:
        'Top-level figure { margin-inline: 0 } is required so captioned post images align with the text column (UA default is 40px)',
      ruleId: 'figure-margin-inline',
    });
  }
}

// Caption type (italic, quiet color) used to live only under
// article.portfolio-detail, so blog-post figcaptions stayed roman.
function assertArticleFigcaptionType(result) {
  const css = fs.readFileSync(JONPLUMMER_CSS, 'utf8');
  const fileObj = addFile(result, JONPLUMMER_CSS, 'jonplummer.css');
  if (!/article\s+figure\s+figcaption\s*\{[^}]*font-style:\s*italic/s.test(css)) {
    addIssue(fileObj, {
      type: 'figure-caption-type',
      message:
        'article figure figcaption must set font-style: italic so blog captions match portfolio',
      ruleId: 'figure-caption-type',
    });
  }
}

function validate(result, options) {
  assertFigureInlineMarginReset(result);
  assertArticleFigcaptionType(result);
  const { useChanged, files } = options || {};
  const styleArgs =
    useChanged && files && files.length > 0
      ? [...files, '-f', 'json']
      : [GLOB, '-f', 'json'];
  const proc = runStylelint(styleArgs);
  populateFromStylelintOutput(result, proc.stdout, proc.stderr);
}

const useChanged = checkChangedFlag();

runTest({
  testType: 'css',
  testName: 'CSS (Stylelint)',
  requiresSite: false,
  validateFn: validate,
  getChangedFilesFn: useChanged ? getChangedCssFiles : null
});
