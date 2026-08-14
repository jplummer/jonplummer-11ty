#!/usr/bin/env node

/**
 * Purge changed deploy paths from Cloudflare edge cache.
 * Source of truth is a local SHA-256 content-hash manifest of `_site`
 * (see `buildContentManifest` / `diffContentManifests`), diffed against the
 * previous deploy's manifest and mapped to public URLs.
 */

const CF_API = 'https://api.cloudflare.com/client/v4';
const PURGE_BATCH_SIZE = 30;

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DEFAULT_MANIFEST_REL = path.join('.cache', 'deploy-content-manifest.json');

function defaultManifestPath(cwd = process.cwd()) {
  return path.join(cwd, DEFAULT_MANIFEST_REL);
}

function hashFile(absPath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(absPath));
  return hash.digest('hex');
}

function walkFiles(dir, root, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(abs, root, out);
    else if (ent.isFile()) {
      const rel = path.relative(root, abs).replace(/\\/g, '/');
      out[rel] = hashFile(abs);
    }
  }
}

function buildContentManifest(siteRoot) {
  const files = {};
  walkFiles(siteRoot, siteRoot, files);
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    files,
  };
}

function loadContentManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) return null;

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }

  if (!parsed || parsed.version !== 1) return null;

  const { files } = parsed;
  const isPlainObject = typeof files === 'object' && files !== null && !Array.isArray(files);
  if (!isPlainObject || Object.keys(files).length === 0) return null;

  return parsed;
}

function saveContentManifest(manifestPath, manifest) {
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function diffContentManifests(previous, current) {
  const prev = (previous && previous.files) || {};
  const curr = (current && current.files) || {};
  const changed = [];
  const added = [];
  const deleted = [];
  for (const p of Object.keys(curr)) {
    if (!(p in prev)) added.push(p);
    else if (prev[p] !== curr[p]) changed.push(p);
  }
  for (const p of Object.keys(prev)) {
    if (!(p in curr)) deleted.push(p);
  }
  return { changed, added, deleted };
}

function shouldPurgeDeployPath(relativePath) {
  const clean = relativePath.replace(/\\/g, '/').replace(/^\.\//, '');
  if (clean === '.htaccess' || clean.endsWith('/.htaccess')) return false;
  return true;
}

function pathsToPurgeUrls(paths, siteDomain) {
  return paths.filter(shouldPurgeDeployPath).map((p) => deployPathToUrl(p, siteDomain));
}

/**
 * Map _site-relative deploy path to public URL.
 * @param {string} relativePath
 * @param {string} siteDomain
 * @returns {string}
 */
function deployPathToUrl(relativePath, siteDomain) {
  const clean = relativePath.replace(/\\/g, '/').replace(/^\.\//, '');
  const base = `https://${siteDomain.replace(/\/$/, '')}`;

  if (clean === 'index.html') {
    return `${base}/`;
  }
  if (clean.endsWith('/index.html')) {
    const dir = clean.slice(0, -'index.html'.length);
    return `${base}/${dir}`;
  }
  return `${base}/${clean}`;
}

/**
 * @param {string[]} urls absolute https URLs
 * @param {{ zoneId: string, apiToken: string }} credentials
 */
async function purgeCloudflareUrls(urls, { zoneId, apiToken }) {
  const unique = [...new Set(urls)];
  if (unique.length === 0) {
    return { purged: 0, batches: 0 };
  }

  let purged = 0;
  let batches = 0;

  for (let i = 0; i < unique.length; i += PURGE_BATCH_SIZE) {
    const batch = unique.slice(i, i + PURGE_BATCH_SIZE);
    const response = await fetch(`${CF_API}/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files: batch }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      const msg = data.errors?.map((e) => e.message).join('; ') || response.statusText;
      throw new Error(msg);
    }

    purged += batch.length;
    batches += 1;
  }

  return { purged, batches };
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 */
function isCloudflarePurgeConfigured(env = process.env) {
  const disabled = env.CLOUDFLARE_PURGE === '0' || env.CLOUDFLARE_PURGE === 'false';
  return Boolean(!disabled && env.CLOUDFLARE_ZONE_ID && env.CLOUDFLARE_API_TOKEN);
}

/**
 * Decide which _site-relative paths need purging given the previous and
 * current content manifests.
 * @param {object|null} previous previous manifest (or null when no baseline)
 * @param {object} current current manifest (from buildContentManifest)
 * @param {{ forceContent?: boolean }} [options]
 * @returns {{ mode: 'no-baseline' | 'force' | 'diff', paths: string[] }}
 */
function collectPurgePaths(previous, current, options = {}) {
  const forceContent = Boolean(options.forceContent);
  const currentFiles = (current && current.files) || {};

  if (!previous) {
    if (forceContent) {
      return { mode: 'force', paths: Object.keys(currentFiles) };
    }
    return { mode: 'no-baseline', paths: [] };
  }

  if (forceContent) {
    const { deleted } = diffContentManifests(previous, current);
    const paths = new Set([...Object.keys(currentFiles), ...deleted]);
    return { mode: 'force', paths: [...paths] };
  }

  const { changed, deleted } = diffContentManifests(previous, current);
  // Skip `added`: nothing was ever cached under a brand-new URL (Eleventy
  // content-addressed img/, new posts, etc.). Still purge `changed` (same
  // path, new bytes — e.g. regenerated OG PNGs) and `deleted` (stale edge).
  const paths = new Set([...changed, ...deleted]);
  return { mode: 'diff', paths: [...paths] };
}

/**
 * Purge Cloudflare for _site paths whose local content hash changed since
 * the last deploy. Source of truth is the local content manifest, not rsync
 * itemize output.
 * @param {string} siteRoot absolute path to built _site directory
 * @param {string} siteDomain public site domain (e.g. jonplummer.com)
 * @param {{ dryRun?: boolean, zoneId?: string, apiToken?: string, manifestPath?: string, env?: NodeJS.ProcessEnv, forceContent?: boolean, currentManifest?: object }} [options]
 *   `currentManifest` lets a caller that already hashed `_site` (deploy.js
 *   builds one snapshot and shares it with IndexNow) skip a second walk.
 */
async function purgeChangedDeployContent(siteRoot, siteDomain, options = {}) {
  const env = options.env || process.env;
  const manifestPath = options.manifestPath || defaultManifestPath();
  const dryRun = Boolean(options.dryRun);
  const forceContent =
    Boolean(options.forceContent) ||
    env.CLOUDFLARE_PURGE_FORCE_CONTENT === '1' ||
    env.CLOUDFLARE_PURGE_FORCE_CONTENT === 'true';

  const currentManifest = options.currentManifest || buildContentManifest(siteRoot);
  const previous = loadContentManifest(manifestPath);

  if (!dryRun && !isCloudflarePurgeConfigured(env)) {
    return {
      skipped: true,
      reason: 'not-configured',
      paths: [],
      urls: [],
      purged: 0,
      batches: 0,
      writeManifest: false,
      currentManifest,
    };
  }

  const { mode, paths } = collectPurgePaths(previous, currentManifest, { forceContent });
  const urls = pathsToPurgeUrls(paths, siteDomain);

  if (mode === 'no-baseline') {
    return {
      skipped: true,
      reason: 'no-baseline',
      paths: [],
      urls: [],
      purged: 0,
      batches: 0,
      writeManifest: !dryRun,
      currentManifest,
    };
  }

  if (urls.length === 0) {
    return {
      skipped: true,
      reason: 'no-changes',
      paths: [],
      urls: [],
      purged: 0,
      batches: 0,
      writeManifest: !dryRun,
      currentManifest,
    };
  }

  if (dryRun) {
    return { dryRun: true, paths, urls, purged: 0, batches: 0, writeManifest: false, currentManifest };
  }

  const zoneId = options.zoneId || env.CLOUDFLARE_ZONE_ID;
  const apiToken = options.apiToken || env.CLOUDFLARE_API_TOKEN;
  const result = await purgeCloudflareUrls(urls, { zoneId, apiToken });
  return { ...result, paths, urls, writeManifest: true, currentManifest };
}

module.exports = {
  deployPathToUrl,
  purgeCloudflareUrls,
  isCloudflarePurgeConfigured,
  defaultManifestPath,
  MANIFEST_PATH: DEFAULT_MANIFEST_REL,
  hashFile,
  buildContentManifest,
  loadContentManifest,
  saveContentManifest,
  diffContentManifests,
  shouldPurgeDeployPath,
  pathsToPurgeUrls,
  collectPurgePaths,
  purgeChangedDeployContent,
};
