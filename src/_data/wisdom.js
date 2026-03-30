const fs = require('fs');
const yaml = require('js-yaml');
const { buildWisdom } = require('../../eleventy/utils/wisdom-build');
const { WISDOM_ENTRIES_YAML_PATH } = require('../../eleventy/utils/wisdom-entries-path');

/**
 * Global `wisdom` for templates and pagination (from `wisdom-entries.yaml` via `wisdom-build.js`).
 */
module.exports = () => {
  const raw = yaml.load(fs.readFileSync(WISDOM_ENTRIES_YAML_PATH, 'utf8'));
  return buildWisdom(raw);
};
