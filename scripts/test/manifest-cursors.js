#!/usr/bin/env node

/**
 * Guards the two content-hash state files against being quietly merged or
 * cross-contaminated.
 *
 * `.cache/deploy-content-manifest.json` and `.cache/indexnow-content-manifest.json`
 * hold the same snapshot after a healthy deploy, which makes them look
 * redundant. They are not: they are independent cursors ("last state purged
 * from the edge" and "last state submitted to IndexNow"), each advancing only
 * when its own consumer succeeds, and each consumer can be disabled on its own.
 * The properties below are the reason the second file exists, so they are
 * checked rather than left to a comment.
 *
 * Runs the same composition scripts/deploy/deploy.js runs — one hash walk
 * shared by both consumers — against temp directories with a stubbed `fetch`.
 * No network, and never touches the real `.cache/` files.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  buildContentManifest,
  purgeChangedDeployContent,
  saveContentManifest,
} = require('../utils/cloudflare-purge');
const { processIndexNow } = require('../utils/indexnow');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const CONFIGURED_CF_ENV = { CLOUDFLARE_ZONE_ID: 'zone', CLOUDFLARE_API_TOKEN: 'token' };

/**
 * Stands in for both APIs: Cloudflare checks `ok` + `success`, IndexNow checks
 * `status`. `failing` simulates an outage for whichever consumer is under test.
 */
function stubFetch({ failing = false } = {}) {
  global.fetch = async () => {
    if (failing) {
      throw new Error('simulated network failure');
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
      text: async () => '',
    };
  };
}

/**
 * Mirrors the tail of scripts/deploy/deploy.js: build one manifest, hand it to
 * both consumers, and let each decide whether its own cursor advances. Failures
 * are swallowed exactly as deploy.js swallows them (a deploy that reached this
 * point already succeeded).
 * @returns {{ purgeFailed: boolean, indexNowFailed: boolean }}
 */
async function runDeployTail({
  siteRoot,
  cfManifestPath,
  indexNowManifestPath,
  currentManifest,
  cfEnv = CONFIGURED_CF_ENV,
  cfFails = false,
  indexNowFails = false,
}) {
  const siteDomain = 'jonplummer.com';
  let purgeFailed = false;
  let indexNowFailed = false;

  try {
    stubFetch({ failing: cfFails });
    const purgeResult = await purgeChangedDeployContent(siteRoot, siteDomain, {
      manifestPath: cfManifestPath,
      env: cfEnv,
      currentManifest,
    });
    if (purgeResult.writeManifest && purgeResult.currentManifest) {
      saveContentManifest(cfManifestPath, purgeResult.currentManifest);
    }
  } catch {
    purgeFailed = true;
  }

  try {
    stubFetch({ failing: indexNowFails });
    await processIndexNow({
      siteRoot,
      siteDomain,
      currentManifest,
      manifestPath: indexNowManifestPath,
    });
  } catch {
    indexNowFailed = true;
  }

  return { purgeFailed, indexNowFailed };
}

function readGeneratedAt(manifestPath) {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8')).generatedAt;
}

runTest({
  testType: 'manifest-cursors',
  testName: 'Deploy manifest cursors',
  requiresSite: false,
  validateFn: async (result) => {
    const fileObj = addFile(result, 'scripts/deploy/deploy.js');

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-cursors-'));
    const siteRoot = path.join(tmp, 'site');
    const cfManifestPath = path.join(tmp, 'deploy-content-manifest.json');
    const indexNowManifestPath = path.join(tmp, 'indexnow-content-manifest.json');

    fs.mkdirSync(path.join(siteRoot, 'about'), { recursive: true });
    fs.writeFileSync(path.join(siteRoot, 'index.html'), '<html>one</html>\n');
    fs.writeFileSync(path.join(siteRoot, 'about/index.html'), '<html>about</html>\n');

    // Both cursors start from the same older snapshot, as they would after a
    // healthy deploy. `baseline` is what "not advanced" looks like below.
    const baseline = buildContentManifest(siteRoot);
    const resetCursors = () => {
      saveContentManifest(cfManifestPath, baseline);
      saveContentManifest(indexNowManifestPath, baseline);
    };

    fs.writeFileSync(path.join(siteRoot, 'index.html'), '<html>two</html>\n');

    const originalFetch = global.fetch;
    const originalKey = process.env.INDEXNOW_API_KEY;
    const originalLog = console.log;
    process.env.INDEXNOW_API_KEY = 'test-key-never-sent';
    console.log = () => {};

    try {
      // 1. One hash walk, shared. Two walks would produce two `generatedAt`
      //    values milliseconds apart; identical strings can only come from one
      //    manifest object reaching both consumers.
      resetCursors();
      const shared = buildContentManifest(siteRoot);
      await runDeployTail({ siteRoot, cfManifestPath, indexNowManifestPath, currentManifest: shared });

      const cfStamp = readGeneratedAt(cfManifestPath);
      const indexNowStamp = readGeneratedAt(indexNowManifestPath);
      if (cfStamp !== shared.generatedAt || indexNowStamp !== shared.generatedAt) {
        addIssue(fileObj, {
          severity: 'error',
          type: 'manifest-cursors-shared-walk',
          message: `both cursors must record the shared manifest (${shared.generatedAt}), got cloudflare=${cfStamp} indexnow=${indexNowStamp}`,
        });
      }

      // 2. Independent enablement. With purging switched off (no credentials,
      //    or CLOUDFLARE_PURGE=0), IndexNow must still advance its own cursor
      //    while Cloudflare's stays put. A shared file could not do both.
      resetCursors();
      const purgeOff = buildContentManifest(siteRoot);
      await runDeployTail({
        siteRoot,
        cfManifestPath,
        indexNowManifestPath,
        currentManifest: purgeOff,
        cfEnv: {},
      });

      if (readGeneratedAt(cfManifestPath) !== baseline.generatedAt) {
        addIssue(fileObj, {
          severity: 'error',
          type: 'manifest-cursors-purge-disabled',
          message: 'Cloudflare cursor must not advance when purging is not configured',
        });
      }
      if (readGeneratedAt(indexNowManifestPath) !== purgeOff.generatedAt) {
        addIssue(fileObj, {
          severity: 'error',
          type: 'manifest-cursors-purge-disabled',
          message: 'IndexNow cursor must still advance when Cloudflare purging is off',
        });
      }

      // 3. Failure isolation, Cloudflare side. A failed purge must leave its
      //    own cursor un-advanced so the next deploy retries those URLs, without
      //    holding back IndexNow.
      resetCursors();
      const cfDown = buildContentManifest(siteRoot);
      await runDeployTail({
        siteRoot,
        cfManifestPath,
        indexNowManifestPath,
        currentManifest: cfDown,
        cfFails: true,
      });

      if (readGeneratedAt(cfManifestPath) !== baseline.generatedAt) {
        addIssue(fileObj, {
          severity: 'error',
          type: 'manifest-cursors-purge-failed',
          message: 'a failed purge must not advance the Cloudflare cursor (those URLs still need purging)',
        });
      }
      if (readGeneratedAt(indexNowManifestPath) !== cfDown.generatedAt) {
        addIssue(fileObj, {
          severity: 'error',
          type: 'manifest-cursors-purge-failed',
          message: 'a failed purge must not hold back the IndexNow cursor',
        });
      }

      // 4. Failure isolation, IndexNow side — the mirror image.
      resetCursors();
      const indexNowDown = buildContentManifest(siteRoot);
      await runDeployTail({
        siteRoot,
        cfManifestPath,
        indexNowManifestPath,
        currentManifest: indexNowDown,
        indexNowFails: true,
      });

      if (readGeneratedAt(indexNowManifestPath) !== baseline.generatedAt) {
        addIssue(fileObj, {
          severity: 'error',
          type: 'manifest-cursors-indexnow-failed',
          message: 'a failed IndexNow submission must not advance its cursor (those URLs were never submitted)',
        });
      }
      if (readGeneratedAt(cfManifestPath) !== indexNowDown.generatedAt) {
        addIssue(fileObj, {
          severity: 'error',
          type: 'manifest-cursors-indexnow-failed',
          message: 'a failed IndexNow submission must not roll back the Cloudflare cursor',
        });
      }
    } finally {
      console.log = originalLog;
      global.fetch = originalFetch;
      if (originalKey === undefined) delete process.env.INDEXNOW_API_KEY;
      else process.env.INDEXNOW_API_KEY = originalKey;
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  },
});
