import type { Metadata } from 'next';
import { Sarabun, Roboto_Condensed } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { GoogleTag } from '@/components/analytics/GoogleTag';
import { JsonLd } from '@/components/JsonLd';
import { UtilityBar } from '@/components/layout/UtilityBar';
import { graph, organizationSchema, websiteSchema } from '@/lib/schema';
import { LOCALE_DIR } from '@/lib/locale';
import '../globals.css';
import { SITE } from '@/lib/site';

/**
 * The brand faces.
 *
 * Two Latin families only — DERIVED FROM (en), NOT (ar). The Arabic layout also
 * loads IBM Plex Sans Arabic, and a German page would ship every one of those
 * glyphs without using a single one.
 *
 * `subsets: ['latin']` covers ä ö ü ß. German uses no character above U+00FF,
 * so `latin-ext` (U+0100–U+02BA) would buy nothing and cost ~500 glyphs. Said
 * plainly here so the next person does not add it on a hunch.
 */
const sarabun = Sarabun({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sarabun',
  display: 'swap',
});

const robotoCondensed = Roboto_Condensed({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-roboto-condensed',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Fakher & Co — Juristische Expertise in den VAE',
    template: '%s — Fakher & Co',
  },
  description:
    'Spezialisten für Prozessführung in den VAE seit 2011. Streitbeilegung, Vertragsgestaltung, Unternehmensgründung und private Notardienste. Büros in Abu Dhabi, Ägypten und Indien.',
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'Fakher & Co',
  },
};

/**
 * German root layout.
 *
 * There are THREE root layouts — this, (en) and (ar) — because <html lang> and
 * <html dir> can only be set in a root layout, and a layout cannot see the
 * pathname. Reading the locale from a header via headers() does work, but it
 * opts the entire route tree into dynamic rendering: every page went from
 * static to server-rendered on demand, which is the whole performance win this
 * migration exists for. Route groups keep every locale fully static.
 *
 * dir comes from LOCALE_DIR rather than a literal. The RTL typography block in
 * globals.css is keyed on [dir='rtl'], so a German page with dir="ltr" keeps
 * the Latin faces and never reaches it — no CSS change was needed for German.
 */
export default function GermanRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="de"
      dir={LOCALE_DIR.de}
      className={`${sarabun.variable} ${robotoCondensed.variable}`}
    >
      <body>
        <JsonLd data={graph(organizationSchema(), websiteSchema('de'))} />
        <UtilityBar locale="de" />
        <Header locale="de" />
        <main>{children}</main>
        <Footer locale="de" />
        {/* Last in the DOM: it is supplementary, so it should not sit between
            the main content and the footer for a screen-reader user. */}
        <WhatsAppButton locale="de" />
        <GoogleTag />
      </body>
    </html>
  );
}
