#!/usr/bin/env node

/**
 * Network Utilities
 * 
 * Common network error handling and domain resolution functions
 */

/**
 * Get site domain from environment or default
 * @returns {string} Site domain
 */
function getSiteDomain() {
  const fs = require('fs');
  
  // Try to get from SITE_DOMAIN environment variable (loaded via dotenv)
  if (process.env.SITE_DOMAIN) {
    return process.env.SITE_DOMAIN.trim();
  }
  
  // Fallback: try to read from .env file directly (in case dotenv didn't load)
  if (fs.existsSync('.env')) {
    try {
      const envContent = fs.readFileSync('.env', 'utf8');
      const siteDomainMatch = envContent.match(/SITE_DOMAIN\s*=\s*(.+)/);
      if (siteDomainMatch) {
        return siteDomainMatch[1].trim();
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  // Default fallback
  return 'jonplummer.com';
}

/**
 * Get error type and recommendation for network errors
 * @param {Error} error - Network error
 * @param {string} url - URL that failed
 * @param {string} domain - Domain name
 * @returns {Object} { errorType, recommendation }
 */
function getNetworkErrorInfo(error, url, domain) {
  let errorType = 'connection error';
  let recommendation = `Cannot connect to ${url}. Check: 1) Site is live and accessible, 2) Domain DNS is configured correctly, 3) Network connectivity, 4) Firewall/proxy settings.`;
  
  if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
    errorType = 'DNS resolution failed';
    recommendation = `DNS lookup failed for ${domain}. Check: 1) Domain is correctly configured, 2) DNS records are propagated, 3) Domain name is correct in .env (SITE_DOMAIN). Verify with: dig ${domain}`;
  } else if (error.code === 'ECONNREFUSED') {
    errorType = 'connection refused';
    recommendation = `Connection refused to ${url}. Check: 1) Server is running, 2) Port 443 is open, 3) Firewall allows HTTPS connections.`;
  } else if (error.code === 'ETIMEDOUT') {
    errorType = 'connection timeout';
    recommendation = `Connection to ${url} timed out. Check: 1) Server is responding, 2) Network latency, 3) Firewall/proxy settings.`;
  } else if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
    errorType = 'certificate error';
    recommendation = `TLS certificate error for ${url}. Check: 1) Certificate is valid, 2) Certificate chain is complete, 3) System clock is correct.`;
  } else if (error.code === 'SELF_SIGNED_CERT') {
    errorType = 'certificate verification failed';
    recommendation = `Certificate verification failed for ${domain}. Check: 1) Certificate is valid, 2) Certificate chain is complete, 3) Certificate authority is trusted.`;
  }
  
  return { errorType, recommendation };
}

/**
 * Get TLS error type and recommendation
 * @param {Error} error - TLS error
 * @param {string} domain - Domain name
 * @returns {Object} { errorType, recommendation }
 */
function getTLSErrorInfo(error, domain) {
  let errorType = 'connection error';
  let recommendation = `Cannot connect to ${domain}:443. Check: 1) Server is running, 2) Port 443 is open, 3) Firewall allows HTTPS connections, 4) Domain DNS is configured.`;
  
  if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
    errorType = 'DNS resolution failed';
    recommendation = `DNS lookup failed for ${domain}. Check: 1) Domain is correctly configured, 2) DNS records are propagated, 3) Domain name is correct in .env (SITE_DOMAIN). Verify with: dig ${domain}`;
  } else if (error.code === 'ECONNREFUSED') {
    errorType = 'connection refused';
    recommendation = `Connection refused to ${domain}:443. Check: 1) Server is running, 2) Port 443 is open, 3) Firewall allows HTTPS connections.`;
  } else if (error.code === 'ETIMEDOUT') {
    errorType = 'connection timeout';
    recommendation = `Connection to ${domain}:443 timed out. Check: 1) Server is responding, 2) Network latency, 3) Firewall/proxy settings.`;
  } else if (error.code === 'CERT_HAS_EXPIRED') {
    errorType = 'certificate expired';
    recommendation = `Certificate for ${domain} has expired. Renew immediately to restore HTTPS functionality.`;
  } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || error.code === 'SELF_SIGNED_CERT') {
    errorType = 'certificate verification failed';
    recommendation = `Certificate verification failed for ${domain}. Check: 1) Certificate is valid, 2) Certificate chain is complete, 3) Certificate authority is trusted.`;
  }
  
  return { errorType, recommendation };
}

module.exports = {
  getSiteDomain,
  getNetworkErrorInfo,
  getTLSErrorInfo
};

