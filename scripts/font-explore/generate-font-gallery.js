#!/usr/bin/env node
/**
 * Single-card font lab: index-shaped preview at live site type scale and colors
 * (jonplummer.css + system light/dark). Two selectors (headings vs rest); body select’s
 * first option mirrors the heading stack.
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
const { formatFontLabPasteCss } = require('./font-lab-paste-css.js');

const OUT_DIR = path.join(__dirname, 'output');
const FONT_LAB_SCOPED_CSS = path.join(
  process.cwd(),
  'src',
  'assets',
  'css',
  'font-lab-scoped.css'
);
const FONT_LAB_FRAGMENT = path.join(
  process.cwd(),
  'src',
  '_includes',
  'partials',
  'font-lab-card.fragment.html'
);

/** Same-origin `<script src>` so Apache CSP `script-src 'self'` allows controls (inline scripts blocked). */
const FONT_LAB_CARD_JS = path.join(process.cwd(), 'src', 'assets', 'js', 'font-lab-card.js');

function readScopedCss() {
  return fs.readFileSync(FONT_LAB_SCOPED_CSS, 'utf8');
}

/** Initial heading stack (body select defaults to “Same as headings”). */
const DEFAULT_HEADING_STACK_ID = SITE_DEFAULT_STACK_ID;

/** Sentinel `<option value>`: body text uses the heading stack until a concrete stack is chosen. */
const BODY_SAME_AS_HEADINGS = 'same-as-headings';

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
          <header aria-label="Preview: site header">
            <a class="skip" href="#font-preview-main">Skip to content</a>
            <hgroup>
              <h1${hStyle}><a href="#" rel="home">Jon Plummer</a></h1>
              <p>Today I Learned</p>
            </hgroup>
            <nav aria-label="Preview: primary navigation">
              <ul>
                <li><a href="#">/about</a></li>
                <li><a href="#">/now</a></li>
                <li><a href="#">/portfolio</a></li>
                <li><a href="#" class="sim-visited">/wisdom</a></li>
              </ul>
            </nav>
          </header>
          <section id="font-preview-main" class="font-preview-main" aria-labelledby="font-preview-main-heading">
            <h2 class="sr-only" id="font-preview-main-heading">Preview: main column</h2>
            <article>
              <header aria-label="Preview: article title">
                <h1${hStyle}><a href="#" rel="bookmark">What we owe junior designers in review</a></h1>
              </header>
              <section>
                <p>Feedback works when it is <a href="#">specific</a> and <a href="#" class="sim-visited">grounded in examples</a>. <strong>Kind</strong> delivery helps the second sentence read like a real lede.</p>
                <pre><code>const tone = 'curious';</code></pre>
              </section>
              <footer aria-label="Preview: article footer">
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
            <nav class="pagination" aria-label="Preview: pagination">
              <a class="prev" href="#">← Older posts</a>
              <a class="next" href="#">Newer posts →</a>
            </nav>
          </section>
          <footer aria-label="Preview: site footer">
            <p class="license">Copyright 2026 Jon Plummer</p>
          </footer>
        </div>
        <div class="swatch-legend" aria-hidden="true">
          <span class="chip"><span class="chip-swatch" style="background-color: var(--background-color)"></span> Page <code>--background-color</code></span>
          <span class="chip"><span class="chip-swatch" style="background-color: var(--content-background-color)"></span> Content <code>--content-background-color</code></span>
        </div>
      </div>`;
}

function renderSelectOptions(selectedId) {
  return MODERN_FONT_STACKS.map((s) => {
    const sel = s.id === selectedId ? ' selected' : '';
    return `    <option value="${escapeHtml(s.id)}"${sel}>${escapeHtml(s.name)}</option>`;
  }).join('\n');
}

/** Built browser file: shared formatter via .toString() so paste output stays DRY with Node. */
function fontLabCardRuntimeSource() {
  const formatterSource = formatFontLabPasteCss.toString();
  return `${formatterSource}

(function () {
  var elJson = document.getElementById('font-stacks-json');
  if (!elJson) return;
  var stacks = JSON.parse(elJson.textContent);
  var byId = {};
  for (var i = 0; i < stacks.length; i++) {
    byId[stacks[i].id] = stacks[i];
  }
  var SAME = '${BODY_SAME_AS_HEADINGS}';
  var selH = document.getElementById('font-heading-stack');
  var selB = document.getElementById('font-body-stack');
  var mixJp = document.getElementById('font-preview-jp');
  var cssOut = document.getElementById('font-css-code');
  function bodyResolved() {
    if (selB.value === SAME) return byId[selH.value];
    return byId[selB.value];
  }
  function applyFonts() {
    var h = byId[selH.value];
    var b = bodyResolved();
    if (!h || !b || !mixJp || !cssOut) return;
    mixJp.style.fontFamily = b.family;
    mixJp.querySelectorAll('h1, h2, h3, h4').forEach(function (el) {
      el.style.fontFamily = h.family;
    });
    cssOut.textContent = formatFontLabPasteCss(b.family, h.family);
  }
  function onHeadingChange() {
    applyFonts();
  }
  function onBodyChange() {
    applyFonts();
  }
  selH.addEventListener('change', onHeadingChange);
  selB.addEventListener('change', onBodyChange);
  applyFonts();
})();
`;
}

function renderBodySelectOptions(selectedBodyValue) {
  const sameSel = selectedBodyValue === BODY_SAME_AS_HEADINGS ? ' selected' : '';
  const lines = [
    `    <option value="${BODY_SAME_AS_HEADINGS}"${sameSel}>Same as headings</option>`
  ];
  for (const s of MODERN_FONT_STACKS) {
    const sel =
      s.id === selectedBodyValue && selectedBodyValue !== BODY_SAME_AS_HEADINGS
        ? ' selected'
        : '';
    lines.push(
      `    <option value="${escapeHtml(s.id)}"${sel}>${escapeHtml(s.name)}</option>`
    );
  }
  return lines.join('\n');
}

function renderFontLabCard(options = {}) {
  const scriptSrc =
    typeof options.scriptSrc === 'string' && options.scriptSrc.length > 0
      ? options.scriptSrc
      : '/assets/js/font-lab-card.js';

  const head = stackById(DEFAULT_HEADING_STACK_ID);
  if (!head) {
    throw new Error('Invalid DEFAULT_HEADING_STACK_ID');
  }

  const stacksJson = JSON.stringify(
    MODERN_FONT_STACKS.map((s) => ({ id: s.id, name: s.name, family: s.family }))
  );

  const headingSel = DEFAULT_HEADING_STACK_ID;
  const bodySelectValue = BODY_SAME_AS_HEADINGS;
  const bodyStack = head;

  const cssBlock = formatFontLabPasteCss(bodyStack.family, head.family);

  return `<section class="card font-tool-card" aria-label="Font stacks">
  <p class="tool-note">Uses the same index-shaped markup as the live home page. Colors and type scale come from <code>jonplummer.css</code> (your OS light/dark choice). Stacks: <a href="https://modernfontstacks.com" target="_blank" rel="noopener noreferrer">Modern Font Stacks</a>.</p>
  <div class="tool-controls" role="group" aria-label="Font stack selection">
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
${renderBodySelectOptions(bodySelectValue)}
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
  <script src="${escapeHtml(scriptSrc)}"></script>
</section>`;
}

function renderHtml(cardHtml) {
  const card = cardHtml || renderFontLabCard();

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
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 0;
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
${readScopedCss()}
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
  <p class="meta">Single home-page slice at <strong>live</strong> type scale and <code>light-dark()</code> colors from <code>jonplummer.css</code>. Open from the repo so the stylesheet resolves. Regenerate: <code>pnpm run font-gallery</code>. Color theme lab output: <code>scripts/color-explore/output/index.html</code>. Deployed utilities: <a href="https://jonplummer.com/type/">/type</a> · <a href="https://jonplummer.com/color/">/color</a> · <a href="https://jonplummer.com/ogimages/">/ogimages</a> (Eleventy).</p>
${card}
</body>
</html>`;
}

function main() {
  try {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const jsHeader =
      '/* Generated by scripts/font-explore/generate-font-gallery.js — not hand-edited. */\n';
    fs.mkdirSync(path.dirname(FONT_LAB_CARD_JS), { recursive: true });
    fs.writeFileSync(FONT_LAB_CARD_JS, `${jsHeader}${fontLabCardRuntimeSource()}\n`, 'utf8');
    console.log(`Wrote ${FONT_LAB_CARD_JS}`);

    const card = renderFontLabCard({ scriptSrc: '/assets/js/font-lab-card.js' });
    fs.mkdirSync(path.dirname(FONT_LAB_FRAGMENT), { recursive: true });
    fs.writeFileSync(FONT_LAB_FRAGMENT, card, 'utf8');
    console.log(`Wrote ${FONT_LAB_FRAGMENT}`);

    const html = renderHtml(
      renderFontLabCard({ scriptSrc: '../../../src/assets/js/font-lab-card.js' })
    );
    fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html, 'utf8');
    const jsonPayload = {
      source: 'https://modernfontstacks.com',
      siteDefaultStackId: SITE_DEFAULT_STACK_ID,
      stacks: MODERN_FONT_STACKS,
      defaults: {
        headingStackId: DEFAULT_HEADING_STACK_ID,
        bodySelectValue: BODY_SAME_AS_HEADINGS
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
