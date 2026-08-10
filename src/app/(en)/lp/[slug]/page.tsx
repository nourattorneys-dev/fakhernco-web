import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllLandings, getLanding, getLandingSlugs, inline, type Block } from '@/lib/landing';
import { getHomepage, getPracticeAreas } from '@/lib/content';
import Image from 'next/image';
import { ContactForm } from '@/components/ContactForm';
import { PHONE, TEL_HREF, WHATSAPP_URL } from '@/lib/contact';
import { WhatsAppGlyph } from '@/components/icons/WhatsAppGlyph';
import { StickyActionBar } from '@/components/layout/StickyActionBar';

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getLandingSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLanding(slug);
  if (!page) return {};

  return {
    // The layout's title template appends ' — Fakher & Co', so the brand
    // must NOT be repeated here — it rendered twice in the tab title.
    title: page.h1,
    description: page.description,
    /*
      noindex, and this is the point of the whole route.

      All eight of these duplicate a service page that already ranks — there is
      an organic /litigation-dispute-resolution, /company-formation-corporate-
      services and so on. Letting the ad pages be indexed would put the firm's
      own pages in competition with each other for the same queries and split
      the ranking signals between them.

      `follow` stays on so link equity still reaches the real pages.
    */
    robots: { index: false, follow: true },
    alternates: { canonical: `/lp/${slug}` },
  };
}

/**
 * Copy for the inline calls to action, rotated by position.
 *
 * Rotated rather than repeated because the same sentence three times down one
 * page reads as a template and stops being read at all. Each one offers a
 * different reason to make contact, so a reader who ignored the first has a
 * different hook at the second.
 */
const CTA_COPY = [
  {
    line: 'Not sure whether you have a case, or whether it is worth pursuing?',
    sub: 'A confidential consultation will tell you, with no obligation.',
  },
  {
    line: 'Working to a deadline?',
    sub: 'Tell us when you make contact and we will say honestly whether it is achievable.',
  },
  {
    line: 'Would it be easier to talk it through?',
    sub: 'We advise in Arabic and English, in person in Abu Dhabi and Dubai, or by call.',
  },
];

function InlineCta({ index, service }: { index: number; service: string }) {
  const copy = CTA_COPY[index % CTA_COPY.length];
  return (
    <aside className="my-12 border border-line bg-surface-alt card-p">
      <p className="font-display text-lg font-700 text-ink">{copy.line}</p>
      <p className="mt-2 text-body">{copy.sub}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a
          href="#enquire"
          className="bg-ink px-6 py-3 font-display text-sm font-700 text-white transition-colors hover:bg-ink-2"
        >
          Request a consultation
        </a>
        <a
          href={WHATSAPP_URL(`Hello, I'd like to ask about: ${service}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 border border-ink px-5 py-3 font-display text-sm font-700 text-ink transition-colors hover:bg-surface"
        >
          <WhatsAppGlyph className="h-5 w-5 shrink-0 text-whatsapp" />
          WhatsApp
        </a>
      </div>
    </aside>
  );
}

function Prose({ blocks, service }: { blocks: Block[]; service: string }) {
  /*
    A call to action after every second section.

    The sticky bar is mobile-only, so on desktop a reader working down 900
    words had nothing to act on between the hero and the form at the foot.
    These sit in the flow instead, at the natural pauses between sections.

    Counted on h2 boundaries and inserted BEFORE the heading that starts the
    next pair, so a CTA never separates a heading from the text under it. The
    first pair is skipped — nobody is ready to enquire two paragraphs in — and
    so is the last, because the form itself is immediately below.
  */
  let seen = 0;
  const lastH2 = blocks.reduce((last, b, i) => (b.type === 'h2' ? i : last), -1);
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === 'h2') {
          seen += 1;
          const breakHere = seen > 2 && seen % 2 === 1 && i !== lastH2;
          return (
            <div key={i}>
              {breakHere && <InlineCta index={Math.floor(seen / 2) - 1} service={service} />}
              <h2 className="mt-12 text-section">
                <Text value={b.text} />
              </h2>
            </div>
          );
        }
        if (b.type === 'h3')
          return (
            <h3 key={i} className="mt-8 text-card">
              <Text value={b.text} />
            </h3>
          );
        if (b.type === 'p')
          return (
            <p key={i} className="prose-body mt-4">
              <Text value={b.text} />
            </p>
          );
        const List = b.type === 'ol' ? 'ol' : 'ul';
        return (
          <List
            key={i}
            className={`prose-body mt-4 flex flex-col gap-2 ps-5 marker:text-muted ${
              b.type === 'ol' ? 'list-decimal' : 'list-disc'
            }`}
          >
            {b.items.map((item, j) => (
              <li key={j}>
                <Text value={item} />
              </li>
            ))}
          </List>
        );
      })}
    </>
  );
}

function Text({ value }: { value: string }) {
  return (
    <>
      {inline(value).map((s, i) =>
        s.bold ? (
          <strong key={i} className="font-600 text-ink">
            {s.text}
          </strong>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [page, areas, all, home] = await Promise.all([
    getLanding(slug),
    getPracticeAreas(),
    getAllLandings(),
    getHomepage(),
  ]);
  if (!page) notFound();

  // The brand photography, as one pool: the homepage hero plus its four
  // section images. The markdown picks by index.
  const photos = [home?.heroImage, ...(home?.sectionImages ?? [])].filter(
    (x): x is { src: string; alt: string } => Boolean(x),
  );
  const photo = photos[page.image] ?? photos[0] ?? null;

  const others = all.filter((p) => p.slug !== slug);

  return (
    /* pb on mobile so the sticky bar never covers the last of the content. */
    <article className="pb-24 lg:pb-0">
      <StickyActionBar />
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
          <p className="eyebrow text-white/70">Fakher &amp; Co · Abu Dhabi &amp; Dubai</p>
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
              Request a consultation
            </a>
            <a
              href={WHATSAPP_URL(`Hello, I'd like to ask about: ${page.title}.`)}
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
          <Prose blocks={page.blocks} service={page.title} />

          {/*
            Immediately before the form, and deliberately NOT another
            "Request a consultation" button — that would scroll the reader two
            hundred pixels to a form already in view.

            This is the moment someone decides whether they are willing to
            fill in a form at all, so it offers the alternative: call or
            message. It converts the people the form would have lost.
          */}
          <aside className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-line pt-8">
            <p className="text-body">
              <strong className="font-600 text-ink">Would you rather not fill in a form?</strong>{' '}
              Call or message us and we will come back to you.
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
                href={WHATSAPP_URL(`Hello, I'd like to ask about: ${page.title}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border border-ink px-5 py-2.5 font-display text-sm font-700 text-ink transition-colors hover:bg-surface-alt"
              >
                <WhatsAppGlyph className="h-5 w-5 shrink-0 text-whatsapp" />
                WhatsApp
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
            <p className="eyebrow text-ink">Get in touch</p>
            <h2 className="mt-4 text-display">Request a consultation</h2>
            <p className="prose-body mt-4 max-w-[52ch]">
              Tell us about your matter and a member of our team will respond within one business
              day. Everything you share is confidential.
            </p>
            <div className="section-body border border-ink bg-surface card-p">
              <ContactForm services={areas.map((a) => a.title)} />
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
            <p className="eyebrow text-ink">Other services</p>
            <h2 className="mt-4 text-display">How else we can help</h2>

            {/*
              Separated cards, not a flush table.

              This used the gap-px-over-a-bg-line trick, where cards butt
              together and share single-pixel rules. That reads as one ruled
              block; discrete cards with space around them read as a set of
              choices, which is what this is. Real gaps also mean an
              incomplete final row is simply whitespace, so the filler cells
              that were patching the exposed grid backing are gone.
            */}
            <ul className="section-body grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link
                    href={`/lp/${o.slug}`}
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
          </div>
        </section>
      )}
      {/*
        Closing ask. The page previously ended on a list of other services,
        which leaves a reader who is interested in THIS one with nothing to do
        but scroll back up. Ink, so it reads as the end of the page rather
        than another content section.
      */}
      <section className="border-t border-line bg-ink text-white">
        {/*
          Left-aligned, like every other section on the page.

          This was centred with the heading capped at 20ch, which put it out
          of line with the hero, the body copy and the cards above it, and the
          narrow cap read as though the band had been given a large horizontal
          inset of its own.
        */}
        <div className="site-container section-tight">
          <h2 className="max-w-[26ch] text-display text-white">Ready to protect your position?</h2>
          <p className="mt-5 max-w-[58ch] text-white/80">
            A confidential consultation, with no obligation. We will tell you where you stand and
            what your options cost before you commit to anything.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#enquire"
              className="bg-white px-7 py-3.5 font-display text-sm font-700 text-ink transition-colors hover:bg-white/85"
            >
              Request a consultation
            </a>
            <a
              href={WHATSAPP_URL(`Hello, I'd like to ask about: ${page.title}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-white/70 px-6 py-3.5 font-display text-sm font-700 text-white transition-colors hover:bg-white hover:text-ink"
            >
              <WhatsAppGlyph className="h-5 w-5 shrink-0 text-whatsapp" />
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
