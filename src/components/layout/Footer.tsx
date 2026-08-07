import Link from 'next/link';
import { getArabicPaths, getPracticeAreas, getSiteSettings } from '@/lib/content';
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

export async function Footer({ locale = 'en' }: { locale?: Locale } = {}) {
  const [areas, site, arabicPaths] = await Promise.all([
    getPracticeAreas(locale),
    getSiteSettings(locale),
    getArabicPaths(),
  ]);
  const arSet = new Set(arabicPaths);
  const s = t(locale);
  const L = (path: string) => href(locale, path, arSet);

  return (
    <footer className="mt-24 border-t border-line bg-surface-alt">
      <div className="site-container section-tight grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
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
            {/*
              The SKP Federation section — four pages that imported cleanly
              and had no inbound link anywhere on the site. The footer is the
              right home: they are firm background, not a service.
            */}
            <li><Link href={L("/skp-business-federation")} className="hover:text-ink">SKP Business Federation</Link></li>
            <li><Link href={L("/our-federation-partners")} className="hover:text-ink">Our federation partners</Link></li>
            <li><Link href={L("/the-integrated-service-model")} className="hover:text-ink">The integrated service model</Link></li>
            <li><Link href={L("/the-client-advantage")} className="hover:text-ink">The client advantage</Link></li>
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
