import type { Metadata } from 'next';
import Link from 'next/link';
import { getPosts } from '@/lib/content';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Legal Insights',
  description:
    'Guides and commentary on UAE law from Fakher & Co — litigation, contracts, company formation, employment, real estate and private notary services.',
  alternates: { canonical: '/legal-insights' },
};

export default async function InsightsPage() {
  const posts = await getPosts();

  return (
    <>
      <header className="border-b border-line bg-surface-alt">
        <div className="site-container py-14">
          <h1 className="text-3xl lg:text-4xl">Legal Insights</h1>
          <p className="mt-3 max-w-2xl text-lg text-body">
            {posts.length} guides and commentary pieces on UAE law.
          </p>
        </div>
      </header>

      <div className="site-container py-12">
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/${post.slug}`}
                className="group flex h-full flex-col rounded-md border border-line p-6 transition-colors hover:border-brass"
              >
                {post.date && (
                  <time dateTime={post.date} className="text-2xs uppercase tracking-wide text-muted">
                    {new Date(post.date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </time>
                )}
                <h2 className="mt-2 text-base leading-snug group-hover:text-navy">{post.title}</h2>
                {post.excerpt && (
                  <p className="mt-2 line-clamp-4 text-sm text-body">{post.excerpt}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
