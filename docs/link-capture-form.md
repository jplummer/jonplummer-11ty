# Link Capture Form

A simple web form for adding links to `links.yaml` from any device. Validates input, formats YAML correctly, and commits directly to GitHub.

## Quick Start

### First Time Setup (Any Device)

1. **Get GitHub Personal Access Token** (only need to do this once)
   - Go to: https://github.com/settings/tokens/new
   - Token name: `Link Capture Form` (or any name you prefer)
   - Expiration: Choose your preference (recommend 1 year)
   - Select scope: **`repo`** (Full control of private repositories)
   - Click "Generate token"
   - **Copy the token immediately** (you won't see it again)
   - Save it somewhere secure (password manager, notes app)

2. **Open the Form**
   - Deployed: `https://jonplummer.com/add-link.html`
   - Local dev: `http://localhost:8080/add-link.html`
   - Direct file: Open `src/add-link.html` in any browser

3. **Enter Token**
   - Paste your GitHub token in the form
   - Click "Save Token"
   - Token is stored in your browser's localStorage (only on this device)

4. **Add Links**
   - Fill in URL, title, description (optional), and date
   - Click "Add Link"
   - Link will be committed to `src/_data/links.yaml` in your repository

### Using on Additional Devices

When you open the form on a new device/browser:
1. Open the form (bookmark it for easy access)
2. The form will prompt for your GitHub token
3. Paste the same token you created earlier
4. Click "Save Token"
5. Start adding links

**Mobile tip:** Add the form to your phone's home screen for one-tap access.

### Deploying Your Changes

The form only commits to GitHub. To update your live site:

1. `git pull` - Get the links from GitHub
2. `pnpm run build` - Build the site
3. `pnpm run test fast` - Validate (optional but recommended)
4. `pnpm run deploy` - Deploy to live site
5. `git push` - Sync back to GitHub

You can batch this—collect several links over days/weeks, then deploy when ready.

## How It Works

The form:
- Validates input client-side (matches `links-yaml.js` test rules)
- Reads current `links.yaml` via GitHub API
- Merges new link into existing structure (groups by date)
- Formats YAML with proper quoting and escaping
- Commits directly to repository via GitHub API

**Architecture:**
```
Form (HTML/JS) → GitHub API → links.yaml (in repo)
```

## Usage Tips

### Mobile Usage
- Bookmark the form on your phone's home screen for quick access
- The form is mobile-optimized with large touch targets
- Date defaults to today, so you can quickly capture links

### Date Handling
- Links are grouped by date (YYYY-MM-DD format)
- Multiple links on the same date are grouped together
- Dates are sorted newest first in the YAML file

### Description Field
- Optional, but useful for quotes or context
- Can include quotes, colons, markdown - will be properly escaped
- Empty descriptions are omitted from YAML

### Validation & YAML Formatting

The form validates and formats to prevent common authoring mistakes:

**Validation (client-side, before committing):**
- URL: Required, must be valid and start with `http://` or `https://`
- Title: Required, 1-1000 characters
- Date: Required, valid YYYY-MM-DD format
- Description: Optional, any text (quotes, colons, markdown allowed)

**YAML Formatting (automatic):**
- Properly quotes strings with special characters (colons, quotes, etc.)
- Escapes quotes and backslashes in descriptions
- Trims whitespace from all fields
- Omits empty descriptions (keeps YAML clean)
- Maintains date grouping and sort order (newest first)

**Matches test validation:**
All formatting matches `scripts/test/links-yaml.js` requirements, so links added via the form will pass validation tests

## Troubleshooting

### "Invalid GitHub token" Error
- Check that your token has `repo` scope
- Verify the token hasn't expired
- Try generating a new token

### "File was modified" Error
- Someone else (or you from another device) modified `links.yaml`
- Refresh the form and try again
- The form will re-read the current file and merge your link

### "links.yaml file not found" Error
- Verify the file exists at `src/_data/links.yaml` in your repository
- Check that the repository name is correct in the form

### Token Not Saving
- Check that localStorage is enabled in your browser
- Try a different browser
- Clear browser cache and try again

### 404 Error in Dev Server
- Make sure `add-link.html` is in `src/` directory
- Restart your dev server after adding passthrough config
- Check that passthrough copy is configured in `eleventy/config/passthrough.js`

## Security Notes

- **Token Storage**: Token is stored in browser localStorage
  - Only accessible from the same browser/device
  - Can be cleared by clearing browser data
  - Token can be revoked from GitHub settings at any time

- **Token Scope**: `repo` scope gives full repository access
  - Can read and write all files in the repository
  - Can create commits
  - Consider using a fine-grained token with limited permissions if concerned

- **Revoking Access**: 
  - Go to: https://github.com/settings/tokens
  - Find your token and click "Revoke"
  - Form will prompt for a new token on next use

## Testing

After adding a link via the form:

1. **Verify in Repository**
   - Check `src/_data/links.yaml` in GitHub
   - Verify the link was added correctly
   - Check YAML formatting is correct

2. **Run Validation**
   ```bash
   pnpm run test links-yaml
   ```
   - Should pass all validation checks
   - No YAML syntax errors
   - Link structure is valid

3. **Build and Test**
   ```bash
   pnpm run build
   ```
   - Site should build successfully
   - Link should appear on homepage (if date matches)

## File Locations

- **Form**: `src/add-link.html`
- **YAML Utilities**: `scripts/utils/yaml-links-utils.js` (for future CLI tools)
- **Target File**: `src/_data/links.yaml`
- **Validation**: `scripts/test/links-yaml.js`

## Future Enhancements

- Batch link entry (multiple links at once)
- Link preview (fetch page title/description automatically)
- Edit existing links
- Delete links
- Search/filter existing links
- Browser extension for one-click capture
- iOS Shortcut integration
- Migrate to full CMS (Decap/Sveltia) if more features needed

