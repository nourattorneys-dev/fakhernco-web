import type { MetadataRoute } from 'next';

const SITE = process.env.SITE_URL ?? 'https://fakhernco.com';

/**
 * Note: the WordPress robots.txt blocks ClaudeBot, GPTBot, Google-Extended,
 * CCBot and six other agents outright. That decision is still open (D4 in the
 * scope document), so it is deliberately NOT carried over here yet.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
