'use strict';

const { ruleById } = require('./rules');

/**
 * EARL 1.0 serialized as JSON-LD, per the WAI reporting format at
 * https://www.w3.org/WAI/standards-guidelines/act/report/earl/
 *
 * Using the standard format rather than an invented one means the output is
 * ingestible by other accessibility tooling. Per-observation evidence rides
 * along as an extension property; standard consumers ignore it.
 */
const EARL_CONTEXT = 'https://act-rules.github.io/earl-context.json';

const buildAssertion = (assertion) => {
  const rule = ruleById(assertion.ruleId);
  return {
    '@type': 'Assertion',
    mode: 'earl:semiAuto',
    test: {
      '@type': 'TestCase',
      title: rule.title,
      ...(rule.actRuleId
        ? { '@id': `https://www.w3.org/WAI/standards-guidelines/act/rules/${rule.actRuleId}/` }
        : {}),
      isPartOf: rule.criteria,
    },
    result: {
      '@type': 'TestResult',
      outcome: assertion.outcome,
      ...(assertion.pointer ? { pointer: assertion.pointer } : {}),
    },
    evidence: assertion.evidence || null,
  };
};

const buildReport = (subjects, meta) => ({
  '@context': EARL_CONTEXT,
  '@graph': subjects.map((subject) => ({
    '@type': 'TestSubject',
    source: subject.source,
    assertions: subject.assertions.map(buildAssertion),
  })),
  runMetadata: meta,
});

module.exports = { buildReport, EARL_CONTEXT };
