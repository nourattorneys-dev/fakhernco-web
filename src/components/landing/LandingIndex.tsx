import Link from 'next/link';
import type { Landing } from '@/lib/content';
import { PHONE, TEL_HREF, WHATSAPP_URL } from '@/lib/contact';
import { WhatsAppGlyph } from '@/components/icons/WhatsAppGlyph';
import { t } from '@/lib/ui';
import { pathIn, type Locale } from '@/lib/locale';

/**
 * The hub at /legal-services, in either language.
 *
 * It reads as a real services page, because that is what a visitor who lands
 * here needs it to be. It used to be an internal index — an "Internal" eyebrow,
 * a note about noindex, and each card captioned with its own URL. That was
 * written for the two people reviewing the pages, and it was reachable by
 * anyone who removed a slug from the address bar or followed a stray link
 * from an ad.
 */
export function LandingIndex({
  pages,
  serviceCount,
  locale,
}: {
  pages: Landing[];
  /** How many organic service pages the firm publishes, for the closing note. */
  serviceCount: number;
  locale: Locale;
}) {
  const s = t(locale).landing;
  const base = pathIn('/legal-services', locale);
  const servicesHref = pathIn('/services', locale);
  const contactHref = pathIn('/contact-us', locale);

  return (
    <article>
      <header className="border-b border-line bg-ink text-white">
        <div className="site-container section">
          <p className="eyebrow text-white/70">{s.eyebrow}</p>
          {/* text-white is required: globals.css sets h1 { color: var(--color-ink) }
              in the base layer, so on an ink hero the headline is invisible. */}
          <h1 className="mt-5 max-w-[20ch] text-hero text-white">{s.indexTitle}</h1>
          <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-white/80">{s.indexLead}</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href={contactHref}
              className="bg-white px-7 py-3.5 font-display text-sm font-700 text-ink transition-colors hover:bg-white/85"
            >
              {t(locale).requestConsultation}
            </Link>
            <a
              href={WHATSAPP_URL(s.helloLawyer)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-white/70 px-6 py-3.5 font-display text-sm font-700 text-white transition-colors hover:bg-white hover:text-ink"
            >
              <WhatsAppGlyph className="h-5 w-5 shrink-0 text-whatsapp" />
              {s.whatsapp}
            </a>
          </div>
        </div>
      </header>

      <section className="site-container section">
        <p className="eyebrow text-ink">{s.howWeHelp}</p>
        <h2 className="mt-4 text-display">{s.chooseMatter}</h2>
        <p className="prose-body mt-5 max-w-[62ch]">{s.chooseLead}</p>

        <ul className="section-body grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((p) => (
            <li key={p.slug}>
              <Link
                href={`${base}/${p.slug}`}
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
                  {s.readMore}
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
          <h2 className="text-display">{s.notSureTitle}</h2>
          <p className="prose-body mt-4 max-w-[56ch]">{s.notSureBody(serviceCount)}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href={contactHref}
              className="bg-ink px-7 py-3.5 font-display text-sm font-700 text-white transition-colors hover:bg-ink-2"
            >
              {t(locale).requestConsultation}
            </Link>
            <Link
              href={servicesHref}
              className="font-display text-sm font-600 underline decoration-faint underline-offset-4 hover:decoration-ink"
            >
              {s.browseAll}
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
