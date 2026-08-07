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

/**
 * "Step 1", and its Arabic equivalent.
 *
 * The Arabic homepage numbers its process with ordinal words — أولاً, ثانياً,
 * ثالثاً — because that is how the firm's own translation wrote them, and
 * "الخطوة 1" would read as a translation of an English label rather than
 * Arabic. There is no digit to capture, so the rendered number falls back to
 * the card's position, which is the same value either way.
 */
const STEP = /^(?:step\s*(\d+)|أولاً|ثانياً|ثالثاً|رابعاً|خامساً)\s*/i;

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

  /*
    Planned first, rendered second.

    The two passes exist so photographs can be assigned by RANK rather than by
    an absolute character count. The original rule — "a section longer than
    380 characters gets a photograph" — is a length threshold applied to two
    different scripts, and Arabic says the same thing in about 0.86 of the
    characters English needs. Two sections sat either side of the line, so the
    Arabic homepage rendered three photographs where the English one rendered
    four, and the layouts silently diverged.

    Ranking is stable under translation where an absolute count is not: the
    longest sections stay the longest sections. Both locales now select the
    same set. Images are still handed out in document order, so the alternating
    left/right rhythm is unchanged.
  */
  type Planned =
    | { kind: 'cards'; i: number; lead: string; cards: Group[]; alt: boolean }
    | { kind: 'offices'; i: number; group: Group; cards: Extract<Block, { type: 'cards' }>; alt: boolean }
    | { kind: 'cta'; i: number; run: Group[] }
    | { kind: 'editorial'; i: number; group: Group; alt: boolean; length: number };

  const plan: Planned[] = [];
  let i = 0;
  let band = 0;

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
        plan.push({ kind: 'cards', i, lead: group.heading, cards, alt });
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
      plan.push({ kind: 'offices', i, group, cards: cardsInBody, alt });
      i += 1;
      band += 1;
      continue;
    }

    // A heading whose entire body is call-to-action buttons.
    //
    // These arrive in consecutive pairs: the builder authored one CTA as a
    // long sentence and the next as a short headline, each with its own
    // button to the same URL. Rendered separately that is two stacked black
    // bands saying the same thing twice. Collect the run and merge it.
    if (paragraphs(group).length === 0 && buttons(group).length > 0) {
      const run = [group];
      let j = i + 1;
      while (
        j < groups.length &&
        paragraphs(groups[j]).length === 0 &&
        buttons(groups[j]).length > 0
      ) {
        run.push(groups[j]);
        j += 1;
      }
      plan.push({ kind: 'cta', i, run });
      i = j;
      band += 1;
      continue;
    }

    plan.push({ kind: 'editorial', i, group, alt, length: textLength(group) });
    i += 1;
    band += 1;
  }

  // The longest editorial sections get the photographs; short ones stay
  // text-only so the imagery does not become wallpaper.
  const withImages = new Set(
    plan
      .filter((p): p is Extract<Planned, { kind: 'editorial' }> => p.kind === 'editorial')
      .sort((a, b) => b.length - a.length)
      .slice(0, images.length)
      .map((p) => p.i),
  );

  let imageIndex = 0;
  const rendered = plan.map((p) => {
    switch (p.kind) {
      case 'cards':
        return (
          <CardRow
            key={`row-${p.i}`}
            lead={p.lead}
            cards={p.cards}
            numbered={p.cards.every((c) => STEP.test(c.heading))}
            alt={p.alt}
          />
        );
      case 'offices':
        return <Offices key={`offices-${p.i}`} group={p.group} cards={p.cards} alt={p.alt} />;
      case 'cta':
        return <CtaBand key={`cta-${p.i}`} groups={p.run} />;
      case 'editorial': {
        const image = withImages.has(p.i) ? images[imageIndex] : null;
        const flip = imageIndex % 2 === 1;
        if (image) imageIndex += 1;
        return <Editorial key={`sec-${p.i}`} group={p.group} alt={p.alt} image={image} flip={flip} />;
      }
    }
  });

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

  /*
    The office grid is recovered from a flat list of cards — the builder had
    no notion of an "office", just Address / Phone / Email repeated three
    times. An address card starts a new office and the cards after it belong
    to it.

    These labels are content, so they arrive translated: العنوان في الإمارات,
    الهاتف, البريد الإلكتروني. Matching English only would collapse the Arabic
    page to zero offices and drop the addresses entirely, so every label test
    below covers both languages.
  */
  const ADDRESS = /address|العنوان/i;
  const EMAIL = /email|البريد/i;
  const PHONE = /phone|call|الهاتف|اتصل/i;

  for (const card of cards.items) {
    if (ADDRESS.test(card.title)) {
      offices.push({
        // "UAE Address" -> "UAE", "العنوان في الإمارات" -> "الإمارات".
        name:
          card.title.replace(/\s*address\s*/i, '').replace(/^\s*العنوان\s*(في)?\s*/, '').trim() ||
          card.title,
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
    if (EMAIL.test(label)) return `mailto:${v}`;
    // Phone numbers stay Western-numeral and LTR even in Arabic copy, so the
    // tel: URI needs no special handling — but strip anything that is not a
    // digit or a leading +, since the UAE card carries two numbers.
    if (PHONE.test(label)) return `tel:${v.split(/\s+/)[0].replace(/[^\d+]/g, '')}`;
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

/**
 * The closing call to action, inverted.
 *
 * Takes a run of CTA groups rather than one. The shortest heading becomes the
 * headline — it is the punchy one ("Ready to Protect Your Legal Interests?")
 * — and the longer sentences become supporting copy beneath it. Buttons are
 * deduplicated by destination, because both of these pointed at /contact-us
 * with different labels; the shorter label wins.
 */
function CtaBand({ groups }: { groups: Group[] }) {
  const headings = groups.map((g) => g.heading).sort((a, b) => a.length - b.length);
  const [headline, ...supporting] = headings;

  const seen = new Map<string, Extract<Block, { type: 'button' }>>();
  for (const b of groups.flatMap(buttons)) {
    const key = internal(b.href);
    const existing = seen.get(key);
    if (!existing || b.text.length < existing.text.length) seen.set(key, b);
  }
  const btns = [...seen.values()];

  return (
    <section className="bg-ink">
      <div className="site-container section">
        <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <div className="max-w-[46ch]">
            <h2 className="text-display text-white">{headline}</h2>
            {supporting.length > 0 && (
              <p className="mt-5 text-lead text-white/65">{supporting.join(' ')}</p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            {btns.map((b, i) => (
              <Link
                key={i}
                href={internal(b.href)}
                className={
                  i === 0
                    ? 'bg-white px-8 py-4 font-display text-sm font-700 text-ink transition-colors hover:bg-white/85'
                    : 'border border-white/60 px-8 py-4 font-display text-sm font-700 text-white transition-colors hover:bg-white hover:text-ink'
                }
              >
                {b.text}
              </Link>
            ))}
          </div>
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
