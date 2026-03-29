#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parse, formatHex } = require('culori');
const { absApcaLcSrgb, absApcaLcP3 } = require('../utils/apca-dual');
const { createTestResult, addFile, addIssue, addWarning, addCustomSection, outputResult } = require('../utils/test-results');

/** Warn when sRGB and Display P3 APCA Lc differ by at least this much. */
const LC_DIVERGENCE_WARN = 4;

function expandShortHex(hex) {
  if (hex.length === 4 && hex.startsWith('#')) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toLowerCase();
  }
  return hex.toLowerCase();
}

/** Normalize a CSS color (hex or oklch) to #rrggbb for apca-w3. */
function colorToHex(cssColor) {
  if (cssColor == null || typeof cssColor !== 'string') {
    return null;
  }
  const v = cssColor.trim();
  if (v.startsWith('#')) {
    return expandShortHex(v);
  }
  const color = parse(v);
  if (!color) {
    return null;
  }
  return formatHex(color).toLowerCase();
}

// Parse CSS custom properties from CSS file
// Supports light-dark(hex|oklch, hex|oklch) and legacy separate @media blocks
function parseCSSColors(cssFilePath) {
  const cssContent = fs.readFileSync(cssFilePath, 'utf8');
  
  const colors = {
    light: {},
    dark: {}
  };
  
  const rootMatch = cssContent.match(/:root\s*\{([^}]+)\}/);
  if (rootMatch) {
    const rootContent = rootMatch[1];

    const colorCapture = '(#[0-9a-fA-F]{3,8}|oklch\\([^)]+\\))';

    // Match light-dark(lightColor, darkColor) syntax
    const lightDarkRe = new RegExp(
      `--([a-z-]+):\\s*light-dark\\(\\s*${colorCapture}\\s*,\\s*${colorCapture}\\s*\\)`,
      'g'
    );
    const lightDarkMatches = rootContent.matchAll(lightDarkRe);
    for (const match of lightDarkMatches) {
      const [, varName, lightValue, darkValue] = match;
      const lightRaw = lightValue.trim();
      const darkRaw = darkValue.trim();
      if (colorToHex(lightRaw) && colorToHex(darkRaw)) {
        colors.light[varName] = lightRaw;
        colors.dark[varName] = darkRaw;
      }
    }

    // Match plain color values (for properties not using light-dark)
    const plainRe = new RegExp(`--([a-z-]+):\\s*${colorCapture}\\s*;`, 'g');
    const plainMatches = rootContent.matchAll(plainRe);
    for (const match of plainMatches) {
      const [, varName, colorValue] = match;
      if (!colors.light[varName]) {
        const raw = colorValue.trim();
        if (colorToHex(raw)) {
          colors.light[varName] = raw;
        }
      }
    }
  }
  
  // Also check legacy @media (prefers-color-scheme: dark) block
  const darkModeMatch = cssContent.match(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[^{]*:root\s*\{([^}]+)\}/);
  if (darkModeMatch) {
    const darkContent = darkModeMatch[1];
    const legacyMatches = darkContent.matchAll(
      /--([a-z-]+):\s*(#[0-9a-fA-F]{3,8}|oklch\([^)]+\))/g
    );
    for (const match of legacyMatches) {
      const [, varName, colorValue] = match;
      const raw = colorValue.trim();
      if (colorToHex(raw) && !colors.dark[varName]) {
        colors.dark[varName] = raw;
      }
    }
  }
  
  return colors;
}

// Build color pairs to test from parsed colors
function buildColorPairs(colors) {
  const pairs = [];
  
  // APCA thresholds (Lc values):
  // - Body text (16-18px): Lc 75+ (preferred), Lc 60+ (minimum)
  // - Large text (24px+): Lc 60+ (preferred), Lc 45+ (minimum)
  // - UI elements: Lc 45+
  
  // Light mode tests
  if (colors.light['text-color'] && colors.light['content-background-color']) {
    pairs.push({
      mode: 'light',
      category: 'Body text on white',
      foreground: colors.light['text-color'],
      background: colors.light['content-background-color'],
      minLc: 60,
      preferredLc: 75,
      fontSize: '16px'
    });
  }
  
  if (colors.light['text-color'] && colors.light['background-color']) {
    pairs.push({
      mode: 'light',
      category: 'Body text on background',
      foreground: colors.light['text-color'],
      background: colors.light['background-color'],
      minLc: 60,
      preferredLc: 75,
      fontSize: '16px'
    });
  }
  
  if (colors.light['text-color-light'] && colors.light['content-background-color']) {
    pairs.push({
      mode: 'light',
      category: 'Light text on white',
      foreground: colors.light['text-color-light'],
      background: colors.light['content-background-color'],
      minLc: 60,
      preferredLc: 75,
      fontSize: '16px'
    });
  }
  
  if (colors.light['link-color'] && colors.light['content-background-color']) {
    pairs.push({
      mode: 'light',
      category: 'Link on white',
      foreground: colors.light['link-color'],
      background: colors.light['content-background-color'],
      minLc: 60,
      preferredLc: 75,
      fontSize: '16px'
    });
  }
  
  if (colors.light['link-hover-color'] && colors.light['content-background-color']) {
    pairs.push({
      mode: 'light',
      category: 'Link hover on white',
      foreground: colors.light['link-hover-color'],
      background: colors.light['content-background-color'],
      minLc: 60,
      preferredLc: 75,
      fontSize: '16px'
    });
  }
  
  if (colors.light['link-visited-color'] && colors.light['content-background-color']) {
    pairs.push({
      mode: 'light',
      category: 'Link visited on white',
      foreground: colors.light['link-visited-color'],
      background: colors.light['content-background-color'],
      minLc: 60,
      preferredLc: 75,
      fontSize: '16px'
    });
  }
  
  if (colors.light['link-active-color'] && colors.light['content-background-color']) {
    pairs.push({
      mode: 'light',
      category: 'Link active on white',
      foreground: colors.light['link-active-color'],
      background: colors.light['content-background-color'],
      minLc: 60,
      preferredLc: 75,
      fontSize: '16px'
    });
  }
  
  // Dark mode tests
  if (colors.dark['text-color'] && colors.dark['content-background-color']) {
    pairs.push({
      mode: 'dark',
      category: 'Body text on content background',
      foreground: colors.dark['text-color'],
      background: colors.dark['content-background-color'],
      minLc: 60,
      preferredLc: 75,
      fontSize: '16px'
    });
  }
  
  if (colors.dark['text-color'] && colors.dark['background-color']) {
    pairs.push({
      mode: 'dark',
      category: 'Body text on page background',
      foreground: colors.dark['text-color'],
      background: colors.dark['background-color'],
      minLc: 60,
      preferredLc: 75,
      fontSize: '16px'
    });
  }
  
  if (colors.dark['text-color-light'] && colors.dark['content-background-color']) {
    pairs.push({
      mode: 'dark',
      category: 'Light text on content background',
      foreground: colors.dark['text-color-light'],
      background: colors.dark['content-background-color'],
      minLc: 60,
      preferredLc: 75,
      fontSize: '16px'
    });
  }
  
  if (colors.dark['link-color'] && colors.dark['content-background-color']) {
    pairs.push({
      mode: 'dark',
      category: 'Link on content background',
      foreground: colors.dark['link-color'],
      background: colors.dark['content-background-color'],
      minLc: 60,
      preferredLc: 75,
      fontSize: '16px'
    });
  }
  
  if (colors.dark['link-hover-color'] && colors.dark['content-background-color']) {
    pairs.push({
      mode: 'dark',
      category: 'Link hover on content background',
      foreground: colors.dark['link-hover-color'],
      background: colors.dark['content-background-color'],
      minLc: 60,
      preferredLc: 75,
      fontSize: '16px'
    });
  }
  
  if (colors.dark['link-visited-color'] && colors.dark['content-background-color']) {
    pairs.push({
      mode: 'dark',
      category: 'Link visited on content background',
      foreground: colors.dark['link-visited-color'],
      background: colors.dark['content-background-color'],
      minLc: 60,
      preferredLc: 75,
      fontSize: '16px'
    });
  }
  
  if (colors.dark['link-active-color'] && colors.dark['content-background-color']) {
    pairs.push({
      mode: 'dark',
      category: 'Link active on content background',
      foreground: colors.dark['link-active-color'],
      background: colors.dark['content-background-color'],
      minLc: 60,
      preferredLc: 75,
      fontSize: '16px'
    });
  }
  
  return pairs;
}

// Check color contrast using APCA
function checkColorContrast() {
  const result = createTestResult('color-contrast', 'Color Contrast (APCA)');
  
  // Parse CSS file
  const cssFilePath = path.join(__dirname, '../../src/assets/css/jonplummer.css');
  if (!fs.existsSync(cssFilePath)) {
    console.error('❌ CSS file not found:', cssFilePath);
    process.exit(1);
  }
  
  const colors = parseCSSColors(cssFilePath);
  const colorPairs = buildColorPairs(colors);
  
  if (colorPairs.length === 0) {
    console.error('❌ No color pairs found in CSS file');
    process.exit(1);
  }
  
  // Add a virtual file to group all contrast checks
  const fileObj = addFile(result, 'src/assets/css/jonplummer.css', 'CSS color definitions');
  
  let lightModeIssues = 0;
  let lightModeWarnings = 0;
  let darkModeIssues = 0;
  let darkModeWarnings = 0;
  
  colorPairs.forEach(pair => {
    const lcSrgb = absApcaLcSrgb(pair.foreground, pair.background);
    const lcP3 = absApcaLcP3(pair.foreground, pair.background);
    if (lcSrgb == null) {
      addIssue(fileObj, {
        type: 'color-contrast-parse',
        message: `${pair.category} (${pair.mode}): could not parse colors for APCA. FG: ${pair.foreground} / BG: ${pair.background}`
      });
      if (pair.mode === 'light') {
        lightModeIssues++;
      } else {
        darkModeIssues++;
      }
      return;
    }

    const fgHex = colorToHex(pair.foreground) || pair.foreground;
    const bgHex = colorToHex(pair.background) || pair.background;
    const lcP3Str = lcP3 != null ? lcP3.toFixed(1) : 'n/a';

    if (lcP3 != null && lcSrgb >= pair.minLc && lcP3 < pair.minLc) {
      addWarning(fileObj, {
        type: 'color-contrast-p3-below-min',
        message: `${pair.category} (${pair.mode}): Lc (P3) ${lcP3.toFixed(1)} is below minimum ${pair.minLc} while Lc (sRGB) ${lcSrgb.toFixed(1)} passes — wide-gamut displays may see weaker contrast. FG: ${fgHex} / BG: ${bgHex}`,
        mode: pair.mode,
        category: pair.category,
        lcSrgb,
        lcP3
      });
      if (pair.mode === 'light') {
        lightModeWarnings++;
      } else {
        darkModeWarnings++;
      }
    } else if (
      lcP3 != null &&
      lcSrgb >= pair.minLc &&
      Math.abs(lcP3 - lcSrgb) >= LC_DIVERGENCE_WARN
    ) {
      addWarning(fileObj, {
        type: 'color-contrast-srgb-p3-divergence',
        message: `${pair.category} (${pair.mode}): Lc (sRGB) ${lcSrgb.toFixed(1)} vs Lc (P3) ${lcP3.toFixed(1)} — gamut mapping differs between pipelines. FG: ${fgHex} / BG: ${bgHex}`,
        mode: pair.mode,
        category: pair.category,
        lcSrgb,
        lcP3
      });
      if (pair.mode === 'light') {
        lightModeWarnings++;
      } else {
        darkModeWarnings++;
      }
    }

    if (lcSrgb < pair.minLc) {
      const message = `${pair.category} (${pair.mode}): Lc (sRGB) ${lcSrgb.toFixed(1)} (P3 ${lcP3Str}) below minimum ${pair.minLc} for ${pair.fontSize} text. FG: ${fgHex} / BG: ${bgHex}`;
      addIssue(fileObj, {
        type: 'color-contrast-fail',
        message,
        mode: pair.mode,
        category: pair.category,
        foreground: pair.foreground,
        background: pair.background,
        contrastLc: lcSrgb,
        contrastLcP3: lcP3,
        minLc: pair.minLc,
        preferredLc: pair.preferredLc
      });

      if (pair.mode === 'light') {
        lightModeIssues++;
      } else {
        darkModeIssues++;
      }
    } else if (lcSrgb < pair.preferredLc) {
      const message = `${pair.category} (${pair.mode}): Lc (sRGB) ${lcSrgb.toFixed(1)} (P3 ${lcP3Str}) below preferred ${pair.preferredLc} (above minimum ${pair.minLc}). FG: ${fgHex} / BG: ${bgHex}`;
      addWarning(fileObj, {
        type: 'color-contrast-suboptimal',
        message,
        mode: pair.mode,
        category: pair.category,
        foreground: pair.foreground,
        background: pair.background,
        contrastLc: lcSrgb,
        contrastLcP3: lcP3,
        minLc: pair.minLc,
        preferredLc: pair.preferredLc
      });

      if (pair.mode === 'light') {
        lightModeWarnings++;
      } else {
        darkModeWarnings++;
      }
    }
  });
  
  // Add custom sections for light/dark mode stats
  addCustomSection(result, '☀️  Light mode', {
    issues: lightModeIssues,
    warnings: lightModeWarnings,
    total: colorPairs.filter(p => p.mode === 'light').length
  });
  
  addCustomSection(result, '🌙 Dark mode', {
    issues: darkModeIssues,
    warnings: darkModeWarnings,
    total: colorPairs.filter(p => p.mode === 'dark').length
  });
  
  addCustomSection(result, '🎨 Colors Parsed', {
    lightMode: Object.keys(colors.light).length + ' colors',
    darkMode: Object.keys(colors.dark).length + ' colors',
    totalPairs: colorPairs.length + ' color pairs tested'
  });
  
  addCustomSection(result, 'ℹ️  About APCA', {
    note: 'APCA (Accessible Perceptual Contrast Algorithm) is a modern contrast metric that better matches human perception than WCAG 2.x contrast ratios. It\'s part of the upcoming WCAG 3.0 standard.',
    thresholds: 'Body text (16-18px): Lc 75+ preferred, Lc 60+ minimum. Large text (24px+): Lc 60+ preferred, Lc 45+ minimum.'
  });

  addCustomSection(result, '🖥  sRGB vs Display P3', {
    note: 'Each pair reports Lc after culori gamut mapping to sRGB (APCA-W3 sRGBtoY) and, in messages, Lc after mapping to Display P3 (displayP3toY). Pass/fail uses the sRGB path only. Warnings appear when P3 is below minimum while sRGB passes, or when the two Lc values diverge by ' + LC_DIVERGENCE_WARN + ' or more.'
  });
  
  // Output result
  outputResult(result);
  
  // Exit with appropriate code
  process.exit(result.summary.issues > 0 ? 1 : 0);
}

// Run validation
checkColorContrast();
