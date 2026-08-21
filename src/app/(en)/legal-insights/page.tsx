import type { Metadata } from 'next';
import { alternatesFor } from '@/lib/locale';
import { localesFor } from '@/lib/content';
import Link from 'next/link';
import { getCaseStudies, getCategories, getPosts } from '@/lib/content';
import { CategoryFilter, InsightGrid, Pagination } from '@/components/InsightGrid';
import { PER_PAGE } from './per-page';

export const revalidate = 300;

/*
  generateMetadata rather than a static object, because the hreflang cluster is
  data-dependent: the German legal-insights PAGE exists (the index copy is
  translated; the articles themselves are not), so /de/legal-insights is a real
  URL and this hub must claim it back — a one-way cluster is discarded and
  degrades the German side's annotations. localesFor() answers from the CMS, so
  if Arabic ever gains the page too, the cluster widens by itself.
*/
export async function generateMetadata(): Promise<Metadata> {
  const base: Metadata = {
  title: 'Legal Insights',
  description:
    'Guides and commentary on UAE law from Fakher & Co — litigation, contracts, company formation, employment, real estate and private notary services.',
  alternates: { canonical: '/legal-insights' },
};
  return {
    ...base,
    alternates: alternatesFor('/legal-insights', await localesFor('/legal-insights')),
  };
}

export default async function InsightsPage() {
  const [posts, categories, caseStudies] = await Promise.all([
    getPosts(),
    getCategories(),
    getCaseStudies(),
  ]);
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

      {/*
        Case studies had no listing anywhere and no inbound links — they
        imported cleanly, returned 200, and were unreachable.
      */}
      {caseStudies.length > 0 && (
        <section className="border-t border-line bg-surface-alt">
          <div className="site-container section">
            <p className="eyebrow text-ink">Case studies</p>
            <h2 className="mt-4 text-display">How we have helped</h2>
            <p className="mt-4 max-w-[62ch] text-body">
              Anonymised examples of matters we have handled. All names and identifying details
              have been changed.
            </p>
            <div className="section-body grid gap-px border border-line bg-line md:grid-cols-2">
              {caseStudies.map((c) => (
                <Link
                  key={c.slug}
                  href={`/${c.slug}`}
                  className="group flex flex-col bg-surface card-p transition-colors hover:bg-surface-alt"
                >
                  <h3 className="text-card">{c.title}</h3>
                  {c.excerpt && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-body">{c.excerpt}</p>
                  )}
                  <span className="mt-auto pt-5 font-display text-sm font-600 underline decoration-faint underline-offset-4 group-hover:decoration-ink">
                    Read the case study
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
