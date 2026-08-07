#!/usr/bin/env node
/**
 * SEO release gate. Crawls a running build and fails on regressions.
 *
 *   npm run verify:seo                    # against localhost:3000
 *   SITE=https://fakhernco.com npm run verify:seo
 *
 * Dependency-free on purpose: this has to run in CI without an install step.
 *
 * The stale-build check is the reason this exists. Next persists its fetch
 * cache in .next, so a build run straight after a CMS change bakes in the old
 * content while Strapi already has the new. It looks like the change simply
 * did not apply. It has caught this project twice; `npm run build:fresh`
 * clears the cache, and this check proves it worked.
 */

import { readFileSync, existsSync } from 'node:fs';

/** Minimal .env loader — no dotenv dependency. */
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

const SITE = (process.env.SITE ?? 'http://localhost:3000').replace(/\/$/, '');
const CMS = (process.env.STRAPI_URL ?? 'http://localhost:1337').replace(/\/$/, '');

const failures = [];
const warnings = [];
const fail = (url, msg) => failures.push(`${url} — ${msg}`);
const warn = (url, msg) => warnings.push(`${url} — ${msg}`);

const get = async (url) => {
  const res = await fetch(url, { headers: { 'User-Agent': 'fakhernco-seo-check' } });
  return { status: res.status, html: await res.text(), headers: res.headers };
};

const tag = (html, re) => (html.match(re) ?? [])[1]?.trim();
const count = (html, re) => (html.match(re) ?? []).length;
const decode = (s = '') =>
  s.replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n));

async function cms(path, params = {}) {
  const url = new URL(`/api/${path}`, CMS);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CMS ${res.status} for ${path}`);
  return res.json();
}

/** Per-page checks. */
async function checkPage(path, { expectTitle } = {}) {
  const url = `${SITE}${path}`;
  const { status, html } = await get(url);

  if (status !== 200) return fail(path, `HTTP ${status}`);

  const title = decode(tag(html, /<title>([^<]*)<\/title>/));
  const desc = tag(html, /<meta name="description" content="([^"]*)"/);
  const canonical = tag(html, /<link rel="canonical" href="([^"]*)"/);
  const h1s = count(html, /<h1[\s>]/g);
  const og = tag(html, /<meta property="og:title" content="([^"]*)"/);

  if (!title) fail(path, 'missing <title>');
  else if (title.length > 70) warn(path, `title is ${title.length} chars`);

  if (!desc) fail(path, 'missing meta description');
  else if (desc.length > 165) warn(path, `description is ${desc.length} chars`);

  if (!canonical) fail(path, 'missing canonical');
  if (!og) warn(path, 'missing og:title');

  // Exactly one H1. The WordPress site has 222 stray H1 blocks across 49
  // documents; the whole point of the template owning the H1 is that this
  // can never regress.
  if (h1s !== 1) fail(path, `${h1s} <h1> elements, expected exactly 1`);

  // Alt text must never be a URL — WordPress fills the field with the src.
  const urlAlts = count(html, /alt="https?:\/\//g);
  if (urlAlts) fail(path, `${urlAlts} image(s) with a URL as alt text`);

  // The stale-build detector.
  if (expectTitle && title && !title.startsWith(expectTitle)) {
    fail(path, `title is "${title}" but the CMS says "${expectTitle}" — STALE BUILD, run build:fresh`);
  }

  return { title, desc, canonical, h1s };
}

async function main() {
  console.log(`site: ${SITE}\ncms:  ${CMS}\n`);

  // 1. Hubs.
  const hubs = ['/', '/services', '/contact-us', '/legal-insights'];
  for (const path of hubs) await checkPage(path);

  // 2. A sample of real content, with titles compared against the CMS so a
  //    stale build cannot pass.
  //
  //    Compare against seo.metaTitle where one exists, NOT the bare title.
  //    Yoast metaTitles legitimately differ from the page title — the first
  //    run of this check flagged every such page as a stale build.
  const q = {
    'fields[0]': 'slug',
    'fields[1]': 'title',
    'populate[seo][fields][0]': 'metaTitle',
    'pagination[pageSize]': '5',
  };
  const [pages, posts] = await Promise.all([cms('pages', q), cms('posts', q)]);
  for (const row of [...pages.data, ...posts.data]) {
    if (row.slug === 'home') continue;
    await checkPage(`/${row.slug}`, { expectTitle: row.seo?.metaTitle || row.title });
  }

  // 3. A URL that should not exist must be a real 404, not a 200 shell.
  const missing = await get(`${SITE}/definitely-not-a-real-page-9f3a`);
  if (missing.status !== 404) {
    fail('/definitely-not-a-real-page-9f3a', `HTTP ${missing.status}, expected 404 (soft 404)`);
  }

  // 4. Machine-readable endpoints.
  for (const [path, must] of [
    ['/sitemap.xml', '<urlset'],
    ['/robots.txt', 'Sitemap:'],
    ['/rss.xml', '<rss'],
  ]) {
    const res = await get(`${SITE}${path}`);
    if (res.status !== 200) fail(path, `HTTP ${res.status}`);
    else if (!res.html.includes(must)) fail(path, `does not look like ${path} (missing "${must}")`);
  }

  // 5. Redirects must resolve, not chain and not 404.
  const rules = JSON.parse(readFileSync('src/lib/redirects.json', 'utf8'));
  for (const rule of rules) {
    const res = await fetch(`${SITE}${rule.source}`, { redirect: 'manual' });
    if (rule.status === 410) {
      if (res.status !== 410) fail(rule.source, `expected 410, got ${res.status}`);
      continue;
    }
    if (res.status !== 301 && res.status !== 308) {
      fail(rule.source, `expected 301, got ${res.status}`);
      continue;
    }
    const target = await get(`${SITE}${rule.destination}`);
    if (target.status !== 200) {
      fail(rule.source, `redirects to ${rule.destination}, which returns ${target.status}`);
    }
  }

  /*
    ---- bilingual wiring ----

    Every en/ar pair must point at each other and canonicalise to itself.

    Both halves of this have already been shipped broken once. alternatesFor()
    returned the English URL as the canonical for EVERY caller, which was
    invisible while only English routes used it and silently told Google the
    Arabic homepage was a duplicate of the English one the moment /ar existed.
    And /contact-us and /services set a bare canonical with no languages, so
    they never declared their Arabic siblings at all.

    ONE TRAP, worth stating because a hand-rolled version of this check passed
    when it should not have: the language switcher renders an <a hrefLang="ar">
    in the header of every English page. Matching hrefLang= anywhere in the
    document therefore finds "ar" on pages that emit no alternates whatsoever.
    The match below is anchored to <link rel="alternate"> for that reason.

    Second trap: "/articles-of-association-uae".startsWith("/ar") is true, so
    the Arabic test has to be an exact segment test.
  */
  const isAr = (u) => u === '/ar' || u.startsWith('/ar/');
  const sitemapXml = (await get(`${SITE}/sitemap.xml`)).html;
  const sitemapPaths = [
    ...new Set(
      [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname),
    ),
  ];
  const arPaths = new Set(sitemapPaths.filter(isAr));
  const enPaths = sitemapPaths.filter((u) => !isAr(u));

  const headOf = async (p) => {
    const { html } = await get(`${SITE}${p}`);
    return html.slice(0, html.indexOf('</head>'));
  };
  const alternatesOf = (head) =>
    Object.fromEntries(
      [...head.matchAll(/<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"\s*\/?>/g)].map(
        (m) => [m[1], new URL(m[2]).pathname],
      ),
    );
  const canonicalOf = (head) => {
    const m = head.match(/rel="canonical" href="([^"]+)"/);
    return m ? new URL(m[1]).pathname : null;
  };

  const localePairs = enPaths
    .map((en) => ({ en, ar: en === '/' ? '/ar' : `/ar${en}` }))
    .filter((p) => arPaths.has(p.ar));

  for (const { en, ar } of localePairs) {
    const [headEn, headAr] = [await headOf(en), await headOf(ar)];
    const [altEn, altAr] = [alternatesOf(headEn), alternatesOf(headAr)];

    if (altEn.ar !== ar) fail(en, `hreflang="ar" is ${altEn.ar ?? 'MISSING'}, expected ${ar}`);
    if (altAr['en-AE'] !== en)
      fail(ar, `hreflang="en-AE" is ${altAr['en-AE'] ?? 'MISSING'}, expected ${en}`);
    if (altEn['x-default'] !== en) fail(en, `x-default is ${altEn['x-default'] ?? 'MISSING'}`);
    if (altAr['x-default'] !== en) fail(ar, `x-default is ${altAr['x-default'] ?? 'MISSING'}`);

    if (canonicalOf(headEn) !== en) fail(en, `canonical points at ${canonicalOf(headEn)}`);
    if (canonicalOf(headAr) !== ar)
      fail(ar, `canonical points at ${canonicalOf(headAr)} — an Arabic page that canonicalises elsewhere will be dropped from the index`);
  }

  // An Arabic page missing from the sitemap is one Google must find by
  // crawling. The live WordPress site lists zero of them; regressing to that
  // is the specific thing this catches.
  const arInCms = await cms('pages', { locale: 'ar', 'fields[0]': 'slug', 'pagination[pageSize]': '200' });
  for (const row of arInCms.data ?? []) {
    const p = row.slug === 'home' ? '/ar' : `/ar/${row.slug}`;
    if (!arPaths.has(p)) fail(p, 'exists in the CMS but is absent from sitemap.xml');
  }

  // ---- report ----
  console.log(
    `checked ${hubs.length + pages.data.length + posts.data.length} pages, ` +
      `${rules.length} redirects, ${localePairs.length} en/ar pairs\n`,
  );
  if (warnings.length) {
    console.log(`${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  ! ${w}`);
    console.log();
  }
  if (failures.length) {
    console.log(`${failures.length} FAILURE(S):`);
    for (const f of failures) console.log(`  ✗ ${f}`);
    process.exit(1);
  }
  console.log('PASS — no SEO regressions.');
}

main().catch((err) => {
  console.error('verify-seo failed to run:', err.message);
  process.exit(1);
});
