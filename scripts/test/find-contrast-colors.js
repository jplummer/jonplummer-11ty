#!/usr/bin/env node

/**
 * Find color values that meet WCAG contrast requirements
 * Given a base color and background, find a darker/lighter version that meets the target ratio
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

// Convert RGB to hex
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Calculate relative luminance (WCAG formula)
function getRelativeLuminance(rgb) {
  const normalize = (val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };
  
  const r = normalize(rgb.r);
  const g = normalize(rgb.g);
  const b = normalize(rgb.b);
  
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
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Darken a color by a factor (0-1, where 1 is fully black)
function darkenColor(hex, factor) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  
  return {
    r: Math.max(0, rgb.r * (1 - factor)),
    g: Math.max(0, rgb.g * (1 - factor)),
    b: Math.max(0, rgb.b * (1 - factor))
  };
}

// Find a darker color that meets target contrast
function findDarkerColor(baseColor, background, targetRatio, step = 0.01) {
  let factor = 0;
  let currentColor = baseColor;
  let attempts = 0;
  const maxAttempts = 1000;
  
  while (factor < 1 && attempts < maxAttempts) {
    const darkened = darkenColor(baseColor, factor);
    if (!darkened) break;
    
    currentColor = rgbToHex(darkened.r, darkened.g, darkened.b);
    const ratio = getContrastRatio(currentColor, background);
    
    if (ratio >= targetRatio) {
      return {
        color: currentColor,
        ratio: ratio.toFixed(2),
        factor: factor.toFixed(3)
      };
    }
    
    factor += step;
    attempts++;
  }
  
  return null;
}

// Test cases
const testCases = [
  {
    name: 'Light Mode Link Color',
    baseColor: '#e6423a',
    background: '#ffffff',
    targetRatio: 4.5,
    currentRatio: 4.03
  },
  {
    name: 'Light Mode Link Hover',
    baseColor: '#d97706',
    background: '#ffffff',
    targetRatio: 4.5,
    currentRatio: 3.19
  }
];

console.log('Finding Color Values That Meet WCAG AA (4.5:1)\n');
console.log('='.repeat(80));
console.log();

testCases.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name}`);
  console.log(`   Current: ${test.baseColor} on ${test.background} = ${test.currentRatio}:1`);
  console.log(`   Target: ${test.targetRatio}:1`);
  console.log();
  
  const result = findDarkerColor(test.baseColor, test.background, test.targetRatio);
  
  if (result) {
    console.log(`   ✅ Solution found:`);
    console.log(`      New color: ${result.color}`);
    console.log(`      Contrast ratio: ${result.ratio}:1`);
    console.log(`      Darkening factor: ${result.factor}`);
    
    // Calculate a few options around the target
    const options = [];
    for (let f = parseFloat(result.factor) - 0.05; f <= parseFloat(result.factor) + 0.05; f += 0.01) {
      if (f >= 0 && f <= 1) {
        const opt = darkenColor(test.baseColor, f);
        if (opt) {
          const optColor = rgbToHex(opt.r, opt.g, opt.b);
          const optRatio = getContrastRatio(optColor, test.background);
          options.push({ color: optColor, ratio: optRatio.toFixed(2), factor: f.toFixed(3) });
        }
      }
    }
    
    console.log(`\n   Alternative options (around target):`);
    options.forEach(opt => {
      const status = parseFloat(opt.ratio) >= test.targetRatio ? '✅' : '❌';
      console.log(`      ${status} ${opt.color} = ${opt.ratio}:1 (factor: ${opt.factor})`);
    });
  } else {
    console.log(`   ❌ Could not find a solution`);
  }
  
  console.log();
  console.log('='.repeat(80));
  console.log();
});

