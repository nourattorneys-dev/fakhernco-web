import type { Metadata } from 'next';
import Link from 'next/link';
import { describe, getPage, getPracticeAreas, localesFor } from '@/lib/content';
import { alternatesFor, pathIn } from '@/lib/locale';
import { ContactForm } from '@/components/ContactForm';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbSchema, graph } from '@/lib/schema';
import { t } from '@/lib/ui';

export const revalidate = 300;

/**
 * The German contact page.
 *
 * A literal route rather than letting /de/contact-us fall through to [slug].
 * That fall-through is what happened to Arabic: the generic template renders
 * the migrated content blocks, and those contain no form — so Arabic visitors
 * could not contact the firm at all, while the Arabic copy told them to fill in
 * an online form that was not on the page. German starts with the route it
 * needs rather than discovering that later.
 *
 * Because a literal segment beats [slug], this file also has to render the CMS
 * page's own metadata or it would simply disappear.
 */
const OFFICES = [
  {
    city: 'Abu Dhabi',
    country: 'Vereinigte Arabische Emirate',
    address: 'Büro 219, Regus, 2. Etage, Courtyard Marriott Hotel, Airport St, Abu Dhabi',
    phones: ['+971 55 668 8646', '+971 50 205 7209'],
  },
  {
    city: 'Mansura',
    country: 'Ägypten',
    address: 'Büro 301, 3. Etage, gegenüber McDonald’s, Universitätskomplex, Mansura',
    phones: ['+20 103 403 4101'],
  },
  {
    city: 'Neu-Delhi',
    country: 'Indien',
    address: '2, Asset Area, Novotel Pullman Hotel, Northern Access Road, 5. Etage, Neu-Delhi',
    phones: ['+91 628 275 1175'],
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('contact-us', 'de');
  return {
    title: page?.seo?.metaTitle || page?.title || 'Kontakt',
    description: page
      ? describe(page)
      : 'Nehmen Sie Kontakt mit Fakher & Co zu Ihrem rechtlichen Anliegen auf.',
    alternates: alternatesFor('/de/contact-us', await localesFor('/contact-us')),
  };
}

export default async function GermanContactPage() {
  const [page, areas] = await Promise.all([getPage('contact-us', 'de'), getPracticeAreas('de')]);
  const s = t('de');

  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbSchema([
            { name: s.home, path: pathIn('/', 'de') },
            { name: page?.title ?? s.contact, path: pathIn('/contact-us', 'de') },
          ]),
        )}
      />

      <header className="border-b border-line">
        <div className="site-container section-tight">
          <p className="eyebrow text-ink">{s.contact}</p>
          <h1 className="mt-4 max-w-[24ch] text-display">{page?.title ?? s.contact}</h1>
          <p className="mt-5 max-w-[56ch] text-lead text-body">{s.contactLead}</p>
        </div>
      </header>

      <div className="site-container section grid gap-16 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <h2 className="sr-only">{s.formHeading}</h2>
          <ContactForm locale="de" services={areas.map((a) => a.title)} />
        </div>

        <aside className="flex flex-col gap-9">
          <h2 className="text-section">{s.officeLocations}</h2>
          {OFFICES.map((office) => (
            <div key={office.city} className="border-t border-line pt-5">
              <h3 className="font-display text-base font-700">
                {office.city}
                <span className="ms-2 text-sm font-400 text-muted">{office.country}</span>
              </h3>
              <p className="mt-2 text-sm text-body">{office.address}</p>
              <ul className="mt-2 flex flex-col gap-0.5 text-sm">
                {office.phones.map((phone) => (
                  <li key={phone}>
                    <a
                      href={`tel:${phone.replace(/\s/g, '')}`}
                      className="underline decoration-faint underline-offset-2 hover:decoration-ink"
                    >
                      {phone}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="border-t border-line pt-5 text-sm text-body">
            <p className="font-display font-600 text-ink">{s.officeHours}</p>
            <p className="mt-1">{s.hoursValue}</p>
          </div>
        </aside>
      </div>

      <section className="bg-ink">
        <div className="site-container section-tight flex flex-wrap items-center justify-between gap-8">
          <h2 className="max-w-[26ch] text-section text-white">{s.speakToLawyer}</h2>
          <Link
            href={pathIn('/', 'de')}
            className="border border-white/60 px-8 py-4 font-display text-sm font-700 text-white transition-colors hover:bg-white hover:text-ink"
          >
            {s.home}
          </Link>
        </div>
      </section>
    </>
  );
}
