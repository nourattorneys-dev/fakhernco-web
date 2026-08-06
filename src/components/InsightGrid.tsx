import Link from 'next/link';
import type { Summary } from '@/lib/content';

export function InsightGrid({ posts }: { posts: Summary[] }) {
  return (
    <ul className="grid gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <li key={post.slug} className="bg-surface">
          <Link
            href={`/${post.slug}`}
            className="group flex h-full flex-col p-7 transition-colors hover:bg-surface-alt"
          >
            {post.date && (
              <time dateTime={post.date} className="text-xs uppercase tracking-[0.08em] text-muted">
                {new Date(post.date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </time>
            )}
            <h2 className="mt-3 text-lg leading-snug">{post.title}</h2>
            {post.excerpt && (
              <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-body">{post.excerpt}</p>
            )}
            <span className="mt-auto pt-5 font-display text-sm font-600 text-ink underline decoration-faint underline-offset-4 transition-colors group-hover:decoration-ink">
              Read article
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Numbered pagination.
 *
 * Real links, not a "load more" button: every page of the archive has to be
 * crawlable, and 146 articles behind a JavaScript control would be invisible
 * to a crawler that does not execute it.
 */
export function Pagination({
  page,
  pageCount,
  basePath,
}: {
  page: number;
  pageCount: number;
  basePath: string;
}) {
  if (pageCount <= 1) return null;

  const href = (n: number) => (n === 1 ? basePath : `${basePath}/page/${n}`);
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center gap-2">
      {page > 1 && (
        <Link
          href={href(page - 1)}
          rel="prev"
          className="border border-line px-4 py-2 font-display text-sm font-600 transition-colors hover:border-ink"
        >
          Previous
        </Link>
      )}

      {pages.map((n) => (
        <Link
          key={n}
          href={href(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`min-w-10 border px-3 py-2 text-center font-display text-sm font-600 tabular-nums transition-colors ${
            n === page
              ? 'border-ink bg-ink text-white'
              : 'border-line hover:border-ink'
          }`}
        >
          {n}
        </Link>
      ))}

      {page < pageCount && (
        <Link
          href={href(page + 1)}
          rel="next"
          className="border border-line px-4 py-2 font-display text-sm font-600 transition-colors hover:border-ink"
        >
          Next
        </Link>
      )}
    </nav>
  );
}

export function CategoryFilter({
  categories,
  active,
}: {
  categories: { name: string; slug: string; count: number }[];
  active?: string;
}) {
  return (
    <nav aria-label="Filter by category" className="mt-10 flex flex-wrap gap-2">
      <Link
        href="/legal-insights"
        aria-current={!active ? 'true' : undefined}
        className={`border px-4 py-2 text-sm transition-colors ${
          !active ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink'
        }`}
      >
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/legal-insights/${c.slug}`}
          aria-current={active === c.slug ? 'true' : undefined}
          className={`border px-4 py-2 text-sm transition-colors ${
            active === c.slug ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink'
          }`}
        >
          {c.name}
          <span className="ml-2 text-xs text-muted">{c.count}</span>
        </Link>
      ))}
    </nav>
  );
}
