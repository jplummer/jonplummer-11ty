#!/usr/bin/env node

/**
 * Generates Apache .htaccess redirect rules from redirects.yaml data file
 * 
 * Reads redirects from src/_data/redirects.yaml and appends Redirect 301 rules
 * to src/.htaccess, preserving existing .htaccess content.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const REDIRECTS_DATA_FILE = path.join(process.cwd(), 'src', '_data', 'redirects.yaml');
const HTACCESS_FILE = path.join(process.cwd(), 'src', '.htaccess');
const REDIRECT_MARKER_START = '# Redirects (auto-generated - do not edit manually)';
const REDIRECT_MARKER_END = '# End redirects';

function generateRedirects() {
  // Read redirects data
  if (!fs.existsSync(REDIRECTS_DATA_FILE)) {
    console.warn(`⚠️  Redirects data file not found: ${REDIRECTS_DATA_FILE}`);
    console.warn('   No redirects will be generated.');
    return;
  }

  const redirectsData = yaml.load(fs.readFileSync(REDIRECTS_DATA_FILE, 'utf8'));
  const redirects = redirectsData?.redirects || [];

  if (redirects.length === 0) {
    console.log('ℹ️  No redirects found in redirects.yaml');
    return;
  }

  // Read existing .htaccess
  if (!fs.existsSync(HTACCESS_FILE)) {
    console.error(`❌ .htaccess file not found: ${HTACCESS_FILE}`);
    process.exit(1);
  }

  let htaccessContent = fs.readFileSync(HTACCESS_FILE, 'utf8');

  // Remove existing auto-generated redirect section if present
  const redirectStartIndex = htaccessContent.indexOf(REDIRECT_MARKER_START);
  const redirectEndIndex = htaccessContent.indexOf(REDIRECT_MARKER_END);
  
  if (redirectStartIndex !== -1 && redirectEndIndex !== -1) {
    // Remove existing redirect section
    const beforeRedirects = htaccessContent.substring(0, redirectStartIndex).trimEnd();
    const afterRedirects = htaccessContent.substring(redirectEndIndex + REDIRECT_MARKER_END.length).trimStart();
    htaccessContent = beforeRedirects + (afterRedirects ? '\n\n' + afterRedirects : '');
  }

  // Generate redirect rules
  const redirectRules = [
    '',
    REDIRECT_MARKER_START,
    '# Generated from src/_data/redirects.yaml',
    '# To add redirects, edit redirects.yaml and rebuild',
    ''
  ];

  for (const redirect of redirects) {
    const from = redirect.from;
    const to = redirect.to;
    
    // Ensure paths have proper format
    const fromPath = from.startsWith('/') ? from : '/' + from;
    const toPath = to.startsWith('http') ? to : (to.startsWith('/') ? to : '/' + to);
    
    // Apache Redirect directive: Redirect [status] old-path new-path
    redirectRules.push(`Redirect 301 ${fromPath} ${toPath}`);
  }

  redirectRules.push(REDIRECT_MARKER_END);

  // Append redirect section to .htaccess
  const updatedContent = htaccessContent.trimEnd() + '\n\n' + redirectRules.join('\n') + '\n';
  
  // Write updated .htaccess
  fs.writeFileSync(HTACCESS_FILE, updatedContent, 'utf8');
  
  console.log(`✅ Generated ${redirects.length} redirect rule(s) in .htaccess`);
}

if (require.main === module) {
  generateRedirects();
}

module.exports = { generateRedirects };
