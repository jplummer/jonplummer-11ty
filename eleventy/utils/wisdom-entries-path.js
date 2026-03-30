/**
 * Absolute path to collected wisdom source YAML (`src/_data/wisdom-entries.yaml`).
 * Used by `src/_data/wisdom.js` and tests.
 */
const path = require('path');

const WISDOM_ENTRIES_YAML_PATH = path.join(
  __dirname,
  '..',
  '..',
  'src',
  '_data',
  'wisdom-entries.yaml'
);

module.exports = { WISDOM_ENTRIES_YAML_PATH };
