import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllLandings, getLanding, getLandingSlugs, getPracticeAreas } from '@/lib/content';
import { LandingArticle } from '@/components/landing/LandingArticle';

/**
 * German campaign pages.
 *
 * generateStaticParams asks Strapi for the GERMAN slugs specifically. The i18n
 * plugin returns only the requested locale, so a page with no German version
 * simply is not built — which is what should happen. Prerendering the English
 * slug list here would produce German routes that fall through to notFound at
 * request time.
 *
 * No assertion on an empty result, unlike (de)/de/[slug]. These nine pages are
 * a campaign surface that may legitimately never be translated, so an empty
 * German landing set is a decision rather than a fault.
 */
export async function generateStaticParams() {
  return (await getLandingSlugs('de')).map((slug) => ({ slug }));
}

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLanding(slug, 'de');
  if (!page) return {};

  return {
    title: page.h1,
    description: page.description,
    // noindex for the same reason as the English page, and no hreflang pair:
    // an alternates cluster asks Google to treat the two as one indexable
    // document, which is a request to index them.
    robots: { index: false, follow: true },
    alternates: { canonical: `/de/legal-services/${slug}` },
  };
}

export default async function GermanLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [page, areas, all] = await Promise.all([
    getLanding(slug, 'de'),
    getPracticeAreas('de'),
    getAllLandings('de'),
  ]);
  if (!page) notFound();

  return (
    <LandingArticle
      page={page}
      others={all.filter((p) => p.slug !== slug)}
      services={areas.map((a) => a.title)}
      locale="de"
    />
  );
}
