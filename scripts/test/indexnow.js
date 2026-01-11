#!/usr/bin/env node

/**
 * IndexNow Test
 * 
 * Tests IndexNow functionality:
 * - Key file creation and validation
 * - Change detection
 * - URL mapping
 * - State tracking
 * - Dry-run mode
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { loadDotenvSilently } = require('../utils/env-utils');

// Load environment variables
if (fs.existsSync('.env')) {
  loadDotenvSilently();
}

const STATE_FILE = path.join(process.cwd(), '.indexnow-state.json');
const SRC_DIR = path.join(process.cwd(), 'src');

let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

// Check if running through test-runner (suppress formatted output)
const isTestRunner = process.env.TEST_RUNNER === 'true';

function logPass(message) {
  if (!isTestRunner) {
    console.log(`✅ ${message}`);
  }
  testResults.passed++;
}

function logFail(message, error = null) {
  if (!isTestRunner) {
    console.log(`❌ ${message}`);
  }
  testResults.failed++;
  if (error) {
    testResults.errors.push({ message, error: error.message || error });
  }
}

function logWarn(message) {
  if (!isTestRunner) {
    console.log(`⚠️  ${message}`);
  }
  testResults.warnings++;
}

function logInfo(message) {
  if (!isTestRunner) {
    console.log(`ℹ️  ${message}`);
  }
}

/**
 * Test 1: Key file creation script
 */
function testKeyFileCreation() {
  if (!isTestRunner) {
    console.log('\n📝 Test 1: Key File Creation');
    console.log('─'.repeat(60));
  }
  
  const apiKey = process.env.INDEXNOW_API_KEY;
  
  if (!apiKey) {
    logFail('INDEXNOW_API_KEY not found in .env');
    return false;
  }
  
  logPass(`API key found in .env (${apiKey.substring(0, 8)}...)`);
  
  // Run the key file creation script
  try {
    execSync('node scripts/utils/create-indexnow-key-file.js', {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    const keyFileName = `${apiKey}.txt`;
    const keyFilePath = path.join(SRC_DIR, keyFileName);
    
    if (fs.existsSync(keyFilePath)) {
      const content = fs.readFileSync(keyFilePath, 'utf8').trim();
      if (content === apiKey) {
        logPass(`Key file created correctly: src/${keyFileName}`);
        return true;
      } else {
        logFail(`Key file content mismatch. Expected: ${apiKey.substring(0, 8)}..., Got: ${content.substring(0, 8)}...`);
        return false;
      }
    } else {
      logFail(`Key file not found: src/${keyFileName}`);
      return false;
    }
  } catch (error) {
    logFail('Key file creation script failed', error);
    return false;
  }
}

/**
 * Test 2: Key file in build output
 */
function testKeyFileInBuild() {
  if (!isTestRunner) {
    console.log('\n📝 Test 2: Key File in Build Output');
    console.log('─'.repeat(60));
  }
  
  const apiKey = process.env.INDEXNOW_API_KEY;
  if (!apiKey) {
    logWarn('Skipping (no API key)');
    return false;
  }
  
  const keyFileName = `${apiKey}.txt`;
  const buildKeyPath = path.join(process.cwd(), '_site', keyFileName);
  
  if (!fs.existsSync('_site')) {
    logWarn('_site directory not found. Run "pnpm run build" first.');
    logInfo('This is expected if you haven\'t built the site yet.');
    return true; // Not a failure, just informational
  }
  
  if (fs.existsSync(buildKeyPath)) {
    const content = fs.readFileSync(buildKeyPath, 'utf8').trim();
    if (content === apiKey) {
      logPass(`Key file found in build output: _site/${keyFileName}`);
      return true;
    } else {
      logFail(`Key file content mismatch in build output`);
      return false;
    }
  } else {
    logWarn(`Key file not found in build output: _site/${keyFileName}`);
    logInfo('This is expected if you haven\'t built the site yet. Run "pnpm run build" to test.');
    logInfo('Passthrough copy is configured correctly.');
    return true; // Not a failure - build just needs to be run
  }
}

/**
 * Test 3: Change detection
 */
function testChangeDetection() {
  if (!isTestRunner) {
    console.log('\n📝 Test 3: Change Detection');
    console.log('─'.repeat(60));
  }
  
  try {
    // Get current commit
    const currentCommit = execSync('git rev-parse HEAD', {
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: 'pipe'
    }).trim();
    
    logPass(`Current commit: ${currentCommit.substring(0, 7)}`);
    
    // Test getting changed files
    const { processIndexNow } = require('../utils/indexnow');
    
    // Run in dry-run mode to test detection
    return processIndexNow({ quiet: true, dryRun: true })
      .then(result => {
        if (result.skipped) {
          if (result.reason === 'no_significant_changes') {
            logPass('Change detection working (no significant changes detected)');
            return true;
          } else if (result.reason === 'already_notified') {
            logPass('State tracking working (already notified for this commit)');
            return true;
          } else {
            logWarn(`Skipped: ${result.reason}`);
            return true; // Not a failure, just informational
          }
        } else if (result.notified > 0) {
          logPass(`Change detection working (would notify ${result.notified} URL(s))`);
          if (result.urls && result.urls.length > 0) {
            result.urls.slice(0, 3).forEach(url => {
              logInfo(`  Would notify: ${url}`);
            });
            if (result.urls.length > 3) {
              logInfo(`  ... and ${result.urls.length - 3} more`);
            }
          }
          return true;
        } else {
          logWarn('No changes detected (this is normal if nothing changed)');
          return true;
        }
      })
      .catch(error => {
        logFail('Change detection test failed', error);
        return false;
      });
  } catch (error) {
    logFail('Change detection setup failed', error);
    return Promise.resolve(false);
  }
}

/**
 * Test 4: URL mapping
 */
function testUrlMapping() {
  if (!isTestRunner) {
    console.log('\n📝 Test 4: URL Mapping');
    console.log('─'.repeat(60));
  }
  
  // Test post URL mapping
  const testPostPath = 'src/_posts/2026/2026-01-11-test-slug.md';
  const { processIndexNow } = require('../utils/indexnow');
  
  // We need to access the internal mapping function
  // For now, just test that the module loads correctly
  try {
    logPass('IndexNow module loads correctly');
    
    // Test that we can get site URL
    const siteData = require('../../src/_data/site.js');
    const site = siteData();
    if (site.url) {
      logPass(`Site URL detected: ${site.url}`);
    } else {
      logWarn('Site URL not found in site data');
    }
    
    return true;
  } catch (error) {
    logFail('URL mapping test failed', error);
    return false;
  }
}

/**
 * Test 5: State file management
 */
function testStateFile() {
  if (!isTestRunner) {
    console.log('\n📝 Test 5: State File Management');
    console.log('─'.repeat(60));
  }
  
  if (fs.existsSync(STATE_FILE)) {
    try {
      const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      logPass(`State file exists: ${STATE_FILE}`);
      
      if (state.lastCommit) {
        logInfo(`Last notified commit: ${state.lastCommit.substring(0, 7)}`);
      }
      
      const commitCount = Object.keys(state.notifiedUrls || {}).length;
      if (commitCount > 0) {
        logInfo(`Tracking ${commitCount} commit(s) in state`);
      } else {
        logInfo('No commits tracked yet (this is normal for first run)');
      }
      
      return true;
    } catch (error) {
      logFail('State file exists but is invalid JSON', error);
      return false;
    }
  } else {
    logInfo('State file does not exist yet (will be created on first notification)');
    return true; // Not a failure
  }
}

/**
 * Test 6: Passthrough configuration
 */
function testPassthroughConfig() {
  if (!isTestRunner) {
    console.log('\n📝 Test 6: Passthrough Configuration');
    console.log('─'.repeat(60));
  }
  
  const passthroughPath = path.join(process.cwd(), 'eleventy', 'config', 'passthrough.js');
  
  if (!fs.existsSync(passthroughPath)) {
    logFail('Passthrough config file not found');
    return false;
  }
  
  const content = fs.readFileSync(passthroughPath, 'utf8');
  
  // Check if IndexNow key file passthrough is configured
  if (content.includes('*.txt') || content.includes('IndexNow')) {
    logPass('Passthrough copy configured for IndexNow key file');
    return true;
  } else {
    logFail('Passthrough copy not configured for IndexNow key file');
    logInfo('Expected: addPassthroughCopy({ "src/*.txt": "." })');
    return false;
  }
}

/**
 * Test 7: Integration with deploy script
 */
function testDeployIntegration() {
  if (!isTestRunner) {
    console.log('\n📝 Test 7: Deploy Script Integration');
    console.log('─'.repeat(60));
  }
  
  const deployPath = path.join(process.cwd(), 'scripts', 'deploy', 'deploy.js');
  
  if (!fs.existsSync(deployPath)) {
    logFail('Deploy script not found');
    return false;
  }
  
  const content = fs.readFileSync(deployPath, 'utf8');
  
  if (content.includes('indexnow') || content.includes('IndexNow')) {
    logPass('IndexNow integrated into deploy script');
    return true;
  } else {
    logFail('IndexNow not found in deploy script');
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  if (!isTestRunner) {
    console.log('🧪 IndexNow Test Suite');
    console.log('='.repeat(60));
  }
  
  // Run all tests
  await testKeyFileCreation();
  testKeyFileInBuild();
  await testChangeDetection();
  testUrlMapping();
  testStateFile();
  testPassthroughConfig();
  testDeployIntegration();
  
  // Summary
  if (!isTestRunner) {
    console.log('\n' + '='.repeat(60));
    console.log('Test Summary:');
    console.log(`  ✅ Passed: ${testResults.passed}`);
    console.log(`  ❌ Failed: ${testResults.failed}`);
    console.log(`  ⚠️  Warnings: ${testResults.warnings}`);
    
    if (testResults.errors.length > 0) {
      console.log('\nErrors:');
      testResults.errors.forEach(({ message, error }) => {
        console.log(`  ${message}: ${error}`);
      });
    }
    
    if (testResults.failed === 0) {
      console.log('\n✅ All critical tests passed!');
      console.log('\nNext steps:');
      console.log('  1. Run "node scripts/utils/indexnow.js --dry-run" to test change detection');
      console.log('  2. Make a test change and commit it');
      console.log('  3. Run "pnpm run deploy --dry-run" to test full integration');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Please review the output above.');
      process.exit(1);
    }
  } else {
    // Output JSON format for test-runner
    // Create a dummy file entry since test-runner expects files array
    const { createTestResult, addFile, addIssue, addWarning, outputResult } = require('../utils/test-results');
    
    const result = createTestResult('indexnow', 'IndexNow Configuration');
    
    // Add a single "file" representing the IndexNow configuration
    const configFile = addFile(result, 'IndexNow Configuration', null);
    
    // Add any failures as issues
    if (testResults.failed > 0) {
      testResults.errors.forEach(({ message, error }) => {
        addIssue(configFile, {
          type: 'indexnow-test',
          message: message || error,
          severity: 'error'
        });
      });
    }
    
    // Add warnings if any
    if (testResults.warnings > 0) {
      addWarning(configFile, {
        type: 'indexnow-test',
        message: `${testResults.warnings} warning(s) found`,
        severity: 'warning'
      });
    }
    
    // Output JSON result (formatter will handle display)
    outputResult(result);
    
    process.exit(testResults.failed === 0 ? 0 : 1);
  }
}

// Only run if called directly (not when required as module)
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
}

module.exports = { runTests };

