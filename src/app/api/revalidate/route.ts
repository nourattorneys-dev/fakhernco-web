import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { DEFAULT_LOCALE, LOCALES, LOCALE_PREFIX, type Locale } from '@/lib/locale';

/**
 * Strapi webhook target.
 *
 * Without this, an edit in the CMS takes up to the ISR window (300s) to
 * appear, and a fix to a live page cannot be forced through at all. Strapi's
 * config/server.ts already sets `webhooks.populateRelations` so the payload
 * carries entry.slug — this is the other half of that arrangement.
 *
 * Configure in Strapi under Settings -> Webhooks:
 *   URL:     https://fakhernco.com/api/revalidate
 *   Header:  x-revalidate-secret: <REVALIDATE_SECRET>
 *   Events:  entry.publish, entry.unpublish, entry.delete
 *
 * entry.update is deliberately NOT subscribed — see the event filter below.
 */

export const dynamic = 'force-dynamic';

/** Which paths a change to each model invalidates. */
function pathsFor(model: string, slug: string | undefined, locale: string | undefined): string[] {
  /*
    `locale === 'ar' ? '/ar' : ''` meant "Arabic, or else the root" — so a
    German publish would have revalidated the ENGLISH paths, purging pages that
    did not change and never purging the ones that did. Silently, and in the
    direction that looks like nothing happening.

    An unrecognised locale now refreshes nothing rather than guessing, which is
    the safe direction: a stale page for one revalidation window beats wiping
    another language's cache on every publish.

    `!locale` stays: it is legitimately undefined for non-localised models and
    for hand-made curl calls, and those mean the default locale.
  */
  const prefix =
    !locale || locale === DEFAULT_LOCALE
      ? ''
      : (LOCALES as readonly string[]).includes(locale)
        ? LOCALE_PREFIX[locale as Locale]
        : null;

  if (prefix === null) return [];

  const page = slug ? [`${prefix}/${slug}`] : [];

  switch (model) {
    case 'page':
    case 'case-study':
      return [...page, `${prefix}/`, `${prefix}/services`];
    case 'post':
      // A post also changes the archive, its pagination and the homepage row.
      return [...page, `${prefix}/legal-insights`, `${prefix}/`];
    case 'practice-area':
      return [...page, `${prefix}/`, `${prefix}/services`];
    case 'category':
      return [`${prefix}/legal-insights`, slug ? `${prefix}/legal-insights/${slug}` : ''].filter(
        Boolean,
      );
    case 'homepage':
      return [`${prefix}/`];
    /*
      The ad-spend surface, and it had no mapping at all — a published edit to
      a landing page waited out the full ISR window with no way to force it
      through, on the nine pages where a wrong price or a wrong claim is being
      actively paid for. Both locales exist; they live under their own prefix
      rather than at the root.
    */
    case 'landing-page':
      return [
        ...(slug ? [`${prefix}/legal-services/${slug}`] : []),
        `${prefix}/legal-services`,
      ];
    case 'site-setting':
      // Header and footer are in the root layout, so everything is affected.
      return ['LAYOUT'];
    default:
      return [];
  }
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Revalidation is not configured.' }, { status: 503 });
  }
  // Trimmed on both sides: this secret is copied by hand between the Strapi
  // webhook row and the Vercel dashboard, and a pasted trailing newline
  // presents as an authentication failure with nothing to see.
  if (request.headers.get('x-revalidate-secret')?.trim() !== secret.trim()) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: { model?: string; event?: string; entry?: { slug?: string; locale?: string } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  /*
    Only publish-shaped events invalidate anything.

    Subscribed to entry.update, every keystroke-level DRAFT save purged the
    live page — and a Site Settings save (not publish) purged all ~302
    prerendered pages at once, each of which then foreground-rendered against
    the 2GB CloudLinux box. The webhook was quietly a load generator.

    Strapi sends `event` in the body and X-Strapi-Event in the headers; the
    `event &&` guard keeps hand-made curl payloads working.

    Do NOT reach for `entry.publishedAt == null` instead. Under Strapi 5 draft
    & publish the entry carried by entry.update is always the DRAFT, whose
    publishedAt is null even when a published version exists — so that test
    silently means "ignore everything".
  */
  const ACTIONABLE = new Set(['entry.publish', 'entry.unpublish', 'entry.delete']);
  const event = body.event ?? request.headers.get('x-strapi-event') ?? '';
  if (event && !ACTIONABLE.has(event)) {
    return NextResponse.json({ ok: true, revalidated: [], note: `ignored ${event}` });
  }

  const model = body.model ?? '';
  const paths = pathsFor(model, body.entry?.slug, body.entry?.locale);

  /*
    The sitemap and feed list every slug, so any create or delete changes them —
    including for a model this route has no page mapping for, and including an
    unrecognised locale. They are refreshed BEFORE the early return below for
    that reason; hanging them off the mapped-paths branch meant an unmapped
    event silently stopped refreshing the feed too.
  */
  revalidatePath('/sitemap.xml');
  revalidatePath('/rss.xml');


  // Return 200 for models we do not map. A non-2xx makes Strapi flag the
  // webhook as failing and eventually stop calling it, which would silently
  // break revalidation for the models we DO care about.
  if (paths.length === 0) {
    return NextResponse.json({ ok: true, revalidated: [], note: `no mapping for "${model}"` });
  }

  const revalidated: string[] = [];
  for (const path of paths) {
    if (path === 'LAYOUT') {
      revalidatePath('/', 'layout');
      revalidated.push('/ (layout)');
    } else {
      revalidatePath(path);
      revalidated.push(path);
    }
  }

  return NextResponse.json({ ok: true, model, revalidated });
}
