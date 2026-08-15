'use strict';

const { RULES } = require('./rules');

/**
 * Renders EARL evidence as markdown, grouped by success criterion rather than
 * by page, because that is how a conformance report is organized and it is
 * the view that answers "what is broken about focus visibility" directly.
 *
 * Deliberately does not emit conformance levels. Those are attestations for a
 * person to make.
 */

const MAX_LIST_ITEMS = 5;

/**
 * Evidence varies in shape: a pixel count, a pair of style objects, or a list
 * of eighteen out-of-order transitions. Dumping raw JSON makes the long ones
 * unreadable, which defeats the point of the markdown view, so lists are
 * truncated with a count and objects are flattened to one line each.
 */
const formatEvidence = (evidence, indent) => {
  const pad = ' '.repeat(indent);
  const lines = [];

  Object.entries(evidence).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    if (Array.isArray(value)) {
      if (value.length === 0) return;
      lines.push(`${pad}- ${key}: ${value.length}`);
      value.slice(0, MAX_LIST_ITEMS).forEach((item) => {
        const rendered = typeof item === 'object'
          ? Object.entries(item).map(([k, v]) => `${k} \`${v}\``).join(' → ')
          : `\`${item}\``;
        lines.push(`${pad}  - ${rendered}`);
      });
      if (value.length > MAX_LIST_ITEMS) {
        lines.push(`${pad}  - …and ${value.length - MAX_LIST_ITEMS} more (see the JSON)`);
      }
      return;
    }

    if (typeof value === 'object') {
      const inline = Object.entries(value)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join(', ');
      if (inline) lines.push(`${pad}- ${key}: ${inline}`);
      return;
    }

    lines.push(`${pad}- ${key}: ${typeof value === 'string' ? value : String(value)}`);
  });

  return lines;
};

const renderMarkdown = (earl) => {
  const meta = earl.runMetadata;
  const lines = [];

  lines.push('# Focus and keyboard audit');
  lines.push('');
  lines.push(`**Base URL:** ${meta.baseUrl}`);
  lines.push('');
  lines.push(`**Run:** ${meta.generatedAt} | **Seed:** ${meta.seed}`);
  lines.push('');
  lines.push('Sampling follows WCAG-EM 2.0 Step 3. Outcomes use the EARL vocabulary. A passing');
  lines.push('outcome means the check found no defect, not that the success criterion is');
  lines.push('satisfied — ACT maps all-passed to "needs further testing".');
  lines.push('');
  lines.push(`**Structured sample:** ${meta.structuredSample.length} pages`);
  lines.push('');
  lines.push(`**Random sample:** ${meta.randomSample.join(', ') || 'none'}`);
  lines.push('');
  lines.push(`**Complete processes:** ${meta.completeProcesses}`);
  lines.push('');

  // Collect every assertion with its subject.
  const flat = [];
  earl['@graph'].forEach((subject) => {
    subject.assertions.forEach((assertion) => {
      flat.push({ source: subject.source, assertion });
    });
  });

  const criteria = new Set();
  flat.forEach(({ assertion }) => assertion.test.isPartOf.forEach((c) => criteria.add(c)));

  lines.push('## Summary');
  lines.push('');
  lines.push('| Criterion | Failed | Needs judgment | Passed |');
  lines.push('| --- | --- | --- | --- |');
  Array.from(criteria).sort().forEach((criterion) => {
    const relevant = flat.filter(({ assertion }) => assertion.test.isPartOf.includes(criterion));
    const count = (outcome) => relevant.filter(({ assertion }) => assertion.result.outcome === outcome).length;
    lines.push(`| ${criterion} | ${count('earl:failed')} | ${count('earl:cantTell')} | ${count('earl:passed')} |`);
  });
  lines.push('');

  ['earl:failed', 'earl:cantTell'].forEach((outcome) => {
    const group = flat.filter(({ assertion }) => assertion.result.outcome === outcome);
    if (group.length === 0) return;

    lines.push(`## ${outcome === 'earl:failed' ? 'Failures' : 'Needs judgment'}`);
    lines.push('');
    if (outcome === 'earl:cantTell') {
      lines.push('The tool could not determine pass or fail for these. Each needs a person or');
      lines.push('an agent to rule on it using the evidence shown.');
      lines.push('');
    }

    RULES.forEach((rule) => {
      const forRule = group.filter(({ assertion }) => assertion.test.title === rule.title);
      if (forRule.length === 0) return;

      lines.push(`### ${rule.title}`);
      lines.push('');
      lines.push(`Criteria: ${rule.criteria.join(', ')}${rule.actRuleId ? ` | ACT rule: \`${rule.actRuleId}\`` : ''}`);
      lines.push('');
      forRule.forEach(({ source, assertion }) => {
        lines.push(`- \`${new URL(source).pathname}\` → \`${assertion.result.pointer || 'page'}\``);
        if (assertion.evidence) {
          formatEvidence(assertion.evidence, 2).forEach((line) => lines.push(line));
        }
      });
      lines.push('');
    });
  });

  lines.push('## Inventory');
  lines.push('');
  lines.push('| Page | Assertions | Failed | Needs judgment |');
  lines.push('| --- | --- | --- | --- |');

  // A page can appear as several EARL subjects — one for the sweep and one per
  // scenario — so totals are summed per path to keep the table one row a page.
  const byPath = new Map();
  earl['@graph'].forEach((subject) => {
    const key = new URL(subject.source).pathname;
    const row = byPath.get(key) || { total: 0, failed: 0, cantTell: 0 };
    row.total += subject.assertions.length;
    row.failed += subject.assertions.filter((a) => a.result.outcome === 'earl:failed').length;
    row.cantTell += subject.assertions.filter((a) => a.result.outcome === 'earl:cantTell').length;
    byPath.set(key, row);
  });

  byPath.forEach((row, pagePath) => {
    lines.push(`| ${pagePath} | ${row.total} | ${row.failed} | ${row.cantTell} |`);
  });
  lines.push('');

  return lines.join('\n');
};

module.exports = { renderMarkdown };
