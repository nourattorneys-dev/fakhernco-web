import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  describe,
  getAllSlugs,
  localesFor,
  getDocument,
  getPracticeAreas,
  type Doc,
} from '@/lib/content';
import { alternatesFor } from '@/lib/locale';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { JsonLd } from '@/components/JsonLd';
import { articleSchema, breadcrumbSchema, faqSchema, graph, serviceSchema } from '@/lib/schema';
import { TEL_HREF } from '@/lib/contact';

export const revalidate = 300;

/**
 * Slugs owned by a literal route (src/app/<slug>/page.tsx).
 *
 * A literal segment always beats [slug], so prerendering these here would
 * generate pages that can never be served. Those routes render the same CMS
 * records themselves.
 */
const LITERAL_ROUTES = new Set(['home', 'services', 'contact-us', 'legal-insights']);

/**
 * Every page, insight, case study and practice area lives at a root-level
 * slug, exactly as on WordPress. Keeping that flat namespace is what makes
 * this a near-zero-redirect migration.
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
    title: doc.seo?.metaTitle || doc.title,
    description,
    alternates: alternatesFor(`/${doc.slug}`, await localesFor(`/${doc.slug}`)),
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
  post: 'Legal Insight',
  'case-study': 'Case Study',
  'practice-area': 'Practice Area',
};

export default async function DocumentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = await getDocument(slug);
  if (!doc) notFound();

  const areas = await getPracticeAreas();
  const isArea = doc.kind === 'practice-area';
  const area = isArea
    ? areas.find((a) => a.slug === doc.slug)
    : areas.find((a) => a.slug === doc.practiceArea?.slug);

  const description = describe(doc);
  const label = LABEL[doc.kind];

  const crumbs = [
    { name: 'Home', path: '/' },
    ...(doc.practiceArea
      ? [{ name: doc.practiceArea.title, path: `/${doc.practiceArea.slug}` }]
      : []),
    { name: doc.title, path: `/${doc.slug}` },
  ];

  const siblings = (area?.children ?? []).filter((c) => c.slug !== doc.slug);

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
        <div className="site-container section-tight">
          <nav aria-label="Breadcrumb" className="text-xs text-muted">
            <Link href="/" className="hover:text-ink">Home</Link>
            {doc.practiceArea && (
              <>
                <span aria-hidden className="mx-2">/</span>
                <Link href={`/${doc.practiceArea.slug}`} className="hover:text-ink">
                  {doc.practiceArea.title}
                </Link>
              </>
            )}
            <span aria-hidden className="mx-2">/</span>
            <span className="text-body">{doc.title}</span>
          </nav>

          {label && <p className="eyebrow mt-6 text-muted">{label}</p>}

          {/* The one and only H1 on the page. */}
          <h1 className="mt-4 max-w-[24ch] text-display">{doc.title}</h1>

          {description && (
            <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-body">{description}</p>
          )}

          {doc.publishedDate && (
            <p className="mt-5 text-sm text-muted">
              <time dateTime={doc.publishedDate}>
                {new Date(doc.publishedDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
              {doc.categories && doc.categories.length > 0 && (
                <> · {doc.categories.map((c) => c.name).join(', ')}</>
              )}
            </p>
          )}
        </div>
      </header>

      {/*
        Two columns.

        The article keeps a readable measure and the sidebar occupies the space
        that measure leaves over — previously ~30rem of empty page beside every
        service article. The sidebar is also the main internal-linking surface:
        each service now links to its siblings, which the WordPress site never
        did from the body of a page.
      */}
      <div className="site-container section grid gap-12 lg:grid-cols-[minmax(0,44rem)_1fr] lg:gap-16">
        <div>
          {doc.blocks.length > 0 ? (
            <BlockRenderer blocks={doc.blocks} />
          ) : (
            <p className="text-muted">This page has no content yet.</p>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="bg-ink card-p text-white">
            <h2 className="text-xl text-white">Speak to a lawyer</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Tell us about your matter and a member of our team will respond within one business
              day.
            </p>
            <Link
              href="/contact-us"
              className="mt-5 inline-block bg-white px-6 py-3 font-display text-sm font-700 text-ink transition-colors hover:bg-white/85"
            >
              Request a consultation
            </Link>
            <a
              href={TEL_HREF}
              className="mt-4 block font-display text-sm font-600 text-white/80 underline decoration-white/30 underline-offset-4 hover:decoration-white"
            >
              +971 50 205 7209
            </a>
          </div>

          {siblings.length > 0 && area && (
            <nav aria-label="Related services" className="mt-8 border-t border-line pt-6">
              <h2 className="eyebrow text-muted">
                {isArea ? 'Services in this area' : 'Related services'}
              </h2>
              <ul className="mt-4 flex flex-col">
                {siblings.slice(0, 10).map((child) => (
                  <li key={child.slug} className="border-b border-line-soft last:border-0">
                    <Link
                      href={`/${child.slug}`}
                      className="block py-2.5 text-[0.9375rem] leading-snug text-body transition-colors hover:text-ink"
                    >
                      {child.title}
                    </Link>
                  </li>
                ))}
              </ul>
              {!isArea && (
                <Link
                  href={`/${area.slug}`}
                  className="mt-4 inline-block font-display text-sm font-600 underline decoration-faint underline-offset-4 hover:decoration-ink"
                >
                  All {area.title.replace(/ &.*$/, '')} services
                </Link>
              )}
            </nav>
          )}
        </aside>
      </div>

      <section className="border-t border-line bg-surface-alt">
        <div className="site-container section-tight flex flex-wrap items-center justify-between gap-6">
          <h2 className="max-w-[26ch] text-section">Not sure where your matter fits? Ask us.</h2>
          <Link
            href="/contact-us"
            className="bg-ink px-7 py-3.5 font-display text-sm font-700 text-white transition-colors hover:bg-ink-2"
          >
            Contact us
          </Link>
        </div>
      </section>
    </article>
  );
}
