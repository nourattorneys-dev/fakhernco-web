import type { Metadata } from 'next';
import Link from 'next/link';
import { describe, getPage, getPracticeAreas, localesFor } from '@/lib/content';
import { alternatesFor } from '@/lib/locale';
import { ContactForm } from '@/components/ContactForm';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbSchema, graph } from '@/lib/schema';
import { t } from '@/lib/ui';

export const revalidate = 300;

/**
 * The Arabic contact page.
 *
 * Without this route /ar/contact-us fell through to the generic [slug]
 * template, which renders the migrated content blocks — and those contain no
 * form. Arabic visitors could not contact the firm at all, while the Arabic
 * copy told them to "fill in the online contact form" that was not there.
 *
 * A literal segment beats [slug], so this file also has to render the CMS
 * page's own metadata rather than letting it disappear.
 */
const OFFICES = [
  {
    city: 'أبوظبي',
    country: 'الإمارات العربية المتحدة',
    address: 'مكتب ٢١٩، ريجس، الطابق الثاني، فندق كورتيارد ماريوت، شارع المطار، أبوظبي',
    phones: ['+971 55 668 8646', '+971 50 205 7209'],
  },
  {
    city: 'المنصورة',
    country: 'مصر',
    address: 'مكتب ٣٠١، الطابق الثالث، أمام ماكدونالدز، المجمع الجامعي، المنصورة',
    phones: ['+20 103 403 4101'],
  },
  {
    city: 'نيودلهي',
    country: 'الهند',
    address: '٢، أسيت إيريا، فندق نوفوتيل بولمان، طريق الوصول الشمالي، الطابق الخامس، نيودلهي',
    phones: ['+91 628 275 1175'],
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('contact-us', 'ar');
  return {
    title: page?.seo?.metaTitle || page?.title || 'تواصل معنا',
    description: page ? describe(page) : 'تواصل مع مكتب فاخر ومشاركوه بشأن قضيتك القانونية.',
    alternates: alternatesFor('/ar/contact-us', await localesFor('/contact-us')),
  };
}

export default async function ArabicContactPage() {
  const [page, areas] = await Promise.all([getPage('contact-us', 'ar'), getPracticeAreas('ar')]);
  const s = t('ar');

  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbSchema([
            { name: s.home, path: '/ar' },
            { name: page?.title ?? s.contact, path: '/ar/contact-us' },
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
          <ContactForm locale="ar" services={areas.map((a) => a.title)} />
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
            href="/ar"
            className="border border-white/60 px-8 py-4 font-display text-sm font-700 text-white transition-colors hover:bg-white hover:text-ink"
          >
            {s.home}
          </Link>
        </div>
      </section>
    </>
  );
}
