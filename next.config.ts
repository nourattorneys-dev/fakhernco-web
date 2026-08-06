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
