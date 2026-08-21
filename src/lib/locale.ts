/**
 * Locale configuration.
 *
 * URLs mirror the WordPress site exactly: English at the root, Arabic under
 * /ar/<same-slug>. TranslatePress never translated the slugs, so the paths are
 * identical either side — which is what makes the switcher a simple prefix
 * and keeps every legacy Arabic URL working after cutover.
 */

export const LOCALES = ['en', 'ar', 'de'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Native names. A switcher labelled "Arabic" is useless to an Arabic reader. */
export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
  de: 'Deutsch',
};

/**
 * Compact codes, for the switcher on narrow screens.
 *
 * The header row at mobile widths already carries the wordmark and the contact
 * link. One full language name fitted; with a third locale, two do not — so
 * below the `sm` breakpoint the control shows codes instead of names.
 */
export const LOCALE_CODE: Record<Locale, string> = {
  en: 'EN',
  ar: 'ع',
  de: 'DE',
};

/**
 * Accessible names for the switcher, written IN the language of the page the
 * reader is currently on.
 *
 * The previous version built `Switch to Arabic` in English prose regardless of
 * page. On an Arabic page a screen reader announced English words using Arabic
 * phonetics, which is close to unintelligible — and it would do the same to a
 * German reader. The outer key is the CURRENT locale, the inner key is the
 * destination.
 */
export const LOCALE_SWITCH_ARIA: Record<Locale, Record<Locale, string>> = {
  en: { en: 'Switch to English', ar: 'Switch to Arabic', de: 'Switch to German' },
  ar: {
    en: 'التبديل إلى الإنجليزية',
    ar: 'التبديل إلى العربية',
    de: 'التبديل إلى الألمانية',
  },
  de: { en: 'Zu Englisch wechseln', ar: 'Zu Arabisch wechseln', de: 'Zu Deutsch wechseln' },
};

/**
 * BCP-47 tags for date formatting.
 *
 * Separate from LOCALE_HREFLANG and LOCALE_LANG_TAG because it answers a
 * different question — how Intl should render a date, not how a search engine
 * or a knowledge graph should label the page. Arabic wants ar-AE for its
 * numerals; English wants en-GB for day-month order rather than the American
 * default.
 */
export const LOCALE_DATE: Record<Locale, string> = {
  en: 'en-GB',
  ar: 'ar-AE',
  de: 'de-DE',
};

/** Accessible name for the switcher as a whole, in the current language. */
export const LOCALE_NAV_ARIA: Record<Locale, string> = {
  en: 'Language',
  ar: 'اللغة',
  de: 'Sprache',
};

export const LOCALE_DIR: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ar: 'rtl',
  de: 'ltr',
};

/**
 * URL prefix per locale. The default locale has none — English is at the root.
 *
 * This table is what makes the functions below stop hardcoding `/ar`. Adding a
 * locale is now an entry here rather than an edit to three regexes, each of
 * which failed differently: a two-branch `if` in pathIn() would have sent
 * German traffic to Arabic URLs without a compile error, because the union
 * widens but the else-branch still catches everything.
 */
export const LOCALE_PREFIX: Record<Locale, string> = {
  en: '',
  ar: '/ar',
  de: '/de',
};

/**
 * hreflang keys.
 *
 * Deliberately kept byte-identical to what the site emits today — `en-AE` is
 * region-qualified and `ar` is not. Both are valid, and normalising them is a
 * live SEO change on 63 Arabic routes that has nothing to do with adding a
 * locale. Change it on purpose, in its own commit, or not at all.
 */
export const LOCALE_HREFLANG: Record<Locale, string> = {
  en: 'en-AE',
  ar: 'ar',
  /*
    Bare `de`, not `de-DE`. The German pages are a UAE law firm addressing
    German speakers wherever they are — clients in the Emirates, and enquiries
    from Germany, Austria and Switzerland alike. Region-qualifying it would tell
    Google this content is for Germany specifically, which is narrower than the
    audience.
  */
  de: 'de',
};

/**
 * schema.org `inLanguage` tags.
 *
 * A separate table from LOCALE_HREFLANG on purpose. Today Arabic is `ar` in
 * hreflang and `ar-AE` in JSON-LD — both correct for their own spec, and
 * sharing one table would mean a considered change to hreflang silently
 * rewriting structured data too.
 */
export const LOCALE_LANG_TAG: Record<Locale, string> = {
  en: 'en-AE',
  ar: 'ar-AE',
  de: 'de',
};

/** Which locale a pathname belongs to. */
export function localeOf(pathname: string): Locale {
  /*
    Exact-segment test, not a bare startsWith.

    `pathname.startsWith('/ar')` would classify the real English route
    /articles-of-association-uae as Arabic. That page exists; this is the bug
    the original regex was written to avoid, and it survives the rewrite.
  */
  for (const locale of LOCALES) {
    const prefix = LOCALE_PREFIX[locale];
    if (prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return locale;
    }
  }
  return DEFAULT_LOCALE;
}

/** The path with any locale prefix removed. Always starts with a slash. */
export function barePath(pathname: string): string {
  const prefix = LOCALE_PREFIX[localeOf(pathname)];
  return prefix ? pathname.slice(prefix.length) || '/' : pathname;
}

/** The same page in another locale. */
export function pathIn(pathname: string, locale: Locale): string {
  const bare = barePath(pathname);
  const prefix = LOCALE_PREFIX[locale];
  if (!prefix) return bare;
  return bare === '/' ? prefix : `${prefix}${bare}`;
}

/**
 * hreflang alternates for a given path.
 *
 * The WordPress site emits hreflang but omits every Arabic URL from its
 * sitemaps, so Google has to discover ~60 pages by crawling alone. Emitting
 * both directions plus x-default is half of fixing that; the locale-aware
 * sitemap is the other half.
 *
 * Pass only the locales the page genuinely exists in — pointing hreflang at a
 * 404 is worse than omitting it. `localesFor()` in content.ts computes that
 * from the CMS.
 */
export function alternatesFor(path: string, available: Iterable<Locale>) {
  const set = new Set(available);
  // A page always exists in its own locale, whatever the caller passed.
  set.add(localeOf(path));

  // Nothing to cluster with. A one-entry hreflang set is not wrong so much as
  // meaningless, and emitting it invites Google to treat a page as its own
  // alternate.
  if (set.size < 2) return { canonical: path };

  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    if (set.has(locale)) languages[LOCALE_HREFLANG[locale]] = pathIn(path, locale);
  }
  languages['x-default'] = pathIn(path, DEFAULT_LOCALE);

  // Self-canonical, and `path` verbatim. Every caller used to be an English
  // route, where the canonical and the English URL are the same string, so
  // returning the English one looked correct. The moment an Arabic route
  // called this — /ar — it canonicalised the Arabic homepage to the English
  // one, which tells Google the two are duplicates and drops the Arabic page
  // from the index. Pages in an hreflang cluster must each canonicalise to
  // themselves.
  return { canonical: path, languages };
}
