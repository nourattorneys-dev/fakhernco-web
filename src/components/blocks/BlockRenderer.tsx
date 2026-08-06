import Image from 'next/image';
import type { Block } from '@/lib/content';

/**
 * Renders the block union.
 *
 * Note there is no `h1` case. The page template owns the single H1 — on the
 * WordPress site 222 stray H1 blocks were authored across 49 documents,
 * because the theme let each block pick its own tag.
 */
export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block, i) => (
        <BlockItem key={i} block={block} />
      ))}
    </div>
  );
}

function BlockItem({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading': {
      const Tag = `h${block.level}` as 'h2' | 'h3' | 'h4';
      const size =
        block.level === 2 ? 'text-2xl mt-6' : block.level === 3 ? 'text-xl mt-4' : 'text-lg mt-2';
      return <Tag className={`${size} leading-snug`}>{block.text}</Tag>;
    }

    case 'paragraph':
      return (
        <div
          className="prose-body text-[1.0625rem] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );

    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul';
      return (
        <Tag
          className={`${block.ordered ? 'list-decimal' : 'list-disc'} prose-body flex flex-col gap-2 pl-5 marker:text-brass`}
        >
          {block.items.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </Tag>
      );
    }

    case 'table':
      return (
        // Wide tables scroll inside their own container so the page body never
        // scrolls sideways.
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            {block.headers.length > 0 && (
              <thead>
                <tr className="bg-surface-alt">
                  {block.headers.map((h, i) => (
                    <th
                      key={i}
                      className="border-b border-line px-4 py-2.5 text-left font-semibold text-ink"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-b border-line-soft last:border-0">
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="prose-body px-4 py-2.5 align-top"
                      dangerouslySetInnerHTML={{ __html: cell }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'faq':
      return (
        <div className="flex flex-col gap-2">
          {block.items.map((item, i) => (
            <details
              key={i}
              className="group rounded-md border border-line bg-surface-alt px-4 py-3 open:bg-surface"
            >
              <summary className="cursor-pointer list-none font-medium text-ink marker:hidden">
                <span className="mr-2 text-brass group-open:hidden">+</span>
                <span className="mr-2 hidden text-brass group-open:inline">–</span>
                {item.question}
              </summary>
              <p className="mt-2 pl-5 text-body">{item.answer}</p>
            </details>
          ))}
        </div>
      );

    case 'cards':
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {block.items.map((card, i) => (
            <div key={i} className="rounded-md border border-line bg-surface-alt p-5">
              <h3 className="text-base font-semibold">{card.title}</h3>
              {card.text && <p className="mt-2 text-sm text-body">{card.text}</p>}
              {card.href && (
                <a href={card.href} className="mt-3 inline-block text-sm text-navy underline">
                  Read more
                </a>
              )}
            </div>
          ))}
        </div>
      );

    case 'image':
      return (
        <figure className="overflow-hidden rounded-md">
          <Image
            src={block.src}
            alt={block.alt}
            width={1200}
            height={700}
            className="h-auto w-full object-cover"
            sizes="(max-width: 768px) 100vw, 720px"
          />
        </figure>
      );

    case 'button':
      return (
        <div>
          <a
            href={block.href}
            className="inline-block rounded-sm bg-ink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            {block.text}
          </a>
        </div>
      );

    case 'quote':
      return (
        <blockquote className="border-l-2 border-brass pl-5">
          <div className="prose-body italic" dangerouslySetInnerHTML={{ __html: block.html }} />
          {block.attribution && (
            <cite className="mt-2 block text-sm not-italic text-muted">— {block.attribution}</cite>
          )}
        </blockquote>
      );

    default:
      return null;
  }
}
