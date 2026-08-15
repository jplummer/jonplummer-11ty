'use strict';

/**
 * Turns collected evidence into EARL assertions. Deterministic conclusions
 * become passed/failed; anything needing human judgment becomes cantTell,
 * which is EARL's own name for "the tool could not be sure".
 */

const ROW_TOLERANCE_PX = 12;

const evaluatePage = (pageResult) => {
  const assertions = [];
  const { forward, reverse } = pageResult.sweep;

  forward.forEach((stop) => {
    const pointer = stop.selector;

    if (stop.focusVisibility) {
      assertions.push({
        ruleId: 'focus-visible',
        outcome: stop.focusVisibility.differingPixels > 0 ? 'earl:passed' : 'earl:failed',
        pointer,
        evidence: {
          differingPixels: stop.focusVisibility.differingPixels,
          changeRegion: stop.focusVisibility.changeRegion,
          styles: stop.focusVisibility.styles,
          accessibleName: stop.name,
        },
      });

      // Whether an indicator is legible is judgment; whether it touches the
      // element perimeter is measurable and correlates with legibility.
      const region = stop.focusVisibility.changeRegion;
      const perimeterInvolved = region
        && (region.maxX - region.minX >= stop.rect.width - 2
          || region.maxY - region.minY >= stop.rect.height - 2);
      assertions.push({
        ruleId: 'focus-indicator-perimeter',
        outcome: perimeterInvolved ? 'earl:passed' : 'earl:cantTell',
        pointer,
        evidence: { changeRegion: region, elementRect: stop.rect },
      });
    }

    assertions.push({
      ruleId: 'focus-not-obscured',
      outcome: stop.visible && !stop.clipped ? 'earl:passed' : 'earl:failed',
      pointer,
      evidence: { visible: stop.visible, clipped: stop.clipped, rect: stop.rect },
    });
  });

  // Reverse order should be the mirror of forward order.
  const forwardSelectors = forward.map((s) => s.selector);
  const reverseSelectors = reverse.map((s) => s.selector).reverse();
  const symmetric = forwardSelectors.length === reverseSelectors.length
    && forwardSelectors.every((sel, i) => sel === reverseSelectors[i]);
  assertions.push({
    ruleId: 'focus-order-symmetric',
    outcome: symmetric ? 'earl:passed' : 'earl:failed',
    pointer: null,
    evidence: { forward: forwardSelectors, reverse: reverseSelectors },
  });

  // Geometric order: each stop should be at or below the previous one, and to
  // its right when on the same visual row. Divergence is sometimes correct,
  // so this is cantTell rather than failed.
  const outOfOrder = [];
  for (let i = 1; i < forward.length; i += 1) {
    const prev = forward[i - 1].rect;
    const curr = forward[i].rect;
    const sameRow = Math.abs(curr.y - prev.y) <= ROW_TOLERANCE_PX;
    if (curr.y < prev.y - ROW_TOLERANCE_PX || (sameRow && curr.x < prev.x)) {
      outOfOrder.push({ from: forward[i - 1].selector, to: forward[i].selector });
    }
  }
  assertions.push({
    ruleId: 'focus-order-geometric',
    outcome: outOfOrder.length === 0 ? 'earl:passed' : 'earl:cantTell',
    pointer: null,
    evidence: { outOfOrder },
  });

  // Document order: tab order should advance monotonically through the DOM.
  // Departures are legal (positive tabindex, reordered flex/grid) but are
  // worth a person's attention, so cantTell rather than failed.
  const domRegressions = [];
  for (let i = 1; i < forward.length; i += 1) {
    if (forward[i].domIndex < forward[i - 1].domIndex) {
      domRegressions.push({ from: forward[i - 1].selector, to: forward[i].selector });
    }
  }
  assertions.push({
    ruleId: 'focus-order-dom',
    outcome: domRegressions.length === 0 ? 'earl:passed' : 'earl:cantTell',
    pointer: null,
    evidence: { domRegressions },
  });

  // Bypass blocks: a skip mechanism should be reachable early.
  const skipIndex = forward.findIndex((s) => s.href && s.href.startsWith('#'));
  assertions.push({
    ruleId: 'bypass-blocks',
    outcome: skipIndex === 0 ? 'earl:passed' : 'earl:cantTell',
    pointer: skipIndex >= 0 ? forward[skipIndex].selector : null,
    evidence: {
      firstInPageAnchorAt: skipIndex >= 0 ? skipIndex + 1 : null,
      totalStops: forward.length,
    },
  });

  return assertions;
};

const evaluateScenario = (scenarioResult) => scenarioResult.steps
  .filter((step) => step.step.action === 'expectFocus' || step.step.action === 'expectFocusWithin')
  .map((step) => ({
    ruleId: 'scenario-expectation',
    outcome: step.ok ? 'earl:passed' : 'earl:failed',
    pointer: step.step.selector,
    evidence: {
      scenario: scenarioResult.id,
      description: step.step.description,
      actualFocus: step.activeElement ? step.activeElement.selector : null,
      note: step.note,
    },
  }));

module.exports = { evaluatePage, evaluateScenario };
