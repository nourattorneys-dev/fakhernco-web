# Deploying the front end

Next.js on **Vercel**, reading from Strapi at `cms.fakhernco.com`, which stays
on cPanel. See `../fakhernco-cms/DEPLOYMENT.md` for why the CMS does not move.

Until the DNS cutover below, the live site is still served by the cPanel box
behind Cloudflare. Both can run at once; that is the point.

## Vercel project

Team **Nour Attorneys** (Pro). Import `nourattorneys-dev/fakhernco-web` —
*import*, never the "Clone" flow, which creates a **new** repository under a
personal account and quietly disconnects the deploy from origin.

Vercel can only import a repository its GitHub App can see. Both installations
here are scoped to selected repositories, so an owner of the
`nourattorneys-dev` org has to add `fakhernco-web` to the Vercel installation
first. Push access is not enough — this needs org admin.

### Build & deployment settings

| Setting | Value |
|---|---|
| Framework preset | Next.js (auto-detected) |
| Build command | default (`npm run build`) — **not** `build:fresh` |
| Install command | default |
| Node.js version | from `engines: { "node": "24.x" }` in package.json |
| **Enable access to System Environment Variables** | **ticked — load-bearing** |
| Deployment protection | Standard, so preview URLs stay behind Vercel login |

That checkbox is not cosmetic. `VERCEL_ENV` gates the preview guard on the
contact proxy, `NEXT_PUBLIC_VERCEL_ENV` gates the Google tag, and
`VERCEL_BRANCH_URL` feeds `src/lib/site.ts`. Untick it and the contact guard
fails **open** — a preview deploy starts writing real enquiries into the
firm's leads table.

Do **not** set the build command to `build:fresh`. It exists for local builds
after a CMS edit, and on Vercel it would throw away the restored build cache.

### The build is CMS-bound, not CPU-bound

This is the one number worth knowing before tuning anything.

`experimental.cpus` used to be pinned at 2 in `next.config.ts` because the
CloudLinux box refused more spawns. Lifting the cap entirely does **not** make
the build faster — it makes it fail. Uncapped, nine workers open roughly 72
concurrent connections to a 2 GB Strapi box, and it times out mid-build:

```
Error: read ETIMEDOUT
Failed to build /(en)/[slug]/page: /contracts-legal-document-drafting after 3 attempts.
```

Effective in-flight requests are `cpus × staticGenerationMaxConcurrency`
(default 8). The old cap therefore allowed 16, and 16 is what the CMS can
actually serve. Both are now opt-in environment variables, so set them on
Vercel for Production **and** Preview:

```
BUILD_CPUS=4
BUILD_PAGE_CONCURRENCY=4
```

Same 16 in flight, four compile workers instead of two. Measured against the
live CMS: 303 routes, compile 6.2s, static generation 45s, **56s total, zero
timeouts**.

If a build ever starts logging CMS 5xx or ETIMEDOUT, lower
`BUILD_PAGE_CONCURRENCY`, not `BUILD_CPUS` — that is the one that bounds
connections.

## Environment variables

There is no build-vs-runtime split on Vercel: every variable is visible to
both. The environment checkboxes are the whole control.

| Variable | Production | Preview | Development |
|---|---|---|---|
| `STRAPI_URL` | `https://cms.fakhernco.com` | **same — mandatory** | `http://localhost:1337` |
| `SITE_URL` | `https://fakhernco.com` | **unset, deliberately** | unset |
| `REVALIDATE_SECRET` | from the Strapi webhook row | unset | unset |
| `NEXT_PUBLIC_GOOGLE_TAG_ID` | `GT-NN6G692R` | **unset** | **unset** |
| `BUILD_CPUS` / `BUILD_PAGE_CONCURRENCY` | `4` / `4` | `4` / `4` | unset |
| `STRAPI_REVALIDATE` | unset (defaults to 300) | unset | unset |
| `STRAPI_API_TOKEN` | unset — the CMS is publicly readable | unset | unset |

**`STRAPI_URL` on Preview is not optional.** `next build` runs
`PHASE_PRODUCTION_BUILD` in every Vercel environment, and `next.config.ts`
throws without it — so every branch push and every PR fails at config load,
with an error message that talks about `npm run build` and gives no hint that
the fix is an environment scope.

**`SITE_URL` is unset on Preview on purpose.** `src/lib/site.ts` then falls
through to the deployment's own host, so a preview's canonicals, hreflang and
sitemap describe the preview rather than advertising production.

**`REVALIDATE_SECRET` does not come from the CMS environment.** Nothing in the
CMS repo reads that variable. The value the front end compares against is
typed into Strapi → Settings → Webhooks → Headers. Read it out of the admin
panel and paste that exact string here.

### Watch for trailing whitespace

A trailing space in `STRAPI_URL` does **not** break the API calls — `new URL()`
tolerates it. It breaks every **image**, because `mediaUrl()` concatenates. The
symptom is a site whose text is perfect and whose every photograph is missing.
Both are now trimmed in code, but paste carefully anyway.

And `STRAPI_REVALIDATE` is integer seconds only. `300s` or `5m` makes
`Number()` NaN, and Next's fetch validator rejects it while naming the route
that was rendering rather than the variable.

## Release gates

Both are dependency-free and exit non-zero, so they can gate a deploy.

```bash
STRAPI_URL=https://cms.fakhernco.com npm run check:cms
STRAPI_URL=https://cms.fakhernco.com SITE=https://fakhernco.com npm run verify:seo
```

The `STRAPI_URL=` prefix on `verify:seo` is not optional. Without it the script
compares the live site against whatever `.env.local` points at — a local sqlite
CMS — and reports green. A false pass is worse than a failure.

Note also what `verify:seo` does **not** check: it discards hosts, so it will
not catch a wrong `SITE_URL`. Assert those by hand (see the cutover steps).

## Revalidation

Strapi → Settings → Webhooks:

| | |
|---|---|
| URL | `https://fakhernco.com/api/revalidate` |
| Header | `x-revalidate-secret: <the value in this row>` |
| Events | `entry.publish`, `entry.unpublish`, `entry.delete` |

**`entry.update` is deliberately not subscribed.** With it on, every draft save
purged the live page, and a Site Settings save purged all ~300 prerendered
pages at once — each of which then foreground-rendered against the 2 GB CMS.
The route now ignores non-publish events anyway, but unsubscribing saves the
round trip. If the webhook row still lists it, remove it.

Never treat a green webhook log as proof. The route answers 200 for models it
has no mapping for, by design — a non-2xx makes Strapi mark the webhook failing
and eventually stop calling it. Verify by publishing something and watching it
change.

## Cutting DNS over to Vercel

Cloudflare stays authoritative throughout. Do this on a weekday morning UAE
time with someone watching.

**Rehearse first.** Verify everything on the `*.vercel.app` URL before touching
a DNS record — nothing in the repo pins the site to the apex at build time, so
a full rehearsal is genuinely possible:

```bash
curl -s https://<project>.vercel.app/api/version            # commit == git rev-parse --short HEAD
curl -o /dev/null -w '%{http_code}\n' https://<project>.vercel.app/definitely-not-a-real-page-9f3a   # 404, not 500
curl -s https://<project>.vercel.app/robots.txt | grep -E '^(Host|Sitemap):'
curl -sI https://<project>.vercel.app/ | grep -i x-robots-tag   # present
```

Then, in Cloudflare → DNS, **edit the `@` and `www` rows in place** — never
delete and re-create, because the SOA negative TTL is 1800s and a NODATA gap is
cached for half an hour and looks like a total outage.

1. Copy the A record value and CNAME target **from the Vercel project's domain
   card**. They are per-project now; any value written down in advance is
   wrong.
2. Set both rows to **DNS only (grey cloud)**, TTL 300.

Grey-clouding is a prerequisite, not hardening: with the proxy in front, the
certificate challenge cannot reach Vercel, the certificate never issues, and
visitors get a 525. Wait for both rows to read *Valid Configuration* with an
issued certificate.

**Do not switch the nameservers to Vercel.** An empty zone means the root MX
vanishes and the firm's Microsoft 365 mail bounces, `resend._domainkey`
vanishes so the contact auto-reply fails DKIM against an SPF ending `-all`,
and `cms.fakhernco.com` stops resolving — taking the admin panel and every
image on the site with it.

**Do not touch `cms.fakhernco.com`.** Not even to proxy it: that breaks
cPanel AutoSSL's HTTP validation, and every image, the admin panel and the
contact endpoint hang off that host.

Then confirm nothing else in the zone moved:

```bash
dig +short cms.fakhernco.com                                 # unchanged
curl -sSI https://cms.fakhernco.com/ | grep -i x-powered-by  # still Strapi
cd ../fakhernco-cms && npm run verify:email-dns              # still 0 failures
```

And verify the application:

```bash
curl -s https://fakhernco.com/api/version                    # the new commit
curl -s https://fakhernco.com/robots.txt | grep -E '^(Host|Sitemap):'   # fakhernco.com
curl -o /dev/null -w '%{http_code}\n' https://fakhernco.com/definitely-not-a-real-page-9f3a
curl -sSI https://fakhernco.com/ | grep -i x-robots-tag      # ABSENT on the apex
STRAPI_URL=https://cms.fakhernco.com SITE=https://fakhernco.com npm run verify:seo
```

A 502 with *"We could not reach our system"* from the contact form is the
signature of a wrong runtime `STRAPI_URL`, not a DNS fault.

Finally, repoint the Strapi webhook at the new origin and prove it:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://fakhernco.com/api/revalidate \
  -H 'content-type: application/json' -H "x-revalidate-secret: $SECRET" \
  -d '{"model":"landing-page","event":"entry.publish","entry":{"slug":"consultation","locale":"en"}}'
# 200 = wired | 401 = the value differs from the webhook row | 503 = unset on Vercel
```

**Rollback** is the two rows restored to `158.220.82.191`, orange-clouded. TTL
is 300 everywhere, so it takes about five minutes. Screenshot the Cloudflare
DNS tab before editing — `dig` cannot see the stored value behind a proxy, so
the screenshot is the artefact that makes rollback possible.

Leave the cPanel vhost and its Node app running for two weeks after cutover.
Its origin certificate expires **2026-09-18**, and after the cutover AutoSSL
can no longer renew it because validation now goes to Vercel — so rollback
after that date needs Cloudflare SSL/TLS set to Full (non-strict); Full
(strict) returns 526.

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
