import type { NextConfig } from "next";

/**
 * Derive the next/image remote pattern from STRAPI_URL.
 *
 * This is compiled into the build, so STRAPI_URL must be set AT BUILD TIME,
 * not just at runtime. If it is missing during a build the pattern is silently
 * omitted and every CMS-hosted image 404s — a failure that looks like a CMS
 * problem but is a build-environment one.
 */
function strapiImageHost() {
  const raw = process.env.STRAPI_URL;
  if (!raw) return [];
  const { protocol, hostname, port } = new URL(raw);
  return [{
    protocol: protocol.replace(":", "") as "http" | "https",
    hostname,
    port: port || undefined,
    pathname: "/uploads/**",
  }];
}

const nextConfig: NextConfig = {
  /**
   * The ad landing pages moved from /lp/ to /legal-services/.
   *
   * /lp/ read as internal plumbing, and this path is visible: Google Ads shows
   * it in the display URL under the headline, so a searcher comparing law
   * firms sees it before they click.
   *
   * Kept as a redirect because a Google Ads final URL that 404s gets the ad
   * disapproved, and a URL pasted into a draft campaign is easy to forget.
   * Safe to delete once the campaigns are confirmed to point at the new path.
   */
  async redirects() {
    return [
      { source: '/lp', destination: '/legal-services', permanent: true },
      { source: '/lp/:slug', destination: '/legal-services/:slug', permanent: true },
    ];
  },

  images: {
    remotePatterns: [
      ...strapiImageHost(),
      // Legacy WordPress origin — images not yet migrated still render.
      { protocol: "https", hostname: "fakhernco.com", pathname: "/wp-content/**" },
    ],
    // Allow a localhost CMS whenever STRAPI_URL actually points at one, rather
    // than keying off NODE_ENV. A production build against a local CMS is a
    // normal thing to do while testing, and gating on NODE_ENV makes every
    // image 400 in that setup.
    dangerouslyAllowLocalIP: /^https?:\/\/(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(
      process.env.STRAPI_URL ?? "",
    ),
  },
};

export default nextConfig;
