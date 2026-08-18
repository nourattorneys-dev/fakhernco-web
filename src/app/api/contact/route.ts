import { NextResponse } from 'next/server';

const BASE = (process.env.STRAPI_URL ?? 'http://localhost:1337').trim().replace(/\/$/, '');

/**
 * Proxy to the CMS contact endpoint.
 *
 * The browser never talks to Strapi directly: it keeps the CMS origin out of
 * client bundles. Validation, honeypot handling, rate limiting and the
 * auto-reply all live in the CMS controller — this is a thin, deliberate
 * pass-through.
 *
 * The origin check below is CSRF hygiene for a browser form, NOT a security
 * control: it is skipped when Origin is absent, and any non-browser client can
 * set the header to whatever it likes. The real throttle is the CMS rate
 * limiter plus a Vercel WAF rule on this path.
 */
export async function POST(request: Request) {
  /*
    Compare parsed hosts, not string suffixes.

    The previous test was `origin.endsWith(host)`, and
    "https://evilfakhernco.com".endsWith("fakhernco.com") is true — so any
    attacker-registered domain ending in the firm's name passed it. Parsing
    makes the comparison mean what it always claimed to.

    Still correct on preview deploys: the browser's Origin host and the request
    Host are the same *.vercel.app name there.
  */
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin) {
    let sameOrigin = false;
    try {
      sameOrigin = new URL(origin).host === host;
    } catch {
      sameOrigin = false;
    }
    if (!sameOrigin) {
      return NextResponse.json(
        { error: 'Cross-origin submissions are not accepted.' },
        { status: 403 },
      );
    }
  }

  /*
    A preview deploy must never write a real enquiry into the firm's leads
    table or email the partners about it — QA on a branch would be
    indistinguishable from a client.

    VERCEL_ENV is undefined outside Vercel, so `npm run dev` against a local
    Strapi is unaffected. It requires "Enable access to System Environment
    Variables"; untick that and this guard fails OPEN.
  */
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return NextResponse.json({ ok: true, preview: true });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    /*
      Forward the real client IP.

      The CMS limiter keys on ctx.request.ip and production already runs with
      IS_PROXIED=true, so Koa reads the leftmost X-Forwarded-For entry. Without
      this every enquiry arrives from Vercel's rotating shared egress pool, which
      makes the limiter simultaneously too strict — the sixth genuine enquiry in
      ten minutes is rejected — and useless, because a rotating attacker is never
      throttled at all.
    */
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      null;

    const res = await fetch(`${BASE}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(clientIp ? { 'x-forwarded-for': clientIp } : {}),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: detail?.error?.message ?? 'We could not send your enquiry. Please try again.' },
        { status: res.status },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    // Never leak the CMS origin or a stack trace to the browser.
    return NextResponse.json(
      { error: 'We could not reach our system. Please call +971 50 205 7209.' },
      { status: 502 },
    );
  }
}
