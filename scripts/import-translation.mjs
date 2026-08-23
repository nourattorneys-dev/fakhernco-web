#!/usr/bin/env node
/**
 * Create a missing locale for a page from content/translations/<locale>/<slug>.json.
 *
 *   node scripts/import-translation.mjs                    # dry run, all files
 *   node scripts/import-translation.mjs --apply --token=…  # write
 *   node scripts/import-translation.mjs --slug=about-us    # just one
 *
 * WHY THIS EXISTS
 *
 * /ar/about-us and /ar/legal-consultations are 404s: 49 slugs have an Arabic
 * localisation and those two do not.
 *
 * Neither is linked from anywhere — getNavPaths builds from CMS content, so the
 * Arabic header omits them, and getTranslatedPaths keeps the switcher from
 * offering a locale that is not there. Both sets behave as designed. What it
 * costs is quieter: an Arabic reader on the English /about-us is offered no
 * Arabic, and the URLs 404 if reached directly.
 *
 * HOW IT WORKS
 *
 * The translation files hold TEXT ONLY, keyed by block index. Structure is
 * taken live from the English entry at run time and cloned — so images, block
 * order, list shape and button hrefs cannot drift out of sync with English,
 * and a translator never has to touch a media relation.
 *
 * That coupling is also the risk: if someone inserts a block into the English
 * page, every index after it shifts. Hence the guards.
 *
 *   1. component type is asserted per index before anything is written;
 *   2. every text-bearing block must have a translation — an untranslated one
 *      is an ERROR, not a silent pass-through, because the failure mode is
 *      English prose sitting on an Arabic page under an RTL layout;
 *   3. nothing is written without --apply.
 *
 * Strapi 5 creates a localisation with PUT /api/pages/:documentId?locale=ar.
 * It lands as a DRAFT — publish in the admin after a native speaker has read
 * it. THE ARABIC HERE IS MACHINE-ASSISTED AND HAS NOT BEEN REVIEWED. It is a
 * starting point for a reviewer, not publishable copy. CLAUDE.md already holds
 * the same caveat for German.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';

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
const ONLY = val('--slug');
const LOCALE = val('--locale') ?? 'ar';
const TOKEN = val('--token') ?? process.env.STRAPI_API_TOKEN ?? '';
const DIR = `content/translations/${LOCALE}`;

/** Which field carries prose, per component. Anything absent here is structural. */
const TEXT_FIELDS = {
  'blocks.heading': ['text'],
  'blocks.paragraph': ['html'],
  'blocks.button': ['text'],
  'blocks.quote': ['html', 'attribution'],
  'blocks.list': ['items'],
  'blocks.cards': ['items'],
  'blocks.data-table': ['headers', 'rows'],
  'blocks.faq': ['items'],
};

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
    /* status is enough for the caller */
  }
  return { status: res.status, ok: res.ok, body };
}

/** Relations expanded on read must go back as ids, and ids must be dropped. */
function forWrite(c) {
  const out = {};
  for (const [k, v] of Object.entries(c)) {
    if (k === 'documentId') continue;
    if (k === 'file') out.file = v?.id ?? v ?? null;
    else if (k === 'items' && Array.isArray(v)) out.items = v.map(forWrite);
    else out[k] = v;
  }
  return out;
}

async function run(file) {
  const spec = JSON.parse(readFileSync(`${DIR}/${file}`, 'utf8'));
  const { slug } = spec;
  const src = spec.sourceLocale ?? 'en';

  const q = `filters[slug][$eq]=${encodeURIComponent(slug)}&locale=${src}&populate[blocks][populate]=*`;
  const r = await cms(`pages?${q}`);
  if (!r.ok) return { slug, error: `source fetch HTTP ${r.status}` };
  const row = (r.body?.data ?? [])[0];
  if (!row) return { slug, error: `no ${src} entry for "${slug}"` };

  const existing = await cms(`pages?filters[slug][$eq]=${encodeURIComponent(slug)}&locale=${LOCALE}`);
  const alreadyThere = (existing.body?.data ?? []).length > 0;

  const blocks = [];
  const problems = [];
  let translated = 0;

  (row.blocks ?? []).forEach((b, i) => {
    const t = spec.blocks[String(i)];
    const fields = TEXT_FIELDS[b.__component];
    const out = forWrite(b);

    if (!fields) {
      // structural (image, gallery) — cloned verbatim, nothing to translate
      blocks.push(out);
      return;
    }
    if (!t) {
      problems.push(`block ${i} (${b.__component}) carries text but has no translation`);
      blocks.push(out);
      return;
    }
    if (t.__component && t.__component !== b.__component) {
      problems.push(`block ${i}: translation expects ${t.__component}, English has ${b.__component}`);
      return;
    }
    if (Array.isArray(t.items)) {
      const src = b.items ?? [];
      if (src.length !== t.items.length) {
        problems.push(`block ${i}: English has ${src.length} list items, translation has ${t.items.length}`);
      }
      out.items = src.map((it, j) => ({ ...forWrite(it), text: t.items[j] ?? it.text }));
    }
    for (const f of ['text', 'html', 'attribution']) if (t[f] != null) out[f] = t[f];
    translated += 1;
    blocks.push(out);
  });

  return {
    slug,
    alreadyThere,
    documentId: row.documentId,
    title: spec.title ?? row.title,
    blocks,
    translated,
    total: (row.blocks ?? []).length,
    problems,
  };
}

async function main() {
  console.log(`cms:    ${CMS}`);
  console.log(`locale: ${LOCALE}`);
  console.log(`mode:   ${APPLY ? 'APPLY (writes a draft)' : 'dry run'}\n`);

  if (!existsSync(DIR)) {
    console.error(`no ${DIR}/`);
    process.exit(1);
  }
  const files = readdirSync(DIR)
    .filter((f) => f.endsWith('.json'))
    .filter((f) => !ONLY || f === `${ONLY}.json`);
  if (!files.length) {
    console.error('nothing to import');
    process.exit(1);
  }

  const plans = [];
  for (const f of files) plans.push(await run(f));

  if (authFailed) {
    console.error(
      '\nHTTP 401/403 reading the CMS. Reads work WITHOUT a token here, so a\n' +
        'bad token is worse than none — check it, or drop it for a dry run.',
    );
    process.exit(1);
  }

  let blocked = 0;
  for (const p of plans) {
    if (p.error) {
      console.error(`  ✗ ${p.slug}: ${p.error}`);
      blocked += 1;
      continue;
    }
    const state = p.alreadyThere ? `OVERWRITES the existing ${LOCALE} entry` : `creates ${LOCALE}`;
    console.log(`  ${p.slug}  —  ${p.translated}/${p.total} blocks translated, ${state}`);
    console.log(`      title: ${p.title}`);
    for (const w of p.problems) console.log(`      ! ${w}`);
    if (p.problems.length) blocked += 1;
  }

  if (blocked) {
    console.error(
      `\n${blocked} page(s) blocked. Untranslated text would ship English prose onto` +
        `\nan RTL page, so this is refused rather than warned about.`,
    );
    process.exit(1);
  }
  if (!APPLY) {
    console.log('\nDry run — nothing written. Re-run with --apply and a write token.');
    return;
  }
  if (!TOKEN) {
    console.error('\nSTRAPI_API_TOKEN is empty; a write-capable token is required.');
    process.exit(1);
  }

  for (const p of plans) {
    const res = await cms(`pages/${p.documentId}?locale=${LOCALE}`, {
      method: 'PUT',
      body: JSON.stringify({ data: { title: p.title, blocks: p.blocks } }),
    });
    if (!res.ok) {
      console.error(`  FAIL ${p.slug}: HTTP ${res.status} ${JSON.stringify(res.body?.error ?? '').slice(0, 200)}`);
      process.exit(1);
    }
    console.log(`  ok   ${p.slug} → /${LOCALE}/${p.slug} (draft)`);
  }
  console.log('\nWritten as DRAFTS. Have a native speaker read them, then publish in the admin.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
