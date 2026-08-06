import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { describe, getAllSlugs, getDocument, type Doc } from '@/lib/content';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbSchema, graph, serviceSchema } from '@/lib/schema';
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
    // Both directions: the Arabic page points back at the English one.
    alternates: {
      canonical: `/ar/${doc.slug}`,
      languages: {
        'en-AE': `/${doc.slug}`,
        ar: `/ar/${doc.slug}`,
        'x-default': `/${doc.slug}`,
      },
    },
    openGraph: {
      title: doc.seo?.metaTitle || doc.title,
      description,
      locale: 'ar_AE',
      url: `/ar/${doc.slug}`,
    },
  };
}

const LABEL: Record<Doc['kind'], string | null> = {
  page: null,
  post: 'رؤية قانونية',
  'case-study': 'دراسة حالة',
  'practice-area': 'مجال الممارسة',
};

export default async function ArabicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = await getDocument(slug, 'ar');
  if (!doc) notFound();

  const description = describe(doc);
  const label = LABEL[doc.kind];

  return (
    <article>
      <JsonLd
        data={graph(
          breadcrumbSchema([
            { name: 'الرئيسية', path: '/ar' },
            { name: doc.title, path: `/ar/${doc.slug}` },
          ]),
          serviceSchema(doc, description),
        )}
      />

      <header className="border-b border-line bg-surface-alt">
        <div className="site-container section-tight">
          <nav aria-label="مسار التنقل" className="text-xs text-muted">
            <Link href="/" className="hover:text-ink">English</Link>
            <span aria-hidden className="mx-2">/</span>
            <span className="text-body">{doc.title}</span>
          </nav>

          {label && <p className="eyebrow mt-6 text-muted">{label}</p>}

          {/* The single H1. */}
          <h1 className="mt-4 max-w-[24ch] text-display">{doc.title}</h1>

          {description && (
            <p className="mt-5 max-w-[62ch] text-lead text-body">{description}</p>
          )}
        </div>
      </header>

      <div className="site-container section">
        <div className="max-w-[46rem]">
          {doc.blocks.length > 0 ? (
            <BlockRenderer blocks={doc.blocks} />
          ) : (
            <p className="text-muted">لا يوجد محتوى لهذه الصفحة بعد.</p>
          )}
        </div>
      </div>

      <section className="bg-ink">
        <div className="site-container section-tight flex flex-wrap items-center justify-between gap-8">
          <h2 className="max-w-[26ch] text-section text-white">
            هل أنت مستعد لحماية مصالحك القانونية؟
          </h2>
          <Link
            href="/ar/contact-us"
            className="bg-white px-8 py-4 font-display text-sm font-700 text-ink transition-colors hover:bg-white/85"
          >
            تواصل معنا
          </Link>
        </div>
      </section>
    </article>
  );
}
