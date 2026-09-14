/**
 * Format helpers for generated CHANGELOG.md lines.
 *
 * markdown-it linkify treats some file extensions as country TLDs
 * (`.md` is Moldova), so a bare `ideas.md` becomes https://ideas.md.
 * Inline code is not linkified.
 */

const FILENAME_EXT = 'md|njk|js|mjs|cjs|css|json|ya?ml|txt|html|py|sh|rs|ai|io';
const FILENAME_RE = new RegExp(
  String.raw`(?<![\`/])\b([\w.-]+\.(?:${FILENAME_EXT}))\b(?!\`)`,
  'gi'
);

function wrapFilenames(text) {
  if (!text) {
    return text;
  }
  return text.replace(FILENAME_RE, '`$1`');
}

module.exports = {
  wrapFilenames,
};
