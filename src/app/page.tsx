import Link from 'next/link';
import { getPage, getPracticeAreas, getPosts } from '@/lib/content';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';

export const revalidate = 300;

export default async function HomePage() {
  const [home, areas, posts] = await Promise.all([
    getPage('home'),
    getPracticeAreas(),
    getPosts(),
  ]);

  return (
    <>
      <section className="border-b border-line bg-surface-alt">
        <div className="site-container py-20 lg:py-28">
          <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-brass">
            Abu Dhabi · Egypt · India
          </p>
          {/* The page's single H1. Blocks can only emit h2-h4. */}
          <h1 className="mt-4 max-w-3xl text-4xl leading-[1.12] lg:text-5xl">
            Trusted litigation specialists protecting your business and peace of mind.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-body">
            Since 2011, Fakher &amp; Co has represented clients across the United Arab Emirates in
            dispute resolution, contract drafting, company formation and private notary services.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/contact-us"
              className="rounded-sm bg-ink px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-navy"
            >
              Speak to a lawyer
            </Link>
            <Link
              href="/services"
              className="rounded-sm border border-line bg-surface px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-brass"
            >
              Explore our services
            </Link>
          </div>
        </div>
      </section>

      <section className="site-container py-16">
        <h2 className="text-2xl">Our practice areas</h2>
        <p className="mt-2 max-w-2xl text-body">
          Five pillars covering {areas.reduce((n, a) => n + a.children.length, 0)} distinct legal
          services.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <Link
              key={area.slug}
              href={`/${area.slug}`}
              className="group rounded-md border border-line p-6 transition-colors hover:border-brass"
            >
              <h3 className="text-lg leading-snug group-hover:text-navy">{area.title}</h3>
              <p className="mt-2 text-sm text-muted">
                {area.children.length} service{area.children.length === 1 ? '' : 's'}
              </p>
              {area.excerpt && (
                <p className="mt-3 line-clamp-3 text-sm text-body">{area.excerpt}</p>
              )}
            </Link>
          ))}
        </div>
      </section>

      {home && home.blocks.length > 0 && (
        <section className="site-container max-w-3xl pb-16">
          <BlockRenderer blocks={home.blocks} />
        </section>
      )}

      {posts.length > 0 && (
        <section className="border-t border-line bg-surface-alt">
          <div className="site-container py-16">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-2xl">Legal insights</h2>
              <Link href="/legal-insights" className="text-sm text-navy underline">
                All {posts.length} articles
              </Link>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {posts.slice(0, 3).map((post) => (
                <Link
                  key={post.slug}
                  href={`/${post.slug}`}
                  className="group rounded-md border border-line bg-surface p-6 transition-colors hover:border-brass"
                >
                  <h3 className="text-base leading-snug group-hover:text-navy">{post.title}</h3>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-3 text-sm text-body">{post.excerpt}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
