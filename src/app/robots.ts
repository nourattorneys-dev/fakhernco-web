import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

/**
 * robots.txt.
 *
 * THE AD LANDING PAGES MUST STAY CRAWLABLE
 * /legal-services/* is served `noindex, follow`, which keeps it out of organic
 * results. It must NOT also be disallowed here, and the two are not
 * interchangeable:
 *
 *   - Google Ads sends AdsBot to every landing page to check policy and
 *     landing-page experience. A Disallow gets the ad DISAPPROVED for an
 *     unreachable destination. That costs real money; an indexed duplicate
 *     costs a ranking signal.
 *   - A disallowed page cannot be read, so Google never sees the noindex and
 *     may index the URL anyway from inbound links. Blocking is the worse tool
 *     for the job in both directions.
 *
 * AdsBot is listed explicitly rather than relying on the wildcard. Google's
 * AdsBot agents deliberately ignore `User-agent: *` — they only obey rules
 * that name them — so anyone who later adds a broad Disallow will not
 * accidentally take the campaigns down with it.
 *
 * The WordPress robots.txt blocks ClaudeBot, GPTBot, Google-Extended, CCBot
 * and six other agents outright. That decision is still open (D4 in the scope
 * document), so it is deliberately NOT carried over yet.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/'] },

      // Named explicitly: these agents ignore the wildcard group entirely.
      { userAgent: 'AdsBot-Google', allow: '/' },
      { userAgent: 'AdsBot-Google-Mobile', allow: '/' },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
