#!/usr/bin/env node

/**
 * IndexNow notification.
 * Detects changed public pages from a local SHA-256 content-hash manifest of
 * `_site` — the same technique `scripts/utils/cloudflare-purge.js` uses for
 * Cloudflare purging — instead of parsing git diffs (the old approach
 * re-implemented Eleventy's permalink rules by hand and got them wrong,
 * silently submitting nothing on most deploys).
 *
 * Keeps its own state file (`.cache/indexnow-content-manifest.json`),
 * separate from Cloudflare's. The two files look redundant — after a healthy
 * deploy they hold the same snapshot — but they are independent cursors:
 * "last state submitted to IndexNow" and "last state purged from the edge".
 * Each advances only when its own consumer succeeds, and each consumer can be
 * disabled on its own (`CLOUDFLARE_PURGE=0`, or a missing INDEXNOW_API_KEY).
 * Sharing one file would let either one's failure or absence rewrite the
 * other's retry state: with purging switched off, nothing would ever advance
 * the shared cursor, so IndexNow would resubmit a growing set every deploy.
 *
 * The `_site` hash walk is shared even though the state is not — deploy.js
 * builds one manifest and passes it to both consumers.
 */

const fs = require('fs');
const path = require('path');
const {
  buildContentManifest,
  diffContentManifests,
  loadContentManifest,
  saveContentManifest,
  deployPathToUrl,
} = require('./cloudflare-purge');
const { loadDotenvSilently } = require('./env-utils');

if (fs.existsSync('.env')) {
  loadDotenvSilently();
}

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MANIFEST_REL = path.join('.cache', 'indexnow-content-manifest.json');

function defaultIndexNowManifestPath(cwd = process.cwd()) {
  return path.join(cwd, MANIFEST_REL);
}

/**
 * Pages worth telling a search engine about. Excludes error documents and
 * paginated index pages (`page/N/index.html`), which churn on every publish
 * and are noise, not new content.
 */
function isIndexableHtmlPath(relativePath) {
  const clean = relativePath.replace(/\\/g, '/').replace(/^\.\//, '');
  if (!clean.endsWith('.html')) return false;
  if (clean === '404.html' || clean === '500.html') return false;
  if (/^page\/\d+\/index\.html$/.test(clean)) return false;
  return true;
}

/**
 * Pure selection: which URLs changed since the previous manifest.
 * Returns [] when there is no previous manifest — a missing baseline means
 * "establish one," not "everything is new" (diffing against an empty
 * manifest would otherwise report every current file as added).
 */
function selectIndexNowUrls({ previousManifest, currentManifest, siteDomain }) {
  if (!previousManifest) {
    return [];
  }
  const { added, changed } = diffContentManifests(previousManifest, currentManifest);
  return [...added, ...changed]
    .filter(isIndexableHtmlPath)
    .map((p) => deployPathToUrl(p, siteDomain));
}

/**
 * Pure selection for catch-up submission: every indexable page currently
 * live, regardless of manifest history. Used to clear a backlog once —
 * normal deploys always use selectIndexNowUrls (delta only).
 */
function selectAllIndexNowUrls({ currentManifest, siteDomain }) {
  const files = (currentManifest && currentManifest.files) || {};
  return Object.keys(files)
    .filter(isIndexableHtmlPath)
    .map((p) => deployPathToUrl(p, siteDomain));
}

async function submitToIndexNow({ urls, siteDomain, apiKey }) {
  const keyLocation = `https://${siteDomain}/${apiKey}.txt`;
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: siteDomain,
      key: apiKey,
      keyLocation,
      urlList: urls,
    }),
  });

  if (response.status !== 200 && response.status !== 202) {
    const body = await response.text().catch(() => '');
    throw new Error(`IndexNow API returned ${response.status}: ${body}`);
  }

  return response.status;
}

/**
 * @param {Object} options
 * @param {string} options.siteRoot - path to the built site (e.g. `_site/`)
 * @param {string} options.siteDomain - bare public domain (e.g. `jonplummer.com`)
 * @param {boolean} [options.dryRun] - compute and print the URL list, submit nothing
 * @param {boolean} [options.catchUp] - submit every indexable page currently live,
 *   ignoring manifest history (one-off backlog submission, not a normal deploy path)
 * @param {object} [options.currentManifest] - pre-built manifest of `siteRoot`, so a
 *   caller that already hashed the tree (deploy.js) doesn't pay for a second walk
 * @param {string} [options.manifestPath] - override the state file location (tests)
 */
async function processIndexNow({
  siteRoot,
  siteDomain,
  dryRun = false,
  catchUp = false,
  currentManifest: injectedManifest = null,
  manifestPath: manifestPathOverride = null,
} = {}) {
  const apiKey = process.env.INDEXNOW_API_KEY;
  if (!apiKey) {
    console.log('⚠️  🔍 IndexNow: API key not found (INDEXNOW_API_KEY not set) — skipping');
    return { skipped: true, reason: 'no_api_key' };
  }

  const manifestPath = manifestPathOverride || defaultIndexNowManifestPath();
  const currentManifest = injectedManifest || buildContentManifest(siteRoot);
  const previousManifest = loadContentManifest(manifestPath);
  const isBaselineRun = !catchUp && !previousManifest;

  const urls = catchUp
    ? selectAllIndexNowUrls({ currentManifest, siteDomain })
    : selectIndexNowUrls({ previousManifest, currentManifest, siteDomain });

  if (dryRun) {
    if (catchUp) {
      console.log(`🧪 🔍 IndexNow (catch-up, dry run): would submit ${urls.length} URL${urls.length === 1 ? '' : 's'}`);
    } else if (isBaselineRun) {
      console.log('🧪 🔍 IndexNow: no previous manifest — dry run would establish a baseline and submit nothing');
    } else if (urls.length === 0) {
      console.log('🧪 🔍 IndexNow: dry run — nothing to submit');
    } else {
      console.log(`🧪 🔍 IndexNow: dry run — would submit ${urls.length} URL${urls.length === 1 ? '' : 's'}`);
    }
    urls.forEach((url) => console.log(`   ${url}`));
    return { dryRun: true, urls, baseline: isBaselineRun };
  }

  if (isBaselineRun) {
    saveContentManifest(manifestPath, currentManifest);
    console.log('✅ 🔍 IndexNow: no previous manifest — baseline established, submitted nothing');
    return { baseline: true, submitted: 0 };
  }

  if (urls.length === 0) {
    saveContentManifest(manifestPath, currentManifest);
    console.log('✅ 🔍 IndexNow: nothing to submit');
    return { submitted: 0 };
  }

  const status = await submitToIndexNow({ urls, siteDomain, apiKey });
  saveContentManifest(manifestPath, currentManifest);
  console.log(`✅ 🔍 IndexNow: submitted ${urls.length} URL${urls.length === 1 ? '' : 's'} (HTTP ${status})`);
  if (urls.length <= 5) {
    urls.forEach((url) => console.log(`   ${url}`));
  }
  return { submitted: urls.length, status, urls };
}

// Allow running as a standalone script, e.g. `node scripts/utils/indexnow.js --catch-up`
if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const catchUp = args.includes('--catch-up');
    const siteDomain = process.env.SITE_DOMAIN || 'jonplummer.com';
    const siteRoot = path.join(process.cwd(), '_site');

    if (!fs.existsSync(siteRoot)) {
      console.error(`❌ IndexNow: ${siteRoot} not found — run \`pnpm run build\` first`);
      process.exit(1);
    }

    try {
      await processIndexNow({ siteRoot, siteDomain, dryRun, catchUp });
    } catch (error) {
      console.error(`❌ IndexNow failed: ${error.message}`);
      process.exit(1);
    }
  })();
}

module.exports = {
  processIndexNow,
  selectIndexNowUrls,
  selectAllIndexNowUrls,
  isIndexableHtmlPath,
  defaultIndexNowManifestPath,
};
