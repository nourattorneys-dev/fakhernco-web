import type { Metadata } from 'next';
import { Sarabun, Roboto_Condensed } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { JsonLd } from '@/components/JsonLd';
import { graph, organizationSchema, websiteSchema } from '@/lib/schema';
import '../globals.css';

const SITE = process.env.SITE_URL ?? 'https://fakhernco.com';

/**
 * The brand faces, self-hosted.
 *
 * The WordPress site pulls these from fonts.googleapis.com with every weight
 * from 100-900 plus italics, for four families — a render-blocking request for
 * far more than it uses. next/font self-hosts, subsets, and inlines @font-face
 * with size-adjust metrics so there is no layout shift.
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
    // Imported metaTitles already had "- Fakher & Co" stripped, so the
    // template appends the brand exactly once.
    default: 'Fakher & Co — Expert Legal Services in the UAE',
    template: '%s — Fakher & Co',
  },
  description:
    'Trusted litigation specialists in the UAE since 2011. Dispute resolution, contract drafting, company formation and private notary services. Offices in Abu Dhabi, Egypt and India.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Fakher & Co',
  },
};

/**
 * English root layout.
 *
 * There are TWO root layouts — this and (ar) — because <html lang> and
 * <html dir> can only be set in a root layout, and a layout cannot see the
 * pathname. Reading the locale from a header via headers() does work, but it
 * opts the entire route tree into dynamic rendering: every page went from
 * static to server-rendered on demand, which is the whole performance win
 * this migration exists for. Route groups keep both locales fully static.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${sarabun.variable} ${robotoCondensed.variable}`}>
      <body>
        <JsonLd data={graph(organizationSchema(), websiteSchema())} />
        <UtilityBar />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

/** The dark strip above the header, as on the live site. */
function UtilityBar() {
  return (
    <div className="bg-bar text-white">
      <div className="site-container flex h-9 items-center gap-6 overflow-x-auto text-xs whitespace-nowrap">
        <span className="flex items-center gap-2">
          <span aria-hidden className="text-white/40">◷</span>
          <span className="font-semibold">Monday – Friday</span>
          <span className="text-white/55">9AM – 6PM</span>
        </span>
        <span className="hidden items-center gap-2 sm:flex">
          <span aria-hidden className="text-white/40">⌖</span>
          <span className="font-semibold">Main Office</span>
          <span className="text-white/55">
            219 Office, Regus, 2nd Floor Court Marriot Hotel, Airport St, Abu Dhabi, UAE
          </span>
        </span>
      </div>
    </div>
  );
}
