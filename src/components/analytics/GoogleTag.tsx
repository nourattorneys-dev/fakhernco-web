import Script from 'next/script';

/**
 * The Google tag.
 *
 * WHY THE GT- ID RATHER THAN THE G- AND AW- IDS SEPARATELY
 * fakhernco.com already runs GT-NN6G692R, and that single tag fans out to
 * both destinations configured behind it — G-6KMG6ZQ9EF (GA4) and
 * AW-17860291080 (Google Ads). Loading the GT- id keeps whatever is configured
 * in the Google Tag interface authoritative, so the firm can add or change a
 * destination without a deploy. Hardcoding the two would freeze today's setup
 * into the build.
 *
 * WHY IT MATTERS THAT THIS IS THE SAME TAG
 * The WordPress site has been reporting to this property for as long as it has
 * been live. Using the same one means the migration shows up as a continuous
 * line rather than a new property starting at zero on the day every URL
 * changed — which is exactly when you most need to compare.
 *
 * afterInteractive: the tag must not compete with the hero image for the first
 * paint. Analytics that costs a tenth of a second of LCP on an ad landing page
 * is a bad trade.
 */
const TAG_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;

export function GoogleTag() {
  if (!TAG_ID) return null;

  /*
    Enforced, not merely assumed.

    The rule was written down in .env.example — leave the tag unset in
    development and on previews — and then not honoured: it was set in
    .env.local, so local clicks were landing in the firm's live GA4 and, via
    AW-17860291080 behind the same GT- tag, in the Google Ads account that
    bids on them.

    NEXT_PUBLIC_VERCEL_ENV is inlined at build time and is undefined outside
    Vercel, so this cannot fire on a preview deploy however the dashboard is
    configured, and local dev is unaffected.
  */
  if (
    process.env.NEXT_PUBLIC_VERCEL_ENV &&
    process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production'
  ) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${TAG_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${TAG_ID}');
        `}
      </Script>
    </>
  );
}
