// Load environment variables if .env exists
if (require('fs').existsSync('.env')) {
  require('dotenv').config();
}

module.exports = function() {
  // Get site domain from environment or default
  const domain = process.env.SITE_DOMAIN || 'jonplummer.com';
  const url = `https://${domain}`;
  
  return {
    domain: domain,
    url: url
  };
};

