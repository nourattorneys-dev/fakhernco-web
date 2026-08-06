import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

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
 *   Events:  entry.publish, entry.unpublish, entry.update, entry.delete
 */

export const dynamic = 'force-dynamic';

/** Which paths a change to each model invalidates. */
function pathsFor(model: string, slug: string | undefined, locale: string | undefined): string[] {
  const prefix = locale === 'ar' ? '/ar' : '';
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
  if (request.headers.get('x-revalidate-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: { model?: string; entry?: { slug?: string; locale?: string } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const model = body.model ?? '';
  const paths = pathsFor(model, body.entry?.slug, body.entry?.locale);

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

  // The sitemap lists every slug, so any create or delete changes it.
  revalidatePath('/sitemap.xml');
  revalidatePath('/rss.xml');

  return NextResponse.json({ ok: true, model, revalidated });
}
