# fakhernco-web

Next.js 16 front end for fakhernco.com, a UAE legal consultancy. Reads from a
Strapi 5 CMS at `cms.fakhernco.com` (separate repo: `../fakhernco-cms`).

## Deploying

Push to `main`. Vercel (team **Nour Attorneys**, project `fakhernco-web`)
builds and ships in ~30–60s. Nothing manual.

```bash
curl -s https://fakhernco.com/api/version   # commit must match your HEAD
```

## Building locally

```bash
STRAPI_URL=https://cms.fakhernco.com SITE_URL=https://fakhernco.com \
BUILD_CPUS=4 BUILD_PAGE_CONCURRENCY=4 npm run build:fresh
```

**The build is CMS-bound, not CPU-bound.** The CMS is a 2 GB shared box.
Uncapped, nine workers open ~72 concurrent connections and the build dies with
ETIMEDOUT. `BUILD_PAGE_CONCURRENCY` is the knob that bounds connections — lower
it, never raise it, if the CMS 5xxs mid-build. Do not "optimise" the caps away.

`STRAPI_URL` is required at build time (next.config.ts throws without it) AND
at runtime (missing turns every 404 into a 500).

## Locales

English at the root, Arabic `/ar`, German `/de`. **Slugs identical across
locales** — `pathIn()` is a pure prefix swap and hreflang/sitemap/switcher all
depend on that. Route groups `(en)` `(ar)` `(de)`, each with its own root
layout (only a root layout can set `<html lang dir>`).

Everything locale-shaped is a `Record<Locale, …>` table in `src/lib/locale.ts`.
Adding a locale = widen `LOCALES`, fix the compile errors it names. Never write
`locale === 'ar' ? … : …` — that pattern shipped four separate bugs.

Two different availability sets, deliberately:

- `getNavPaths(locale)` — CMS content **plus** literal routes. What `href()`
  consults. (An empty CMS list once made every German link resolve to English.)
- `getTranslatedPaths(locale)` — CMS only. What the language switcher and
  `localesFor()`/hreflang consult, so an empty shell is never advertised.

**German has no content yet.** `/de` is a noindex shell. `ALLOW_EMPTY_DE=1` in
Vercel suppresses the build assertion in `(de)/de/[slug]` — **delete that
variable when the first German pages are published**, then confirm the build
still passes. German UI strings (`src/lib/ui.ts`) and the CMS auto-reply are
marked non-native and need a German reader before paid traffic.

## Brand assets

`public/logo.png` is the square mark in the JSON-LD `logo`/`image` on the
organisation node, so it must stay at that exact crawlable URL — Google
re-fetches it long after the page that referenced it was rendered.

**The favicons are a deliberate stopgap.** `src/app/{favicon.ico,icon.png,
apple-icon.png}` are generated from that same wordmark, and a wordmark does
not survive being a favicon: the ink is a 1579×424 strip, 3.7:1, so in a
square box it can never be more than 27% taller than it already is. At 32px
it is unreadable and at 16px it is a grey smear. **Replace all three with a
monogram when one exists** — neither this repo nor the CMS has a square mark
today, only the bilingual wordmark. Regenerate at 192/180/48; 48 is a
multiple of Google's 48px favicon step.

## Release gates

```bash
STRAPI_URL=https://cms.fakhernco.com npm run check:cms
STRAPI_URL=https://cms.fakhernco.com SITE=https://fakhernco.com npm run verify:seo
```

The `STRAPI_URL=` prefix on `verify:seo` is mandatory — without it the script
compares production against your local sqlite CMS and false-passes.

## Traps that already bit someone

- `title: undefined` in generateMetadata **suppresses** the layout default; it
  does not inherit. Omit the key instead.
- Page-level `openGraph` **replaces** the layout's — restate `type`,
  `siteName`, `locale` (from `LOCALE_OG`, not the hreflang table).
- The contact form's consent checkbox arrives as the *string* `"true"`; it is
  converted to a boolean before sending. Don't undo that.
- `REVALIDATE_SECRET` lives in the Strapi **webhook row** (Settings →
  Webhooks → Headers), not in any `.env`.
- A trailing space/slash in `STRAPI_URL` breaks every image, not the API.

Full history and the DNS/cutover runbook: `DEPLOYMENT.md`.
