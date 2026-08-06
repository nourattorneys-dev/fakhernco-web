import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  describe,
  getAllSlugs,
  getDocument,
  getPracticeArea,
  type Doc,
} from '@/lib/content';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { JsonLd } from '@/components/JsonLd';
import { articleSchema, breadcrumbSchema, faqSchema, graph, serviceSchema } from '@/lib/schema';

/**
 * Slugs owned by a literal route (src/app/<slug>/page.tsx).
 *
 * A literal segment always beats [slug], so prerendering these here would
 * generate pages that can never be served. Those routes render the same CMS
 * records themselves.
 */
const LITERAL_ROUTES = new Set(['home', 'services', 'contact-us', 'legal-insights']);

export const revalidate = 300;

/**
 * Every page, insight, case study and practice area lives at a root-level
 * slug, exactly as on WordPress. Keeping that flat namespace is what makes
 * the migration a near-zero-redirect one.
 */
export async function generateStaticParams() {
  const [pages, posts, caseStudies, areas] = await Promise.all([
    getAllSlugs('pages'),
    getAllSlugs('posts'),
    getAllSlugs('case-studies'),
    getAllSlugs('practice-areas'),
  ]);
  const all = [...areas, ...pages, ...posts, ...caseStudies].filter((s) => !LITERAL_ROUTES.has(s));
  return [...new Set(all)].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getDocument(slug);
  if (!doc) return {};

  const description = describe(doc);

  return {
    // `absolute` is not used here — the layout template appends the brand once,
    // and the imported metaTitle already had its brand suffix stripped.
    title: doc.seo?.metaTitle || doc.title,
    description,
    alternates: { canonical: `/${doc.slug}` },
    robots: doc.seo?.noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      title: doc.seo?.metaTitle || doc.title,
      description,
      type: doc.kind === 'post' ? 'article' : 'website',
      url: `/${doc.slug}`,
    },
  };
}

const LABEL: Record<Doc['kind'], string | null> = {
  page: null,
  post: 'Legal insight',
  'case-study': 'Case study',
  'practice-area': 'Practice area',
};

export default async function DocumentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = await getDocument(slug);
  if (!doc) notFound();

  const area = doc.kind === 'practice-area' ? await getPracticeArea(doc.slug) : null;
  const label = LABEL[doc.kind];
  const description = describe(doc);

  const crumbs = [
    { name: 'Home', path: '/' },
    ...(doc.practiceArea ? [{ name: doc.practiceArea.title, path: `/${doc.practiceArea.slug}` }] : []),
    { name: doc.title, path: `/${doc.slug}` },
  ];

  return (
    <article>
      <JsonLd
        data={graph(
          breadcrumbSchema(crumbs),
          doc.kind === 'post' || doc.kind === 'case-study'
            ? articleSchema(doc, description)
            : serviceSchema(doc, description),
          faqSchema(doc.blocks),
        )}
      />
      <header className="border-b border-line bg-surface-alt">
        <div className="site-container py-16 lg:py-20">
          <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted">
            <Link href="/" className="hover:text-ink">Home</Link>
            {doc.practiceArea && (
              <>
                <span aria-hidden className="mx-1.5">/</span>
                <Link href={`/${doc.practiceArea.slug}`} className="hover:text-ink">
                  {doc.practiceArea.title}
                </Link>
              </>
            )}
            <span aria-hidden className="mx-1.5">/</span>
            <span className="text-body">{doc.title}</span>
          </nav>

          {label && <p className="eyebrow text-ink">{label}</p>}

          {/* The one and only H1 on the page. */}
          <h1 className="mt-4 max-w-[22ch] text-display">{doc.title}</h1>

          {(doc.excerpt || doc.summary) && (
            <p className="mt-4 max-w-2xl text-lg text-body">{doc.excerpt ?? doc.summary}</p>
          )}

          {doc.publishedDate && (
            <p className="mt-4 text-sm text-muted">
              <time dateTime={doc.publishedDate}>
                {new Date(doc.publishedDate).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </time>
              {doc.categories && doc.categories.length > 0 && (
                <> · {doc.categories.map((c) => c.name).join(', ')}</>
              )}
            </p>
          )}
        </div>
      </header>

      <div className="site-container max-w-3xl py-12">
        {doc.blocks.length > 0 ? (
          <BlockRenderer blocks={doc.blocks} />
        ) : (
          <p className="text-muted">This page has no content yet.</p>
        )}
      </div>

      {area && <PracticeAreaChildren slug={area.slug} />}
    </article>
  );
}

async function PracticeAreaChildren({ slug }: { slug: string }) {
  const { getPracticeAreas } = await import('@/lib/content');
  const areas = await getPracticeAreas();
  const children = areas.find((a) => a.slug === slug)?.children ?? [];
  if (!children.length) return null;

  return (
    <section className="border-t border-line bg-surface-alt">
      <div className="site-container py-16 lg:py-20">
        <h2 className="text-section">Services in this practice area</h2>
        <div className="mt-10 grid border-t border-l border-line sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <Link
              key={child.slug}
              href={`/${child.slug}`}
              className="border border-line bg-surface p-5 transition-colors hover:border-ink"
            >
              <h3 className="text-base leading-snug">{child.title}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
