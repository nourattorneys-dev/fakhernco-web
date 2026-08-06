import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const SITE = process.env.SITE_URL ?? 'https://fakhernco.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    // `default` and `template` are separate on purpose: imported metaTitles
    // already had "- Fakher & Co" stripped, so the template appends the brand
    // exactly once instead of producing "Brand | Page - Brand".
    default: 'Fakher & Co — Trusted Litigation Specialists in the UAE',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
