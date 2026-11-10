/**
 * Empty _site/ before a build, except the optimized images in _site/img/.
 *
 * Eleventy never deletes output, and deploy's rsync runs with --delete, so the
 * server mirrors whatever _site/ holds. A page that was moved, deleted, or
 * renamed would otherwise linger in _site/ and ship live at its old URL. That
 * includes an opportunity-specific portfolio removed from portfolios.yaml
 * instead of retired. Nothing would flag it: deploy sees no change in the file,
 * so it never tells search engines the page is gone.
 *
 * _site/img/ stays because re-optimizing every image adds about 45–50 seconds
 * to each build. Unused images left there ship too, but they're only bytes.
 * `pnpm run clean` empties everything, images included, for a full refresh.
 *
 * Run first thing in scripts/build/build.js (guarded by `test deploy-guards`).
 */

const fs = require('fs');
const path = require('path');

const KEEP = ['img'];

/**
 * @param {string} [siteDir] defaults to ./_site
 * @returns {{ removed: number }} top-level entries removed
 */
function cleanSiteExceptImages(siteDir = path.join(process.cwd(), '_site')) {
  if (!fs.existsSync(siteDir)) return { removed: 0 };
  let removed = 0;
  for (const entry of fs.readdirSync(siteDir)) {
    if (KEEP.includes(entry)) continue;
    fs.rmSync(path.join(siteDir, entry), { recursive: true, force: true });
    removed++;
  }
  return { removed };
}

module.exports = { cleanSiteExceptImages, KEEP };
