#!/usr/bin/env node
/**
 * Reattach CMS images to blocks that still point at the dead WordPress origin.
 *
 *   node scripts/relink-legacy-images.mjs                 # dry run (default)
 *   node scripts/relink-legacy-images.mjs --apply         # write
 *   node scripts/relink-legacy-images.mjs --apply --limit 1   # canary first
 *   node scripts/relink-legacy-images.mjs --include-edited    # see below
 *   node scripts/relink-legacy-images.mjs --substitute        # see below
 *
 * WHAT IS BROKEN
 *
 * `blocks.image` and `blocks.gallery` items prefer an uploaded Strapi `file`
 * and fall back to `legacySrc` — an absolute URL at
 * fakhernco.com/wp-content/... (src/lib/content.ts). That fallback was correct
 * while WordPress served the domain. Since the DNS cutover fakhernco.com is
 * this Next app on Vercel, there is no /wp-content route, and every block that
 * fell back renders a broken image.
 *
 * Many of those files were in fact migrated — they are sitting in the Strapi
 * media library, just never attached to the block. This script attaches them,
 * matching on filename. Nothing is ever uploaded.
 *
 * Three degrees of confidence, each behind its own flag, because they are not
 * equally safe and should not be approved in one gesture:
 *
 *   (default)          exact filename match. The same photograph. 26 blocks.
 *   --include-edited   a WordPress `-e1772931703989` derivative matched to its
 *                      un-edited original. Same photograph, possibly a
 *                      different crop. 8 blocks.
 *   --substitute       a DIFFERENT photograph, from the table below, for files
 *                      the library does not hold at all. 38 blocks.
 *
 * All three together relink 72 of the 78 broken blocks. The remaining 6 are
 * two bespoke graphics — see DELIBERATELY ABSENT on the table below.
 *
 * DRAFT, NOT PUBLISHED
 *
 * Strapi 5's REST update writes the DRAFT. Nothing changes on the live site
 * until each entry is published in the admin — which is deliberate here: it
 * gives you a review step in the CMS before the edits go out.
 *
 * SAFETY
 *
 * Updating one component in a dynamic zone means PUTting the whole `blocks`
 * array, so a field this script failed to read back is a field it would erase.
 * Three guards, all on by default:
 *
 *   1. every affected entry is written to .backups/relink-<stamp>/ first;
 *   2. the payload is compared field-by-field against what was fetched, and
 *      the entry is skipped if anything but `file` would change;
 *   3. after the write the entry is re-fetched and compared again — a mismatch
 *      restores the backup immediately and stops the run.
 *
 * Requires STRAPI_API_TOKEN with write access (.env.local, or --token=...).
 * The token in .env.local is currently EMPTY; a read-only token will 403.
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';

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

const CMS = (process.env.STRAPI_URL ?? 'http://localhost:1337').trim().replace(/\/$/, '');
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f) => argv.find((a) => a.startsWith(`${f}=`))?.slice(f.length + 1);

const APPLY = has('--apply');
const INCLUDE_EDITED = has('--include-edited');
const SUBSTITUTE = has('--substitute');
const LIMIT = Number(val('--limit') ?? Infinity);
const TOKEN = val('--token') ?? process.env.STRAPI_API_TOKEN ?? '';

const LOCALES = ['en', 'ar', 'de'];
const STAMP = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_DIR = `.backups/relink-${STAMP}`;

/** WordPress' edited-derivative suffix: blog-post-13-e1772931703989.jpg */
const EDITED = /-e\d{10,}(?=\.[a-z0-9]+$)/i;

/**
 * Stand-ins for files the media library does not have at all (--substitute).
 *
 * These are NOT the original photographs. They are interchangeable stock legal
 * photography standing in for interchangeable stock legal photography, which
 * is the only reason this is acceptable: nothing here carries meaning that the
 * replacement fails to carry.
 *
 * Mapped by filename rather than id so the same table works against a local or
 * staging CMS, where the ids differ.
 *
 * Chosen so no page repeats an image. The three pages that show a strip of six
 * (legal-consultations, our-unwavering-principles, why-choose-fakherco) each
 * relink blog-post-12 and blog-post-05 and take the four below, so all six
 * remain distinct. about-us relinks four and takes three others.
 *
 * DELIBERATELY ABSENT — do not add without asking:
 *   Fakher-Logo-new.png  the logo; it is not filler.
 *   img-about-me.png     a portrait of a named person, not stock.
 *   img-map-cover.png    a MAP, on the contact page, immediately above the
 *                        enquiry form. A photograph of strangers shaking hands
 *                        does not stand in for directions to an office.
 *   img-experience-*.png a bespoke graphic on the homepage, not a photograph.
 */
const SUBSTITUTIONS = {
  'blog-post-23.jpg': 'business-and-lawyers-discussing-contract-papers-wi-2025-12-22-14-21-12-utc-scaled.jpg',
  'blog-post-18.jpg': 'group-business-people-and-lawyers-legal-contract-2025-03-08-13-26-33-utc-scaled.jpg',
  'blog-post-14-e1772931697417.jpg': 'close-up-photo-of-business-woman-and-man-signing-a-2025-04-10-00-26-29-utc-scaled.jpg',
  'blog-post-14.jpg': 'close-up-photo-of-business-woman-and-man-signing-a-2025-04-10-00-26-29-utc-scaled.jpg',
  'blog-post-15-e1772931709523.jpg': 'business-team-in-dubai-2025-03-18-15-08-40-utc-scaled.jpg',
  'blog-post-26.jpg': 'business-team-in-dubai-2025-03-18-15-08-40-utc-scaled.jpg',
  'blog-post-06.jpg': 'hand-man-stamping-documents-notary-public-in-offic-2025-03-09-13-11-43-utc-scaled.jpg',
};

/*
  A bad token is worse than no token, and silently so.

  Reads here work unauthenticated — the public role has find/findOne. Send an
  Authorization header with a typo in it and Strapi 401s EVERYTHING, including
  those reads, so the scan finds no pages, reports "0 blocks to relink" and
  exits 0. That reads as "nothing is broken" when it means "I could not look".
  Any 401/403 anywhere is therefore fatal, not a skipped row.
*/
let authFailed = false;

async function cms(path, opts = {}) {
  const res = await fetch(`${CMS}/api/${path}`, {
    ...opts,
    headers: {
      'content-type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  if (res.status === 401 || res.status === 403) authFailed = true;
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* leave null; the caller reports res.status */
  }
  return { status: res.status, ok: res.ok, body };
}

/* ------------------------------------------------------------------ library */

/**
 * Every ORIGINAL in the media library, by filename.
 *
 * Strapi's `formats` derivatives (small_, medium_, thumbnail_) are deliberately
 * skipped: they have no id of their own and attaching one is not possible.
 * Walks whatever the content API returns rather than /api/upload/files, which
 * needs a token the public role does not have.
 */
function collectFiles(node, into) {
  if (Array.isArray(node)) {
    for (const v of node) collectFiles(v, into);
  } else if (node && typeof node === 'object') {
    if (typeof node.url === 'string' && node.url.startsWith('/uploads/') && node.name && node.id != null) {
      into.set(node.name, { id: node.id, url: node.url, width: node.width, height: node.height });
    }
    for (const v of Object.values(node)) collectFiles(v, into);
  }
}

async function mediaLibrary() {
  const lib = new Map();
  const types = [
    'pages', 'posts', 'case-studies', 'practice-areas',
    'landing-pages', 'homepage', 'site-setting',
  ];
  /*
    BOTH populates, always, and merged.

    Not one-with-a-fallback: `populate[blocks][populate]=*` returns 200 and an
    empty media set for any type that has no `blocks` field at all — which is
    most of them — so a fallback keyed on !r.ok never fires and those types
    contribute nothing. That silently shrinks the library, and a shrunken
    library shows up as a file listed "STILL BROKEN" when it was uploaded all
    along.
  */
  for (const t of types) {
    for (const locale of LOCALES) {
      const base = `${t}?pagination[pageSize]=100&locale=${locale}`;
      for (const populate of ['populate[blocks][populate]=*', 'populate=*']) {
        const r = await cms(`${base}&${populate}`);
        if (r.ok) collectFiles(r.body?.data ?? [], lib);
      }
    }
  }
  return lib;
}

/* -------------------------------------------------------------------- scan */

/** Image-bearing components inside one entry, flattened. */
function imageComponents(blocks) {
  const out = [];
  for (const b of blocks ?? []) {
    if (b && typeof b === 'object') {
      out.push({ component: b, parent: null });
      for (const i of b.items ?? []) if (i && typeof i === 'object') out.push({ component: i, parent: b });
    }
  }
  return out;
}

function matchFor(legacySrc, lib) {
  const base = decodeURIComponent(legacySrc.split('/').pop() ?? '');
  const exact = lib.get(base);
  if (exact) return { file: exact, base, kind: 'exact' };
  if (EDITED.test(base)) {
    const stripped = base.replace(EDITED, '');
    const f = lib.get(stripped);
    if (f) return { file: f, base, kind: 'edited', via: stripped };
  }
  const sub = SUBSTITUTIONS[base];
  if (sub) {
    const f = lib.get(sub);
    if (f) return { file: f, base, kind: 'substitute', via: sub };
  }
  return null;
}

async function scan(lib) {
  const entries = [];
  for (const locale of LOCALES) {
    const q = `pagination[pageSize]=100&locale=${locale}&populate[blocks][populate]=*`;
    const r = await cms(`pages?${q}`);
    if (!r.ok) {
      console.error(`  ! pages(${locale}): HTTP ${r.status}`);
      continue;
    }
    for (const row of r.body?.data ?? []) {
      const fixes = [];
      const unfixable = [];
      for (const { component } of imageComponents(row.blocks)) {
        if (!component.legacySrc || component.file) continue;
        const m = matchFor(String(component.legacySrc), lib);
        if (!m) {
          unfixable.push(String(component.legacySrc).split('/').pop());
        } else if (m.kind === 'edited' && !INCLUDE_EDITED) {
          unfixable.push(`${m.base}  (edited derivative — --include-edited to use ${m.via})`);
        } else if (m.kind === 'substitute' && !SUBSTITUTE) {
          unfixable.push(`${m.base}  (--substitute would stand in ${m.via})`);
        } else {
          fixes.push({ componentId: component.id, base: m.base, file: m.file, kind: m.kind, via: m.via });
        }
      }
      if (fixes.length || unfixable.length) {
        entries.push({ locale, slug: row.slug, documentId: row.documentId, row, fixes, unfixable });
      }
    }
  }
  return entries;
}

/* ------------------------------------------------------------------- write */

/**
 * The blocks array to send back: everything exactly as fetched, with `file`
 * set on the components being fixed. Relations are reduced to ids because
 * Strapi rejects the expanded object on write.
 */
function buildBlocks(row, fixes) {
  const byId = new Map(fixes.map((f) => [f.componentId, f.file.id]));
  const convert = (c) => {
    const out = {};
    for (const [k, v] of Object.entries(c)) {
      if (k === 'documentId') continue;
      if (k === 'file') out.file = v?.id ?? v ?? null;
      else if (k === 'items' && Array.isArray(v)) out.items = v.map(convert);
      else out[k] = v;
    }
    if (byId.has(c.id)) out.file = byId.get(c.id);
    return out;
  };
  return (row.blocks ?? []).map(convert);
}

/** Scalar shape of an entry's blocks, for before/after comparison. */
function fingerprint(blocks) {
  const strip = (c) => {
    const o = {};
    for (const [k, v] of Object.entries(c ?? {})) {
      if (k === 'file') o.file = v?.id ?? v ?? null;
      else if (k === 'items' && Array.isArray(v)) o.items = v.map(strip);
      else if (v === null || ['string', 'number', 'boolean'].includes(typeof v)) o[k] = v;
    }
    return o;
  };
  return JSON.stringify((blocks ?? []).map(strip));
}

/** Every difference between two fingerprints, as dotted paths. */
function diffPaths(a, b, path = '', out = []) {
  if (JSON.stringify(a) === JSON.stringify(b)) return out;
  if (a && b && typeof a === 'object' && typeof b === 'object' && Array.isArray(a) === Array.isArray(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      diffPaths(a?.[k], b?.[k], path ? `${path}.${k}` : k, out);
    }
    return out;
  }
  out.push(`${path}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`);
  return out;
}

async function applyEntry(entry) {
  const { locale, slug, documentId, row, fixes } = entry;

  mkdirSync(BACKUP_DIR, { recursive: true });
  writeFileSync(`${BACKUP_DIR}/${locale}-${slug}.json`, JSON.stringify(row, null, 2));

  const blocks = buildBlocks(row, fixes);

  // Guard 2: nothing but `file` may differ from what we read.
  const intended = new Set(fixes.map((f) => f.componentId));
  const changes = diffPaths(JSON.parse(fingerprint(row.blocks)), JSON.parse(fingerprint(blocks)));
  const unexpected = changes.filter((c) => !/\.file:/.test(c) && !/^\d+\.file:/.test(c));
  if (unexpected.length) {
    return { ok: false, reason: `payload would change more than file:\n      ${unexpected.join('\n      ')}` };
  }
  if (changes.length !== intended.size) {
    return { ok: false, reason: `expected ${intended.size} file change(s), payload has ${changes.length}` };
  }

  const put = await cms(`pages/${documentId}?locale=${locale}`, {
    method: 'PUT',
    body: JSON.stringify({ data: { blocks } }),
  });
  if (!put.ok) {
    return { ok: false, reason: `HTTP ${put.status} ${JSON.stringify(put.body?.error ?? put.body ?? '').slice(0, 200)}` };
  }

  // Guard 3: read it back and compare.
  const after = await cms(`pages/${documentId}?locale=${locale}&status=draft&populate[blocks][populate]=*`);
  if (!after.ok) return { ok: false, reason: `wrote, but re-fetch failed: HTTP ${after.status}` };
  const got = fingerprint(after.body?.data?.blocks);
  if (got !== fingerprint(blocks)) {
    return {
      ok: false,
      reason: 'read-back does not match what was sent — restore from ' + `${BACKUP_DIR}/${locale}-${slug}.json`,
      corrupted: true,
      drift: diffPaths(JSON.parse(fingerprint(blocks)), JSON.parse(got)).slice(0, 6),
    };
  }
  return { ok: true, count: fixes.length };
}

/* -------------------------------------------------------------------- main */

async function main() {
  console.log(`cms:  ${CMS}`);
  console.log(`mode: ${APPLY ? 'APPLY (writes drafts)' : 'dry run'}`);
  console.log(`edited derivatives: ${INCLUDE_EDITED ? 'included' : 'skipped (--include-edited)'}`);
  console.log(`substitutes:        ${SUBSTITUTE ? 'INCLUDED — different photographs' : 'skipped (--substitute)'}\n`);

  const lib = await mediaLibrary();
  if (authFailed) {
    console.error(
      '\nHTTP 401/403 while reading the CMS.\n' +
        (TOKEN
          ? '  The token was rejected. Reads work WITHOUT a token here, so a bad\n' +
            '  one is strictly worse than none — check it, or drop it for a dry run.'
          : '  Public find/findOne is not granted on the CMS.'),
    );
    process.exit(1);
  }
  console.log(`media library: ${lib.size} original file(s)\n`);

  const entries = await scan(lib);
  if (authFailed) {
    console.error('\nHTTP 401/403 while scanning pages — refusing to report a partial picture.');
    process.exit(1);
  }
  const fixable = entries.filter((e) => e.fixes.length);
  const totalFixes = fixable.reduce((n, e) => n + e.fixes.length, 0);
  const stillBroken = new Map();
  for (const e of entries) for (const u of e.unfixable) stillBroken.set(u, (stillBroken.get(u) ?? 0) + 1);

  console.log(`WILL RELINK — ${totalFixes} block(s) across ${fixable.length} entr(ies):`);
  for (const e of fixable) {
    console.log(`  [${e.locale}] /${e.slug}`);
    for (const f of e.fixes) {
      const note =
        f.kind === 'substitute' ? `  [SUBSTITUTE -> ${f.via}]`
        : f.kind === 'edited' ? `  [edited derivative -> ${f.via}]`
        : '';
      console.log(`      block ${f.componentId}  ${f.base}  ->  file ${f.file.id} (${f.file.width}x${f.file.height})${note}`);
    }
  }

  if (stillBroken.size) {
    console.log(`\nSTILL BROKEN — no file of that name in the library:`);
    for (const [name, n] of [...stillBroken].sort((a, b) => b[1] - a[1])) {
      console.log(`  x${n}  ${name}`);
    }
    console.log('\n  Recover these from the cPanel box (its cert expires 2026-09-18)');
    console.log('  and upload them to Strapi, or choose substitutes by hand.');
  }

  if (!APPLY) {
    console.log(`\nDry run — nothing written. Re-run with --apply (add --limit 1 to canary).`);
    return;
  }
  if (!TOKEN) {
    console.error('\nSTRAPI_API_TOKEN is empty. A write-capable token is required.');
    process.exit(1);
  }

  console.log(`\nbackups: ${BACKUP_DIR}\n`);
  let done = 0;
  let written = 0;
  for (const e of fixable) {
    if (done >= LIMIT) {
      console.log(`\nstopped at --limit ${LIMIT}.`);
      break;
    }
    const r = await applyEntry(e);
    done += 1;
    if (r.ok) {
      written += r.count;
      console.log(`  ok    [${e.locale}] /${e.slug} — ${r.count} block(s)`);
    } else {
      console.error(`  FAIL  [${e.locale}] /${e.slug} — ${r.reason}`);
      if (r.drift) for (const d of r.drift) console.error(`          ${d}`);
      console.error('\nStopping. Nothing further will be written.');
      process.exit(1);
    }
  }

  if (!written) {
    console.log('\nNothing to relink.');
    return;
  }
  console.log(`\n${written} block(s) relinked in ${done} entr(ies), as DRAFTS.`);
  console.log('Publish them in the Strapi admin to put them live.');
  console.log(`Backups of the previous state: ${BACKUP_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
