#!/usr/bin/env node

/**
 * YAML Links Utilities
 * 
 * Utilities for formatting and manipulating links.yaml structure
 * Used by link capture form and other tools that modify links.yaml
 */

const yaml = require('js-yaml');
const { formatYamlString } = require('./frontmatter-utils');

/**
 * Format a single link object for YAML output
 * @param {Object} link - Link object with url, title, optional description
 * @returns {string} Formatted YAML string for the link
 */
function formatLinkYaml(link) {
  const parts = [];
  
  // URL is always required and should be quoted
  parts.push(`  - url: ${formatYamlString(link.url)}`);
  
  // Title is required and should be quoted if needed
  parts.push(`    title: ${formatYamlString(link.title)}`);
  
  // Description is optional, but if present should be quoted
  if (link.description !== undefined && link.description !== null && link.description !== '') {
    parts.push(`    description: ${formatYamlString(link.description)}`);
  }
  
  return parts.join('\n');
}

/**
 * Add a link to existing links.yaml content
 * @param {string} yamlContent - Current links.yaml content
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Object} link - Link object with url, title, optional description
 * @returns {string} Updated YAML content
 */
function addLinkToYaml(yamlContent, date, link) {
  // Parse YAML using JSON schema to prevent date conversion
  let data;
  try {
    data = yaml.load(yamlContent, { schema: yaml.JSON_SCHEMA });
  } catch (error) {
    throw new Error(`Failed to parse YAML: ${error.message}`);
  }
  
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid YAML structure: root must be an object');
  }
  
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
  }
  
  // Validate link structure
  if (!link.url || !link.title) {
    throw new Error('Link must have url and title');
  }
  
  // Add link to date entry (create date entry if it doesn't exist)
  if (!data[date]) {
    data[date] = [];
  }
  
  // Add link to array
  data[date].push({
    url: link.url.trim(),
    title: link.title.trim(),
    description: link.description ? link.description.trim() : undefined
  });
  
  // Sort date keys (newest first) - convert to array, sort, rebuild object
  const sortedDates = Object.keys(data).sort((a, b) => {
    // Compare as strings (YYYY-MM-DD format sorts correctly)
    return b.localeCompare(a);
  });
  
  const sortedData = {};
  for (const dateKey of sortedDates) {
    sortedData[dateKey] = data[dateKey];
  }
  
  // Convert back to YAML
  // Use JSON schema to prevent date conversion, and custom formatting
  const yamlString = yaml.dump(sortedData, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    schema: yaml.JSON_SCHEMA
  });
  
  // Post-process to format links array items properly
  // YAML.dump doesn't format arrays of objects the way we want, so we need custom formatting
  return formatLinksYaml(sortedData);
}

/**
 * Format complete links.yaml structure with proper indentation
 * @param {Object} data - Parsed links data object
 * @returns {string} Formatted YAML string
 */
function formatLinksYaml(data) {
  const lines = [];
  const dates = Object.keys(data).sort((a, b) => b.localeCompare(a));
  
  for (const date of dates) {
    lines.push(`${date}:`);
    const links = data[date];
    if (Array.isArray(links)) {
      for (const link of links) {
        lines.push(formatLinkYaml(link));
      }
    }
    // Add blank line between date groups (except after last)
    if (date !== dates[dates.length - 1]) {
      lines.push('');
    }
  }
  
  return lines.join('\n') + '\n';
}

/**
 * Validate link object structure
 * @param {Object} link - Link object to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateLink(link) {
  const errors = [];
  
  if (!link.url || typeof link.url !== 'string' || !link.url.trim()) {
    errors.push('URL is required');
  } else {
    // Basic URL validation
    try {
      const url = new URL(link.url.trim());
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push('URL must start with http:// or https://');
      }
    } catch (e) {
      errors.push('URL must be a valid URL');
    }
  }
  
  if (!link.title || typeof link.title !== 'string' || !link.title.trim()) {
    errors.push('Title is required');
  } else {
    const title = link.title.trim();
    if (title.length < 1 || title.length > 1000) {
      errors.push('Title must be between 1 and 1000 characters');
    }
  }
  
  // Description is optional, but if provided should be a string
  if (link.description !== undefined && link.description !== null) {
    if (typeof link.description !== 'string') {
      errors.push('Description must be a string');
    }
  }
  
  // Check for unexpected fields
  const allowedFields = ['url', 'title', 'description'];
  const linkFields = Object.keys(link);
  const unexpectedFields = linkFields.filter(field => !allowedFields.includes(field));
  if (unexpectedFields.length > 0) {
    errors.push(`Unexpected field(s): ${unexpectedFields.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate date format
 * @param {string} date - Date string to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateDate(date) {
  if (!date || typeof date !== 'string') {
    return { valid: false, error: 'Date is required' };
  }
  
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { valid: false, error: 'Date must be in YYYY-MM-DD format' };
  }
  
  // Check if date is valid
  const dateObj = new Date(date + 'T00:00:00');
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Invalid date' };
  }
  
  // Check if date string matches the parsed date (catches invalid dates like 2025-13-45)
  const [year, month, day] = date.split('-').map(Number);
  if (dateObj.getFullYear() !== year || 
      dateObj.getMonth() + 1 !== month || 
      dateObj.getDate() !== day) {
    return { valid: false, error: 'Invalid date' };
  }
  
  return { valid: true };
}

module.exports = {
  formatLinkYaml,
  addLinkToYaml,
  formatLinksYaml,
  validateLink,
  validateDate
};

