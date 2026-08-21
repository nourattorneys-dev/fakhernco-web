import { Homepage } from '@/components/home/Homepage';
import { alternatesFor } from '@/lib/locale';
import { localesFor } from '@/lib/content';

export const revalidate = 300;

/**
 * The homepage had no canonical tag — caught by verify:seo. Every other route
 * sets one in generateMetadata; the homepage has none because it has no
 * generateMetadata at all, so it inherits the layout's, which omits it.
 */
export const metadata = {
  // The Arabic homepage now genuinely exists, so this can finally claim it.
  alternates: alternatesFor('/', await localesFor('/')),
};

export default function HomePage() {
  return <Homepage locale="en" />;
}
