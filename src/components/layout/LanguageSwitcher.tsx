'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_CODE,
  LOCALE_DIR,
  LOCALE_HREFLANG,
  LOCALE_LABEL,
  LOCALE_NAV_ARIA,
  LOCALE_SWITCH_ARIA,
  localeOf,
  pathIn,
  type Locale,
} from '@/lib/locale';

/**
 * Language switcher.
 *
 * Renders nothing unless the current page genuinely has a version in another
 * locale. `translated` is the set of paths that do, resolved on the server —
 * so this never offers a link into a 404, which is what the WordPress site
 * does today for every page TranslatePress has not covered.
 *
 * Real links, not a JavaScript toggle: crawlable, and they keep the reader on
 * the page they were looking at rather than dumping them on the homepage.
 *
 * One link per available locale rather than a dropdown. With three locales a
 * menu would cost a click and a focus trap to save perhaps 40px, and every
 * destination would stop being a crawlable href.
 */
export function LanguageSwitcher({
  translated,
}: {
  translated: Partial<Record<Locale, string[]>>;
}) {
  const pathname = usePathname() ?? '/';
  const current = localeOf(pathname);

  /*
    The default locale is always reachable: every page exists in English, which
    is the baseline the others are translations of. Every other locale has to
    prove the target exists before it is offered.
  */
  const others = LOCALES.filter((locale) => locale !== current)
    .map((locale) => ({ locale, target: pathIn(pathname, locale) }))
    .filter(
      ({ locale, target }) =>
        locale === DEFAULT_LOCALE || (translated[locale] ?? []).includes(target),
    );

  if (!others.length) return null;

  return (
    <div
      role="group"
      aria-label={LOCALE_NAV_ARIA[current]}
      className="flex shrink-0 items-center gap-1.5"
    >
      {others.map(({ locale, target }) => (
        <Link
          key={locale}
          href={target}
          hrefLang={LOCALE_HREFLANG[locale]}
          lang={locale}
          dir={LOCALE_DIR[locale]}
          aria-label={LOCALE_SWITCH_ARIA[current][locale]}
          /*
            Visible at every width. It used to be `hidden lg:inline-block`, and
            the footer has no switcher of its own, so below 1024px there was no
            way to change language from any page on the site — on a bilingual
            firm's site whose Arabic readers are mostly on phones.

            Below `sm` it shows the locale CODE rather than the name. One full
            name fitted the mobile header row beside the wordmark and the
            contact link; two will not.
          */
          className="shrink-0 border border-line px-2.5 py-1.5 font-display text-xs font-600 text-ink transition-colors hover:border-ink sm:px-3 lg:px-3.5 lg:py-2 lg:text-sm"
        >
          <span className="sm:hidden">{LOCALE_CODE[locale]}</span>
          <span className="hidden sm:inline">{LOCALE_LABEL[locale]}</span>
        </Link>
      ))}
    </div>
  );
}
