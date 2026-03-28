/**
 * Builds global `wisdom` (sorted entries, allTags, hash slugs) from `wisdom-entries.yaml` next to this file.
 * Eleventy also loads the same YAML as `wisdom-entries` (second parse on build) so authoring stays with
 * links.yaml and the rest of _data; _data/*.js callbacks cannot read sibling global data.
 */
const fs = require('fs');
const yaml = require('js-yaml');
const { buildWisdom } = require('../../eleventy/utils/wisdom-build');
const { WISDOM_ENTRIES_YAML_PATH } = require('../../eleventy/utils/wisdom-entries-path');

module.exports = function () {
  const raw = fs.readFileSync(WISDOM_ENTRIES_YAML_PATH, 'utf8');
  const data = yaml.load(raw, { schema: yaml.JSON_SCHEMA });
  return buildWisdom(data);
};
