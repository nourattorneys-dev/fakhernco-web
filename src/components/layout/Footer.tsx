import Link from 'next/link';
import {
  getAllTranslatedPaths,
  getNavPaths,
  getPracticeAreas,
  getSiteSettings,
} from '@/lib/content';
import type { Locale } from '@/lib/locale';
import { href, t } from '@/lib/ui';

/**
 * City and country are keys, not labels — they rendered as "Abu Dhabi, UAE"
 * in the Arabic footer, directly under the Arabic heading المكاتب.
 */
const OFFICES = [
  { city: 'abuDhabi', country: 'uae', phone: '+971 50 205 7209' },
  { city: 'mansoura', country: 'egypt', phone: '+20 103 403 4101' },
  { city: 'newDelhi', country: 'india', phone: '+91 628 275 1175' },
] as const;

/**
 * The federation pages. Titles are hardcoded because these four have no
 * Arabic localisation — an entry here would render English either way, and
 * the CMS has nothing better to offer.
 */
const FEDERATION = [
  { slug: 'skp-business-federation', title: 'SKP Business Federation' },
  { slug: 'our-federation-partners', title: 'Our federation partners' },
  { slug: 'the-integrated-service-model', title: 'The integrated service model' },
  { slug: 'the-client-advantage', title: 'The client advantage' },
] as const;

export async function Footer({ locale = 'en' }: { locale?: Locale } = {}) {
  const [areas, site, translated, navPaths] = await Promise.all([
    getPracticeAreas(locale),
    getSiteSettings(locale),
    getAllTranslatedPaths(),
    getNavPaths(locale),
  ]);
  const s = t(locale);
  const L = (path: string) => href(locale, path, navPaths);

  return (
    <footer className="mt-24 border-t border-line bg-surface-alt">
      {/*
        Five cells in one row at desktop: the brand note plus four link lists.

        The federation group used to be stacked inside the Firm column, which
        left that column running far below the others and reading as a broken
        second row. Splitting it out balances the row — and dropping to
        three columns at md keeps the long labels ("The integrated service
        model") from wrapping to three lines in a narrow track.
      */}
      <div className="site-container section-tight grid gap-x-8 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <div>
          <p className="font-display text-lg font-semibold text-ink">{site.siteName}</p>
          <p className="mt-2 text-sm text-body">{site.footerText}</p>
        </div>

        <div>
          <h2 className="text-2xs font-semibold uppercase tracking-[0.12em] text-muted">{s.services}</h2>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm">
            {areas.map((a) => (
              <li key={a.slug}>
                <Link href={L(`/${a.slug}`)} className="hover:text-ink">{a.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xs font-semibold uppercase tracking-[0.12em] text-muted">{s.firm}</h2>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm">
            <li><Link href={L("/about-us")} className="hover:text-ink">{s.about}</Link></li>
            {site.aboutLinks.map((item) => (
              <li key={item.slug}>
                <Link href={L(`/${item.slug}`)} className="hover:text-ink">{item.title}</Link>
              </li>
            ))}
            <li><Link href={L("/legal-insights")} className="hover:text-ink">{s.insights}</Link></li>
            <li><Link href={L("/contact-us")} className="hover:text-ink">{s.contact}</Link></li>
          </ul>
        </div>

        <div>
          {/*
            The SKP Federation pages, in their own column rather than
            appended to the firm list.

            They were the tail of a ten-item column and read as though the
            list had simply run on — they are about the federation the firm
            belongs to, not about the firm, so the grouping was wrong rather
            than the links.

            They are NOT removed, which was the other option considered: the
            footer is their only inbound link anywhere on the site, and they
            carry 2,721 words between them — more than the About page. Cutting
            them would orphan real content and fail the orphan gate.
          */}
          <h2 className="text-2xs font-semibold uppercase tracking-[0.12em] text-muted">
            {s.federation}
          </h2>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm">
            {FEDERATION.map((f) => (
              <li key={f.slug}>
                <Link href={L(`/${f.slug}`)} className="hover:text-ink">{f.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xs font-semibold uppercase tracking-[0.12em] text-muted">{s.offices}</h2>
          <ul className="mt-3 flex flex-col gap-2.5 text-sm">
            {OFFICES.map((o) => (
              <li key={o.city}>
                <span className="block text-ink">
                  {s.cities[o.city]}, {s.countries[o.country]}
                </span>
                <a href={`tel:${o.phone.replace(/\s/g, '')}`} className="text-body hover:text-ink">
                  {o.phone}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="site-container flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-muted">
          <p>© {new Date().getFullYear()} Fakher &amp; Co. {s.rightsReserved}</p>
          <Link href={L("/privacy-policy-2")} className="hover:text-ink">{s.privacy}</Link>
        </div>
      </div>
    </footer>
  );
}
