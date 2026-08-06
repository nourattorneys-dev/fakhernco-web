import type { MetadataRoute } from 'next';
import { getAllSlugs } from '@/lib/content';

const SITE = process.env.SITE_URL ?? 'https://fakhernco.com';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, posts, caseStudies, areas] = await Promise.all([
    getAllSlugs('pages'),
    getAllSlugs('posts'),
    getAllSlugs('case-studies'),
    getAllSlugs('practice-areas'),
  ]);

  const entry = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${SITE}${path}`,
    lastModified: new Date(),
    priority,
  });

  return [
    entry('/', 1),
    entry('/legal-insights', 0.8),
    ...areas.map((s) => entry(`/${s}`, 0.9)),
    ...pages.filter((s) => s !== 'home').map((s) => entry(`/${s}`, 0.7)),
    ...caseStudies.map((s) => entry(`/${s}`, 0.6)),
    ...posts.map((s) => entry(`/${s}`, 0.5)),
  ];
}
