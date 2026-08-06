import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategories, getPosts } from '@/lib/content';
import { CategoryFilter, InsightGrid, Pagination } from '@/components/InsightGrid';
import { PER_PAGE } from '../../per-page';

export const revalidate = 300;

/**
 * `page` is a literal segment, so it wins over the sibling [category] route.
 * That is intentional — it means /legal-insights/page/2 can never be mistaken
 * for a category called "page".
 */
export async function generateStaticParams() {
  const posts = await getPosts();
  const pageCount = Math.ceil(posts.length / PER_PAGE);
  // Page 1 lives at /legal-insights, so start at 2.
  return Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => ({ page: String(i + 2) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await params;
  return {
    title: `Legal Insights — page ${page}`,
    description: `Guides and commentary on UAE law from Fakher & Co. Page ${page}.`,
    alternates: { canonical: `/legal-insights/page/${page}` },
  };
}

export default async function InsightsPaged({ params }: { params: Promise<{ page: string }> }) {
  const { page: raw } = await params;
  const page = Number(raw);
  if (!Number.isInteger(page) || page < 2) notFound();

  const [posts, categories] = await Promise.all([getPosts(), getCategories()]);
  const pageCount = Math.ceil(posts.length / PER_PAGE);
  if (page > pageCount) notFound();

  const start = (page - 1) * PER_PAGE;

  return (
    <>
      <header className="border-b border-line">
        <div className="site-container section">
          <p className="eyebrow text-ink">Legal Insights</p>
          <h1 className="mt-4 text-display">Guidance on UAE law</h1>
          <p className="mt-5 text-lg text-body">
            Page {page} of {pageCount}
          </p>
          <CategoryFilter categories={categories} />
        </div>
      </header>

      <div className="site-container section-tight">
        <InsightGrid posts={posts.slice(start, start + PER_PAGE)} />
        <Pagination page={page} pageCount={pageCount} basePath="/legal-insights" />
      </div>
    </>
  );
}
