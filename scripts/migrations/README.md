# Migration Scripts

This directory contains one-time migration scripts that were used to transform content or structure during site development. These scripts are kept for historical reference but are not part of the regular build or development workflow.

## Scripts

- `normalize-portfolio-images.js` - Normalized portfolio post image markup from mixed Markdown/HTML figures to pure HTML
- `quote-post-descriptions.js` - Added quotes to post descriptions that needed them
- `add-post-descriptions.js` - Added missing descriptions to posts

## Usage

These scripts are not included in `package.json` and should only be run manually if needed for similar migrations in the future.
