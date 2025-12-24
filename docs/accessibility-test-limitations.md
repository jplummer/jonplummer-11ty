# Accessibility Test Limitations - Why Contrast Issues Were Missed

## Problem

The accessibility test script (`scripts/test/accessibility.js`) uses axe-core but did not catch the contrast issues that PageSpeed Insights found. This document explains why and how to fix it.

## Root Causes

### 1. **CSS Custom Properties Resolution Timing**

axe-core's `color-contrast` rule needs **computed styles**, not CSS variables. The current script:

1. Loads the page with `waitUntil: 'networkidle0'`
2. Immediately injects axe-core
3. Runs axe-core analysis

**Problem**: CSS custom properties (`--link-color: #e6423a`) might not be fully resolved to computed values when axe-core runs. axe-core may see the CSS variable name instead of the actual color value.

### 2. **Media Query Application Timing**

The script sets `prefers-color-scheme` before `page.goto()`, but:

- The page needs time to re-render with the new media query
- CSS custom properties in `@media (prefers-color-scheme: dark)` blocks need to be recalculated
- There's no explicit wait for styles to be recomputed after media query changes

### 3. **axe-core Color Contrast Rule Limitations**

According to axe-core documentation:
- The `color-contrast` rule can have false negatives (misses issues)
- It may not properly resolve CSS custom properties in all scenarios
- Complex CSS (variables, calc(), etc.) can cause incomplete checks

### 4. **No Explicit Wait for Computed Styles**

After `networkidle0`, the script doesn't wait for:
- CSS to be fully parsed
- CSS custom properties to be resolved
- Computed styles to be available
- Media queries to be applied

## Current Script Flow

```javascript
// 1. Set media query preference
await page.emulateMediaFeatures([...]);

// 2. Load page
await page.goto(fileUrl, { waitUntil: 'networkidle0' });

// 3. Inject axe-core
await page.addScriptTag({ content: axeCore.source });

// 4. Run immediately (no wait for computed styles)
const results = await page.evaluate(() => axe.run());
```

## Recommended Fixes

### Fix 1: Wait for Computed Styles

Add a wait after page load to ensure CSS is fully computed:

```javascript
await page.goto(fileUrl, { waitUntil: 'networkidle0' });

// Wait for styles to be computed
await page.evaluate(() => {
  // Force style computation by reading computed styles
  const elements = document.querySelectorAll('*');
  elements.forEach(el => {
    window.getComputedStyle(el).color;
    window.getComputedStyle(el).backgroundColor;
  });
});

// Small delay to ensure CSS custom properties are resolved
await page.waitForTimeout(100);
```

### Fix 2: Set Media Query Before Navigation

Move media query setting to page creation:

```javascript
const page = await browser.newPage();

// Set media query BEFORE navigation
if (colorScheme === 'dark') {
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: 'dark' }
  ]);
} else {
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: 'light' }
  ]);
}

// Then navigate
await page.goto(fileUrl, { waitUntil: 'networkidle0' });
```

### Fix 3: Explicitly Enable Color Contrast Rule

Ensure color-contrast is explicitly enabled (it should be by default, but be explicit):

```javascript
const config = {
  runOnly: {
    type: 'rule',
    values: ['color-contrast'] // Explicitly enable
  }
};
```

### Fix 4: Add Fallback Contrast Check

Supplement axe-core with a direct contrast calculation for known elements:

```javascript
// After axe-core runs, also check specific elements
const contrastCheck = await page.evaluate(() => {
  const links = document.querySelectorAll('a, nav a, hgroup p');
  const issues = [];
  
  links.forEach(link => {
    const style = window.getComputedStyle(link);
    const color = style.color;
    const bgColor = style.backgroundColor;
    // Calculate contrast ratio
    // If fails, add to issues
  });
  
  return issues;
});
```

### Fix 5: Use Our Custom Contrast Calculator

Since we now have `calculate-contrast.js`, we could:
1. Run it as part of the test suite
2. Or integrate its logic into the accessibility test
3. Or run it separately and compare results

## Immediate Action Items

1. **Update accessibility.js** to wait for computed styles
2. **Test the updated script** to verify it catches contrast issues
3. **Add the contrast calculator** to the test suite (as a fast check)
4. **Document** that contrast checks should be run separately or verified manually

## Why PageSpeed Caught It But axe-core Didn't

PageSpeed Insights:
- Uses Lighthouse's accessibility audit
- Has its own contrast calculation engine
- May resolve CSS custom properties differently
- Tests the actual rendered page in a real browser

axe-core:
- Runs in Puppeteer (headless Chrome)
- May have timing issues with CSS resolution
- Can miss issues with CSS custom properties
- May not wait long enough for styles to compute

## Conclusion

The accessibility test script should be updated to:
1. Wait for computed styles before running axe-core
2. Explicitly handle CSS custom property resolution
3. Consider supplementing with our custom contrast calculator
4. Be aware that axe-core may miss some contrast issues with CSS variables

