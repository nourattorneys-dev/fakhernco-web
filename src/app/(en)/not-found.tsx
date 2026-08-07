import Link from 'next/link';
import { t } from '@/lib/ui';

/**
 * A real 404. On the previous migration not-found.tsx called redirect('/'),
 * which returns HTTP 200 — every unknown URL was a soft 404 for months.
 *
 * Reads the same string table as the Arabic copy so the two cannot drift; the
 * Arabic one had been a byte-identical clone of this file, English copy and
 * English links included.
 */
export default function NotFound() {
  const s = t('en');

  return (
    <div className="site-container flex min-h-[50vh] flex-col items-start justify-center py-20">
      <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-muted">{s.errorCode}</p>
      <h1 className="mt-3 text-3xl">{s.notFoundTitle}</h1>
      <p className="mt-3 max-w-lg text-body">{s.notFoundBody}</p>
      <div className="mt-7 flex gap-3">
        <Link href="/" className="bg-ink px-5 py-2.5 text-sm text-white hover:bg-ink-2">
          {s.backToHome}
        </Link>
        <Link href="/contact-us" className="border border-line px-5 py-2.5 text-sm hover:border-ink">
          {s.contactUs}
        </Link>
      </div>
    </div>
  );
}
