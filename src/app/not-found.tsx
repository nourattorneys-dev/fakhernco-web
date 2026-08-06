import Link from 'next/link';

/**
 * A real 404. On the previous migration not-found.tsx called redirect('/'),
 * which returns HTTP 200 — every unknown URL was a soft 404 for months.
 */
export default function NotFound() {
  return (
    <div className="site-container flex min-h-[50vh] flex-col items-start justify-center py-20">
      <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-brass">Error 404</p>
      <h1 className="mt-3 text-3xl">This page could not be found</h1>
      <p className="mt-3 max-w-lg text-body">
        The page may have moved. You can browse our services or get in touch and we will point you
        in the right direction.
      </p>
      <div className="mt-7 flex gap-3">
        <Link href="/" className="rounded-sm bg-ink px-5 py-2.5 text-sm text-white hover:bg-navy">
          Back to home
        </Link>
        <Link href="/contact-us" className="rounded-sm border border-line px-5 py-2.5 text-sm hover:border-brass">
          Contact us
        </Link>
      </div>
    </div>
  );
}
