#!/usr/bin/env node

/**
 * Validate src/_data/portfolios.yaml: list ids, status, fields, and that every
 * piece URL names a real portfolio piece or side project. Reads source only, so
 * it also checks draft lists a production build never renders.
 *
 * Warns without failing about portfolio pieces that are in no list (main, draft,
 * or live), so leaving one out of every portfolio is a visible choice.
 */

const path = require('path');
const assert = require('assert');
const {
  PORTFOLIOS_YAML_PATH,
  loadPortfolios,
  knownPieceUrls,
  validatePortfolios,
  portfolioPages,
  mainList,
  retiredUrls,
} = require('../../eleventy/utils/portfolios');

// Fixture checks on the rules themselves, so a loosened validator fails here
// rather than letting a bad list reach the build.
function assertRules() {
  const known = new Map([['/portfolio/a-piece/', 'x'], ['/sides/a-side/', 'y']]);
  const ok = { status: 'live', title: 'A list for testing', description: 'Twenty characters or more here.', pieces: ['/portfolio/a-piece/', '/sides/a-side/'] };
  const main = { pieces: ['/portfolio/a-piece/'] };
  // Every fixture carries a main list unless it's testing main itself.
  const problems = (lists) => validatePortfolios({ main, ...lists }, known).map((p) => p.message).join(' | ');

  assert.strictEqual(problems({ good: ok }), '');
  assert.match(problems({ 'a-piece': ok }), /already a portfolio piece/);
  assert.match(problems({ all: ok }), /reserved/);
  assert.match(problems({ Bad_Id: ok }), /lowercase/);
  assert.match(problems({ good: { ...ok, status: 'off' } }), /status must be/);
  assert.match(problems({ good: { ...ok, pieces: ['/portfolio/nope/'] } }), /doesn't match/);
  assert.match(problems({ good: { ...ok, pieces: ['/portfolio/a-piece/', '/portfolio/a-piece/'] } }), /listed twice/);
  assert.match(problems({ good: { ...ok, color: 'red' } }), /unexpected field/);
  assert.match(problems({ main: { ...main, title: 'Main titles live in portfolio.njk' } }), /main takes only/);
  assert.match(problems({ main: { pieces: ['/portfolio/nope/'] } }), /doesn't match/);
  assert.match(validatePortfolios({ good: ok }, known).map((p) => p.message).join(' | '), /`main` list is required/);

  const lists = { main, d: { ...ok, status: 'draft' }, l: ok, r: { ...ok, status: 'retired' } };
  assert.deepStrictEqual(portfolioPages(lists, 'build').map((p) => p.id), ['l'], 'main builds from src/portfolio.njk, not the list template');
  assert.deepStrictEqual(portfolioPages(lists, 'serve').map((p) => p.id), ['d', 'l']);
  assert.strictEqual(portfolioPages(lists, 'build')[0].indexed, false, 'lists are hidden unless indexed: true');
  assert.deepStrictEqual(retiredUrls(lists), ['/portfolio/r/']);
  assert.strictEqual(mainList(lists).url, '/portfolio/');
}
const { addFile, addIssue, addWarning } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

runTest({
  testType: 'portfolios',
  testName: 'Portfolio lists',
  validateFn: async (result) => {
    const fileObj = addFile(result, path.relative(process.cwd(), PORTFOLIOS_YAML_PATH));

    try {
      assertRules();
    } catch (error) {
      addIssue(fileObj, { severity: 'error', type: 'portfolios-rules', message: `Validator fixture failed: ${error.message}` });
    }

    let lists;
    try {
      lists = loadPortfolios();
    } catch (error) {
      addIssue(fileObj, { severity: 'error', type: 'portfolios-load', message: error.message });
      return;
    }

    const known = knownPieceUrls();
    for (const { id, message } of validatePortfolios(lists, known)) {
      addIssue(fileObj, {
        severity: 'error',
        type: 'portfolios-invalid',
        message: id ? `${id}: ${message}` : message,
      });
    }

    const inSomeList = new Set(
      Object.values(lists)
        .filter((list) => list && list.status !== 'retired' && Array.isArray(list.pieces))
        .flatMap((list) => list.pieces)
    );
    const unlisted = [...known.keys()].filter((url) => url.startsWith('/portfolio/') && !inSomeList.has(url));
    if (unlisted.length) {
      addWarning(fileObj, {
        type: 'portfolios-unlisted',
        message: `${unlisted.length} portfolio pieces are in no draft or live list`,
      });
    }
  },
});
