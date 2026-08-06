#!/usr/bin/env node
/**
 * CMS preflight. Run before a build or a deploy.
 *
 *   npm run check:cms
 *   STRAPI_URL=https://cms.fakhernco.com npm run check:cms
 *
 * Catches the failures that present as "the whole site is broken" but are
 * actually a CMS misconfiguration:
 *
 *   - public read permissions never granted   -> every collection 403s
 *   - PUBLIC_URL unset                        -> every image 404s
 *   - contact submissions publicly readable   -> enquiries exposed
 *   - the import never ran                    -> pages build empty
 */

import { readFileSync, existsSync } from 'node:fs';

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
loadEnv();

const CMS = (process.env.STRAPI_URL ?? 'http://localhost:1337').replace(/\/$/, '');

/** Rough row counts expected after a successful import. */
const EXPECT = {
  pages: 55,
  posts: 140,
  'practice-areas': 5,
  'case-studies': 2,
  categories: 7,
};

const failures = [];
const notes = [];

async function main() {
  console.log(`cms: ${CMS}\n`);

  // 1. Public read on every collection the front end needs.
  for (const [collection, min] of Object.entries(EXPECT)) {
    const url = `${CMS}/api/${collection}?pagination[pageSize]=1`;
    let res;
    try {
      res = await fetch(url);
    } catch (err) {
      failures.push(`${collection}: unreachable — ${err.message}`);
      continue;
    }
    if (res.status === 403 || res.status === 401) {
      failures.push(
        `${collection}: HTTP ${res.status} — public find/findOne not granted. ` +
          'src/index.ts grants these on boot; restart the CMS.',
      );
      continue;
    }
    if (!res.ok) {
      failures.push(`${collection}: HTTP ${res.status}`);
      continue;
    }
    const body = await res.json();
    const total = body?.meta?.pagination?.total ?? 0;
    if (total < min) {
      failures.push(`${collection}: ${total} entries, expected at least ${min} — has the import run?`);
    } else {
      notes.push(`${collection}: ${total}`);
    }
  }

  // 2. Single types.
  for (const single of ['homepage', 'site-setting']) {
    const res = await fetch(`${CMS}/api/${single}`);
    if (res.status === 404) failures.push(`${single}: not created — run the import`);
    else if (!res.ok) failures.push(`${single}: HTTP ${res.status}`);
    else notes.push(`${single}: ok`);
  }

  // 3. Contact submissions must NOT be publicly readable. This holds
  //    unsolicited enquiries from a law firm's prospective clients.
  const leaked = await fetch(`${CMS}/api/contact-submissions`);
  if (leaked.ok) {
    failures.push(
      'contact-submissions: PUBLICLY READABLE. Untick find/findOne for the Public role immediately.',
    );
  } else {
    notes.push(`contact-submissions: not public (HTTP ${leaked.status}) ✓`);
  }

  // 4. Media must resolve. An unset PUBLIC_URL makes Strapi emit
  //    localhost:1337 URLs, and every image on the site 404s — the single
  //    most misdiagnosed failure on this stack.
  const home = await fetch(`${CMS}/api/homepage?populate[heroImage]=true`).then((r) => r.json());
  const heroUrl = home?.data?.heroImage?.url;
  if (!heroUrl) {
    failures.push('homepage.heroImage: not set — run the media migration');
  } else {
    const abs = heroUrl.startsWith('http') ? heroUrl : `${CMS}${heroUrl}`;
    if (/localhost|127\.0\.0\.1/.test(abs) && !/localhost/.test(CMS)) {
      failures.push(`media: CMS is emitting ${abs} — PUBLIC_URL is unset in the CMS environment`);
    }
    const img = await fetch(abs, { method: 'HEAD' });
    if (!img.ok) failures.push(`media: ${abs} returns HTTP ${img.status}`);
    else notes.push('media: resolves ✓');
  }

  // 5. The contact endpoint must exist and must reject an empty body.
  const contact = await fetch(`${CMS}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (contact.status === 404) failures.push('POST /api/contact: 404 — the submit route is missing');
  else if (contact.status !== 400) {
    failures.push(`POST /api/contact: expected 400 for an empty body, got ${contact.status}`);
  } else notes.push('contact endpoint: validates ✓');

  // ---- report ----
  for (const n of notes) console.log(`  ${n}`);
  console.log();
  if (failures.length) {
    console.log(`${failures.length} FAILURE(S):`);
    for (const f of failures) console.log(`  ✗ ${f}`);
    process.exit(1);
  }
  console.log('PASS — CMS is ready to build against.');
}

main().catch((err) => {
  console.error('check-cms failed to run:', err.message);
  process.exit(1);
});
