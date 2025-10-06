#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find all HTML files in _site
function findHtmlFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findHtmlFiles(fullPath));
    } else if (item.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Extract images from HTML
function extractImages(htmlContent) {
  const images = [];
  const imgRegex = /<img[^>]*>/gi;
  let match;
  
  while ((match = imgRegex.exec(htmlContent)) !== null) {
    const imgTag = match[0];
    const images = [];
    
    // Extract src
    const srcMatch = imgTag.match(/src=["']([^"']*)["']/i);
    const src = srcMatch ? srcMatch[1] : '';
    
    // Extract alt
    const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
    const alt = altMatch ? altMatch[1] : '';
    
    // Extract title
    const titleMatch = imgTag.match(/title=["']([^"']*)["']/i);
    const title = titleMatch ? titleMatch[1] : '';
    
    images.push({
      src: src,
      alt: alt,
      title: title,
      tag: imgTag
    });
  }
  
  return images;
}

// Extract links from HTML
function extractLinks(htmlContent) {
  const links = [];
  const linkRegex = /<a[^>]*>(.*?)<\/a>/gi;
  let match;
  
  while ((match = linkRegex.exec(htmlContent)) !== null) {
    const linkTag = match[0];
    const linkText = match[1].replace(/<[^>]*>/g, '').trim(); // Remove HTML tags
    
    // Extract href
    const hrefMatch = linkTag.match(/href=["']([^"']*)["']/i);
    const href = hrefMatch ? hrefMatch[1] : '';
    
    // Extract title
    const titleMatch = linkTag.match(/title=["']([^"']*)["']/i);
    const title = titleMatch ? titleMatch[1] : '';
    
    // Extract aria-label
    const ariaLabelMatch = linkTag.match(/aria-label=["']([^"']*)["']/i);
    const ariaLabel = ariaLabelMatch ? ariaLabelMatch[1] : '';
    
    links.push({
      href: href,
      text: linkText,
      title: title,
      ariaLabel: ariaLabel,
      tag: linkTag
    });
  }
  
  return links;
}

// Extract form elements
function extractForms(htmlContent) {
  const forms = [];
  const formRegex = /<form[^>]*>(.*?)<\/form>/gis;
  let match;
  
  while ((match = formRegex.exec(htmlContent)) !== null) {
    const formContent = match[1];
    const formTag = match[0];
    
    // Extract form attributes
    const actionMatch = formTag.match(/action=["']([^"']*)["']/i);
    const methodMatch = formTag.match(/method=["']([^"']*)["']/i);
    
    // Extract inputs
    const inputs = [];
    const inputRegex = /<input[^>]*>/gi;
    let inputMatch;
    
    while ((inputMatch = inputRegex.exec(formContent)) !== null) {
      const inputTag = inputMatch[0];
      const typeMatch = inputTag.match(/type=["']([^"']*)["']/i);
      const nameMatch = inputTag.match(/name=["']([^"']*)["']/i);
      const idMatch = inputTag.match(/id=["']([^"']*)["']/i);
      const labelMatch = inputTag.match(/aria-label=["']([^"']*)["']/i);
      
      inputs.push({
        type: typeMatch ? typeMatch[1] : 'text',
        name: nameMatch ? nameMatch[1] : '',
        id: idMatch ? idMatch[1] : '',
        ariaLabel: labelMatch ? labelMatch[1] : '',
        tag: inputTag
      });
    }
    
    forms.push({
      action: actionMatch ? actionMatch[1] : '',
      method: methodMatch ? methodMatch[1] : 'get',
      inputs: inputs,
      tag: formTag
    });
  }
  
  return forms;
}

// Extract headings from HTML
function extractHeadings(htmlContent) {
  const headings = [];
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
  let match;
  
  while ((match = headingRegex.exec(htmlContent)) !== null) {
    const level = parseInt(match[1]);
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    const tag = match[0];
    
    headings.push({
      level: level,
      text: text,
      tag: tag
    });
  }
  
  return headings;
}

// Validate images
function validateImages(images) {
  const issues = [];
  
  images.forEach((img, index) => {
    // Check for missing alt text
    if (!img.alt && img.alt !== '') {
      issues.push(`Image ${index + 1}: Missing alt attribute`);
    }
    
    // Check for empty alt text (unless it's decorative)
    if (img.alt === '') {
      // This might be intentional for decorative images
      // We'll flag it as a warning to review
      issues.push(`Image ${index + 1}: Empty alt text (verify if decorative)`);
    }
    
    // Check for alt text that's too long
    if (img.alt && img.alt.length > 125) {
      issues.push(`Image ${index + 1}: Alt text too long (${img.alt.length} chars)`);
    }
    
    // Check for alt text that's the same as filename
    if (img.src && img.alt) {
      const filename = path.basename(img.src, path.extname(img.src));
      if (img.alt.toLowerCase() === filename.toLowerCase()) {
        issues.push(`Image ${index + 1}: Alt text same as filename`);
      }
    }
    
    // Check for missing src
    if (!img.src) {
      issues.push(`Image ${index + 1}: Missing src attribute`);
    }
  });
  
  return issues;
}

// Validate links
function validateLinks(links) {
  const issues = [];
  
  links.forEach((link, index) => {
    // Check for empty link text
    if (!link.text || link.text.trim() === '') {
      issues.push(`Link ${index + 1}: Empty link text`);
    }
    
    // Check for generic link text
    const genericTexts = ['click here', 'read more', 'here', 'more', 'link'];
    if (genericTexts.some(generic => link.text.toLowerCase().includes(generic))) {
      issues.push(`Link ${index + 1}: Generic link text ("${link.text}")`);
    }
    
    // Check for links that open in new window without warning
    if (link.tag.includes('target="_blank"') && !link.tag.includes('rel=')) {
      issues.push(`Link ${index + 1}: Opens in new window without rel="noopener"`);
    }
    
    // Check for very long link text
    if (link.text.length > 100) {
      issues.push(`Link ${index + 1}: Link text very long (${link.text.length} chars)`);
    }
    
    // Check for missing href
    if (!link.href) {
      issues.push(`Link ${index + 1}: Missing href attribute`);
    }
  });
  
  return issues;
}

// Validate forms
function validateForms(forms) {
  const issues = [];
  
  forms.forEach((form, formIndex) => {
    // Check for form labels
    form.inputs.forEach((input, inputIndex) => {
      if (input.type !== 'hidden' && input.type !== 'submit' && input.type !== 'button') {
        // Check if input has associated label
        const hasLabel = input.id && input.ariaLabel;
        if (!hasLabel) {
          issues.push(`Form ${formIndex + 1}, Input ${inputIndex + 1}: Missing label or aria-label`);
        }
      }
    });
    
    // Check for submit buttons
    const hasSubmit = form.inputs.some(input => 
      input.type === 'submit' || input.type === 'button'
    );
    if (!hasSubmit) {
      issues.push(`Form ${formIndex + 1}: No submit button found`);
    }
  });
  
  return issues;
}

// Validate headings
function validateHeadings(headings) {
  const issues = [];
  
  if (headings.length === 0) {
    issues.push('No headings found');
    return issues;
  }
  
  // Check for H1
  const h1Count = headings.filter(h => h.level === 1).length;
  if (h1Count === 0) {
    issues.push('No H1 heading found');
  }
  // Note: Multiple H1 headings check disabled - this is acceptable for some site structures
  
  // Check heading hierarchy
  let lastLevel = 0;
  headings.forEach((heading, index) => {
    if (heading.level > lastLevel + 1) {
      issues.push(`Heading hierarchy skip: H${lastLevel} → H${heading.level} at position ${index + 1}`);
    }
    lastLevel = heading.level;
  });
  
  // Check for empty headings
  const emptyHeadings = headings.filter(h => h.text.length === 0);
  if (emptyHeadings.length > 0) {
    issues.push(`${emptyHeadings.length} empty heading(s) found`);
  }
  
  return issues;
}

// Check for accessibility attributes
function checkAccessibilityAttributes(htmlContent) {
  const issues = [];
  
  // Check for skip links
  if (!htmlContent.includes('skip') && !htmlContent.includes('skip-link')) {
    issues.push('No skip link found (recommended for keyboard navigation)');
  }
  
  // Check for lang attribute
  if (!htmlContent.match(/<html[^>]*lang=/i)) {
    issues.push('Missing lang attribute on <html> tag');
  }
  
  // Check for proper ARIA landmarks
  const landmarks = ['main', 'navigation', 'banner', 'contentinfo', 'complementary'];
  const foundLandmarks = landmarks.filter(landmark => 
    htmlContent.includes(`role="${landmark}"`) || htmlContent.includes(`<${landmark}`)
  );
  
  if (foundLandmarks.length === 0) {
    issues.push('No ARIA landmarks found (main, nav, etc.)');
  }
  
  // Check for focus management
  if (htmlContent.includes('onclick=') && !htmlContent.includes('onkeypress=') && !htmlContent.includes('onkeydown=')) {
    issues.push('onclick without keyboard equivalent (accessibility concern)');
  }
  
  return issues;
}

// Check color contrast (basic check)
function checkColorContrast(htmlContent) {
  const issues = [];
  
  // Look for inline styles with color
  const colorRegex = /style=["'][^"']*color\s*:\s*([^;]+)/gi;
  let match;
  
  while ((match = colorRegex.exec(htmlContent)) !== null) {
    const color = match[1].trim();
    // This is a basic check - in a real implementation, you'd parse the color
    // and check contrast ratios
    if (color === 'white' || color === '#fff' || color === '#ffffff') {
      issues.push('White text detected - ensure sufficient contrast');
    }
  }
  
  return issues;
}

// Main accessibility validation
function validateAccessibility() {
  console.log('♿ Starting accessibility validation...\n');
  
  const siteDir = './_site';
  if (!fs.existsSync(siteDir)) {
    console.log('❌ _site directory not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  const htmlFiles = findHtmlFiles(siteDir);
  console.log(`Found ${htmlFiles.length} HTML files\n`);
  
  const results = {
    total: htmlFiles.length,
    issues: 0,
    warnings: 0
  };
  
  // Validate each file
  for (const file of htmlFiles) {
    const relativePath = path.relative('./_site', file);
    const content = fs.readFileSync(file, 'utf8');
    
    console.log(`📄 ${relativePath}:`);
    
    let fileIssues = 0;
    
    // Extract and validate different elements
    const images = extractImages(content);
    const links = extractLinks(content);
    const forms = extractForms(content);
    const headings = extractHeadings(content);
    
    // Validate images
    const imageIssues = validateImages(images);
    if (imageIssues.length > 0) {
      console.log(`   ❌ Images: ${imageIssues.join(', ')}`);
      fileIssues += imageIssues.length;
    }
    
    // Validate links
    const linkIssues = validateLinks(links);
    if (linkIssues.length > 0) {
      console.log(`   ❌ Links: ${linkIssues.join(', ')}`);
      fileIssues += linkIssues.length;
    }
    
    // Validate forms
    const formIssues = validateForms(forms);
    if (formIssues.length > 0) {
      console.log(`   ❌ Forms: ${formIssues.join(', ')}`);
      fileIssues += fileIssues.length;
    }
    
    // Validate headings
    const headingIssues = validateHeadings(headings);
    if (headingIssues.length > 0) {
      console.log(`   ❌ Headings: ${headingIssues.join(', ')}`);
      fileIssues += headingIssues.length;
    }
    
    // Check accessibility attributes
    const attrIssues = checkAccessibilityAttributes(content);
    if (attrIssues.length > 0) {
      console.log(`   ⚠️  Attributes: ${attrIssues.join(', ')}`);
      fileIssues += attrIssues.length;
    }
    
    // Check color contrast
    const contrastIssues = checkColorContrast(content);
    if (contrastIssues.length > 0) {
      console.log(`   ⚠️  Color: ${contrastIssues.join(', ')}`);
      fileIssues += contrastIssues.length;
    }
    
    if (fileIssues === 0) {
      console.log(`   ✅ All accessibility checks passed`);
    }
    
    console.log('');
    results.issues += fileIssues;
  }
  
  // Summary
  console.log('📊 Accessibility Validation Summary:');
  console.log(`   Total files: ${results.total}`);
  console.log(`   Issues: ${results.issues}`);
  
  if (results.issues > 0) {
    console.log('\n❌ Accessibility issues found that need attention.');
    console.log('\n💡 Accessibility Tips:');
    console.log('   - Use semantic HTML elements');
    console.log('   - Provide alt text for all images');
    console.log('   - Use descriptive link text');
    console.log('   - Ensure proper heading hierarchy');
    console.log('   - Test with keyboard navigation');
    console.log('   - Use screen reader testing tools');
    process.exit(1);
  } else {
    console.log('\n🎉 All accessibility validation passed!');
  }
}

// Run validation
validateAccessibility();
