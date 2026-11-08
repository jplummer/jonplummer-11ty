/**
 * Each OG card carries a digest of what it was rendered from, in a PNG tEXt
 * chunk. The generator compares it with the digest of what the card would
 * render now, and re-renders only when they differ, so editing a post's body
 * or a fresh clone's file times never re-issues a card.
 *
 * The digest covers the card's own inputs (title, label, whether the label
 * is a path) and the shared fingerprint (tokens, fonts, templates, mark, site
 * data, render code; see og-shared-fingerprint.js). A PNG with no digest, such
 * as one replaced by hand, reads as null and is re-rendered.
 */

const crypto = require('crypto');
const fs = require('fs');
const zlib = require('zlib');

const KEYWORD = 'og-card-digest';
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * @param {string} sharedFingerprint from computeOgSharedFingerprint()
 * @param {{ title: string, label?: string|null, labelIsPath?: boolean }} card
 * @returns {string} sha256 hex
 */
function computeCardDigest(sharedFingerprint, card) {
  const inputs = {
    shared: sharedFingerprint,
    title: card.title,
    label: card.label || null,
    labelIsPath: Boolean(card.labelIsPath),
  };
  return crypto.createHash('sha256').update(JSON.stringify(inputs)).digest('hex');
}

// Split a PNG into chunks: [{ type, data }]. Returns null if it isn't a PNG.
function readChunks(buffer) {
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  const chunks = [];
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('latin1', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += 12 + length;
    if (type === 'IEND') break;
  }
  return chunks;
}

function encodeChunk(type, data) {
  const typeAndData = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

function isDigestChunk(chunk) {
  return chunk.type === 'tEXt' && chunk.data.toString('latin1').startsWith(`${KEYWORD}\0`);
}

/** @returns {string | null} the stored digest, or null if absent or unreadable */
function readPngDigest(filePath) {
  let buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch {
    return null;
  }
  const chunks = readChunks(buffer);
  const chunk = chunks && chunks.find(isDigestChunk);
  return chunk ? chunk.data.toString('latin1').slice(KEYWORD.length + 1) : null;
}

/** Write the digest into the PNG, replacing any earlier one. Pixels are untouched. */
function writePngDigest(filePath, digest) {
  const chunks = readChunks(fs.readFileSync(filePath));
  if (!chunks) throw new Error(`Not a PNG: ${filePath}`);
  const text = encodeChunk('tEXt', Buffer.from(`${KEYWORD}\0${digest}`, 'latin1'));
  const parts = [PNG_SIGNATURE];
  for (const chunk of chunks.filter((c) => !isDigestChunk(c))) {
    if (chunk.type === 'IEND') parts.push(text);
    parts.push(encodeChunk(chunk.type, chunk.data));
  }
  fs.writeFileSync(filePath, Buffer.concat(parts));
}

module.exports = { KEYWORD, computeCardDigest, readPngDigest, writePngDigest, readChunks };
