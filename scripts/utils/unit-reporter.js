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
 * Things Node would let through or hide are failures or warnings here
 * (observed on Node 26.4.0):
 *   - a file with no tests is reported by Node as a pass
 *   - a skipped or todo test arrives as a pass event, and a file whose tests
 *     are all skipped ran nothing
 *   - a file that crashes on load sends no summary, only a failure and stderr
 *   - a file that throws after its tests passed, or whose `after` hook
 *     throws, keeps all-passing counts; only `success` or a failure event
 *     named for the file says so, and that event can come before or after
 *     the file's summary
 *
 * Because of that last one, a file's line is printed when the next file
 * starts or the run ends, once everything about it has arrived.
 *
 * Tested by scripts/test/unit-reporter.js.
 */

const path = require('path');
const manifest = require('../test-manifest');
const { printOverallSummary } = require('./test-results');

const FILE_EVENTS = new Set(['test:pass', 'test:fail', 'test:summary', 'test:stderr', 'test:stdout', 'test:diagnostic']);
const FALLBACK_EMOJI = '🧪';
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * Judge one finished file. `counts` is Node's per-file counts object, or null
 * when the file sent none (it crashed on load, or held no tests). `fileFailed`
 * is true when Node failed the file itself, whatever its tests did.
 */
function fileOutcome({ counts = null, fileFailed = false }) {
  const failed = (summary) => ({ icon: '❌', summary, passed: false, warnings: 0 });

  if (!counts) return failed(fileFailed ? 'stopped before reporting results' : 'no tests ran');
  if (counts.tests === 0) return failed('no tests ran');

  const failing = counts.failed + counts.cancelled;
  const notRun = counts.skipped + counts.todo;
  if (failing === 0 && counts.passed === 0) return failed(`no tests ran (${notRun} skipped)`);

  const parts = [`🧪 ${plural(counts.tests, 'test')}`];
  if (counts.passed > 0) parts.push(`✅ ${counts.passed} passing`);
  if (failing > 0) parts.push(`❌ ${failing} failing`);
  if (notRun > 0) parts.push(`⏭️  ${notRun} skipped`);
  if (fileFailed && failing === 0) parts.push('❌ failed outside its tests');

  const passed = failing === 0 && !fileFailed;
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

  // What Node said about the file itself, such as an `after` hook's error.
  if (state.fileError && state.fileError !== 'test failed') {
    lines.push(`    - ${oneLine(state.fileError)}`);
  }

  // A crash's stack trace is the only explanation there is. A test's own
  // console output is noise unless the file failed.
  if (!outcome.passed) {
    const captured = (state.diagnostics + state.stderr + state.stdout).trimEnd();
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
  const results = [];
  // The file being collected. Files run one at a time, so an event for
  // another file, or the run's own summary, means this one is complete.
  let current = null;

  function finish(state) {
    const outcome = fileOutcome({ counts: state.counts, fileFailed: state.fileFailed });
    // Node exits 0 for a file with no tests; make the whole run fail.
    if (!outcome.passed) process.exitCode = 1;
    results.push({ testType: labelFor(state.file).id, passed: outcome.passed, warnings: outcome.warnings });
    return renderFile(state, outcome, verbose);
  }

  for await (const event of source) {
    const data = { ...(event.data || {}) };

    if (event.type === 'test:summary' && !data.file) {
      if (current) yield finish(current);
      current = null;
      if (results.length > 1) yield overallSummaryText(results);
      continue;
    }
    // Node announces a file (test:enqueue) before the one ahead of it has
    // finished, so only these events may say which file is running.
    if (!data.file || !FILE_EVENTS.has(event.type)) continue;

    // Output events name the file as it was given on the command line; test
    // events name it absolutely. Use one form, or a crash loses its stack trace.
    const file = path.resolve(data.file);
    if (current && current.file !== file) {
      yield finish(current);
      current = null;
    }
    if (!current) {
      current = { file, tests: [], stderr: '', stdout: '', diagnostics: '', counts: null, fileFailed: false, fileError: '' };
    }
    const state = current;

    if (event.type === 'test:stderr' || event.type === 'test:stdout') {
      state[event.type === 'test:stderr' ? 'stderr' : 'stdout'] += data.message;
    } else if (event.type === 'test:diagnostic') {
      // Where Node puts an error thrown after the tests finished.
      state.diagnostics += `${data.message}\n`;
    } else if (event.type === 'test:summary') {
      state.counts = data.counts;
      if (data.success === false) state.fileFailed = true;
    } else if (event.type === 'test:pass' || event.type === 'test:fail') {
      // An event named for the file itself is Node reporting on the file, not
      // on a test. Node names it with the file's path as given on the command line.
      const isFileEvent = data.nesting === 0 && path.resolve(String(data.name)) === file;
      if (isFileEvent) {
        if (event.type === 'test:fail') {
          state.fileFailed = true;
          state.fileError = errorMessage(data.details);
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
    }
  }
};

module.exports.fileOutcome = fileOutcome;

// A test that never settles would hold the run open with nothing printed.
// The whole suite takes about five seconds, so two minutes is a hang.
const TEST_TIMEOUT_MS = 120000;

/** Arguments for one `node --test` run through this reporter. */
function nodeTestArgs({ files, timeoutMs = TEST_TIMEOUT_MS }) {
  return [
    '--test',
    '--test-concurrency=1',
    `--test-timeout=${timeoutMs}`,
    `--test-reporter=${__filename}`,
    '--test-reporter-destination=stdout',
    ...files,
  ];
}

module.exports.nodeTestArgs = nodeTestArgs;
