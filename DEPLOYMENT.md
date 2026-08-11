# Deploying the front end

Next.js on Vercel, reading from Strapi at `cms.fakhernco.com`.

## Environment

Set in Vercel → Settings → Environment Variables, for Production and Preview:

```
STRAPI_URL=https://cms.fakhernco.com
SITE_URL=https://fakhernco.com
STRAPI_REVALIDATE=300
REVALIDATE_SECRET=…        # must match the CMS
```

### STRAPI_URL must ALSO be present at RUNTIME

Build time is not enough, and the failure is easy to mistake for a content
problem.

Most pages are prerendered, so they serve fine from the build. But a URL that
is NOT in `generateStaticParams` — anything unknown, which is to say every
404 — is rendered on demand, and that render fetches the CMS at request time.
With `STRAPI_URL` absent at runtime the fetch falls back to
`http://localhost:1337`, is refused, and the route answers **500 instead of
404**.

A soft 404 is worse than it sounds: Google keeps the dead URL in the index and
keeps crawling it, and genuine 404s stop being distinguishable from an outage.

Verify after deploying, with a URL that cannot exist:

```bash
curl -o /dev/null -w '%{http_code}\n' https://fakhernco.com/definitely-not-a-real-page-9f3a
# 404 = correct.  500 = STRAPI_URL is missing from the runtime environment.
```

The same applies to ISR: a page revalidating after 300s fetches the CMS from
the running server, not from the build.

### STRAPI_URL must be present at BUILD time

`next.config.ts` derives the `next/image` remote pattern from it and compiles
that into the build. If it is missing during a build, the pattern is silently
omitted and **every CMS-hosted image 404s at runtime** — a failure that looks
like a CMS problem but is a build-environment one.

It must also be the CMS's **public origin**, never `localhost`: `mediaUrl()`
prefixes it onto every relative `/uploads/...` path.

### Watch for trailing whitespace

A trailing space in `STRAPI_URL` produces `https://host /api/...` →
`ERR_INVALID_URL` → every fetch throws → every page renders empty. It cost
several deploys to find on a sibling project. Paste carefully.

## Building

```bash
npm ci
npm run build:fresh
```

**Always `build:fresh`, never plain `build`, after a CMS change.** Next
persists its fetch cache in `.next`, so a build run straight after an edit
bakes in the old content while Strapi already has the new. It looks like the
change simply did not apply. This has caught this project twice — once during
this build.

`npm run verify:seo` detects it by diffing rendered titles against the CMS.

## Release gates

Both are dependency-free and exit non-zero, so they can gate a deploy.

```bash
STRAPI_URL=https://cms.fakhernco.com npm run check:cms
SITE=https://fakhernco.com npm run verify:seo
```

`check:cms` runs **before** a build — it catches permissions never granted,
`PUBLIC_URL` unset, the import never run, and contact submissions being
publicly readable.

`verify:seo` runs **after** a deploy, against the live origin. It fails on a
missing canonical or description, more or fewer than one H1, a URL used as alt
text, a soft 404, a broken sitemap/robots/RSS, or any redirect that resolves
to something other than a live 200.

## Revalidation

Strapi → Settings → Webhooks → Create:

| | |
|---|---|
| URL | `https://fakhernco.com/api/revalidate` |
| Header | `x-revalidate-secret: <REVALIDATE_SECRET>` |
| Events | `entry.publish`, `entry.unpublish`, `entry.update`, `entry.delete` |

Without it, an edit takes up to `STRAPI_REVALIDATE` seconds to appear and a
fix to a live page cannot be forced through at all.

## Cloudflare

The zone is orange-clouded. **If Cloudflare caches HTML at the edge, the
revalidation chain stops working** — Strapi fires the webhook, Next purges its
own cache, and Cloudflare keeps serving the old page until its own TTL expires.

Either add a Cache Rule bypassing cache for HTML on `fakhernco.com`, or add a
Cloudflare purge call to `/api/revalidate`. Static assets under `/_next/` can
and should stay cached.

Also set SSL/TLS to **Full (strict)** once the origin has a valid certificate.

## Adding a route or a redirect

Both `generateStaticParams` and the redirect map are build-time. `[slug]` uses
`dynamicParams` defaults, so new CMS entries appear via ISR — but a new
**redirect** requires a rebuild, because `src/lib/redirects.json` is imported
by the middleware at module scope.

Regenerate it from the CMS repo rather than hand-editing:

```bash
cd ../fakhernco-cms && npm run wp:redirects
cp migration/out/redirects.json ../fakhernco-web/src/lib/redirects.json
```

`build-redirects.mjs` refuses to emit a chain, which hand-editing would not
catch.
