/**
 * Utility: CSS custom properties extraction
 * 
 * Utility module used by filters and scripts (e.g., generate-og-images.js).
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

/**
 * Reads production @font-face rules for Puppeteer OG screenshots.
 * Uses base64 data URLs — file:// src fails from setContent (about:blank origin).
 *
 * @returns {string} @font-face CSS (empty if fonts.css missing)
 */
function extractProductionFontFacesForInline() {
  const fontsCssPath = path.join(process.cwd(), 'src', 'assets', 'css', 'fonts.css');
  if (!fs.existsSync(fontsCssPath)) {
    return '';
  }

  const fontDir = path.join(process.cwd(), 'src', 'assets', 'fonts', 'lab');
  let css = fs.readFileSync(fontsCssPath, 'utf8');
  css = css.replace(/url\("\/assets\/fonts\/lab\/([^"]+)"\)/g, (_match, filename) => {
    const fontPath = path.join(fontDir, filename);
    if (!fs.existsSync(fontPath)) {
      throw new Error(`OG font file missing: ${fontPath}`);
    }
    const base64 = fs.readFileSync(fontPath).toString('base64');
    return `url("data:font/woff2;base64,${base64}")`;
  });
  return css.trim();
}

const LIGHT_THEME_COLOR_VARS = [
  'text-color',
  'text-color-light',
  'border-color',
  'background-color',
  'content-background-color',
  'link-color',
  'link-hover-color',
  'link-visited-color',
  'link-active-color'
];

/**
 * Extracts light-scheme color values from :root `light-dark()` tokens for forced-light contexts (OG PNGs).
 *
 * @returns {string} `:root { … }` block with light-only values
 */
function extractLightThemeColorOverrides() {
  const rootBlock = extractCssCustomProperties();
  const lines = [];

  for (const varName of LIGHT_THEME_COLOR_VARS) {
    const re = new RegExp(`--${varName}:\\s*light-dark\\(\\s*([^,]+?)\\s*,\\s*[^)]+\\)`);
    const match = rootBlock.match(re);
    if (match) {
      lines.push(`  --${varName}: ${match[1].trim()};`);
    }
  }

  if (lines.length !== LIGHT_THEME_COLOR_VARS.length) {
    throw new Error('Could not extract all light theme color overrides from :root');
  }

  return `:root {\n${lines.join('\n')}\n}`;
}

module.exports = {
  extractCssCustomProperties,
  extractProductionFontFacesForInline,
  extractLightThemeColorOverrides
};

