import Link from 'next/link';
import type { Block } from '@/lib/content';

/**
 * Render the migrated homepage copy as editorial sections.
 *
 * The old homepage was a designed builder layout; flattened it becomes 72
 * blocks with 25 headings. Piping that through the standard article renderer
 * produced a narrow column of undifferentiated prose scrolling for pages —
 * technically correct, unreadable in practice.
 *
 * Instead the flat list is regrouped into sections at each heading, and each
 * section is laid out two-column with alternating grounds. That is close to
 * how the original actually presented, and it uses the full width the article
 * measure leaves empty.
 */

type Section = { heading: string; body: Block[] };

function groupIntoSections(blocks: Block[]): Section[] {
  const sections: Section[] = [];
  for (const block of blocks) {
    if (block.type === 'heading') {
      sections.push({ heading: block.text, body: [] });
    } else if (sections.length) {
      sections[sections.length - 1].body.push(block);
    }
  }
  return sections.filter((s) => s.body.length > 0);
}

/** Strip the site origin so migrated CTAs route internally. */
const internal = (href: string) =>
  href.replace(/^https?:\/\/(www\.)?fakhernco\.com/, '').replace(/\/$/, '') || '/';

export function HomeSections({ blocks, skip = 0 }: { blocks: Block[]; skip?: number }) {
  const sections = groupIntoSections(blocks).slice(skip);
  if (!sections.length) return null;

  return (
    <>
      {sections.map((section, i) => (
        <section
          key={`${section.heading}-${i}`}
          className={`border-t border-line ${i % 2 === 1 ? 'bg-surface-alt' : ''}`}
        >
          <div className="site-container grid gap-8 py-14 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-16 lg:py-16">
            <h2 className="text-section lg:sticky lg:top-28 lg:self-start">{section.heading}</h2>

            <div className="flex max-w-[60ch] flex-col gap-5">
              {section.body.map((block, j) => {
                switch (block.type) {
                  case 'paragraph':
                    return (
                      <div
                        key={j}
                        className="prose-body text-[1.0625rem] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: block.html }}
                      />
                    );
                  case 'list':
                    return (
                      <ul key={j} className="prose-body flex list-disc flex-col gap-2 pl-5 marker:text-faint">
                        {block.items.map((item, k) => (
                          <li key={k} dangerouslySetInnerHTML={{ __html: item }} />
                        ))}
                      </ul>
                    );
                  case 'cards':
                    return (
                      <div key={j} className="grid gap-px border border-line bg-line sm:grid-cols-2">
                        {block.items.map((card, k) => (
                          <div key={k} className="bg-surface p-5">
                            <h3 className="text-base">{card.title}</h3>
                            {card.text && <p className="mt-2 text-sm text-body">{card.text}</p>}
                          </div>
                        ))}
                      </div>
                    );
                  default:
                    return null;
                }
              })}

              {/* CTAs from this section, collected onto one row. */}
              {section.body.some((b) => b.type === 'button') && (
                <div className="mt-1 flex flex-wrap gap-3">
                  {section.body
                    .filter((b): b is Extract<Block, { type: 'button' }> => b.type === 'button')
                    .map((button, j) => (
                      <Link
                        key={j}
                        href={internal(button.href)}
                        className="border border-ink px-5 py-2.5 font-display text-sm font-700 text-ink transition-colors hover:bg-ink hover:text-white"
                      >
                        {button.text}
                      </Link>
                    ))}
                </div>
              )}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
