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
  const tagline = 'Making ideas tangible';
  const title = `${author} – ${tagline}`;

  return {
    domain: domain,
    url: url,
    author: author,
    tagline: tagline,
    title: title
  };
};
