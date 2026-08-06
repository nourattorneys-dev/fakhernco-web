import Link from 'next/link';
import Image from 'next/image';
import { getHomepage, getPage, getPracticeAreas, getPosts } from '@/lib/content';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';

export const revalidate = 300;

export default async function HomePage() {
  const [hero, home, areas, posts] = await Promise.all([
    getHomepage(),
    getPage('home'),
    getPracticeAreas(),
    getPosts(),
  ]);

  const serviceCount = areas.reduce((n, a) => n + a.children.length, 0);
  const [titleHead, ...titleTail] = (hero?.heroTitle ?? 'Expert Legal Services in the UAE').split(
    ' in ',
  );

  return (
    <>
      {/*
        Hero: full-bleed photograph with the copy set over it.
        The photograph is the only colour on the page — everything around it
        is black, white and grey, which is what lets it carry the composition.

        The scrim is a left-to-right gradient rather than a flat overlay, so
        the right side of the image stays fully saturated while the text side
        holds contrast. Text sits at roughly 15:1 against the darkened area.
      */}
      <section className="relative flex min-h-[clamp(30rem,78vh,46rem)] items-center overflow-hidden bg-ink">
        {/*
          Positive z-indices, layered explicitly.

          A negative z-index here does NOT work: the section establishes a
          stacking context, so the image would sit behind the section's own
          background and be painted over entirely.
        */}
        {hero?.heroImage && (
          <Image
            src={hero.heroImage.src}
            alt={hero.heroImage.alt}
            fill
            priority
            sizes="100vw"
            className="z-0 object-cover object-[62%_center]"
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0 z-10 bg-gradient-to-r from-black/92 via-black/70 to-black/30 lg:via-black/55 lg:to-black/10"
        />

        <div className="site-container relative z-20 py-20">
          <p className="eyebrow max-w-[46ch] text-white/75">
            {hero?.heroEyebrow ?? 'Trusted Law Firm in Abu Dhabi & Dubai'}
          </p>

          {/* The page's single H1. Content blocks can only emit h2-h4. */}
          <h1 className="mt-5 text-hero text-white">
            <span className="block">{titleHead}</span>
            {titleTail.length > 0 && (
              <span className="block text-white/55">in {titleTail.join(' in ')}</span>
            )}
          </h1>

          <p className="mt-7 max-w-[50ch] text-lg leading-relaxed text-white/80">
            {hero?.heroText}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/contact-us"
              className="bg-white px-7 py-3.5 font-display text-sm font-700 text-ink transition-colors hover:bg-white/85"
            >
              Request a consultation
            </Link>
            <Link
              href="/services"
              className="border border-white/70 px-7 py-3.5 font-display text-sm font-700 text-white transition-colors hover:bg-white hover:text-ink"
            >
              Explore {serviceCount} services
            </Link>
          </div>
        </div>
      </section>

      {/* Credentials strip */}
      <section className="border-b border-line">
        <div className="site-container grid grid-cols-2 gap-y-8 py-12 sm:grid-cols-4">
          {[
            ['2011', 'Established'],
            [String(areas.length), 'Practice areas'],
            [String(serviceCount), 'Legal services'],
            ['3', 'Offices'],
          ].map(([value, label]) => (
            <div key={label}>
              <span className="block font-display text-4xl font-700 tabular-nums text-ink">
                {value}
              </span>
              <span className="mt-1 block text-xs uppercase tracking-[0.08em] text-muted">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Practice areas */}
      <section className="site-container py-20">
        <p className="eyebrow text-ink">Dedicated to your business</p>
        <h2 className="mt-4 max-w-[20ch] text-display">
          Legal challenges in the UAE require the right partner.
        </h2>

        <div className="mt-12 grid border-t border-l border-line sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area, i) => (
            <Link
              key={area.slug}
              href={`/${area.slug}`}
              className="group flex flex-col border-b border-r border-line p-8 transition-colors hover:bg-surface-alt"
            >
              <span className="font-display text-xs font-700 tabular-nums text-faint">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 text-xl leading-tight">{area.title}</h3>
              <p className="mt-3 text-sm text-body">
                {area.children.length} service{area.children.length === 1 ? '' : 's'}
              </p>
              <span className="mt-6 font-display text-sm font-600 text-ink underline decoration-faint underline-offset-4 transition-colors group-hover:decoration-ink">
                View practice area
              </span>
            </Link>
          ))}
        </div>
      </section>

      {home && home.blocks.length > 0 && (
        <section className="border-t border-line bg-surface-alt">
          <div className="site-container max-w-3xl py-20">
            <BlockRenderer blocks={home.blocks} />
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="border-t border-line">
          <div className="site-container py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-ink">Legal Insights</p>
                <h2 className="mt-4 text-display">Guidance on UAE law</h2>
              </div>
              <Link
                href="/legal-insights"
                className="font-display text-sm font-600 underline decoration-faint underline-offset-4 hover:decoration-ink"
              >
                All {posts.length} articles
              </Link>
            </div>

            <div className="mt-12 grid gap-px border border-line bg-line md:grid-cols-3">
              {posts.slice(0, 3).map((post) => (
                <Link
                  key={post.slug}
                  href={`/${post.slug}`}
                  className="group flex flex-col bg-surface p-8 transition-colors hover:bg-surface-alt"
                >
                  {post.date && (
                    <time
                      dateTime={post.date}
                      className="text-xs uppercase tracking-[0.08em] text-muted"
                    >
                      {new Date(post.date).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </time>
                  )}
                  <h3 className="mt-3 text-lg leading-snug">{post.title}</h3>
                  {post.excerpt && (
                    <p className="mt-3 line-clamp-3 text-sm text-body">{post.excerpt}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Closing CTA — the one full-black block on the page. */}
      <section className="bg-ink">
        <div className="site-container flex flex-wrap items-center justify-between gap-8 py-16">
          <div>
            <h2 className="max-w-[20ch] text-section text-white">
              Speak to a lawyer about your matter.
            </h2>
            <p className="mt-3 max-w-[52ch] text-white/60">
              Abu Dhabi · Mansoura · New Delhi. Monday to Friday, 9AM – 6PM.
            </p>
          </div>
          <Link
            href="/contact-us"
            className="bg-white px-7 py-3.5 font-display text-sm font-700 text-ink transition-colors hover:bg-white/85"
          >
            Contact us
          </Link>
        </div>
      </section>
    </>
  );
}
