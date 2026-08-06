import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategories, getPostsByCategory } from '@/lib/content';
import { CategoryFilter, InsightGrid } from '@/components/InsightGrid';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbSchema, graph } from '@/lib/schema';

export const revalidate = 300;

/**
 * Category archives.
 *
 * These exist because the WordPress site has seven /category/<slug>/ archives
 * that are live, indexed, and in the sitemap. They are namespaced under
 * /legal-insights/ rather than the root: three category slugs collide with
 * practice-area slugs, so a flat /<slug> archive would fight the service page
 * for the same URL.
 */
export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const found = (await getCategories()).find((c) => c.slug === category);
  if (!found) return {};
  return {
    title: `${found.name} — Legal Insights`,
    description: `${found.count} articles on ${found.name.toLowerCase()} from Fakher & Co, UAE.`,
    alternates: { canonical: `/legal-insights/${category}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const categories = await getCategories();
  const found = categories.find((c) => c.slug === category);
  if (!found) notFound();

  const posts = await getPostsByCategory(category);

  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Legal Insights', path: '/legal-insights' },
            { name: found.name, path: `/legal-insights/${category}` },
          ]),
        )}
      />

      <header className="border-b border-line">
        <div className="site-container py-14 lg:py-16">
          <p className="eyebrow text-ink">Legal Insights</p>
          <h1 className="mt-4 max-w-[24ch] text-display">{found.name}</h1>
          <p className="mt-5 text-lg text-body">
            {found.count} article{found.count === 1 ? '' : 's'} in this area.
          </p>
          <CategoryFilter categories={categories} active={category} />
        </div>
      </header>

      <div className="site-container py-12">
        <InsightGrid posts={posts} />
      </div>
    </>
  );
}
