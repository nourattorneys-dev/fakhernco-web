/**
 * JSON-LD graph.
 *
 * The WordPress site already emits decent structured data (LegalService,
 * Service, OfferCatalog, BreadcrumbList, OpeningHours, GeoCoordinates), so
 * this has to match it or the migration loses ground. It extends it with
 * per-office LocalBusiness, Article for insights, and FAQPage wherever a page
 * actually carries an FAQ block.
 */

import { DEFAULT_LOCALE, LOCALE_LANG_TAG, pathIn, type Locale } from './locale';
import { PHONE } from './contact';
import type { Block, Doc } from './content';
import { SITE } from './site';

const ORG_ID = `${SITE}/#organization`;
const SITE_ID = `${SITE}/#website`;

export const OFFICES = [
  {
    city: 'Abu Dhabi', country: 'AE',
    street: '219 Office, Regus, 2nd Floor Court Marriot Hotel, Airport St',
    phone: `+${PHONE.E164}`,
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
      // Sunday to Thursday, per the firm's own contact page. The site said
      // Monday to Friday everywhere, which is the Western week, not theirs —
      // and in structured data a wrong opening time shows in Google's own
      // business panel, telling people the office is shut when it is open.
      // Open six days, closed Sunday. Structured data feeds Google's business
      // panel, so a wrong day here tells a searcher the office is shut when it
      // is open — or open when nobody is there.
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '08:00',
      closes: '20:00',
    },
  };
}

/**
 * `locale` is not decoration: the Arabic pages were emitting inLanguage:"en",
 * which tells search engines the Arabic site is English and undercuts the
 * hreflang cluster it sits in.
 */
export function websiteSchema(locale: Locale = DEFAULT_LOCALE) {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: SITE,
    name: SITE_NAME[locale],
    publisher: { '@id': ORG_ID },
    inLanguage: LOCALE_LANG_TAG[locale],
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

/**
 * `locale` decides the entity's identity, not just its label.
 *
 * These nodes built their @id from the bare slug, so an Arabic page emitted a
 * node whose @id was the ENGLISH URL. The English page emitted a node with the
 * same @id and English name/description — two conflicting definitions of one
 * schema.org entity, published on two separately indexed URLs. The Arabic
 * pages are also the ones whose breadcrumbs were already correctly /ar
 * prefixed, which made the @id the odd one out.
 *
 * `url` is set for the same reason: without it @id was the only URL a consumer
 * could attach the node to.
 */
/*
  Tables, not ternaries.

  `locale === 'ar' ? … : …` reads as a choice between two languages and is
  actually "Arabic, or else English" — so a third locale silently inherits every
  English value. For @id that is not a cosmetic bug: two locales sharing an @id
  tells a consumer they are the same entity, which is the exact mistake the
  inLanguage comment above records having already been made once.

  Record<Locale, …> turns adding a locale into a compile error here instead.
*/
const localePath = (slug: string, locale: Locale) => pathIn(`/${slug}`, locale);

const langTag = (locale: Locale) => LOCALE_LANG_TAG[locale];

const SITE_NAME: Record<Locale, string> = {
  en: 'Fakher & Co',
  ar: 'مكتب فاخر ومشاركوه',
  /*
    The same as English, deliberately — the firm has no German trading name.
    Spelled out rather than defaulted so the next reader does not mistake it for
    an unfilled placeholder and invent one.
  */
  de: 'Fakher & Co',
};

export function articleSchema(doc: Doc, description: string, locale: Locale = 'en') {
  const path = localePath(doc.slug, locale);
  return {
    '@type': 'Article',
    '@id': `${SITE}${path}#article`,
    headline: doc.title,
    description,
    datePublished: doc.publishedDate ?? undefined,
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    mainEntityOfPage: `${SITE}${path}`,
    inLanguage: langTag(locale),
  };
}

export function serviceSchema(doc: Doc, description: string, locale: Locale = 'en') {
  const path = localePath(doc.slug, locale);
  return {
    '@type': 'Service',
    '@id': `${SITE}${path}#service`,
    url: `${SITE}${path}`,
    name: doc.title,
    description,
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: 'United Arab Emirates' },
    serviceType: doc.practiceArea?.title ?? 'Legal service',
    inLanguage: langTag(locale),
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
