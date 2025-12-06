#!/usr/bin/env node

/**
 * Simple Deploy Script
 * 
 * Uses rsync to sync files to remote server with minimal complexity.
 * Preserves rsync's native output and error messages.
 * 
 * Requirements:
 * - rsync must be installed
 * - SSH access to remote server (passwordless SSH key authentication)
 * - .env file with DEPLOY_HOST, DEPLOY_USERNAME, DEPLOY_REMOTE_PATH
 * 
 * Options:
 * - --skip-checks: Skip validation checks (not recommended)
 * - --dry-run: Run all checks and show what would be deployed, but don't actually deploy
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Check for command-line flags
const skipChecks = process.argv.includes('--skip-checks');
const dryRun = process.argv.includes('--dry-run');

// Debug: Log received arguments (helpful for troubleshooting)
if (process.env.DEBUG_DEPLOY) {
  console.log('Debug: process.argv =', process.argv);
  console.log('Debug: skipChecks =', skipChecks);
  console.log('Debug: dryRun =', dryRun);
  console.log('');
}

if (dryRun) {
  console.log('🧪 Dry run mode: Testing deployment without actually deploying...\n');
} else {
  console.log('🚀 Deploying via rsync...\n');
}

// Configuration
const config = {
  host: 'your-domain.com',
  username: 'your-username',
  remotePath: '/home/your-username/your-domain.com/',
  localPath: './_site/'
};

// Load .env configuration
if (fs.existsSync('.env')) {
  require('dotenv').config();
  config.host = process.env.DEPLOY_HOST || config.host;
  config.username = process.env.DEPLOY_USERNAME || config.username;
  config.remotePath = process.env.DEPLOY_REMOTE_PATH || config.remotePath;
}

// Get public site domain for final message (not SSH hostname)
let siteDomain = process.env.SITE_DOMAIN || 'jonplummer.com';

// Check if _site directory exists
if (!fs.existsSync('./_site')) {
  console.error('❌ _site directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Regenerate changelog before deployment
console.log('📋 Regenerating CHANGELOG.md...');
try {
  execSync('node scripts/content/generate-changelog.js', { stdio: 'pipe' });
  console.log('   ✓ Changelog updated\n');
} catch (error) {
  console.warn('   ⚠️  Warning: Could not regenerate changelog (continuing anyway)');
  console.warn(`      ${error.message}\n`);
}

// Rebuild the site to include the new changelog
console.log('🏗️  Rebuilding site...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('   ✓ Build completed\n');
} catch (error) {
  console.error('❌ Build failed. Aborting deployment.');
  process.exit(1);
}

// Pre-deploy validation checks

if (!skipChecks) {
  console.log('🔍 Running pre-deploy validation...\n');
  
  try {
    // Pre-build test (doesn't require _site/)
    console.log('   Running markdown validation...');
    execSync('npm run test markdown', { stdio: 'inherit' });
    
    // Post-build test (requires _site/, validates YAML + post structure)
    if (fs.existsSync('./_site')) {
      console.log('\n   Running content structure validation...');
      execSync('npm run test content-structure', { stdio: 'inherit' });
    } else {
      console.log('   ⚠️  Skipping content test (requires _site/ directory)');
    }
    
    console.log('\n✅ All pre-deploy checks passed\n');
  } catch (error) {
    console.error('\n❌ Pre-deploy validation failed. Fix errors before deploying.');
    console.error('   To skip checks (not recommended): npm run deploy --skip-checks\n');
    process.exit(1);
  }
} else {
  console.log('⚠️  Skipping pre-deploy validation (--skip-checks flag used)\n');
}

// Generate OG images before deploy (incremental - only generates what's needed)
if (!process.argv.includes('--skip-checks')) {
  try {
    console.log('🖼️  Generating OG images...');
    execSync('npm run generate-og-images', { stdio: 'inherit' });
    console.log('');
    
    // Rebuild to include any frontmatter changes from OG image generation
    console.log('🏗️  Rebuilding site to include OG image updates...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('   ✓ Build completed\n');
    
    // Validate OG images for all generated pages
    console.log('   Validating OG images for all pages...');
    execSync('npm run test og-images', { stdio: 'inherit' });
    console.log('');
  } catch (error) {
    console.error('\n❌ OG image check failed. Fix errors before deploying.\n');
    process.exit(1);
  }
}

// Check if rsync is available
function checkRsync() {
  try {
    execSync('which rsync', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function deploy() {
  try {
    // Check prerequisites
    if (!checkRsync()) {
      console.error('❌ rsync is not installed or not in PATH.');
      console.error('   Please install rsync:');
      console.error('   - macOS: brew install rsync');
      console.error('   - Ubuntu/Debian: sudo apt-get install rsync');
      console.error('   - Windows: Install WSL or use Git Bash');
      process.exit(1);
    }

    if (dryRun) {
      console.log('📤 Would sync files with rsync (dry run)...');
    } else {
      console.log('📤 Syncing files with rsync...');
    }
    console.log(`   Local: ${config.localPath}`);
    console.log(`   Remote: ${config.username}@${config.host}:${config.remotePath}`);

    // Build rsync command (SSH key authentication is automatic)
    const rsyncCommand = [
      'rsync',
      '-az', // Archive mode, compress
      '--delete', // Delete files on remote that don't exist locally
      '--exclude=.DS_Store', // Exclude macOS metadata files
      '--exclude=Thumbs.db', // Exclude Windows thumbnail files
      '--exclude=*.tmp', // Exclude temporary files
      '--progress', // Show progress
      '--stats', // Show transfer statistics
    ];

    // Add --dry-run flag if in dry-run mode
    if (dryRun) {
      rsyncCommand.push('--dry-run');
      rsyncCommand.push('-v'); // Verbose output for dry-run
    }

    rsyncCommand.push(`${config.localPath}`); // Source directory
    rsyncCommand.push(`${config.username}@${config.host}:${config.remotePath}`); // Destination

    if (dryRun) {
      console.log('\n🔄 Running rsync dry-run (showing what would be deployed)...\n');
    } else {
      console.log('\n🔄 Running rsync...\n');
    }

    // Safety check: NEVER deploy if dryRun is true, even if rsync flag is missing
    if (dryRun && !rsyncCommand.includes('--dry-run')) {
      console.error('\n❌ SAFETY CHECK FAILED: dryRun is true but rsync --dry-run flag is missing!');
      console.error('   This should never happen. Aborting to prevent accidental deployment.');
      process.exit(1);
    }

    // Execute rsync with native output (SSH key authentication is automatic)
    try {
      execSync(rsyncCommand.join(' '), {
        stdio: 'inherit' // Show rsync's native output
      });

      if (dryRun) {
        console.log('\n✅ Dry run completed successfully!');
        console.log('   No files were actually deployed.');
        console.log('   Run without --dry-run to perform the actual deployment.');
      } else {
        console.log('\n✅ Deployment completed successfully!');
        console.log(`🌐 Your site should be live at: https://${siteDomain}`);
      }

    } catch (error) {
      console.error('\n❌ Deployment failed:');
      console.error(`   Exit code: ${error.status}`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Deployment failed:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

deploy();
