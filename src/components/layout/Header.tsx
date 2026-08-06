import Link from 'next/link';
import { getPracticeAreas } from '@/lib/content';

/**
 * Site header with the services mega-menu.
 *
 * The five pillars and their 44 children come from the CMS, so the navigation
 * cannot drift out of sync with what actually exists — a page linked in the
 * menu but missing from the route tree was one of the failures on the previous
 * migration.
 *
 * CSS-only disclosure (group-hover + focus-within) so it works without
 * JavaScript and stays keyboard reachable.
 */
export async function Header() {
  const areas = await getPracticeAreas();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur">
      <div className="site-container flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Fakher &amp; Co
          </span>
          <span className="text-2xs uppercase tracking-[0.14em] text-brass">
            Trusted Litigation Specialists
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 text-sm lg:flex">
          <Link href="/about-us" className="hover:text-ink">
            About
          </Link>

          <div className="group relative">
            <Link
              href="/services"
              className="flex items-center gap-1 py-5 hover:text-ink"
              aria-haspopup="true"
            >
              Services
              <span aria-hidden className="text-[0.6rem] text-muted">▾</span>
            </Link>

            <div className="invisible absolute left-1/2 top-full w-[52rem] max-w-[92vw] -translate-x-1/2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="grid grid-cols-2 gap-x-8 gap-y-6 rounded-md border border-line bg-surface p-6 shadow-lg xl:grid-cols-3">
                {areas.map((area) => (
                  <div key={area.slug}>
                    <Link
                      href={`/${area.slug}`}
                      className="block border-b border-line-soft pb-1.5 text-xs font-semibold uppercase tracking-wide text-ink hover:text-brass"
                    >
                      {area.title}
                    </Link>
                    <ul className="mt-2 flex flex-col gap-1">
                      {area.children.slice(0, 10).map((child) => (
                        <li key={child.slug}>
                          <Link
                            href={`/${child.slug}`}
                            className="block text-[0.8125rem] leading-snug text-body hover:text-navy"
                          >
                            {child.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Link href="/legal-insights" className="hover:text-ink">
            Insights
          </Link>
          <Link
            href="/contact-us"
            className="rounded-sm bg-ink px-4 py-2 text-white transition-colors hover:bg-navy"
          >
            Contact
          </Link>
        </nav>

        <Link href="/contact-us" className="text-sm underline lg:hidden">
          Contact
        </Link>
      </div>
    </header>
  );
}
