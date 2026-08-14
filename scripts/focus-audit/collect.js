'use strict';

/**
 * Site-agnostic focus and keyboard evidence collector.
 *
 * Must not require anything outside this directory — the whole point is that
 * this file lifts into another project unchanged.
 */

/**
 * Runs in the browser. Describes document.activeElement well enough to
 * identify it later, including whether it is genuinely visible: zero-sized
 * and overflow-clipped elements are focusable but effectively hidden, which
 * is how focusable things disappear in practice.
 */
const describeActiveElement = () => {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) {
    return null;
  }

  const cssPath = (node) => {
    const parts = [];
    let current = node;
    while (current && current.nodeType === 1 && current !== document.documentElement) {
      let part = current.tagName.toLowerCase();
      if (current.id) {
        part += `#${CSS.escape(current.id)}`;
        parts.unshift(part);
        break;
      }
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((c) => c.tagName === current.tagName);
        if (siblings.length > 1) {
          part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
        }
      }
      parts.unshift(part);
      current = current.parentElement;
    }
    return parts.join(' > ');
  };

  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);

  // Clipped: any ancestor with hidden overflow whose box excludes this one.
  let clipped = false;
  let ancestor = el.parentElement;
  while (ancestor && !clipped) {
    const aStyle = window.getComputedStyle(ancestor);
    if (aStyle.overflow !== 'visible' && aStyle.overflow !== '') {
      const aRect = ancestor.getBoundingClientRect();
      if (rect.right <= aRect.left || rect.left >= aRect.right
        || rect.bottom <= aRect.top || rect.top >= aRect.bottom) {
        clipped = true;
      }
    }
    ancestor = ancestor.parentElement;
  }

  const landmarkEl = el.closest('main, nav, header, footer, aside, section[aria-label], [role]');

  return {
    selector: cssPath(el),
    tagName: el.tagName.toLowerCase(),
    domIndex: Array.prototype.indexOf.call(document.querySelectorAll('*'), el),
    disabled: Boolean(el.disabled),
    href: el.getAttribute('href') || null,
    inputType: el.getAttribute('type') || null,
    rect: {
      x: rect.x + window.scrollX,
      y: rect.y + window.scrollY,
      width: rect.width,
      height: rect.height,
    },
    visible: style.display !== 'none'
      && style.visibility !== 'hidden'
      && Number(style.opacity) !== 0
      && rect.width > 0
      && rect.height > 0,
    clipped,
    landmark: landmarkEl
      ? (landmarkEl.tagName.toLowerCase() + (landmarkEl.getAttribute('role') ? `[role=${landmarkEl.getAttribute('role')}]` : ''))
      : null,
  };
};

/**
 * Accessible name and role come from the browser's accessibility tree rather
 * than a local reimplementation of accname — getting that wrong is a classic
 * source of misleading audit output.
 */
const readAccessibleInfo = async (page) => {
  const handle = await page.evaluateHandle(() => document.activeElement);
  const element = handle.asElement();
  if (!element) {
    await handle.dispose();
    return { name: null, role: null };
  }
  let snapshot = null;
  try {
    snapshot = await page.accessibility.snapshot({ root: element, interestingOnly: false });
  } catch (error) {
    snapshot = null;
  }
  await handle.dispose();
  return { name: snapshot ? snapshot.name || null : null, role: snapshot ? snapshot.role || null : null };
};

/**
 * Puppeteer has no combined "Shift+Tab" key, so reverse traversal holds Shift
 * around the Tab press.
 */
const pressTab = async (page, reverse) => {
  if (!reverse) {
    await page.keyboard.press('Tab');
    return;
  }
  await page.keyboard.down('Shift');
  await page.keyboard.press('Tab');
  await page.keyboard.up('Shift');
};

/**
 * Compares two base64 PNGs inside the browser using canvas. Done in-page
 * rather than in Node so the tool needs no PNG-decoding dependency.
 *
 * ACT rule oj04fd expects "at least one device pixel inside the scrolling
 * area of the viewport whose HSL color value is different when the element
 * is focused from when it is not", so comparison is on HSL, and any
 * difference counts.
 */
const diffScreenshotsInPage = async (page, focusedB64, unfocusedB64) => page.evaluate(
  async (focusedData, unfocusedData) => {
    const load = async (data) => {
      const response = await fetch(`data:image/png;base64,${data}`);
      const blob = await response.blob();
      return createImageBitmap(blob);
    };

    const [a, b] = await Promise.all([load(focusedData), load(unfocusedData)]);
    const width = Math.min(a.width, b.width);
    const height = Math.min(a.height, b.height);

    const draw = (bitmap) => {
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      return ctx.getImageData(0, 0, width, height).data;
    };

    const dataA = draw(a);
    const dataB = draw(b);

    const toHsl = (r, g, bl) => {
      const rn = r / 255;
      const gn = g / 255;
      const bn = bl / 255;
      const max = Math.max(rn, gn, bn);
      const min = Math.min(rn, gn, bn);
      const l = (max + min) / 2;
      if (max === min) return [0, 0, l];
      const d = max - min;
      const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      let h;
      if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
      else if (max === gn) h = ((bn - rn) / d + 2) / 6;
      else h = ((rn - gn) / d + 4) / 6;
      return [h, s, l];
    };

    let differingPixels = 0;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < dataA.length; i += 4) {
      const hslA = toHsl(dataA[i], dataA[i + 1], dataA[i + 2]);
      const hslB = toHsl(dataB[i], dataB[i + 1], dataB[i + 2]);
      if (hslA[0] !== hslB[0] || hslA[1] !== hslB[1] || hslA[2] !== hslB[2]) {
        differingPixels += 1;
        const pixelIndex = i / 4;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }

    return {
      differingPixels,
      totalPixels: width * height,
      changeRegion: differingPixels > 0 ? { minX, minY, maxX, maxY } : null,
    };
  },
  focusedB64,
  unfocusedB64,
);

// ACT oj04fd treats an element that loses focus within a second as not
// focusable, so evidence is sampled only after focus has settled.
const FOCUS_DWELL_MS = 1000;

const readFocusStyles = async (page) => page.evaluate(() => {
  const el = document.activeElement;
  if (!el) return null;
  const s = window.getComputedStyle(el);
  return {
    outline: `${s.outlineWidth} ${s.outlineStyle} ${s.outlineColor}`,
    boxShadow: s.boxShadow,
    textDecorationLine: s.textDecorationLine,
    color: s.color,
    backgroundColor: s.backgroundColor,
    border: `${s.borderWidth} ${s.borderStyle} ${s.borderColor}`,
  };
});

/**
 * Captures focused and unfocused viewport states at an identical scroll
 * position. Blurring does not scroll, so the pair is directly comparable.
 * The element is re-focused afterwards so the sweep can continue from here.
 */
const measureFocusVisibility = async (page) => {
  await new Promise((resolve) => setTimeout(resolve, FOCUS_DWELL_MS));

  const focusedStyles = await readFocusStyles(page);
  const focusedShot = await page.screenshot({ encoding: 'base64' });

  const handle = await page.evaluateHandle(() => {
    const el = document.activeElement;
    if (el && el.blur) el.blur();
    return el;
  });

  const unfocusedStyles = await readFocusStyles(page);
  const unfocusedShot = await page.screenshot({ encoding: 'base64' });

  const element = handle.asElement();
  if (element) {
    await element.focus();
  }
  await handle.dispose();

  const diff = await diffScreenshotsInPage(page, focusedShot, unfocusedShot);

  return {
    ...diff,
    styles: { focused: focusedStyles, unfocused: unfocusedStyles },
  };
};

const sweepDirection = async (page, reverse, maxStops, measureVisibility) => {
  const stops = [];
  const seen = new Set();

  await page.evaluate(() => {
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    window.scrollTo(0, 0);
  });

  for (let i = 0; i < maxStops; i += 1) {
    await pressTab(page, reverse);
    const descriptor = await page.evaluate(describeActiveElement);
    if (!descriptor) {
      break; // Focus left the document.
    }
    const identity = descriptor.selector;
    if (seen.has(identity)) {
      break; // Cycled back around.
    }
    seen.add(identity);
    const accessible = await readAccessibleInfo(page);
    stops.push({ ordinal: stops.length + 1, ...descriptor, ...accessible });

    if (measureVisibility) {
      stops[stops.length - 1].focusVisibility = await measureFocusVisibility(page);
    }
  }

  return stops;
};

const sweepPage = async (page, options = {}) => {
  const maxStops = options.maxStops || 200;
  const forward = await sweepDirection(page, false, maxStops, Boolean(options.measureVisibility));
  const reverse = await sweepDirection(page, true, maxStops, false);
  return { forward, reverse };
};

module.exports = { sweepPage, describeActiveElement, measureFocusVisibility };
