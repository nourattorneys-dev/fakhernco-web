import type { Metadata } from 'next';
import { describe, getPage, getPracticeAreas } from '@/lib/content';
import { alternatesFor } from '@/lib/locale';
import { ContactForm } from '@/components/ContactForm';

export const revalidate = 300;

const OFFICES = [
  {
    city: 'Abu Dhabi', country: 'United Arab Emirates',
    address: '219 Office, Regus, 2nd Floor Court Marriot Hotel, Airport St, Abu Dhabi',
    phones: ['+971 55 668 8646', '+971 50 205 7209'],
  },
  {
    city: 'Mansoura', country: 'Egypt',
    address: '301 Office, 3rd Floor, Same MacDonalds Bld, University Complex, Mansoura',
    phones: ['+20 103 403 4101'],
  },
  {
    city: 'New Delhi', country: 'India',
    address: '2, Asset Area, Novotel Pullman Hotel, Northern Access Rd, 5th Floor, New Delhi 110037',
    phones: ['+91 628 275 1175'],
  },
];

/** Literal route — shadows [slug], so it renders the CMS page's metadata itself. */
export async function generateMetadata(): Promise<Metadata> {
  const [page, areas] = await Promise.all([getPage('contact-us'), getPracticeAreas()]);
  return {
    title: page?.seo?.metaTitle || 'Contact Us',
    description: page
      ? describe(page)
      : 'Speak to Fakher & Co about your legal matter. Offices in Abu Dhabi, Mansoura and New Delhi.',
    alternates: alternatesFor('/contact-us', true),  // /ar/contact-us exists in Arabic
  };
}

export default async function ContactPage() {
  const [page, areas] = await Promise.all([getPage('contact-us'), getPracticeAreas()]);

  return (
    <>
      <header className="border-b border-line">
        <div className="site-container section-tight">
          <p className="eyebrow text-ink">Contact</p>
          <h1 className="mt-4 max-w-[24ch] text-display">{page?.title ?? 'Contact Us'}</h1>
          <p className="mt-5 max-w-[56ch] text-lg text-body">
            Tell us about your matter and a member of our team will respond within one business day.
          </p>
        </div>
      </header>

      <div className="site-container section grid gap-16 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <h2 className="sr-only">Enquiry form</h2>
          <ContactForm locale="en" services={areas.map((a) => a.title)} />
        </div>

        <aside className="flex flex-col gap-9">
          <h2 className="text-section">Our offices</h2>
          {OFFICES.map((o) => (
            <div key={o.city} className="border-t border-line pt-5">
              <h3 className="font-display text-base font-700">
                {o.city}
                <span className="ml-2 text-sm font-400 text-muted">{o.country}</span>
              </h3>
              <p className="mt-2 text-sm text-body">{o.address}</p>
              <ul className="mt-2 flex flex-col gap-0.5 text-sm">
                {o.phones.map((p) => (
                  <li key={p}>
                    <a
                      href={`tel:${p.replace(/\s/g, '')}`}
                      className="underline decoration-faint underline-offset-2 hover:decoration-ink"
                    >
                      {p}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="border-t border-line pt-5 text-sm text-body">
            <p className="font-display font-600 text-ink">Office hours</p>
            <p className="mt-1">Sunday – Thursday, 9AM – 6PM (GST)</p>
          </div>
        </aside>
      </div>
    </>
  );
}
