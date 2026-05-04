/**
 * Eleventy configuration: Event handlers
 * 
 * Called from `.eleventy.js` during Eleventy initialization.
 * Registers event handlers for build lifecycle events (before, after, beforeWatch).
 * Handles progress indicators and incremental OG image generation.
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { SPINNER_FRAMES } = require('../../scripts/utils/spinner-utils');

/** Avoid reopening the browser on every watch rebuild */
let devBrowserOpened = false;

const DEFAULT_DEV_PORT = 8080;

/**
 * CLI `--port` matches Eleventy dev server (docs: `--serve --port=8081`).
 * If Eleventy bumps the port because the requested port is busy, set
 * `ELEVENTY_DEV_SERVER_URL` to the URL printed in the terminal.
 */
function getCliDevServerPort() {
  const argv = process.argv;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--port=')) {
      const n = parseInt(a.slice('--port='.length), 10);
      if (!Number.isNaN(n)) return n;
    }
    if (a === '--port' && argv[i + 1]) {
      const n = parseInt(argv[i + 1], 10);
      if (!Number.isNaN(n)) return n;
    }
  }
  return DEFAULT_DEV_PORT;
}

function shouldOpenDevBrowserOnce() {
  if (process.env.ELEVENTY_RUN_MODE !== 'serve') return false;
  const optOut = process.env.ELEVENTY_OPEN_BROWSER;
  if (optOut === '0' || optOut === 'false' || optOut === 'no') return false;
  if (process.env.CI === 'true' || process.env.CI === '1') return false;
  return true;
}

function openExternalUrl(url) {
  const plat = process.platform;
  try {
    if (plat === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else if (plat === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch (_) {
    // ignore — optional UX
  }
}

/** First successful build in `--serve`: open site after a short delay so the server can bind */
function scheduleOpenDevBrowserOnce() {
  if (devBrowserOpened || !shouldOpenDevBrowserOnce()) return;
  devBrowserOpened = true;

  const explicit = process.env.ELEVENTY_DEV_SERVER_URL;
  const url =
    explicit && explicit.trim().length > 0
      ? explicit.trim()
      : `http://127.0.0.1:${getCliDevServerPort()}/`;

  setTimeout(() => openExternalUrl(url), 400);
}

/**
 * Configures Eleventy event handlers.
 * 
 * @param {object} eleventyConfig - Eleventy configuration object
 */
function configureEvents(eleventyConfig) {
  // Check if we're in quiet mode (via command line args or config)
  const isQuiet = process.argv.includes('--quiet') || process.env.ELEVENTY_QUIET === 'true';
  let spinnerInterval;
  let spinnerIndex = 0;

  // Helper to clean up spinner
  function cleanupSpinner() {
    if (spinnerInterval) {
      clearInterval(spinnerInterval);
      spinnerInterval = null;
      // Clear the spinner line - use synchronous write
      try {
        process.stdout.write('\r' + ' '.repeat(50) + '\r');
      } catch (e) {
        // Ignore errors if stdout is closed
      }
    }
  }

  // Clean up spinner on process exit or error
  // Use 'beforeExit' which fires before 'exit' and allows async operations
  process.on('beforeExit', cleanupSpinner);
  process.on('exit', cleanupSpinner);
  process.on('SIGINT', () => {
    cleanupSpinner();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cleanupSpinner();
    process.exit(0);
  });

  // Minimal progress indicator at build start
  eleventyConfig.on("eleventy.before", () => {
    try {
      const { runColorGalleryBuild } = require('../../scripts/color-explore/generate-gallery.js');
      runColorGalleryBuild({ quiet: isQuiet, stableWildThemes: true });
    } catch (err) {
      console.error('Color gallery (site embed) failed:', err.message);
      throw err;
    }

    if (isQuiet) {
      process.stdout.write('Building... ');
      
      // Start spinner animation
      // Use unref() so the interval doesn't keep the process alive if Eleventy exits
      spinnerInterval = setInterval(() => {
        spinnerIndex = (spinnerIndex + 1) % SPINNER_FRAMES.length;
        process.stdout.write(`\rBuilding... ${SPINNER_FRAMES[spinnerIndex]}`);
      }, 100);
      spinnerInterval.unref();
    }
  });

  // Clean up spinner when build completes
  eleventyConfig.on("eleventy.after", () => {
    if (isQuiet) {
      cleanupSpinner();
    }
    scheduleOpenDevBrowserOnce();
  });

  // Incremental OG image generation on file changes during dev
  eleventyConfig.on("eleventy.beforeWatch", async (changedFiles) => {
    // Only process markdown and njk files that are posts or pages
    const relevantFiles = changedFiles
      .map(file => {
        // Handle both relative and absolute paths
        if (path.isAbsolute(file)) {
          return file;
        }
        return path.join(process.cwd(), file);
      })
      .filter(file => {
        const isPost = file.includes('_posts/') && (file.endsWith('.md') || file.endsWith('.njk'));
        const isPage = file.includes('src/') && !file.includes('_posts/') && !file.includes('_includes/') && !file.includes('_data/') && !file.includes('assets/') && (file.endsWith('.md') || file.endsWith('.njk'));
        const isPortfolioPage = file.endsWith('portfolio.njk') || file.endsWith('portfolio.md');
        return (isPost || isPage || isPortfolioPage);
      })
      .filter(file => {
        // Only process files that actually exist
        return fs.existsSync(file);
      });

    if (relevantFiles.length > 0) {
      const { processFile } = require('../../scripts/content/generate-og-images.js');
      for (const file of relevantFiles) {
        try {
          await processFile(file);
        } catch (error) {
          // Silently fail during watch - don't break dev server
          console.error(`⚠️  Failed to generate OG image for ${file}: ${error.message}`);
        }
      }
    }
  });
}

module.exports = configureEvents;

