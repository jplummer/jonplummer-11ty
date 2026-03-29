/**
 * Font stacks from Modern Font Stacks (CC0).
 * @see https://modernfontstacks.com
 * @see https://github.com/system-fonts/modern-font-stacks
 */

/** @typedef {{ id: string, name: string, family: string, displayOriented?: boolean, monospace?: boolean }} ModernFontStack */

/** @type {ModernFontStack[]} */
const MODERN_FONT_STACKS = [
  {
    id: 'system-ui',
    name: 'System UI',
    family: "system-ui, sans-serif"
  },
  {
    id: 'transitional',
    name: 'Transitional',
    family: "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, serif"
  },
  {
    id: 'old-style',
    name: 'Old Style',
    family: "'Iowan Old Style', 'Palatino Linotype', 'URW Palladio L', P052, serif"
  },
  {
    id: 'humanist',
    name: 'Humanist',
    family: "Seravek, 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans', source-sans-pro, sans-serif"
  },
  {
    id: 'geometric-humanist',
    name: 'Geometric Humanist',
    family: "Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif"
  },
  {
    id: 'classical-humanist',
    name: 'Classical Humanist',
    family: "Optima, Candara, 'Noto Sans', source-sans-pro, sans-serif"
  },
  {
    id: 'neo-grotesque',
    name: 'Neo-Grotesque',
    family: "Inter, Roboto, 'Helvetica Neue', 'Arial Nova', 'Nimbus Sans', Arial, sans-serif"
  },
  {
    id: 'monospace-slab-serif',
    name: 'Monospace Slab Serif',
    family: "'Nimbus Mono PS', 'Courier New', monospace",
    monospace: true
  },
  {
    id: 'monospace-code',
    name: 'Monospace Code',
    family: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace",
    monospace: true
  },
  {
    id: 'industrial',
    name: 'Industrial',
    family: "Bahnschrift, 'DIN Alternate', 'Franklin Gothic Medium', 'Nimbus Sans Narrow', sans-serif-condensed, sans-serif",
    displayOriented: true
  },
  {
    id: 'rounded-sans',
    name: 'Rounded Sans',
    family: "ui-rounded, 'Hiragino Maru Gothic ProN', Quicksand, Comfortaa, Manjari, 'Arial Rounded MT', 'Arial Rounded MT Bold', Calibri, source-sans-pro, sans-serif",
    displayOriented: true
  },
  {
    id: 'slab-serif',
    name: 'Slab Serif',
    family: "Rockwell, 'Rockwell Nova', 'Roboto Slab', 'DejaVu Serif', 'Sitka Small', serif",
    displayOriented: true
  },
  {
    id: 'antique',
    name: 'Antique',
    family: "Superclarendon, 'Bookman Old Style', 'URW Bookman', 'URW Bookman L', 'Georgia Pro', Georgia, serif",
    displayOriented: true
  },
  {
    id: 'didone',
    name: 'Didone',
    family: "Didot, 'Bodoni MT', 'Noto Serif Display', 'URW Palladio L', P052, Sylfaen, serif",
    displayOriented: true
  },
  {
    id: 'handwritten',
    name: 'Handwritten',
    family: "'Segoe Print', 'Bradley Hand', Chilanka, TSCu_Comic, casual, cursive",
    displayOriented: true
  }
];

/** Matches `src/assets/css/jonplummer.css` `--font-family` (system-ui stack). */
const SITE_DEFAULT_STACK_ID = 'system-ui';

module.exports = {
  MODERN_FONT_STACKS,
  SITE_DEFAULT_STACK_ID
};
