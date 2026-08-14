'use strict';

const { describeActiveElement } = require('./collect');

/**
 * Declarative scenario steps, so a different site supplies data rather than
 * code. Every step records where focus ended up, which is what makes a failed
 * expectation diagnosable rather than just red.
 */
const runStep = async (page, step) => {
  let note = null;
  let ok = true;

  if (step.action === 'click') {
    try {
      await page.click(step.selector);
    } catch (error) {
      ok = false;
      note = `click failed: ${error.message}`;
    }
  } else if (step.action === 'press') {
    await page.keyboard.press(step.key);
  } else if (step.action === 'tab') {
    for (let i = 0; i < step.times; i += 1) {
      await page.keyboard.press('Tab');
    }
  } else if (step.action === 'expectFocus') {
    const matches = await page.evaluate((selector) => {
      const target = document.querySelector(selector);
      return Boolean(target) && document.activeElement === target;
    }, step.selector);
    ok = matches;
    if (!ok) note = `expected focus on ${step.selector}`;
  } else if (step.action === 'expectFocusWithin') {
    // Asserts the outcome rather than the mechanism. A fragment link to a
    // non-focusable target leaves document.activeElement on body, yet the
    // browser sets the sequential focus navigation starting point, so the
    // next Tab still lands inside the target. Asserting activeElement there
    // would report a failure for something that works.
    const matches = await page.evaluate((selector) => {
      const target = document.querySelector(selector);
      return Boolean(target) && target.contains(document.activeElement);
    }, step.selector);
    ok = matches;
    if (!ok) note = `expected focus somewhere inside ${step.selector}`;
  } else {
    ok = false;
    note = `unknown action: ${step.action}`;
  }

  const activeElement = await page.evaluate(describeActiveElement);
  return { step, ok, activeElement, note };
};

const runScenario = async (page, scenario, baseUrl) => {
  await page.goto(new URL(scenario.path, baseUrl).href, { waitUntil: 'domcontentloaded' });
  const steps = [];
  for (const step of scenario.steps) {
    steps.push(await runStep(page, step));
  }
  return {
    id: scenario.id, title: scenario.title, path: scenario.path, steps,
  };
};

module.exports = { runScenario };
