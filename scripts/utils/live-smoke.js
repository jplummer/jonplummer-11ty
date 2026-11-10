/**
 * Live smoke checks: what `pnpm run smoke` asks the live site, and how each
 * answer is judged. No I/O here; scripts/deploy/smoke-live.js reads the data,
 * does the fetching, and prints. Unit test: scripts/test/live-smoke.js.
 *
 * A check is { group, path, expect }, where expect may hold:
 *   status       exact HTTP status
 *   notStatus    any status but this one
 *   location     Location header, compared with sameLocation()
 *   contentType  Content-Type must start with this
 *   includes     strings the body must contain (case-insensitive)
 *   headers      { name: value }; the response header must contain the value
 */

// Security headers set in src/.htaccess.njk. Checked on the 404, which no cache
// has seen, so they come from Apache on this request.
const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'SAMEORIGIN',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'strict-transport-security': 'max-age=31536000',
  'content-security-policy': "default-src 'self'",
};

const BLOCKED_PATHS = ['/.htaccess', '/.env', '/package.json', '/assets/css/'];

const XML_FILES = ['/sitemap.xml', '/feed.xml', '/links-feed.xml', '/wisdom-feed.xml'];
const FIXED_ROOT_FILES = ['/favicon.ico', '/robots.txt', ...XML_FILES];

const ASSETS = [
  { path: '/assets/css/jonplummer.css', contentType: 'text/css' },
  { path: '/assets/js/figure-lightbox.js' },
  { path: '/assets/fonts/lab/libre-franklin-latin-wght-normal.woff2' },
  { path: '/assets/images/og/v2/index.png', contentType: 'image/png' },
];

const FIXED_PAGES = [
  '/', '/about/', '/portfolio/', '/sides/', '/wisdom/', '/color/', '/type/',
  '/ogimages/', '/changelog/', '/portfolio/all/',
];

// One page per template that builds many URLs; the last sitemap match is used.
const PAGE_PATTERNS = [
  /^\/\d{4}\/\d{2}\/\d{2}\//,
  /^\/portfolio\/[^/]+\/$/,
  /^\/sides\/[^/]+\/$/,
  /^\/wisdom\/tags\//,
  /^\/page\/\d+\/$/,
];

const PAGE_BODY = ['<main id="main"', '</html>'];

function pathOf(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function withoutTrailingSlash(pathname) {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

/** True when two Location values name the same URL, ignoring one trailing slash on the path. */
function sameLocation(actual, expected, baseUrl) {
  if (!actual) return false;
  try {
    const a = new URL(actual, baseUrl);
    const e = new URL(expected, baseUrl);
    return a.origin === e.origin
      && withoutTrailingSlash(a.pathname) === withoutTrailingSlash(e.pathname)
      && a.search === e.search;
  } catch {
    return false;
  }
}

function buildSmokeChecks({ redirects = [], shortlinks = [], retiredListUrls = [], sitemapUrls = [], rootFiles = [], nonce }) {
  const checks = [];
  const add = (group, path, expect) => checks.push({ group, path, expect });

  add('error-page', `/smoke-${nonce}/`, {
    status: 404,
    includes: ['/assets/css/jonplummer.css', 'page not found'],
    headers: SECURITY_HEADERS,
  });

  for (const { from, to } of redirects) {
    add('redirects', from, { status: 301, location: to });
  }

  for (const url of retiredListUrls) {
    add('retired-lists', url, { status: 302, location: '/portfolio/' });
    add('retired-lists', withoutTrailingSlash(url), { status: 302, location: '/portfolio/' });
  }

  // The canary, upper and lower case. Deploy already checks every short link.
  const canary = shortlinks.find((s) => s.slug === 'JP') || shortlinks[0];
  if (canary) {
    add('shortlinks', `/${canary.slug}`, { status: 302, location: canary.to });
    add('shortlinks', `/${canary.slug.toLowerCase()}`, { status: 302, location: canary.to });
  }

  add('wisdom-rewrite', `/wisdom/tags/smoke-${nonce}/`, { status: 301, location: '/wisdom/' });

  for (const path of BLOCKED_PATHS) {
    add('blocked', path, { notStatus: 200 });
  }

  for (const path of [...rootFiles.map((name) => `/${name}`), ...FIXED_ROOT_FILES]) {
    add('root-files', path, XML_FILES.includes(path) ? { status: 200, includes: ['<?xml'] } : { status: 200 });
  }

  for (const { path, contentType } of ASSETS) {
    add('assets', path, contentType ? { status: 200, contentType } : { status: 200 });
  }

  const sitemapPaths = sitemapUrls.map(pathOf);
  const sampled = PAGE_PATTERNS
    .map((pattern) => sitemapPaths.filter((p) => pattern.test(p)).pop())
    .filter(Boolean);
  for (const path of new Set([...FIXED_PAGES, ...sampled])) {
    add('pages', path, { status: 200, includes: PAGE_BODY });
  }

  return checks;
}

/** Failure messages for one response; an empty array means the check passed. */
function evaluateResponse(check, { status, headers = {}, body = '' }, baseUrl) {
  const { expect } = check;
  const failures = [];

  if (expect.status !== undefined && status !== expect.status) {
    failures.push(`expected status ${expect.status}, got ${status}`);
  }
  if (expect.notStatus !== undefined && status === expect.notStatus) {
    failures.push(`expected any status but ${expect.notStatus}, got ${status}`);
  }
  if (expect.location !== undefined && !sameLocation(headers.location, expect.location, baseUrl)) {
    failures.push(`expected Location ${expect.location}, got ${headers.location || '(none)'}`);
  }
  if (expect.contentType !== undefined && !(headers['content-type'] || '').toLowerCase().startsWith(expect.contentType)) {
    failures.push(`expected Content-Type ${expect.contentType}, got ${headers['content-type'] || '(none)'}`);
  }
  for (const [name, value] of Object.entries(expect.headers || {})) {
    const actual = headers[name.toLowerCase()] || '';
    if (!actual.toLowerCase().includes(value.toLowerCase())) {
      failures.push(`expected header ${name} to contain "${value}", got ${actual ? `"${actual}"` : '(none)'}`);
    }
  }
  const lowerBody = body.toLowerCase();
  for (const needle of expect.includes || []) {
    if (!lowerBody.includes(needle.toLowerCase())) {
      failures.push(`expected body to include "${needle}"`);
    }
  }

  return failures;
}

module.exports = { buildSmokeChecks, evaluateResponse, sameLocation };
