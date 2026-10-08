// Load environment variables if .env exists
if (require('fs').existsSync('.env')) {
  const { loadDotenvSilently } = require('../../scripts/utils/env-utils');
  loadDotenvSilently();
}

module.exports = function() {
  // Get site domain from environment or default
  const domain = process.env.SITE_DOMAIN || 'jonplummer.com';
  const url = `https://${domain}`;

  // Branding: store primitives; derive compound title here only.
  // Consumers ask for one field — never concatenate author + tagline locally.
  const author = 'Jon Plummer';
  // Canonical tagline for <title>, OG, feeds, schema (stable site voice).
  const tagline = 'Making ideas tangible';
  // Lockup rotation pool (header only) — pick via page.url | taglineForPage.
  const taglines = [
    'Making ideas tangible',
    'Prove it, then ship it',
    'Build from understanding',
    'Three functions, one team',
    'Teach rather than tell',
    'Care shows up in the product',
    'Value turns up where the data leads',
    'Learn to build, build to learn',
    'Zoom out, then zoom in',
  ];
  const title = `${author} – ${tagline}`;

  return {
    domain: domain,
    url: url,
    author: author,
    tagline: tagline,
    taglines: taglines,
    title: title
  };
};
