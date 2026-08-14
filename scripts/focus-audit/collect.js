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

const sweepDirection = async (page, reverse, maxStops) => {
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
  }

  return stops;
};

const sweepPage = async (page, options = {}) => {
  const maxStops = options.maxStops || 200;
  const forward = await sweepDirection(page, false, maxStops);
  const reverse = await sweepDirection(page, true, maxStops);
  return { forward, reverse };
};

module.exports = { sweepPage, describeActiveElement };
