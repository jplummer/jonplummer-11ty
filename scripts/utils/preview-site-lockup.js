/**
 * Build-time HTML for mini-page facsimile lockups (/color/, /type/).
 * SVG geometry must stay in sync with src/_includes/components/site-mark.njk
 */

'use strict';

const SITE_MARK_SVG = `<svg class="site-mark" viewBox="50 50 500 500" width="52" height="52" aria-hidden="true" focusable="false">
  <rect x="50" y="450" width="100" height="100" fill="currentColor"/>
  <rect x="183" y="50" width="100" height="500" fill="currentColor"/>
  <rect x="317" y="50" width="100" height="500" fill="currentColor"/>
  <rect x="450" y="50" width="100" height="400" fill="currentColor"/>
</svg>`;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {{ author: string, tagline?: string, includeTagline?: boolean, homeHref?: string }} opts
 * @returns {string}
 */
function renderPreviewSiteLockup(opts) {
  const author = opts && opts.author != null ? String(opts.author) : '';
  if (!author) {
    throw new Error('renderPreviewSiteLockup: author is required');
  }
  const includeTagline = Boolean(opts.includeTagline);
  const tagline = opts.tagline != null ? String(opts.tagline) : '';
  const homeHref = opts.homeHref != null ? String(opts.homeHref) : '#';

  const safeAuthor = escapeHtml(author);
  const safeHref = escapeHtml(homeHref);
  const aria = escapeHtml(`${author} home`);

  const taglineHtml =
    includeTagline && tagline
      ? `\n            <p>${escapeHtml(tagline)}</p>`
      : '';

  return `<div class="site-lockup">
        <a href="${safeHref}" rel="home" class="site-mark-link" aria-label="${aria}">
          ${SITE_MARK_SVG}
        </a>
        <hgroup>
          <h1><a href="${safeHref}" rel="home">${safeAuthor}</a></h1>${taglineHtml}
        </hgroup>
      </div>`;
}

module.exports = {
  renderPreviewSiteLockup,
  SITE_MARK_SVG,
};
