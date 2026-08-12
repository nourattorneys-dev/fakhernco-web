import { NextResponse } from 'next/server';

/**
 * What is actually deployed.
 *
 * "The developer rebuilt and nothing changed" has cost several rounds of
 * guessing, because from outside there is no way to tell a stale CDN cache
 * from an old build from a process that was never restarted. Each has a
 * different fix and they all look identical.
 *
 * This answers it: the commit is stamped in at BUILD time, so the value
 * returned here is the code the running server was actually built from. If it
 * does not match the tip of main, the deploy did not happen — whatever the
 * build log said.
 *
 *   curl https://fakhernco.com/api/version
 *
 * Deliberately dynamic and uncached: a prerendered answer would be exactly the
 * stale value this exists to detect.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      commit: process.env.NEXT_PUBLIC_BUILD_COMMIT ?? 'unknown',
      builtAt: process.env.NEXT_PUBLIC_BUILD_TIME ?? 'unknown',
      // Whether the image host was compiled in. Absent, every CMS image 404s
      // and the cause is invisible from the page itself.
      strapiConfiguredAtBuild: process.env.NEXT_PUBLIC_BUILD_HAS_STRAPI === '1',
      strapiUrlAtRuntime: process.env.STRAPI_URL ?? null,
      node: process.version,
    },
    { headers: { 'cache-control': 'no-store, must-revalidate' } },
  );
}
