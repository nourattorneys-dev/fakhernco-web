/**
 * The only module that knows Strapi's shape.
 *
 * Everything else in the app consumes the `Block` union and the Page/Post
 * types defined here. Adding a block type is a three-file change: the Strapi
 * component, `toBlock()` below, and BlockRenderer.
 */

import { cache } from 'react';
import { mediaUrl, strapiFetch, strapiFetchAll, STRUCTURE_REVALIDATE } from './strapi';
import { DEFAULT_LOCALE, LOCALES, pathIn, type Locale } from './locale';

// ------------------------------------------------------------------- types

export type Block =
  | { type: 'heading'; level: 2 | 3 | 4; text: string }
  | { type: 'paragraph'; html: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'faq'; items: { question: string; answer: string }[] }
  | { type: 'cards'; items: { title: string; text?: string | null; href?: string | null }[] }
  | { type: 'image'; src: string; alt: string }
  | { type: 'gallery'; items: { src: string; alt: string }[] }
  | { type: 'button'; text: string; href: string }
  | { type: 'quote'; html: string; attribution?: string | null };

export type Seo = {
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean | null;
};

export type Doc = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  legacyUrl?: string | null;
  excerpt?: string | null;
  summary?: string | null;
  publishedDate?: string | null;
  seo?: Seo | null;
  blocks: Block[];
  kind: 'page' | 'post' | 'case-study' | 'practice-area';
  categories?: { name: string; slug: string }[];
  practiceArea?: { title: string; slug: string } | null;
};

type StrapiComponent = Record<string, unknown> & { __component: string };

/**
 * Usable alt text, or a humanised filename.
 *
 * Alt text on the WordPress site is close to unusable: of 107 image blocks
 * only 5 carry meaningful text, 84 are empty, and 18 contain a raw image URL
 * (WordPress fills the field with the src when nothing was entered). Shipping
 * a URL as alt is worse than shipping nothing — a screen reader reads it out
 * character by character.
 *
 * The filename fallback is a floor, not a fix. Real alt text still needs to be
 * written; this just guarantees nothing user-hostile reaches the page.
 */
function altText(raw: string, src: string): string {
  const value = raw.trim();
  if (value && !/^https?:\/\//i.test(value)) return value;

  const file = decodeURIComponent(src.split('/').pop() ?? '');
  return file
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/-?\d{2,4}x\d{2,4}/gi, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ----------------------------------------------------------------- mapping

function toBlock(c: StrapiComponent): Block | null {
  switch (c.__component) {
    case 'blocks.heading': {
      const level = Number(c.level ?? 2);
      return { type: 'heading', level: (level >= 2 && level <= 4 ? level : 2) as 2 | 3 | 4, text: String(c.text ?? '') };
    }
    case 'blocks.paragraph':
      return { type: 'paragraph', html: String(c.html ?? '') };
    case 'blocks.list':
      return {
        type: 'list',
        ordered: Boolean(c.ordered),
        items: ((c.items ?? []) as { text?: string }[]).map((i) => String(i.text ?? '')).filter(Boolean),
      };
    case 'blocks.data-table':
      return {
        type: 'table',
        headers: (c.headers ?? []) as string[],
        rows: (c.rows ?? []) as string[][],
      };
    case 'blocks.faq':
      return {
        type: 'faq',
        items: ((c.items ?? []) as { question?: string; answer?: string }[])
          .map((i) => ({ question: String(i.question ?? ''), answer: String(i.answer ?? '') }))
          .filter((i) => i.question),
      };
    case 'blocks.cards':
      return {
        type: 'cards',
        items: ((c.items ?? []) as { title?: string; text?: string; href?: string }[])
          .map((i) => ({ title: String(i.title ?? ''), text: i.text ?? null, href: i.href ?? null }))
          .filter((i) => i.title),
      };
    case 'blocks.image': {
      // Prefer the migrated Strapi file; fall back to the legacy WordPress URL
      // so an unmigrated image still renders rather than disappearing.
      const file = c.file as { url?: string; alternativeText?: string } | null;
      const src = mediaUrl(file?.url) ?? (c.legacySrc ? String(c.legacySrc) : null);
      if (!src) return null;
      return {
        type: 'image',
        src,
        alt: altText(String(c.alt ?? file?.alternativeText ?? ''), String(c.legacySrc ?? src)),
      };
    }
    case 'blocks.gallery': {
      const items = ((c.items ?? []) as any[])
        .map((i) => {
          const file = i.file as { url?: string; alternativeText?: string } | null;
          const src = mediaUrl(file?.url) ?? (i.legacySrc ? String(i.legacySrc) : null);
          return src
            ? { src, alt: altText(String(i.alt ?? file?.alternativeText ?? ''), String(i.legacySrc ?? src)) }
            : null;
        })
        .filter(Boolean) as { src: string; alt: string }[];
      return items.length ? { type: 'gallery', items } : null;
    }
    case 'blocks.button':
      return { type: 'button', text: String(c.text ?? ''), href: String(c.href ?? '') };
    case 'blocks.quote':
      return { type: 'quote', html: String(c.html ?? ''), attribution: (c.attribution as string) ?? null };
    default:
      return null;
  }
}

const mapDoc = (raw: Record<string, any>, kind: Doc['kind']): Doc => ({
  id: raw.id,
  documentId: raw.documentId,
  title: raw.title ?? raw.name ?? '',
  slug: raw.slug,
  legacyUrl: raw.legacyUrl ?? null,
  excerpt: raw.excerpt ?? null,
  summary: raw.summary ?? null,
  publishedDate: raw.publishedDate ?? null,
  seo: raw.seo ?? null,
  kind,
  categories: (raw.categories ?? []).map((c: any) => ({ name: c.name, slug: c.slug })),
  practiceArea: raw.practiceArea ? { title: raw.practiceArea.title, slug: raw.practiceArea.slug } : null,
  blocks: ((raw.blocks ?? []) as StrapiComponent[]).map(toBlock).filter(Boolean) as Block[],
});

/**
 * Dynamic-zone population, per component.
 *
 * `populate[blocks][populate]=*` only reaches one level, so a gallery's items
 * come back with `file: null` and every carousel image silently disappears.
 * The `on` syntax lets each component declare its own depth — but note it is
 * exhaustive: a component missing from this map is not populated at all, so
 * adding a block type means adding a line here too.
 */
const BLOCK_COMPONENTS = [
  'blocks.heading',
  'blocks.paragraph',
  'blocks.list',
  'blocks.data-table',
  'blocks.faq',
  'blocks.cards',
  'blocks.image',
  'blocks.button',
  'blocks.quote',
] as const;

const POPULATE: Record<string, string> = {
  'populate[seo]': 'true',
  // Two levels deep: gallery -> items -> file.
  'populate[blocks][on][blocks.gallery][populate][items][populate]': '*',
  ...Object.fromEntries(
    BLOCK_COMPONENTS.map((c) => [`populate[blocks][on][${c}][populate]`, '*']),
  ),
};

// ------------------------------------------------------------------ queries

async function findBySlug(
  collection: string,
  slug: string,
  extra: Record<string, string> = {},
  locale = 'en',
) {
  const res = await strapiFetch<{ data: Record<string, any>[] }>(collection, {
    'filters[slug][$eq]': slug,
    locale,
    ...POPULATE,
    ...extra,
  });
  return res.data?.[0] ?? null;
}

export async function getPage(slug: string, locale = 'en'): Promise<Doc | null> {
  const raw = await findBySlug('pages', slug, { 'populate[practiceArea]': 'true' }, locale);
  return raw ? mapDoc(raw, 'page') : null;
}

export async function getPost(slug: string, locale = 'en'): Promise<Doc | null> {
  const raw = await findBySlug('posts', slug, { 'populate[categories]': 'true' }, locale);
  return raw ? mapDoc(raw, 'post') : null;
}

export async function getCaseStudy(slug: string, locale = 'en'): Promise<Doc | null> {
  const raw = await findBySlug('case-studies', slug, {}, locale);
  return raw ? mapDoc(raw, 'case-study') : null;
}

export async function getPracticeArea(slug: string, locale = 'en'): Promise<Doc | null> {
  const raw = await findBySlug('practice-areas', slug, {}, locale);
  return raw ? mapDoc(raw, 'practice-area') : null;
}

/**
 * Anything reachable at a root-level slug.
 *
 * Ordered by how likely each collection is to hold the answer, not
 * alphabetically: posts are 146 of the 211 English documents, pages 58,
 * practice areas 5, case studies 2. Probing practice areas first — as this did
 * — spent two guaranteed-miss round trips before reaching the collection that
 * holds two thirds of the content, on every one of ~300 prerendered routes and
 * on every on-demand 404. Frequency order takes the average from ~3 round
 * trips to ~1.4.
 *
 * Still sequential rather than parallel, deliberately: the CMS is a 2GB shared
 * box, and firing four queries to answer one lookup would triple its load to
 * save latency it can spare.
 *
 * The order IS the precedence rule, so it only stays behaviour-neutral while
 * slugs are unique across collections. That was verified — 165 slugs, zero
 * collisions — but it is a property of the content, not of the code. If two
 * collections ever share a slug, the winner is now the earlier line here.
 */
export async function getDocument(slug: string, locale = 'en'): Promise<Doc | null> {
  return (
    (await getPost(slug, locale)) ??
    (await getPage(slug, locale)) ??
    (await getPracticeArea(slug, locale)) ??
    (await getCaseStudy(slug, locale))
  );
}

export type Summary = { title: string; slug: string; excerpt?: string | null; date?: string | null };

const summarise = (raw: Record<string, any>): Summary => ({
  title: raw.title,
  slug: raw.slug,
  excerpt: raw.excerpt ?? raw.summary ?? raw.seo?.metaDescription ?? null,
  date: raw.publishedDate ?? null,
});

/** Light query for listings — never pulls block payloads. */
const LIGHT = {
  'fields[0]': 'title',
  'fields[1]': 'slug',
  'fields[2]': 'excerpt',
  'fields[3]': 'publishedDate',
  'populate[seo][fields][0]': 'metaDescription',
} as const;

export async function getPosts(locale = 'en'): Promise<Summary[]> {
  const rows = await strapiFetchAll<Record<string, any>>('posts', {
    ...LIGHT,
    locale,
    'sort[0]': 'publishedDate:desc',
  });
  return rows.map(summarise);
}

export async function getPracticeAreas(
  locale = 'en',
): Promise<(Summary & { children: Summary[] })[]> {
  const areas = await strapiFetchAll<Record<string, any>>('practice-areas', {
    locale,
    'fields[0]': 'title',
    'fields[1]': 'slug',
    'sort[0]': 'order:asc',
    'populate[pages][fields][0]': 'title',
    'populate[pages][fields][1]': 'slug',
  });
  return areas.map((a) => ({
    ...summarise(a),
    children: (a.pages ?? []).map(summarise),
  }));
}

export type Homepage = {
  heroEyebrow: string | null;
  heroTitle: string | null;
  heroText: string | null;
  heroImage: { src: string; alt: string } | null;
  sectionImages: { src: string; alt: string }[];
};

export type SiteSettings = {
  siteName: string;
  tagline: string | null;
  logo: { src: string; alt: string; width: number; height: number } | null;
  footerText: string | null;
  aboutLinks: { title: string; slug: string }[];
};

export async function getHomepage(locale = 'en'): Promise<Homepage | null> {
  const res = await strapiFetch<{ data: Record<string, any> | null }>('homepage', {
    locale,
    'populate[heroImage]': 'true',
    'populate[sectionImages]': 'true',
  });
  const d = res.data;
  if (!d) return null;
  const src = mediaUrl(d.heroImage?.url);
  return {
    heroEyebrow: d.heroEyebrow ?? null,
    heroTitle: d.heroTitle ?? null,
    heroText: d.heroText ?? null,
    heroImage: src ? { src, alt: d.heroImage?.alternativeText ?? '' } : null,
    sectionImages: ((d.sectionImages ?? []) as any[])
      .map((f) => {
        const url = mediaUrl(f?.url);
        return url ? { src: url, alt: f?.alternativeText ?? '' } : null;
      })
      .filter(Boolean) as { src: string; alt: string }[],
  };
}

export async function getSiteSettings(locale = 'en'): Promise<SiteSettings> {
  const res = await strapiFetch<{ data: Record<string, any> | null }>('site-setting', {
    locale,
    'populate[logo]': 'true',
  });
  const d = res.data ?? {};
  const src = mediaUrl(d.logo?.url);
  return {
    siteName: d.siteName ?? 'Fakher & Co',
    tagline: d.tagline ?? null,
    logo: src
      ? {
          src,
          alt: d.logo?.alternativeText || d.siteName || 'Fakher & Co',
          width: d.logo?.width ?? 640,
          height: d.logo?.height ?? 171,
        }
      : null,
    footerText: d.footerText ?? null,
    aboutLinks: Array.isArray(d.aboutLinks) ? d.aboutLinks : [],
  };
}

export type CategorySummary = { name: string; slug: string; count: number };

export async function getCaseStudies(locale = 'en'): Promise<Summary[]> {
  const rows = await strapiFetchAll<Record<string, any>>('case-studies', {
    locale,
    'fields[0]': 'title',
    'fields[1]': 'slug',
    'fields[2]': 'summary',
  });
  return rows.map((r) => ({ title: r.title, slug: r.slug, excerpt: r.summary ?? null, date: null }));
}

export async function getCategories(): Promise<CategorySummary[]> {
  const rows = await strapiFetchAll<Record<string, any>>('categories', {
    'fields[0]': 'name',
    'fields[1]': 'slug',
    'populate[posts][fields][0]': 'slug',
    'sort[0]': 'name:asc',
  });
  return rows
    .map((c) => ({ name: c.name, slug: c.slug, count: (c.posts ?? []).length }))
    .filter((c) => c.count > 0);
}

export async function getPostsByCategory(slug: string): Promise<Summary[]> {
  const rows = await strapiFetchAll<Record<string, any>>('posts', {
    ...LIGHT,
    'filters[categories][slug][$eq]': slug,
    'sort[0]': 'publishedDate:desc',
  });
  return rows.map(summarise);
}

/**
 * Paths that genuinely exist in a given locale.
 *
 * Used to decide whether to offer the language switcher at all. Strapi's i18n
 * plugin returns only the requested locale, so an empty result here means that
 * locale's import has not run yet — and the switcher stays hidden rather than
 * linking into a 404.
 */
export const getTranslatedPaths = cache(async (locale: Locale): Promise<string[]> => {
  // The default locale is the baseline, not a translation of anything.
  if (locale === DEFAULT_LOCALE) return [];

  /*
    One retry, then give up loudly. See the failure note below for why giving up
    QUIETLY was the bug — the retry exists so that the loud version does not fire
    on every CMS hiccup, which on a 2GB box measured 29.7s on one endpoint.
  */
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 750));
    try {
      return await fetchTranslatedPaths(locale);
    } catch (err) {
      lastError = err;
    }
  }

  /*
    THROW, rather than returning [].

    Returning an empty list looked defensive and was the opposite. The switcher
    reads it as "no translation exists", renders nothing, and that page — with
    no route into the Arabic site — is what gets CACHED, at build time or at ISR
    regeneration. It then persists until something happens to rebuild it.

    It shipped twice. Both times the homepage, which makes sense: it is the most
    requested page, so it revalidates most often, so it has the most chances to
    lose. Every other page kept its switcher, so nothing looked wrong.

    Throwing is strictly better at both stages. At build time it fails visibly
    instead of shipping a degraded site. At runtime Next serves the last good
    version rather than replacing it with a worse one — which is exactly what
    stale-while-revalidate is for.

    And this catch cannot be hiding a missing locale, which is what the original
    comment worried about: Strapi answers an unknown locale with an empty 200,
    not an error. Verified — ?locale=zz returns the same empty list as ?locale=de.
    So the only thing reaching here is a genuine failure.
  */
  console.error(
    `[content] getTranslatedPaths(${locale}) failed twice — refusing to cache a ` +
      `page with no language switcher. Cause: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
  );
  throw lastError;
});

async function fetchTranslatedPaths(locale: Locale): Promise<string[]> {
  /*
    Cached on a 30-minute window rather than the 300s the rest of the site
    uses. This answer is structural — which pages exist, in which language —
    and changes when something is published, not on a timer.

    The window is the mitigation, not a preference. Every regeneration is
    another chance for a CMS hiccup to yield a page with no language switcher,
    which then gets cached; that has happened repeatedly, always on the
    homepage, because it is requested most and so revalidates most.

    See STRUCTURE_REVALIDATE for what this trades away.
  */
  const opts = { revalidate: STRUCTURE_REVALIDATE };
  const [pages, posts, areas, caseStudies, landings] = await Promise.all([
    strapiFetchAll<{ slug: string }>('pages', { 'fields[0]': 'slug', locale }, 100, opts),
    strapiFetchAll<{ slug: string }>('posts', { 'fields[0]': 'slug', locale }, 100, opts),
    strapiFetchAll<{ slug: string }>('practice-areas', { 'fields[0]': 'slug', locale }, 100, opts),
    strapiFetchAll<{ slug: string }>('case-studies', { 'fields[0]': 'slug', locale }, 100, opts),
    strapiFetchAll<{ slug: string }>('landing-pages', { 'fields[0]': 'slug', locale }, 100, opts),
  ]);
  const slugs = [...pages, ...posts, ...areas, ...caseStudies]
    .map((r) => r.slug)
    .filter(Boolean);
  const paths = [...new Set(slugs)].map((s) =>
    s === 'home' ? pathIn('/', locale) : pathIn(`/${s}`, locale),
  );

  /*
    Landing pages sit under their own prefix, so they cannot go through the
    mapping above — /ar/contract-drafting is not a page, /ar/legal-services/
    contract-drafting is.

    Until this was added the switcher was hidden on every landing page: it
    only appears where it knows an Arabic version exists, and these were not
    in the list it checks. The Arabic pages existed and were reachable; no
    reader could find them.

    The index itself is listed only when at least one translated page exists
    behind it, which keeps the same promise the rest of this function makes —
    never offer a switch into an empty page.
  */
  const landingSlugs = [...new Set(landings.map((r) => r.slug).filter(Boolean))];
  if (landingSlugs.length) {
    paths.push(
      pathIn('/legal-services', locale),
      ...landingSlugs.map((s) => pathIn(`/legal-services/${s}`, locale)),
    );
  }
  return paths;
}


/**
 * Every non-default locale's translated paths, in one object.
 *
 * Header and Footer both need this on every render, and both used to call the
 * Arabic version separately — cache() collapses that to one set of requests per
 * request, which matters because each call is five paginated Strapi queries
 * against a 2GB box.
 */
export const getAllTranslatedPaths = cache(
  async (): Promise<Partial<Record<Locale, string[]>>> => {
    const others = LOCALES.filter((l) => l !== DEFAULT_LOCALE);
    const rows = await Promise.all(
      others.map(async (l) => [l, await getTranslatedPaths(l)] as const),
    );
    return Object.fromEntries(rows);
  },
);

/**
 * Which locales a given unprefixed path genuinely exists in.
 *
 * Always includes the default locale — English is the baseline and every page
 * has one. Used to build hreflang clusters, which must never point at a 404.
 */
export async function localesFor(bare: string): Promise<Locale[]> {
  const all = await getAllTranslatedPaths();
  return [
    DEFAULT_LOCALE,
    ...LOCALES.filter(
      (l) => l !== DEFAULT_LOCALE && (all[l] ?? []).includes(pathIn(bare, l)),
    ),
  ];
}

export async function getAllSlugs(collection: string, locale = 'en'): Promise<string[]> {
  const rows = await strapiFetchAll<{ slug: string }>(collection, {
    'fields[0]': 'slug',
    locale,
  });
  return rows.map((r) => r.slug).filter(Boolean);
}

/** Clamp to roughly what Google renders, on a word boundary. */
export function clamp(text: string, max = 160): string {
  const flat = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, flat.lastIndexOf(' ', max))}…`;
}

/** Meta description: the CMS value, else the first real prose on the page. */
export function describe(doc: Doc): string {
  if (doc.seo?.metaDescription) return doc.seo.metaDescription;
  if (doc.excerpt) return clamp(doc.excerpt);
  const para = doc.blocks.find((b) => b.type === 'paragraph');
  return para ? clamp(para.html) : '';
}

// --------------------------------------------------------------- landing pages

/**
 * Campaign landing pages, for paid search.
 *
 * Their own collection rather than `pages`, deliberately: everything that
 * enumerates pages — the sitemap, the orphan gate, the nav — would otherwise
 * pick these up, and they are meant to be invisible to all three. They are
 * served noindex because each one duplicates a service page that already
 * ranks organically.
 *
 * The copy is seeded from markdown in content/landing (npm run wp:landing in
 * the CMS repo) and edited in the admin panel from then on.
 */
export type Landing = {
  slug: string;
  title: string;
  h1: string;
  subhead: string;
  description: string;
  heroImage: { src: string; alt: string } | null;
  blocks: Block[];
};

const LANDING_QUERY = {
  'sort[0]': 'order:asc',
  'populate[heroImage]': 'true',
  'populate[seo]': 'true',
  ...Object.fromEntries(
    ['blocks.heading', 'blocks.paragraph', 'blocks.list', 'blocks.faq', 'blocks.image', 'blocks.quote']
      .map((c) => [`populate[blocks][on][${c}][populate]`, '*']),
  ),
} as const;

function toLanding(raw: Record<string, any>): Landing {
  const src = mediaUrl(raw.heroImage?.url);
  return {
    slug: String(raw.slug),
    title: String(raw.title ?? raw.slug),
    h1: String(raw.h1 ?? raw.title ?? raw.slug),
    subhead: String(raw.subhead ?? ''),
    description: String(raw.seo?.metaDescription ?? ''),
    heroImage: src ? { src, alt: raw.heroImage?.alternativeText ?? '' } : null,
    blocks: ((raw.blocks ?? []) as StrapiComponent[]).map(toBlock).filter(Boolean) as Block[],
  };
}

export async function getAllLandings(locale = 'en'): Promise<Landing[]> {
  const rows = await strapiFetchAll<Record<string, any>>('landing-pages', {
    ...LANDING_QUERY,
    locale,
  });
  return rows.map(toLanding);
}

export async function getLandingSlugs(locale = 'en'): Promise<string[]> {
  const rows = await strapiFetchAll<{ slug: string }>('landing-pages', {
    'fields[0]': 'slug',
    'sort[0]': 'order:asc',
    locale,
  });
  return rows.map((r) => r.slug).filter(Boolean);
}

export async function getLanding(slug: string, locale = 'en'): Promise<Landing | null> {
  const res = await strapiFetch<{ data: Record<string, any>[] }>('landing-pages', {
    'filters[slug][$eq]': slug,
    ...LANDING_QUERY,
    locale,
  });
  const row = res.data?.[0];
  return row ? toLanding(row) : null;
}
