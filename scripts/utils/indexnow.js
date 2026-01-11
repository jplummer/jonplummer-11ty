#!/usr/bin/env node

/**
 * IndexNow Utility
 * 
 * Notifies search engines via IndexNow protocol when significant content changes occur.
 * Only notifies for:
 * - New posts (Added files in src/_posts/)
 * - Index page changes (src/index.njk)
 * - Static page changes (src/about.md, src/now.md, src/changelog.md, src/readme.md, src/technologies.md)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { parseFrontMatter } = require('./frontmatter-utils');
const { loadDotenvSilently } = require('./env-utils');

// Load environment variables
if (fs.existsSync('.env')) {
  loadDotenvSilently();
}

const STATE_FILE = path.join(process.cwd(), '.indexnow-state.json');
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';
const STATIC_PAGES = ['about.md', 'now.md', 'changelog.md', 'readme.md', 'technologies.md'];

/**
 * Get current git commit hash
 */
function getCurrentCommitHash() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8', cwd: process.cwd() }).trim();
  } catch (error) {
    return null;
  }
}

/**
 * Get files changed in the last commit
 * Returns only Added files (for new posts) and Modified files (for index/static pages)
 */
function getChangedFiles() {
  try {
    // Check if there's a previous commit to compare against
    let hasPreviousCommit = false;
    try {
      execSync('git rev-parse HEAD~1', { encoding: 'utf8', cwd: process.cwd(), stdio: 'pipe' });
      hasPreviousCommit = true;
    } catch (error) {
      // No previous commit, this is the first commit
      hasPreviousCommit = false;
    }
    
    if (!hasPreviousCommit) {
      // First commit: compare HEAD to empty tree
      const addedOutput = execSync('git diff --name-only --diff-filter=A --root HEAD', {
        encoding: 'utf8',
        cwd: process.cwd()
      });
      const modifiedOutput = execSync('git diff --name-only --diff-filter=M --root HEAD', {
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      const addedFiles = addedOutput.trim().split('\n').filter(line => line.trim());
      const modifiedFiles = modifiedOutput.trim().split('\n').filter(line => line.trim());
      
      return {
        added: addedFiles,
        modified: modifiedFiles
      };
    }
    
    // Compare last commit to previous commit
    const addedOutput = execSync('git diff --name-only --diff-filter=A HEAD~1 HEAD', {
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    const modifiedOutput = execSync('git diff --name-only --diff-filter=M HEAD~1 HEAD', {
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    const addedFiles = addedOutput.trim().split('\n').filter(line => line.trim());
    const modifiedFiles = modifiedOutput.trim().split('\n').filter(line => line.trim());
    
    return {
      added: addedFiles,
      modified: modifiedFiles
    };
  } catch (error) {
    // If git command fails, return empty arrays
    return { added: [], modified: [] };
  }
}

/**
 * Check if a file is a new post
 */
function isNewPost(filePath) {
  return filePath.startsWith('src/_posts/') && filePath.endsWith('.md');
}

/**
 * Check if a file is the index page
 */
function isIndexPage(filePath) {
  return filePath === 'src/index.njk';
}

/**
 * Check if a file is a static page
 */
function isStaticPage(filePath) {
  if (!filePath.startsWith('src/') || filePath.startsWith('src/_posts/') || filePath.startsWith('src/_includes/') || filePath.startsWith('src/_data/')) {
    return false;
  }
  
  const filename = path.basename(filePath);
  return STATIC_PAGES.includes(filename);
}

/**
 * Map source file to URL
 */
function mapSourceFileToUrl(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // New posts: src/_posts/YYYY/YYYY-MM-DD-slug.md -> /YYYY/MM/DD/slug/
  if (normalizedPath.startsWith('src/_posts/')) {
    const postMatch = normalizedPath.match(/src\/_posts\/(\d{4})\/(\d{4})-(\d{2})-(\d{2})-([^/]+)\.md$/);
    if (postMatch) {
      const [, year, yearFromFilename, month, day, slug] = postMatch;
      return `/${yearFromFilename}/${month}/${day}/${slug}/`;
    }
  }
  
  // Index page: src/index.njk -> /
  if (normalizedPath === 'src/index.njk') {
    return '/';
  }
  
  // Static pages: read permalink from frontmatter
  if (isStaticPage(normalizedPath)) {
    try {
      const fullPath = path.resolve(process.cwd(), normalizedPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const { frontMatter } = parseFrontMatter(content);
        if (frontMatter && frontMatter.permalink) {
          return frontMatter.permalink;
        }
      }
    } catch (error) {
      // If we can't read the file, fall back to filename-based URL
    }
    
    // Fallback: use filename
    const filename = path.basename(normalizedPath, '.md');
    return `/${filename}/`;
  }
  
  return null;
}

/**
 * Load state file
 */
function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    return { lastCommit: null, notifiedUrls: {} };
  }
  
  try {
    const content = fs.readFileSync(STATE_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return { lastCommit: null, notifiedUrls: {} };
  }
}

/**
 * Save state file
 */
function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

/**
 * Get site URL from site data
 */
function getSiteUrl() {
  try {
    const siteData = require('../../src/_data/site.js');
    const site = siteData();
    return site.url;
  } catch (error) {
    return process.env.SITE_DOMAIN ? `https://${process.env.SITE_DOMAIN}` : 'https://jonplummer.com';
  }
}

/**
 * Send IndexNow notification
 */
function notifyIndexNow(urls, apiKey, options = {}) {
  const { dryRun = false } = options;
  
  return new Promise((resolve, reject) => {
    if (urls.length === 0) {
      resolve({ success: true, notified: 0 });
      return;
    }
    
    const payload = JSON.stringify({
      host: new URL(getSiteUrl()).hostname,
      key: apiKey,
      keyLocation: `${getSiteUrl()}/${apiKey}.txt`,
      urlList: urls.map(url => `${getSiteUrl()}${url}`)
    });
    
    // In dry-run mode, just return success without actually sending
    if (dryRun) {
      resolve({ success: true, notified: urls.length, statusCode: 200, dryRun: true, payload: JSON.parse(payload) });
      return;
    }
    
    const requestOptions = {
      hostname: 'api.indexnow.org',
      port: 443,
      path: '/IndexNow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    
    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 202) {
          resolve({ success: true, notified: urls.length, statusCode: res.statusCode });
        } else {
          reject(new Error(`IndexNow API returned status ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(payload);
    req.end();
  });
}

/**
 * Main function to process changes and notify IndexNow
 */
async function processIndexNow(options = {}) {
  const { quiet = false, dryRun = false } = options;
  
  // Check for API key
  const apiKey = process.env.INDEXNOW_API_KEY;
  if (!apiKey) {
    if (!quiet) {
      console.log('⚠️  🔍 IndexNow: API key not found (INDEXNOW_API_KEY not set)');
      console.log('   Skipping IndexNow notification.\n');
    }
    return { notified: 0, skipped: true, reason: 'no_api_key' };
  }
  
  // Get current commit
  const currentCommit = getCurrentCommitHash();
  if (!currentCommit) {
    if (!quiet) {
      console.log('⚠️  🔍 IndexNow: Could not determine git commit hash');
      console.log('   Skipping IndexNow notification.\n');
    }
    return { notified: 0, skipped: true, reason: 'no_commit' };
  }
  
  // Load state
  const state = loadState();
  
  // Check if we've already notified for this commit
  if (state.lastCommit === currentCommit && state.notifiedUrls[currentCommit]) {
    if (!quiet) {
      console.log('✅ 🔍 IndexNow: already notified for this commit\n');
    }
    return { notified: 0, skipped: true, reason: 'already_notified' };
  }
  
  // Get changed files
  const { added, modified } = getChangedFiles();
  
  // Filter for significant changes
  const significantFiles = [];
  
  // New posts (Added files)
  for (const file of added) {
    if (isNewPost(file)) {
      significantFiles.push(file);
    }
  }
  
  // Index page changes (Modified)
  for (const file of modified) {
    if (isIndexPage(file) || isStaticPage(file)) {
      significantFiles.push(file);
    }
  }
  
  if (significantFiles.length === 0) {
    if (!quiet) {
      console.log('✅ 🔍 IndexNow: no significant changes detected\n');
    }
    // Still update state to record we checked this commit
    state.lastCommit = currentCommit;
    if (!state.notifiedUrls[currentCommit]) {
      state.notifiedUrls[currentCommit] = [];
    }
    saveState(state);
    return { notified: 0, skipped: true, reason: 'no_significant_changes' };
  }
  
  // Map files to URLs
  const urls = [];
  for (const file of significantFiles) {
    const url = mapSourceFileToUrl(file);
    if (url) {
      urls.push(url);
    }
  }
  
  // Remove duplicates
  const uniqueUrls = [...new Set(urls)];
  
  // Check if we've already notified these URLs for this commit
  const alreadyNotified = state.notifiedUrls[currentCommit] || [];
  const newUrls = uniqueUrls.filter(url => !alreadyNotified.includes(url));
  
  if (newUrls.length === 0) {
    if (!quiet) {
      console.log('✅ 🔍 IndexNow: all URLs already notified for this commit\n');
    }
    return { notified: 0, skipped: true, reason: 'urls_already_notified' };
  }
  
  // Notify IndexNow
  try {
    const result = await notifyIndexNow(newUrls, apiKey, { dryRun });
    
    // Only update state if not dry-run
    if (!dryRun) {
      state.lastCommit = currentCommit;
      if (!state.notifiedUrls[currentCommit]) {
        state.notifiedUrls[currentCommit] = [];
      }
      state.notifiedUrls[currentCommit].push(...newUrls);
      
      // Clean up old commit entries (keep last 10 commits)
      const commitHashes = Object.keys(state.notifiedUrls).sort();
      if (commitHashes.length > 10) {
        const toRemove = commitHashes.slice(0, commitHashes.length - 10);
        for (const commit of toRemove) {
          delete state.notifiedUrls[commit];
        }
      }
      
      saveState(state);
    }
    
    if (!quiet) {
      if (dryRun) {
        console.log(`🧪 🔍 IndexNow: DRY RUN - would notify ${newUrls.length} URL${newUrls.length === 1 ? '' : 's'}`);
        if (newUrls.length <= 5) {
          newUrls.forEach(url => console.log(`   ${getSiteUrl()}${url}`));
        }
        console.log(`   Payload:`, JSON.stringify(result.payload, null, 2));
        console.log('');
      } else {
        console.log(`✅ 🔍 IndexNow: notified ${newUrls.length} URL${newUrls.length === 1 ? '' : 's'}`);
        if (newUrls.length <= 5) {
          newUrls.forEach(url => console.log(`   ${getSiteUrl()}${url}`));
        }
        console.log('');
      }
    }
    
    return { notified: newUrls.length, urls: newUrls, success: true, dryRun };
  } catch (error) {
    if (!quiet) {
      console.log(`❌ 🔍 IndexNow: notification failed`);
      console.error(`   ${error.message}\n`);
    }
    return { notified: 0, error: error.message, success: false };
  }
}

// Allow running as standalone script
if (require.main === module) {
  const quiet = process.argv.includes('--quiet');
  const dryRun = process.argv.includes('--dry-run') || process.argv.includes('--test');
  processIndexNow({ quiet, dryRun })
    .then(result => {
      if (result.error && !dryRun) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}

module.exports = { processIndexNow };

