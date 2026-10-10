/*
  OG card title fitting – authoring only. Runs inside Puppeteer when
  generate-og-images.js renders a PNG, and on the /ogimages/ and
  /style-exercise/ preview pages. Content pages never load it.

  For each .og-card: step the title down from --og-title-max to
  --og-title-min until it fits its box; if it still doesn't, drop words from
  the end and add an ellipsis. Hyphenated words are kept on one line.
  Sets data-og-fit="done" on <html> when every card is settled.

  Spec: docs/designs/specs/2026-10-09-og-dark-card-design.md
*/
(function () {
  const STEP = 2;
  const TRAILING = /[\s,.:;–—-]+$/;

  function render(title, words, truncated) {
    title.replaceChildren();
    words.forEach((word, i) => {
      if (i > 0) title.append(' ');
      const last = i === words.length - 1;
      const text = last && truncated ? `${word.replace(TRAILING, '')}…` : word;
      if (text.includes('-')) {
        const span = document.createElement('span');
        span.className = 'og-nowrap';
        span.textContent = text;
        title.append(span);
      } else {
        title.append(text);
      }
    });
  }

  function fit(card) {
    const box = card.querySelector('.og-title-box');
    const title = card.querySelector('.og-title');
    if (!box || !title) return;

    const style = getComputedStyle(card);
    const max = parseFloat(style.getPropertyValue('--og-title-max'));
    const min = parseFloat(style.getPropertyValue('--og-title-min'));

    // Keep the original text so a re-run starts from the full title
    if (!title.dataset.ogTitle) title.dataset.ogTitle = title.textContent.trim();
    const words = title.dataset.ogTitle.split(/\s+/);

    const overflows = () =>
      title.offsetHeight > box.clientHeight || title.scrollWidth > title.clientWidth + 1;

    render(title, words, false);
    let size = max;
    title.style.fontSize = `${size}px`;
    while (size > min && overflows()) {
      size -= STEP;
      title.style.fontSize = `${size}px`;
    }

    let count = words.length;
    while (count > 1 && overflows()) {
      count -= 1;
      render(title, words.slice(0, count), true);
    }

    card.dataset.ogTitleSize = String(size);
    card.dataset.ogTruncated = String(count < words.length);
  }

  // Load every face the cards use before measuring – fitting against a
  // fallback font gives the wrong size.
  function loadCardFonts() {
    const loads = [];
    document.querySelectorAll('.og-card .og-label, .og-card .og-title, .og-card .og-byline').forEach((el) => {
      const s = getComputedStyle(el);
      loads.push(document.fonts.load(`${s.fontWeight} 16px ${s.fontFamily}`, el.textContent));
    });
    return Promise.all(loads);
  }

  async function run() {
    await loadCardFonts();
    await document.fonts.ready;
    document.querySelectorAll('.og-card').forEach(fit);
    document.documentElement.dataset.ogFit = 'done';
  }

  run();
})();
