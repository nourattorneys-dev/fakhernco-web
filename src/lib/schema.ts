/**
 * JSON-LD graph.
 *
 * The WordPress site already emits decent structured data (LegalService,
 * Service, OfferCatalog, BreadcrumbList, OpeningHours, GeoCoordinates), so
 * this has to match it or the migration loses ground. It extends it with
 * per-office LocalBusiness, Article for insights, and FAQPage wherever a page
 * actually carries an FAQ block.
 */

import type { Block, Doc } from './content';

const SITE = process.env.SITE_URL ?? 'https://fakhernco.com';

const ORG_ID = `${SITE}/#organization`;
const SITE_ID = `${SITE}/#website`;

export const OFFICES = [
  {
    city: 'Abu Dhabi', country: 'AE',
    street: '219 Office, Regus, 2nd Floor Court Marriot Hotel, Airport St',
    phone: '+971502057209',
  },
  {
    city: 'Mansoura', country: 'EG',
    street: '301 Office, 3rd Floor, Same MacDonalds Bld, University Complex',
    phone: '+201034034101',
  },
  {
    city: 'New Delhi', country: 'IN',
    street: '2, Asset Area, Novotel Pullman Hotel, Northern Access Rd, 5th Floor',
    phone: '+916282751175',
  },
];

export function organizationSchema() {
  return {
    '@type': 'LegalService',
    '@id': ORG_ID,
    name: 'Fakher & Co',
    alternateName: 'مكتب فاخر ومشاركوه',
    url: SITE,
    description:
      'Trusted litigation specialists in the UAE since 2011, providing dispute resolution, contract drafting, company formation and private notary services.',
    foundingDate: '2011',
    areaServed: [
      { '@type': 'Country', name: 'United Arab Emirates' },
      { '@type': 'Country', name: 'Egypt' },
      { '@type': 'Country', name: 'India' },
    ],
    address: OFFICES.map((o) => ({
      '@type': 'PostalAddress',
      streetAddress: o.street,
      addressLocality: o.city,
      addressCountry: o.country,
    })),
    telephone: OFFICES.map((o) => o.phone),
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
  };
}

/**
 * `locale` is not decoration: the Arabic pages were emitting inLanguage:"en",
 * which tells search engines the Arabic site is English and undercuts the
 * hreflang cluster it sits in.
 */
export function websiteSchema(locale: 'en' | 'ar' = 'en') {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: SITE,
    name: locale === 'ar' ? 'مكتب فاخر ومشاركوه' : 'Fakher & Co',
    publisher: { '@id': ORG_ID },
    inLanguage: locale === 'ar' ? 'ar-AE' : 'en-AE',
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE}${item.path}`,
    })),
  };
}

export function articleSchema(doc: Doc, description: string) {
  return {
    '@type': 'Article',
    '@id': `${SITE}/${doc.slug}#article`,
    headline: doc.title,
    description,
    datePublished: doc.publishedDate ?? undefined,
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    mainEntityOfPage: `${SITE}/${doc.slug}`,
    inLanguage: 'en',
  };
}

export function serviceSchema(doc: Doc, description: string) {
  return {
    '@type': 'Service',
    '@id': `${SITE}/${doc.slug}#service`,
    name: doc.title,
    description,
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: 'United Arab Emirates' },
    serviceType: doc.practiceArea?.title ?? 'Legal service',
  };
}

/** Only emitted when the page genuinely has an FAQ block. */
export function faqSchema(blocks: Block[]) {
  const faq = blocks.find((b) => b.type === 'faq');
  if (!faq || faq.type !== 'faq' || faq.items.length === 0) return null;

  return {
    '@type': 'FAQPage',
    mainEntity: faq.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export const graph = (...nodes: (object | null)[]) => ({
  '@context': 'https://schema.org',
  '@graph': nodes.filter(Boolean),
});
