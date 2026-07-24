const cheerio = require('cheerio');
const { largestUrlFromAttributes } = require('./largest-srcset-url');

/**
 * Wrap lightboxable figures in main with progressive-enhancement trigger links.
 * @param {string} html
 * @returns {string}
 */
function applyFigureLightboxLinks(html) {
  if (!html || !html.includes('<figure')) return html;
  const $ = cheerio.load(html, { decodeEntities: false });
  if (!$('main').length) return html;

  $('main figure').each((_, el) => {
    const $figure = $(el);
    if ($figure.hasClass('masthead-preview-strip')) return;
    if ($figure.closest('.color-gallery-embed, .og-images-grid, [data-lightbox="off"]').length) {
      return;
    }
    if ($figure.find('a.figure-lightbox-trigger').length) return;

    const $img = $figure.find('img').first();
    if (!$img.length) return;

    const sourceSrcsets = [];
    $img.closest('picture').find('source').each((__, source) => {
      const ss = $(source).attr('srcset');
      if (ss) sourceSrcsets.push(ss);
    });

    const href = largestUrlFromAttributes({
      src: $img.attr('src'),
      srcset: $img.attr('srcset'),
      sourceSrcsets,
    });
    if (!href) return;

    const $media = $img.parent('picture').length ? $img.parent('picture') : $img;
    $media.wrap(`<a class="figure-lightbox-trigger" href="${href}"></a>`);
  });

  return $.root().html() || html;
}

module.exports = { applyFigureLightboxLinks };
