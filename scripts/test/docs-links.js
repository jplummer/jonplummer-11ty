#!/usr/bin/env node

/**
 * Relative links in docs/ must point at files that exist. These docs are how
 * agents and people find their way around the repo, and a link that silently
 * resolves nowhere is the cheapest kind of rot to catch.
 *
 * Skipped on purpose:
 * - docs/designs/plans/, docs/designs/specs/, docs/archive/ — dated records that
 *   name files as they were, including ones since deleted.
 * - docs/designs/scratch/ — gitignored local reports.
 * - Links inside code spans and fenced code blocks (format examples).
 * - URLs with a scheme, root-absolute site paths (/assets/…), and #anchors.
 *
 * Does not check that an anchor exists in the target file, and does not check
 * prose claims. Stale statements ("X is already linked from Y") need a person
 * or an agent reading against the repo.
 */

const fs = require('fs');
const path = require('path');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const ROOT = path.join(__dirname, '..', '..');
const DOCS = path.join(ROOT, 'docs');
const RULE_ID = 'docs-links';

const SKIP_DIRS = ['designs/plans', 'designs/specs', 'designs/scratch', 'archive'].map((d) =>
  path.join(DOCS, d)
);

/** [text](target) or [text](<target>), with an optional "title". */
const LINK_RE = /\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
const FENCE_RE = /^\s*(```|~~~)/;
const INLINE_CODE_RE = /(`+)[\s\S]*?\1/g;

function walkMarkdown(dir, out = []) {
  if (SKIP_DIRS.includes(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      walkMarkdown(full, out);
    } else if (name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

function isCheckable(target) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return false; // http:, mailto:, computer:, …
  if (target.startsWith('#') || target.startsWith('/')) return false;
  return true;
}

function findBrokenLinks(filePath, content) {
  const hits = [];
  const dir = path.dirname(filePath);
  let fence = null;
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const fenceMatch = lines[i].match(FENCE_RE);
    if (fenceMatch) {
      if (fence === null) fence = fenceMatch[1];
      else if (fence === fenceMatch[1]) fence = null;
      continue;
    }
    if (fence !== null) continue;

    const line = lines[i].replace(INLINE_CODE_RE, '');
    LINK_RE.lastIndex = 0;
    let match;
    while ((match = LINK_RE.exec(line)) !== null) {
      const target = match[1];
      if (!isCheckable(target)) continue;
      let filePart = target.split('#')[0];
      try {
        filePart = decodeURIComponent(filePart);
      } catch {
        // Malformed %-escape: check the path as written.
      }
      if (!fs.existsSync(path.resolve(dir, filePart))) {
        hits.push({ target, line: i + 1 });
      }
    }
  }
  return hits;
}

async function validate(result) {
  for (const filePath of walkMarkdown(DOCS)) {
    const relativePath = path.relative(ROOT, filePath);
    const fileObj = addFile(result, filePath, relativePath);
    const hits = findBrokenLinks(filePath, fs.readFileSync(filePath, 'utf8'));
    for (const hit of hits) {
      addIssue(fileObj, {
        type: RULE_ID,
        message: `Relative link "${hit.target}" points at a file that doesn't exist`,
        line: hit.line,
        ruleId: RULE_ID,
      });
    }
  }
}

runTest({
  testType: RULE_ID,
  testName: 'Docs relative links',
  requiresSite: false,
  validateFn: validate,
}).catch((error) => {
  console.error('Error during docs link validation:', error);
  process.exit(1);
});
