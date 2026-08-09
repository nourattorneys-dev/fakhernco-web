import type { Locale } from '@/lib/locale';
import { t } from '@/lib/ui';
import { WHATSAPP_URL } from '@/lib/contact';

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
      {/*
        Inlined rather than fetched: the CSP on this site blocks external
        hosts, and an icon that arrives after paint defeats the point of a
        button whose whole job is to be immediately visible.
      */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        className="h-7 w-7 fill-current"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.465 3.488" />
      </svg>
    </a>
  );
}
