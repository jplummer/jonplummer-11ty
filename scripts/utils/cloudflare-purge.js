#!/usr/bin/env node

/**
 * Purge changed deploy paths from Cloudflare edge cache.
 * Parses rsync --itemize-changes output and calls the zone purge_cache API.
 */

const CF_API = 'https://api.cloudflare.com/client/v4';
const PURGE_BATCH_SIZE = 30;

/**
 * @param {string} output rsync stdout/stderr with --itemize-changes
 * @returns {string[]} site-relative paths (e.g. assets/css/jonplummer.css)
 */
function parseRsyncItemizedChanges(output) {
  const paths = new Set();

  for (const line of output.split('\n')) {
    const trimmed = line.trimEnd();
    if (!trimmed) continue;

    if (trimmed.startsWith('*deleting')) {
      const path = trimmed.slice('*deleting'.length).trim();
      if (path) paths.add(path);
      continue;
    }

    const spaceIdx = trimmed.indexOf(' ');
    if (spaceIdx <= 0) continue;

    const prefix = trimmed.slice(0, spaceIdx);
    const path = trimmed.slice(spaceIdx + 1).trim();
    if (!path || path === './') continue;

    const op = prefix[0];
    const type = prefix[1];
    if (type !== 'f') continue;
    if (op === '>' || op === '<') paths.add(path);
  }

  return [...paths];
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
 * @param {string} rsyncOutput
 * @param {string} siteDomain
 * @param {{ dryRun?: boolean, zoneId?: string, apiToken?: string }} [options]
 */
async function purgeChangedDeployFiles(rsyncOutput, siteDomain, options = {}) {
  const paths = parseRsyncItemizedChanges(rsyncOutput);
  const urls = paths.map((p) => deployPathToUrl(p, siteDomain));

  if (paths.length === 0) {
    return { skipped: true, reason: 'no-changes', paths, urls, purged: 0, batches: 0 };
  }

  if (options.dryRun) {
    return { dryRun: true, paths, urls, purged: 0, batches: 0 };
  }

  const zoneId = options.zoneId || process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = options.apiToken || process.env.CLOUDFLARE_API_TOKEN;

  if (!zoneId || !apiToken) {
    return { skipped: true, reason: 'not-configured', paths, urls, purged: 0, batches: 0 };
  }

  const result = await purgeCloudflareUrls(urls, { zoneId, apiToken });
  return { ...result, paths, urls };
}

module.exports = {
  parseRsyncItemizedChanges,
  deployPathToUrl,
  purgeCloudflareUrls,
  isCloudflarePurgeConfigured,
  purgeChangedDeployFiles,
};
