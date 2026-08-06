import { NextResponse, type NextRequest } from 'next/server';
import rules from '@/lib/redirects.json';

/**
 * Legacy WordPress URL handling.
 *
 * Middleware rather than next.config redirects, for two reasons: it fires at
 * the routing layer before any page cache, and adding a rule does not require
 * a full rebuild the way build-time redirects do.
 *
 * The map is generated from the consolidation table by
 * fakhernco-cms/migration/scripts/build-redirects.mjs, which refuses to emit
 * chains. Do not hand-edit this JSON — regenerate it.
 *
 * Nothing here redirects to the homepage. Google treats mass redirects of
 * dead URLs to `/` as soft 404s, which wastes crawl budget; genuinely removed
 * pages return 410 instead.
 */

type Rule = { source: string; destination: string | null; status: number; reason: string };

const MAP = new Map<string, Rule>((rules as Rule[]).map((r) => [r.source, r]));

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Normalise the trailing slash so /litigation/ and /litigation both match.
  const key = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  const rule = MAP.get(key);
  if (!rule) return NextResponse.next();

  if (rule.status === 410 || !rule.destination) {
    return new NextResponse(null, { status: 410, statusText: 'Gone' });
  }

  const url = request.nextUrl.clone();
  url.pathname = rule.destination;
  url.search = request.nextUrl.search;
  return NextResponse.redirect(url, 301);
}

export const config = {
  /**
   * Match everything except Next internals and static assets.
   *
   * The matcher must be wide: legacy paths are scattered across the root
   * namespace plus /category/, /author/ and the Yoast sitemap files, and a
   * narrow prefix list would silently miss them.
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt)$).*)'],
};
