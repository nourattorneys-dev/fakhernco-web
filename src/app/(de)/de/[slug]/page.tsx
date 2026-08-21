import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { describe, getAllSlugs, getDocument, localesFor } from '@/lib/content';
import { DocumentArticle } from '@/components/DocumentArticle';
import { alternatesFor, LOCALE_LANG_TAG } from '@/lib/locale';

export const revalidate = 300;

/**
 * German pages.
 *
 * Scoped to the same subset Arabic covers — pages and practice areas. No
 * legal-insights: there is no /ar/legal-insights either, and German is
 * deliberately not broader than Arabic.
 *
 * Slugs are identical to English, as they are for Arabic. That keeps pathIn a
 * pure string operation, which every hreflang, sitemap and switcher decision
 * downstream depends on.
 */
export const dynamicParams = false;

/**
 * Slugs owned by a literal route inside this group, so [slug] must not also
 * claim them. Same guard the English group documents.
 */
const LITERAL_ROUTES = new Set(['home', 'contact-us', 'legal-services']);

export async function generateStaticParams() {
  const [pages, areas] = await Promise.all([
    getAllSlugs('pages', 'de'),
    getAllSlugs('practice-areas', 'de'),
  ]);
  const all = [...areas, ...pages].filter((slug) => !LITERAL_ROUTES.has(slug));

  /*
    THE SAFETY NET. Do not remove this.

    Without it, an empty German locale is completely legal: getAllSlugs returns
    [], generateStaticParams returns [], and the build goes GREEN having
    produced zero German routes. Every /de/* URL then 404s at runtime with
    nothing anywhere to indicate anything is wrong — no error, no warning, and a
    sitemap that correctly lists nothing.

    That is the failure this whole locale is most likely to hit, because German
    content arrives in batches and the CMS is a 2GB box that has already timed
    out mid-build more than once. Failing loudly is the only way it gets noticed.
  */
  if (all.length === 0) {
    /*
      One deliberate escape hatch, for the window before the first German batch
      is published. Set ALLOW_EMPTY_DE=1 in the Vercel project, and REMOVE IT
      the moment German content exists — it is the difference between "German
      is not written yet", which is fine, and "German broke", which is not.

      It is an environment variable rather than a code flag so that deleting it
      is a one-click change by whoever publishes the content, and so that
      forgetting shows up as a failed build rather than a silent one.
    */
    if (process.env.ALLOW_EMPTY_DE === '1') {
      console.warn(
        '[de] No German content in Strapi. Building ZERO German routes because ' +
          'ALLOW_EMPTY_DE=1. Remove that variable once German is published.',
      );
      return [];
    }

    throw new Error(
      'No German content found in Strapi. Either the `de` locale is not ' +
        'registered (see fakhernco-cms src/index.ts LOCALES) or no German ' +
        'pages have been published yet. Refusing to ship a build in which ' +
        'every /de/* URL 404s. If German is genuinely not written yet, set ' +
        'ALLOW_EMPTY_DE=1 in the Vercel project — and remove it when it is.',
    );
  }

  return [...new Set(all)].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getDocument(slug, 'de');
  if (!doc) return {};

  const description = describe(doc);

  return {
    title: doc.seo?.metaTitle || doc.title,
    description,
    alternates: alternatesFor(`/de/${doc.slug}`, await localesFor(`/${doc.slug}`)),
    robots: doc.seo?.noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      title: doc.seo?.metaTitle || doc.title,
      description,
      locale: LOCALE_LANG_TAG.de,
      url: `/de/${doc.slug}`,
      type: 'website',
      siteName: 'Fakher & Co',
    },
  };
}

export default async function GermanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = await getDocument(slug, 'de');
  if (!doc) notFound();

  return <DocumentArticle doc={doc} description={describe(doc)} locale="de" />;
}
