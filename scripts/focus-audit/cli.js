#!/usr/bin/env node
'use strict';

const path = require('path');

/**
 * Draw the WCAG-EM 2.0 Step 3.2 random sample. Its purpose is to test whether
 * the structured sample is complete, not to cover more of the site, so it is
 * drawn from pages the structured sample does not already include.
 */
const selectPages = (config, allPaths, rng) => {
  const structured = config.structuredSample.map((entry) => entry.path);
  const structuredSet = new Set(structured);
  const candidates = allPaths.filter((p) => !structuredSet.has(p));
  const drawCount = Math.max(1, Math.round(structured.length * config.randomSampleRatio));
  const random = [];

  const pool = candidates.slice();
  while (random.length < drawCount && pool.length > 0) {
    const index = Math.floor(rng() * pool.length);
    random.push(pool.splice(index, 1)[0]);
  }

  return { structured, random };
};

const parseArgs = (argv) => {
  const args = { baseUrl: null, seed: null, verbose: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--base-url') {
      args.baseUrl = argv[i + 1];
      i += 1;
    } else if (arg === '--seed') {
      args.seed = Number(argv[i + 1]);
      i += 1;
    } else if (arg === '--verbose') {
      args.verbose = true;
    }
  }

  return args;
};

/**
 * Deterministic RNG so a run can be reproduced from its recorded seed.
 * mulberry32 — small, no dependency, adequate for sample selection.
 */
const createRng = (seed) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const fetchSitemapPaths = async (baseUrl, sitemapPath) => {
  const response = await fetch(new URL(sitemapPath, baseUrl).href);
  if (!response.ok) {
    throw new Error(`Sitemap fetch failed: ${response.status} ${response.statusText}`);
  }
  const xml = await response.text();
  const matches = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
  return matches.map((entry) => {
    const url = entry.replace(/<\/?loc>/g, '').trim();
    return new URL(url).pathname;
  });
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));

  if (!args.baseUrl) {
    console.error('Error: --base-url is required (no default, so targeting production is deliberate).');
    console.error('Example: pnpm run focus-audit -- --base-url http://localhost:8080');
    process.exit(1);
  }

  const config = require(path.join(__dirname, 'jonplummer.config.js'));
  const seed = Number.isFinite(args.seed) ? args.seed : Date.now();
  const rng = createRng(seed);

  let allPaths = [];
  try {
    allPaths = await fetchSitemapPaths(args.baseUrl, config.sitemapPath);
  } catch (error) {
    console.error(`Error: could not reach ${args.baseUrl} — ${error.message}`);
    console.error('Is the dev server running? Try: pnpm run dev');
    process.exit(1);
  }

  const pages = selectPages(config, allPaths, rng);

  console.log(`Base URL: ${args.baseUrl}`);
  console.log(`Seed: ${seed}`);
  console.log(`Sitemap paths discovered: ${allPaths.length}`);
  console.log(`\nStructured sample (${pages.structured.length}):`);
  config.structuredSample.forEach((entry) => {
    console.log(`  ${entry.path}  — ${entry.why}`);
  });
  console.log(`\nRandom sample (${pages.random.length}):`);
  pages.random.forEach((p) => console.log(`  ${p}`));
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { selectPages, parseArgs, createRng };
