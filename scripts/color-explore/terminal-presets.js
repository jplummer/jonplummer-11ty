/**
 * Blog token maps inspired by well-known terminal / editor palettes.
 * Hex literals below are converted to culori OKLCH objects at load (gallery is OKLCH-first).
 * Sources: Solarized (Ethan Schoonover), Gruvbox (Pavel Pertsev), Dracula, Nord, Toothpaste (imcatnoone).
 */

'use strict';

const { parse, converter } = require('culori');

const toOklch = converter('oklch');

/** @param {Record<string, string>} hexRecord */
function mapHexPaletteToOklch(hexRecord) {
  return Object.fromEntries(
    Object.entries(hexRecord).map(([key, hex]) => {
      const p = parse(hex);
      if (!p) return [key, { mode: 'oklch', l: 0.5, c: 0, h: 0 }];
      const o = toOklch(p);
      if (!o || typeof o.l !== 'number') {
        return [key, { mode: 'oklch', l: 0.5, c: 0, h: 0 }];
      }
      let h = o.h;
      if (typeof h !== 'number' || Number.isNaN(h)) h = 0;
      return [key, { mode: 'oklch', l: o.l, c: Math.max(0, o.c ?? 0), h }];
    })
  );
}

/** @returns {{ id: string, label: string, hue: null, light: Record<string, { mode: string, l: number, c: number, h: number }>, dark: Record<string, ...> }[]} */
function buildTerminalPresetThemes() {
  const hexThemes = [
    {
      id: 'term-solarized',
      label: 'Solarized (inspired)',
      hue: null,
      light: {
        'content-background-color': '#fdf6e3',
        'background-color': '#eee8d5',
        'text-color': '#586e75',
        'text-color-light': '#657b83',
        'border-color': '#93a1a1',
        'link-color': '#268bd2',
        'link-hover-color': '#cb4b16',
        'link-visited-color': '#6c71c4',
        'link-active-color': '#859900'
      },
      dark: {
        'content-background-color': '#073642',
        'background-color': '#002b36',
        'text-color': '#839496',
        'text-color-light': '#93a1a1',
        'border-color': '#586e75',
        'link-color': '#268bd2',
        'link-hover-color': '#2aa198',
        'link-visited-color': '#6c71c4',
        'link-active-color': '#859900'
      }
    },
    {
      id: 'term-gruvbox',
      label: 'Gruvbox (inspired)',
      hue: null,
      light: {
        'content-background-color': '#fbf1c4',
        'background-color': '#ebdbb2',
        'text-color': '#3c3836',
        'text-color-light': '#665c54',
        'border-color': '#bdae93',
        'link-color': '#076678',
        'link-hover-color': '#af3a03',
        'link-visited-color': '#8f3f71',
        'link-active-color': '#79740e'
      },
      dark: {
        'content-background-color': '#3c3836',
        'background-color': '#282828',
        'text-color': '#ebdbb2',
        'text-color-light': '#bdae93',
        'border-color': '#665c54',
        'link-color': '#83a598',
        'link-hover-color': '#fe8019',
        'link-visited-color': '#d3869b',
        'link-active-color': '#b8bb26'
      }
    },
    {
      id: 'term-dracula',
      label: 'Dracula (inspired)',
      hue: null,
      light: {
        'content-background-color': '#f8f8f2',
        'background-color': '#e9e9e4',
        'text-color': '#282a36',
        'text-color-light': '#6272a4',
        'border-color': '#bd93f9',
        'link-color': '#6272a4',
        'link-hover-color': '#ff5555',
        'link-visited-color': '#bd93f9',
        'link-active-color': '#50fa7b'
      },
      dark: {
        'content-background-color': '#282a36',
        'background-color': '#1e1f29',
        'text-color': '#f8f8f2',
        'text-color-light': '#6272a4',
        'border-color': '#44475a',
        'link-color': '#8be9fd',
        'link-hover-color': '#ffb86c',
        'link-visited-color': '#bd93f9',
        'link-active-color': '#50fa7b'
      }
    },
    {
      id: 'term-nord',
      label: 'Nord (inspired)',
      hue: null,
      light: {
        'content-background-color': '#eceff4',
        'background-color': '#e5e9f0',
        'text-color': '#2e3440',
        'text-color-light': '#4c566a',
        'border-color': '#d8dee9',
        'link-color': '#5e81ac',
        'link-hover-color': '#bf616a',
        'link-visited-color': '#b48ead',
        'link-active-color': '#a3be8c'
      },
      dark: {
        'content-background-color': '#3b4252',
        'background-color': '#2e3440',
        'text-color': '#eceff4',
        'text-color-light': '#d8dee9',
        'border-color': '#4c566a',
        'link-color': '#88c0d0',
        'link-hover-color': '#ebcb8b',
        'link-visited-color': '#b48ead',
        'link-active-color': '#a3be8c'
      }
    },
    {
      id: 'term-toothpaste',
      label: 'Toothpaste (inspired)',
      hue: null,
      light: {
        'content-background-color': '#f4f8f9',
        'background-color': '#e2ebee',
        'text-color': '#222e33',
        'text-color-light': '#576267',
        'border-color': '#7e898e',
        'link-color': '#2f6f7a',
        'link-hover-color': '#3d7a45',
        'link-visited-color': '#4a6b7a',
        'link-active-color': '#b84c4c'
      },
      dark: {
        'content-background-color': '#2b373c',
        'background-color': '#222e33',
        'text-color': '#dae3e8',
        'text-color-light': '#7e898e',
        'border-color': '#576267',
        'link-color': '#73b3c0',
        'link-hover-color': '#62a665',
        'link-visited-color': '#769eb3',
        'link-active-color': '#e36868'
      }
    }
  ];

  return hexThemes.map((t) => ({
    id: t.id,
    label: t.label,
    hue: t.hue,
    light: mapHexPaletteToOklch(t.light),
    dark: mapHexPaletteToOklch(t.dark)
  }));
}

module.exports = { buildTerminalPresetThemes };
