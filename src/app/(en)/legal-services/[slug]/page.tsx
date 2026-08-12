import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllLandings, getLanding, getLandingSlugs, getPracticeAreas } from '@/lib/content';
import { LandingArticle } from '@/components/landing/LandingArticle';

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getLandingSlugs('en')).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLanding(slug, 'en');
  if (!page) return {};

  return {
    // The layout's title template appends ' — Fakher & Co', so the brand
    // must NOT be repeated here — it rendered twice in the tab title.
    title: page.h1,
    description: page.description,
    /*
      noindex, and this is the point of the whole route.

      Each of these duplicates a service page that already ranks — there is an
      organic /litigation-dispute-resolution, /company-formation-corporate-
      services and so on. Letting the ad pages be indexed would put the firm's
      own pages in competition with each other for the same queries and split
      the ranking signals between them.

      `follow` stays on so link equity still reaches the real pages.

      No hreflang either, for the same reason: an alternates cluster asks
      Google to treat the pair as one indexable document in two languages,
      which is a request to index them. The Arabic page carries the same
      noindex and the two are simply kept apart.
    */
    robots: { index: false, follow: true },
    alternates: { canonical: `/legal-services/${slug}` },
  };
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [page, areas, all] = await Promise.all([
    getLanding(slug, 'en'),
    getPracticeAreas(),
    getAllLandings('en'),
  ]);
  if (!page) notFound();

  return (
    <LandingArticle
      page={page}
      others={all.filter((p) => p.slug !== slug)}
      services={areas.map((a) => a.title)}
      locale="en"
    />
  );
}
