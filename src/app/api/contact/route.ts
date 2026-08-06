import { NextResponse } from 'next/server';

const BASE = process.env.STRAPI_URL ?? 'http://localhost:1337';

/**
 * Proxy to the CMS contact endpoint.
 *
 * The browser never talks to Strapi directly: it keeps the CMS origin out of
 * client bundles, and lets the same-origin check below reject cross-site
 * posts. Validation, honeypot handling, rate limiting and the auto-reply all
 * live in the CMS controller — this is a thin, deliberate pass-through.
 */
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host && !origin.endsWith(host)) {
    return NextResponse.json({ error: 'Cross-origin submissions are not accepted.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    const res = await fetch(`${BASE}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
