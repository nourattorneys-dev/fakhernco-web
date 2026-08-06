/**
 * Thin server-side Strapi REST client.
 *
 * The only module that knows the CMS origin. Every fetch carries an explicit
 * revalidate window so pages are statically generated and refreshed on a
 * timer rather than re-fetched per request.
 */

const BASE = process.env.STRAPI_URL ?? 'http://localhost:1337';
const TOKEN = process.env.STRAPI_API_TOKEN;

export const REVALIDATE = Number(process.env.STRAPI_REVALIDATE ?? 300);

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

export async function strapiFetch<T>(
  path: string,
  params: Record<string, string | number> = {},
): Promise<T> {
  const url = new URL(`/api/${path}`, BASE);
  // Strapi's bracket syntax is passed through verbatim — no qs dependency.
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const res = await fetch(url, {
    headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
    next: { revalidate: REVALIDATE },
  });

  if (!res.ok) throw new StrapiError(res.status, url.pathname + url.search);
  return res.json() as Promise<T>;
}

/** Walk every page of a collection. Strapi caps page size, so this matters. */
export async function strapiFetchAll<T>(
  path: string,
  params: Record<string, string | number> = {},
  pageSize = 100,
): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; ; page += 1) {
    const res = await strapiFetch<{
      data: T[];
      meta?: { pagination?: { pageCount?: number } };
    }>(path, { ...params, 'pagination[page]': page, 'pagination[pageSize]': pageSize });

    out.push(...(res.data ?? []));
    const pageCount = res.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) break;
  }
  return out;
}
