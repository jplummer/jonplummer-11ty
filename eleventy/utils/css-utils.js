/**
 * Utility: CSS custom properties extraction
 * 
 * Utility module used by filters and shortcodes (e.g., renderOgImage shortcode).
 * Extracts CSS custom properties from the :root block in the main stylesheet
 * for use in OG image generation.
 */

const fs = require('fs');
const path = require('path');

/**
 * Extracts CSS custom properties from the :root block in the main stylesheet.
 * Used for OG image preview generation.
 * 
 * @returns {string} The :root block including selector and braces
 * @throws {Error} If :root block cannot be found or parsed
 */
function extractCssCustomProperties() {
  const cssPath = path.join(process.cwd(), 'src', 'assets', 'css', 'jonplummer.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  // Extract :root block - match from :root to closing brace
  const rootStart = cssContent.indexOf(':root');
  if (rootStart === -1) {
    throw new Error('Could not find :root block in CSS file');
  }
  
  // Find the opening brace after :root
  let braceStart = cssContent.indexOf('{', rootStart);
  if (braceStart === -1) {
    throw new Error('Could not find opening brace for :root block');
  }
  
  // Find matching closing brace by counting braces
  let braceCount = 0;
  let braceEnd = braceStart;
  for (let i = braceStart; i < cssContent.length; i++) {
    if (cssContent[i] === '{') {
      braceCount++;
    } else if (cssContent[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        braceEnd = i;
        break;
      }
    }
  }
  
  if (braceCount !== 0) {
    throw new Error('Could not find matching closing brace for :root block');
  }
  
  // Extract the :root block including the selector and braces
  return cssContent.substring(rootStart, braceEnd + 1);
}

module.exports = {
  extractCssCustomProperties
};

