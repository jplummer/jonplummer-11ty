#!/usr/bin/env node

/*
 * Unit checks for src/assets/js/404-suggest.js, the matcher behind the /404
 * "did you mean" list. Requires the browser file directly - the same bytes the
 * page gets - so there is no second copy of the logic to drift.
 *
 * The site sees very few 404s, so there is no corpus of real misses to test
 * against. These cases are real site URLs put through the mutations the feature
 * targets: truncation, a dropped character, a transposition, and a missing
 * trailing slash. The last case asserts a refusal: a path unrelated to anything
 * on the site must return nothing rather than the least-bad guess.
 */

const assert = require('assert');
const {
  normalizePath,
  diceCoefficient,
  editSimilarity,
  rankCandidates,
} = require('../../src/assets/js/404-suggest.js');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

/* Real URLs and titles from the site, trimmed to a size a person can read. */
const INDEX = [
  ['/', 'Home'],
  ['/about/', '/about'],
  ['/now/', '/now'],
  ['/colophon/', '/colophon'],
  ['/portfolio/', 'Portfolio – UX design and leadership work and projects'],
  ['/wisdom/', 'Collected wisdom'],
  ['/wisdom/tags/clarity/', 'Collected wisdom – #clarity'],
  ['/sides/monotasker/', 'Monotasker'],
  ['/2026/08/12/care-has-to-show-up-in-the-product/', 'Care has to show up in the product'],
  ['/2026/08/20/not-every-touchpoint-deserves-the-best/', 'Not every touchpoint deserves the best'],
  ['/2026/08/27/prototyping-in-a-regulated-environment/', 'Prototyping in a regulated environment'],
  ['/2020/11/26/reviews/', 'Rethinking annual performance reviews'],
];

const CARE = '/2026/08/12/care-has-to-show-up-in-the-product/';
const PROTO = '/2026/08/27/prototyping-in-a-regulated-environment/';

function check(file, name, fn) {
  try {
    fn();
  } catch (err) {
    addIssue(file, {
      type: 'suggest-unit',
      message: `${name}: ${err.message}`,
      ruleId: 'suggest-unit',
    });
  }
}

function topUrl(pathname, options) {
  const hits = rankCandidates(pathname, INDEX, options);
  return hits.length ? hits[0].url : null;
}

function runUnitAssertions(result) {
  const file = addFile(result, 'src/assets/js/404-suggest.js', '404-suggest.js');

  check(file, 'normalize ignores a trailing slash', () => {
    assert.strictEqual(normalizePath('/colophon'), normalizePath('/colophon/'));
  });

  check(file, 'normalize ignores case and .html', () => {
    assert.strictEqual(normalizePath('/About.HTML'), 'about');
  });

  check(file, 'dice is 1 for identical and 0 for disjoint', () => {
    assert.strictEqual(diceCoefficient('abcdef', 'abcdef'), 1);
    assert.strictEqual(diceCoefficient('abcdef', ''), 0);
  });

  check(file, 'truncated post URL finds the post', () => {
    assert.strictEqual(topUrl('/2026/08/12/care-has-to'), CARE);
  });

  check(file, 'truncated at a date still finds that day', () => {
    assert.strictEqual(topUrl('/2026/08/12/'), CARE);
  });

  check(file, 'a dropped character still finds the post', () => {
    assert.strictEqual(topUrl('/2026/08/27/prototyping-in-a-regulated-environmnt/'), PROTO);
  });

  check(file, 'two transposed characters still find the post', () => {
    assert.strictEqual(topUrl('/2026/08/27/prototypnig-in-a-regulated-environment/'), PROTO);
  });

  check(file, 'a missing trailing slash finds the page', () => {
    assert.strictEqual(topUrl('/colophon'), '/colophon/');
  });

  /* Short paths are what people mistype by hand, and the case that forced the
   * edit-distance rule: trigrams score /abuot/ against /about/ at 0.333, below
   * anything a threshold could safely accept. */
  check(file, 'a transposition in a short page name still finds it', () => {
    assert.strictEqual(topUrl('/abuot/'), '/about/');
    assert.strictEqual(topUrl('/nwo/'), '/now/');
  });

  check(file, 'a dropped character in a short page name still finds it', () => {
    assert.strictEqual(topUrl('/colophn/'), '/colophon/');
    assert.strictEqual(topUrl('/portfolo/'), '/portfolio/');
  });

  check(file, 'edit similarity rewards a transposition trigrams miss', () => {
    assert.ok(diceCoefficient('abuot', 'about') < 0.4);
    assert.ok(editSimilarity('abuot', 'about') > 0.7);
  });

  check(file, 'edit similarity ignores pairs of very different length', () => {
    assert.strictEqual(editSimilarity('now', 'a-much-longer-path-entirely'), 0);
  });

  /* Real request paths from bot traffic. None of these has a home on the site,
   * and each one used to clear a lower threshold. */
  check(file, 'common probe paths return nothing', () => {
    ['/wp-admin/', '/admin/login/', '/login/', '/search/', '/xmlrpc.php', '/cgi-bin/'].forEach(
      (probe) => {
        assert.deepStrictEqual(rankCandidates(probe, INDEX), [], probe + ' should not match');
      }
    );
  });

  check(file, 'a percent-encoded space costs nothing', () => {
    assert.strictEqual(topUrl('/wisdom/tags/clarity%20/'), '/wisdom/tags/clarity/');
  });

  check(file, 'an unrelated path returns nothing rather than a guess', () => {
    assert.deepStrictEqual(rankCandidates('/zxcvbnm/qwerty/', INDEX), []);
  });

  check(file, 'a bare junk word returns nothing', () => {
    assert.deepStrictEqual(rankCandidates('/asdfgh/', INDEX), []);
  });

  check(file, 'the prefix rule has a floor, so /20 matches nothing', () => {
    assert.deepStrictEqual(rankCandidates('/20', INDEX), []);
  });

  check(file, 'an empty path returns nothing', () => {
    assert.deepStrictEqual(rankCandidates('/', INDEX), []);
    assert.deepStrictEqual(rankCandidates('', INDEX), []);
  });

  check(file, 'an empty index returns nothing', () => {
    assert.deepStrictEqual(rankCandidates('/colophon', []), []);
  });

  check(file, 'never returns more than the limit', () => {
    assert.ok(rankCandidates('/2026/08/', INDEX, { threshold: 0 }).length <= 3);
  });

  check(file, 'results are ordered best first', () => {
    const hits = rankCandidates('/2026/08/', INDEX, { threshold: 0 });
    for (let i = 1; i < hits.length; i++) {
      assert.ok(hits[i - 1].score >= hits[i].score, 'scores must not increase');
    }
  });
}

runTest({
  testType: '404-suggest',
  testName: '404 suggester',
  requiresSite: false,
  validateFn: async (result) => {
    runUnitAssertions(result);
  },
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
