const fs = require('fs');
const path = require('path');

// Helper to find all markdown files in portfolio directories
function findPortfolioFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(findPortfolioFiles(file));
    } else {
      // Check if it's a markdown file and has portfolio tag or is in portfolio structure
      if (file.endsWith('.md') && !file.includes('node_modules') && !file.includes('_site')) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('tags: portfolio') || content.includes('layout: portfolio_detail.njk')) {
          results.push(file);
        }
      }
    }
  });
  return results;
}

// Regex to match mixed Markdown/HTML figures: <figure>\n![alt](src)\n</figure>
// Also handles cases with extra whitespace
const mixedFigureRegex = /<figure>\s*!\[(.*?)\]\((.*?)\)\s*<\/figure>/g;

function normalizeFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  // Replace mixed figures with pure HTML
  const newContent = content.replace(mixedFigureRegex, (match, alt, src) => {
    hasChanges = true;
    // Clean up alt text (remove quotes if present)
    const cleanAlt = alt.replace(/"/g, '&quot;');
    return `<figure>
  <img src="${src}" alt="${cleanAlt}">
  <figcaption></figcaption>
</figure>`;
  });

  if (hasChanges) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

const postsDir = path.join(__dirname, '../../src/_posts');
const portfolioFiles = findPortfolioFiles(postsDir);

console.log(`Found ${portfolioFiles.length} portfolio files. Normalizing images...`);
portfolioFiles.forEach(normalizeFile);
console.log('Done.');
