# OG Image Generation Integration Options

## Current State
OG images are generated manually via `npm run generate-og-images`. The script uses incremental generation (skips images that already exist and haven't changed).

## Options

### Option 1: Manual Generation (Current)
**How it works**: Run `npm run generate-og-images` when needed.

**Pros:**
- Fast builds (no overhead)
- Full control over when images are generated
- No impact on dev server performance

**Cons:**
- Easy to forget to run
- Extra manual step

**Best for**: Projects where OG images don't change often and you want maximum build speed.

---

### Option 2: Automatic on Production Builds Only
**How it works**: Generate images automatically during `npm run build` (but not during `npm run dev`).

**Implementation**: Add to `.eleventy.js`:
```javascript
eleventyConfig.on("eleventy.before", async ({ runMode }) => {
  if (runMode === "build") {
    const { main } = require('./scripts/content/generate-og-images.js');
    await main();
  }
});
```

**Pros:**
- Production builds always have up-to-date images
- Dev server stays fast
- No manual step for production

**Cons:**
- Slows down production builds (Puppeteer is slow)
- Still need to remember for dev/preview

**Best for**: When you want production to always be correct but don't mind slower builds.

---

### Option 3: Incremental on Changed Files Only
**How it works**: Use `eleventy.beforeWatch` to detect changed files and generate images only for those files.

**Implementation**: Add to `.eleventy.js`:
```javascript
eleventyConfig.on("eleventy.beforeWatch", async (changedFiles) => {
  const { processFile } = require('./scripts/content/generate-og-images.js');
  const postFiles = changedFiles.filter(f => 
    f.includes('_posts/') || 
    (f.includes('src/') && (f.endsWith('.md') || f.endsWith('.njk')))
  );
  for (const file of postFiles) {
    await processFile(file);
  }
});
```

**Pros:**
- Fast (only processes changed files)
- Automatic for new/changed content
- Minimal impact on dev workflow

**Cons:**
- More complex implementation
- Might miss some edge cases (e.g., template changes)
- Still need initial generation

**Best for**: Active development where you're frequently adding/editing posts.

---

### Option 4: Pre-Deploy Hook
**How it works**: Generate images as part of the deploy script before deployment.

**Implementation**: Add to `scripts/deploy/deploy.js`:
```javascript
// Before deploy
console.log('🖼️  Generating OG images...');
execSync('npm run generate-og-images', { stdio: 'inherit' });
```

**Pros:**
- Ensures images exist before deployment
- Doesn't slow down dev server
- Harder to forget (part of deploy process)

**Cons:**
- Still a manual step (but automated in deploy)
- Deploy takes longer

**Best for**: When you want to ensure production correctness without impacting dev speed.

---

### Option 5: Hybrid Approach (Recommended)
**How it works**: Combine Option 3 (incremental on changed files) + Option 4 (pre-deploy hook).

**Implementation**: 
- Add incremental generation to `.eleventy.js` for dev workflow (only process changed files)
- Add incremental check to deploy script (runs the script, which already does incremental generation)

**Note**: The `generate-og-images` script already does incremental generation - it only regenerates images that are missing or have changed source data. So "full generation check" just means running the script, which will quickly skip everything that's up-to-date and only process what needs updating.

**Pros:**
- Best of both worlds
- Fast dev experience (only changed files)
- Fast deploy check (incremental, skips up-to-date images)
- Production always correct
- Automatic for new content

**Cons:**
- More complex setup
- Two places to maintain

**Best for**: Active development with regular deployments.

---

## Performance Considerations

- **Full generation** (all images from scratch): ~2-3 minutes for all 171 images (Puppeteer is slow)
- **Incremental check** (script with existing images): ~0.5 seconds (just checking file existence and timestamps)
- **Incremental generation** (only missing/changed): ~1-2 seconds per image that needs generation
- **Single image generation**: ~1-2 seconds per image

**Important**: The `generate-og-images` script already does incremental generation - it checks if:
1. Image file exists
2. Source file modification time vs image modification time  
3. Frontmatter ogImage path matches expected path

So running the script on a site with all images up-to-date takes <1 second. It only generates what's actually needed.

## Recommendation

**✅ IMPLEMENTED: Option 5 (Hybrid)**

The hybrid approach has been implemented:

1. **Incremental generation on changed files during dev** (via `eleventy.beforeWatch` in `.eleventy.js`)
   - Automatically generates OG images when you save a post or page file
   - Only processes the changed file(s) - fast and automatic
   - Silently fails if there's an error (doesn't break dev server)

2. **Incremental check before deploy** (added to `scripts/deploy/deploy.js`)
   - Runs `npm run generate-og-images` before deployment
   - Uses the script's incremental logic - only generates what's needed
   - Typically <1 second if all images are up-to-date
   - Fails deploy if image generation fails (ensures production correctness)

This gives you:
- ✅ Fast dev workflow (only processes changed files)
- ✅ Fast deploy check (incremental, skips up-to-date images - typically <1 second)
- ✅ Automatic image generation for new/changed content
- ✅ Production correctness guarantee
- ✅ Minimal maintenance overhead

The script's incremental logic means running it before deploy is fast - it only generates images that are actually missing or have changed, not all 171 images every time.

