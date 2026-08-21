import Link from 'next/link';
import Image from 'next/image';
import { getHomepage, getPage, getPracticeAreas, getPosts, getTranslatedPaths } from '@/lib/content';
import { HomeSections } from '@/components/home/HomeSections';
import { LOCALE_DATE, type Locale } from '@/lib/locale';
import { t, href } from '@/lib/ui';

/**
 * The homepage, in either locale.
 *
 * Both /  and /ar render this. Keeping it in one place is what stops the two
 * homepages drifting: the Arabic page is a translation of the English one, so
 * a layout change that only landed on one of them would be a bug either way.
 *
 * Everything that differs is either content (fetched per locale) or a label
 * from the string table. The one piece of real per-locale logic is the hero
 * headline split, below.
 */
export async function Homepage({ locale = 'en' }: { locale?: Locale }) {
  const s = t(locale);
  const [hero, home, areas, posts] = await Promise.all([
    getHomepage(locale),
    getPage('home', locale),
    getPracticeAreas(locale),
    getPosts(locale),
  ]);

  const serviceCount = areas.reduce((n, a) => n + a.children.length, 0);

  /*
    The H1 sets its tail in a lighter weight — "Expert Legal Services" over a
    muted "in the UAE". The split point is the preposition, which is ' in ' in
    English and ' في ' in Arabic, so it comes from the string table rather
    than being hardcoded. A headline without the preposition simply renders as
    one line, which is the correct fallback in both languages.
  */
  const [titleHead, ...titleTail] = (hero?.heroTitle ?? '').split(s.heroSplit);

  /*
    Which of these exist in the current locale, asked rather than assumed.

    This was the literal ['/ar/contact-us', '/ar/services'], which no search for
    `'ar'` as a locale would ever surface. It is correct for Arabic and wrong for
    anything else: href() checks membership, a German target is not in an Arabic
    list, and all three hero CTAs would have fallen back to English on the German
    homepage — quietly, since falling back is the helper's designed behaviour.

    getTranslatedPaths is cache()d and the header already calls it on every
    render, so this costs no extra requests.
  */
  const localePaths = await getTranslatedPaths(locale);

  return (
    <>
      {/*
        Hero: full-bleed photograph with the copy set over it.
        The photograph is the only colour on the page — everything around it
        is black, white and grey, which is what lets it carry the composition.

        The scrim is a left-to-right gradient rather than a flat overlay, so
        the far side of the image stays fully saturated while the text side
        holds contrast. Text sits at roughly 15:1 against the darkened area.
        It is a logical-direction gradient, so it flips with the text in RTL
        and the darkened side stays under the words.
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
            className="z-0 object-cover object-[62%_center] rtl:object-[38%_center]"
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0 z-10 bg-gradient-to-r from-black/92 via-black/70 to-black/30 rtl:bg-gradient-to-l lg:via-black/55 lg:to-black/10"
        />

        <div className="site-container relative z-20 py-20">
          {hero?.heroEyebrow && (
            <p className="eyebrow max-w-[46ch] text-white/75">{hero.heroEyebrow}</p>
          )}

          {/* The page's single H1. Content blocks can only emit h2-h4. */}
          <h1 className="mt-5 text-hero text-white">
            <span className="block">{titleHead}</span>
            {titleTail.length > 0 && (
              <span className="block text-white/55">
                {s.heroSplit.trim()} {titleTail.join(s.heroSplit)}
              </span>
            )}
          </h1>

          <p className="mt-7 max-w-[50ch] text-lg leading-relaxed text-white/80">
            {hero?.heroText}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href={href(locale, '/contact-us', localePaths)}
              className="bg-white px-7 py-3.5 font-display text-sm font-700 text-ink transition-colors hover:bg-white/85"
            >
              {s.requestConsultation}
            </Link>
            <Link
              href={href(locale, '/services', localePaths)}
              className="border border-white/70 px-7 py-3.5 font-display text-sm font-700 text-white transition-colors hover:bg-white hover:text-ink"
            >
              {s.exploreServices(serviceCount)}
            </Link>
          </div>
        </div>
      </section>

      {/*
        The migrated homepage copy, composed back into the sections the
        original actually had: intro, commitments, services, a numbered
        process, principles and the offices grid.

        skip={3} drops the first three groups — they are the three slides of
        the original's hero carousel, and the hero above already presents
        slide one. Rendering them again would restate it three times.
      */}
      {home && home.blocks.length > 0 && (
        <HomeSections blocks={home.blocks} skip={3} images={hero?.sectionImages ?? []} locale={locale} />
      )}

      {/*
        The insights teaser self-hides when there are no posts in this locale,
        which is currently the case for Arabic — none of the articles have
        been translated. Showing English article cards on an Arabic page would
        be worse than showing none.
      */}
      {posts.length > 0 && (
        <section className="border-t border-line">
          <div className="site-container section">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-ink">{s.insights}</p>
                <h2 className="mt-4 text-display">{s.insightsHeading}</h2>
              </div>
              <Link
                href={href(locale, '/legal-insights', localePaths)}
                className="font-display text-sm font-600 underline decoration-faint underline-offset-4 hover:decoration-ink"
              >
                {s.allArticles(posts.length)}
              </Link>
            </div>

            <div className="section-body grid gap-px border border-line bg-line md:grid-cols-3">
              {posts.slice(0, 3).map((post) => (
                <Link
                  key={post.slug}
                  href={href(locale, `/${post.slug}`)}
                  className="group flex flex-col bg-surface card-p transition-colors hover:bg-surface-alt"
                >
                  {post.date && (
                    <time
                      dateTime={post.date}
                      className="text-xs uppercase tracking-[0.08em] text-muted"
                    >
                      {new Date(post.date).toLocaleDateString(LOCALE_DATE[locale], {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
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
    </>
  );
}
