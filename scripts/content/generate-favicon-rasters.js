#!/usr/bin/env node

/**
 * Rasterize icon-raster.svg → apple-touch-icon.png + favicon.ico.
 * Tab icon remains icon.svg (not this file).
 *
 * Usage: pnpm run generate-favicon-rasters
 */

const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const requireFromEleventyImg = createRequire(require.resolve('@11ty/eleventy-img'));
const sharp = requireFromEleventyImg('sharp');

const ROOT = path.join(__dirname, '..', '..');
const SVG_PATH = path.join(ROOT, 'src/assets/images/icon-raster.svg');
const APPLE_PATH = path.join(ROOT, 'src/assets/images/apple-touch-icon.png');
const ICO_PATH = path.join(ROOT, 'src/favicon.ico');

const APPLE_SIZE = 180;
const ICO_SIZES = [32, 256];

function pngToIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6 + 16 * count;
  let offset = headerSize;
  const entries = pngBuffers.map((png) => {
    const entry = { png, offset, size: png.length };
    offset += png.length;
    return entry;
  });
  const buf = Buffer.alloc(offset);
  buf.writeUInt16LE(0, 0);
  buf.writeUInt16LE(1, 2);
  buf.writeUInt16LE(count, 4);
  let cursor = 6;
  for (let i = 0; i < entries.length; i++) {
    const { png, offset: imgOffset, size } = entries[i];
    const dim = ICO_SIZES[i] >= 256 ? 0 : ICO_SIZES[i];
    buf.writeUInt8(dim, cursor);
    buf.writeUInt8(dim, cursor + 1);
    buf.writeUInt8(0, cursor + 2);
    buf.writeUInt8(0, cursor + 3);
    buf.writeUInt16LE(1, cursor + 4);
    buf.writeUInt16LE(32, cursor + 6);
    buf.writeUInt32LE(size, cursor + 8);
    buf.writeUInt32LE(imgOffset, cursor + 12);
    cursor += 16;
  }
  for (const entry of entries) {
    entry.png.copy(buf, entry.offset);
  }
  return buf;
}

async function rasterize(svgBuffer, size) {
  return sharp(svgBuffer, { density: 384 })
    .resize(size, size, { fit: 'fill' })
    .png()
    .toBuffer();
}

async function main() {
  const svgBuffer = fs.readFileSync(SVG_PATH);
  const apple = await rasterize(svgBuffer, APPLE_SIZE);
  fs.writeFileSync(APPLE_PATH, apple);

  const icoPngs = [];
  for (const size of ICO_SIZES) {
    icoPngs.push(await rasterize(svgBuffer, size));
  }
  fs.writeFileSync(ICO_PATH, pngToIco(icoPngs));

  console.log(`Wrote ${path.relative(ROOT, APPLE_PATH)} (${APPLE_SIZE}×${APPLE_SIZE})`);
  console.log(`Wrote ${path.relative(ROOT, ICO_PATH)} (${ICO_SIZES.join(', ')})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
