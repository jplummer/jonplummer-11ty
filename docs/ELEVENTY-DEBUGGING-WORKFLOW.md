# Eleventy Debugging Workflow for AI Agents

## Core Principle: Assume Eleventy Works Correctly

When encountering unexpected behavior, **start by assuming Eleventy is working as designed**. Many "bugs" are due to misunderstanding how Eleventy's features work. This workflow helps you understand Eleventy's behavior before writing custom workarounds.

## Debugging Workflow

### Step 1: Understand What You're Seeing

Before assuming something is broken, describe the behavior:
- What did you expect to happen?
- What actually happened?
- What specific feature is involved? (collections, pagination, data cascade, dates, etc.)

### Step 2: Check Eleventy's Documentation

**For each unexpected behavior, check the relevant Eleventy docs:**

#### Collections Not Working as Expected?
- Check: `docs/eleventy/collections.md`
- Check: `docs/eleventy/collections-api.md`
- Common issues: Order, filtering, tags not working
- **Eleventy's way**: Use `tags` in frontmatter, access via `collections` object

#### Data Not Merging Correctly?
- Check: `docs/eleventy/data-cascade.md`
- Check: `docs/eleventy/data-deep-merge.md`
- Common issues: Data from different sources not combining as expected
- **Eleventy's way**: Data cascade merges automatically, use `override:` prefix to opt out

#### Data Files Not Loading?
- Check: `docs/eleventy/data-global.md` - Only JSON and JS supported by default
- Check: `docs/eleventy/data-custom.md` - YAML/TOML require `addDataExtension()` configuration
- Common issues: File format not supported, file naming, file location
- **Eleventy's way**: JSON and JS work out of box, other formats need configuration

#### Dates Off or Not Parsing?
- Check: `docs/eleventy/dates.md`
- Common issues: Dates off by one day, timezone issues, format not recognized
- **Eleventy's way**: Eleventy parses dates automatically, handles timezones

#### Pagination Not Working?
- Check: `docs/eleventy/pagination.md`
- Common issues: Pages not generating, wrong order, missing items
- **Eleventy's way**: Use `pagination` frontmatter, Eleventy generates pages automatically

#### Filters/Shortcodes Not Working?
- Check: `docs/eleventy/filters.md`
- Check: `docs/eleventy/shortcodes.md`
- Common issues: Filter not available, wrong output, async issues
- **Eleventy's way**: Register with `addFilter()` or `addShortcode()`, available in templates

#### Templates Not Rendering?
- Check: `docs/eleventy/languages/nunjucks.md` (or your template language)
- Check: `docs/eleventy/layouts.md`
- Common issues: Template syntax errors, layout not applying, includes not found
- **Eleventy's way**: Templates process automatically, layouts chain, includes work from `_includes/`

The entirety of Eleventy's docs are cached in `docs/eleventy/`; search through these folders for relevant information about what we are trying to accomplish.

### Step 3: Use Eleventy's Debug Tools

Before writing custom debugging code, use Eleventy's built-in debugging:

```bash
# Enable debug mode to see what Eleventy is doing
DEBUG=Eleventy* pnpm run build

# Check specific debug categories
DEBUG=Eleventy:Template* pnpm run build  # Template processing
DEBUG=Eleventy:Collection* pnpm run build  # Collections
DEBUG=Eleventy:Data* pnpm run build  # Data cascade
```

**Reference**: `docs/eleventy/debugging.md`

### Step 4: Check Common Pitfalls

Eleventy has documented common issues that look like bugs:

**Reference**: `docs/eleventy/pitfalls.md`

Common gotchas:
- Dates off by one day → Timezone handling (see `docs/eleventy/dates.md`)
- Collections out of order → Array `.reverse()` mutation (see `docs/eleventy/collections.md`)
- Permalink issues → YAML syntax or missing trailing slash (see `docs/eleventy/permalinks.md`)
- Data not merging → Data cascade behavior (see `docs/eleventy/data-cascade.md`)

### Step 5: Verify Expected Behavior

Before writing a workaround, verify:
1. **Is this documented behavior?** Check the relevant doc file
2. **Is there a configuration option?** Check the config docs
3. **Is this a known limitation?** Check pitfalls and known issues
4. **Does Eleventy provide a different API for this?** Check feature docs

### Step 6: Only Then Consider Custom Code

**Only write custom code if:**
- You've verified Eleventy doesn't provide this feature natively
- You've checked the documentation thoroughly
- You understand why Eleventy behaves this way
- You've confirmed with the user that custom code is needed

## Common "Unexpected" Behaviors That Are Actually Correct

### Collections Are Empty
**Expected**: Collections only include items with matching `tags` in frontmatter
**Check**: `docs/eleventy/collections.md` - Collections use tags, not file locations

### Data From Different Sources Not Merging
**Expected**: Data cascade merges arrays/objects by default
**Check**: `docs/eleventy/data-cascade.md` - Use `override:` prefix to replace instead of merge

### Dates Are Off By One Day
**Expected**: Timezone handling - dates are parsed in UTC, displayed in local time
**Check**: `docs/eleventy/dates.md` - This is documented behavior, not a bug

### Pagination Only Shows First Page
**Expected**: Pagination generates multiple files, each is a separate page
**Check**: `docs/eleventy/pagination.md` - Each page is a separate template file

### Filters Don't Work in Certain Contexts
**Expected**: Filters are template helpers, not available in all contexts
**Check**: `docs/eleventy/filters.md` - Filters work in templates, not in data files

## Debugging Checklist

When debugging, use this checklist:

- [ ] Described the expected vs actual behavior
- [ ] Identified which Eleventy feature is involved
- [ ] Checked the relevant documentation file in `docs/eleventy/`
- [ ] Checked `docs/eleventy/pitfalls.md` for known issues
- [ ] Used Eleventy's debug mode (`DEBUG=Eleventy*`)
- [ ] Verified this isn't documented Eleventy behavior
- [ ] Confirmed with user before writing custom workarounds

## When to Ask the User

Ask the user before:
- Writing custom code to work around Eleventy behavior
- Reimplementing features Eleventy provides
- Modifying core Eleventy functionality
- Assuming Eleventy is broken

**Always explain**: "I see [behavior]. According to Eleventy docs, this is expected because [reason]. Should I [proposed solution] or is there a different approach you prefer?"

## Reference: Quick Doc Lookup

| Issue Type | Doc File |
|------------|----------|
| Collections not working | `docs/eleventy/collections.md` |
| Data not merging | `docs/eleventy/data-cascade.md` |
| Data files not loading | `docs/eleventy/data-global.md`, `docs/eleventy/data-custom.md` |
| Dates wrong | `docs/eleventy/dates.md` |
| Pagination issues | `docs/eleventy/pagination.md` |
| Filters not working | `docs/eleventy/filters.md` |
| Templates not rendering | `docs/eleventy/languages/nunjucks.md` |
| Permalinks wrong | `docs/eleventy/permalinks.md` |
| Performance issues | `docs/eleventy/debug-performance.md` |
| General debugging | `docs/eleventy/debugging.md` |
| Common gotchas | `docs/eleventy/pitfalls.md` |

