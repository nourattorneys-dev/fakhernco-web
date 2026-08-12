import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

/**
 * Derive the next/image remote pattern from STRAPI_URL.
 *
 * This is compiled into the build, so STRAPI_URL must be set AT BUILD TIME,
 * not just at runtime. If it is missing during a build the pattern is silently
 * omitted and every CMS-hosted image 404s — a failure that looks like a CMS
 * problem but is a build-environment one.
 *
 * That is not hypothetical. It shipped. The production site served every image
 * as a 404 while the files themselves were fine, and the symptom is genuinely
 * misleading: the image URL returns the app's own 404 PAGE — 45KB of HTML with
 * a 200-shaped look about it — rather than an image error, because an
 * unmatched host falls through to the not-found route. A host that IS allowed
 * but missing upstream returns a 57-byte octet-stream instead. Comparing those
 * two response sizes is how you tell the difference from outside.
 *
 * So a production build without STRAPI_URL now fails loudly instead of
 * producing a site whose every photograph is broken.
 */
function strapiImageHost(failFast: boolean) {
  const raw = process.env.STRAPI_URL;
  if (!raw) {
    const message =
      "STRAPI_URL is not set.\n\n" +
      "  next/image needs it AT BUILD TIME to allow the CMS as an image host.\n" +
      "  Building without it produces a site where every CMS image 404s, while\n" +
      "  the CMS itself looks perfectly healthy.\n\n" +
      "  STRAPI_URL=https://cms.fakhernco.com npm run build\n";
    if (failFast) throw new Error(message);
    console.warn(`\n⚠ ${message}`);
    return [];
  }
  const { protocol, hostname, port } = new URL(raw);
  return [
    {
      protocol: protocol.replace(":", "") as "http" | "https",
      hostname,
      port: port || undefined,
      pathname: "/uploads/**",
    },
  ];
}

/*
  Keyed on the build phase rather than NODE_ENV.

  NODE_ENV is "production" for `next start` too, and throwing there would take
  a running site down at boot over a variable that only the build actually
  needed. The build is the one moment where the absence is unrecoverable.
*/
/**
 * Stamp the commit into the build so /api/version can report what is running.
 *
 * Read at build time from git, or from SOURCE_COMMIT where the deploy has no
 * .git directory. Never throws: a missing commit is worth an "unknown", not a
 * failed build.
 */
function buildStamp() {
  let commit = process.env.SOURCE_COMMIT ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "";
  if (!commit) {
    try {
      commit = require("node:child_process")
        .execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
        .toString()
        .trim();
    } catch {
      commit = "unknown";
    }
  }
  return {
    NEXT_PUBLIC_BUILD_COMMIT: commit.slice(0, 12),
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_BUILD_HAS_STRAPI: process.env.STRAPI_URL ? "1" : "0",
  };
}

export default function config(phase: string): NextConfig {
  return {
    env: buildStamp(),
    /*
      Cap the build's parallelism.

      Next defaults to one worker per CPU — nine on this host — and the
      production server is CloudLinux shared hosting that refuses the spawns:

        spawn /opt/alt/alt-nodejs22/root/usr/bin/node EAGAIN

      Its CPU allowance was exhausted 35 times in the hour a build ran, while
      steady-state usage sits at 3-7%. The box can run the app comfortably and
      cannot compile it.

      Two workers also stops a build from opening nine simultaneous connections
      to the CMS, which is what made remote-CMS builds time out.
    */
    experimental: { cpus: 2 },
    images: {
      remotePatterns: [
        ...strapiImageHost(phase === PHASE_PRODUCTION_BUILD),
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
}
