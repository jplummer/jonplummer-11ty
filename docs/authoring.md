# Authoring

## Front Matter Variables

### Required

- **`layout`** - Template to use (e.g., `single_post.njk`)
- **`title`** - Page title
- **`date`** - Publication date: `"YYYY-MM-DDTHH:mm:ss-HH:mm"` (posts only)
- **`tags`** - Array including `post`. Additional tags become `article:tag` meta tags.

### Optional

- **`description`** - Meta description (120-160 chars). Defaults to title if omitted.
- **`ogImage`** - OG image path. Use `auto` or omit to auto-generate. Format: `/assets/images/og/YYYY-MM-DD-post-slug.png`
- **`permalink`** - Custom URL structure
- **`eleventyExcludeFromCollections`** - Set to `true` to exclude
- **`draft`** - Set to `true` to mark as draft. Drafts are excluded from production builds but visible in dev mode.

## Open Graph Images

OG images are auto-generated for posts and pages.

### Usage

- **Auto-generate**: Set `ogImage: auto` or omit the field
- **Manual**: Set `ogImage` to a custom path (e.g., `/assets/images/custom-og.png`)

Generated images use format: `/assets/images/og/YYYY-MM-DD-post-slug.png`

### Preview

Preview at `http://localhost:8080/og-image-preview/` (excluded from deployment)

### Generation

- **Dev**: Auto-generated on file save
- **Deploy**: Auto-checked before deployment
- **Manual**: Run `npm run generate-og-images`

For technical details, see [commands.md](commands.md#-open-graph-image-generation).

## PDF Pages

Portfolio items can display PDFs page-by-page as images with notes.

### Setup (First Time Only)

PDF conversion requires Poppler, which can be installed via Homebrew:

```bash
brew install poppler
```

This is a one-time setup. After installation, you can convert PDFs as needed.

### Converting a PDF

1. Run the conversion script:
   ```bash
   npm run convert-pdf "path/to/file.pdf" [year/month]
   ```
   
   The `year/month` parameter is optional. If omitted, it defaults to the current year/month (e.g., `2024/12`).
   
   If Poppler is not installed, the script will provide clear error messages with installation instructions.

2. The script will:
   - Convert each PDF page to a PNG image
   - Save images to `src/assets/images/[year]/[month]/`
   - Copy the PDF to `src/assets/pdfs/[year]/[month]/`
   - Generate a markdown template with figure elements for each page

3. Copy the generated template into your portfolio item markdown file

4. Add notes for each page in the `<figcaption>` elements

### Example

```bash
npm run convert-pdf "Product Trio.pdf" 2022/12
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
