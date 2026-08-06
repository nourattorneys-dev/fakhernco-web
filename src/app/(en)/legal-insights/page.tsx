import type { Metadata } from 'next';
import { getCategories, getPosts } from '@/lib/content';
import { CategoryFilter, InsightGrid, Pagination } from '@/components/InsightGrid';
import { PER_PAGE } from './per-page';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Legal Insights',
  description:
    'Guides and commentary on UAE law from Fakher & Co — litigation, contracts, company formation, employment, real estate and private notary services.',
  alternates: { canonical: '/legal-insights' },
};

export default async function InsightsPage() {
  const [posts, categories] = await Promise.all([getPosts(), getCategories()]);
  const pageCount = Math.ceil(posts.length / PER_PAGE);

  return (
    <>
      <header className="border-b border-line">
        <div className="site-container section">
          <p className="eyebrow text-ink">Legal Insights</p>
          <h1 className="mt-4 text-display">Guidance on UAE law</h1>
          <p className="mt-5 max-w-[58ch] text-lg text-body">
            {posts.length} guides and commentary pieces across {categories.length} areas of UAE law.
          </p>
          <CategoryFilter categories={categories} />
        </div>
      </header>

      <div className="site-container section-tight">
        <InsightGrid posts={posts.slice(0, PER_PAGE)} />
        <Pagination page={1} pageCount={pageCount} basePath="/legal-insights" />
      </div>
    </>
  );
}
