import type { Metadata } from 'next';
import { getAllLandings, getPracticeAreas } from '@/lib/content';
import { LandingIndex } from '@/components/landing/LandingIndex';

export const revalidate = 300;

/**
 * The hub for the campaign pages.
 *
 * STILL noindex, and deliberately.
 * Every page it links to duplicates a service page that already ranks
 * organically, and so does this hub against /services. Presenting it properly
 * is about the visitor who arrives; it is not an argument for indexing it.
 *
 * The markup lives in LandingIndex so the Arabic route at /ar/legal-services
 * renders the identical page rather than a second copy that drifts.
 */
export const metadata: Metadata = {
  title: 'Legal Services in the UAE',
  description:
    'Litigation, company formation, contracts, shareholder disputes, labour and property matters — handled by UAE-qualified lawyers in Abu Dhabi and Dubai.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/legal-services' },
};

export default async function LegalServicesIndex() {
  const [pages, areas] = await Promise.all([getAllLandings('en'), getPracticeAreas()]);
  const serviceCount = areas.reduce((n, a) => n + a.children.length, 0);

  return <LandingIndex pages={pages} serviceCount={serviceCount} locale="en" />;
}
