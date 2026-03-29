#!/usr/bin/env node
/**
 * Single-card font lab: index-shaped preview at live site type scale and colors
 * (jonplummer.css + system light/dark). Two selectors (headings vs rest) + optional lock.
 *
 * Usage:
 *   node scripts/font-explore/generate-font-gallery.js
 *   pnpm run font-gallery
 *
 * @see https://modernfontstacks.com
 * @see docs/font-stack-exploration.md
 */

const fs = require('fs');
const path = require('path');
const { MODERN_FONT_STACKS, SITE_DEFAULT_STACK_ID } = require('./modern-font-stacks.js');

const OUT_DIR = path.join(__dirname, 'output');

/** Initial heading stack (see also DEFAULT_BODY_STACK_ID, DEFAULT_SYNC_STACKS). */
const DEFAULT_HEADING_STACK_ID = SITE_DEFAULT_STACK_ID;

/** Initial body stack. */
const DEFAULT_BODY_STACK_ID = SITE_DEFAULT_STACK_ID;

/** If true, generated HTML has the “same stack” checkbox checked and both selects match. */
const DEFAULT_SYNC_STACKS = true;

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stackById(id) {
  return MODERN_FONT_STACKS.find((s) => s.id === id);
}

/**
 * Index-shaped slice — same structure as color gallery `renderHomePreview`; colors from
 * global :root (no token overrides here). Bands mimic `body > header|main|footer`.
 */
function siteHomePreviewFragment({
  rootId,
  jpId,
  jpStyle,
  headingStyle
}) {
  const rootIdAttr = rootId ? ` id="${escapeHtml(rootId)}"` : '';
  const jpIdAttr = jpId ? ` id="${escapeHtml(jpId)}"` : '';
  const jpStyleAttr = jpStyle ? ` style="${escapeHtml(jpStyle)}"` : '';
  const hStyle = headingStyle ? ` style="${escapeHtml(headingStyle)}"` : '';

  return `<div class="theme-root home-preview"${rootIdAttr}>
        <div class="jp-page"${jpIdAttr}${jpStyleAttr}>
          <header>
            <a class="skip" href="#font-preview-main">Skip to content</a>
            <hgroup>
              <h1${hStyle}><a href="#" rel="home">Jon Plummer</a></h1>
              <p>Today I Learned</p>
            </hgroup>
            <nav aria-label="Site navigation">
              <ul>
                <li><a href="#">/about</a></li>
                <li><a href="#">/now</a></li>
                <li><a href="#">/portfolio</a></li>
                <li><a href="#" class="sim-visited">/wisdom</a></li>
              </ul>
            </nav>
          </header>
          <main id="font-preview-main" aria-label="Main content">
            <article>
              <header>
                <h1${hStyle}><a href="#" rel="bookmark">What we owe junior designers in review</a></h1>
              </header>
              <section>
                <p>Feedback works when it is <a href="#">specific</a> and <a href="#" class="sim-visited">grounded in examples</a>. <strong>Kind</strong> delivery helps the second sentence read like a real lede.</p>
                <pre><code>const tone = 'curious';</code></pre>
              </section>
              <footer>
                <p class="posted-on"><time datetime="2026-03-15">March 15, 2026</time></p>
              </footer>
            </article>
            <article class="link-item">
              <section>
                <p>
                  <a href="#">How product trios survive reorgs</a><span class="link-description"> — remaindered link blurb.</span>
                </p>
              </section>
            </article>
            <nav class="pagination" aria-label="Post pagination">
              <a class="prev" href="#">← Older posts</a>
              <a class="next" href="#">Newer posts →</a>
            </nav>
          </main>
          <footer aria-label="Site footer">
            <p class="license">Copyright 2026 Jon Plummer</p>
          </footer>
        </div>
        <div class="swatch-legend" aria-hidden="true">
          <span class="chip"><span class="chip-swatch" style="background-color: var(--background-color)"></span> Page <code>--background-color</code></span>
          <span class="chip"><span class="chip-swatch" style="background-color: var(--content-background-color)"></span> Content <code>--content-background-color</code></span>
        </div>
      </div>`;
}

/**
 * Live-sized preview: no shrunken type tokens — inherit :root from jonplummer.css.
 * Replicates body band layout under .jp-page (selectors differ from body>header on site).
 */
const HOME_PREVIEW_SCOPED_CSS = `
    .font-preview-lane {
      max-width: var(--max-width);
      margin-inline: auto;
      width: 100%;
      box-sizing: border-box;
    }
    .theme-root.home-preview {
      width: 100%;
    }
    .theme-root.home-preview .jp-page {
      margin: 0;
      background-color: var(--background-color);
      color: var(--text-color);
      overflow: hidden;
      border-radius: 6px;
      border: 1px solid color-mix(in srgb, var(--border-color) 70%, transparent);
      box-shadow: 0 1px 8px rgba(0,0,0,0.12);
      padding: 0;
    }
    .theme-root.home-preview .swatch-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem 0.75rem;
      margin-top: var(--spacing-sm);
      font-size: var(--font-size-xs);
      line-height: var(--line-height-xs);
      color: var(--text-color-light);
    }
    .theme-root.home-preview .swatch-legend .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }
    .theme-root.home-preview .swatch-legend code {
      font-size: 0.85em;
      opacity: 0.92;
    }
    .theme-root.home-preview .chip-swatch {
      width: 1.1rem;
      height: 1.1rem;
      border-radius: 2px;
      border: 1px solid color-mix(in srgb, var(--border-color) 85%, transparent);
      flex-shrink: 0;
      display: inline-block;
      vertical-align: middle;
    }
    .theme-root.home-preview .jp-page > header,
    .theme-root.home-preview .jp-page > main,
    .theme-root.home-preview .jp-page > footer {
      margin: 0 auto;
      padding: var(--gutter);
      max-width: var(--max-width);
      width: 100%;
      box-sizing: border-box;
      background-color: var(--content-background-color);
    }
    .theme-root.home-preview article section pre {
      width: fit-content;
      max-width: 100%;
      box-sizing: border-box;
    }
    .theme-root.home-preview a.sim-visited {
      color: var(--link-visited-color);
    }
`;

function renderSelectOptions(selectedId) {
  return MODERN_FONT_STACKS.map((s) => {
    const sel = s.id === selectedId ? ' selected' : '';
    return `    <option value="${escapeHtml(s.id)}"${sel}>${escapeHtml(s.name)}</option>`;
  }).join('\n');
}

function renderFontLabCard() {
  const head = stackById(DEFAULT_HEADING_STACK_ID);
  if (!head) {
    throw new Error('Invalid DEFAULT_HEADING_STACK_ID');
  }

  const stacksJson = JSON.stringify(
    MODERN_FONT_STACKS.map((s) => ({ id: s.id, name: s.name, family: s.family }))
  );

  const syncChecked = DEFAULT_SYNC_STACKS ? ' checked' : '';
  const headingSel = DEFAULT_HEADING_STACK_ID;
  const bodySel = DEFAULT_SYNC_STACKS ? DEFAULT_HEADING_STACK_ID : DEFAULT_BODY_STACK_ID;
  const bodyStack = stackById(bodySel);
  if (!bodyStack) {
    throw new Error('Invalid body stack id for initial state');
  }

  const cssBlock = `.jp-page,
.jp-page nav,
.jp-page p,
.jp-page li,
.jp-page .license,
.jp-page .posted-on,
.jp-page .link-description,
.jp-page pre,
.jp-page code {
  font-family: ${bodyStack.family};
}
h1, h2, h3, h4 {
  font-family: ${head.family};
}`;

  return `<section class="card font-tool-card" aria-labelledby="font-lab-title">
  <header class="card-h">
    <h2 class="card-title" id="font-lab-title">Font stack preview</h2>
  </header>
  <p class="tool-note">Uses the same index-shaped markup as the live home page. Colors and type scale come from <code>jonplummer.css</code> (your OS light/dark choice). Stacks: <a href="https://modernfontstacks.com" target="_blank" rel="noopener noreferrer">Modern Font Stacks</a>.</p>
  <div class="tool-controls" role="group" aria-label="Font stack selection">
    <label class="sync-label">
      <input type="checkbox" id="font-sync-stacks"${syncChecked}>
      Same font stack for headings and everything else
    </label>
    <div class="tool-selects">
      <div class="tool-field">
        <label for="font-heading-stack">Headings (<code>h1</code>–<code>h4</code>)</label>
        <select id="font-heading-stack" name="font-heading-stack">
${renderSelectOptions(headingSel)}
        </select>
      </div>
      <div class="tool-field">
        <label for="font-body-stack">Everything else</label>
        <select id="font-body-stack" name="font-body-stack">
${renderSelectOptions(bodySel)}
        </select>
      </div>
    </div>
  </div>
  <div class="font-preview-lane">
  ${siteHomePreviewFragment({
    rootId: 'font-preview-root',
    jpId: 'font-preview-jp',
    jpStyle: `font-family: ${bodyStack.family}`,
    headingStyle: `font-family: ${head.family}`
  })}
  </div>
  <details class="copy-block">
    <summary>Example CSS</summary>
    <pre class="code"><code id="font-css-code">${escapeHtml(cssBlock)}</code></pre>
  </details>
  <script type="application/json" id="font-stacks-json">${stacksJson.replace(/</g, '\\u003c')}</script>
  <script>
(function () {
  var elJson = document.getElementById('font-stacks-json');
  if (!elJson) return;
  var stacks = JSON.parse(elJson.textContent);
  var byId = {};
  for (var i = 0; i < stacks.length; i++) {
    byId[stacks[i].id] = stacks[i];
  }
  var selH = document.getElementById('font-heading-stack');
  var selB = document.getElementById('font-body-stack');
  var sync = document.getElementById('font-sync-stacks');
  var mixJp = document.getElementById('font-preview-jp');
  var cssOut = document.getElementById('font-css-code');
  function applyFonts() {
    var h = byId[selH.value];
    var b = byId[selB.value];
    if (!h || !b || !mixJp || !cssOut) return;
    mixJp.style.fontFamily = b.family;
    mixJp.querySelectorAll('h1, h2, h3, h4').forEach(function (el) {
      el.style.fontFamily = h.family;
    });
    cssOut.textContent = '.jp-page,\\n.jp-page nav,\\n.jp-page p,\\n.jp-page li,\\n.jp-page .license,\\n.jp-page .posted-on,\\n.jp-page .link-description,\\n.jp-page pre,\\n.jp-page code {\\n  font-family: ' + b.family + ';\\n}\\nh1, h2, h3, h4 {\\n  font-family: ' + h.family + ';\\n}';
  }
  function onHeadingChange() {
    if (sync && sync.checked) {
      selB.value = selH.value;
    }
    applyFonts();
  }
  function onBodyChange() {
    if (sync && sync.checked) {
      selH.value = selB.value;
    }
    applyFonts();
  }
  function onSyncChange() {
    if (sync && sync.checked) {
      selB.value = selH.value;
    }
    applyFonts();
  }
  selH.addEventListener('change', onHeadingChange);
  selB.addEventListener('change', onBodyChange);
  if (sync) {
    sync.addEventListener('change', onSyncChange);
  }
  applyFonts();
})();
  </script>
</section>`;
}

function renderHtml() {
  const card = renderFontLabCard();

  return `<!DOCTYPE html>
<html lang="en" class="font-gallery-ui">
<head>
  <meta charset="utf-8">
  <title>Font stack preview (Modern Font Stacks)</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="../../../src/assets/css/jonplummer.css">
  <style>
    html.font-gallery-ui { width: 100%; overflow-x: hidden; }
    body.font-gallery-ui {
      margin: 0;
      padding: 1.25rem clamp(1rem, 3vw, 2rem);
      background: #1a1a1a !important;
      color: #eee !important;
      font-family: system-ui, sans-serif;
      max-width: none;
      width: 100%;
      box-sizing: border-box;
    }
    .font-gallery-ui h1.page-title { margin-top: 0; font-size: 1.25rem; font-weight: 600; }
    .font-gallery-ui .meta {
      color: #aaa;
      font-size: 0.9rem;
      margin-bottom: 1.25rem;
      max-width: 62rem;
      line-height: 1.45;
    }
    .font-gallery-ui .meta a { color: #9ec5fe; }
    .font-gallery-ui .font-tool-card {
      border: 1px solid #333;
      border-radius: 8px;
      padding: 1rem 1.15rem 1.25rem;
      background: #222;
      width: 100%;
      max-width: calc(var(--max-width) + 2 * var(--gutter));
      margin-inline: auto;
      box-sizing: border-box;
    }
    .font-gallery-ui .card-h {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.5rem;
    }
    .font-gallery-ui .card-title {
      margin: 0;
      font-size: 1.05rem;
      color: #eee;
    }
    .font-gallery-ui .tool-note {
      font-size: 0.88rem;
      color: #bbb;
      line-height: 1.45;
      margin: 0 0 1rem;
      max-width: 50rem;
    }
    .font-gallery-ui .tool-note code { font-size: 0.82rem; }
    .font-gallery-ui .tool-controls {
      margin-bottom: 1rem;
      padding: 0.65rem 0.75rem;
      background: #1a1a1a;
      border-radius: 6px;
      border: 1px solid #333;
    }
    .font-gallery-ui .sync-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #ddd;
      cursor: pointer;
      margin: 0 0 0.75rem;
    }
    .font-gallery-ui .sync-label input {
      margin: 0;
      flex-shrink: 0;
    }
    .font-gallery-ui .tool-selects {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem 1.25rem;
      align-items: flex-end;
    }
    .font-gallery-ui .tool-field {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      min-width: min(20rem, 100%);
      flex: 1 1 12rem;
    }
    .font-gallery-ui .tool-field label {
      font-size: 0.75rem;
      color: #aaa;
    }
    .font-gallery-ui .tool-field label code { font-size: 0.7rem; }
    .font-gallery-ui .tool-field select {
      width: 100%;
      max-width: 22rem;
      padding: 0.4rem 0.5rem;
      border-radius: 4px;
      border: 1px solid #555;
      background: #111;
      color: #eee;
      font-size: 0.88rem;
    }
${HOME_PREVIEW_SCOPED_CSS}
    .font-gallery-ui .copy-block { margin-top: 0.85rem; }
    .font-gallery-ui .copy-block summary {
      cursor: pointer;
      font-size: 0.85rem;
      color: #ccc;
      list-style: revert;
    }
    .font-gallery-ui .copy-block summary::after { content: none !important; }
    .font-gallery-ui details.copy-block[open] > summary::after { content: none !important; }
    .font-gallery-ui .code {
      font-size: 0.72rem;
      overflow: auto;
      max-height: 14rem;
      background: #111;
      padding: 0.5rem;
      border-radius: 4px;
      color: #ddd;
      border: 1px solid #333;
      margin: 0.5rem 0 0;
    }
  </style>
</head>
<body class="font-gallery-ui">
  <h1 class="page-title">Font stack preview</h1>
  <p class="meta">Single home-page slice at <strong>live</strong> type scale and <code>light-dark()</code> colors from <code>jonplummer.css</code>. Open from the repo so the stylesheet resolves. Regenerate: <code>pnpm run font-gallery</code>. <a href="../../color-explore/output/index.html">Color gallery</a>.</p>
${card}
</body>
</html>`;
}

function main() {
  try {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const html = renderHtml();
    fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html, 'utf8');
    const jsonPayload = {
      source: 'https://modernfontstacks.com',
      siteDefaultStackId: SITE_DEFAULT_STACK_ID,
      stacks: MODERN_FONT_STACKS,
      defaults: {
        headingStackId: DEFAULT_HEADING_STACK_ID,
        bodyStackId: DEFAULT_BODY_STACK_ID,
        syncStacks: DEFAULT_SYNC_STACKS
      }
    };
    fs.writeFileSync(path.join(OUT_DIR, 'stacks.json'), JSON.stringify(jsonPayload, null, 2), 'utf8');
    console.log(`Wrote ${path.join(OUT_DIR, 'index.html')}`);
    console.log(`Wrote ${path.join(OUT_DIR, 'stacks.json')}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
