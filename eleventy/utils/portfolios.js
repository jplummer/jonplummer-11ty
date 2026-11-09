/**
 * Portfolio lists from src/_data/portfolios.yaml, shared by the build
 * (src/_data/portfolioLists.js) and `pnpm run test portfolios`.
 *
 * Each top-level key is a list, built by src/portfolio-list.njk at /portfolio/<key>/.
 * The `main` list is /portfolio/ itself: src/portfolio.njk renders it with the same
 * include, and keeps the page's title and description in its own front matter
 * because the OG generator reads them there. So `main` takes only `intro` and `pieces`.
 * Other lists are hidden (noindex, out of the sitemap and the 404 suggester) unless
 * `indexed: true`. `status` decides whether a list builds:
 *   draft   – builds only under `pnpm run dev`, never in a production build
 *   live    – builds everywhere
 *   retired – doesn't build; its URL 302s to /portfolio/ (src/.htaccess.njk)
 * Retiring is a one-word edit, so a list's pieces stay on record.
 *
 * Spec: docs/designs/specs/2026-11-08-two-portfolios-design.md
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const matter = require('gray-matter');

const PORTFOLIOS_YAML_PATH = path.join(__dirname, '..', '..', 'src', '_data', 'portfolios.yaml');
const STATUSES = ['draft', 'live', 'retired'];
const FIELDS = ['status', 'indexed', 'title', 'description', 'intro', 'pieces'];
const MAIN_ID = 'main';
const MAIN_FIELDS = ['intro', 'pieces'];
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// /portfolio/all/ is the hidden index of every piece and its lists (src/portfolio-all.njk).
const RESERVED_IDS = ['all'];
const PIECE_URL_PATTERN = /^\/(?:portfolio|sides)\/[a-z0-9-]+\/$/;

function listUrl(id) {
  return id === MAIN_ID ? '/portfolio/' : `/portfolio/${id}/`;
}

/** Raw YAML as an object of lists (empty file → {}). */
function loadPortfolios(filePath = PORTFOLIOS_YAML_PATH) {
  const raw = yaml.load(fs.readFileSync(filePath, 'utf8'));
  return raw || {};
}

/**
 * URLs a list may name: every portfolio piece and side project, read from source
 * so the check runs without a build. Pieces build at /portfolio/<slug>/ from
 * src/portfolio/YYYY-MM-DD-<slug>.md; side projects set their own permalink.
 */
function knownPieceUrls(srcDir = path.join(__dirname, '..', '..', 'src')) {
  const urls = new Map();
  const portfolioDir = path.join(srcDir, 'portfolio');
  for (const f of fs.readdirSync(portfolioDir)) {
    const m = f.match(/^\d{4}-\d{2}-\d{2}-(.+)\.md$/);
    if (m) urls.set(`/portfolio/${m[1]}/`, path.join(portfolioDir, f));
  }
  const sidesDir = path.join(srcDir, 'sides');
  for (const f of fs.readdirSync(sidesDir)) {
    if (!f.endsWith('.md')) continue;
    const { data } = matter(fs.readFileSync(path.join(sidesDir, f), 'utf8'));
    if (data.permalink) urls.set(data.permalink, path.join(sidesDir, f));
  }
  return urls;
}

/**
 * Problems with the lists, as { id, message } (id null for file-level).
 * `known` is the Map from knownPieceUrls().
 */
function validatePortfolios(lists, known) {
  const problems = [];
  const add = (id, message) => problems.push({ id, message });

  if (typeof lists !== 'object' || Array.isArray(lists)) {
    add(null, 'portfolios.yaml must be a mapping of list ids to lists');
    return problems;
  }
  if (!lists[MAIN_ID]) add(null, 'a `main` list is required: it is /portfolio/');
  for (const [id, list] of Object.entries(lists)) {
    if (id === MAIN_ID) {
      if (!list || typeof list !== 'object') {
        add(id, 'must be a mapping');
        continue;
      }
      for (const key of Object.keys(list)) {
        if (!MAIN_FIELDS.includes(key)) {
          add(id, `unexpected field "${key}": main takes only ${MAIN_FIELDS.join(' and ')}; its title and description are in src/portfolio.njk`);
        }
      }
      if (list.intro !== undefined && typeof list.intro !== 'string') add(id, 'intro must be text (markdown)');
      problems.push(...validatePieces(id, list.pieces, known));
      continue;
    }
    if (!ID_PATTERN.test(id)) add(id, 'id must be lowercase letters, digits, and single hyphens');
    if (RESERVED_IDS.includes(id)) add(id, `id "${id}" is reserved for /portfolio/${id}/`);
    if (known.has(listUrl(id))) add(id, `${listUrl(id)} is already a portfolio piece's URL`);
    if (!list || typeof list !== 'object') {
      add(id, 'must be a mapping');
      continue;
    }
    for (const key of Object.keys(list)) {
      if (!FIELDS.includes(key)) add(id, `unexpected field "${key}" (allowed: ${FIELDS.join(', ')})`);
    }
    if (!STATUSES.includes(list.status)) add(id, `status must be one of ${STATUSES.join(', ')}`);
    if (list.indexed !== undefined && typeof list.indexed !== 'boolean') add(id, 'indexed must be true or false');
    if (typeof list.title !== 'string' || list.title.trim().length < 10 || list.title.length > 200) {
      add(id, 'title must be 10–200 characters');
    }
    if (typeof list.description !== 'string' || list.description.trim().length < 20 || list.description.length > 300) {
      add(id, 'description must be 20–300 characters');
    }
    if (list.intro !== undefined && typeof list.intro !== 'string') add(id, 'intro must be text (markdown)');
    problems.push(...validatePieces(id, list.pieces, known));
  }
  return problems;
}

function validatePieces(id, pieces, known) {
  const problems = [];
  const add = (message) => problems.push({ id, message });
  if (!Array.isArray(pieces) || pieces.length === 0) {
    add('pieces must be a non-empty list of URLs');
    return problems;
  }
  const seen = new Set();
  for (const url of pieces) {
    if (typeof url !== 'string' || !PIECE_URL_PATTERN.test(url)) {
      add(`piece "${url}" must look like /portfolio/<slug>/ or /sides/<slug>/`);
    } else if (!known.has(url)) {
      add(`piece ${url} doesn't match any portfolio piece or side project`);
    }
    if (seen.has(url)) add(`piece ${url} is listed twice`);
    seen.add(url);
  }
  return problems;
}

/** Lists other than main to build this run, as page data for src/portfolio-list.njk. */
function portfolioPages(lists, runMode = process.env.ELEVENTY_RUN_MODE) {
  return Object.entries(lists)
    .filter(([id]) => id !== MAIN_ID)
    .filter(([, list]) => list.status === 'live' || (list.status === 'draft' && runMode !== 'build'))
    .map(([id, list]) => ({
      id,
      url: listUrl(id),
      status: list.status,
      indexed: list.indexed === true,
      title: list.title,
      description: list.description,
      intro: list.intro || '',
      pieces: list.pieces,
    }));
}

/** The main list, rendered at /portfolio/ by src/portfolio.njk. */
function mainList(lists) {
  const main = lists[MAIN_ID] || { pieces: [] };
  return { id: MAIN_ID, url: listUrl(MAIN_ID), intro: main.intro || '', pieces: main.pieces || [] };
}

/** Retired lists, whose URLs redirect to /portfolio/. */
function retiredUrls(lists) {
  return Object.entries(lists)
    .filter(([, list]) => list.status === 'retired')
    .map(([id]) => listUrl(id));
}

module.exports = {
  PORTFOLIOS_YAML_PATH,
  STATUSES,
  RESERVED_IDS,
  MAIN_ID,
  listUrl,
  loadPortfolios,
  knownPieceUrls,
  validatePortfolios,
  portfolioPages,
  mainList,
  retiredUrls,
};
