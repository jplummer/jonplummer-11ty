# NotePlan Link Import

Import links from NotePlan to `links.yaml` without depending on Git for authoring.

## Quick Start

### 1. Capture Links in NotePlan

Create a note titled **"Links to import"** in NotePlan (in your Personal folder).

Add links in this format:
```markdown
* [Title – Author](URL) Description here
* [Another Title](URL) Another description
```

**Example:**
```markdown
# Links to import

* [Time's Up, Babycakes – Blair Enns](https://www.winwithoutpitching.com/times-up-babycakes/) Blair Enns of Win Without Pitching remind us that value-based pricing becomes increasingly relevant when more of the work is done, or at least facilitated, by AI. The [podcast](https://www.winwithoutpitching.com/posttype/podcast/) is pretty great, too.
```

### 2. Deploy (import happens automatically)

```bash
pnpm run build
pnpm run test fast
pnpm run deploy
```

The deploy script automatically:
- Imports links from NotePlan
- Finds your NotePlan note
- Parses all links
- Checks for duplicate URLs
- Adds new links to `links.yaml` with today's date
- Skips any duplicates (shows which ones and their existing date)
- Validates YAML formatting
- Builds and deploys the site

**Alternative:** Import manually first if you want to preview links locally:

```bash
pnpm run import-links
pnpm run build
# Review site at http://localhost:8080
pnpm run deploy
```

## Link Format

**Standard format:**
```markdown
* [Title – Author](URL) Description
```

**Components:**
- `*` or `-` bullet (required)
- `[Title]` markdown link text (required)
- `(URL)` markdown link URL (required)
- Description after the link (optional)

**Examples:**

```markdown
* [Design is more than code – Karri Saarinen](https://example.com) "I think centering this debate on code and tools is reductive."

* [Article Title](https://example.com/article?id=123)

* [Title with: colons and "quotes"](https://example.com) Description with apostrophes, "quotes", and [markdown](links).
```

## Special Character Handling

The import script automatically handles special characters that would break YAML:

### Apostrophes and Quotes

**Input:**
```markdown
* [It's "Great" – Author](URL) He said "it's wonderful"
```

**Output (in links.yaml):**
```yaml
  - url: "https://example.com"
    title: "It's \"Great\" – Author"
    description: "He said \"it's wonderful\""
```

**How it works:**
- Apostrophes (`'`) → Wrapped in double quotes
- Double quotes (`"`) → Escaped as `\"` and wrapped in double quotes
- Mixed quotes → Escapes double quotes, wraps in double quotes
- Colons (`:`) → Wrapped in quotes (YAML-significant)
- Backslashes (`\`) → Escaped as `\\`

### Other Special Characters

These are automatically detected and properly quoted:
- Colons (`:`)
- Hash (`#`)
- Pipe (`|`)
- Ampersand (`&`)
- Asterisk (`*`)
- Exclamation (`!`)
- Percent (`%`)
- At sign (`@`)
- Backtick (`` ` ``)
- Line breaks (not allowed in single-line values)

### YAML Reserved Words

These are automatically quoted:
- `true`, `false`, `null`
- `yes`, `no`
- `on`, `off`

## Options

### Clear Note After Import

```bash
pnpm run import-links --clear
```

Clears the NotePlan note after successful import (leaves just the heading).

### Use Specific Date

```bash
pnpm run import-links --date=2025-12-25
```

Uses the specified date instead of today. Useful for backdating links.

**Default:** Today's date (e.g., `2026-01-22`)

## Workflow

### Daily Link Capture (Mobile)

1. Find interesting article on phone
2. Share → NotePlan
3. NotePlan creates link in "Links to import" note
4. Add description/quote if desired
5. Continue browsing

### Weekly/Batch Import (Desktop)

1. Open terminal: `pnpm run import-links`
2. Review what will be imported
3. Confirm import
4. Build and deploy when ready

This decouples link capture from deployment, so you can collect many links and deploy once.

## NotePlan Location

The script looks for notes in:
```
~/Library/Containers/co.noteplan.NotePlan-setapp/Data/Library/Application Support/co.noteplan.NotePlan-setapp/Notes/Personal/
```

**Note:** This is for NotePlan via Setapp. If you have standalone NotePlan, the path may be:
```
~/Library/Containers/co.noteplan.NotePlan3/Data/Library/Application Support/co.noteplan.NotePlan3/Notes/
```

The script will search for a note with "Links to import" in the title.

## Validation

After import, validate the YAML:

```bash
pnpm run test links
```

This checks:
- YAML syntax is valid
- Date keys are properly formatted
- URLs are valid
- Titles are present and within length limits
- Descriptions are valid strings
- No unexpected fields

## Duplicate Detection

The import script automatically detects duplicate URLs:

```bash
⚠️  Skipped 1 duplicate(s):

   • Article Title – Author
     URL: https://example.com/article
     Already exists on: 2026-01-15
```

**How it works:**
- Compares URLs exactly (including query params)
- Checks all dates in `links.yaml`
- Reports which date the duplicate exists on
- Skips importing the duplicate
- Only writes to file if there are new links

**Why this helps:**
- Prevents accidental re-imports
- Shows you when you last saved a link
- Keeps `links.yaml` clean

**Note:** Different URLs to the same article (e.g., with/without query params) are treated as different links.

## Troubleshooting

### "Note not found"

- Create a note in NotePlan titled "Links to import"
- Make sure it's in your Personal folder
- Check the path if using standalone NotePlan (not Setapp)

### "No links found in note"

- Make sure links use markdown format: `* [Title](URL)`
- Check that bullets are `*` or `-`
- Verify the URL is in parentheses `(URL)`

### YAML Validation Errors

- Run `pnpm run test links` to see specific errors
- Check for unmatched brackets or parentheses in NotePlan
- Verify URLs are complete (start with `http://` or `https://`)

### Special Characters Not Working

- The script should handle all special characters automatically
- If you see YAML errors, check that brackets `[]` and parentheses `()` are matched
- Markdown links in descriptions are fine and will be preserved

## Tips

### Mobile Capture

**iOS Share Extension:**
1. Share from Safari/browser
2. Choose "NotePlan"
3. Select "Links to import" note
4. NotePlan adds: `* [Page Title](URL)`
5. Optionally add description below

**Quick format:**
- Title is auto-filled from page
- Add author after title: `[Title – Author]`
- Add description after link

### Batch Processing

Collect links over days/weeks, then import and deploy once:
- No need to deploy immediately
- Review and edit in NotePlan before importing
- Import validates before adding to `links.yaml`

### Markdown in Descriptions

You can use markdown in descriptions:
```markdown
* [Title](URL) Check out the [podcast](https://example.com/podcast) too.
```

Markdown links, bold, italic, etc. are preserved.

## Example Session

```bash
$ pnpm run import-links

🔍 Looking for NotePlan note: "Links to import"...

✅ Found note: Links to import.txt

📝 Found 3 link(s) to import

   1. Time's Up, Babycakes – Blair Enns
      URL: https://www.winwithoutpitching.com/times-up-babycakes/
      Description: Blair Enns of Win Without Pitching remind us that value-b...

   2. Design is more than code – Karri Saarinen
      URL: https://linear.app/now/design-is-more-than-code
      Description: "I think centering this debate on code and tools is reduc...

   3. Another Article – Author Name
      URL: https://example.com/article
      Description: Short description here.

✅ Imported 3 link(s) to links.yaml with date: 2026-01-22

Next steps:
  1. pnpm run test links  (validate)
  2. pnpm run build  (build site)
  3. pnpm run deploy  (deploy to live site)
```

## File Locations

- **NotePlan note**: `~/Library/Containers/.../Notes/Personal/Links to import.txt`
- **Import script**: `scripts/content/import-noteplan-links.js`
- **Target file**: `src/_data/links.yaml`
- **Validation test**: `scripts/test/links-yaml.js`
