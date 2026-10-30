#!/usr/bin/env node

/**
 * Regenerates every post figure under scripts/figures/ (any .js file here except this one and
 * figure-utils.js). Run after changing a figure's geometry or labels, or after the site tokens
 * it copies change — `pnpm run test figure-tokens` says when.
 */

const fs = require('fs');
const path = require('path');
const { writeFigure } = require('./figure-utils');

const SKIP = new Set(['generate-figures.js', 'figure-utils.js']);

const figures = fs.readdirSync(__dirname).filter((name) => name.endsWith('.js') && !SKIP.has(name));

for (const name of figures) {
  const { output, render } = require(path.join(__dirname, name));
  writeFigure(output, render());
  console.log(`✅ ${path.relative(process.cwd(), output)}`);
}
