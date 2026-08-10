#!/usr/bin/env node

/**
 * Site URLs are directory-style with a trailing slash (Apache 301s bare paths).
 * Internal markdown/HTML links without that slash create Ahrefs "301 redirect"
 * noise once per linking page. Flag authored bare paths in src/.
 */

const fs = require('fs');
const path = require('path');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const EXTENSIONS = new Set(['.md', '.njk', '.html']);

/** Root-absolute path with only URL-safe path chars (no Nunjucks/query/hash). */
const LINK_RE = /(?:href=["']|\]\()(\/[a-zA-Z0-9_./-]+)["')]/g;

function hasFileExtension(pathname) {
  const last = pathname.split('/').pop() || '';
  return /\.[a-zA-Z0-9]{1,12}$/.test(last);
}

function walkSrcFiles(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walkSrcFiles(full, out);
    } else if (EXTENSIONS.has(path.extname(name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

function findBareDirectoryLinks(content) {
  const hits = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    LINK_RE.lastIndex = 0;
    let match;
    while ((match = LINK_RE.exec(line)) !== null) {
      const href = match[1];
      if (href === '/' || href.endsWith('/') || hasFileExtension(href)) {
        continue;
      }
      hits.push({ href, line: i + 1 });
    }
  }
  return hits;
}

async function validate(result) {
  const files = walkSrcFiles(SRC);
  for (const filePath of files) {
    const relativePath = path.relative(ROOT, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const hits = findBareDirectoryLinks(content);
    if (hits.length === 0) {
      continue;
    }
    const fileObj = addFile(result, filePath, relativePath);
    for (const hit of hits) {
      addIssue(fileObj, {
        type: 'trailing-slash-link',
        message: `Internal link "${hit.href}" should use a trailing slash (e.g. "${hit.href}/") to avoid a 301`,
        line: hit.line,
        ruleId: 'trailing-slash-links',
      });
    }
  }
}

runTest({
  testType: 'trailing-slash-links',
  testName: 'Trailing-slash directory links',
  requiresSite: false,
  validateFn: validate
}).catch((error) => {
  console.error('Error during trailing-slash link validation:', error);
  process.exit(1);
});
