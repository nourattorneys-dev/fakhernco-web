import type { Metadata } from 'next';
import { getAllLandings, getPracticeAreas } from '@/lib/content';
import { LandingIndex } from '@/components/landing/LandingIndex';

export const revalidate = 300;

/**
 * The German hub, mirroring /legal-services.
 *
 * Same slugs as English and Arabic. noindex for the same reason both of those
 * are: each page duplicates a service page that already ranks organically, and
 * these exist for paid traffic.
 */
export const metadata: Metadata = {
  title: 'Rechtsberatung in den VAE',
  description:
    'Prozessführung, Unternehmensgründung, Vertragsgestaltung, Arbeits- und Immobilienrecht — zugelassene Anwälte in Abu Dhabi und Dubai.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/de/legal-services' },
};

export default async function GermanLegalServicesIndex() {
  const [pages, areas] = await Promise.all([getAllLandings('de'), getPracticeAreas('de')]);
  const serviceCount = areas.reduce((n, a) => n + a.children.length, 0);

  return <LandingIndex pages={pages} serviceCount={serviceCount} locale="de" />;
}
