/**
 * The Google tag, as loaded by <GoogleTag />.
 *
 * Declared so the contact form can report a conversion without casting through
 * `any`. Always call it optionally — `window.gtag?.(…)`. The tag is absent in
 * development and in preview builds, where NEXT_PUBLIC_GOOGLE_TAG_ID is unset,
 * and an ad blocker will remove it for a meaningful share of real visitors.
 */
declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'js' | 'set',
      targetOrName: string | Date,
      params?: Record<string, unknown>,
    ) => void;
  }
}

export {};
