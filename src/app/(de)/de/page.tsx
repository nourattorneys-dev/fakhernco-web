import type { Metadata } from 'next';
import { Homepage } from '@/components/home/Homepage';
import { getPage, localesFor } from '@/lib/content';
import { alternatesFor, LOCALE_LANG_TAG } from '@/lib/locale';

export const revalidate = 300;

/** The German homepage. */
export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('home', 'de');
  return {
    title: page?.seo?.metaTitle ?? page?.title ?? undefined,
    description: page?.seo?.metaDescription ?? undefined,
    alternates: alternatesFor('/de', await localesFor('/')),
    openGraph: {
      title: page?.seo?.metaTitle ?? page?.title ?? undefined,
      description: page?.seo?.metaDescription ?? undefined,
      /*
        A page-level openGraph object REPLACES the layout's rather than merging
        into it, so anything the layout supplied has to be restated. Without
        these, 51 of the 53 Arabic URLs emitted no og:type and 52 no
        og:site_name — the same trap, written down so German does not repeat it.
      */
      locale: LOCALE_LANG_TAG.de,
      type: 'website',
      siteName: 'Fakher & Co',
    },
  };
}

export default function GermanHomePage() {
  return <Homepage locale="de" />;
}
