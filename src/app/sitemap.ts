import type { MetadataRoute } from 'next';
import { getAllSlugs, getCategories } from '@/lib/content';
import { SITE } from '@/lib/site';
import { DEFAULT_LOCALE, LOCALES, pathIn } from '@/lib/locale';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, posts, caseStudies, areas, categories] = await Promise.all([
    getAllSlugs('pages'),
    getAllSlugs('posts'),
    getAllSlugs('case-studies'),
    getAllSlugs('practice-areas'),
    getCategories(),
  ]);

  /*
    Every non-default locale, rather than Arabic by name.

    The WordPress sitemap contained ZERO Arabic URLs — Google had to discover
    ~60 pages by crawling alone. Listing them is half of fixing that; the
    hreflang alternates are the other half. A third language must not have to
    rediscover that lesson.

    Two awaits rather than one destructured Promise.all with a spread: spreading
    a non-tuple collapses the variadic inference to a union and `pages` stops
    being usable as a string[].
  */
  const translated = await Promise.all(
    LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map(async (locale) => {
      const localePages = await getAllSlugs('pages', locale);
      const localeAreas = await getAllSlugs('practice-areas', locale);
      return { locale, pages: localePages, areas: localeAreas };
    }),
  );

  const entry = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${SITE}${path}`,
    lastModified: new Date(),
    priority,
  });

  return [
    entry('/', 1),
    entry('/legal-insights', 0.8),
    ...areas.map((s) => entry(`/${s}`, 0.9)),
    // Category archives, replacing the seven live /category/<slug>/ URLs.
    // Paginated pages are deliberately excluded: they are crawlable via
    // rel=prev/next but carry no unique content worth listing.
    ...categories.map((c) => entry(`/legal-insights/${c.slug}`, 0.6)),
    // 'home' is the homepage, and 'legal-insights' is a literal route already
    // listed above at a higher priority — emitting it again from the page
    // slugs put the same URL in the sitemap twice with two priorities.
    ...pages
      .filter((s) => s !== 'home' && s !== 'legal-insights')
      .map((s) => entry(`/${s}`, 0.7)),
    ...caseStudies.map((s) => entry(`/${s}`, 0.6)),
    ...posts.map((s) => entry(`/${s}`, 0.5)),
    /*
      Each translated locale's homepage, listed only once it genuinely exists.
      The slug lists filter out 'home' because that record IS the homepage
      rather than a /<slug> page — English gets it back via entry('/') above,
      and without this guard the Arabic one was silently absent from the
      sitemap despite being a real, indexable page.

      The guard matters more now, not less: German will sit at zero translated
      pages for a while, and this is what keeps it out of the sitemap until it
      has something to list.
    */
    ...translated.flatMap(({ locale, pages: localePages, areas: localeAreas }) => [
      ...(localePages.includes('home') ? [entry(pathIn('/', locale), 0.9)] : []),
      ...[...new Set([...localeAreas, ...localePages])]
        .filter((slug) => slug !== 'home')
        .map((slug) => entry(pathIn(`/${slug}`, locale), 0.7)),
    ]),
  ];
}
