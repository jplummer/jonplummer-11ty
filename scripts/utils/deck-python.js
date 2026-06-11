const fs = require('fs');
const path = require('path');

const VENV_DIR = path.join(__dirname, '..', 'content', '.venv');

function deckVenvPythonPath() {
  const name = process.platform === 'win32' ? 'python.exe' : 'python3';
  return path.join(VENV_DIR, process.platform === 'win32' ? 'Scripts' : 'bin', name);
}

function resolveDeckPython() {
  const venvPython = deckVenvPythonPath();
  if (fs.existsSync(venvPython)) {
    return venvPython;
  }
  return process.platform === 'win32' ? 'python' : 'python3';
}

function deckVenvExists() {
  return fs.existsSync(deckVenvPythonPath());
}

const SETUP_HINT =
  'Run: pnpm run setup-deck-python\n' +
  '(Creates scripts/content/.venv/ — required on Homebrew Python; see docs/commands.md § PDF page conversion.)';

module.exports = {
  VENV_DIR,
  deckVenvPythonPath,
  deckVenvExists,
  resolveDeckPython,
  SETUP_HINT,
};
