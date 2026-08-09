import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllLandings, getLanding, getLandingSlugs, inline, type Block } from '@/lib/landing';
import { getPracticeAreas } from '@/lib/content';
import { ContactForm } from '@/components/ContactForm';
import { PHONE, WHATSAPP_URL } from '@/lib/contact';
import { WhatsAppGlyph } from '@/components/icons/WhatsAppGlyph';

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

function Prose({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === 'h2')
          return (
            <h2 key={i} className="mt-12 text-section first:mt-0">
              <Text value={b.text} />
            </h2>
          );
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
  const [page, areas, all] = await Promise.all([
    getLanding(slug),
    getPracticeAreas(),
    getAllLandings(),
  ]);
  if (!page) notFound();

  const others = all.filter((p) => p.slug !== slug);

  return (
    <article>
      {/* Hero. No photograph: an ad landing page should load fast and put the
          offer and the form above the fold, not a 200KB image. */}
      <header className="border-b border-line bg-ink text-white">
        <div className="site-container section">
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
          <Prose blocks={page.blocks} />
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

            <ul className="section-body grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {others.map((o) => (
                <li key={o.slug} className="bg-surface">
                  <Link
                    href={`/lp/${o.slug}`}
                    className="group flex h-full items-start justify-between gap-4 card-p transition-colors hover:bg-surface-alt"
                  >
                    <span className="text-card group-hover:underline group-hover:decoration-faint group-hover:underline-offset-4">
                      {o.title}
                    </span>
                    <span
                      aria-hidden
                      className="mt-1 shrink-0 text-muted transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 motion-reduce:transition-none"
                    >
                      &rarr;
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}
