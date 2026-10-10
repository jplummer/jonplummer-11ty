#!/usr/bin/env node

/**
 * Guards the OG card (docs/designs/specs/2026-10-09-og-dark-card-design.md):
 * which sources get a card and what its label says; that the inline mark in
 * og-image-body.njk still matches jp-mark.svg; and, in a real render, that
 * og-card-fit.js fits short titles at full size and truncates the longest
 * one at a word inside its box.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { ogCardKind, ogCardLabel } = require('../utils/og-card');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');

function rectsOf(markup) {
  return [...markup.matchAll(/<rect\b[^>]*>/g)].map((m) => {
    const attr = (name) => (m[0].match(new RegExp(`\\b${name}="([^"]+)"`)) || [])[1];
    return ['x', 'y', 'width', 'height'].map(attr).join(',');
  });
}

async function runAssertions(result) {
  const file = addFile(result, 'scripts/utils/og-card.js', 'og-card');

  async function check(name, fn) {
    try {
      await fn();
    } catch (err) {
      addIssue(file, { type: 'og-card', message: `${name}: ${err.message}`, ruleId: 'og-card' });
    }
  }

  await check('type labels', () => {
    assert.deepStrictEqual(ogCardLabel({ tags: 'post' }, 'src/_posts/2026/x.md', SRC), { text: 'Post', isPath: false });
    assert.deepStrictEqual(ogCardLabel({ tags: ['post', 'ai'] }, 'src/_posts/2026/x.md', SRC), { text: 'Post', isPath: false });
    assert.deepStrictEqual(ogCardLabel({ tags: 'portfolio' }, 'src/_posts/2013/x.md', SRC), { text: 'Portfolio', isPath: false });
    assert.deepStrictEqual(
      ogCardLabel({ tags: 'sideproject', permalink: '/sides/parker/' }, 'src/sides/parker.md', SRC),
      { text: 'Side project', isPath: false }
    );
  });

  await check('pages get their nav-style path', () => {
    const label = (fm, f) => ogCardLabel(fm, path.join(SRC, f), SRC).text;
    assert.strictEqual(label({ tags: 'page', permalink: '/about/' }, 'about.md'), '/about');
    assert.strictEqual(label({ tags: 'page', permalink: '/404.html' }, '404.md'), '/404');
    assert.strictEqual(label({ tags: 'page' }, 'wisdom/index.njk'), '/wisdom');
    assert.strictEqual(label({ tags: 'page' }, 'colophon.md'), '/colophon');
  });

  await check('paginated and untagged templates share the default card', () => {
    assert.strictEqual(ogCardKind({ tags: 'page', pagination: { data: 'x' } }), null);
    assert.strictEqual(ogCardKind({ title: 'Style exercise' }), null);
  });

  await check('every portfolio piece and side project gets its own card', () => {
    const { parseFrontMatter } = require('../utils/frontmatter-utils');
    const { findMarkdownFiles } = require('../utils/file-utils');
    const kinds = { portfolio: 0, sideproject: 0 };
    for (const f of findMarkdownFiles(SRC)) {
      const { frontMatter } = parseFrontMatter(fs.readFileSync(f, 'utf8'));
      const kind = ogCardKind(frontMatter);
      if (kind in kinds) kinds[kind] += 1;
    }
    assert.ok(kinds.portfolio > 0, 'no portfolio pieces found');
    assert.ok(kinds.sideproject > 0, 'no side projects found');
  });

  await check('inline mark matches jp-mark.svg', () => {
    const body = fs.readFileSync(path.join(SRC, '_includes', 'og-image-body.njk'), 'utf8');
    const svg = fs.readFileSync(path.join(SRC, 'assets', 'images', 'jp-mark.svg'), 'utf8');
    assert.deepStrictEqual(rectsOf(body), rectsOf(svg));
    const viewBox = (s) => (s.match(/viewBox="([^"]+)"/) || [])[1];
    assert.strictEqual(viewBox(body), viewBox(svg));
  });

  await check('rendered: title fits, longest title truncates at a word', async () => {
    const puppeteer = require('puppeteer');
    const { renderOgImageHtml } = require('../content/generate-og-images');
    const launchOptions = { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] };
    if (process.env.PUPPETEER_EXECUTABLE_PATH) launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    const browser = await puppeteer.launch(launchOptions);
    try {
      const measure = async (title) => {
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 630 });
        await page.setContent(await renderOgImageHtml({ title, label: 'Post' }), { waitUntil: 'load' });
        await page.waitForFunction(() => document.documentElement.dataset.ogFit === 'done', { timeout: 15000 });
        const m = await page.evaluate(() => {
          const card = document.querySelector('.og-card');
          const box = card.querySelector('.og-title-box').getBoundingClientRect();
          const t = card.querySelector('.og-title');
          const r = t.getBoundingClientRect();
          return {
            size: Number(card.dataset.ogTitleSize),
            truncated: card.dataset.ogTruncated === 'true',
            text: t.textContent,
            titleTop: r.top,
            titleBottom: r.bottom,
            boxTop: box.top,
            boxBottom: box.bottom,
            wide: t.scrollWidth > t.clientWidth + 1,
          };
        });
        await page.close();
        return m;
      };

      // Big Shoulders is condensed: the same title in the page's fallback
      // sans is far wider. Catches a card rendered in the fallback font.
      const fontPage = await browser.newPage();
      await fontPage.setContent(await renderOgImageHtml({ title: 'Many little diamonds', label: 'Post' }), { waitUntil: 'load' });
      await fontPage.waitForFunction(() => document.documentElement.dataset.ogFit === 'done', { timeout: 15000 });
      const widths = await fontPage.evaluate(() => {
        const t = document.querySelector('.og-title');
        const probe = (family) => {
          const s = document.createElement('span');
          s.textContent = 'Many little diamonds';
          s.style.cssText = `font: 600 100px ${family}; white-space: nowrap; position: absolute;`;
          document.body.append(s);
          const w = s.getBoundingClientRect().width;
          s.remove();
          return w;
        };
        return { card: probe(getComputedStyle(t).fontFamily), fallback: probe('sans-serif') };
      });
      await fontPage.close();
      assert.ok(widths.card < widths.fallback * 0.8, `title font looks like the fallback (${Math.round(widths.card)} vs ${Math.round(widths.fallback)}px)`);

      const short = await measure('Many little diamonds');
      assert.strictEqual(short.size, 168, `short title at ${short.size}px, expected 168`);
      assert.strictEqual(short.truncated, false);
      // Hang line: the trimmed title starts exactly at the box top
      assert.ok(Math.abs(short.titleTop - short.boxTop) < 0.5, `title top ${short.titleTop} vs hang ${short.boxTop}`);

      const long = await measure('Confusing terms: globalization, internationalization, translation, localization');
      assert.strictEqual(long.size, 96, `longest title at ${long.size}px, expected the 96px floor`);
      assert.strictEqual(long.truncated, true, 'longest title should truncate');
      assert.ok(long.text.endsWith('…'), `expected an ellipsis: "${long.text}"`);
      assert.ok(!/[,:;]…$/.test(long.text), `punctuation before the ellipsis: "${long.text}"`);
      assert.ok(long.titleBottom <= long.boxBottom + 0.5, 'truncated title overflows its box');
      assert.ok(!long.wide, 'truncated title overflows its width');
    } finally {
      await browser.close();
    }
  });
}

runTest({
  testType: 'og-card',
  testName: 'OG Card',
  requiresSite: false,
  validateFn: runAssertions,
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
