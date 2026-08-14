'use strict';

/**
 * Project-specific input for the focus audit. The collector, evaluator and
 * reporter are site-agnostic; everything this site knows about itself lives
 * here. Porting the tool to another site means replacing this file only.
 */

// Structured sample per WCAG-EM 2.0 Step 3.1: one page per distinct template,
// covering the variety of views, functionality and technologies on the site.
const structuredSample = [
  { path: '/', why: 'index.njk, home lockup and post list' },
  { path: '/page/2/', why: 'paginated index, pagination nav' },
  { path: '/2026/04/04/sometimes-you-take-over/', why: 'single_post.njk with figures, lightbox triggers' },
  { path: '/2026/02/11/a-conversation-about-religion/', why: 'the only post with a content-warning details' },
  { path: '/portfolio/', why: 'portfolio.njk, card grid, whole-card links' },
  { path: '/2026/02/20/call-review-console/', why: 'portfolio_detail.njk' },
  { path: '/wisdom/', why: 'wisdom list and tag links' },
  { path: '/colophon/', why: 'page layout, sketch, footer' },
  { path: '/about/', why: 'page layout, prose links' },
  { path: '/404.html', why: 'error document, root-absolute assets' },
  // The experimental utility pages get a reachability sweep only. Per-stop
  // focus measurement costs a second each, and /color/ alone has ~166 stops.
  { path: '/color/', why: 'sanity pass only', sanityOnly: true },
  { path: '/type/', why: 'sanity pass only', sanityOnly: true },
];

module.exports = {
  structuredSample,
  scenarios: [],
  randomSampleRatio: 0.1,
  sitemapPath: '/sitemap.xml',
};
