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
  { path: '/2026/04/04/sometimes-you-take-over/', why: 'single_post.njk, prose post with no figures' },
  { path: '/2026/02/11/a-conversation-about-religion/', why: 'the only post with a content-warning details' },
  { path: '/portfolio/', why: 'portfolio.njk, card grid, whole-card links' },
  { path: '/2026/02/20/call-review-console/', why: 'portfolio_detail.njk, 5 lightbox triggers' },
  { path: '/wisdom/', why: 'wisdom list and tag links' },
  { path: '/colophon/', why: 'page layout, sketch, footer' },
  { path: '/about/', why: 'page layout, prose links' },
  { path: '/404.html', why: 'error document, root-absolute assets' },
  // The experimental utility pages get a reachability sweep only. Per-stop
  // focus measurement costs a second each, and /color/ alone has ~166 stops.
  { path: '/color/', why: 'sanity pass only', sanityOnly: true },
  { path: '/type/', why: 'sanity pass only', sanityOnly: true },
];

// Scenarios cover the interactive behavior a tab sweep cannot see: what
// happens to focus when the DOM changes underneath it. Selectors verified
// against built output rather than assumed.
const scenarios = [
  {
    id: 'skip-link',
    title: 'Skip link moves focus to main content',
    path: '/',
    steps: [
      { action: 'tab', times: 1 },
      { action: 'expectFocus', selector: 'header a.skip', description: 'skip link is the first tab stop' },
      { action: 'press', key: 'Enter' },
      { action: 'tab', times: 1 },
      { action: 'expectFocusWithin', selector: '#main', description: 'tabbing after the skip link continues inside main content, bypassing the header' },
    ],
  },
  {
    id: 'lightbox',
    title: 'Figure lightbox opens, navigates to the end, and restores focus',
    path: '/2026/02/20/call-review-console/',
    steps: [
      { action: 'click', selector: 'a.figure-lightbox-trigger' },
      { action: 'expectFocus', selector: '#figure-lightbox-close', description: 'focus enters the dialog' },
      // Five figures, so four Next presses reach the last one and disable the
      // button. The spec predicts focus may be dropped to body at that point.
      { action: 'press', key: 'ArrowRight' },
      { action: 'press', key: 'ArrowRight' },
      { action: 'press', key: 'ArrowRight' },
      { action: 'press', key: 'ArrowRight' },
      { action: 'expectFocus', selector: '#figure-lightbox-close', description: 'focus is still inside the dialog at the end of the gallery' },
      { action: 'press', key: 'Escape' },
      { action: 'expectFocus', selector: 'a.figure-lightbox-trigger', description: 'focus returns to the trigger that opened the dialog' },
    ],
  },
  {
    id: 'lightbox-next-button',
    title: 'Next button stays focused when it becomes unavailable at the last image',
    path: '/2026/02/20/call-review-console/',
    steps: [
      { action: 'click', selector: 'a.figure-lightbox-trigger' },
      { action: 'click', selector: '#figure-lightbox-next' },
      { action: 'click', selector: '#figure-lightbox-next' },
      { action: 'click', selector: '#figure-lightbox-next' },
      { action: 'click', selector: '#figure-lightbox-next' },
      { action: 'expectFocus', selector: '#figure-lightbox-next', description: 'focus survives the Next button becoming unavailable at the last image' },
    ],
  },
  {
    id: 'content-warning',
    title: 'Content-warning disclosure is keyboard operable',
    path: '/2026/02/11/a-conversation-about-religion/',
    steps: [
      { action: 'click', selector: 'article details summary' },
      { action: 'expectFocus', selector: 'article details summary', description: 'summary holds focus after toggling' },
      { action: 'press', key: 'Space' },
      { action: 'expectFocus', selector: 'article details summary', description: 'summary still holds focus after Space' },
    ],
  },
];

module.exports = {
  structuredSample,
  scenarios,
  randomSampleRatio: 0.1,
  sitemapPath: '/sitemap.xml',
};
