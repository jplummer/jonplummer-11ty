/**
 * Utility: is this page published, a draft, or held for a later day?
 *
 * One rule, used by the build (eleventy/config/preprocessors.js) and by the
 * line the build prints for each item it leaves out (scripts/utils/unpublished.js),
 * so the two cannot disagree.
 *
 * - draft: front matter has `draft: true`. Any page can be a draft.
 * - held: a post (`tags: post`) whose date is a later Pacific day than today.
 *   It goes out on the first production build on or after that day.
 * - live: everything else.
 *
 * Drafts and held posts are left out of production builds only. The dev
 * server shows both.
 */

const { toDateTime, todayIsoDate } = require('./date-utils');

function isPost(data) {
  const tags = data && data.tags;
  return Array.isArray(tags) ? tags.includes('post') : tags === 'post';
}

/**
 * @param {object} data - Front matter, or Eleventy's data for a page
 * @param {Date} [now] - The instant to take today from
 * @returns {{ state: 'draft' } | { state: 'held', until: string } | { state: 'live' }}
 */
function publishState(data, now = new Date()) {
  if (data && data.draft) {
    return { state: 'draft' };
  }
  if (isPost(data) && data.date) {
    const day = toDateTime(data.date);
    if (day && day.toISODate() > todayIsoDate(now)) {
      return { state: 'held', until: day.toISODate() };
    }
  }
  return { state: 'live' };
}

module.exports = { publishState };
