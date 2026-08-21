import Link from 'next/link';
import Image from 'next/image';
import type { Block, Landing } from '@/lib/content';
import { ContactForm } from '@/components/ContactForm';
import { PHONE, TEL_HREF, WHATSAPP_URL } from '@/lib/contact';
import { WhatsAppGlyph } from '@/components/icons/WhatsAppGlyph';
import { StickyActionBar } from '@/components/layout/StickyActionBar';
import { t } from '@/lib/ui';
import { pathIn, type Locale } from '@/lib/locale';

/**
 * A campaign landing page, in either language.
 *
 * This was the body of the English route. It moved out here when the Arabic
 * pages were added, because the alternative was a second copy of four hundred
 * lines of JSX whose only difference was the strings — and two copies of a
 * layout drift apart on the first fix that is applied to one of them. Every
 * string now comes from UI[locale].landing, and the RTL work is already done
 * by the logical properties the markup was written with.
 */

function InlineCta({
  index,
  service,
  locale,
}: {
  index: number;
  service: string;
  locale: Locale;
}) {
  const s = t(locale).landing;
  const copy = s.ctas[index % s.ctas.length];
  return (
    /*
      Desktop only, and the breakpoint is deliberately the same one the sticky
      bar uses. Below lg the bar is on screen at all times with the identical
      two actions, so this would be the same buttons twice within a thumb's
      reach of each other. The two are exact complements: wherever the bar is
      visible, none of the repeated in-flow CTAs are, and vice versa.
    */
    <aside className="my-12 hidden border border-line bg-surface-alt card-p lg:block">
      <p className="font-display text-lg font-700 text-ink">{copy.line}</p>
      <p className="mt-2 text-body">{copy.sub}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a
          href="#enquire"
          className="bg-ink px-6 py-3 font-display text-sm font-700 text-white transition-colors hover:bg-ink-2"
        >
          {t(locale).requestConsultation}
        </a>
        <a
          href={WHATSAPP_URL(s.askAbout(service))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 border border-ink px-5 py-3 font-display text-sm font-700 text-ink transition-colors hover:bg-surface"
        >
          <WhatsAppGlyph className="h-5 w-5 shrink-0 text-whatsapp" />
          {s.whatsapp}
        </a>
      </div>
    </aside>
  );
}

function Prose({
  blocks,
  service,
  locale,
}: {
  blocks: Block[];
  service: string;
  locale: Locale;
}) {
  /*
    A call to action after every second section.

    Counted on level-2 headings and inserted BEFORE the heading that opens the
    next pair, so a CTA never separates a heading from the text under it. The
    first pair is skipped — nobody is ready to enquire two paragraphs in — and
    so is the last, because the form itself is immediately below.
  */
  let seen = 0;
  const lastH2 = blocks.reduce(
    (last, b, i) => (b.type === 'heading' && b.level === 2 ? i : last),
    -1,
  );

  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'heading': {
            if (b.level !== 2) {
              return (
                <h3 key={i} className="mt-8 text-card">
                  {b.text}
                </h3>
              );
            }
            seen += 1;
            const breakHere = seen > 2 && seen % 2 === 1 && i !== lastH2;
            return (
              <div key={i}>
                {breakHere && (
                  <InlineCta index={Math.floor(seen / 2) - 1} service={service} locale={locale} />
                )}
                <h2 className="mt-12 text-section">{b.text}</h2>
              </div>
            );
          }
          case 'paragraph':
            return (
              <div
                key={i}
                className="prose-body mt-4"
                dangerouslySetInnerHTML={{ __html: b.html }}
              />
            );
          case 'list': {
            const List = b.ordered ? 'ol' : 'ul';
            return (
              <List
                key={i}
                className={`prose-body mt-4 flex flex-col gap-2 ps-5 marker:text-muted ${
                  b.ordered ? 'list-decimal' : 'list-disc'
                }`}
              >
                {b.items.map((item, j) => (
                  <li key={j} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </List>
            );
          }
          default:
            return null;
        }
      })}
    </>
  );
}

export function LandingArticle({
  page,
  others,
  services,
  locale,
}: {
  page: Landing;
  others: Landing[];
  /** Practice-area titles for the enquiry form's service picker. */
  services: string[];
  locale: Locale;
}) {
  const s = t(locale).landing;
  /** '/legal-services' or '/ar/legal-services'. */
  const base = pathIn('/legal-services', locale);
  const photo = page.heroImage;

  return (
    /* pb on mobile so the sticky bar never covers the last of the content. */
    <article className="pb-24 lg:pb-0">
      <StickyActionBar locale={locale} />
      {/*
        Hero, matching the homepage's treatment: full-bleed photograph with the
        copy set over a directional scrim, so the text side holds contrast
        while the far side of the image stays saturated.

        Explicit positive z-indices. A negative one does not work here — the
        section establishes a stacking context, so the image would be painted
        behind the section's own background and vanish.
      */}
      <header className="relative isolate overflow-hidden border-b border-line bg-ink text-white">
        {photo && (
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            priority
            sizes="100vw"
            className="z-0 object-cover object-[60%_center] rtl:object-[40%_center]"
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0 z-10 bg-gradient-to-r from-black/94 via-black/80 to-black/45 rtl:bg-gradient-to-l lg:via-black/70 lg:to-black/25"
        />
        <div className="site-container section relative z-20">
          <p className="eyebrow text-white/70">{s.eyebrow}</p>
          {/* text-white is required, not decorative: globals.css sets
              h1 { color: var(--color-ink) } in the base layer, so on this ink
              hero the headline rendered black on black and was invisible. */}
          <h1 className="mt-5 max-w-[22ch] text-hero text-white">{page.h1}</h1>
          {page.subhead && (
            <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-white/80">
              {page.subhead}
            </p>
          )}
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#enquire"
              className="bg-white px-7 py-3.5 font-display text-sm font-700 text-ink transition-colors hover:bg-white/85"
            >
              {t(locale).requestConsultation}
            </a>
            <a
              href={WHATSAPP_URL(s.askAbout(page.title))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-whatsapp px-6 py-3.5 font-display text-sm font-700 text-ink transition-colors hover:bg-whatsapp-dark"
            >
              <WhatsAppGlyph className="h-5 w-5 shrink-0" />
              <span dir="ltr">{PHONE.COMPACT}</span>
            </a>
          </div>
        </div>
      </header>

      <div className="site-container section">
        <div className="max-w-[68ch]">
          <Prose blocks={page.blocks} service={page.title} locale={locale} />

          {/*
            Immediately before the form, and deliberately NOT another
            "Request a consultation" button — that would scroll the reader two
            hundred pixels to a form already in view.

            This is the moment someone decides whether they are willing to
            fill in a form at all, so it offers the alternative: call or
            message. It converts the people the form would have lost.
          */}
          <aside className="mt-14 hidden flex-wrap items-center gap-x-6 gap-y-4 border-t border-line pt-8 lg:flex">
            <p className="text-body">
              <strong className="font-600 text-ink">{s.ratherNotFormLead}</strong>{' '}
              {s.ratherNotFormBody}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={TEL_HREF}
                dir="ltr"
                className="border border-ink px-5 py-2.5 font-display text-sm font-700 text-ink transition-colors hover:bg-surface-alt"
              >
                {PHONE.DISPLAY}
              </a>
              <a
                href={WHATSAPP_URL(s.askAbout(page.title))}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border border-ink px-5 py-2.5 font-display text-sm font-700 text-ink transition-colors hover:bg-surface-alt"
              >
                <WhatsAppGlyph className="h-5 w-5 shrink-0 text-whatsapp" />
                {s.whatsapp}
              </a>
            </div>
          </aside>
        </div>
      </div>

      {/*
        The form sits at the foot, full width, rather than in a sidebar.

        A sidebar form competes with the copy for attention the whole way down
        and squeezes the reading column; at the end it arrives once the case
        has been made, which is when someone is actually ready to enquire. The
        hero's "Request a consultation" jumps straight here for anyone who is
        ready sooner.
      */}
      <section id="enquire" className="scroll-mt-28 border-t border-line bg-surface-alt">
        <div className="site-container section">
          <div className="mx-auto max-w-[46rem]">
            <p className="eyebrow text-ink">{s.getInTouch}</p>
            <h2 className="mt-4 text-display">{t(locale).requestConsultation}</h2>
            <p className="prose-body mt-4 max-w-[52ch]">{s.formLead}</p>
            <div className="section-body border border-ink bg-surface card-p">
              <ContactForm services={services} locale={locale} />
            </div>
          </div>
        </div>
      </section>

      {others.length > 0 && (
        /*
          A grid of real cards on white, not a row of small underlined links.

          As a wrapped list of 14px links on grey it read as a footnote and was
          easy to miss entirely — which is wasted, because someone who has read
          to the bottom of one service page is exactly the person most likely
          to want another. Each card is a full click target at card type size.
        */
        <section className="border-t border-line bg-surface">
          <div className="site-container section">
            <p className="eyebrow text-ink">{s.otherServices}</p>
            <h2 className="mt-4 text-display">{s.howElse}</h2>

            <ul className="section-body grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link
                    href={`${base}/${o.slug}`}
                    className="group flex h-full flex-col border border-line bg-surface card-p transition-colors hover:border-ink hover:bg-surface-alt"
                  >
                    <h3 className="text-card group-hover:underline group-hover:decoration-faint group-hover:underline-offset-4">
                      {o.title}
                    </h3>
                    {/* The page's own subhead, so the card says what the
                        service actually is instead of making the reader infer
                        it from a title. mt-auto pins the affordance to the
                        bottom so every card in a row lines up regardless of
                        how long its description runs. */}
                    {o.subhead && <p className="mt-3 text-sm text-body">{o.subhead}</p>}
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
          </div>
        </section>
      )}

      {/*
        Closing ask. The page previously ended on a list of other services,
        which leaves a reader who is interested in THIS one with nothing to do
        but scroll back up. Ink, so it reads as the end of the page rather
        than another content section.
      */}
      <section data-flush-footer className="hidden border-t border-line bg-ink text-white lg:block">
        <div className="site-container section-tight">
          <h2 className="max-w-[26ch] text-display text-white">{s.readyTitle}</h2>
          <p className="mt-5 max-w-[58ch] text-white/80">{s.readyBody}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#enquire"
              className="bg-white px-7 py-3.5 font-display text-sm font-700 text-ink transition-colors hover:bg-white/85"
            >
              {t(locale).requestConsultation}
            </a>
            <a
              href={WHATSAPP_URL(s.askAbout(page.title))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-white/70 px-6 py-3.5 font-display text-sm font-700 text-white transition-colors hover:bg-white hover:text-ink"
            >
              <WhatsAppGlyph className="h-5 w-5 shrink-0 text-whatsapp" />
              {s.whatsapp}
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
