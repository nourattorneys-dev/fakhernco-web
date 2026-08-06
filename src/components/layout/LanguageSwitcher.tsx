'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOCALE_LABEL, localeOf, pathIn } from '@/lib/locale';

/**
 * Language switcher.
 *
 * Renders nothing unless the current page genuinely has a version in the other
 * locale. `translated` is the set of paths that do, resolved on the server —
 * so this never offers a link into a 404, which is what the WordPress site
 * does today for every page TranslatePress has not covered.
 *
 * A real link, not a JavaScript toggle: crawlable, and it keeps the reader on
 * the page they were looking at rather than dumping them on the homepage.
 */
export function LanguageSwitcher({ translated }: { translated: string[] }) {
  const pathname = usePathname() ?? '/';
  const current = localeOf(pathname);
  const other = current === 'en' ? 'ar' : 'en';

  // Always allow returning to English; only offer Arabic where it exists.
  const target = pathIn(pathname, other);
  const available = other === 'en' || new Set(translated).has(target);
  if (!available) return null;

  return (
    <Link
      href={target}
      hrefLang={other}
      lang={other}
      dir={other === 'ar' ? 'rtl' : 'ltr'}
      aria-label={`Switch to ${other === 'ar' ? 'Arabic' : 'English'}`}
      className="hidden shrink-0 border border-line px-3.5 py-2 font-display text-sm font-600 text-ink transition-colors hover:border-ink lg:inline-block"
    >
      {LOCALE_LABEL[other]}
    </Link>
  );
}
