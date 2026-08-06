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
        Hero: copy on the left, full-bleed photograph on the right.
        The photograph is the only colour in the composition — everything
        around it is black, white and grey, which is what makes it carry.
      */}
      <section className="border-b border-line">
        <div className="grid lg:grid-cols-[1.05fr_1fr]">
          <div className="flex items-center">
            <div className="w-full py-16 pl-5 pr-5 sm:pl-8 lg:py-24 lg:pl-[max(2rem,calc((100vw-78rem)/2+2rem))] lg:pr-14">
              <p className="eyebrow">{hero?.heroEyebrow ?? 'Trusted Law Firm in Abu Dhabi & Dubai'}</p>

              {/* The page's single H1. Content blocks can only emit h2-h4. */}
              <h1 className="mt-5 text-hero">
                {titleHead}
                {titleTail.length > 0 && (
                  <span className="text-muted"> in {titleTail.join(' in ')}</span>
                )}
              </h1>

              <p className="mt-7 max-w-[52ch] text-lg leading-relaxed text-body">
                {hero?.heroText}
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/contact-us"
                  className="bg-ink px-7 py-3.5 font-display text-sm font-700 text-white transition-colors hover:bg-ink-2"
                >
                  Request a consultation
                </Link>
                <Link
                  href="/services"
                  className="border border-ink px-7 py-3.5 font-display text-sm font-700 text-ink transition-colors hover:bg-ink hover:text-white"
                >
                  Explore {serviceCount} services
                </Link>
              </div>
            </div>
          </div>

          {hero?.heroImage && (
            <div className="relative min-h-[18rem] lg:min-h-[38rem]">
              <Image
                src={hero.heroImage.src}
                alt={hero.heroImage.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {/* Credentials strip */}
      <section className="border-b border-line bg-surface-alt">
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
        <p className="eyebrow">Dedicated to your business</p>
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
                <p className="eyebrow">Legal Insights</p>
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
