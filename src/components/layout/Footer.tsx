import Link from 'next/link';
import { getPracticeAreas } from '@/lib/content';

const OFFICES = [
  { city: 'Abu Dhabi', country: 'UAE', phone: '+971 50 205 7209' },
  { city: 'Mansoura', country: 'Egypt', phone: '+20 103 403 4101' },
  { city: 'New Delhi', country: 'India', phone: '+91 628 275 1175' },
];

export async function Footer() {
  const areas = await getPracticeAreas();

  return (
    <footer className="mt-24 border-t border-line bg-surface-alt">
      <div className="site-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Fakher &amp; Co</p>
          <p className="mt-2 text-sm text-body">
            Trusted litigation specialists in the UAE since 2011.
          </p>
        </div>

        <div>
          <h2 className="text-2xs font-semibold uppercase tracking-[0.12em] text-muted">Services</h2>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm">
            {areas.map((a) => (
              <li key={a.slug}>
                <Link href={`/${a.slug}`} className="hover:text-ink">{a.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xs font-semibold uppercase tracking-[0.12em] text-muted">Firm</h2>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm">
            <li><Link href="/about-us" className="hover:text-ink">About us</Link></li>
            <li><Link href="/meet-your-advocates" className="hover:text-ink">Meet your advocates</Link></li>
            <li><Link href="/our-unwavering-principles" className="hover:text-ink">Our principles</Link></li>
            <li><Link href="/legal-insights" className="hover:text-ink">Legal insights</Link></li>
            <li><Link href="/contact-us" className="hover:text-ink">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xs font-semibold uppercase tracking-[0.12em] text-muted">Offices</h2>
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
          <p>© {new Date().getFullYear()} Fakher &amp; Co. All rights reserved.</p>
          <Link href="/privacy-policy-2" className="hover:text-ink">Privacy policy</Link>
        </div>
      </div>
    </footer>
  );
}
