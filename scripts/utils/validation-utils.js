#!/usr/bin/env node

/**
 * Validation Utilities
 * 
 * Common validation functions used across multiple tests
 */

/**
 * Validate title length
 * @param {string} title - Title to validate
 * @param {number} minLength - Minimum length (default: 30)
 * @param {number} maxLength - Maximum length (default: 60)
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateTitle(title, minLength = 30, maxLength = 60) {
  if (!title) {
    return { valid: false, error: 'Missing title' };
  }
  
  if (typeof title !== 'string') {
    return { valid: false, error: 'Title must be a string' };
  }
  
  const trimmed = title.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Empty title' };
  }
  
  if (trimmed.length < minLength) {
    return { valid: false, error: `Title too short (should be ${minLength}-${maxLength} characters)` };
  }
  
  if (trimmed.length > maxLength) {
    return { valid: false, error: `Title too long (should be ${minLength}-${maxLength} characters)` };
  }
  
  return { valid: true };
}

/**
 * Validate meta description length
 * @param {string} description - Description to validate
 * @param {number} minLength - Minimum length (default: 120)
 * @param {number} maxLength - Maximum length (default: 160)
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateMetaDescription(description, minLength = 120, maxLength = 160) {
  if (!description) {
    return { valid: false, error: 'Missing meta description' };
  }
  
  if (typeof description !== 'string') {
    return { valid: false, error: 'Meta description must be a string' };
  }
  
  const trimmed = description.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Empty meta description' };
  }
  
  if (trimmed.length < minLength) {
    return { valid: false, error: `Meta description too short (should be ${minLength}-${maxLength} characters)` };
  }
  
  if (trimmed.length > maxLength) {
    return { valid: false, error: `Meta description too long (should be ${minLength}-${maxLength} characters)` };
  }
  
  return { valid: true };
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @param {boolean} requireProtocol - Require http/https (default: true)
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateUrl(url, requireProtocol = true) {
  if (!url) {
    return { valid: false, error: 'Missing URL' };
  }
  
  if (typeof url !== 'string') {
    return { valid: false, error: 'URL must be a string' };
  }
  
  const trimmed = url.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Empty URL' };
  }
  
  if (requireProtocol) {
    try {
      const urlObj = new URL(trimmed);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { valid: false, error: 'URL must use http or https protocol' };
      }
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' };
    }
  }
  
  return { valid: true };
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} dateString - Date string to validate
 * @returns {Object} { valid: boolean, error?: string, date?: Date }
 */
function validateDate(dateString) {
  if (!dateString) {
    return { valid: false, error: 'Missing date' };
  }
  
  if (typeof dateString !== 'string') {
    return { valid: false, error: 'Date must be a string' };
  }
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return { valid: false, error: 'Date must be in YYYY-MM-DD format' };
  }
  
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Validate ranges
  if (year < 2000 || year > 2100) {
    return { valid: false, error: 'Year must be between 2000 and 2100' };
  }
  if (month < 1 || month > 12) {
    return { valid: false, error: 'Month must be between 1 and 12' };
  }
  if (day < 1 || day > 31) {
    return { valid: false, error: 'Day must be between 1 and 31' };
  }
  
  // Create date to check validity
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year ||
      date.getMonth() + 1 !== month ||
      date.getDate() !== day) {
    return { valid: false, error: 'Invalid date (e.g., 2025-02-30)' };
  }
  
  return { valid: true, date: date };
}

/**
 * Validate slug format
 * @param {string} slug - Slug to validate
 * @param {number} minLength - Minimum length (default: 3)
 * @param {number} maxLength - Maximum length (default: 250)
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateSlug(slug, minLength = 3, maxLength = 250) {
  if (!slug) {
    return { valid: false, error: 'Missing slug' };
  }
  
  if (typeof slug !== 'string') {
    return { valid: false, error: 'Slug must be a string' };
  }
  
  const slugRegex = /^[a-z0-9-_]+$/;
  if (!slugRegex.test(slug)) {
    return { valid: false, error: 'Invalid slug format (should be lowercase with hyphens or underscores)' };
  }
  
  if (slug.length < minLength) {
    return { valid: false, error: `Slug too short (minimum ${minLength} characters)` };
  }
  
  if (slug.length > maxLength) {
    return { valid: false, error: `Slug too long (maximum ${maxLength} characters)` };
  }
  
  return { valid: true };
}

module.exports = {
  validateTitle,
  validateMetaDescription,
  validateUrl,
  validateDate,
  validateSlug
};

