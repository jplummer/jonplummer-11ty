#!/usr/bin/env node

/**
 * Unit tests for `pnpm run shortlink` (scripts/content/shortlink.js) and the
 * helpers behind it in scripts/utils/shortlinks.js.
 *
 * The command is run for real, in a scratch folder holding a copy of
 * src/_data/shortlinks.yaml; the real file is read, never written. The Apache
 * rules are proved against a real Apache when this machine has one
 * (/usr/sbin/httpd on macOS), started on a private port for a second or two.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');
const { spawnSync } = require('child_process');
const yaml = require('js-yaml');
const {
  loadShortlinksFile,
  validateShortlinks,
  lookupBySlug,
  lookupByDestination,
  pickUnusedSlug,
  qrPayloadForSlug,
  rewriteRuleFor,
  htaccessRewriteLines,
} = require('../utils/shortlinks');
const { todayIsoDate } = require('../../eleventy/utils/date-utils');

const REPO = path.join(__dirname, '..', '..');
const REAL_FILE = path.join(REPO, 'src', '_data', 'shortlinks.yaml');
const COMMAND = path.join(REPO, 'scripts', 'content', 'shortlink.js');

/** Destinations Apache mangles unless the rule escapes them. */
const AWKWARD = [
  'https://example.com/a%20b#part',
  'https://www.youtube.com/watch?v=AAAA&t=10',
  'https://example.com/p/$1/100%25?x=%7B%7D&y=$2#frag%20ment',
  'https://example.com/caf%C3%A9/(paren)/~tilde/a+b/x;y=1,2/@me?q=a%2Bb&r=c%26d',
  'https://jonplummer.com/about/#contact',
];

/** Run fn with a scratch folder that holds a copy of the real shortlinks file. */
function withScratchSite(fn) {
  return async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jp11ty-shortlink-'));
    try {
      fs.mkdirSync(path.join(dir, 'src', '_data'), { recursive: true });
      const file = path.join(dir, 'src', '_data', 'shortlinks.yaml');
      fs.copyFileSync(REAL_FILE, file);
      await fn({ dir, file });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };
}

/** `pnpm run shortlink …` in the scratch folder. */
function shortlink(dir, ...args) {
  const run = spawnSync(process.execPath, [COMMAND, ...args], { cwd: dir, encoding: 'utf8' });
  return { code: run.status, out: run.stdout + run.stderr };
}

// --- the Apache rule ---

test('a plain destination gets the rule it always had', () => {
  assert.strictEqual(
    rewriteRuleFor({ slug: 'ME', to: 'https://jonplummer.com/about/' }),
    'RewriteRule ^ME/?$ https://jonplummer.com/about/ [R=302,NC,L]'
  );
});

// Five links are printed on cards. Their rules must not change by a byte.
test('every rule for the real shortlinks file is in the plain form', () => {
  const entries = loadShortlinksFile(REAL_FILE);
  assert.deepStrictEqual(
    htaccessRewriteLines(entries),
    entries.map((e) => `RewriteRule ^${e.slug}/?$ ${e.to} [R=302,NC,L]`)
  );
});

test('percent signs, dollar signs, and backslashes are escaped, and the rule gets NE', () => {
  assert.strictEqual(
    rewriteRuleFor({ slug: 'ZZ', to: 'https://example.com/a%20b/$1#part' }),
    'RewriteRule ^ZZ/?$ https://example.com/a\\%20b/\\$1#part [R=302,NC,NE,L]'
  );
});

test('a query string or a fragment gets NE', () => {
  assert.match(rewriteRuleFor({ slug: 'ZZ', to: 'https://example.com/watch?v=A' }), /\[R=302,NC,NE,L\]$/);
  assert.match(rewriteRuleFor({ slug: 'ZZ', to: 'https://example.com/about/#contact' }), /\[R=302,NC,NE,L\]$/);
});

// --- validation ---

test('any valid https URL is an acceptable destination', () => {
  const entries = AWKWARD.map((to, i) => ({ slug: `A${'ABCDEFGH'[i]}`, to, created: '2026-11-10' }));
  assert.deepStrictEqual(validateShortlinks(entries).issues, []);
});

test('a destination with a raw space or a non-ASCII character is refused, with the fix', () => {
  for (const to of ['https://example.com/has space', 'https://example.com/café', 'https://example.com/a\tb']) {
    const { issues } = validateShortlinks([{ slug: 'AB', to, created: '2026-11-10' }]);
    assert.ok(
      issues.some((message) => /percent-encoded/.test(message)),
      `expected ${JSON.stringify(to)} to be refused; got ${JSON.stringify(issues)}`
    );
  }
});

// --- lookups ---

test('a destination is the same with or without its trailing slash', () => {
  const entries = [{ slug: 'ME', to: 'https://jonplummer.com/about/' }];
  assert.strictEqual(lookupByDestination(entries, 'https://jonplummer.com/about').length, 1);
  assert.strictEqual(lookupByDestination(entries, 'https://jonplummer.com/about/').length, 1);
});

test('a different query string or fragment is a different destination', () => {
  const entries = [
    { slug: 'AA', to: 'https://www.youtube.com/watch?v=AAAA' },
    { slug: 'ME', to: 'https://jonplummer.com/about/' },
  ];
  assert.deepStrictEqual(lookupByDestination(entries, 'https://www.youtube.com/watch?v=BBBB'), []);
  assert.deepStrictEqual(lookupByDestination(entries, 'https://jonplummer.com/about/#contact'), []);
  assert.strictEqual(lookupByDestination(entries, 'https://www.youtube.com/watch?v=AAAA').length, 1);
});

test('a slug is found in either case', () => {
  const entries = [{ slug: 'ME', to: 'https://jonplummer.com/about/' }];
  assert.strictEqual(lookupBySlug(entries, 'me').slug, 'ME');
  assert.strictEqual(lookupBySlug(entries, 'ZZ'), null);
});

test('the next free slug is the first unused one in order, and a chosen slug is upper-cased', () => {
  const entries = [{ slug: 'AA' }, { slug: 'AB' }, { slug: 'AD' }];
  assert.strictEqual(pickUnusedSlug(entries), 'AC');
  assert.strictEqual(pickUnusedSlug(entries, 'zz'), 'ZZ');
});

test('a taken slug, or one outside the alphabet, is refused', () => {
  const entries = [{ slug: 'AA' }];
  assert.throws(() => pickUnusedSlug(entries, 'aa'), /already taken/);
  for (const bad of ['OI', 'A1', 'ABC', 'A', 'a-']) {
    assert.throws(() => pickUnusedSlug(entries, bad), /bad slug/, `expected ${bad} to be refused`);
  }
});

test('the QR text is the upper-case address', () => {
  assert.strictEqual(qrPayloadForSlug('me'), 'HTTPS://JONPLUMMER.COM/ME');
});

test("today's date is the Pacific calendar day, not the UTC one", () => {
  assert.strictEqual(todayIsoDate(new Date('2026-11-11T01:30:00Z')), '2026-11-10');
  assert.strictEqual(todayIsoDate(new Date('2026-07-01T06:59:00Z')), '2026-06-30');
  assert.strictEqual(todayIsoDate(new Date('2026-07-01T07:00:00Z')), '2026-07-01');
});

// --- the command, run in a scratch folder ---

test('add leaves every existing line as it was and puts the new link last', withScratchSite(({ dir, file }) => {
  const before = fs.readFileSync(file, 'utf8');
  const run = shortlink(dir, 'add', 'https://example.com/new-page/', '--note', 'A note: with "quotes"');
  assert.strictEqual(run.code, 0, run.out);

  const after = fs.readFileSync(file, 'utf8');
  assert.ok(after.startsWith(before), 'the file as it was must still be there, comments and all');

  const entries = loadShortlinksFile(file);
  const added = entries[entries.length - 1];
  assert.deepStrictEqual(added, {
    slug: added.slug,
    to: 'https://example.com/new-page/',
    created: todayIsoDate(),
    note: 'A note: with "quotes"',
  });
  assert.strictEqual(entries.length, loadShortlinksFile(REAL_FILE).length + 1);
  assert.deepStrictEqual(validateShortlinks(entries).issues, []);
  assert.match(after, /created: "\d{4}-\d{2}-\d{2}"\n/, 'created is double-quoted, as in the rest of the file');
}));

test('add gives two videos on one site two slugs', withScratchSite(({ dir, file }) => {
  assert.strictEqual(shortlink(dir, 'add', 'https://www.youtube.com/watch?v=AAAA').code, 0);
  const second = shortlink(dir, 'add', 'https://www.youtube.com/watch?v=BBBB');
  assert.strictEqual(second.code, 0, second.out);
  const tos = loadShortlinksFile(file).slice(-2).map((e) => e.to);
  assert.deepStrictEqual(tos, ['https://www.youtube.com/watch?v=AAAA', 'https://www.youtube.com/watch?v=BBBB']);
}));

test('add refuses a destination that already has a slug, and writes nothing', withScratchSite(({ dir, file }) => {
  const before = fs.readFileSync(file, 'utf8');
  const run = shortlink(dir, 'add', 'https://jonplummer.com/about');
  assert.strictEqual(run.code, 1);
  assert.match(run.out, /Already linked/);
  assert.strictEqual(fs.readFileSync(file, 'utf8'), before);
}));

test('add stores a destination with a space in its percent-encoded form', withScratchSite(({ dir, file }) => {
  const run = shortlink(dir, 'add', 'https://example.com/has space/café');
  assert.strictEqual(run.code, 0, run.out);
  const entries = loadShortlinksFile(file);
  assert.strictEqual(entries[entries.length - 1].to, 'https://example.com/has%20space/caf%C3%A9');
  assert.deepStrictEqual(validateShortlinks(entries).issues, []);
}));

test('add refuses a slug outside the alphabet, and writes nothing', withScratchSite(({ dir, file }) => {
  const before = fs.readFileSync(file, 'utf8');
  const run = shortlink(dir, 'add', 'https://example.com/x', '--slug', 'oi');
  assert.strictEqual(run.code, 1);
  assert.match(run.out, /bad slug/);
  assert.strictEqual(fs.readFileSync(file, 'utf8'), before);
}));

test('add refuses a flag with no value, and writes nothing', withScratchSite(({ dir, file }) => {
  const before = fs.readFileSync(file, 'utf8');
  const run = shortlink(dir, 'add', 'https://example.com/x', '--slug');
  assert.strictEqual(run.code, 1);
  assert.match(run.out, /--slug needs a value/);
  assert.strictEqual(fs.readFileSync(file, 'utf8'), before);
}));

test('get and find print the link', withScratchSite(({ dir }) => {
  const get = shortlink(dir, 'get', 'me');
  assert.strictEqual(get.code, 0);
  assert.match(get.out, /https:\/\/jonplummer\.com\/about\//);
  const find = shortlink(dir, 'find', 'https://jonplummer.com/about/');
  assert.match(find.out, /^ME/m);
  assert.match(shortlink(dir, 'find', 'https://example.com/nothing').out, /No shortlink points to/);
}));

// --- the rules, against a real Apache ---

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

const HTTPD = '/usr/sbin/httpd';
const MODULES = '/usr/libexec/apache2';
const hasApache = fs.existsSync(HTTPD) && fs.existsSync(path.join(MODULES, 'mod_rewrite.so'));

test(
  'a real Apache redirects each short link to exactly its destination',
  { skip: hasApache ? false : `no Apache at ${HTTPD}; the rules are unproved on this machine` },
  async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jp11ty-apache-'));
    const port = await freePort();
    const conf = path.join(dir, 'httpd.conf');
    const entries = [
      { slug: 'ME', to: 'https://jonplummer.com/about/' },
      ...AWKWARD.map((to, i) => ({ slug: `Z${'ABCDEFGH'[i]}`, to })),
    ];
    fs.mkdirSync(path.join(dir, 'www'));
    fs.writeFileSync(
      path.join(dir, 'www', '.htaccess'),
      ['RewriteEngine On', 'RewriteBase /', ...htaccessRewriteLines(entries), ''].join('\n')
    );
    fs.writeFileSync(conf, [
      `ServerRoot "${dir}"`,
      `Listen 127.0.0.1:${port}`,
      'ServerName localhost',
      `PidFile "${dir}/httpd.pid"`,
      `ErrorLog "${dir}/error.log"`,
      `LoadModule mpm_prefork_module ${MODULES}/mod_mpm_prefork.so`,
      `LoadModule authz_core_module ${MODULES}/mod_authz_core.so`,
      `LoadModule unixd_module ${MODULES}/mod_unixd.so`,
      `LoadModule rewrite_module ${MODULES}/mod_rewrite.so`,
      `DocumentRoot "${dir}/www"`,
      `<Directory "${dir}/www">`,
      '  AllowOverride All',
      '  Require all granted',
      '</Directory>',
      '',
    ].join('\n'));

    const start = spawnSync(HTTPD, ['-f', conf, '-k', 'start'], { encoding: 'utf8' });
    assert.strictEqual(start.status, 0, `Apache did not start: ${start.stderr}`);
    try {
      // Apache forks and returns before it listens; wait for the port.
      let up = false;
      for (let attempt = 0; attempt < 50 && !up; attempt++) {
        up = await fetch(`http://127.0.0.1:${port}/`, { redirect: 'manual' }).then(() => true, () => false);
        if (!up) await new Promise((resolve) => setTimeout(resolve, 100));
      }
      assert.ok(up, 'Apache did not answer within five seconds');

      const wrong = [];
      for (const { slug, to } of entries) {
        for (const request of [slug, `${slug.toLowerCase()}/`]) {
          const response = await fetch(`http://127.0.0.1:${port}/${request}`, { redirect: 'manual' });
          const location = response.headers.get('location');
          if (response.status !== 302 || location !== to) {
            wrong.push(`/${request}: ${response.status} ${location} (wanted 302 ${to})`);
          }
        }
      }
      assert.deepStrictEqual(wrong, []);
    } finally {
      spawnSync(HTTPD, ['-f', conf, '-k', 'stop']);
      // Give Apache a moment to exit before its folder goes.
      await new Promise((resolve) => setTimeout(resolve, 300));
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
);

// The template must write the same rule this module builds, unescaped by
// Nunjucks: an "&" turned into "&amp;" breaks the redirect.
test('.htaccess.njk writes each rule through rewriteRuleFor, without HTML escaping', () => {
  const template = fs.readFileSync(path.join(REPO, 'src', '.htaccess.njk'), 'utf8');
  const block = template.slice(template.indexOf('# Begin shortlinks'), template.indexOf('# End shortlinks'));
  const nunjucks = require('nunjucks');
  const env = new nunjucks.Environment(null, { autoescape: true });
  env.addFilter('shortlinkRewriteRule', rewriteRuleFor);
  const entries = AWKWARD.map((to, i) => ({ slug: `Z${'ABCDEFGH'[i]}`, to }));
  const rendered = env.renderString(block, { shortlinks: { shortlinks: entries } });
  assert.deepStrictEqual(
    rendered.split('\n').filter((line) => line.startsWith('RewriteRule')),
    htaccessRewriteLines(entries)
  );
});

// yaml is used above only through the helpers; this keeps the appended text honest.
test('the appended entry is plain YAML that a parser reads back', withScratchSite(({ dir, file }) => {
  shortlink(dir, 'add', 'https://example.com/a%20b#part', '--slug', 'zz', '--created', '2026-01-02');
  const data = yaml.load(fs.readFileSync(file, 'utf8'));
  assert.deepStrictEqual(data.shortlinks[data.shortlinks.length - 1], {
    slug: 'ZZ',
    to: 'https://example.com/a%20b#part',
    created: '2026-01-02',
  });
}));
