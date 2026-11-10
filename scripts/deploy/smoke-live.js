#!/usr/bin/env node

/**
 * Live smoke check: asks the live site for about 120 URLs and compares each
 * answer with what the source data says it should be. Catches what a local
 * build can't see: .htaccess rules the host ignores, redirects, error pages,
 * security headers, and files that didn't arrive.
 *
 * Read-only. GET requests one at a time, redirects not followed, nothing sent
 * but the URL, nothing written.
 *
 *   pnpm run smoke
 *   pnpm run smoke -- --base-url https://example.com
 *   pnpm run smoke -- --only redirects
 *
 * What is checked, and how answers are judged: scripts/utils/live-smoke.js.
 * Needs a built _site/ (for sitemap.xml). Exit code 1 on any failure.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { parseArgs } = require('util');
const yaml = require('js-yaml');
const { loadDotenvSilently } = require('../utils/env-utils');
const { getSiteDomain } = require('../utils/network-utils');
const { loadShortlinksFile } = require('../utils/shortlinks');
const { readSitemapUrls } = require('../utils/indexnow');
const { loadPortfolios, retiredUrls } = require('../../eleventy/utils/portfolios');
const { buildSmokeChecks, evaluateResponse } = require('../utils/live-smoke');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const SITE = path.join(ROOT, '_site');
const TIMEOUT_MS = 20000;

function gatherInputs() {
  const redirects = yaml.load(fs.readFileSync(path.join(SRC, '_data', 'redirects.yaml'), 'utf8')).redirects || [];
  const rootFiles = fs.readdirSync(SRC).filter((name) => /^google.*\.html$/.test(name) || name.endsWith('.txt'));
  return {
    redirects,
    shortlinks: loadShortlinksFile(),
    retiredListUrls: retiredUrls(loadPortfolios()),
    sitemapUrls: readSitemapUrls(SITE),
    rootFiles,
    nonce: crypto.randomBytes(6).toString('hex'),
  };
}

async function fetchCheck(url) {
  const res = await fetch(url, {
    method: 'GET',
    redirect: 'manual',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const headers = {};
  res.headers.forEach((value, name) => { headers[name.toLowerCase()] = value; });
  return { status: res.status, headers, body: await res.text() };
}

async function main() {
  const { values } = parseArgs({
    // pnpm passes a `--` separator through; without this, flags after it read as positionals.
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: { 'base-url': { type: 'string' }, only: { type: 'string' } },
  });

  loadDotenvSilently(path.join(ROOT, '.env'));
  const baseUrl = (values['base-url'] || `https://${getSiteDomain()}`).replace(/\/$/, '');

  if (!fs.existsSync(path.join(SITE, 'sitemap.xml'))) {
    console.error('❌ _site/sitemap.xml is missing. Run `pnpm run build` first.');
    process.exit(1);
  }

  let checks = buildSmokeChecks(gatherInputs());
  if (values.only) {
    const groups = [...new Set(checks.map((c) => c.group))];
    checks = checks.filter((c) => c.group === values.only);
    if (checks.length === 0) {
      console.error(`❌ No group named "${values.only}". Groups: ${groups.join(', ')}`);
      process.exit(1);
    }
  }

  console.log(`🩺 Smoke check: ${checks.length} requests to ${baseUrl}\n`);

  const tally = new Map(); // group → { passed, total }
  const failures = [];
  const cacheStatus = new Map();

  for (const check of checks) {
    const url = baseUrl + check.path;
    let problems;
    try {
      const response = await fetchCheck(url);
      problems = evaluateResponse(check, response, baseUrl);
      const cf = response.headers['cf-cache-status'] || '(no cf-cache-status)';
      cacheStatus.set(cf, (cacheStatus.get(cf) || 0) + 1);
    } catch (error) {
      problems = [`request failed: ${error.cause?.code || error.message}`];
    }

    const group = tally.get(check.group) || { passed: 0, total: 0 };
    group.total += 1;
    if (problems.length === 0) group.passed += 1;
    else failures.push({ group: check.group, url, problems });
    tally.set(check.group, group);
  }

  for (const [name, { passed, total }] of tally) {
    console.log(`${passed === total ? '✅' : '❌'} ${name}: ${passed}/${total}`);
  }

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const { group, url, problems } of failures) {
      console.log(`  [${group}] ${url}`);
      for (const problem of problems) console.log(`      ${problem}`);
    }
  }

  console.log('\nCloudflare cache status of the answers:');
  for (const [status, count] of [...cacheStatus].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${status}: ${count}`);
  }

  const failed = failures.length;
  console.log(failed === 0
    ? `\n✅ All ${checks.length} checks passed.`
    : `\n❌ ${failed} of ${checks.length} checks failed.`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(`❌ Smoke check crashed: ${error.stack || error.message}`);
  process.exit(1);
});
