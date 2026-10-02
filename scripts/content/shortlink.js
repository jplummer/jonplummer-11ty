#!/usr/bin/env node

/**
 * Short-link CLI: add, get, find, qr
 *
 *   pnpm run shortlink get JP
 *   pnpm run shortlink find https://jonplummer.com/about/
 *   pnpm run shortlink add https://example.com/page --note "cards"
 *   pnpm run shortlink qr JP --out ./tmp-qr
 */

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const {
  loadShortlinksFile,
  saveShortlinks,
  validateShortlinks,
  lookupBySlug,
  lookupByDestination,
  pickUnusedSlug,
  qrPayloadForSlug,
  isAbsoluteHttps,
  SHORTLINKS_PATH,
} = require('../utils/shortlinks');

function usage(exitCode = 1) {
  console.log(`Usage:
  pnpm run shortlink get <slug>
  pnpm run shortlink find <https-url>
  pnpm run shortlink add <https-url> [--slug XX] [--note "..."] [--created YYYY-MM-DD]
  pnpm run shortlink qr <slug> [--out <dir>]

Data file: ${SHORTLINKS_PATH}
`);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--slug' || a === '--note' || a === '--created' || a === '--out') {
      args[a.slice(2)] = argv[++i];
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    } else if (a.startsWith('--')) {
      console.error(`Unknown flag: ${a}`);
      usage(1);
    } else {
      args._.push(a);
    }
  }
  return args;
}

function printEntry(entry) {
  const retired = entry.retired ? ' (retired)' : '';
  console.log(`${entry.slug}${retired}`);
  console.log(`  to:      ${entry.to}`);
  if (entry.note) console.log(`  note:    ${entry.note}`);
  if (entry.created) console.log(`  created: ${entry.created}`);
  console.log(`  print:   ${qrPayloadForSlug(entry.slug)}`);
}

async function cmdGet(slug) {
  const entries = loadShortlinksFile();
  const entry = lookupBySlug(entries, slug);
  if (!entry) {
    console.error(`No shortlink for slug ${String(slug).toUpperCase()}`);
    process.exit(1);
  }
  printEntry(entry);
}

async function cmdFind(url) {
  if (!isAbsoluteHttps(url)) {
    console.error('find requires an absolute https URL');
    process.exit(1);
  }
  const entries = loadShortlinksFile();
  const matches = lookupByDestination(entries, url);
  if (matches.length === 0) {
    console.log(`No shortlink points to ${url}`);
    process.exit(0);
  }
  for (const entry of matches) printEntry(entry);
}

async function cmdAdd(url, opts) {
  if (!isAbsoluteHttps(url)) {
    console.error('add requires an absolute https URL');
    process.exit(1);
  }
  const entries = loadShortlinksFile();
  const existing = lookupByDestination(entries, url);
  if (existing.length > 0) {
    console.error(`Already linked — reuse existing slug(s) instead of minting another:`);
    for (const entry of existing) printEntry(entry);
    process.exit(1);
  }

  let slug;
  try {
    slug = pickUnusedSlug(entries, opts.slug);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  const created = opts.created || new Date().toISOString().slice(0, 10);
  const entry = {
    slug,
    to: url,
    created,
  };
  if (opts.note) entry.note = opts.note;
  const next = entries.concat(entry);
  const { issues, warnings } = validateShortlinks(next);
  if (issues.length) {
    console.error('Validation failed:');
    for (const m of issues) console.error(`  ${m}`);
    process.exit(1);
  }
  for (const m of warnings) console.warn(`Warning: ${m}`);

  saveShortlinks(next);
  console.log(`Added ${slug} → ${url}`);
  console.log(`Edit data: ${SHORTLINKS_PATH}`);
  console.log(`Rebuild to update .htaccess, then deploy.`);
  printEntry(entry);
}

async function cmdQr(slug, outDir) {
  const entries = loadShortlinksFile();
  const entry = lookupBySlug(entries, slug);
  if (!entry) {
    console.error(`No shortlink for slug ${String(slug).toUpperCase()}`);
    process.exit(1);
  }
  const payload = qrPayloadForSlug(entry.slug);
  const dir = path.resolve(outDir || path.join(process.cwd(), '.cache', 'shortlink-qr'));
  fs.mkdirSync(dir, { recursive: true });
  const base = path.join(dir, entry.slug);
  const svgPath = `${base}.svg`;
  const pngPath = `${base}.png`;

  // Alphanumeric mode is chosen automatically when the payload is uppercase A–Z / 0–9 / $%*+-./:
  await QRCode.toFile(svgPath, payload, {
    type: 'svg',
    errorCorrectionLevel: 'Q',
    margin: 1,
  });
  await QRCode.toFile(pngPath, payload, {
    type: 'png',
    errorCorrectionLevel: 'Q',
    margin: 1,
    width: 512,
  });

  console.log(`QR payload: ${payload}`);
  console.log(`Wrote ${svgPath}`);
  console.log(`Wrote ${pngPath}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args._.length === 0) usage(args.help ? 0 : 1);

  const [cmd, ...rest] = args._;
  try {
    switch (cmd) {
      case 'get':
        if (!rest[0]) usage(1);
        await cmdGet(rest[0]);
        break;
      case 'find':
        if (!rest[0]) usage(1);
        await cmdFind(rest[0]);
        break;
      case 'add':
        if (!rest[0]) usage(1);
        await cmdAdd(rest[0], args);
        break;
      case 'qr':
        if (!rest[0]) usage(1);
        await cmdQr(rest[0], args.out);
        break;
      default:
        console.error(`Unknown command: ${cmd}`);
        usage(1);
    }
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
}

main();
