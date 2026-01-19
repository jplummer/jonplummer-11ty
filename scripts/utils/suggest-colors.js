#!/usr/bin/env node

const { calcAPCA } = require('apca-w3');

// Current dark mode colors that are failing
const background = '#2d2d2d';
const currentColors = {
  'text-color-light': '#b0b0b0',  // Lc 55.1, needs 60+
  'link-color': '#ff6b6b',         // Lc 44.7, needs 60+
  'link-visited-color': '#a89585', // Lc 42.4, needs 60+
  'link-active-color': '#2db366'   // Lc 45.4, needs 60+
};

// Function to lighten a hex color by adjusting RGB values
function lightenColor(hex, amount) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse RGB
  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);
  
  // Increase each channel
  r = Math.min(255, Math.round(r + amount));
  g = Math.min(255, Math.round(g + amount));
  b = Math.min(255, Math.round(b + amount));
  
  // Convert back to hex
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Try different lightening amounts to find one that works
function findBetterColor(originalColor, background, targetLc = 60) {
  console.log(`\nOriginal: ${originalColor}`);
  const originalLc = Math.abs(calcAPCA(originalColor, background));
  console.log(`  Current Lc: ${originalLc.toFixed(1)} (needs ${targetLc}+)`);
  
  // Try progressively lighter versions
  for (let amount = 10; amount <= 150; amount += 10) {
    const newColor = lightenColor(originalColor, amount);
    const newLc = Math.abs(calcAPCA(newColor, background));
    
    if (newLc >= targetLc) {
      console.log(`  ✅ Suggested: ${newColor} (Lc ${newLc.toFixed(1)})`);
      return { color: newColor, lc: newLc };
    }
  }
  
  console.log(`  ⚠️  Could not find suitable color`);
  return null;
}

console.log('='.repeat(60));
console.log('APCA Color Suggestions for Dark Mode (#2d2d2d background)');
console.log('='.repeat(60));

const suggestions = {};

for (const [varName, currentColor] of Object.entries(currentColors)) {
  console.log(`\n📝 ${varName}:`);
  const result = findBetterColor(currentColor, background);
  if (result) {
    suggestions[varName] = result.color;
  }
}

console.log('\n' + '='.repeat(60));
console.log('Summary of Suggested Changes:');
console.log('='.repeat(60));

for (const [varName, newColor] of Object.entries(suggestions)) {
  const oldColor = currentColors[varName];
  const oldLc = Math.abs(calcAPCA(oldColor, background));
  const newLc = Math.abs(calcAPCA(newColor, background));
  console.log(`${varName}:`);
  console.log(`  ${oldColor} → ${newColor}`);
  console.log(`  Lc ${oldLc.toFixed(1)} → ${newLc.toFixed(1)}`);
}

console.log('\n' + '='.repeat(60));
console.log('CSS to update in src/assets/css/jonplummer.css:');
console.log('='.repeat(60));
console.log('\n@media (prefers-color-scheme: dark) {');
console.log('  :root {');
for (const [varName, newColor] of Object.entries(suggestions)) {
  console.log(`    --${varName}: ${newColor};`);
}
console.log('  }');
console.log('}');
