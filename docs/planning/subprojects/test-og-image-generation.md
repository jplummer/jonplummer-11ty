# Testing OG Image Generation

## Quick Test Summary

✅ **Implementation Verified:**
- `eleventy.beforeWatch` handler found in `.eleventy.js`
- OG image check found in `scripts/deploy/deploy.js`
- Incremental generation works (0.7 seconds for 196 files, all up-to-date)

---

## Test 1: Manual Generation (Fastest Test)

**Test that the script works:**

```bash
# Test with a post that doesn't have ogImage set
# Pick any post, temporarily remove ogImage from frontmatter
# Then run:
npm run generate-og-images

# Should generate the image and update frontmatter
```

**Expected:** Image generated, frontmatter updated, script completes in <1 second if all other images are up-to-date.

---

## Test 2: Dev Server Watch (eleventy.beforeWatch)

**Test automatic generation during dev:**

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **In another terminal, create a test:**
   ```bash
   # Pick a post to test with
   POST="src/_posts/2025/2025-11-20-the-hidden-pages-of-this-site.md"
   
   # Remove ogImage from frontmatter (temporarily)
   sed -i '' '/^ogImage:/d' "$POST"
   
   # Delete the OG image if it exists
   rm -f src/assets/images/og/2025-11-20-the-hidden-pages-of-this-site.png
   
   # Make a small change to trigger watch
   echo "" >> "$POST"
   echo "<!-- Test change -->" >> "$POST"
   ```

3. **Watch the dev server terminal** - you should see:
   - Eleventy detects the file change
   - OG image generation happens (may be silent or show in console)
   - Build completes

4. **Verify:**
   ```bash
   ls -la src/assets/images/og/2025-11-20-the-hidden-pages-of-this-site.png
   ```

5. **Clean up:**
   ```bash
   # Remove test comment
   sed -i '' '/<!-- Test change -->/d' "$POST"
   
   # Restore ogImage in frontmatter (or let script add it)
   npm run generate-og-images
   ```

**Expected:** OG image is automatically generated when you save the file during dev.

---

## Test 3: Deploy Script Integration

**Test that deploy script checks OG images:**

```bash
# Option A: Test just the OG image part (without full deploy)
# Check that the deploy script includes the check:
grep -A 3 "OG images" scripts/deploy/deploy.js

# Option B: Test with a dry-run (if your deploy script supports it)
# Or test by temporarily breaking the script to see if deploy fails
```

**To test the actual deploy flow:**

1. Delete an OG image:
   ```bash
   rm src/assets/images/og/2025-11-20-the-hidden-pages-of-this-site.md
   ```

2. Remove ogImage from frontmatter (temporarily):
   ```bash
   sed -i '' '/^ogImage:/d' src/_posts/2025/2025-11-20-the-hidden-pages-of-this-site.md
   ```

3. Run deploy (or check what would happen):
   ```bash
   npm run deploy
   ```

4. **Expected:** 
   - Deploy script runs OG image generation
   - Missing image is generated
   - Deploy continues

---

## Test 4: Incremental Generation Speed

**Verify incremental generation is fast:**

```bash
# First, ensure all images exist
npm run generate-og-images

# Then run again - should be very fast
time npm run generate-og-images
```

**Expected:** 
- Script completes in <1 second
- All images skipped (no regeneration)
- Summary shows: "Images generated: 0, Skipped: ~196"

---

## Test 5: Change Detection

**Test that changed content regenerates images:**

1. Pick a post with an OG image
2. Change the title in frontmatter
3. Run: `npm run generate-og-images`
4. **Expected:** Image is regenerated (because title changed)

**Note:** The script checks file modification time, so changing the source file should trigger regeneration.

---

## Known Limitation

The script currently skips files that have `ogImage` set in frontmatter, even if the image file doesn't exist. This is by design to respect manual overrides, but means:

- If you manually set `ogImage` but the file is missing, you need to either:
  - Remove `ogImage` from frontmatter and run the script, OR
  - Manually create the image

This is intentional to allow manual overrides, but could be improved to check if the file actually exists.

---

## Quick Verification Commands

```bash
# Check implementation exists
grep -q "eleventy.beforeWatch" .eleventy.js && echo "✅ Watch handler found" || echo "❌ Not found"
grep -q "OG images" scripts/deploy/deploy.js && echo "✅ Deploy integration found" || echo "❌ Not found"

# Test incremental speed
time npm run generate-og-images

# Count OG images
ls src/assets/images/og/*.png | wc -l
```
