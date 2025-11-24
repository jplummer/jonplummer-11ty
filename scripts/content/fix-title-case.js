#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Known proper nouns and acronyms that should stay capitalized
const PROPER_NOUNS = new Set([
  'Net', 'Promoter', 'Score', 'NPS',
  'CareLink', 'Pro',
  'MiniMed',
  'Belkin',
  'UX',
  'AI',
  'ADPList',
  'Mr', 'Mr.',
  'Thomas', 'W', 'W.',
  'Daniel', 'Abrahams',
  'Daphne',
  'Bryanne',
  'Horizon',
  'Mann', 'Consulting',
  'Manager',
  'Bias' // Person's name
]);

// Convert Title Case to sentence case
// Only capitalizes the first letter of the title and first letter after colons
// Preserves acronyms and known proper nouns
function toSentenceCase(title) {
  // Remove quotes if present
  const hasQuotes = title.startsWith('"') && title.endsWith('"');
  const unquoted = hasQuotes ? title.slice(1, -1) : title;
  
  // Split by colon to handle subtitles
  const parts = unquoted.split(':');
  
  const convertedParts = parts.map((part, partIndex) => {
    // Trim whitespace
    part = part.trim();
    
    // Use regex to split into words while preserving punctuation
    // This matches word boundaries and captures words with their following punctuation
    const tokens = part.match(/\S+/g) || [];
    
    const convertedTokens = tokens.map((token, tokenIndex) => {
      // Handle hyphenated words separately
      if (token.includes('-')) {
        const hyphenParts = token.split('-');
        const convertedHyphenParts = hyphenParts.map((hyphenPart, hyphenIndex) => {
          const wordMatch = hyphenPart.match(/^([\w']+)(.*)$/);
          if (!wordMatch) return hyphenPart;
          
          const word = wordMatch[1];
          const punctuation = wordMatch[2];
          
          // Check if it's an acronym or proper noun
          if (word.length >= 2 && /^[A-Z]+$/.test(word)) {
            return hyphenPart; // Preserve acronyms
          }
          
          const wordWithoutPeriod = word.replace(/\.$/, '');
          if (PROPER_NOUNS.has(word) || PROPER_NOUNS.has(wordWithoutPeriod)) {
            return hyphenPart; // Preserve proper nouns
          }
          
          // First word of the part should be capitalized
          if (tokenIndex === 0 && hyphenIndex === 0) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() + punctuation;
          }
          
          // All other parts should be lowercase
          return word.toLowerCase() + punctuation;
        });
        return convertedHyphenParts.join('-');
      }
      
      // Extract the word part (letters/numbers) and punctuation
      const wordMatch = token.match(/^([\w']+)(.*)$/);
      if (!wordMatch) return token;
      
      const word = wordMatch[1];
      const punctuation = wordMatch[2];
      
      // Check if it's an acronym (all caps, 2+ chars)
      if (word.length >= 2 && /^[A-Z]+$/.test(word)) {
        return token; // Preserve acronyms
      }
      
      // Check if it's a known proper noun
      const wordWithoutPeriod = word.replace(/\.$/, '');
      if (PROPER_NOUNS.has(word) || PROPER_NOUNS.has(wordWithoutPeriod)) {
        return token; // Preserve proper nouns
      }
      
      // Check if it contains numbers (like "2021", "2001")
      if (/\d/.test(word)) {
        return token; // Preserve words with numbers
      }
      
      // First word of the title or first word after colon should be capitalized
      if ((partIndex === 0 && tokenIndex === 0) || (partIndex > 0 && tokenIndex === 0)) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() + punctuation;
      }
      
      // All other words should be lowercase
      return word.toLowerCase() + punctuation;
    });
    
    return convertedTokens.join(' ');
  });
  
  let result = convertedParts.join(': ');
  
  // Restore quotes if they were there
  if (hasQuotes) {
    result = `"${result}"`;
  }
  
  return result;
}

// Check if a title is in Title Case (needs conversion)
function isTitleCase(title) {
  // Remove quotes
  const unquoted = title.startsWith('"') && title.endsWith('"') 
    ? title.slice(1, -1) 
    : title;
  
  // Split into words
  const words = unquoted.split(/\s+/);
  
  // Count words that are capitalized (excluding first word and acronyms)
  let capitalizedAfterFirst = 0;
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i].replace(/[^\w]/g, ''); // Remove punctuation
    if (word.length > 0) {
      // Skip acronyms (all caps, 2+ chars)
      if (/^[A-Z]{2,}$/.test(word)) continue;
      
      // Check if word starts with capital
      if (word.charAt(0) === word.charAt(0).toUpperCase() && word.length > 1) {
        capitalizedAfterFirst++;
      }
    }
  }
  
  // Also check words after colons
  const afterColon = unquoted.split(':').slice(1).join('');
  const afterColonWords = afterColon.split(/\s+/);
  for (const word of afterColonWords) {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length > 0 && !/^[A-Z]{2,}$/.test(cleanWord)) {
      if (cleanWord.charAt(0) === cleanWord.charAt(0).toUpperCase() && cleanWord.length > 1) {
        capitalizedAfterFirst++;
      }
    }
  }
  
  // If we have multiple capitalized words after the first, it's likely Title Case
  return capitalizedAfterFirst > 1;
}

function processPostFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract front matter
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontMatterMatch) {
      return null;
    }
    
    const frontMatter = frontMatterMatch[1];
    const body = frontMatterMatch[2];
    
    // Extract title
    const titleMatch = frontMatter.match(/^title:\s*(.+)$/m);
    if (!titleMatch) {
      return null;
    }
    
    const originalTitle = titleMatch[1].trim();
    
    // Check if it's Title Case
    if (!isTitleCase(originalTitle)) {
      return null; // Already sentence case
    }
    
    // Convert to sentence case
    const newTitle = toSentenceCase(originalTitle);
    
    if (originalTitle === newTitle) {
      return null; // No change needed
    }
    
    // Replace title in front matter
    const newFrontMatter = frontMatter.replace(
      /^title:\s*(.+)$/m,
      `title: ${newTitle}`
    );
    
    // Reconstruct file
    const newContent = `---\n${newFrontMatter}\n---\n${body}`;
    
    return {
      filePath,
      originalTitle,
      newTitle,
      newContent
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return null;
  }
}

function main() {
  const postsDir = path.join(__dirname, '../../src/_posts');
  const results = [];
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.md')) {
        const result = processPostFile(filePath);
        if (result) {
          results.push(result);
        }
      }
    }
  }
  
  walkDir(postsDir);
  
  if (results.length === 0) {
    console.log('No Title Case titles found.');
    return;
  }
  
  console.log(`Found ${results.length} post(s) with Title Case titles:\n`);
  
  for (const result of results) {
    console.log(`${result.filePath}`);
    console.log(`  Before: ${result.originalTitle}`);
    console.log(`  After:  ${result.newTitle}\n`);
  }
  
  // Ask for confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Apply these changes? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      for (const result of results) {
        fs.writeFileSync(result.filePath, result.newContent, 'utf8');
        console.log(`Updated: ${result.filePath}`);
      }
      console.log(`\nUpdated ${results.length} file(s).`);
    } else {
      console.log('Changes not applied.');
    }
    rl.close();
  });
}

if (require.main === module) {
  main();
}

module.exports = { toSentenceCase, isTitleCase };

