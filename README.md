# fakhernco-web

Next.js front end for [fakhernco.com](https://fakhernco.com) — Fakher & Co,
UAE law firm. Consumes [`fakhernco-cms`](https://github.com/nourattorneys-dev/fakhernco-cms)
(Strapi 5) over REST.

Replaces a WordPress site running the Avantage theme and Bold Page Builder.

## Status

Scaffolding pending. Migration analysis, the consolidation map and the content
extractor live in `fakhernco-cms/migration/`.

## Stack

| | |
|---|---|
| Framework | Next.js 16, App Router, React 19 |
| Language | TypeScript, strict |
| Styling | Tailwind v4 (CSS-first `@theme`, no config file) |
| Rendering | SSG + ISR, webhook revalidation |
| Locales | English + Arabic (RTL) |
| Hosting | Vercel |

## Why this exists

The WordPress site serves inner pages with a 4.6–5.6s time to first byte and
273–348 KB of HTML before a single image loads. 49 documents carry more than
one `<h1>`. The Arabic site — roughly 60 pages — appears in no sitemap and
emits English titles on every page.

Static generation, one enforced H1 per page and a locale-aware sitemap fix all
of that by construction.

## Local development

```bash
npm install
cp .env.example .env   # point STRAPI_URL at the CMS
npm run dev
```

`STRAPI_URL` must be set **at build time**, not just runtime — the `next/image`
remote pattern is derived from it and compiled into the build. If it is missing
during a build, every CMS-hosted image 404s at runtime, which looks like a CMS
fault but is a build-environment one.
