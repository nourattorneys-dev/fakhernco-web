import type { Locale } from '@/lib/locale';
import { t } from '@/lib/ui';
import { WHATSAPP_URL } from '@/lib/contact';
import { WhatsAppGlyph } from '@/components/icons/WhatsAppGlyph';

/**
 * Floating WhatsApp button.
 *
 * COLOUR
 * WhatsApp brand green, white glyph — the official lockup. This is the one
 * deliberate exception to the site's monochrome palette: the entire value of
 * this control is being recognised without being read, and that recognition
 * lives in this specific green.
 *
 * White on #25D366 is only 2.0:1, below the 3:1 that WCAG 1.4.11 asks of a
 * graphical object. Accepted here because the mark is the brand's own, the
 * link carries a real accessible name, and the focus ring is drawn in ink
 * rather than white so it stays visible against the green. The header's
 * WhatsApp button makes the opposite trade — it contains a phone number that
 * has to be read, so it puts ink on the green instead.
 *
 * POSITIONING
 * `end-*` rather than `right-*`, so it sits bottom-right in English and
 * bottom-left in Arabic — the near-thumb corner in each reading direction.
 *
 * The safe-area inset is on the BOTTOM only. That is the one that matters: a
 * bottom-anchored control otherwise sits under the iOS home indicator. Pairing
 * a logical `end` with a physical `env(safe-area-inset-right)` would have been
 * wrong in Arabic, where `end` resolves to the left edge.
 *
 * No JavaScript: it is a link, so it works before hydration and is crawlable.
 */
export function WhatsAppButton({ locale = 'en' }: { locale?: Locale }) {
  const s = t(locale);

  return (
    <a
      href={WHATSAPP_URL(s.whatsappPrefill)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={s.whatsappLabel}
      title={s.whatsappLabel}
      className="
        group fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] end-5 z-40
        flex h-14 w-14 items-center justify-center rounded-full
        bg-whatsapp text-white shadow-lg shadow-black/25
        transition-[background-color,transform] duration-200
        hover:bg-whatsapp-dark hover:scale-105
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink
        motion-reduce:transition-none motion-reduce:hover:scale-100
      "
    >
      <WhatsAppGlyph className="h-7 w-7" />
    </a>
  );
}
