/**
 * Locale configuration.
 *
 * URLs mirror the WordPress site exactly: English at the root, Arabic under
 * /ar/<same-slug>. TranslatePress never translated the slugs, so the paths are
 * identical either side — which is what makes the switcher a simple prefix
 * and keeps every legacy Arabic URL working after cutover.
 */

export const LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Native names. A switcher labelled "Arabic" is useless to an Arabic reader. */
export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
};

export const LOCALE_DIR: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ar: 'rtl',
};

/** Which locale a pathname belongs to. */
export function localeOf(pathname: string): Locale {
  return pathname === '/ar' || pathname.startsWith('/ar/') ? 'ar' : 'en';
}

/** The same page in the other locale. */
export function pathIn(pathname: string, locale: Locale): string {
  const bare = pathname === '/ar' ? '/' : pathname.replace(/^\/ar(?=\/)/, '') || '/';
  if (locale === 'en') return bare;
  return bare === '/' ? '/ar' : `/ar${bare}`;
}

/**
 * hreflang alternates for a given path.
 *
 * The WordPress site emits hreflang but omits every Arabic URL from its
 * sitemaps, so Google has to discover ~60 pages by crawling alone. Emitting
 * both directions plus x-default is half of fixing that; the locale-aware
 * sitemap is the other half.
 *
 * Only pass `hasArabic` as true when the Arabic page genuinely exists —
 * pointing hreflang at a 404 is worse than omitting it.
 */
export function alternatesFor(path: string, hasArabic: boolean) {
  const en = pathIn(path, 'en');
  // Self-canonical. Every caller used to be an English route, where the
  // canonical and the English URL are the same string, so returning `en`
  // looked correct. The moment an Arabic route called this — /ar — it
  // canonicalised the Arabic homepage to the English one, which tells Google
  // the two are duplicates and drops the Arabic page from the index. Pages in
  // an hreflang cluster must each canonicalise to themselves.
  if (!hasArabic) return { canonical: path };
  return {
    canonical: path,
    languages: {
      'en-AE': en,
      ar: pathIn(path, 'ar'),
      'x-default': en,
    },
  };
}
