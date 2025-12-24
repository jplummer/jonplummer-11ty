#!/usr/bin/env node

/**
 * Calculate WCAG contrast ratios for color combinations
 * Uses the WCAG 2.1 contrast ratio formula
 */

// Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Calculate relative luminance (WCAG formula)
function getRelativeLuminance(rgb) {
  // Normalize RGB values to 0-1
  const normalize = (val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };
  
  const r = normalize(rgb.r);
  const g = normalize(rgb.g);
  const b = normalize(rgb.b);
  
  // WCAG relative luminance formula
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Calculate contrast ratio between two colors
function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    throw new Error(`Invalid color: ${color1} or ${color2}`);
  }
  
  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);
  
  // Contrast ratio formula: (L1 + 0.05) / (L2 + 0.05) where L1 is lighter
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Check if contrast meets WCAG requirements
function meetsWCAG(ratio, isLargeText = false) {
  const required = isLargeText ? 3.0 : 4.5;
  return {
    ratio: ratio,
    required: required,
    passes: ratio >= required,
    level: ratio >= 4.5 ? 'AA' : (ratio >= 3.0 ? 'AA Large' : 'FAIL')
  };
}

// Format result for display
function formatResult(foreground, background, isLargeText = false) {
  const ratio = getContrastRatio(foreground, background);
  const result = meetsWCAG(ratio, isLargeText);
  
  return {
    foreground,
    background,
    ratio: ratio.toFixed(2),
    required: result.required.toFixed(1),
    passes: result.passes,
    level: result.level,
    isLargeText
  };
}

// All color combinations to test
const colorCombinations = [
  // Light mode
  {
    name: 'Light Mode - Link color on white',
    foreground: '#d63d36',
    background: '#ffffff',
    isLargeText: false,
    context: 'Navigation links, "Today I Learned" tagline, pagination links'
  },
  {
    name: 'Light Mode - Link color on white (large text)',
    foreground: '#d63d36',
    background: '#ffffff',
    isLargeText: true,
    context: 'Large text (18pt+ or 14pt+ bold)'
  },
  {
    name: 'Light Mode - Text on body background',
    foreground: '#2a2a2a',
    background: '#d3d8d2',
    isLargeText: false,
    context: 'Body text on gray background'
  },
  {
    name: 'Light Mode - Text on content background',
    foreground: '#2a2a2a',
    background: '#ffffff',
    isLargeText: false,
    context: 'Body text on white content area'
  },
  {
    name: 'Light Mode - Link hover on white',
    foreground: '#b26205',
    background: '#ffffff',
    isLargeText: false,
    context: 'Link hover state'
  },
  {
    name: 'Light Mode - Link visited on white',
    foreground: '#5b4a3b',
    background: '#ffffff',
    isLargeText: false,
    context: 'Link visited state'
  },
  {
    name: 'Light Mode - Link active on white',
    foreground: '#0d703f',
    background: '#ffffff',
    isLargeText: false,
    context: 'Link active state'
  },
  
  // Dark mode
  {
    name: 'Dark Mode - Link color on content background',
    foreground: '#ff6b6b',
    background: '#2d2d2d',
    isLargeText: false,
    context: 'Navigation links, "Today I Learned" tagline, pagination links'
  },
  {
    name: 'Dark Mode - Link color on content background (large text)',
    foreground: '#ff6b6b',
    background: '#2d2d2d',
    isLargeText: true,
    context: 'Large text (18pt+ or 14pt+ bold)'
  },
  {
    name: 'Dark Mode - Text on body background',
    foreground: '#e0e0e0',
    background: '#1a1a1a',
    isLargeText: false,
    context: 'Body text on dark background'
  },
  {
    name: 'Dark Mode - Text on content background',
    foreground: '#e0e0e0',
    background: '#2d2d2d',
    isLargeText: false,
    context: 'Body text on dark content area'
  },
  {
    name: 'Dark Mode - Link hover on content background',
    foreground: '#f1b73a',
    background: '#2d2d2d',
    isLargeText: false,
    context: 'Link hover state'
  },
  {
    name: 'Dark Mode - Link visited on content background',
    foreground: '#a89585',
    background: '#2d2d2d',
    isLargeText: false,
    context: 'Link visited state'
  },
  {
    name: 'Dark Mode - Link active on content background',
    foreground: '#2db366',
    background: '#2d2d2d',
    isLargeText: false,
    context: 'Link active state'
  }
];

// Main execution
console.log('WCAG Contrast Ratio Analysis\n');
console.log('='.repeat(80));
console.log();

let passCount = 0;
let failCount = 0;
const failures = [];

colorCombinations.forEach((combo, index) => {
  const result = formatResult(combo.foreground, combo.background, combo.isLargeText);
  
  const status = result.passes ? '✅ PASS' : '❌ FAIL';
  const ratioDisplay = `${result.ratio}:1`;
  const requiredDisplay = `${result.required}:1`;
  
  console.log(`${index + 1}. ${combo.name}`);
  console.log(`   ${status} - Ratio: ${ratioDisplay} (Required: ${requiredDisplay})`);
  console.log(`   Level: ${result.level}`);
  console.log(`   Context: ${combo.context}`);
  console.log(`   Colors: ${combo.foreground} on ${combo.background}`);
  console.log();
  
  if (result.passes) {
    passCount++;
  } else {
    failCount++;
    failures.push({
      ...combo,
      ...result
    });
  }
});

// Summary
console.log('='.repeat(80));
console.log('Summary:');
console.log(`  ✅ Passing: ${passCount}`);
console.log(`  ❌ Failing: ${failCount}`);
console.log();

if (failures.length > 0) {
  console.log('Failing Combinations:');
  failures.forEach((failure, index) => {
    console.log(`  ${index + 1}. ${failure.name}`);
    console.log(`     Ratio: ${failure.ratio}:1 (Required: ${failure.required}:1)`);
    console.log(`     Context: ${failure.context}`);
    console.log();
  });
}

// Exit with error code if any failures
process.exit(failCount > 0 ? 1 : 0);

