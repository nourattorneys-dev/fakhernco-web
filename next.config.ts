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
 * Same host twice is harmless but noisy; keep the first occurrence.
 *
 * Generic so the caller's literal `protocol: "https"` survives — widening it to
 * `string` makes the result unassignable to next/image's RemotePattern.
 */
function dedupeHosts<T extends { protocol?: string; hostname: string; pathname?: string }>(
  patterns: T[],
): T[] {
  const seen = new Set<string>();
  return patterns.filter((p) => {
    const key = `${p.protocol}//${p.hostname}${p.pathname}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

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

/*
  Build parallelism, opt-in.

  Next defaults to one worker per CPU. The cPanel box (CloudLinux, 2GB) refuses
  those spawns — `spawn /opt/alt/alt-nodejs22/root/usr/bin/node EAGAIN`, its CPU
  allowance exhausted 35 times in the hour a build ran — so a build there opts
  IN to the cap:

    BUILD_CPUS=2 npm run build:fresh

  Vercel's builders have cores to spare, so leaving BUILD_CPUS unset there is
  the entire point: the cap was a tax paid to one specific host, and it was
  costing roughly half the static-generation time of every build.

  Deliberately NOT keyed on process.env.VERCEL. That variable exists only while
  "Enable access to System Environment Variables" is ticked, so a VERCEL gate
  fails CLOSED — untick the box and the two-worker cap silently returns with
  nothing to point at. This gate fails open.

  BUILD_PAGE_CONCURRENCY is the knob that actually bounds simultaneous
  connections to the 2GB CMS: in-flight requests are roughly cpus x this
  (default 8). If the CMS 5xxs during a build, lower THIS, not cpus.
*/
const buildCpus = Number(process.env.BUILD_CPUS);
const pageConcurrency = Number(process.env.BUILD_PAGE_CONCURRENCY);
const experimental: NextConfig['experimental'] = {
  ...(Number.isInteger(buildCpus) && buildCpus > 0 ? { cpus: buildCpus } : {}),
  ...(Number.isInteger(pageConcurrency) && pageConcurrency > 0
    ? { staticGenerationMaxConcurrency: pageConcurrency }
    : {}),
};

export default function config(phase: string): NextConfig {
  return {
    env: buildStamp(),
    experimental,
    images: {
      remotePatterns: dedupeHosts([
        ...strapiImageHost(phase === PHASE_PRODUCTION_BUILD),
        /*
          The production CMS, stated outright rather than derived.

          The server runs Next through a hand-written Passenger entry point:

            const app = next({ dev: false, dir: __dirname })

          A custom server re-evaluates this file at RUNTIME instead of reading
          the config baked into required-server-files.json at build time. If
          STRAPI_URL is not already in process.env at that instant — and on
          that host it is not, whatever .env.production.local says — the derived
          pattern is silently absent and every CMS image 404s.

          The symptom is maddening, because by the time a request is served the
          env file HAS loaded, so /api/version cheerfully reports
          strapiUrlAtRuntime: "https://cms.fakhernco.com" while the optimiser
          treats that same host as unknown.

          The hostname is a fixed fact about this deployment. Deriving it buys
          nothing and costs an entire class of failure, so it is written down.
          STRAPI_URL still drives it everywhere else, which is what makes local
          and preview environments work.
        */
        { protocol: "https", hostname: "cms.fakhernco.com", pathname: "/uploads/**" },
        // Legacy WordPress origin — images not yet migrated still render.
        { protocol: "https", hostname: "fakhernco.com", pathname: "/wp-content/**" },
      ]),
      /*
        Serve images straight from the CMS instead of through Next's optimiser.

        On this host the optimiser fails for EVERY image, whatever the host and
        whether or not the upstream file exists — it returns the app's 404 page
        rather than an image error, because the failure is thrown inside the
        route and falls through to not-found. Next requires `sharp` for
        production image optimisation, and the most likely explanation is that
        it is missing or is the wrong platform binary in the server's
        node_modules, which were installed by hand.

        The cost here is small and the benefit is a site with pictures on it.
        Strapi already stores these at sensible sizes — the hero photographs are
        WordPress "-scaled" derivatives around 175KB, and the logo is 7KB — so
        serving the originals is not the bandwidth disaster it would be with
        untouched camera files.

        On Vercel none of that holds: sharp is provided, the optimiser works,
        and resizing plus WebP is the single biggest LCP win available to a
        page whose hero is a 175KB photograph. So the bypass is keyed on the
        host rather than deleted outright — the cPanel deployment stays live
        until DNS moves, and removing this line outright would put every image
        back to serving a 45KB HTML 404 the moment anyone rebuilt it there.
      */
      unoptimized: !process.env.VERCEL,

      /*
        The CMS sends `Cache-Control: max-age=0` on /uploads, and an optimised
        image's max-age is max(upstream max-age, minimumCacheTTL). Left at Next
        16's 14400s default that re-transforms — and re-bills — every variant
        six times a day for files that never change.

        Strapi hashes upload filenames, so a long TTL is safe: a replaced image
        arrives at a new URL. The corollary is that a file overwritten IN PLACE
        at the same URL sticks for 31 days, and there is no purge.
      */
      minimumCacheTTL: 2678400, // 31 days

      // Allow a localhost CMS whenever STRAPI_URL actually points at one, rather
      // than keying off NODE_ENV. A production build against a local CMS is a
      // normal thing to do while testing, and gating on NODE_ENV makes every
      // image 400 in that setup.
      dangerouslyAllowLocalIP: /^https?:\/\/(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(
        process.env.STRAPI_URL ?? "",
      ),
    },

    /*
      Keep the *.vercel.app aliases out of the index.

      The production alias serves the entire site on a second hostname, and it
      is discoverable — certificate-transparency logs list it the moment it is
      issued, and any outbound link leaks it as a referrer. Indexed, it competes
      with fakhernco.com on the firm's own brand name with byte-identical
      content.

      A header rather than robots.txt, deliberately: src/app/robots.ts keeps
      AdsBot-Google on `Allow: /` because a Disallow gets the Ads landing pages
      disapproved for an unreachable destination, and a host-conditional
      robots.txt cannot be expressed there at all.

      The pattern is anchored on the whole host so it cannot match the apex.
      Verify both halves after the first deploy — present on the vercel.app URL,
      ABSENT on fakhernco.com — because a regex that matched both would quietly
      deindex the firm.
    */
    async headers() {
      return [
        {
          source: "/:path*",
          has: [{ type: "host", value: "^.+\\.vercel\\.app$" }],
          headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
        },
      ];
    },
  };
}
