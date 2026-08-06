import { getPosts } from '@/lib/content';

const SITE = process.env.SITE_URL ?? 'https://fakhernco.com';

export const revalidate = 3600;

/**
 * RSS feed.
 *
 * Exists because /feed and /comments/feed return 200 on the WordPress site
 * today and are redirected here — a redirect to a 404 is worse than no
 * redirect at all.
 */
export async function GET() {
  const posts = await getPosts();
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const items = posts
    .slice(0, 50)
    .map((p) => {
      const date = p.date ? new Date(p.date).toUTCString() : undefined;
      return `    <item>
      <title>${escape(p.title)}</title>
      <link>${SITE}/${p.slug}</link>
      <guid isPermaLink="true">${SITE}/${p.slug}</guid>${date ? `\n      <pubDate>${date}</pubDate>` : ''}
      <description>${escape(p.excerpt ?? '')}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Fakher &amp; Co — Legal Insights</title>
    <link>${SITE}/legal-insights</link>
    <description>Guides and commentary on UAE law from Fakher &amp; Co.</description>
    <language>en</language>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
