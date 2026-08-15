'use strict';

/**
 * Rule definitions. Each carries the WCAG success criteria it produces
 * evidence for, and the ACT rule identifier where a published one exists.
 *
 * A criterion tag means "this evidence bears on that criterion", never "this
 * criterion is satisfied". ACT's own outcome mapping for oj04fd is explicit:
 * any failure means the criterion is not satisfied, but all passes mean only
 * that it needs further testing.
 *
 * WCAG is not site-specific, so this file stays in the portable layer.
 */
const RULES = [
  {
    id: 'focus-visible',
    title: 'Element in sequential focus order has visible focus',
    actRuleId: 'oj04fd',
    criteria: ['WCAG2:focus-visible'],
    severity: 'failure',
  },
  {
    id: 'focus-not-obscured',
    title: 'Focused element is not hidden or clipped',
    actRuleId: null,
    criteria: ['WCAG2:focus-not-obscured-minimum'],
    severity: 'failure',
  },
  {
    id: 'focus-order-symmetric',
    title: 'Forward and reverse focus order agree',
    actRuleId: null,
    criteria: ['WCAG2:focus-order'],
    severity: 'failure',
  },
  {
    id: 'focus-order-geometric',
    title: 'Focus order follows visual reading order',
    actRuleId: null,
    criteria: ['WCAG2:focus-order'],
    severity: 'warning',
  },
  {
    id: 'focus-order-dom',
    title: 'Focus order follows document order',
    actRuleId: null,
    criteria: ['WCAG2:focus-order'],
    severity: 'warning',
  },
  {
    id: 'focus-indicator-perimeter',
    title: 'Focus indicator includes a perimeter change, not only an interior color shift',
    actRuleId: null,
    criteria: ['WCAG2:focus-appearance'],
    severity: 'warning',
  },
  {
    id: 'scenario-expectation',
    title: 'Interactive component behaves as expected under keyboard operation',
    actRuleId: null,
    criteria: ['WCAG2:keyboard', 'WCAG2:focus-order', 'WCAG2:no-keyboard-trap'],
    severity: 'failure',
  },
  {
    id: 'bypass-blocks',
    title: 'A mechanism exists to bypass repeated blocks',
    actRuleId: null,
    criteria: ['WCAG2:bypass-blocks'],
    severity: 'failure',
  },
];

const ruleById = (id) => RULES.find((rule) => rule.id === id);

module.exports = { RULES, ruleById };
