import type { Metadata } from 'next';
import { getAllLandings, getPracticeAreas } from '@/lib/content';
import { LandingIndex } from '@/components/landing/LandingIndex';

export const revalidate = 300;

/**
 * The Arabic hub, mirroring /legal-services.
 *
 * Same slugs either side, as everywhere else on this site — TranslatePress
 * never had slug translation on, so /ar/legal-services/contract-drafting
 * matches /legal-services/contract-drafting.
 *
 * noindex for the same reason the English one is: each page duplicates an
 * Arabic service page that already ranks.
 */
export const metadata: Metadata = {
  title: 'الخدمات القانونية في الإمارات',
  description:
    'التقاضي وتأسيس الشركات وصياغة العقود ومنازعات الشركاء وقضايا العمل والعقارات — يتولاها محامون مرخّصون في أبوظبي ودبي.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/ar/legal-services' },
};

export default async function ArabicLegalServicesIndex() {
  const [pages, areas] = await Promise.all([getAllLandings('ar'), getPracticeAreas('ar')]);
  const serviceCount = areas.reduce((n, a) => n + a.children.length, 0);

  return <LandingIndex pages={pages} serviceCount={serviceCount} locale="ar" />;
}
