#!/usr/bin/env node
/**
 * Internal link audit. Crawls the built site and reports:
 *
 *   1. ORPHANS      — pages in the sitemap that nothing links to
 *   2. BROKEN       — internal links that 404 or 410
 *   3. REDIRECTED   — internal links that hit a 301 instead of the target
 *
 *   npm run verify:links
 *   SITE=https://fakhernco.com npm run verify:links
 *
 * WHY
 * ---
 * /why-choose-fakherco/ imported perfectly and had ZERO inbound links — it
 * existed, returned 200, and was unreachable. Nothing in the build, the SEO
 * gate or the CMS preflight catches that, because every one of them checks
 * pages in isolation.
 *
 * The second and third checks matter because imported WordPress bodies carry
 * absolute fakhernco.com links written years ago. On a sibling migration a
 * scan of ~2,400 articles found 42 distinct in-content paths pointing at hub
 * pages that were never built — invisible until someone clicked.
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

const SITE = (process.env.SITE ?? 'http://localhost:3000').replace(/\/$/, '');
const CONCURRENCY = 8;

/** Chrome that appears on every page — links here are not "inbound" in any
 *  meaningful sense, but they DO make a page reachable, so they count. */
const get = async (url, method = 'GET') => {
  const res = await fetch(url, { method, redirect: 'manual' });
  return { status: res.status, location: res.headers.get('location'), html: method === 'GET' ? await res.text() : '' };
};

async function mapLimit(items, limit, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (i < items.length) {
        const index = i++;
        out[index] = await fn(items[index], index);
      }
    }),
  );
  return out;
}

const normalise = (href) => {
  if (!href) return null;
  let p = href;
  if (p.startsWith('http')) {
    try {
      const u = new URL(p);
      if (!/^(localhost|127\.|fakhernco\.com|www\.fakhernco\.com)/.test(u.host)) return null;
      p = u.pathname;
    } catch {
      return null;
    }
  }
  if (!p.startsWith('/')) return null;
  p = p.split('#')[0].split('?')[0];
  return p.length > 1 ? p.replace(/\/$/, '') : '/';
};

async function main() {
  console.log(`site: ${SITE}\n`);

  // Every URL the site claims to have.
  const sitemap = await get(`${SITE}/sitemap.xml`);
  const urls = [...sitemap.html.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => normalise(m[1]))
    .filter(Boolean);
  const known = new Set(urls);
  console.log(`sitemap lists ${urls.length} URLs\n`);

  // Crawl each one and collect its outbound internal links.
  const inbound = new Map(urls.map((u) => [u, new Set()]));
  const outbound = new Map();

  await mapLimit(urls, CONCURRENCY, async (url) => {
    const res = await get(`${SITE}${url}`);
    if (res.status !== 200) return;
    const links = [
      ...new Set(
        [...res.html.matchAll(/<a\b[^>]*href="([^"]+)"/g)]
          .map((m) => normalise(m[1]))
          .filter(Boolean),
      ),
    ];
    outbound.set(url, links);
    for (const target of links) {
      if (!inbound.has(target)) inbound.set(target, new Set());
      inbound.get(target).add(url);
    }
  });

  // 1. Orphans.
  const orphans = urls.filter((u) => u !== '/' && (inbound.get(u)?.size ?? 0) === 0);

  // 2 + 3. Every distinct internal link target, checked once.
  const targets = [...new Set([...outbound.values()].flat())].filter((t) => !known.has(t));
  const statuses = await mapLimit(targets, CONCURRENCY, async (t) => ({
    target: t,
    ...(await get(`${SITE}${t}`, 'HEAD')),
  }));

  const broken = statuses.filter((s) => s.status === 404 || s.status === 410);
  const redirected = statuses.filter((s) => s.status === 301 || s.status === 308);

  const sourcesOf = (target) =>
    [...outbound.entries()].filter(([, links]) => links.includes(target)).map(([src]) => src);

  // ---- report ----
  console.log(`=== ORPHANS (${orphans.length}) ===`);
  if (!orphans.length) console.log('  none — every page has at least one inbound link');
  for (const o of orphans) console.log(`  ✗ ${o}`);

  console.log(`\n=== BROKEN INTERNAL LINKS (${broken.length}) ===`);
  if (!broken.length) console.log('  none');
  for (const b of broken) {
    console.log(`  ✗ ${b.target} (${b.status})`);
    for (const src of sourcesOf(b.target).slice(0, 4)) console.log(`      linked from ${src}`);
  }

  console.log(`\n=== LINKS THAT HIT A REDIRECT (${redirected.length}) ===`);
  if (!redirected.length) console.log('  none');
  for (const r of redirected) {
    console.log(`  ! ${r.target} -> ${normalise(r.location) ?? r.location}`);
    for (const src of sourcesOf(r.target).slice(0, 3)) console.log(`      linked from ${src}`);
  }

  const worst = [...inbound.entries()]
    .filter(([u]) => known.has(u) && u !== '/')
    .sort((a, b) => a[1].size - b[1].size)
    .slice(0, 5);
  console.log('\n=== FEWEST INBOUND LINKS ===');
  for (const [u, sources] of worst) console.log(`  ${String(sources.size).padStart(3)}  ${u}`);

  if (orphans.length || broken.length) {
    console.log(`\nFAIL — ${orphans.length} orphan(s), ${broken.length} broken link(s)`);
    process.exit(1);
  }
  console.log('\nPASS — no orphans, no broken internal links.');
}

main().catch((err) => {
  console.error('verify-links failed:', err.message);
  process.exit(1);
});
