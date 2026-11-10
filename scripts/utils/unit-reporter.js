/**
 * node:test reporter for the unit tests. Prints one line per test file in
 * the same shape the rest of `pnpm run test` uses, with real counts:
 *
 *   ✅ 🤷 404 suggestions: 🧪 26 tests, ✅ 26 passing
 *
 * Used by scripts/test-runner.js through `--test-reporter`. Emoji and names
 * come from scripts/test-manifest.js, looked up by the file being run.
 * Set UNIT_REPORT_VERBOSE=1 to list every test by name.
 *
 * Three things Node would let through are failures or warnings here
 * (observed on Node 26.4.0):
 *   - a file with no tests is reported by Node as a pass
 *   - a skipped or todo test arrives as a pass event
 *   - a file that crashes on load sends no summary, only a failure and stderr
 *
 * Tested by scripts/test/unit-reporter.js.
 */

const path = require('path');
const manifest = require('../test-manifest');
const { printOverallSummary } = require('./test-results');

const FALLBACK_EMOJI = '🧪';
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * Judge one finished file. `counts` is Node's per-file counts object, or null
 * when the file crashed on load or ran no tests.
 */
function fileOutcome({ counts, crashed = false, ranNothing = false }) {
  if (crashed) {
    return { icon: '❌', summary: 'stopped before reporting results', passed: false, warnings: 0 };
  }
  if (ranNothing || !counts || counts.tests === 0) {
    return { icon: '❌', summary: 'no tests ran', passed: false, warnings: 0 };
  }

  const failing = counts.failed + counts.cancelled;
  const notRun = counts.skipped + counts.todo;
  const parts = [`🧪 ${plural(counts.tests, 'test')}`];
  if (counts.passed > 0) parts.push(`✅ ${counts.passed} passing`);
  if (failing > 0) parts.push(`❌ ${failing} failing`);
  if (notRun > 0) parts.push(`⏭️  ${notRun} skipped`);

  const passed = failing === 0;
  const icon = !passed ? '❌' : notRun > 0 ? '⚠️ ' : '✅';
  return { icon, summary: parts.join(', '), passed, warnings: notRun };
}

function labelFor(file) {
  const id = manifest.getTestIdByScriptPath(file);
  if (!id) return { id: path.basename(file), emoji: FALLBACK_EMOJI, name: path.basename(file) };
  const { emoji, name } = manifest.getTestLabel(id);
  return { id, emoji, name };
}

function errorMessage(details) {
  const error = details && details.error;
  if (!error) return 'failed';
  // node:test wraps the thrown error; the assertion's own message is on `cause`.
  return String((error.cause && error.cause.message) || error.message || error).trim();
}

/** An assertion error puts the compared values on later lines; keep them in the short form. */
function oneLine(message, max = 200) {
  const joined = message.split('\n').map((line) => line.trim()).filter(Boolean).join(' ');
  return joined.length > max ? `${joined.slice(0, max - 1)}…` : joined;
}

const indent = (text, spaces) => text.split('\n').map((line) => ' '.repeat(spaces) + line).join('\n');

function renderFile(state, outcome, verbose) {
  const { emoji, name } = labelFor(state.file);
  const lines = [`${outcome.icon} ${emoji} ${name}: ${outcome.summary}`];

  for (const t of state.tests) {
    if (t.status === 'fail') {
      lines.push(verbose
        ? `    ❌ ${t.name}\n${indent(t.message, 8)}`
        : `    - ${t.name}: ${oneLine(t.message)}`);
    } else if (verbose) {
      lines.push(`    ${t.status === 'skip' ? '⏭️ ' : '✅'} ${t.name}`);
    }
  }

  // A crash's stack trace is the only explanation there is. A test's own
  // console output is noise unless the file failed.
  if (!outcome.passed) {
    const captured = (state.stderr + state.stdout).trimEnd();
    if (captured) lines.push(indent(captured, 4));
  }
  return lines.join('\n') + '\n';
}

/** printOverallSummary writes with console.log; collect it so it stays in order with what we yield. */
function overallSummaryText(results) {
  const lines = [];
  const original = console.log;
  console.log = (...args) => lines.push(args.join(' '));
  try {
    printOverallSummary(results);
  } finally {
    console.log = original;
  }
  return lines.join('\n') + '\n';
}

module.exports = async function* unitReporter(source) {
  const verbose = process.env.UNIT_REPORT_VERBOSE === '1';
  const files = new Map();
  const results = [];

  const stateFor = (file) => {
    if (!files.has(file)) files.set(file, { file, tests: [], stderr: '', stdout: '', done: false });
    return files.get(file);
  };

  function finish(state, outcome) {
    state.done = true;
    // Node exits 0 for a file with no tests; make the whole run fail.
    if (!outcome.passed) process.exitCode = 1;
    results.push({ testType: labelFor(state.file).id, passed: outcome.passed, warnings: outcome.warnings });
    return renderFile(state, outcome, verbose);
  }

  // A file that crashed on load, waiting for the rest of its stderr.
  let crashed = null;

  for await (const event of source) {
    const data = { ...(event.data || {}) };
    if (!data.file && event.type !== 'test:summary') continue;
    // Output events name the file as it was given on the command line; test
    // events name it absolutely. Use one form, or a crash loses its stack trace.
    if (data.file) data.file = path.resolve(data.file);

    if (crashed && data.file !== crashed.file) {
      yield finish(crashed, fileOutcome({ crashed: true }));
      crashed = null;
    }

    if (event.type === 'test:stderr' || event.type === 'test:stdout') {
      stateFor(data.file)[event.type === 'test:stderr' ? 'stderr' : 'stdout'] += data.message;
      continue;
    }

    if (event.type === 'test:pass' || event.type === 'test:fail') {
      const state = stateFor(data.file);
      if (state.done) continue;
      // An event named for the file itself, with no summary before it, is Node
      // reporting on the file: a crash on load (fail) or no tests at all (pass).
      // Node names that event with the file's path as given on the command line.
      const isFileEvent = data.nesting === 0 && path.resolve(String(data.name)) === data.file;
      if (isFileEvent) {
        if (event.type === 'test:fail') {
          // Hold the line: the stack trace can arrive after this event.
          state.done = true;
          crashed = state;
        } else {
          yield finish(state, fileOutcome({ ranNothing: true }));
        }
        continue;
      }
      if (data.details && data.details.type === 'suite') continue;
      const skipped = data.skip !== undefined || data.todo !== undefined;
      state.tests.push({
        name: data.name,
        status: event.type === 'test:fail' ? 'fail' : skipped ? 'skip' : 'pass',
        message: event.type === 'test:fail' ? errorMessage(data.details) : '',
      });
      continue;
    }

    if (event.type === 'test:summary') {
      if (data.file) {
        const state = stateFor(data.file);
        if (!state.done) yield finish(state, fileOutcome({ counts: data.counts }));
      } else if (results.length > 1) {
        yield overallSummaryText(results);
      }
    }
  }
};

module.exports.fileOutcome = fileOutcome;
