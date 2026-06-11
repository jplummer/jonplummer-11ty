#!/usr/bin/env node

/**
 * Portfolio: PDF slide deck + matching .pptx → PNGs, copied PDF, markdown (notes from pptx).
 *
 * Usage:
 *   node scripts/content/convert-presentation-portfolio.js <pdf-file> <pptx-file> [year/month]
 *
 * Requires:
 *   - Poppler (brew install poppler)
 *   - Python 3 with python-pptx: pnpm run setup-deck-python (project venv; see docs/commands.md)
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { checkPopplerInstalled, getPageCount, getDefaultDatePath } = require('../utils/pdf-utils');
const { parseNotesFile } = require('../utils/portfolio-notes');
const { resolveDeckPython, deckVenvExists, SETUP_HINT } = require('../utils/deck-python');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error(
    'Usage: node scripts/content/convert-presentation-portfolio.js <pdf-file> <pptx-file> [year/month]',
  );
  console.error(
    'Example: node scripts/content/convert-presentation-portfolio.js deck.pdf deck.pptx 2026/03',
  );
  process.exit(1);
}

const pdfPath = path.resolve(args[0]);
const pptxPath = path.resolve(args[1]);
const datePath = args[2] || getDefaultDatePath();

if (!fs.existsSync(pdfPath)) {
  console.error(`Error: PDF not found: ${pdfPath}`);
  process.exit(1);
}
if (!fs.existsSync(pptxPath)) {
  console.error(`Error: PPTX not found: ${pptxPath}`);
  process.exit(1);
}
if (!pdfPath.toLowerCase().endsWith('.pdf')) {
  console.error('Error: First file must be a .pdf');
  process.exit(1);
}
if (!pptxPath.toLowerCase().endsWith('.pptx')) {
  console.error('Error: Second file must be a .pptx');
  process.exit(1);
}

checkPopplerInstalled();

const extractPy = path.join(__dirname, 'extract-pptx-notes.py');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-notes-'));
const notesPath = path.join(tmpDir, 'notes.txt');

const deckPython = resolveDeckPython();
if (!deckVenvExists()) {
  console.warn(
    '\nNote: scripts/content/.venv/ not found; using system python3. On Homebrew Python, run:\n' +
      SETUP_HINT,
  );
}

let slideCountFromPptx = 0;
try {
  const py = spawnSync(deckPython, [extractPy, pptxPath, '-o', notesPath], {
    encoding: 'utf8',
  });
  if (py.status !== 0) {
    const detail = py.stderr || py.stdout || 'extract-pptx-notes failed';
    console.error(detail);
    if (/python-pptx|ImportError|externally-managed-environment/i.test(detail)) {
      console.error('\n' + SETUP_HINT);
    }
    process.exit(py.status || 1);
  }
  slideCountFromPptx = parseNotesFile(notesPath).length;
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

try {
  const pageCount = getPageCount(pdfPath);
  if (slideCountFromPptx !== pageCount) {
    console.warn(
      `\nWarning: Slide count from .pptx (${slideCountFromPptx}) does not match PDF page count (${pageCount}).`,
    );
    console.warn(
      'Check hidden slides, export source, or mismatched files. Continuing with PDF page count for images.\n',
    );
  }
} catch (err) {
  console.warn(`Warning: Could not compare page count: ${err.message}\n`);
}

const convertScript = path.join(__dirname, 'convert-pdf-pages-with-notes.js');
const run = spawnSync(process.execPath, [convertScript, pdfPath, notesPath, datePath], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

try {
  fs.rmSync(tmpDir, { recursive: true });
} catch {
  // ignore
}

process.exit(run.status !== null && run.status !== undefined ? run.status : 1);
