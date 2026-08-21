import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { describe, getAllSlugs, getDocument, localesFor } from '@/lib/content';
import { DocumentArticle } from '@/components/DocumentArticle';
import { alternatesFor } from '@/lib/locale';

export const revalidate = 300;

/**
 * Arabic pages.
 *
 * Only 52 of the 220 URLs are genuinely translated — the service pages. The
 * rest serve English under an /ar/ path on the live site and are deliberately
 * not reproduced here, so the language switcher offers Arabic exactly where
 * Arabic exists.
 *
 * Slugs are identical either side: TranslatePress never had slug translation
 * enabled, so /ar/criminal-cases matches /criminal-cases. That is what keeps
 * every legacy Arabic URL working after cutover.
 */
export async function generateStaticParams() {
  const [pages, areas, caseStudies, posts] = await Promise.all([
    getAllSlugs('pages', 'ar'),
    getAllSlugs('practice-areas', 'ar'),
    getAllSlugs('case-studies', 'ar'),
    getAllSlugs('posts', 'ar'),
  ]);
  const all = [...areas, ...pages, ...posts, ...caseStudies].filter((s) => s !== 'home');
  return [...new Set(all)].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getDocument(slug, 'ar');
  if (!doc) return {};

  const description = describe(doc);

  return {
    title: doc.seo?.metaTitle || doc.title,
    description,
    // Both directions, via the shared builder. This was a hand-written map —
    // it never imported alternatesFor, so a grep for that name missed it
    // entirely and it would have kept emitting a two-language cluster after a
    // third locale shipped.
    alternates: alternatesFor(`/ar/${doc.slug}`, await localesFor(`/${doc.slug}`)),
    openGraph: {
      title: doc.seo?.metaTitle || doc.title,
      description,
      locale: 'ar_AE',
      url: `/ar/${doc.slug}`,
      // A page-level openGraph object REPLACES the layout's rather than
      // merging into it, so anything the layout supplied has to be restated
      // here. Without these two, 51 of the 53 Arabic URLs emitted no og:type
      // and 52 emitted no og:site_name.
      type: 'website',
      siteName: 'مكتب فاخر ومشاركوه',
    },
  };
}

export default async function ArabicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = await getDocument(slug, 'ar');
  if (!doc) notFound();

  return <DocumentArticle doc={doc} description={describe(doc)} locale="ar" />;
}
