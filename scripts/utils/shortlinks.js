#!/usr/bin/env node

/**
 * Permanent short-link helpers: load/validate YAML, bidirectional lookup,
 * Apache RewriteRule lines, and Cloudflare purge URL variants.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SHORTLINKS_PATH = path.join(process.cwd(), 'src', '_data', 'shortlinks.yaml');
const SITE_HOME = 'https://jonplummer.com/';

/** Allowed slug alphabet: A–Z and 2–9, minus O and I (and implicitly 0/1). */
const SLUG_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SLUG_CHAR_CLASS = '[A-HJ-NP-Z2-9]';
/** Current product rule: exactly two characters. Schema may grow to three later. */
const SLUG_LENGTH = 2;
const SLUG_PATTERN = new RegExp(`^${SLUG_CHAR_CLASS}{${SLUG_LENGTH}}$`);

const ALLOWED_FIELDS = new Set(['slug', 'to', 'note', 'created', 'retired']);

function normalizeHomeUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return null;
    const host = u.hostname.toLowerCase();
    if (host !== 'jonplummer.com' && host !== 'www.jonplummer.com') return null;
    const p = u.pathname.replace(/\/+$/, '') || '/';
    if (p !== '/' || u.search || u.hash) return null;
    return SITE_HOME;
  } catch {
    return null;
  }
}

function isAbsoluteHttps(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

function loadShortlinksFile(filePath = SHORTLINKS_PATH) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`shortlinks file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = yaml.load(raw);
  if (!data || typeof data !== 'object' || !Array.isArray(data.shortlinks)) {
    throw new Error('shortlinks.yaml must have a top-level shortlinks: array');
  }
  return data.shortlinks;
}

/**
 * @param {object[]} entries
 * @param {{ permalinkPaths?: string[] }} [options] permalinkPaths like "/ab/" or "/AB"
 * @returns {{ issues: string[], warnings: string[] }}
 */
function validateShortlinks(entries, options = {}) {
  const issues = [];
  const warnings = [];
  const seenSlugs = new Map();
  const destCounts = new Map();
  const permalinkPaths = options.permalinkPaths || [];

  if (!Array.isArray(entries)) {
    return { issues: ['shortlinks must be an array'], warnings };
  }

  entries.forEach((entry, index) => {
    const label = `shortlinks[${index}]`;
    if (!entry || typeof entry !== 'object') {
      issues.push(`${label}: must be an object`);
      return;
    }

    const unexpected = Object.keys(entry).filter((k) => !ALLOWED_FIELDS.has(k));
    if (unexpected.length) {
      issues.push(`${label}: unexpected field(s): ${unexpected.join(', ')}`);
    }

    const slug = entry.slug;
    if (!slug || typeof slug !== 'string') {
      issues.push(`${label}: missing slug`);
    } else if (!SLUG_PATTERN.test(slug)) {
      issues.push(
        `${label}: bad slug "${slug}" — need exactly ${SLUG_LENGTH} chars from ${SLUG_CHARSET}`
      );
    } else if (seenSlugs.has(slug)) {
      issues.push(`${label}: duplicate slug "${slug}" (also at shortlinks[${seenSlugs.get(slug)}])`);
    } else {
      seenSlugs.set(slug, index);
    }

    const to = entry.to;
    if (!to || typeof to !== 'string') {
      issues.push(`${label}: missing to`);
    } else if (!isAbsoluteHttps(to)) {
      issues.push(`${label}: to must be an absolute https URL (got "${to}")`);
    } else if (!/^[\x21-\x7E]+$/.test(to)) {
      // A raw space ends the Apache rule early, and Apache can't carry raw non-ASCII.
      issues.push(
        `${label}: to must be percent-encoded, with no spaces or non-ASCII characters (got "${to}"); ` +
          `\`pnpm run shortlink add\` encodes it for you, as "${new URL(to).href}"`
      );
    } else {
      const key = to.replace(/\/$/, '') || to;
      destCounts.set(key, (destCounts.get(key) || []).concat(slug || label));
    }

    if (entry.note !== undefined && typeof entry.note !== 'string') {
      issues.push(`${label}: note must be a string`);
    }

    if (entry.created !== undefined) {
      let createdStr = entry.created;
      if (createdStr instanceof Date && !Number.isNaN(createdStr.getTime())) {
        createdStr = createdStr.toISOString().slice(0, 10);
      }
      if (typeof createdStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(createdStr)) {
        issues.push(`${label}: created must be YYYY-MM-DD`);
      }
    }

    if (entry.retired !== undefined && typeof entry.retired !== 'boolean') {
      issues.push(`${label}: retired must be a boolean`);
    }

    if (entry.retired === true) {
      if (!to || !normalizeHomeUrl(to)) {
        issues.push(`${label}: retired slug must point to ${SITE_HOME}`);
      }
    }
  });

  for (const [dest, slugs] of destCounts) {
    if (slugs.length > 1) {
      warnings.push(`multiple slugs point to ${dest}: ${slugs.join(', ')}`);
    }
  }

  for (const p of permalinkPaths) {
    const m = String(p).match(/^\/([A-Za-z0-9]{2})\/?$/);
    if (!m) continue;
    const upper = m[1].toUpperCase();
    if (SLUG_PATTERN.test(upper)) {
      issues.push(
        `site path "${p}" collides with the two-character shortlink namespace (reserved for /${upper})`
      );
    }
  }

  return { issues, warnings };
}

function lookupBySlug(entries, slug) {
  if (!slug || typeof slug !== 'string') return null;
  const needle = slug.toUpperCase();
  return entries.find((e) => e.slug === needle) || null;
}

/**
 * What makes two destinations the same: the whole address, except one trailing
 * slash on the path. The query string and the fragment count, so two videos on
 * one site, or a page and a section of it, are different destinations.
 */
function destinationKey(url) {
  const u = new URL(url);
  if (u.protocol !== 'https:') return null;
  return `${u.origin}${u.pathname.replace(/\/$/, '')}${u.search}${u.hash}`;
}

function lookupByDestination(entries, url) {
  if (!url || typeof url !== 'string') return [];
  let normalized;
  try {
    normalized = destinationKey(url);
  } catch {
    return [];
  }
  if (normalized === null) return [];
  return entries.filter((e) => {
    try {
      return destinationKey(e.to) === normalized;
    } catch {
      return false;
    }
  });
}

/** Characters Apache passes through a redirect untouched (mod_rewrite's safe set). */
const APACHE_SAFE = /^[A-Za-z0-9$\-_.+!*'(),:;@&=/~]*$/;

/**
 * The Apache RewriteRule for one short link: exact slug, optional trailing
 * slash, 302, any case. Used by src/.htaccess.njk (the shortlinkRewriteRule
 * filter) and by the checks, so there is one definition.
 *
 * In a rule's target, `%1` and `$1` are back-references, so `%`, `$`, and `\`
 * are backslash-escaped. Apache also re-encodes a redirect's target (`#` to
 * `%23`, `%` to `%25`) unless the rule carries NE. A destination made only of
 * characters Apache leaves alone keeps the plain rule, so the links already
 * printed on cards have the rules they always had. Proved against a real
 * Apache in scripts/test/shortlink-command.js.
 */
function rewriteRuleFor(entry) {
  const { slug, to } = entry;
  const target = String(to).replace(/[\\%$]/g, '\\$&');
  const flags = target === to && APACHE_SAFE.test(to) ? 'R=302,NC,L' : 'R=302,NC,NE,L';
  return `RewriteRule ^${slug}/?$ ${target} [${flags}]`;
}

/** Apache RewriteRule lines for .htaccess, one per short link. */
function htaccessRewriteLines(entries) {
  return entries.map(rewriteRuleFor);
}

/**
 * Cloudflare purge is exact-URL. Cover case and trailing-slash variants.
 * @param {string} siteDomain
 * @param {object[]} [entries]
 */
function shortlinkPurgeUrls(siteDomain, entries) {
  const list = entries || loadShortlinksFile();
  const base = `https://${String(siteDomain).replace(/\/$/, '')}`;
  const urls = [];
  for (const e of list) {
    if (!e.slug || !SLUG_PATTERN.test(e.slug)) continue;
    const upper = e.slug;
    const lower = e.slug.toLowerCase();
    for (const s of [upper, lower]) {
      urls.push(`${base}/${s}`);
      urls.push(`${base}/${s}/`);
    }
  }
  return [...new Set(urls)];
}

function pickUnusedSlug(entries, preferred) {
  if (preferred) {
    const upper = preferred.toUpperCase();
    if (!SLUG_PATTERN.test(upper)) {
      throw new Error(`bad slug "${preferred}" — need exactly ${SLUG_LENGTH} chars from ${SLUG_CHARSET}`);
    }
    if (lookupBySlug(entries, upper)) {
      throw new Error(`slug ${upper} is already taken`);
    }
    return upper;
  }
  for (let i = 0; i < SLUG_CHARSET.length; i++) {
    for (let j = 0; j < SLUG_CHARSET.length; j++) {
      const candidate = SLUG_CHARSET[i] + SLUG_CHARSET[j];
      if (!lookupBySlug(entries, candidate)) return candidate;
    }
  }
  throw new Error('no unused two-character slugs left');
}

function qrPayloadForSlug(slug, siteDomain = 'jonplummer.com') {
  const upper = String(slug).toUpperCase();
  if (!SLUG_PATTERN.test(upper)) {
    throw new Error(`bad slug for QR: ${slug}`);
  }
  return `HTTPS://${String(siteDomain).toUpperCase()}/${upper}`;
}

/**
 * Add one entry to the end of the file, leaving every existing line as it is:
 * comments, order, and quoting. Rewriting the file through a YAML dump lost
 * the comment above the JP canary. The new text is read back before it is
 * written, and nothing is written unless it gives the old entries plus this one.
 */
function appendShortlink(entry, filePath = SHORTLINKS_PATH) {
  const before = fs.readFileSync(filePath, 'utf8');
  const block = yaml
    .dump([entry], { lineWidth: 100, noRefs: true, quotingType: '"' })
    .replace(/^/gm, '  ')
    .trimEnd();
  const after = `${before.replace(/\n*$/, '\n')}${block}\n`;

  const expected = yaml.load(before).shortlinks.concat(entry);
  const readBack = yaml.load(after);
  if (JSON.stringify(readBack && readBack.shortlinks) !== JSON.stringify(expected)) {
    throw new Error(`could not add ${entry.slug} to ${filePath} without changing other entries; nothing was written`);
  }
  fs.writeFileSync(filePath, after, 'utf8');
}

module.exports = {
  SHORTLINKS_PATH,
  SITE_HOME,
  SLUG_CHARSET,
  SLUG_LENGTH,
  SLUG_PATTERN,
  SLUG_CHAR_CLASS,
  loadShortlinksFile,
  validateShortlinks,
  lookupBySlug,
  lookupByDestination,
  htaccessRewriteLines,
  rewriteRuleFor,
  shortlinkPurgeUrls,
  pickUnusedSlug,
  qrPayloadForSlug,
  normalizeHomeUrl,
  isAbsoluteHttps,
  appendShortlink,
};
