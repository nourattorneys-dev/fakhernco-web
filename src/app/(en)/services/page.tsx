import type { Metadata } from 'next';
import Link from 'next/link';
import { describe, getPage, getPracticeAreas } from '@/lib/content';
import { alternatesFor } from '@/lib/locale';
import { localesFor } from '@/lib/content';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';

export const revalidate = 300;

/**
 * A literal route segment ALWAYS beats [slug] in the App Router, so this file
 * shadows the migrated /services CMS page. It therefore has to render that
 * page's content itself — otherwise the record would exist in Strapi, the URL
 * would return 200, and the body would silently be missing.
 */
export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('services');
  return {
    title: page?.seo?.metaTitle || 'Legal Services in the UAE',
    description: page
      ? describe(page)
      : 'Litigation, contracts, company formation and private notary services across the UAE.',
    alternates: alternatesFor('/services', await localesFor('/services')),
  };
}

export default async function ServicesPage() {
  const [page, areas] = await Promise.all([getPage('services'), getPracticeAreas()]);
  const total = areas.reduce((n, a) => n + a.children.length, 0);

  return (
    <>
      <header className="border-b border-line">
        <div className="site-container section-tight">
          <p className="eyebrow text-ink">Our Services</p>
          <h1 className="mt-4 max-w-[24ch] text-display">{page?.title ?? 'Legal Services'}</h1>
          <p className="mt-5 max-w-[56ch] text-lg text-body">
            {total} services across {areas.length} practice areas, for businesses, investors and
            individuals across the UAE.
          </p>
        </div>
      </header>

      {areas.map((area, i) => (
        <section key={area.slug} className="border-b border-line">
          <div className="site-container section-tight">
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
              <span className="font-display text-xs font-700 tabular-nums text-faint">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h2 className="text-section">
                <Link href={`/${area.slug}`} className="underline decoration-transparent underline-offset-4 transition hover:decoration-ink">
                  {area.title}
                </Link>
              </h2>
              <span className="text-sm text-muted">{area.children.length} services</span>
            </div>

            <ul className="mt-8 grid border-t border-l border-line sm:grid-cols-2 lg:grid-cols-3">
              {area.children.map((child) => (
                <li key={child.slug} className="border-b border-r border-line">
                  <Link
                    href={`/${child.slug}`}
                    className="block h-full p-5 text-[0.9375rem] leading-snug transition-colors hover:bg-surface-alt"
                  >
                    {child.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      {page && page.blocks.length > 0 && (
        <div className="site-container section-tight max-w-[46rem]">
          <BlockRenderer blocks={page.blocks} />
        </div>
      )}
    </>
  );
}
