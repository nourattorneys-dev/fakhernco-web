import Link from 'next/link';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { JsonLd } from '@/components/JsonLd';
import { articleSchema, faqSchema, graph, serviceSchema } from '@/lib/schema';
import { breadcrumbSchema } from '@/lib/schema';
import { pathIn, type Locale } from '@/lib/locale';
import { t } from '@/lib/ui';
import type { Doc } from '@/lib/content';

/**
 * A document page for a NON-DEFAULT locale.
 *
 * Extracted from the Arabic [slug] route, which German would otherwise have
 * copied wholesale — including a hardcoded `<Link href="/">English</Link>` in
 * the breadcrumb. A German copy would have reproduced that faithfully: a link
 * labelled "English" pointing at the English homepage, in the German
 * breadcrumb. `(ar)/not-found.tsx` records that this exact class of mistake —
 * a locale route copied from another and left pointing at the wrong language —
 * already shipped once.
 *
 * The breadcrumb now goes to the CURRENT locale's home, labelled from the
 * string table, so the link means the same thing in every language.
 *
 * DELIBERATELY NOT USED BY (en). The English route renders a materially richer
 * template — related services from getPracticeAreas, a tel: call to action, a
 * published date — and folding those together is a separate decision about the
 * highest-traffic route on the site, not a side effect of adding a language.
 */
export function DocumentArticle({
  doc,
  description,
  locale,
}: {
  doc: Doc;
  description: string;
  locale: Locale;
}) {
  const s = t(locale);
  const label = s.kindLabel[doc.kind];
  const home = pathIn('/', locale);
  const self = pathIn(`/${doc.slug}`, locale);

  return (
    <article>
      <JsonLd
        data={graph(
          breadcrumbSchema([
            { name: s.home, path: home },
            { name: doc.title, path: self },
          ]),
          /*
            Same branch the English route uses. Applying serviceSchema to every
            kind typed translated posts as Service in one language and Article
            in another, and typed informational pages — meet-your-advocates,
            our-unwavering-principles, why-choose-fakherco — as services.
          */
          doc.kind === 'post' || doc.kind === 'case-study'
            ? articleSchema(doc, description, locale)
            : serviceSchema(doc, description, locale),
          faqSchema(doc.blocks),
        )}
      />

      <header className="border-b border-line bg-surface-alt">
        <div className="site-container section-tight">
          <nav aria-label={s.breadcrumb} className="text-xs text-muted">
            <Link href={home} className="hover:text-ink">
              {s.home}
            </Link>
            <span aria-hidden className="mx-2">
              /
            </span>
            <span className="text-body">{doc.title}</span>
          </nav>

          {label && <p className="eyebrow mt-6 text-muted">{label}</p>}

          {/* The single H1. */}
          <h1 className="mt-4 max-w-[24ch] text-display">{doc.title}</h1>

          {description && <p className="mt-5 max-w-[62ch] text-lead text-body">{description}</p>}
        </div>
      </header>

      <div className="site-container section">
        <div className="max-w-[46rem]">
          {doc.blocks.length > 0 ? (
            <BlockRenderer blocks={doc.blocks} />
          ) : (
            <p className="text-muted">{s.noContent}</p>
          )}
        </div>
      </div>

      <section className="bg-ink">
        <div className="site-container section-tight flex flex-wrap items-center justify-between gap-8">
          <h2 className="max-w-[26ch] text-section text-white">{s.readyToProtect}</h2>
          <Link
            href={pathIn('/contact-us', locale)}
            className="bg-white px-8 py-4 font-display text-sm font-700 text-ink transition-colors hover:bg-white/85"
          >
            {s.contactUs}
          </Link>
        </div>
      </section>
    </article>
  );
}
