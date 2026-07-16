# Authoring

## Link Capture

For capturing links to `links.yaml`, see [NotePlan Link Import](noteplan-import.md).

**Quick workflow:**
1. Capture links in NotePlan (from any device)
2. Run `pnpm run deploy` - links are automatically imported, formatted, and validated
3. Or run `pnpm run import-links` manually to preview locally first

Imported links appear on the homepage (merged with posts by date, same ordering as page 1 of the index) and in the RSS feed at `/links-feed.xml`.

## Collected wisdom

Short notes live in `src/_data/wisdom-entries.yaml` (same folder as `links.yaml` and the rest of site data). Eleventy also exposes that file under its own global key (from the basename); templates use `wisdom` from `src/_data/wisdom.js`, which reads the YAML and runs `eleventy/utils/wisdom-build.js` for sorted `entries`, `allTags`, and hash slugs when `slug` is omitted. Entries appear on `/wisdom/`, on per-tag pages under `/wisdom/tags/<tag>/`, and in `/wisdom-feed.xml`. Dates are **not** shown on the site; each entry still needs `added: "YYYY-MM-DD"` for ordering and RSS.

**Shape:**

- Root key `entries`: array of objects.
- Each object: `added` (`YYYY-MM-DD` string), `tags` (non-empty array of slug-style strings), `body` (multiline string; use `|` in YAML; markdown allowed).
- `slug` (optional): unique, lowercase `a-z0-9-_`. If omitted, a stable id is derived from the body for fragment links and RSS.

Run `pnpm run test wisdom` after editing. Unexpected fields are rejected.

## Front Matter Variables

### Required

- **`layout`** - Template to use (e.g., `single_post.njk`)
- **`title`** - Page title
- **`date`** - Publication date (posts only). Can be:
  - Full format: `"YYYY-MM-DDTHH:mm:ss-HH:mm"` (e.g., `"2025-10-08T12:00:00-08:00"`)
  - Date-only format: `"YYYY-MM-DD"` (e.g., `"2025-10-08"`) - assumes PST/PDT
  - See [Date and Timezone Handling](date-timezone-handling.md) for details
- **`tags`** - Array including `post`. Additional tags become `article:tag` meta tags.

### Optional

- **`description`** - Meta description (20-300 chars recommended, warnings only if outside range). Defaults to title if omitted.
- **`ogImage`** - OG image path. Use `auto` or omit to auto-generate. Format: `/assets/images/og/YYYY-MM-DD-post-slug.png`
- **`permalink`** - Custom URL structure
- **`eleventyExcludeFromCollections`** - Set to `true` to exclude
- **`draft`** - Set to `true` to mark as draft. Drafts are excluded from production builds but visible in dev mode.
- **`contentWarning`** - Warning text displayed before gated content. When set, the RSS feed shows only this warning with a link instead of the full post content. Pair with `<details>/<summary>` in the markdown body to collapse content on-site.

## Frontmatter Formatting

This section outlines best practices for editing frontmatter in markdown files to prevent parsing errors.

Front matter is **YAML between two `---` lines**: an opening delimiter on line 1, then key/value pairs (plain YAML — do not prefix keys with Markdown heading syntax such as `##`), then a **closing `---`** before the Markdown body. Omitting the closing fence or mixing in heading syntax breaks Eleventy’s parser (gray-matter) and can drop fields silently (for example, `#` starts a YAML comment).

### Description Field Formatting

The `description` field in frontmatter is particularly prone to parsing errors because it often contains:
- Quotes (single or double)
- Colons
- Special characters
- Apostrophes

#### Rules for Description Values

1. **Always quote descriptions** that contain:
   - Colons (`:`)
   - Quotes (`"` or `'`)
   - Special YAML characters (`#`, `|`, `>`, `&`, `*`, `!`, `%`, `@`, `` ` ``)
   - Leading or trailing whitespace

2. **Escaping quotes**:
   - If using double quotes, escape internal double quotes with `\"`
   - Example: `description: "He said \"hello\" to me."`
   - If the string contains single quotes but no double quotes, you can use single quotes
   - Example: `description: 'It's a great day.'`
   - If the string contains both single and double quotes, use double quotes and escape the double quotes
   - Example: `description: "He said \"It's great\" to me."`

3. **Common patterns**:
   ```yaml
   # Simple description (no quotes needed)
   description: A simple description without special characters
   
   # Description with colon (needs quotes)
   description: "A description with a colon: this is important"
   
   # Description with quotes (escape internal quotes)
   description: "He said \"hello\" to me"
   
   # Description with apostrophe (can use single quotes)
   description: 'It's a great day'
   
   # Description with both (use double quotes, escape double quotes)
   description: "He said \"It's great\" to me"
   ```

### Using the Format Utility

When making programmatic changes to frontmatter, use the `formatYamlString` utility:

```javascript
const { formatYamlString } = require('./scripts/utils/frontmatter-utils');

const description = 'He said "hello" to me';
const formatted = formatYamlString(description);
// Result: "He said \"hello\" to me"
```

### Testing

Run the frontmatter test to catch frontmatter parsing errors:

```bash
pnpm run test frontmatter
```

This checks all posts under `src/_posts/` and every top-level `src/*.md` template (for example `about.md`, `now.md`, `changelog.md`, error pages). It will identify parsing errors before they cause build failures.

### Common Errors

1. **Unescaped quotes**: `description: He said "hello"` → Should be: `description: "He said \"hello\""`
2. **Unquoted colons**: `description: This is important: remember it` → Should be: `description: "This is important: remember it"`
3. **Mixed quotes**: `description: "He said 'hello'"` → This is fine, but be consistent
4. **Trailing spaces in quotes**: `description: "Text "` → Remove trailing spaces or quote properly

## Open Graph Images

OG images are auto-generated for posts and for templates tagged `page` (or the portfolio page), including nested routes such as `src/wisdom/index.njk`. For a page, the PNG filename comes from `permalink` (for example `/wisdom/` → `wisdom.png`).

Templates that use `pagination:` are skipped by the generator (one file builds many URLs, so a single PNG would be wrong). Point those at a shared image, typically `/assets/images/og/index.png`.

### Usage

- **Auto-generate**: Set `ogImage: auto` or omit the field
- **Manual**: Set `ogImage` to a custom path (e.g., `/assets/images/custom-og.png`)

Posts use `/assets/images/og/YYYY-MM-DD-post-slug.png`. Pages use the permalink-derived slug as above.

### Preview

Preview at `http://localhost:8080/ogimages/`, or open `_site/ogimages/index.html` from disk after a build — styles resolve there too (relative asset URLs).

For technical details on generation, see [commands.md](commands.md#-open-graph-image-generation).

## PDF Pages

Portfolio items can display PDFs page-by-page as images with notes.

### Setup (First Time Only)

PDF conversion requires Poppler, which can be installed via Homebrew:

```bash
brew install poppler
```

This is a one-time setup. After installation, you can convert PDFs as needed.

### Converting a PDF

1. Run the conversion script you need:
   - **Slides + speaker notes (recommended when you have a `.pptx`):** export a **PDF** and the **same deck as `.pptx`** from Google Slides or PowerPoint, then:
     ```bash
     pnpm run convert-presentation "path/to/deck.pdf" "path/to/deck.pptx" [year/month]
     ```
     One-time: `pnpm run setup-deck-python` (project venv with `python-pptx`; avoids Homebrew PEP 668 pip errors). See [commands.md § PDF page conversion](commands.md#-pdf-page-conversion) for full detail.
   - **PDF + your own notes file:** `pnpm run convert-pdf-with-notes "file.pdf" "notes.txt" [year/month]`
   - **PDF only (placeholder captions):** `pnpm run convert-pdf "path/to/file.pdf" [year/month]`

   The `year/month` parameter is optional. If omitted, it defaults to the current year/month (e.g., `2024/12`).

   If Poppler is not installed, the script will provide clear error messages with installation instructions.

   For technical details on what each command does, see [commands.md](commands.md#-pdf-page-conversion).

2. Copy the generated template into your portfolio item markdown file

3. If you used `convert-pdf` only, add notes for each page in the `<figcaption>` elements; with `convert-presentation` or `convert-pdf-with-notes`, captions are pre-filled from the deck or notes file (edit as needed)

### Example

```bash
pnpm run convert-pdf "Product Trio.pdf" 2022/12
```

This generates:
- Images: `src/assets/images/2022/12/product-trio-page-1.png`, `product-trio-page-2.png`, etc.
- PDF: `src/assets/pdfs/2022/12/Product Trio.pdf`
- Markdown template with figure elements for each page

### Template Output

The script generates markdown like this:

```markdown
<figure>
  <img src="/assets/images/2022/12/product-trio-page-1.png" alt="product-trio page 1">
  <figcaption>Page 1: [Add notes about this page]</figcaption>
</figure>

<figure>
  <img src="/assets/images/2022/12/product-trio-page-2.png" alt="product-trio page 2">
  <figcaption>Page 2: [Add notes about this page]</figcaption>
</figure>

[Download full PDF](/assets/pdfs/2022/12/Product Trio.pdf)
```

Replace the placeholder notes with actual descriptions for each page.

### Notes

- Notes are written in markdown (in `<figcaption>` elements), consistent with other portfolio items
- Images follow the same directory structure as other portfolio images
- PDFs are stored in `src/assets/pdfs/` for reference and download
- The conversion happens during authoring, not during build

## Images with Captions

Images with captions use an extended markdown syntax that automatically generates optimized, responsive images.

### Syntax

```markdown
![Alt text](/assets/images/path/to/image.png)
*Caption text here*
```

The image will be automatically:
- Optimized in multiple sizes (WebP and JPEG formats)
- Wrapped in a `<figure>` element with `<picture>` for responsive images
- Lazy-loaded for better performance
- Linked for progressive enhancement so readers can open a near-fullscreen lightbox (or the large image URL without JavaScript)

### Example

```markdown
![Dashboard view](/assets/images/2022/12/dashboard.png)
*Main dashboard showing key metrics and navigation*
```

This generates a `<figure>` element with:
- Responsive `<picture>` element with multiple image sizes
- Optimized WebP and JPEG formats
- Lazy loading and async decoding
- Caption in a `<figcaption>` element

### Notes

- Images are automatically optimized during build
- Multiple sizes are generated for different screen sizes
- Images are stored in `/img/` directory in the output
- Captions are optional - omit the italic line if no caption is needed
- Standard markdown image syntax (without caption) still works and images are still optimized

## Redirects

Handle URL changes (e.g., corrected post dates) using server-side 301 redirects.

### Create a Redirect

1. Edit `src/_data/redirects.yaml`
2. Add a redirect entry:

```yaml
redirects:
  - from: /old/path/
    to: /new/path/
```

3. Rebuild the site. Redirect rules are automatically generated in `.htaccess` during build.

### Redirect Format

- **`from`**: Old URL path (relative, with leading slash)
- **`to`**: New URL path (relative or absolute URL)

Examples:
```yaml
redirects:
  # Date correction
  - from: /2022/11/09/post-slug/
    to: /2022/11/08/post-slug/
  
  # Absolute URL redirect
  - from: /old-page/
    to: https://example.com/new-page/
```

### How It Works

Redirects are generated as Apache `Redirect 301` rules in `.htaccess` during the build process. This provides:
- Proper 301 redirects (better for SEO than client-side redirects)
- Fast server-side redirects (no page load required)
- Centralized management in a single YAML file

The redirect section in `.htaccess` is auto-generated and should not be edited manually.

### When to Use

- Post date corrections
- Slug changes
- URL structure migrations
- Any permanent URL change preserving old links
- Addressing high-volume 404 errors when the resource exists
