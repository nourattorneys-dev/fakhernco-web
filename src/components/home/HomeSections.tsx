import Link from 'next/link';
import type { Block } from '@/lib/content';

/**
 * Compose the migrated homepage copy into the sections the original actually had.
 *
 * The old homepage is eight designed sections: hero, intro, a three-item
 * commitments row, a four-item services grid, a numbered three-step process,
 * a principles block, a "Visit Us" offices grid, and a closing CTA band.
 * Flattened by the extractor it becomes 72 blocks with 25 headings, and
 * rendering every heading the same way — which is what the previous version
 * did — throws all of that structure away.
 *
 * Rather than hardcode the section list against today's content, the shape is
 * detected:
 *
 *   - a heading with NO body of its own is a LEAD for the group that follows
 *   - the short groups after a lead (one paragraph, maybe one link) are its
 *     CARDS — that covers commitments, services and process alike
 *   - "Step N" headings turn that card row into a numbered process
 *   - a group carrying a `cards` block is the offices grid
 *   - anything else is an editorial two-column section
 *
 * Nothing is dropped: a group that matches no shape still renders.
 */

type Group = { heading: string; body: Block[] };

const paragraphs = (g: Group) => g.body.filter((b) => b.type === 'paragraph');
const buttons = (g: Group) =>
  g.body.filter((b): b is Extract<Block, { type: 'button' }> => b.type === 'button');
const cardsBlock = (g: Group) =>
  g.body.find((b): b is Extract<Block, { type: 'cards' }> => b.type === 'cards');

/** Short enough to sit in a card rather than a section of its own. */
const isCardSized = (g: Group) =>
  paragraphs(g).length === 1 &&
  !cardsBlock(g) &&
  paragraphs(g)[0].html.replace(/<[^>]+>/g, '').length < 420;

const STEP = /^step\s*(\d+)\s*/i;

function groupBlocks(blocks: Block[]): Group[] {
  const groups: Group[] = [];
  for (const block of blocks) {
    if (block.type === 'heading') groups.push({ heading: block.text, body: [] });
    else if (groups.length) groups[groups.length - 1].body.push(block);
  }
  return groups;
}

/** Strip the site origin so migrated CTAs route internally. */
const internal = (href: string) =>
  href.replace(/^https?:\/\/(www\.)?fakhernco\.com/, '').replace(/\/$/, '') || '/';

export function HomeSections({ blocks, skip = 0 }: { blocks: Block[]; skip?: number }) {
  const groups = groupBlocks(blocks).slice(skip);

  // Fold the flat list into rendered sections.
  const rendered: React.ReactNode[] = [];
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
        const isProcess = cards.every((c) => STEP.test(c.heading));
        rendered.push(
          <CardRow key={`row-${i}`} lead={group.heading} cards={cards} numbered={isProcess} alt={alt} />,
        );
        i = j;
        band += 1;
        continue;
      }
    }

    // The offices grid.
    const cardsInBody = cardsBlock(group);
    if (cardsInBody) {
      rendered.push(
        <OfficeGrid key={`offices-${i}`} heading={group.heading} group={group} cards={cardsInBody} alt={alt} />,
      );
      i += 1;
      band += 1;
      continue;
    }

    rendered.push(<Editorial key={`sec-${i}`} group={group} alt={alt} />);
    i += 1;
    band += 1;
  }

  return <>{rendered}</>;
}

// ---------------------------------------------------------------- sections

function Editorial({ group, alt }: { group: Group; alt: boolean }) {
  const paras = paragraphs(group);
  const btns = buttons(group);
  if (!paras.length && !btns.length) return null;

  return (
    <section className={`border-t border-line ${alt ? 'bg-surface-alt' : ''}`}>
      <div className="site-container grid gap-8 py-14 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-16 lg:py-20">
        <h2 className="text-section lg:sticky lg:top-28 lg:self-start">{group.heading}</h2>
        <div className="flex max-w-[62ch] flex-col gap-5">
          {paras.map((p, i) => (
            <div
              key={i}
              className="prose-body text-[1.0625rem] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: p.html }}
            />
          ))}
          {btns.length > 0 && <ButtonRow buttons={btns} />}
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
  const cols = cards.length === 4 ? 'lg:grid-cols-4' : cards.length === 2 ? 'sm:grid-cols-2' : 'lg:grid-cols-3';

  return (
    <section className={`border-t border-line ${alt ? 'bg-surface-alt' : ''}`}>
      <div className="site-container py-14 lg:py-20">
        <h2 className="max-w-[24ch] text-section">{lead.replace(/:$/, '')}</h2>

        <div className={`mt-12 grid gap-px border border-line bg-line sm:grid-cols-2 ${cols}`}>
          {cards.map((card, i) => {
            const title = card.heading.replace(STEP, '').trim();
            const step = numbered ? (card.heading.match(STEP)?.[1] ?? String(i + 1)) : null;
            const body = paragraphs(card)[0];
            const link = buttons(card)[0];

            return (
              <div key={card.heading} className="flex flex-col bg-surface p-7">
                <span className="font-display text-xs font-700 tabular-nums text-faint">
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

function OfficeGrid({
  heading,
  group,
  cards,
  alt,
}: {
  heading: string;
  group: Group;
  cards: Extract<Block, { type: 'cards' }>;
  alt: boolean;
}) {
  const intro = paragraphs(group)[0];

  return (
    <section className={`border-t border-line ${alt ? 'bg-surface-alt' : ''}`}>
      <div className="site-container py-14 lg:py-20">
        <p className="eyebrow text-muted">Our office locations</p>
        <h2 className="mt-4 text-section">{heading}</h2>
        {intro && (
          <div
            className="prose-body mt-4 max-w-[62ch] text-[1.0625rem]"
            dangerouslySetInnerHTML={{ __html: intro.html }}
          />
        )}

        <div className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {cards.items.map((card, i) => (
            <div key={i} className="bg-surface p-7">
              <h3 className="text-base leading-snug">{card.title}</h3>
              {card.text && <p className="mt-2 text-sm leading-relaxed text-body">{card.text}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
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
