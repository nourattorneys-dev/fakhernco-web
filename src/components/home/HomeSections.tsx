import Link from 'next/link';
import Image from 'next/image';
import type { Block } from '@/lib/content';

/**
 * Compose the migrated homepage copy into the sections the original had.
 *
 * The old homepage is eight designed sections; flattened by the extractor it
 * becomes 72 blocks with 25 headings. Rather than hardcode a section list
 * against today's content, the shape is detected:
 *
 *   - a heading with NO body of its own leads the cards that follow it,
 *     which covers commitments, services and process alike
 *   - "Step N" headings turn that card row into a numbered process
 *   - a group carrying a `cards` block is the offices grid
 *   - a heading whose only body is buttons is a CTA band
 *   - anything else is an editorial section
 *
 * Nothing is dropped except genuinely empty groups.
 */

type Group = { heading: string; body: Block[] };
type Img = { src: string; alt: string };

const paragraphs = (g: Group) => g.body.filter((b) => b.type === 'paragraph');
const buttons = (g: Group) =>
  g.body.filter((b): b is Extract<Block, { type: 'button' }> => b.type === 'button');
const cardsBlock = (g: Group) =>
  g.body.find((b): b is Extract<Block, { type: 'cards' }> => b.type === 'cards');

const textLength = (g: Group) =>
  paragraphs(g).reduce((n, p) => n + p.html.replace(/<[^>]+>/g, '').length, 0);

/** Short enough to sit in a card rather than a section of its own. */
const isCardSized = (g: Group) =>
  paragraphs(g).length === 1 && !cardsBlock(g) && textLength(g) < 420;

const STEP = /^step\s*(\d+)\s*/i;

/**
 * A paragraph that is entirely a quotation is a testimonial the builder had
 * no component for, so it was authored as body copy. Rendering it as one
 * buries it; as a pull-quote it does the job it was written to do.
 */
const QUOTE = /^\s*[“"«][\s\S]{40,}[”"»]\s*$/;
const isQuote = (html: string) => QUOTE.test(html.replace(/<[^>]+>/g, '').trim());

/** Strip the site origin so migrated CTAs route internally. */
const internal = (href: string) =>
  href.replace(/^https?:\/\/(www\.)?fakhernco\.com/, '').replace(/\/$/, '') || '/';

function groupBlocks(blocks: Block[]): Group[] {
  const groups: Group[] = [];
  for (const block of blocks) {
    if (block.type === 'heading') groups.push({ heading: block.text, body: [] });
    else if (groups.length) groups[groups.length - 1].body.push(block);
  }
  return groups;
}

export function HomeSections({
  blocks,
  skip = 0,
  images = [],
}: {
  blocks: Block[];
  skip?: number;
  images?: Img[];
}) {
  const groups = groupBlocks(blocks).slice(skip);

  const rendered: React.ReactNode[] = [];
  let i = 0;
  let band = 0;
  let imageIndex = 0;

  while (i < groups.length) {
    const group = groups[i];
    const alt = band % 2 === 1;

    // A heading with no body of its own leads the cards that follow it.
    if (group.body.length === 0) {
      const cards: Group[] = [];
      let j = i + 1;
      while (j < groups.length && isCardSized(groups[j])) {
        cards.push(groups[j]);
        j += 1;
      }
      if (cards.length >= 2) {
        rendered.push(
          <CardRow
            key={`row-${i}`}
            lead={group.heading}
            cards={cards}
            numbered={cards.every((c) => STEP.test(c.heading))}
            alt={alt}
          />,
        );
        i = j;
        band += 1;
        continue;
      }
      // A heading with nothing after it — "Legend1st UAE" and friends. Drop it.
      i += 1;
      continue;
    }

    // The offices grid.
    const cardsInBody = cardsBlock(group);
    if (cardsInBody) {
      rendered.push(<Offices key={`offices-${i}`} group={group} cards={cardsInBody} alt={alt} />);
      i += 1;
      band += 1;
      continue;
    }

    // A heading whose entire body is call-to-action buttons.
    if (paragraphs(group).length === 0 && buttons(group).length > 0) {
      rendered.push(<CtaBand key={`cta-${i}`} group={group} />);
      i += 1;
      band += 1;
      continue;
    }

    // Editorial. Long ones get a photograph; short ones stay text-only so the
    // imagery does not become wallpaper.
    const withImage = textLength(group) > 380 && imageIndex < images.length;
    rendered.push(
      <Editorial
        key={`sec-${i}`}
        group={group}
        alt={alt}
        image={withImage ? images[imageIndex] : null}
        flip={imageIndex % 2 === 1}
      />,
    );
    if (withImage) imageIndex += 1;
    i += 1;
    band += 1;
  }

  return <>{rendered}</>;
}

// ---------------------------------------------------------------- sections

function Editorial({
  group,
  alt,
  image,
  flip,
}: {
  group: Group;
  alt: boolean;
  image: Img | null;
  flip: boolean;
}) {
  const paras = paragraphs(group);
  const btns = buttons(group);
  if (!paras.length && !btns.length) return null;

  const copy = (
    <div className="flex max-w-[62ch] flex-col gap-5">
      <h2 className="text-section">{group.heading}</h2>
      {paras.map((p, i) => <Para key={i} html={p.html} />)}
      {btns.length > 0 && <ButtonRow buttons={btns} />}
    </div>
  );

  if (!image) {
    return (
      <section className={`border-t border-line ${alt ? 'bg-surface-alt' : ''}`}>
        <div className="site-container section grid gap-8 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-16">
          <h2 className="text-section lg:sticky lg:top-28 lg:self-start">{group.heading}</h2>
          <div className="flex max-w-[62ch] flex-col gap-5">
            {paras.map((p, i) => <Para key={i} html={p.html} />)}
            {btns.length > 0 && <ButtonRow buttons={btns} />}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`border-t border-line ${alt ? 'bg-surface-alt' : ''}`}>
      <div className="site-container section grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className={flip ? 'lg:order-2' : ''}>{copy}</div>
        <div className={`relative aspect-[4/3] overflow-hidden ${flip ? 'lg:order-1' : ''}`}>
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(max-width: 1024px) 100vw, 44vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}

function CardRow({
  lead,
  cards,
  numbered,
  alt,
}: {
  lead: string;
  cards: Group[];
  numbered: boolean;
  alt: boolean;
}) {
  const cols =
    cards.length === 4 ? 'lg:grid-cols-4' : cards.length === 2 ? 'sm:grid-cols-2' : 'lg:grid-cols-3';

  return (
    <section className={`border-t border-line ${alt ? 'bg-surface-alt' : ''}`}>
      <div className="site-container section">
        <h2 className="max-w-[24ch] text-section">{lead.replace(/:$/, '')}</h2>

        <div className={`section-body grid gap-px border border-line bg-line sm:grid-cols-2 ${cols}`}>
          {cards.map((card, i) => {
            const title = card.heading.replace(STEP, '').trim();
            const step = numbered ? (card.heading.match(STEP)?.[1] ?? String(i + 1)) : null;
            const body = paragraphs(card)[0];
            const link = buttons(card)[0];

            return (
              <div key={card.heading} className="flex flex-col bg-surface card-p">
                <span className="font-display text-xs font-700 tracking-[0.08em] tabular-nums text-faint">
                  {step ? `STEP ${step.padStart(2, '0')}` : String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 text-lg leading-snug">{title}</h3>
                {body && (
                  <div
                    className="prose-body mt-3 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: body.html }}
                  />
                )}
                {link && (
                  <Link
                    href={internal(link.href)}
                    className="mt-auto pt-5 font-display text-sm font-600 text-ink underline decoration-faint underline-offset-4 hover:decoration-ink"
                  >
                    {link.text}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * The offices grid.
 *
 * The CMS holds nine flat cards, but they are really three offices of three
 * fields each — Address, Phone, Email. Rendering them as nine equal tiles
 * loses that entirely, which is what the previous version did. A card whose
 * title mentions an address starts a new office; everything after it belongs
 * to that office until the next one.
 */
function Offices({
  group,
  cards,
  alt,
}: {
  group: Group;
  cards: Extract<Block, { type: 'cards' }>;
  alt: boolean;
}) {
  const intro = paragraphs(group)[0];

  type Office = { name: string; address: string; details: { label: string; value: string }[] };
  const offices: Office[] = [];

  for (const card of cards.items) {
    if (/address/i.test(card.title)) {
      offices.push({
        name: card.title.replace(/\s*address\s*/i, '').trim() || 'Office',
        address: card.text ?? '',
        details: [],
      });
    } else if (offices.length) {
      offices[offices.length - 1].details.push({
        label: card.title,
        value: card.text ?? '',
      });
    }
  }

  const link = (label: string, value: string) => {
    const v = value.trim();
    if (/email/i.test(label)) return `mailto:${v}`;
    if (/phone|call/i.test(label)) return `tel:${v.split(/\s+/)[0].replace(/[^\d+]/g, '')}`;
    return null;
  };

  return (
    <section className={`border-t border-line ${alt ? 'bg-surface-alt' : ''}`}>
      <div className="site-container section">
        <p className="eyebrow text-muted">Our office locations</p>
        <h2 className="mt-4 text-section">{group.heading}</h2>
        {intro && (
          <div
            className="prose-body mt-4 max-w-[62ch] text-[1.0625rem]"
            dangerouslySetInnerHTML={{ __html: intro.html }}
          />
        )}

        <div className="section-body grid gap-px border border-line bg-line lg:grid-cols-3">
          {offices.map((office, i) => (
            <div key={office.name} className="flex flex-col bg-surface card-p">
              <span className="font-display text-xs font-700 tracking-[0.08em] tabular-nums text-faint">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 text-lg">{office.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-body">{office.address}</p>

              <dl className="mt-5 flex flex-col gap-2 border-t border-line-soft pt-4 text-sm">
                {office.details.map((d) => {
                  const href = link(d.label, d.value);
                  return (
                    <div key={d.label} className="flex flex-wrap gap-x-2">
                      <dt className="text-muted">{d.label}</dt>
                      <dd>
                        {href ? (
                          <a
                            href={href}
                            className="underline decoration-faint underline-offset-2 hover:decoration-ink"
                          >
                            {d.value}
                          </a>
                        ) : (
                          d.value
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** A heading whose whole body is calls to action. Rendered inverted. */
function CtaBand({ group }: { group: Group }) {
  const btns = buttons(group);
  return (
    <section className="bg-ink">
      <div className="site-container section-tight flex flex-wrap items-center justify-between gap-8">
        <h2 className="max-w-[30ch] text-section text-white">{group.heading}</h2>
        <div className="flex flex-wrap gap-3">
          {btns.map((b, i) => (
            <Link
              key={i}
              href={internal(b.href)}
              className={
                i === 0
                  ? 'bg-white px-7 py-3.5 font-display text-sm font-700 text-ink transition-colors hover:bg-white/85'
                  : 'border border-white/70 px-7 py-3.5 font-display text-sm font-700 text-white transition-colors hover:bg-white hover:text-ink'
              }
            >
              {b.text}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Body copy, promoted to a pull-quote when the whole paragraph is quoted. */
function Para({ html }: { html: string }) {
  if (isQuote(html)) {
    return (
      <blockquote className="border-l-2 border-ink py-1 pl-6">
        <div
          className="prose-body text-[1.125rem] leading-relaxed text-ink"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </blockquote>
    );
  }
  return (
    <div
      className="prose-body text-[1.0625rem] leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function ButtonRow({ buttons }: { buttons: Extract<Block, { type: 'button' }>[] }) {
  return (
    <div className="mt-1 flex flex-wrap gap-3">
      {buttons.map((button, i) => (
        <Link
          key={i}
          href={internal(button.href)}
          className={
            i === 0
              ? 'bg-ink px-6 py-3 font-display text-sm font-700 text-white transition-colors hover:bg-ink-2'
              : 'border border-ink px-6 py-3 font-display text-sm font-700 text-ink transition-colors hover:bg-ink hover:text-white'
          }
        >
          {button.text}
        </Link>
      ))}
    </div>
  );
}
