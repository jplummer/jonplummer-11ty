#!/usr/bin/env node

/**
 * Live Site Security Checks
 * 
 * Checks for security headers, TLS certificate, and DNS records
 */

const https = require('https');
const tls = require('tls');
const { execSync } = require('child_process');
const { getSiteDomain, getNetworkErrorInfo, getTLSErrorInfo } = require('../../utils/network-utils');

/**
 * Check security headers
 * @param {Object} results - Results object
 * @param {Function} addFinding - Function to add findings
 * @returns {Promise<boolean>} True if passed
 */
async function checkSecurityHeaders(results, addFinding) {
  const { runCheck } = require('../../utils/check-runner');
  return runCheck('Security headers', async () => {
    const domain = getSiteDomain();
    console.log(`    Using domain: ${domain}`);
    
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Strict-Transport-Security',
      'Content-Security-Policy'
    ];
    
    return new Promise((resolve) => {
      const url = `https://${domain}`;
      const req = https.get(url, { timeout: 10000 }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const headers = res.headers;
            const missing = [];
            const present = [];
            
            for (const header of requiredHeaders) {
              if (headers[header.toLowerCase()]) {
                present.push(header);
              } else {
                missing.push(header);
              }
            }
            
            if (missing.length > 0) {
              resolve({
                passed: false,
                warning: true,
                details: `Missing headers: ${missing.join(', ')}`,
                message: `Security headers: ${missing.length} missing`,
                finding: {
                  severity: 'medium',
                  description: `${missing.length} security header(s) missing on live site (${url})`,
                  recommendation: `Add missing security headers: ${missing.join(', ')}. Verify at securityheaders.com`,
                  details: { missing, present, url, statusCode: res.statusCode }
                }
              });
            } else {
              resolve({
                passed: true,
                details: `All ${requiredHeaders.length} security headers present`,
                message: 'Security headers: all present',
                finding: {
                  severity: 'info',
                  description: `All ${requiredHeaders.length} security headers present on live site (${url})`
                }
              });
            }
          } catch (parseError) {
            resolve({
              passed: false,
              details: `Failed to parse response from ${url}: ${parseError.message}`,
              message: 'Security headers: parse error',
              finding: {
                severity: 'high',
                description: `Failed to parse HTTP response from ${url}`,
                recommendation: `The server returned an unexpected response format. Check: 1) Site is accessible at ${url}, 2) Server is responding correctly, 3) Network connectivity. Alternatively, verify manually at securityheaders.com`,
                details: { url, error: parseError.message, statusCode: res.statusCode }
              }
            });
          }
        });
      });
      
      req.on('error', (error) => {
        const { errorType, recommendation } = getNetworkErrorInfo(error, url, domain);
        resolve({
          passed: false,
          details: `Could not check ${url}: ${errorType} (${error.code || error.message})`,
          message: `Security headers: ${errorType}`,
          finding: {
            severity: 'high',
            description: `Cannot check security headers on ${url}: ${errorType}`,
            recommendation,
            details: { url, errorCode: error.code, errorMessage: error.message, errorType }
          }
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          passed: false,
          details: `Request to ${url} timed out after 10 seconds`,
          message: 'Security headers: timeout',
          finding: {
            severity: 'high',
            description: `Request to ${url} timed out`,
            recommendation: `The server did not respond within 10 seconds. Check: 1) Site is accessible at ${url}, 2) Server is not overloaded, 3) Network connectivity, 4) Firewall/proxy settings. Alternatively, verify manually at securityheaders.com`,
            details: { url, timeout: 10000 }
          }
        });
      });
      
      req.setTimeout(10000);
    });
  }, results, addFinding);
}

/**
 * Check TLS certificate expiration
 * @param {Object} results - Results object
 * @param {Function} addFinding - Function to add findings
 * @returns {Promise<boolean>} True if passed
 */
async function checkCertificateExpiration(results, addFinding) {
  const { runCheck } = require('../../utils/check-runner');
  return runCheck('TLS certificate', async () => {
    const domain = getSiteDomain();
    console.log(`    Using domain: ${domain}`);
    
    return new Promise((resolve) => {
      const socket = tls.connect(443, domain, { servername: domain, rejectUnauthorized: false }, () => {
        try {
          const cert = socket.getPeerCertificate(true);
          socket.end();
          
          if (!cert) {
            resolve({
              passed: false,
              details: `No certificate received from ${domain}:443`,
              message: 'TLS certificate: no certificate',
              finding: {
                severity: 'high',
                description: `No TLS certificate received from ${domain}:443`,
                recommendation: `The server did not provide a certificate. Check: 1) HTTPS is properly configured, 2) Server is listening on port 443, 3) Certificate is installed. Verify manually: openssl s_client -connect ${domain}:443 -servername ${domain}`,
                details: { domain, port: 443 }
              }
            });
            return;
          }
          
          if (!cert.valid_to) {
            resolve({
              passed: false,
              details: `Certificate from ${domain} missing expiration date`,
              message: 'TLS certificate: invalid format',
              finding: {
                severity: 'high',
                description: `Certificate from ${domain} is missing expiration date`,
                recommendation: `The certificate structure is invalid or incomplete. Check: 1) Certificate is properly installed, 2) Certificate format is correct. Verify manually: openssl x509 -in certificate.crt -noout -dates`,
                details: { domain, certSubject: cert.subject }
              }
            });
            return;
          }
          
          const expirationDate = new Date(cert.valid_to);
          if (isNaN(expirationDate.getTime())) {
            resolve({
              passed: false,
              details: `Invalid certificate expiration date format: ${cert.valid_to}`,
              message: 'TLS certificate: invalid date',
              finding: {
                severity: 'high',
                description: `Certificate expiration date cannot be parsed: ${cert.valid_to}`,
                recommendation: `The certificate expiration date is in an unexpected format. Check: 1) Certificate is valid, 2) System date/time is correct. Verify manually: openssl x509 -in certificate.crt -noout -enddate`,
                details: { domain, expirationString: cert.valid_to }
              }
            });
            return;
          }
          
          const now = new Date();
          const daysUntilExpiry = Math.floor((expirationDate - now) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry < 0) {
            resolve({
              passed: false,
              details: `Certificate expired ${Math.abs(daysUntilExpiry)} days ago`,
              message: 'TLS certificate: expired',
              finding: {
                severity: 'critical',
                description: `TLS certificate for ${domain} expired ${Math.abs(daysUntilExpiry)} days ago`,
                recommendation: 'Renew certificate immediately to restore HTTPS functionality. Visitors will see security warnings.',
                details: { domain, expirationDate: cert.valid_to, daysExpired: Math.abs(daysUntilExpiry) }
              }
            });
          } else if (daysUntilExpiry < 30) {
            resolve({
              passed: false,
              warning: true,
              details: `Certificate expires in ${daysUntilExpiry} days`,
              message: `TLS certificate: expires in ${daysUntilExpiry} days`,
              finding: {
                severity: 'high',
                description: `TLS certificate for ${domain} expires in ${daysUntilExpiry} days`,
                recommendation: 'Renew certificate before expiration to avoid service interruption. Set up automatic renewal if possible.',
                details: { domain, expirationDate: cert.valid_to, daysUntilExpiry }
              }
            });
          } else {
            resolve({
              passed: true,
              details: `Certificate valid until ${expirationDate.toISOString().split('T')[0]} (${daysUntilExpiry} days)`,
              message: `TLS certificate: valid for ${daysUntilExpiry} days`,
              finding: {
                severity: 'info',
                description: `Certificate for ${domain} valid until ${expirationDate.toISOString().split('T')[0]}`
              }
            });
          }
        } catch (parseError) {
          socket.end();
          resolve({
            passed: false,
            details: `Failed to parse certificate from ${domain}: ${parseError.message}`,
            message: 'TLS certificate: parse error',
            finding: {
              severity: 'high',
              description: `Failed to parse certificate data from ${domain}`,
              recommendation: `Certificate data could not be processed. Check: 1) Certificate is valid, 2) TLS connection is working. Verify manually: openssl s_client -connect ${domain}:443 -servername ${domain}`,
              details: { domain, error: parseError.message }
            }
          });
        }
      });
      
      socket.on('error', (error) => {
        const { errorType, recommendation } = getTLSErrorInfo(error, domain);
        resolve({
          passed: false,
          details: `Could not check certificate for ${domain}: ${errorType} (${error.code || error.message})`,
          message: `TLS certificate: ${errorType}`,
          finding: {
            severity: 'high',
            description: `Cannot check TLS certificate for ${domain}: ${errorType}`,
            recommendation,
            details: { domain, errorCode: error.code, errorMessage: error.message, errorType }
          }
        });
      });
      
      socket.setTimeout(10000);
      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          passed: false,
          details: `Connection to ${domain}:443 timed out after 10 seconds`,
          message: 'TLS certificate: timeout',
          finding: {
            severity: 'high',
            description: `TLS connection to ${domain}:443 timed out`,
            recommendation: `The server did not respond within 10 seconds. Check: 1) Server is accessible, 2) Port 443 is open, 3) Network connectivity, 4) Firewall/proxy settings. Verify manually: openssl s_client -connect ${domain}:443 -servername ${domain}`,
            details: { domain, port: 443, timeout: 10000 }
          }
        });
      });
    });
  }, results, addFinding);
}

/**
 * Check DNS records
 * @param {Object} results - Results object
 * @param {Function} addFinding - Function to add findings
 * @returns {Promise<boolean>} True if passed
 */
async function checkDNSRecords(results, addFinding) {
  const { runCheck } = require('../../utils/check-runner');
  return runCheck('DNS records', async () => {
    const domain = getSiteDomain();
    console.log(`    Using domain: ${domain}`);
    
    try {
      execSync('which dig', { stdio: 'pipe' });
    } catch (error) {
      return {
        passed: false,
        details: 'dig command not found - cannot check DNS records',
        message: 'DNS records: dig not available',
        finding: {
          severity: 'medium',
          description: `dig command is not available on this system`,
          recommendation: `Install dig to enable DNS checking: macOS (brew install bind), Ubuntu/Debian (sudo apt-get install dnsutils), or verify manually: nslookup ${domain} or use online DNS lookup tools`,
          details: { domain, tool: 'dig' }
        }
      };
    }
    
    try {
      const output = execSync(`dig +short ${domain} A`, { encoding: 'utf8', stdio: 'pipe', timeout: 10000 });
      
      if (!output || output.trim().length === 0) {
        return {
          passed: false,
          details: `No DNS response for ${domain} - domain may not be configured`,
          message: 'DNS records: no response',
          finding: {
            severity: 'high',
            description: `No DNS A records found for ${domain}`,
            recommendation: `DNS lookup returned no results. Check: 1) Domain is correctly configured, 2) DNS records are propagated, 3) Domain name is correct in .env (SITE_DOMAIN). Verify with: dig ${domain} A or nslookup ${domain}`,
            details: { domain }
          }
        };
      }
      
      const records = output.trim().split('\n').filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith(';') && /^\d+\.\d+\.\d+\.\d+$/.test(trimmed);
      });
      
      if (records.length === 0) {
        const errorIndicators = ['NXDOMAIN', 'SERVFAIL', 'REFUSED', 'timeout'];
        const hasError = errorIndicators.some(indicator => output.includes(indicator));
        
        if (hasError) {
          return {
            passed: false,
            details: `DNS lookup failed for ${domain}: ${output.trim()}`,
            message: 'DNS records: lookup failed',
            finding: {
              severity: 'high',
              description: `DNS lookup failed for ${domain}`,
              recommendation: `DNS query returned an error. Check: 1) Domain exists and is registered, 2) DNS servers are responding, 3) Domain name is correct. Verify with: dig ${domain} A or check DNS configuration with your registrar`,
              details: { domain, digOutput: output.trim() }
            }
          };
        }
        
        return {
          passed: false,
          details: `No valid A records found for ${domain} (output: ${output.trim().substring(0, 100)})`,
          message: 'DNS records: no A records',
          finding: {
            severity: 'high',
            description: `No valid A records found for ${domain}`,
            recommendation: `DNS lookup did not return valid IPv4 addresses. Check: 1) A records are configured, 2) DNS records are propagated, 3) Domain is pointing to correct IP. Verify with: dig ${domain} A`,
            details: { domain, digOutput: output.trim() }
          }
        };
      }
      
      const invalidIPs = records.filter(ip => !/^\d+\.\d+\.\d+\.\d+$/.test(ip));
      if (invalidIPs.length > 0) {
        return {
          passed: false,
          warning: true,
          details: `Some DNS records appear invalid: ${invalidIPs.join(', ')}`,
          message: 'DNS records: invalid format',
          finding: {
            severity: 'medium',
            description: `Some DNS A records for ${domain} appear invalid`,
            recommendation: `Review DNS configuration. Valid records found: ${records.filter(ip => /^\d+\.\d+\.\d+\.\d+$/.test(ip)).join(', ')}. Invalid: ${invalidIPs.join(', ')}`,
            details: { domain, validRecords: records.filter(ip => /^\d+\.\d+\.\d+\.\d+$/.test(ip)), invalidRecords: invalidIPs }
          }
        };
      }
      
      return {
        passed: true,
        details: `DNS A records found: ${records.length} record(s) - ${records.join(', ')}`,
        message: `DNS records: ${records.length} A record(s) found`,
        finding: {
          severity: 'info',
          description: `DNS A records configured for ${domain} (${records.length} record(s): ${records.join(', ')})`
        }
      };
    } catch (error) {
      let errorType = 'execution error';
      let recommendation = `Failed to execute dig command. Check: 1) dig is installed and in PATH, 2) Network connectivity, 3) DNS servers are accessible.`;
      
      if (error.code === 'ENOENT') {
        errorType = 'command not found';
        recommendation = `dig command not found. Install: macOS (brew install bind), Ubuntu/Debian (sudo apt-get install dnsutils). Alternatively, verify manually: nslookup ${domain}`;
      } else if (error.signal === 'SIGTERM' || error.signal === 'SIGKILL') {
        errorType = 'timeout';
        recommendation = `dig command timed out. Check: 1) DNS servers are responding, 2) Network connectivity, 3) Firewall settings. Verify manually: dig ${domain} A`;
      } else if (error.stderr) {
        errorType = 'DNS query error';
        recommendation = `DNS query failed. Check: 1) Domain is correctly configured, 2) DNS servers are accessible, 3) Domain name is correct. Error: ${error.stderr.toString().trim()}`;
      }
      
      return {
        passed: false,
        details: `Could not check DNS for ${domain}: ${errorType} (${error.message || error.code || 'unknown'})`,
        message: `DNS records: ${errorType}`,
        finding: {
          severity: 'high',
          description: `Cannot check DNS records for ${domain}: ${errorType}`,
          recommendation,
          details: { domain, errorCode: error.code, errorMessage: error.message, errorSignal: error.signal, errorType }
        }
      };
    }
  }, results, addFinding);
}

module.exports = {
  checkSecurityHeaders,
  checkCertificateExpiration,
  checkDNSRecords
};

