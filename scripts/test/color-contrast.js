#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { calcAPCA } = require('apca-w3');
const { createTestResult, addFile, addIssue, addWarning, addCustomSection, outputResult } = require('../utils/test-results');

// Parse CSS custom properties from CSS file
function parseCSSColors(cssFilePath) {
  const cssContent = fs.readFileSync(cssFilePath, 'utf8');
  
  const colors = {
    light: {},
    dark: {}
  };
  
  // Extract light mode colors from :root
  const rootMatch = cssContent.match(/:root\s*\{([^}]+)\}/);
  if (rootMatch) {
    const rootContent = rootMatch[1];
    // Match CSS custom properties with hex color values
    const colorMatches = rootContent.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{3,6})/g);
    for (const match of colorMatches) {
      const [, varName, colorValue] = match;
      colors.light[varName] = colorValue;
    }
  }
  
  // Extract dark mode colors from @media (prefers-color-scheme: dark)
  const darkModeMatch = cssContent.match(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[^{]*:root\s*\{([^}]+)\}/);
  if (darkModeMatch) {
    const darkContent = darkModeMatch[1];
    const colorMatches = darkContent.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{3,6})/g);
    for (const match of colorMatches) {
      const [, varName, colorValue] = match;
      colors.dark[varName] = colorValue;
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
    // Calculate APCA contrast (returns Lc value, can be positive or negative depending on polarity)
    const contrastLc = calcAPCA(pair.foreground, pair.background);
    const absContrastLc = Math.abs(contrastLc);
    
    // Check against thresholds
    if (absContrastLc < pair.minLc) {
      // Fails minimum threshold
      const message = `${pair.category} (${pair.mode}): Lc ${absContrastLc.toFixed(1)} is below minimum ${pair.minLc} for ${pair.fontSize} text. FG: ${pair.foreground} / BG: ${pair.background}`;
      addIssue(fileObj, {
        type: 'color-contrast-fail',
        message: message,
        mode: pair.mode,
        category: pair.category,
        foreground: pair.foreground,
        background: pair.background,
        contrastLc: absContrastLc,
        minLc: pair.minLc,
        preferredLc: pair.preferredLc
      });
      
      if (pair.mode === 'light') {
        lightModeIssues++;
      } else {
        darkModeIssues++;
      }
    } else if (absContrastLc < pair.preferredLc) {
      // Passes minimum but below preferred
      const message = `${pair.category} (${pair.mode}): Lc ${absContrastLc.toFixed(1)} is below preferred ${pair.preferredLc} (but above minimum ${pair.minLc}). FG: ${pair.foreground} / BG: ${pair.background}`;
      addWarning(fileObj, {
        type: 'color-contrast-suboptimal',
        message: message,
        mode: pair.mode,
        category: pair.category,
        foreground: pair.foreground,
        background: pair.background,
        contrastLc: absContrastLc,
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
  
  // Output result
  outputResult(result);
  
  // Exit with appropriate code
  process.exit(result.summary.issues > 0 ? 1 : 0);
}

// Run validation
checkColorContrast();
