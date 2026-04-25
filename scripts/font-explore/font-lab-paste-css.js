/**
 * Paste snippet for adopting lab stacks in your own stylesheet — order is for clarity,
 * not a mirror of `jonplummer.css`. Includes an explicit monospace token: browsers give
 * `code`/`pre` a monospace face by default, so body text stack does not apply there unless
 * you override (we set a dedicated stack instead of implying inheritance).
 *
 * Mono list matches Modern Font Stacks "Monospace Code" (`modern-font-stacks.js`, id
 * `monospace-code`); update both if that stack changes.
 *
 * @param {string} bodyFamily font-family list for body / default text
 * @param {string} headingFamily font-family list for headings
 * @returns {string}
 */
function formatFontLabPasteCss(bodyFamily, headingFamily) {
  var monoStack =
    "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace";

  if (bodyFamily === headingFamily) {
    return [
      '/* Tokens + hooks — order is for copying, not matching this site’s CSS file layout. */',
      '/* code/pre: UA styles use monospace; --font-family-mono sets it explicitly (not the body stack). */',
      '',
      ':root {',
      '  --font-family: ' + bodyFamily + ';',
      '  --font-family-mono: ' + monoStack + ';',
      '}',
      '',
      'body {',
      '  font-family: var(--font-family);',
      '}',
      '',
      'code, pre, kbd, samp {',
      '  font-family: var(--font-family-mono);',
      '}'
    ].join('\n');
  }

  return [
    '/* Tokens + hooks — order is for copying, not matching this site’s CSS file layout. */',
    '/* Headings: separate token only when body and heading stacks differ (your choice on a real site). */',
    '/* code/pre: UA styles use monospace; --font-family-mono sets it explicitly (not the body stack). */',
    '',
    ':root {',
    '  --font-family: ' + bodyFamily + ';',
    '  --font-family-headings: ' + headingFamily + ';',
    '  --font-family-mono: ' + monoStack + ';',
    '}',
    '',
    'body {',
    '  font-family: var(--font-family);',
    '}',
    '',
    'h1, h2, h3, h4 {',
    '  font-family: var(--font-family-headings);',
    '}',
    '',
    'code, pre, kbd, samp {',
    '  font-family: var(--font-family-mono);',
    '}'
  ].join('\n');
}

module.exports = { formatFontLabPasteCss };
