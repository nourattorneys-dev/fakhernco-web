import Link from 'next/link';
import Image from 'next/image';
import { getPracticeAreas, getSiteSettings } from '@/lib/content';

const WHATSAPP = '+971502057209';

/**
 * Sticky header, following the live site's structure: wordmark left, centred
 * navigation, WhatsApp call-to-action right.
 *
 * Improvements over the original: the services menu is driven by the CMS, so
 * it cannot list a page that no longer exists; it opens on focus as well as
 * hover so it is keyboard reachable; and the mobile navigation actually
 * exposes the service pages, which the original hides entirely below 980px.
 */
export async function Header() {
  const [areas, site] = await Promise.all([getPracticeAreas(), getSiteSettings()]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur-sm">
      <div className="site-container flex h-[4.5rem] items-center justify-between gap-8">
        <Wordmark logo={site.logo} name={site.siteName} />

        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          <TopLink href="/about-us">About Us</TopLink>

          <div className="group relative">
            <Link
              href="/services"
              className="flex items-center gap-1.5 py-6 font-display text-[0.9375rem] font-600 text-ink transition-opacity hover:opacity-60"
            >
              Services
              <span aria-hidden className="text-[0.55rem] text-muted">▼</span>
            </Link>

            <div className="invisible absolute left-1/2 top-full w-[58rem] max-w-[94vw] -translate-x-1/2 pt-0 opacity-0 transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="grid grid-cols-2 gap-x-10 gap-y-7 border border-line bg-surface p-8 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.35)] xl:grid-cols-3">
                {areas.map((area) => (
                  <div key={area.slug}>
                    <Link
                      href={`/${area.slug}`}
                      className="block border-b border-line pb-2 font-display text-xs font-700 uppercase tracking-[0.08em] text-ink hover:opacity-60"
                    >
                      {area.title}
                    </Link>
                    <ul className="mt-3 flex flex-col gap-1.5">
                      {area.children.map((child) => (
                        <li key={child.slug}>
                          <Link
                            href={`/${child.slug}`}
                            className="block text-[0.8125rem] leading-snug text-body transition-colors hover:text-ink"
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

          <TopLink href="/legal-insights">Legal Insights</TopLink>
          <TopLink href="/contact-us">Contact Us</TopLink>
        </nav>

        <a
          href={`https://wa.me/${WHATSAPP.replace('+', '')}`}
          className="hidden items-center gap-2 bg-ink px-5 py-2.5 font-display text-sm font-700 text-white transition-colors hover:bg-ink-2 sm:flex"
        >
          <span aria-hidden>✆</span>
          <span>{WHATSAPP}</span>
        </a>

        <Link href="/contact-us" className="font-display text-sm font-700 text-ink sm:hidden">
          Contact
        </Link>
      </div>

      {/* Mobile: the original exposes no service links at all below 980px. */}
      <nav
        aria-label="Sections"
        className="flex gap-5 overflow-x-auto border-t border-line-soft px-5 py-2.5 text-[0.8125rem] whitespace-nowrap lg:hidden"
      >
        <Link href="/about-us">About</Link>
        <Link href="/services" className="font-600">Services</Link>
        {areas.map((a) => (
          <Link key={a.slug} href={`/${a.slug}`} className="text-body">
            {a.title.replace(/ &.*$/, '')}
          </Link>
        ))}
        <Link href="/legal-insights">Insights</Link>
      </nav>
    </header>
  );
}

function TopLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="py-6 font-display text-[0.9375rem] font-600 text-ink transition-opacity hover:opacity-60"
    >
      {children}
    </Link>
  );
}

/**
 * The real bilingual logo from the CMS, with a text fallback so the header
 * never collapses if the asset is missing.
 */
function Wordmark({
  logo,
  name,
}: {
  logo: { src: string; alt: string; width: number; height: number } | null;
  name: string;
}) {
  return (
    <Link href="/" className="flex shrink-0 items-center leading-none">
      {logo ? (
        <Image
          src={logo.src}
          alt={logo.alt || name}
          width={logo.width}
          height={logo.height}
          priority
          className="h-11 w-auto"
        />
      ) : (
        <span className="flex flex-col gap-0.5">
          <span className="font-display text-xl font-700 tracking-[0.02em] text-ink">
            FAKHER &amp; CO
          </span>
          <span lang="ar" dir="rtl" className="text-sm leading-none text-ink">
            فاخر ومشاركوه
          </span>
        </span>
      )}
    </Link>
  );
}
