/**
 * The canonical site origin, in one place.
 *
 * It was declared identically in six files — robots, sitemap, RSS, both
 * layouts and the JSON-LD graph — each falling back to the production origin.
 * That fallback is correct in production and wrong everywhere else: a preview
 * deploy built without SITE_URL emits production canonicals, production
 * hreflang and a sitemap full of production URLs, all describing a site that
 * is not the one you are looking at.
 *
 * So SITE_URL is set in Vercel Production ONLY, and previews fall through to
 * their own deployment host. Vercel stores environment values literally and
 * will not expand $VERCEL_URL, which is why this cannot be expressed in the
 * dashboard and has to be code.
 *
 * VERCEL_BRANCH_URL before VERCEL_URL: the per-deployment VERCEL_URL is
 * unusable while Deployment Protection is on, which is the default.
 *
 * Requires "Enable access to System Environment Variables" in the project
 * settings. Unticked, VERCEL_ENV is undefined and a preview quietly claims to
 * be production again.
 *
 * The trailing slash is stripped because every caller concatenates onto this.
 */
const HOST =
  process.env.SITE_URL ??
  (process.env.VERCEL_ENV === 'production'
    ? 'https://fakhernco.com'
    : process.env.VERCEL_BRANCH_URL
      ? `https://${process.env.VERCEL_BRANCH_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000');

export const SITE = HOST.trim().replace(/\/$/, '');
