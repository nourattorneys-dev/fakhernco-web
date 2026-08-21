import Link from 'next/link';
import { pathIn, type Locale } from '@/lib/locale';
import { t } from '@/lib/ui';

/**
 * A real 404, in a given locale.
 *
 * On the previous migration not-found.tsx called redirect('/'), which returns
 * HTTP 200 — every unknown URL was a soft 404 for months.
 *
 * The Arabic copy of this was byte-identical to the English one: an Arabic
 * reader who mistyped a URL got an English page inside a correct RTL shell, and
 * both escape links pointed at English routes, which dropped them out of the
 * locale entirely. Sharing one component keyed on locale is what stops a third
 * language repeating it.
 *
 * The escape links go to the locale's own home and contact page, and are built
 * with pathIn rather than written out. They deliberately carry no availability
 * check: /contact-us exists in every locale the site ships, and the pages this
 * component links to are the two that are guaranteed to.
 */
export function LocaleNotFound({ locale }: { locale: Locale }) {
  const s = t(locale);

  return (
    <div className="site-container flex min-h-[50vh] flex-col items-start justify-center py-20">
      <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-muted">{s.errorCode}</p>
      <h1 className="mt-3 text-3xl">{s.notFoundTitle}</h1>
      <p className="mt-3 max-w-lg text-body">{s.notFoundBody}</p>
      <div className="mt-7 flex gap-3">
        <Link
          href={pathIn('/', locale)}
          className="bg-ink px-5 py-2.5 text-sm text-white hover:bg-ink-2"
        >
          {s.backToHome}
        </Link>
        <Link
          href={pathIn('/contact-us', locale)}
          className="border border-line px-5 py-2.5 text-sm hover:border-ink"
        >
          {s.contactUs}
        </Link>
      </div>
    </div>
  );
}
