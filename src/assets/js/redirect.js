/**
 * Redirect script for handling URL redirects
 * 
 * This script reads the redirect URL from a data attribute on the body element
 * and performs a JavaScript redirect. It's used in conjunction with meta refresh
 * and canonical links to ensure reliable redirection.
 */

(function() {
  'use strict';
  
  // Get redirect URL from data attribute
  const body = document.body;
  const redirectUrl = body ? body.getAttribute('data-redirect-url') : null;
  
  if (redirectUrl) {
    // Perform redirect
    window.location.href = redirectUrl;
  }
})();

