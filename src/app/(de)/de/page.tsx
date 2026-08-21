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
    /*
      noindex until there is a German homepage to index.

      The route exists so the German section can be built and reviewed, but with
      no CMS content the Homepage component renders an EMPTY <h1> and about
      forty characters of body — the hero title, the section copy and the
      article strip all come from Strapi. Letting Google index that is worse
      than 404ing: a blank page under the firm's own brand, with an empty
      heading, competing with pages that do say something.

      `follow` stays on so the German chrome's links are still crawled, and this
      lifts itself the moment the homepage is translated. Nothing to remember.
    */
    robots: page ? undefined : { index: false, follow: true },
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
