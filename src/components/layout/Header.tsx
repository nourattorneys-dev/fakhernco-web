import Link from 'next/link';
import Image from 'next/image';
import { getArabicPaths, getPracticeAreas, getSiteSettings } from '@/lib/content';
import type { Locale } from '@/lib/locale';
import { href, t } from '@/lib/ui';
import { LanguageSwitcher } from './LanguageSwitcher';

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
export async function Header({ locale = 'en' }: { locale?: Locale } = {}) {
  const [areas, site, arabicPaths] = await Promise.all([
    getPracticeAreas(locale),
    getSiteSettings(locale),
    getArabicPaths(),
  ]);
  const s = t(locale);
  const L = (path: string) => href(locale, path);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur-sm">
      {/*
        Three columns, not flex justify-between.
        
        The nav must sit in the same place on every page. With justify-between
        it is the middle flex item, so its position depends on the width of
        both siblings — and the language switcher only renders where an Arabic
        version exists, which moved the whole menu 45px between pages. A grid
        with equal side tracks pins the centre column regardless.
      */}
      <div className="site-container grid h-[4.5rem] grid-cols-[1fr_auto_1fr] items-center gap-6">
        <div className="justify-self-start">
          <Wordmark logo={site.logo} name={site.siteName} homeHref={L("/")} />
        </div>

        <nav aria-label={s.mainNav} className="hidden items-center justify-self-center gap-8 lg:flex">
          {site.aboutLinks.length > 0 ? (
            <NavGroup href={L("/about-us")} label={s.about}>
              <ul className="flex w-64 flex-col border border-line bg-surface p-2 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.35)]">
                <li>
                  <Link
                    href={L("/about-us")}
                    className="block px-4 py-2.5 font-display text-[0.9063rem] font-600 text-ink hover:bg-surface-alt"
                  >
                    {s.about}
                  </Link>
                </li>
                {site.aboutLinks.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={L(`/${item.slug}`)}
                      className="block px-4 py-2.5 text-[0.9063rem] leading-snug text-body transition-colors hover:bg-surface-alt hover:text-ink"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </NavGroup>
          ) : (
            <TopLink href={L("/about-us")}>{s.about}</TopLink>
          )}

          <div className="group relative">
            <Link
              href={L("/services")}
              className="flex items-center gap-1.5 py-6 font-display text-[0.9375rem] font-600 text-ink transition-opacity hover:opacity-60"
            >
              {s.services}
              <span aria-hidden className="text-[0.55rem] text-muted">▼</span>
            </Link>

            <div className="invisible absolute left-1/2 top-full w-[64rem] max-w-[95vw] -translate-x-1/2 pt-0 opacity-0 transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              {/*
                Multi-column flow, not grid.

                With a grid, every row is as tall as its tallest cell — and the
                practice areas are wildly uneven (17 children vs 5). Litigation
                and Personal & Criminal sat in the same row as Contracts and
                were stretched to match it, leaving 8 and 12 rows of dead space
                beneath their lists. Columns pack by height instead, and
                break-inside-avoid keeps each block whole.
              */}
              <div className="columns-2 gap-x-12 border border-line bg-surface card-p shadow-[0_20px_50px_-24px_rgba(0,0,0,0.35)] xl:columns-3">
                {areas.map((area) => (
                  <div key={area.slug} className="mb-9 break-inside-avoid last:mb-0">
                    <Link
                      href={L(`/${area.slug}`)}
                      className="block border-b-2 border-ink pb-2.5 font-display text-[0.9375rem] font-700 uppercase tracking-[0.06em] text-ink transition-opacity hover:opacity-60"
                    >
                      {area.title}
                    </Link>
                    <ul className="mt-4 flex flex-col gap-2">
                      {area.children.map((child) => (
                        <li key={child.slug}>
                          <Link
                            href={L(`/${child.slug}`)}
                            className="block text-[0.9063rem] leading-snug text-body transition-colors hover:text-ink"
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

          <TopLink href={L("/legal-insights")}>{s.insights}</TopLink>
          <TopLink href={L("/contact-us")}>{s.contact}</TopLink>
        </nav>

        <div className="flex items-center justify-self-end gap-3">
          <LanguageSwitcher translated={arabicPaths} />
          <a
            href={`https://wa.me/${WHATSAPP.replace('+', '')}`}
            className="hidden items-center gap-2 bg-ink px-5 py-2.5 font-display text-sm font-700 text-white transition-colors hover:bg-ink-2 sm:flex"
          >
            <span aria-hidden>✆</span>
            <span>{WHATSAPP}</span>
          </a>

          <Link
            href={L('/contact-us')}
            className="font-display text-sm font-700 text-ink sm:hidden"
          >
            {s.contact}
          </Link>
        </div>
      </div>

      {/* Mobile: the original exposes no service links at all below 980px. */}
      <nav
        aria-label={s.sections}
        className="flex gap-5 overflow-x-auto border-t border-line-soft px-5 py-3 text-[0.875rem] whitespace-nowrap lg:hidden"
      >
        <Link href={L("/about-us")}>{s.about}</Link>
        <Link href={L("/services")} className="font-600">{s.services}</Link>
        {areas.map((a) => (
          <Link key={a.slug} href={L(`/${a.slug}`)} className="text-body">
            {a.title.replace(/ &.*$/, '')}
          </Link>
        ))}
        <Link href={L("/legal-insights")}>{s.insights}</Link>
      </nav>
    </header>
  );
}

/**
 * Hover/focus disclosure shared by both menus.
 *
 * `group-focus-within` as well as `group-hover` so the menu is reachable by
 * keyboard — the original exposes its submenus on hover only.
 */
function NavGroup({
  href,
  label,
  children,
  wide = false,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="group relative">
      <Link
        href={href}
        className="flex items-center gap-1.5 py-6 font-display text-[0.9375rem] font-600 text-ink transition-opacity hover:opacity-60"
      >
        {label}
        <span aria-hidden className="text-[0.55rem] text-muted">▼</span>
      </Link>
      <div
        className={`invisible absolute top-full opacity-0 transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${
          wide ? 'left-1/2 w-[64rem] max-w-[95vw] -translate-x-1/2' : 'left-0'
        }`}
      >
        {children}
      </div>
    </div>
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
  homeHref,
}: {
  logo: { src: string; alt: string; width: number; height: number } | null;
  name: string;
  homeHref: string;
}) {
  return (
    <Link href={homeHref} className="flex shrink-0 items-center leading-none">
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
