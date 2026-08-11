import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllLandings, getPracticeAreas } from '@/lib/content';
import { PHONE, TEL_HREF, WHATSAPP_URL } from '@/lib/contact';
import { WhatsAppGlyph } from '@/components/icons/WhatsAppGlyph';

export const revalidate = 300;

/**
 * The hub for the eight campaign pages.
 *
 * It reads as a real services page, because that is what a visitor who lands
 * here needs it to be. It used to be an internal index — an "Internal" eyebrow,
 * a note about noindex, the file path the copy was seeded from, and each card
 * captioned with its own URL. That was written for the two people reviewing the
 * pages, and it was reachable by anyone who removed a slug from the address bar
 * or followed a stray link from an ad.
 *
 * STILL noindex, and deliberately.
 * Every page it links to duplicates a service page that already ranks
 * organically, and so does this hub against /services. Presenting it properly
 * is about the visitor who arrives; it is not an argument for indexing it.
 */
export const metadata: Metadata = {
  title: 'Legal Services in the UAE',
  description:
    'Litigation, company formation, contracts, shareholder disputes, labour and property matters — handled by UAE-qualified lawyers in Abu Dhabi and Dubai.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/legal-services' },
};

export default async function LegalServicesIndex() {
  const [pages, areas] = await Promise.all([getAllLandings(), getPracticeAreas()]);
  const serviceCount = areas.reduce((n, a) => n + a.children.length, 0);

  return (
    <article>
      <header className="border-b border-line bg-ink text-white">
        <div className="site-container section">
          <p className="eyebrow text-white/70">Fakher &amp; Co · Abu Dhabi &amp; Dubai</p>
          {/* text-white is required: globals.css sets h1 { color: var(--color-ink) }
              in the base layer, so on an ink hero the headline is invisible. */}
          <h1 className="mt-5 max-w-[20ch] text-hero text-white">Legal Services in the UAE</h1>
          <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-white/80">
            Practising since 2011, with offices in Abu Dhabi and Dubai. Whatever the matter, the
            first step is the same — tell us the situation and we will tell you where you stand.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/contact-us"
              className="bg-white px-7 py-3.5 font-display text-sm font-700 text-ink transition-colors hover:bg-white/85"
            >
              Request a consultation
            </Link>
            <a
              href={WHATSAPP_URL('Hello, I would like to speak to a lawyer.')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-white/70 px-6 py-3.5 font-display text-sm font-700 text-white transition-colors hover:bg-white hover:text-ink"
            >
              <WhatsAppGlyph className="h-5 w-5 shrink-0 text-whatsapp" />
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      <section className="site-container section">
        <p className="eyebrow text-ink">How we can help</p>
        <h2 className="mt-4 text-display">Choose the matter closest to yours</h2>
        <p className="prose-body mt-5 max-w-[62ch]">
          Each one sets out what we do, how the process works, what it typically costs you in time,
          and the questions clients ask most. If your matter spans more than one, start anywhere —
          the same team handles all of them.
        </p>

        <ul className="section-body grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/legal-services/${p.slug}`}
                className="group flex h-full flex-col border border-line bg-surface card-p transition-colors hover:border-ink hover:bg-surface-alt"
              >
                <h3 className="text-card group-hover:underline group-hover:decoration-faint group-hover:underline-offset-4">
                  {p.title}
                </h3>
                {p.subhead && <p className="mt-3 text-sm text-body">{p.subhead}</p>}
                {/*
                  No URL caption. It was there so reviewers could match a card to
                  the page they were checking; to a client it is noise, and it
                  tells them nothing the link does not already do.
                */}
                <span className="mt-auto flex items-center gap-2 pt-6 font-display text-sm font-600 text-ink">
                  Read more
                  <span
                    aria-hidden
                    className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 motion-reduce:transition-none"
                  >
                    &rarr;
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-line bg-surface-alt">
        <div className="site-container section-tight">
          <h2 className="text-display">Not sure which applies?</h2>
          <p className="prose-body mt-4 max-w-[56ch]">
            Tell us the situation and we will point you to the right place — including telling you
            when you do not need a lawyer. We also publish {serviceCount} detailed service pages
            covering the full range of our practice.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/contact-us"
              className="bg-ink px-7 py-3.5 font-display text-sm font-700 text-white transition-colors hover:bg-ink-2"
            >
              Request a consultation
            </Link>
            <Link
              href="/services"
              className="font-display text-sm font-600 underline decoration-faint underline-offset-4 hover:decoration-ink"
            >
              Browse all services
            </Link>
            <a href={TEL_HREF} dir="ltr" className="text-sm text-body hover:text-ink">
              {PHONE.DISPLAY}
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
