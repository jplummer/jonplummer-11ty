/**
 * Self-hosted WOFF2 stacks for /type/ lab (subset latin, font-display: swap).
 * Files live in src/assets/fonts/lab/ — OFL licenses via @fontsource-variable packages.
 *
 * @see docs/font-stack-exploration.md
 */

/** @typedef {'exploratory'} FontStackGroup */
/** @typedef {'all-headings' | 'hgroup-only' | 'h1-titles'} HeadingScope */

/**
 * @typedef {Object} ExploratoryFontStack
 * @property {string} id
 * @property {string} name
 * @property {string} family CSS font-family list (matches @font-face family name)
 * @property {FontStackGroup} group
 * @property {HeadingScope} [headingScope]
 * @property {boolean} [bodyEligible=false] when false, headings select only
 * @property {boolean} webFont
 */

/** @type {ExploratoryFontStack[]} */
const EXPLORATORY_FONT_STACKS = [
  {
    id: 'archivo-variable',
    name: 'Archivo (variable, whole site)',
    family: '"Archivo", sans-serif',
    group: 'exploratory',
    headingScope: 'all-headings',
    bodyEligible: true,
    webFont: true
  },
  {
    id: 'big-shoulders-display',
    name: 'Big Shoulders Display (site title)',
    family: '"Big Shoulders", sans-serif',
    group: 'exploratory',
    headingScope: 'hgroup-only',
    bodyEligible: false,
    webFont: true
  },
  {
    id: 'big-shoulders-display-titles',
    name: 'Big Shoulders Display (site + post titles)',
    family: '"Big Shoulders", sans-serif',
    group: 'exploratory',
    headingScope: 'h1-titles',
    bodyEligible: false,
    webFont: true
  },
  {
    id: 'public-sans',
    name: 'Public Sans',
    family: '"Public Sans", sans-serif',
    group: 'exploratory',
    headingScope: 'all-headings',
    bodyEligible: true,
    webFont: true
  }
];

/** Lab card opens on production pairing (Public Sans body + Big Shoulders on h1 titles). */
const LAB_DEFAULT_HEADING_STACK_ID = 'big-shoulders-display-titles';
const LAB_DEFAULT_BODY_STACK_ID = 'public-sans';

module.exports = {
  EXPLORATORY_FONT_STACKS,
  LAB_DEFAULT_HEADING_STACK_ID,
  LAB_DEFAULT_BODY_STACK_ID
};
