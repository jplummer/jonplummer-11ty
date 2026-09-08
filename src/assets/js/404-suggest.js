/*
 * "Did you mean" suggestions for the 404 page.
 *
 * Apache serves an ErrorDocument at whatever URL failed rather than at the
 * page's own output path, so location.pathname holds the address that missed.
 * This compares it against window.jp404Index (built by src/404-index.njk) and
 * offers the closest few destinations when any are close enough.
 *
 * Targets typos and truncation. Known moves belong in src/_data/redirects.yaml.
 *
 * The pure functions below are also required directly by
 * scripts/test/404-suggest.js, which is why the exports and the DOM work are
 * each behind an environment guard.
 */
(function (root) {
  'use strict';

  var THRESHOLD = 0.55;
  var LIMIT = 3;
  var PREFIX_FLOOR = 8;
  var PREFIX_SCORE = 0.95;

  /* Lowercase, drop the leading and trailing slash and any .html, and collapse
   * every run of non-alphanumerics to one hyphen. Makes a missing trailing
   * slash, a stray %20, and a doubled hyphen all cost nothing. */
  function normalizePath(pathname) {
    return String(pathname || '')
      .toLowerCase()
      .replace(/\.html?$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function trigrams(str) {
    var padded = '  ' + str + ' ';
    var out = [];
    for (var i = 0; i < padded.length - 2; i++) {
      out.push(padded.slice(i, i + 3));
    }
    return out;
  }

  /* Twice the shared trigrams over the total in both, counting multiplicity.
   * Lands in [0, 1], so the threshold means something. */
  function diceCoefficient(a, b) {
    if (!a || !b) return 0;
    if (a === b) return 1;
    var aGrams = trigrams(a);
    var bGrams = trigrams(b);
    if (!aGrams.length || !bGrams.length) return 0;

    var counts = Object.create(null);
    var i;
    for (i = 0; i < aGrams.length; i++) {
      counts[aGrams[i]] = (counts[aGrams[i]] || 0) + 1;
    }
    var shared = 0;
    for (i = 0; i < bGrams.length; i++) {
      if (counts[bGrams[i]] > 0) {
        counts[bGrams[i]]--;
        shared++;
      }
    }
    return (2 * shared) / (aGrams.length + bGrams.length);
  }

  /* Optimal string alignment: Levenshtein plus adjacent transpositions,
   * expressed as a similarity in [0, 1]. Trigrams go blind on short strings -
   * "abuot" and "about" share almost none - and short paths are exactly what
   * people mistype by hand. Edit distance is strongest precisely there, so the
   * score is the better of the two. */
  function editSimilarity(a, b) {
    var alen = a.length;
    var blen = b.length;
    if (!alen || !blen) return 0;
    var longest = Math.max(alen, blen);
    /* Two strings of very different lengths cannot score well, and the prefix
     * rule already owns truncation. Skip the work. */
    if (Math.min(alen, blen) / longest < 0.5) return 0;

    var prev2 = [];
    var prev = [];
    var cur = [];
    var i;
    var j;
    for (j = 0; j <= blen; j++) prev[j] = j;

    for (i = 1; i <= alen; i++) {
      cur[0] = i;
      for (j = 1; j <= blen; j++) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        var val = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
        if (
          i > 1 &&
          j > 1 &&
          a.charAt(i - 1) === b.charAt(j - 2) &&
          a.charAt(i - 2) === b.charAt(j - 1)
        ) {
          val = Math.min(val, prev2[j - 2] + 1);
        }
        cur[j] = val;
      }
      prev2 = prev.slice();
      prev = cur.slice();
    }
    return 1 - prev[blen] / longest;
  }

  /* A candidate that starts with what was asked for is truncation, the case we
   * can be most confident about. The floor keeps a two-character path from
   * matching a third of the site. */
  function scorePair(askedNorm, candidateNorm) {
    if (
      askedNorm.length >= PREFIX_FLOOR &&
      candidateNorm.length > askedNorm.length &&
      candidateNorm.indexOf(askedNorm) === 0
    ) {
      return PREFIX_SCORE;
    }
    return Math.max(
      diceCoefficient(askedNorm, candidateNorm),
      editSimilarity(askedNorm, candidateNorm)
    );
  }

  function rankCandidates(pathname, index, options) {
    var opts = options || {};
    var threshold = typeof opts.threshold === 'number' ? opts.threshold : THRESHOLD;
    var limit = typeof opts.limit === 'number' ? opts.limit : LIMIT;
    var asked = normalizePath(pathname);
    if (!asked || !index || !index.length) return [];

    var scored = [];
    for (var i = 0; i < index.length; i++) {
      var url = index[i][0];
      /* No need to skip an exact normalized match: the index holds only pages
       * that exist, and the failed path by definition does not. An exact hit
       * means the visitor spelled a real page differently - a missing trailing
       * slash, say - which is precisely what we want to offer back. */
      var score = scorePair(asked, normalizePath(url));
      if (score >= threshold) {
        scored.push({ url: url, title: index[i][1], score: score });
      }
    }
    scored.sort(function (a, b) {
      return b.score - a.score || a.url.length - b.url.length;
    });
    return scored.slice(0, limit);
  }

  var api = {
    normalizePath: normalizePath,
    diceCoefficient: diceCoefficient,
    editSimilarity: editSimilarity,
    rankCandidates: rankCandidates,
    THRESHOLD: THRESHOLD,
    LIMIT: LIMIT,
    PREFIX_FLOOR: PREFIX_FLOOR,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.jp404Suggest = api;

  if (typeof document === 'undefined') return;

  function render() {
    var host = document.getElementById('suggestions');
    if (!host) return;

    var matches = rankCandidates(root.location.pathname, root.jp404Index || []);
    var heading = document.createElement('h2');
    host.appendChild(heading);

    if (!matches.length) {
      heading.textContent = 'Nothing here looks close to that address';
      host.hidden = false;
      return;
    }

    heading.textContent = matches.length === 1 ? 'Did you mean this?' : 'Did you mean one of these?';
    var list = document.createElement('ul');
    for (var i = 0; i < matches.length; i++) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = matches[i].url;
      a.textContent = matches[i].title;
      li.appendChild(a);
      list.appendChild(li);
    }
    host.appendChild(list);
    host.hidden = false;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
