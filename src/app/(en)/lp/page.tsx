import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllLandings } from '@/lib/landing';

export const revalidate = 300;

/**
 * Review index for the ad landing pages.
 *
 * Not linked from anywhere in the site chrome and not in the sitemap — it
 * exists so the firm and whoever runs the campaigns can find all eight pages
 * in one place. noindex like the pages it lists.
 */
export const metadata: Metadata = {
  title: 'Campaign landing pages | Fakher & Co',
  robots: { index: false, follow: false },
};

export default async function LandingIndex() {
  const pages = await getAllLandings();

  return (
    <div className="site-container section">
      <p className="eyebrow text-ink">Internal</p>
      <h1 className="mt-4 text-display">Campaign landing pages</h1>
      <p className="prose-body mt-5 max-w-[62ch]">
        {pages.length} pages built for paid campaigns. Each one is served{' '}
        <strong className="font-600 text-ink">noindex</strong> so it does not compete with the
        equivalent service page in organic search, and none of them appear in the sitemap or the
        site navigation.
      </p>
      <p className="prose-body mt-4 max-w-[62ch]">
        The copy lives in <code className="text-sm">content/landing/*.md</code>. Editing the
        markdown and re-running <code className="text-sm">
          python3 scripts/export-landing-docx.py
        </code>{' '}
        updates both the page and the Word document, so the version under review and the version
        serving traffic cannot drift apart.
      </p>

      <ul className="section-body grid gap-px border border-line bg-line sm:grid-cols-2">
        {pages.map((p) => (
          <li key={p.slug} className="bg-surface card-p">
            <Link href={`/lp/${p.slug}`} className="group">
              <h2 className="text-card group-hover:underline group-hover:decoration-faint group-hover:underline-offset-4">
                {p.title}
              </h2>
            </Link>
            <p className="mt-2 text-sm text-body">{p.subhead}</p>
            <p className="mt-3 font-mono text-xs text-muted">/lp/{p.slug}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
