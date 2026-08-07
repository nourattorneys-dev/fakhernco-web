import type { Metadata } from 'next';
import { Homepage } from '@/components/home/Homepage';
import { getPage } from '@/lib/content';
import { alternatesFor } from '@/lib/locale';

export const revalidate = 300;

/**
 * The Arabic homepage.
 *
 * This used to redirect to English. /ar/ on the WordPress site was only
 * fractionally translated — TranslatePress had done the buttons and six
 * headings, and left all 43 paragraphs in English — so importing it would
 * have produced a half-English homepage, which reads as neglect on the page
 * most Arabic visitors land on first.
 *
 * The copy has now been written (migration/data/translations/home.ar.json in
 * the CMS repo), so there is a real page to serve and the redirect is gone.
 */
export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('home', 'ar');
  return {
    title: page?.seo?.metaTitle ?? page?.title ?? undefined,
    description: page?.seo?.metaDescription ?? undefined,
    alternates: alternatesFor('/ar', true),
    openGraph: {
      title: page?.seo?.metaTitle ?? page?.title ?? undefined,
      description: page?.seo?.metaDescription ?? undefined,
      locale: 'ar_AE',
      type: 'website',
    },
  };
}

export default function ArabicHomePage() {
  return <Homepage locale="ar" />;
}
