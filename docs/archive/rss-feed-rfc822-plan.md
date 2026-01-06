# RSS Feed RFC822 Format Plan

## Current Situation

- RSS 2.0 feeds (`feed.xml` and `links-feed.xml`) use `dateToRfc3339` filter
- Dates are formatted as RFC3339/ISO 8601: `2025-11-21T04:00:00.000Z`
- Feeds are structurally valid and work with most RSS readers
- **Issue**: RSS 2.0 specification recommends RFC822 format for `<pubDate>` elements

## Why This Matters

- **RSS 2.0 Standard**: RFC822 is the official format for `<pubDate>` in RSS 2.0
- **Compatibility**: Most modern RSS readers accept RFC3339, but some older/legacy readers may not
- **Validation**: Feed validators may flag RFC3339 in RSS 2.0 feeds as non-standard
- **Best Practice**: Using the correct format ensures maximum compatibility

## Investigation Steps

1. **Check RSS plugin's dateToRfc822 filter:**
   - Verify it exists and works with Date objects
   - Test if it handles DateTime objects (from our custom date parsing)
   - Check if we need to override it (like we do with dateToRfc3339)

2. **Test current feeds:**
   - Validate feeds with W3C Feed Validation Service
   - Check if any RSS readers have issues with RFC3339 dates
   - Verify feeds work correctly in common feed readers

3. **Check dateToRfc822 implementation:**
   - Review RSS plugin source code for dateToRfc822
   - Determine if it needs DateTime object handling
   - Test with our custom date parsing output

## Proposed Changes

### Option A: Switch to RFC822 (Recommended if validation fails)

**Changes needed:**
1. Update `src/feed.njk`:
   - Change `<pubDate>{{ item.date | dateToRfc3339 }}</pubDate>` to `<pubDate>{{ item.date | dateToRfc822 }}</pubDate>`
   - Change `<lastBuildDate>` to use `dateToRfc822` (or keep RFC3339 - lastBuildDate is less critical)

2. Update `src/links-feed.njk`:
   - Change `<pubDate>` to use `dateToRfc822`
   - Update `<lastBuildDate>` if needed

3. Override `dateToRfc822` filter (if needed):
   - Add plugin wrapper to override `dateToRfc822` (same pattern as `dateToRfc3339`)
   - Handle DateTime objects from custom date parsing
   - Convert to Date, then format as RFC822

4. Test thoroughly:
   - Verify all dates format correctly
   - Check feed validation
   - Test in multiple RSS readers

### Option B: Keep RFC3339 (If validation passes and no issues)

**Rationale:**
- RFC3339 is more modern and widely supported
- ISO 8601 format is clearer and less ambiguous
- Many RSS readers accept it
- Less code to maintain (no need to override dateToRfc822)

**Action:**
- Document that we're using RFC3339 intentionally
- Note that it works with all tested readers
- Monitor for any compatibility issues

## Implementation Details (if Option A)

### 1. Override dateToRfc822 Filter

Add to `eleventy/config/filters.js`:

```javascript
// Override dateToRfc822 to handle DateTime objects from custom date parsing
eleventyConfig.addPlugin(function(eleventyConfig) {
  eleventyConfig.addNunjucksFilter("dateToRfc822", (dateObj) => {
    if (!dateObj) {
      return '';
    }
    
    let date;
    
    // If it's a DateTime, convert to Date
    if (dateObj && typeof dateObj === 'object' && typeof dateObj.toJSDate === 'function') {
      date = dateObj.toJSDate();
    } else if (dateObj instanceof Date) {
      date = dateObj;
    } else {
      // Otherwise, try to normalize
      date = normalizeDate(dateObj);
    }
    
    // Validate date
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }
    
    // Format as RFC822 (e.g., "Wed, 21 Nov 2025 04:00:00 GMT")
    // Use toUTCString() which produces RFC822-compatible format
    return date.toUTCString();
  });
});
```

### 2. Update Feed Templates

**src/feed.njk:**
- Change `<pubDate>{{ item.date | dateToRfc3339 }}</pubDate>` to `<pubDate>{{ item.date | dateToRfc822 }}</pubDate>`
- Consider keeping `<lastBuildDate>` as RFC3339 (less critical, and RFC822 format is verbose)

**src/links-feed.njk:**
- Change `<pubDate>{{ item.date | dateToRfc3339 }}</pubDate>` to `<pubDate>{{ item.date | dateToRfc822 }}</pubDate>`
- Update `<lastBuildDate>` if desired

### 3. Testing Plan

1. **Build and validate:**
   - Run `npm run build`
   - Validate feeds with W3C Feed Validation Service: https://validator.w3.org/feed/
   - Check for any validation errors or warnings

2. **Test in RSS readers:**
   - NetNewsWire
   - Feedly
   - Readwise Reader
   - Any other readers you use

3. **Verify date formatting:**
   - Check that dates display correctly
   - Verify timezone handling is correct
   - Ensure no dates are malformed or empty

4. **Check feed structure:**
   - Verify all items have valid `<pubDate>` elements
   - Check that feed structure is still valid
   - Ensure no breaking changes

## Decision Criteria

**Switch to RFC822 if:**
- Feed validators flag RFC3339 as non-standard
- RSS readers have issues with RFC3339 dates
- You want strict RSS 2.0 compliance
- You encounter compatibility problems

**Keep RFC3339 if:**
- All validators pass
- All tested RSS readers work correctly
- No compatibility issues reported
- You prefer the modern ISO 8601 format

## Notes

- RFC822 format example: `Wed, 21 Nov 2025 04:00:00 GMT`
- RFC3339 format example: `2025-11-21T04:00:00.000Z`
- Both represent the same moment in time, just different formats
- RFC822 is more verbose but is the RSS 2.0 standard
- RFC3339 is more compact and widely supported in modern tools

## Related Files

- `src/feed.njk` - Main RSS feed template
- `src/links-feed.njk` - Links RSS feed template
- `eleventy/config/filters.js` - Filter configuration (where we'd add dateToRfc822 override)
- `eleventy/config/plugins.js` - RSS plugin registration

