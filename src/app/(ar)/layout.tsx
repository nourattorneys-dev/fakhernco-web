import type { Metadata } from 'next';
import { Sarabun, Roboto_Condensed, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { GoogleTag } from '@/components/analytics/GoogleTag';
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

/**
 * The Arabic face.
 *
 * Sarabun and Roboto Condensed carry no Arabic glyphs — with only the `latin`
 * subset loaded, every Arabic character was falling back to whatever the
 * system happened to provide, which is inconsistent across platforms and
 * usually badly matched to the Latin type.
 *
 * IBM Plex Sans Arabic is the closest counterpart to the brand's humanist
 * sans: same generation, similar proportions, and a weight range that covers
 * the display sizes.
 */
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'مكتب فاخر ومشاركوه — خدمات قانونية في الإمارات',
    template: '%s — مكتب فاخر ومشاركوه',
  },
  description:
    'متخصصون في التقاضي في دولة الإمارات منذ 2011. تسوية النزاعات، صياغة العقود، تأسيس الشركات وخدمات كاتب العدل الخاص.',
  openGraph: {
    type: 'website',
    locale: 'ar_AE',
    siteName: 'Fakher & Co',
  },
};

/**
 * Arabic root layout — right-to-left.
 *
 * There are TWO root layouts — this and (ar) — because <html lang> and
 * <html dir> can only be set in a root layout, and a layout cannot see the
 * pathname. Reading the locale from a header via headers() does work, but it
 * opts the entire route tree into dynamic rendering: every page went from
 * static to server-rendered on demand, which is the whole performance win
 * this migration exists for. Route groups keep both locales fully static.
 */
export default function ArabicRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${sarabun.variable} ${robotoCondensed.variable} ${plexArabic.variable}`}>
      <body>
        <JsonLd data={graph(organizationSchema(), websiteSchema('ar'))} />
        <UtilityBar />
        <Header locale="ar" />
        <main>{children}</main>
        <Footer locale="ar" />
        {/* Last in the DOM: it is supplementary, so it should not sit between
            the main content and the footer for a screen-reader user. */}
        <WhatsAppButton locale="ar" />
        <GoogleTag />
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
          <span className="font-semibold">السبت – الجمعة</span>
          <span className="text-white/55">8 صباحاً – 8 مساءً</span>
        </span>
        {/* The label drops below sm so the city is not cut off — see the note
            in the English layout. */}
        <span className="flex items-center gap-2">
          <span aria-hidden className="text-white/40">⌖</span>
          <span className="hidden font-semibold sm:inline">المقر الرئيسي</span>
          <span className="text-white/55 sm:hidden">أبوظبي، الإمارات</span>
          <span className="hidden text-white/55 sm:inline">
            مكتب 219، ريجس، الطابق الثاني، فندق كورتيارد ماريوت، شارع المطار، أبوظبي
          </span>
        </span>
      </div>
    </div>
  );
}
