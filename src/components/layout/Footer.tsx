import Link from 'next/link';
import { getPracticeAreas, getSiteSettings } from '@/lib/content';
import type { Locale } from '@/lib/locale';
import { href, t } from '@/lib/ui';

const OFFICES = [
  { city: 'Abu Dhabi', country: 'UAE', phone: '+971 50 205 7209' },
  { city: 'Mansoura', country: 'Egypt', phone: '+20 103 403 4101' },
  { city: 'New Delhi', country: 'India', phone: '+91 628 275 1175' },
];

export async function Footer({ locale = 'en' }: { locale?: Locale } = {}) {
  const [areas, site] = await Promise.all([getPracticeAreas(locale), getSiteSettings(locale)]);
  const s = t(locale);
  const L = (path: string) => href(locale, path);

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
          </ul>
        </div>

        <div>
          <h2 className="text-2xs font-semibold uppercase tracking-[0.12em] text-muted">{s.offices}</h2>
          <ul className="mt-3 flex flex-col gap-2.5 text-sm">
            {OFFICES.map((o) => (
              <li key={o.city}>
                <span className="block text-ink">{o.city}, {o.country}</span>
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
