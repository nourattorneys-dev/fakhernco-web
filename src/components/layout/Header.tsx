import Link from 'next/link';
import Image from 'next/image';
import { getArabicPaths, getPracticeAreas, getSiteSettings } from '@/lib/content';
import type { Locale } from '@/lib/locale';
import { href, t } from '@/lib/ui';
import { LanguageSwitcher } from './LanguageSwitcher';
import { PHONE, WHATSAPP_URL } from '@/lib/contact';
import { WhatsAppGlyph } from '@/components/icons/WhatsAppGlyph';
import { NavGroup } from './NavGroup';



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
  const arSet = new Set(arabicPaths);
  const L = (path: string) => href(locale, path, arSet);

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

          <NavGroup href={L("/services")} label={s.services} wide>
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
          </NavGroup>

          <TopLink href={L("/legal-insights")}>{s.insights}</TopLink>
          <TopLink href={L("/contact-us")}>{s.contact}</TopLink>
        </nav>

        {/*
          col-start-3 is load-bearing, not tidiness.

          The nav in the middle column is `hidden lg:flex`, and a display:none
          element is removed from grid placement altogether — so below lg this
          cluster was auto-placed into column 2 and column 3 sat empty. The
          result was the language button stranded mid-header with 133px of dead
          space to its right, close enough to the wordmark to read as attached
          to it. Naming the column pins it to the outer edge at every width.
        */}
        <div className="col-start-3 flex items-center justify-self-end gap-3">
          {/*
            Black button, white number, green glyph.

            This gets the best of both: the number sits at ~16:1 on ink, which
            a solid-green button could not manage (white on #25D366 is 2.0:1),
            while the WhatsApp mark still carries the brand recognition. The
            green reads at 9.3:1 against ink, so the glyph is well clear of the
            3:1 WCAG asks of a graphical object — better than the floating
            button's white-on-green lockup manages.

            target="_blank" because this leaves for wa.me: without it, tapping
            the number navigated the site away and the visitor lost their
            place. rel="noopener" is required alongside it — a _blank link
            otherwise hands the opened page a reference to this window.
          */}
          <a
            href={WHATSAPP_URL(s.whatsappPrefill)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.whatsappLabel}
            className="hidden items-center gap-2 bg-ink px-5 py-2.5 font-display text-sm font-700 text-white transition-colors hover:bg-ink-2 sm:flex"
          >
            {/*
              Was a ✆ text glyph (U+2706), which rendered at the 14px font
              size and read as small and faint next to the number — and was a
              generic telephone sign rather than the WhatsApp mark the green
              is promising. 1.25rem against 0.875rem text.
            */}
            <WhatsAppGlyph className="h-5 w-5 shrink-0 text-whatsapp" />
            {/*
              dir="ltr" because bidi reordering moves the leading "+" of a
              phone number to the far end inside an RTL paragraph: the Arabic
              header was rendering "971502057209+". Phone numbers are always
              read left to right, in either language.
            */}
            <span dir="ltr">{PHONE.COMPACT}</span>
          </a>

          <Link
            href={L('/contact-us')}
            className="font-display text-sm font-700 text-ink sm:hidden"
          >
            {s.contact}
          </Link>

          {/*
            Last in the cluster, so in English it sits at the far right of the
            header rather than tucked to the left of the WhatsApp button.

            Being last in the DOM is what makes it mirror correctly: the row
            reverses under RTL, so on the Arabic site it lands at the far left,
            which is the same "outside edge" position an Arabic reader expects.
            Ordering it visually with CSS instead would have pinned it to one
            physical side in both languages.
          */}
          <LanguageSwitcher translated={arabicPaths} />
        </div>
      </div>

      {/*
        Mobile navigation: the same four sections the desktop nav has.

        It used to also list the five practice areas, with their titles cut at
        the ampersand — which turned "Personal & Criminal Legal Services" into
        "Personal" and "Contracts & Legal Document Drafting" into "Contracts".
        A row reading About Us / Services / Litigation / Personal / Contracts /
        Company Formation / Private Notary / Legal Insights is not a menu, it
        is a list of fragments, and it duplicated what Services already leads
        to.
      */}
      <nav
        aria-label={s.sections}
        className="flex gap-6 overflow-x-auto border-t border-line-soft px-5 py-3 text-[0.875rem] whitespace-nowrap lg:hidden"
      >
        <Link href={L('/about-us')}>{s.about}</Link>
        <Link href={L('/services')} className="font-600">{s.services}</Link>
        <Link href={L('/legal-insights')}>{s.insights}</Link>
        <Link href={L('/contact-us')}>{s.contact}</Link>
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
