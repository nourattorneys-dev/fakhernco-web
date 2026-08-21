/**
 * Thin server-side Strapi REST client.
 *
 * The only module that knows the CMS origin. Every fetch carries an explicit
 * revalidate window so pages are statically generated and refreshed on a
 * timer rather than re-fetched per request.
 */

/*
  Trimmed and de-slashed, because both failures are invisible.

  A trailing SPACE does not break the API calls — `new URL('/api/...', BASE)`
  tolerates it — it breaks every IMAGE, because mediaUrl() below concatenates
  rather than parses. The symptom is a site whose text is perfect and whose
  every photograph is missing, and the cause is one character in an env var.
  A trailing SLASH is the same story via `${BASE}/uploads/...`.
*/
const BASE = (process.env.STRAPI_URL ?? 'http://localhost:1337').trim().replace(/\/$/, '');
const TOKEN = process.env.STRAPI_API_TOKEN;

/*
  Integer seconds only.

  `300s`, `5m` or `5 minutes` make Number() NaN, which Next's fetch validator
  rejects — and it throws naming the ROUTE that was rendering, not this
  variable, so the trail leads nowhere near the cause. An empty string coerces
  to 0, which is worse than wrong: it silently disables ISR and turns every
  build into a full uncached crawl of a 2GB CMS.
*/
const parsedRevalidate = Number(process.env.STRAPI_REVALIDATE);
export const REVALIDATE =
  process.env.STRAPI_REVALIDATE?.trim() &&
  Number.isFinite(parsedRevalidate) &&
  parsedRevalidate > 0
    ? parsedRevalidate
    : 300;

export class StrapiError extends Error {
  constructor(readonly status: number, path: string) {
    super(`Strapi ${status} for ${path}`);
    this.name = 'StrapiError';
  }
}

/**
 * Absolute URL for a media file.
 *
 * Strapi returns origin-relative `/uploads/...` paths. If PUBLIC_URL is unset
 * on the CMS it emits `localhost:1337` instead, which is why images 404 in
 * production — the cause is a CMS env var, not this function.
 */
export function mediaUrl(url?: string | null): string | null {
  if (!url) return null;
  return /^https?:\/\//.test(url) ? url : `${BASE}${url}`;
}

/**
 * How long "which pages exist, in which locale" stays fresh: 30 minutes,
 * against 300s for page content.
 *
 * The language switcher is built from this, and every revalidation is another
 * chance for a CMS hiccup to produce a page with no switcher on it — which is
 * then cached until something regenerates it. That has happened repeatedly, and
 * always on the homepage, because it is requested most and so revalidates most.
 * Six times fewer regenerations is six times less exposure.
 *
 * The cost is bounded and small: a newly translated page can take up to half an
 * hour to start being OFFERED by the switcher. The page itself is reachable
 * immediately, and its content still follows the 300s window — only the "does a
 * translation exist" answer lags.
 *
 * Tagging these queries and purging on publish would remove even that lag.
 * Next 16's revalidateTag now requires a cache-life profile, which ties it to
 * the `use cache` model this app does not use, and it was not worth shipping a
 * cache-invalidation path that could not be verified from outside. Revisit if
 * the lag ever actually bites.
 */
export const STRUCTURE_REVALIDATE = Number(process.env.STRAPI_STRUCTURE_REVALIDATE ?? 1800);

type FetchOpts = { revalidate?: number; tags?: string[] };

export async function strapiFetch<T>(
  path: string,
  params: Record<string, string | number> = {},
  opts: FetchOpts = {},
): Promise<T> {
  const url = new URL(`/api/${path}`, BASE);
  // Strapi's bracket syntax is passed through verbatim — no qs dependency.
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const res = await fetch(url, {
    headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
    next: {
      revalidate: opts.revalidate ?? REVALIDATE,
      ...(opts.tags ? { tags: opts.tags } : {}),
    },
  });

  if (!res.ok) throw new StrapiError(res.status, url.pathname + url.search);
  return res.json() as Promise<T>;
}

/** Walk every page of a collection. Strapi caps page size, so this matters. */
export async function strapiFetchAll<T>(
  path: string,
  params: Record<string, string | number> = {},
  pageSize = 100,
  opts: FetchOpts = {},
): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; ; page += 1) {
    const res = await strapiFetch<{
      data: T[];
      meta?: { pagination?: { pageCount?: number } };
    }>(
      path,
      { ...params, 'pagination[page]': page, 'pagination[pageSize]': pageSize },
      opts,
    );

    out.push(...(res.data ?? []));
    const pageCount = res.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) break;
  }
  return out;
}
