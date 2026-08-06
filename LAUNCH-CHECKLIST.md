# Launch checklist

Work top to bottom. Anything marked **BLOCKING** must pass before DNS moves.

---

## A. Before cutover day

### A1 — Baseline, while WordPress is still live · **BLOCKING**

Without this there is no way to tell recovery from decline afterwards, and the
argument becomes opinion.

- [ ] Search Console → Performance → **export 16 months** by page and by query
- [ ] Note total indexed URLs (Coverage) and impressions/day
- [ ] Record current rankings for the top 20 commercial queries
- [ ] Analytics: export 12 months of sessions and goal completions

The Search Console UI caps exports at **1,000 rows**. With 228 URLs that is
fine by page, but the query export will truncate — use the API or Looker
Studio if you want the full picture.

### A2 — Full backup · **BLOCKING**

- [ ] cPanel → Backup → full account backup, downloaded off-server
- [ ] Separately: `mysqldump` of the WordPress database
- [ ] Separately: archive `wp-content/uploads/`

The media is the irreplaceable part. Everything else can be rebuilt.

### A3 — Content sign-off

- [ ] Firm approves `fakhernco-cms/migration/out/consolidation-map.csv`
      line by line — 8 redirects and 1 deletion retire real URLs
- [ ] Decision on `/legal-consultations/`: restore as a service, or retire
- [ ] Firm verifies founding year, office addresses, phone numbers and any
      credential claims. **A law firm publishing incorrect credentials is a
      real liability**, and this content was migrated, not authored.
- [ ] Alt text written for the images that matter — 107 image blocks, only 5
      currently carry anything usable

### A4 — Email · **BLOCKING**

- [ ] `SMTP_*` and `CONTACT_NOTIFY_EMAIL` set on the CMS
- [ ] Submit a real enquiry; confirm the internal notification arrives
- [ ] Confirm the bilingual auto-reply arrives
- [ ] Check SPF still passes — the domain already has two includes and is
      heading toward the 10-lookup limit
- [ ] Confirm where CF7 currently sends mail, so nothing silently changes

Unset, the form still saves every enquiry and only logs a warning. No lead is
lost, but nobody is told.

### A5 — Infrastructure

- [ ] Strapi running at `cms.fakhernco.com`, `PUBLIC_URL` and `IS_PROXIED` set
- [ ] MySQL database created as **utf8mb4**
- [ ] `npm run check:cms` passes against production
- [ ] Front end deployed to Vercel with `STRAPI_URL` set **at build time**
- [ ] Revalidation webhook configured and returning 200
- [ ] Cloudflare cache rule bypassing HTML, or a purge call in `/api/revalidate`
- [ ] **DNS TTL lowered to 300s at least 24 hours ahead**

### A6 — Rollback path · **BLOCKING**

- [ ] Create `old.fakhernco.com` pointing at the current WordPress origin
      (`158.220.82.191`)
- [ ] **Confirm it serves the site correctly before touching anything else**
- [ ] Leave it up for at least 30 days

That subdomain is the rollback. If it does not work, there is no rollback.

---

## B. Cutover day

- [ ] `npm run check:cms` — passes
- [ ] `npm run build:fresh` — never plain `build`
- [ ] Deploy
- [ ] `SITE=https://fakhernco.com npm run verify:seo` — passes · **BLOCKING**
- [ ] Switch DNS
- [ ] Confirm SSL is valid and Cloudflare SSL/TLS is Full (strict)

### Immediately after

- [ ] Spot-check 10 URLs across pages, insights, case studies and archives
- [ ] Confirm a nonsense URL returns a real **404**, not a 200 shell
- [ ] Confirm `/footer` returns **410**
- [ ] Test the contact form on the live domain, end to end
- [ ] Submit `sitemap.xml` in Search Console
- [ ] Request removal of the old `sitemap_index.xml`
- [ ] Warm the cache: request every URL in the sitemap once, so the first real
      visitor — likely Googlebot — does not pay for a cold render

---

## C. First week

- [ ] Search Console daily: crawl errors, coverage, Core Web Vitals
- [ ] Watch for 404s in Vercel logs and add redirects for anything genuine
- [ ] Compare impressions against the A1 baseline
- [ ] Confirm enquiries are still arriving — silence here is ambiguous and
      needs actively checking, not assuming

A dip in the first two weeks is normal. A dip still present at week four is
not, and means going back to the redirect map.

---

## D. Deliberately deferred

Not blockers, but do not lose them:

- **Arabic.** ~60 pages exist at `/ar/` today, absent from every sitemap and
  serving English titles. The switcher and hreflang are built and hide
  themselves until real content exists. Needs the TranslatePress dictionary
  export, then the `/ar` route tree.
- **AI crawler policy.** `robots.txt` on WordPress blocks GPTBot, ClaudeBot,
  Google-Extended, CCBot and six others outright. The rebuild does not carry
  that over. Decide deliberately.
- **Blog audit.** 141 posts were published on a mechanical weekday cadence,
  exactly 20 per category — a bulk-generation pattern. Legal content with
  errors is a liability.
- **Meta descriptions.** Nine are over 165 characters and will be truncated.
