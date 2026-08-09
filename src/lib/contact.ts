/**
 * The firm's primary contact number, in one place.
 *
 * It was written out in five: the header's WhatsApp button, two `tel:` links,
 * the organisation schema, and now the floating button. Five copies of a phone
 * number is five chances for four of them to be right.
 *
 * `E164` is what wa.me and `tel:` want — digits only, no punctuation. `DISPLAY`
 * is what a person reads. Keep them in step.
 */
export const PHONE = {
  E164: '971502057209',
  DISPLAY: '+971 50 205 7209',
  /** Compact form, for buttons where the spaces would wrap awkwardly. */
  COMPACT: '+971502057209',
} as const;

export const WHATSAPP_URL = (prefill?: string) =>
  `https://wa.me/${PHONE.E164}${prefill ? `?text=${encodeURIComponent(prefill)}` : ''}`;

export const TEL_HREF = `tel:+${PHONE.E164}`;
