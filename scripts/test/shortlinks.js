#!/usr/bin/env node

/**
 * Validate shortlinks.yaml and (when built) emitted RewriteRules in _site/.htaccess.
 */

const fs = require('fs');
const path = require('path');
const {
  SHORTLINKS_PATH,
  loadShortlinksFile,
  validateShortlinks,
  htaccessRewriteLines,
  SLUG_PATTERN,
} = require('../utils/shortlinks');
const { addFile, addIssue, addWarning } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

function collectTwoCharPermalinkCandidates() {
  const roots = [path.join(process.cwd(), 'src')];
  const found = [];
  const permalinkRe = /^permalink:\s*["']?(\/[^"'#\s]+)["']?\s*$/m;

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name.startsWith('.') && ent.name !== '.htaccess.njk') continue;
      const abs = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === '_includes' || ent.name === 'assets' || ent.name === '_data') continue;
        walk(abs);
        continue;
      }
      if (!/\.(md|njk|html)$/.test(ent.name)) continue;
      const text = fs.readFileSync(abs, 'utf8');
      const m = text.match(permalinkRe);
      if (m) found.push(m[1]);
    }
  }

  for (const root of roots) walk(root);
  return found;
}

runTest({
  testType: 'shortlinks',
  testName: 'Short links data and .htaccess rules',
  validateFn: async (result) => {
    const fileObj = addFile(result, SHORTLINKS_PATH);

    let entries;
    try {
      entries = loadShortlinksFile();
    } catch (error) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'shortlinks-load',
        message: error.message,
      });
      return;
    }

    const { issues, warnings } = validateShortlinks(entries, {
      permalinkPaths: collectTwoCharPermalinkCandidates(),
    });

    for (const message of issues) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'shortlinks-validate',
        message,
      });
    }
    for (const message of warnings) {
      addWarning(fileObj, {
        type: 'shortlinks-duplicate-destination',
        message,
      });
    }

    const canary = entries.find((e) => e.slug === 'JP');
    if (!canary || canary.to !== 'https://jonplummer.com/') {
      addIssue(fileObj, {
        severity: 'error',
        type: 'shortlinks-canary',
        message: 'expected canary slug JP → https://jonplummer.com/',
      });
    }

    // Unit-ish: bad slug / non-https / retired must fail validation
    const badSlug = validateShortlinks([{ slug: 'OI', to: 'https://jonplummer.com/', created: '2026-10-02' }]);
    if (!badSlug.issues.some((m) => /bad slug/.test(m))) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'shortlinks-unit',
        message: 'expected OI (contains O,I) to fail slug validation',
      });
    }

    const badProto = validateShortlinks([{ slug: 'AB', to: 'http://example.com/', created: '2026-10-02' }]);
    if (!badProto.issues.some((m) => /absolute https/.test(m))) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'shortlinks-unit',
        message: 'expected http destination to fail',
      });
    }

    const badRetired = validateShortlinks([
      { slug: 'AB', to: 'https://example.com/x', created: '2026-10-02', retired: true },
    ]);
    if (!badRetired.issues.some((m) => /retired/.test(m))) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'shortlinks-unit',
        message: 'expected retired non-home destination to fail',
      });
    }

    const dupDest = validateShortlinks([
      { slug: 'AB', to: 'https://example.com/x', created: '2026-10-02' },
      { slug: 'CD', to: 'https://example.com/x/', created: '2026-10-02' },
    ]);
    if (dupDest.warnings.length === 0) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'shortlinks-unit',
        message: 'expected duplicate destinations to warn',
      });
    }

    const lines = htaccessRewriteLines(entries);
    for (const line of lines) {
      if (!/^RewriteRule \^[A-HJ-NP-Z2-9]{2}\/\?\$ https:\/\/\S+ \[R=302,NC,L\]$/.test(line)) {
        addIssue(fileObj, {
          severity: 'error',
          type: 'shortlinks-rewrite-shape',
          message: `unexpected RewriteRule shape: ${line}`,
        });
      }
    }

    const htaccessPath = path.join(process.cwd(), '_site', '.htaccess');
    if (fs.existsSync(htaccessPath)) {
      const htObj = addFile(result, htaccessPath);
      const ht = fs.readFileSync(htaccessPath, 'utf8');
      const hasShortlinksBlock = ht.includes('# Begin shortlinks');

      if (!hasShortlinksBlock) {
        addWarning(htObj, {
          type: 'shortlinks-htaccess-stale',
          message:
            '_site/.htaccess has no shortlinks block yet (stale build). Rebuild to emit RewriteRules.',
        });
      } else {
        const wisdomIdx = ht.indexOf('RewriteRule ^wisdom/tags/');
        for (const line of lines) {
          const idx = ht.indexOf(line);
          if (idx === -1) {
            addIssue(htObj, {
              severity: 'error',
              type: 'shortlinks-htaccess-missing',
              message: `built .htaccess missing rule: ${line}`,
            });
            continue;
          }
          if (wisdomIdx !== -1 && idx > wisdomIdx) {
            addIssue(htObj, {
              severity: 'error',
              type: 'shortlinks-htaccess-order',
              message: `shortlink rule must appear before wisdom rewrite: ${line}`,
            });
          }
        }

        // Guard: no accidental two-char site dirs that would shadow rules
        const siteRoot = path.join(process.cwd(), '_site');
        for (const ent of fs.readdirSync(siteRoot, { withFileTypes: true })) {
          if (!ent.isDirectory()) continue;
          if (ent.name.length === 2 && SLUG_PATTERN.test(ent.name.toUpperCase())) {
            addIssue(htObj, {
              severity: 'error',
              type: 'shortlinks-path-collision',
              message: `_site/${ent.name}/ collides with shortlink namespace`,
            });
          }
        }
      }
    } else {
      addWarning(fileObj, {
        type: 'shortlinks-no-build',
        message: '_site/.htaccess not found — run a build to verify emitted RewriteRules',
      });
    }
  },
});
