/**
 * Absolute path to collected wisdom source YAML (alongside other site data under src/_data).
 * Eleventy also parses this file as global `wisdom-entries`; wisdom.js reads it again to build `wisdom`
 * (pagination needs that shape before computed data; _data/*.js cannot see sibling keys).
 */
const path = require('path');

const WISDOM_ENTRIES_YAML_PATH = path.join(__dirname, '..', '..', 'src', '_data', 'wisdom-entries.yaml');

module.exports = { WISDOM_ENTRIES_YAML_PATH };
