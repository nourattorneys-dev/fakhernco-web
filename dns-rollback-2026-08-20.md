# fakhernco.com — DNS state before the Vercel cutover

Captured 2026-08-20 from Cloudflare (account `Tech.support@nourattorneys.com`,
zone `fakhernco.com`, Free plan, DNS Setup: Full). 20 of 200 records used.

**This file is the rollback record.** `dig` cannot produce it: the apex and
`www` are proxied, so a lookup returns Cloudflare's edge IPs
(`104.21.89.15`, `172.67.155.132`) rather than the values stored in the zone.
Everything below is the stored content.

## Full zone, exactly as it stands

| Name | Type | Content | Proxy | TTL | Prio |
|---|---|---|---|---|---|
| `cms.fakhernco.com` | A | `158.220.82.191` | DNS only | Auto | |
| **`fakhernco.com`** | **A** | **`158.220.82.191`** | **Proxied** | Auto | |
| `ftp.fakhernco.com` | A | `82.198.228.47` | Proxied | Auto | |
| **`fakhernco.com`** | **AAAA** | **`2a02:4780:3f:2172:0:1e15:d8e2:2`** | **Proxied** | Auto | |
| `autodiscover.fakhernco.com` | CNAME | `autodiscover.outlook.com` | Proxied | Auto | |
| `enterpriseenrollment.fakhernco.com` | CNAME | `enterpriseenrollment-s.manage.microsoft.com` | Proxied | Auto | |
| `enterpriseregistration.fakhernco.com` | CNAME | `enterpriseregistration.windows.net` | Proxied | Auto | |
| `lyncdiscover.fakhernco.com` | CNAME | `webdir.online.lync.com` | Proxied | Auto | |
| `sip.fakhernco.com` | CNAME | `sipdir.online.lync.com` | Proxied | Auto | |
| **`www.fakhernco.com`** | **CNAME** | **`fakhernco.com`** | **Proxied** | Auto | |
| `fakhernco.com` | MX | `fakhernco-com.mail.protection.outlook.com` | DNS only | Auto | 0 |
| `send.fakhernco.com` | MX | `feedback-smtp.eu-west-1.amazonses.com` | DNS only | Auto | 10 |
| `fakhernco.com` | NS | `ns2.dns-parking.com` | DNS only | Auto | |
| `fakhernco.com` | NS | `ns1.dns-parking.com` | DNS only | Auto | |
| `_sipfederationtls._tcp.fakhernco.com` | SRV | `1 5061 sipfed.online.lync.com` | DNS only | Auto | 1 |
| `_sip._tls.fakhernco.com` | SRV | `1 443 sipdir.online.lync.com` | DNS only | Auto | 100 |

The four TXT records (root SPF, google-site-verification,
`resend._domainkey`, `send.` SPF) make up the balance of the 20 and are not
listed individually here because none of them is touched by the cutover.
Verified separately: `npm run verify:email-dns` reports 0 failures.

Nameservers: `nash.ns.cloudflare.com`, `maeve.ns.cloudflare.com`.

## The three rows the cutover touches

Rows in **bold** above. Nothing else changes.

1. `fakhernco.com` **A** → becomes a CNAME to the Vercel target, DNS only
2. `fakhernco.com` **AAAA** → **delete** (see below)
3. `www.fakhernco.com` **CNAME** → content changes to the Vercel target, DNS only

### The AAAA record is the trap

The apex carries an AAAA as well as an A. Cloudflare will not accept a CNAME
at a name that already has A or AAAA records, so the AAAA has to go before the
apex can become a CNAME. Left in place, IPv6 clients would keep reaching the
cPanel origin after the cutover — a partial migration that is very hard to
diagnose, because it only affects some visitors.

Record the value first. To roll back, re-add it exactly:
`AAAA  fakhernco.com  2a02:4780:3f:2172:0:1e15:d8e2:2  Proxied`

### www is a CNAME, not an A

`www` currently points at `fakhernco.com`, so it inherits whatever the apex
does. It could technically be left alone and would still resolve through the
apex — but Vercel asks for it to point at the same target directly, and an
explicit record is the one that stays correct if the apex ever changes shape
again.

## Rollback

Restore exactly:

```
A      fakhernco.com       158.220.82.191                      Proxied
AAAA   fakhernco.com       2a02:4780:3f:2172:0:1e15:d8e2:2     Proxied
CNAME  www.fakhernco.com   fakhernco.com                       Proxied
```

TTL is Auto (~300s) throughout, so recovery is roughly five minutes.

The rollback window closes **2026-09-18**, when the cPanel origin certificate
expires — after the cutover, AutoSSL can no longer renew it because validation
goes to Vercel. Rollback still works after that, but Cloudflare SSL/TLS has to
be set to Full (non-strict); Full (strict) returns 526.

## Two pre-existing oddities, deliberately left alone

**Apex NS records** point at `ns1`/`ns2.dns-parking.com` — leftovers from a
parking service. Delegation is governed by the registrar's nameservers
(Cloudflare's), so these are inert, but they are worth asking about separately.
Do not remove them during a cutover; one change at a time.

**`ftp.fakhernco.com`** is proxied and points at `82.198.228.47`, a different
host from everything else. Cloudflare cannot proxy FTP, so that record has
never worked as intended. Pre-existing and unrelated — do not "fix" it now.

Cloudflare also flags two recommendations: add a DMARC record (optional, and
if you do, start at `p=none`), and "origin IP partially exposed" — the latter
resolves itself once the apex stops pointing at `158.220.82.191`.
