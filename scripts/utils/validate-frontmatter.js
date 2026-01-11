#!/usr/bin/env node

/**
 * Validate Frontmatter
 * 
 * Validates that all markdown files have valid YAML frontmatter.
 * Can optionally fix common issues.
 */

const fs = require('fs');
const path = require('path');
const { parseFrontMatter, formatYamlString } = require('./frontmatter-utils');
const { getMarkdownFiles, readFile } = require('./test-helpers');

function validateFrontmatter(fix = false) {
  const srcDir = './src';
  const markdownFiles = getMarkdownFiles(srcDir);
  const errors = [];
  const fixed = [];

  for (const file of markdownFiles) {
    const content = readFile(file);
    const { frontMatter, error, content: body } = parseFrontMatter(content);

    if (error) {
      errors.push({
        file: path.relative('.', file),
        error: error
      });

      // Try to fix common issues by reconstructing with yaml.dump
      if (fix && frontMatter) {
        try {
          // Reconstruct file using yaml.dump which will properly quote values
          const yaml = require('js-yaml');
          const yamlContent = yaml.dump(frontMatter, {
            lineWidth: -1,
            noRefs: true,
            quotingType: '"',
            forceQuotes: false  // Let YAML decide when to quote
          });
          
          const fixedContent = `---\n${yamlContent}---\n${body}`;
          
          // Validate the fixed content parses correctly
          const { error: parseError } = parseFrontMatter(fixedContent);
          if (!parseError) {
            fs.writeFileSync(file, fixedContent, 'utf8');
            fixed.push(path.relative('.', file));
          }
        } catch (fixError) {
          // Could not fix automatically
        }
      }
    }
  }

  return { errors, fixed };
}

if (require.main === module) {
  const fix = process.argv.includes('--fix');
  const { errors, fixed } = validateFrontmatter(fix);

  if (errors.length > 0) {
    console.error(`\n❌ Found ${errors.length} frontmatter parsing error(s):\n`);
    errors.forEach(({ file, error }) => {
      console.error(`  📄 ${file}`);
      console.error(`     Error: ${error}\n`);
    });

    if (fix && fixed.length > 0) {
      console.log(`\n✅ Fixed ${fixed.length} file(s):\n`);
      fixed.forEach(file => {
        console.log(`  📄 ${file}`);
      });
    } else if (fix) {
      console.log('\n⚠️  Could not automatically fix errors. Please fix manually.');
    } else {
      console.log('\n💡 Tip: Run with --fix to attempt automatic fixes');
    }

    process.exit(1);
  } else {
    console.log('✅ All frontmatter is valid!');
    process.exit(0);
  }
}

module.exports = { validateFrontmatter };

